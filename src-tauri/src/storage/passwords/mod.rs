mod crypto;
mod operations;
mod types;
mod vault;

// Re-export types
pub use types::{DecryptedPasswordEntry, PasswordEntry};

// Re-export crypto
pub use crypto::generate_password;

// Re-export vault operations
pub use vault::{
    change_master_password, create_vault, delete_vault, get_remaining_attempts, is_vault_unlocked,
    lock_vault, unlock_vault, vault_exists,
};

// Re-export password operations
pub use operations::{add_password, delete_password, get_passwords, search_passwords, update_password};
