use crate::storage;

#[tauri::command]
pub fn vault_exists() -> Result<bool, String> {
    storage::vault_exists()
}

#[tauri::command]
pub fn is_vault_unlocked() -> bool {
    storage::is_vault_unlocked()
}

#[tauri::command]
pub fn create_vault(master_password: String) -> Result<bool, String> {
    storage::create_vault(&master_password)
}

#[tauri::command]
pub fn unlock_vault(master_password: String) -> Result<bool, String> {
    storage::unlock_vault(&master_password)
}

#[tauri::command]
pub fn lock_vault() -> Result<bool, String> {
    storage::lock_vault()
}

#[tauri::command]
pub fn get_passwords() -> Result<Vec<storage::DecryptedPasswordEntry>, String> {
    storage::get_passwords()
}

#[tauri::command]
pub fn add_password(url: String, username: String, password: String) -> Result<storage::PasswordEntry, String> {
    storage::add_password(url, username, password)
}

#[tauri::command]
pub fn update_password(id: String, url: Option<String>, username: Option<String>, password: Option<String>) -> Result<storage::PasswordEntry, String> {
    storage::update_password(id, url, username, password)
}

#[tauri::command]
pub fn delete_password(id: String) -> Result<bool, String> {
    storage::delete_password(id)
}

#[tauri::command]
pub fn search_passwords(query: String) -> Result<Vec<storage::DecryptedPasswordEntry>, String> {
    storage::search_passwords(query)
}

#[tauri::command]
pub fn change_master_password(old_password: String, new_password: String) -> Result<bool, String> {
    storage::change_master_password(&old_password, &new_password)
}

#[tauri::command]
pub fn generate_password(length: usize, include_symbols: bool) -> String {
    storage::generate_password(length, include_symbols)
}

#[tauri::command]
pub fn delete_vault() -> Result<bool, String> {
    storage::delete_vault()
}

#[tauri::command]
pub fn get_remaining_attempts() -> Result<u32, String> {
    storage::get_remaining_attempts()
}

#[tauri::command]
pub fn get_passwords_for_url(url: String) -> Result<Vec<storage::DecryptedPasswordEntry>, String> {
    storage::get_passwords_for_url(url)
}
