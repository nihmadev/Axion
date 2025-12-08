use crate::storage;

#[tauri::command]
pub async fn import_from_browser(browser: String) -> Result<Option<storage::ImportResult>, String> {
    storage::import_from_browser(&browser).await
}

#[tauri::command]
pub async fn detect_browsers() -> Result<Vec<storage::DetectedBrowser>, String> {
    storage::detect_browsers().await
}

#[tauri::command]
pub async fn is_first_launch() -> Result<bool, String> {
    let data_dir = storage::get_data_dir()?;
    let marker_file = data_dir.join(".initialized");
    Ok(!marker_file.exists())
}

#[tauri::command]
pub async fn mark_initialized() -> Result<(), String> {
    let data_dir = storage::ensure_data_dir()?;
    let marker_file = data_dir.join(".initialized");
    std::fs::write(&marker_file, "1").map_err(|e| e.to_string())
}
