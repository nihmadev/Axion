use super::crypto::{decrypt_password, derive_key, encrypt_password};
use super::types::{PasswordVault, VaultMetadata, MAX_FAILED_ATTEMPTS};
use crate::storage::ensure_data_dir;
use aes_gcm::aead::OsRng;
use base64::{engine::general_purpose::STANDARD as BASE64, Engine};
use rand::RngCore;
use std::sync::Mutex;
use zeroize::Zeroize;

/// In-memory derived key (cleared on lock)
pub static DERIVED_KEY: Mutex<Option<[u8; 32]>> = Mutex::new(None);

/// Get vault file path
pub fn get_vault_path() -> Result<std::path::PathBuf, String> {
    Ok(ensure_data_dir()?.join("passwords.vault"))
}

/// Load vault from disk
pub fn load_vault() -> Result<Option<PasswordVault>, String> {
    let path = get_vault_path()?;

    if !path.exists() {
        return Ok(None);
    }

    let content = std::fs::read_to_string(&path).map_err(|e| e.to_string())?;
    let vault: PasswordVault = serde_json::from_str(&content).map_err(|e| e.to_string())?;

    Ok(Some(vault))
}

/// Save vault to disk
pub fn save_vault(vault: &PasswordVault) -> Result<(), String> {
    let path = get_vault_path()?;
    let content = serde_json::to_string_pretty(vault).map_err(|e| e.to_string())?;
    std::fs::write(&path, content).map_err(|e| e.to_string())?;
    Ok(())
}

/// Check if vault exists
pub fn vault_exists() -> Result<bool, String> {
    let path = get_vault_path()?;
    Ok(path.exists())
}

/// Check if vault is unlocked
pub fn is_vault_unlocked() -> bool {
    DERIVED_KEY.lock().unwrap().is_some()
}

/// Create a new password vault with master password
pub fn create_vault(master_password: &str) -> Result<bool, String> {
    if master_password.len() < 8 {
        return Err("Master password must be at least 8 characters".to_string());
    }

    if vault_exists()? {
        return Err("Vault already exists".to_string());
    }

    // Generate random salt
    let mut salt = [0u8; 16];
    OsRng.fill_bytes(&mut salt);

    // Derive key
    let key = derive_key(master_password, &salt)?;

    // Create verification hash (encrypt a known string)
    let (verification_hash, verification_nonce) =
        encrypt_password("AXION_VAULT_VERIFICATION", &key)?;

    let vault = PasswordVault {
        metadata: VaultMetadata {
            salt: BASE64.encode(&salt),
            verification_hash,
            verification_nonce,
            failed_attempts: 0,
        },
        entries: Vec::new(),
    };

    save_vault(&vault)?;

    // Store key in memory
    *DERIVED_KEY.lock().unwrap() = Some(key);

    Ok(true)
}

/// Unlock vault with master password
pub fn unlock_vault(master_password: &str) -> Result<bool, String> {
    let mut vault = load_vault()?.ok_or("Vault does not exist")?;

    // Check if max attempts reached
    if vault.metadata.failed_attempts >= MAX_FAILED_ATTEMPTS {
        delete_vault()?;
        return Err("Too many failed attempts. Vault has been deleted for security.".to_string());
    }

    // Decode salt
    let salt = BASE64
        .decode(&vault.metadata.salt)
        .map_err(|e| e.to_string())?;

    // Derive key
    let key = derive_key(master_password, &salt)?;

    // Verify by decrypting the verification string
    // If the password is wrong, decryption will fail with AES-GCM authentication error
    let verification_nonce = if vault.metadata.verification_nonce.is_empty() {
        // Legacy vault without nonce - cannot properly verify, reject
        return Err("Invalid vault format - please recreate the vault".to_string());
    } else {
        &vault.metadata.verification_nonce
    };

    let decrypted = decrypt_password(&vault.metadata.verification_hash, verification_nonce, &key);

    match decrypted {
        Ok(ref value) if value == "AXION_VAULT_VERIFICATION" => {
            // Success - reset failed attempts
            if vault.metadata.failed_attempts > 0 {
                vault.metadata.failed_attempts = 0;
                save_vault(&vault)?;
            }

            // Store key in memory
            *DERIVED_KEY.lock().unwrap() = Some(key);
            Ok(true)
        }
        _ => {
            // Failed attempt - increment counter
            vault.metadata.failed_attempts += 1;

            if vault.metadata.failed_attempts >= MAX_FAILED_ATTEMPTS {
                delete_vault()?;
                return Err(
                    "Too many failed attempts. Vault has been deleted for security.".to_string(),
                );
            }

            save_vault(&vault)?;

            let remaining = MAX_FAILED_ATTEMPTS - vault.metadata.failed_attempts;
            Err(format!(
                "Invalid master password. {} attempts remaining.",
                remaining
            ))
        }
    }
}

