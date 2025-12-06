use serde::{Deserialize, Serialize};

/// Stored password entry (encrypted)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PasswordEntry {
    pub id: String,
    pub url: String,
    pub username: String,
    /// Base64-encoded encrypted password
    pub encrypted_password: String,
    /// Base64-encoded nonce used for encryption
    pub nonce: String,
    #[serde(rename = "createdAt")]
    pub created_at: i64,
    #[serde(rename = "updatedAt")]
    pub updated_at: i64,
}

/// Decrypted password entry for frontend
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DecryptedPasswordEntry {
    pub id: String,
    pub url: String,
    pub username: String,
    pub password: String,
    #[serde(rename = "createdAt")]
    pub created_at: i64,
    #[serde(rename = "updatedAt")]
    pub updated_at: i64,
}

/// Maximum failed unlock attempts before vault is deleted
pub const MAX_FAILED_ATTEMPTS: u32 = 15;

/// Password vault metadata
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VaultMetadata {
    /// Base64-encoded salt for key derivation
    pub salt: String,
    /// Base64-encoded encrypted verification string
    pub verification_hash: String,
    /// Base64-encoded nonce for verification
    #[serde(default)]
    pub verification_nonce: String,
    /// Number of failed unlock attempts
    #[serde(default)]
    pub failed_attempts: u32,
}

/// Password vault file structure
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PasswordVault {
    pub metadata: VaultMetadata,
    pub entries: Vec<PasswordEntry>,
}
