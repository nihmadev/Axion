use super::crypto::{decrypt_password, encrypt_password};
use super::types::{DecryptedPasswordEntry, PasswordEntry};
use super::vault::{load_vault, save_vault, DERIVED_KEY};

/// Get all passwords (decrypted)
pub fn get_passwords() -> Result<Vec<DecryptedPasswordEntry>, String> {
    let key = DERIVED_KEY.lock().unwrap().ok_or("Vault is locked")?;

    let vault = load_vault()?.ok_or("Vault does not exist")?;

    let mut decrypted = Vec::new();
    for entry in vault.entries {
        let password = decrypt_password(&entry.encrypted_password, &entry.nonce, &key)?;
        decrypted.push(DecryptedPasswordEntry {
            id: entry.id,
            url: entry.url,
            username: entry.username,
            password,
            created_at: entry.created_at,
            updated_at: entry.updated_at,
        });
    }

    Ok(decrypted)
}

/// Add a new password
pub fn add_password(
    url: String,
    username: String,
    password: String,
) -> Result<PasswordEntry, String> {
    let key = DERIVED_KEY.lock().unwrap().ok_or("Vault is locked")?;

    let mut vault = load_vault()?.ok_or("Vault does not exist")?;

    let (encrypted_password, nonce) = encrypt_password(&password, &key)?;
    let now = chrono::Utc::now().timestamp_millis();

    let entry = PasswordEntry {
        id: uuid::Uuid::new_v4().to_string(),
        url,
        username,
        encrypted_password,
        nonce,
        created_at: now,
        updated_at: now,
    };

    vault.entries.push(entry.clone());
    save_vault(&vault)?;

    Ok(entry)
}

/// Update an existing password
pub fn update_password(
    id: String,
    url: Option<String>,
    username: Option<String>,
    password: Option<String>,
) -> Result<PasswordEntry, String> {
    let key = DERIVED_KEY.lock().unwrap().ok_or("Vault is locked")?;

    let mut vault = load_vault()?.ok_or("Vault does not exist")?;

    let entry = vault
        .entries
        .iter_mut()
        .find(|e| e.id == id)
        .ok_or("Password entry not found")?;

    if let Some(new_url) = url {
        entry.url = new_url;
    }

    if let Some(new_username) = username {
        entry.username = new_username;
    }

    if let Some(new_password) = password {
        let (encrypted, nonce) = encrypt_password(&new_password, &key)?;
        entry.encrypted_password = encrypted;
        entry.nonce = nonce;
    }

    entry.updated_at = chrono::Utc::now().timestamp_millis();

    let updated_entry = entry.clone();
    save_vault(&vault)?;

    Ok(updated_entry)
}

/// Delete a password
pub fn delete_password(id: String) -> Result<bool, String> {
    let _key = DERIVED_KEY.lock().unwrap().ok_or("Vault is locked")?;

    let mut vault = load_vault()?.ok_or("Vault does not exist")?;

    let initial_len = vault.entries.len();
    vault.entries.retain(|e| e.id != id);

    if vault.entries.len() == initial_len {
        return Err("Password entry not found".to_string());
    }

    save_vault(&vault)?;

    Ok(true)
}

/// Search passwords by URL
pub fn search_passwords(query: String) -> Result<Vec<DecryptedPasswordEntry>, String> {
    let passwords = get_passwords()?;
    let query_lower = query.to_lowercase();

    Ok(passwords
        .into_iter()
        .filter(|p| {
            p.url.to_lowercase().contains(&query_lower)
                || p.username.to_lowercase().contains(&query_lower)
        })
        .collect())
}
