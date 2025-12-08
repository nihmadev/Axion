use crate::storage;

#[tauri::command]
pub async fn get_settings() -> Result<serde_json::Value, String> {
    storage::get_settings().await
}

#[tauri::command]
pub async fn set_settings(settings: serde_json::Value) -> Result<(), String> {
    storage::set_settings(settings).await
}

#[tauri::command]
pub async fn get_bookmarks() -> Result<Vec<storage::Bookmark>, String> {
    storage::get_bookmarks().await
}

#[tauri::command]
pub async fn set_bookmarks(bookmarks: Vec<storage::Bookmark>) -> Result<(), String> {
    storage::set_bookmarks(bookmarks).await
}

#[tauri::command]
pub async fn get_history() -> Result<Vec<storage::HistoryEntry>, String> {
    storage::get_history().await
}

#[tauri::command]
pub async fn add_history(entry: storage::HistoryEntry) -> Result<(), String> {
    storage::add_history(entry).await
}

#[tauri::command]
pub async fn clear_history() -> Result<(), String> {
    storage::clear_history().await
}

#[tauri::command]
pub async fn set_history(history: Vec<storage::HistoryEntry>) -> Result<(), String> {
    storage::set_history(history).await
}
