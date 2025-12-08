use serde::{Deserialize, Serialize};
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PasswordEntry {
    pub id: String,
    pub url: String,
    pub username: String,
    pub encrypted_password: String,
    pub nonce: String,
    #[serde(rename = "createdAt")]
    pub created_at: i64,
    #[serde(rename = "updatedAt")]
    pub updated_at: i64,
}
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
pub const MAX_FAILED_ATTEMPTS: u32 = 15;
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VaultMetadata {
    pub salt: String,
    pub verification_hash: String,
    #[serde(default)]
    pub verification_nonce: String,
    #[serde(default)]
    pub failed_attempts: u32,
}
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PasswordVault {
    pub metadata: VaultMetadata,
    pub entries: Vec<PasswordEntry>,
}
