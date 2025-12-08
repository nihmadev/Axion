mod crypto;
mod operations;
mod types;
mod vault;

pub use types::{DecryptedPasswordEntry, PasswordEntry};

pub use crypto::generate_password;

pub use vault::{
    change_master_password, create_vault, delete_vault, get_remaining_attempts, is_vault_unlocked,
    lock_vault, unlock_vault, vault_exists,
};

pub use operations::{add_password, delete_password, get_passwords, get_passwords_for_url, search_passwords, update_password};
