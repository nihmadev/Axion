use crate::downloads;

#[tauri::command]
pub async fn get_downloads() -> Result<Vec<downloads::Download>, String> {
    downloads::get_downloads().await
}

#[tauri::command]
pub async fn start_download(
    app: tauri::AppHandle,
    url: String,
    filename: Option<String>,
) -> Result<downloads::Download, String> {
    downloads::start_download(app, url, filename).await
}

#[tauri::command]
pub async fn cancel_download(app: tauri::AppHandle, id: String) -> Result<(), String> {
    downloads::cancel_download_by_id(&app, &id).await
}

#[tauri::command]
pub async fn open_download(app: tauri::AppHandle, path: String) -> Result<(), String> {
    use tauri_plugin_opener::OpenerExt;
    app.opener().open_path(&path, None::<&str>).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn show_download_in_folder(_app: tauri::AppHandle, path: String) -> Result<(), String> {
    #[cfg(target_os = "windows")]
    {
        std::process::Command::new("explorer")
            .args(["/select,", &path])
            .spawn()
            .map_err(|e| e.to_string())?;
    }
    
    #[cfg(target_os = "macos")]
    {
        std::process::Command::new("open")
            .args(["-R", &path])
            .spawn()
            .map_err(|e| e.to_string())?;
    }
    
    #[cfg(target_os = "linux")]
    {
        use tauri_plugin_opener::OpenerExt;
        if let Some(parent) = std::path::Path::new(&path).parent() {
            _app.opener()
                .open_url(parent.to_string_lossy().as_ref(), None::<&str>)
                .map_err(|e| e.to_string())?;
        }
    }
    
    Ok(())
}

#[tauri::command]
pub async fn clear_completed_downloads() -> Result<(), String> {
    downloads::clear_completed().await
}

#[tauri::command]
pub async fn get_downloads_folder() -> Result<String, String> {
    dirs::download_dir()
        .map(|p| p.to_string_lossy().to_string())
        .ok_or_else(|| "Could not find downloads directory".to_string())
}