/// Lock vault (clear key from memory)
pub fn lock_vault() -> Result<bool, String> {
    let mut key_guard = DERIVED_KEY.lock().unwrap();
    if let Some(ref mut key) = *key_guard {
        key.zeroize();
    }
    *key_guard = None;
    Ok(true)
}

/// Delete the vault completely
pub fn delete_vault() -> Result<bool, String> {
    // Clear key from memory
    let mut key_guard = DERIVED_KEY.lock().unwrap();
    if let Some(ref mut key) = *key_guard {
        key.zeroize();
    }
    *key_guard = None;
    drop(key_guard);

    // Delete vault file
    let path = get_vault_path()?;
    if path.exists() {
        std::fs::remove_file(&path).map_err(|e| e.to_string())?;
    }

    Ok(true)
}

/// Get remaining unlock attempts
pub fn get_remaining_attempts() -> Result<u32, String> {
    let vault = load_vault()?;
    match vault {
        Some(v) => Ok(MAX_FAILED_ATTEMPTS.saturating_sub(v.metadata.failed_attempts)),
        None => Ok(MAX_FAILED_ATTEMPTS),
    }
}

/// Change master password
pub fn change_master_password(old_password: &str, new_password: &str) -> Result<bool, String> {
    if new_password.len() < 8 {
        return Err("New master password must be at least 8 characters".to_string());
    }

    // First, unlock with old password to verify
    let mut vault = load_vault()?.ok_or("Vault does not exist")?;
    let old_salt = BASE64
        .decode(&vault.metadata.salt)
        .map_err(|e| e.to_string())?;
    let old_key = derive_key(old_password, &old_salt)?;

    // Decrypt all passwords with old key
    let mut decrypted_entries = Vec::new();
    for entry in &vault.entries {
        let password = decrypt_password(&entry.encrypted_password, &entry.nonce, &old_key)?;
        decrypted_entries.push((entry.clone(), password));
    }

    // Generate new salt and key
    let mut new_salt = [0u8; 16];
    OsRng.fill_bytes(&mut new_salt);
    let new_key = derive_key(new_password, &new_salt)?;

    // Re-encrypt all passwords with new key
    let mut new_entries = Vec::new();
    for (mut entry, password) in decrypted_entries {
        let (encrypted, nonce) = encrypt_password(&password, &new_key)?;
        entry.encrypted_password = encrypted;
        entry.nonce = nonce;
        entry.updated_at = chrono::Utc::now().timestamp_millis();
        new_entries.push(entry);
    }

    // Create new verification hash
    let (verification_hash, verification_nonce) =
        encrypt_password("AXION_VAULT_VERIFICATION", &new_key)?;

    // Update vault
    vault.metadata.salt = BASE64.encode(&new_salt);
    vault.metadata.verification_hash = verification_hash;
    vault.metadata.verification_nonce = verification_nonce;
    vault.metadata.failed_attempts = 0;
    vault.entries = new_entries;

    save_vault(&vault)?;

    // Update in-memory key
    *DERIVED_KEY.lock().unwrap() = Some(new_key);

    Ok(true)
}
