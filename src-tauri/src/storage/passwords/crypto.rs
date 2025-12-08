use aes_gcm::{
    aead::{Aead, KeyInit, OsRng},
    Aes256Gcm, Nonce,
};
use argon2::{password_hash::SaltString, Argon2, PasswordHasher};
use base64::{engine::general_purpose::STANDARD as BASE64, Engine};
use rand::RngCore;
pub fn derive_key(master_password: &str, salt: &[u8]) -> Result<[u8; 32], String> {
    let argon2 = Argon2::default();
    let salt_string = SaltString::encode_b64(salt).map_err(|e| e.to_string())?;

    let hash = argon2
        .hash_password(master_password.as_bytes(), &salt_string)
        .map_err(|e| e.to_string())?;

    let hash_output = hash.hash.ok_or("Failed to get hash output")?;
    let hash_bytes = hash_output.as_bytes();

    let mut key = [0u8; 32];
    key.copy_from_slice(&hash_bytes[..32]);
    Ok(key)
}
pub fn encrypt_password(password: &str, key: &[u8; 32]) -> Result<(String, String), String> {
    let cipher = Aes256Gcm::new_from_slice(key).map_err(|e| e.to_string())?;

    let mut nonce_bytes = [0u8; 12];
    OsRng.fill_bytes(&mut nonce_bytes);
    let nonce = Nonce::from_slice(&nonce_bytes);

    let ciphertext = cipher
        .encrypt(nonce, password.as_bytes())
        .map_err(|e| e.to_string())?;

    Ok((BASE64.encode(&ciphertext), BASE64.encode(&nonce_bytes)))
}
pub fn decrypt_password(encrypted: &str, nonce_b64: &str, key: &[u8; 32]) -> Result<String, String> {
    let cipher = Aes256Gcm::new_from_slice(key).map_err(|e| e.to_string())?;

    let ciphertext = BASE64.decode(encrypted).map_err(|e| e.to_string())?;
    let nonce_bytes = BASE64.decode(nonce_b64).map_err(|e| e.to_string())?;
    let nonce = Nonce::from_slice(&nonce_bytes);

    let plaintext = cipher
        .decrypt(nonce, ciphertext.as_ref())
        .map_err(|_| "Decryption failed - invalid key or corrupted data")?;

    String::from_utf8(plaintext).map_err(|e| e.to_string())
}
pub fn generate_password(length: usize, include_symbols: bool) -> String {
    let length = length.clamp(8, 128);

    let mut charset: Vec<char> = Vec::new();
    charset.extend('a'..='z');
    charset.extend('A'..='Z');
    charset.extend('0'..='9');

    if include_symbols {
        charset.extend("!@#$%^&*()_+-=[]{}|;:,.<>?".chars());
    }

    let mut password = String::with_capacity(length);
    let mut rng = rand::thread_rng();

    for _ in 0..length {
        let idx = (rng.next_u32() as usize) % charset.len();
        password.push(charset[idx]);
    }

    password
}
