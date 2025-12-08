use crate::storage;

#[tauri::command]
pub async fn save_session(session_data: serde_json::Value) -> Result<bool, String> {
    storage::save_session(session_data).await
}

#[tauri::command]
pub async fn restore_session() -> Result<Option<serde_json::Value>, String> {
    storage::restore_session().await
}

#[tauri::command]
pub async fn clear_session() -> Result<bool, String> {
    storage::clear_session().await
}
