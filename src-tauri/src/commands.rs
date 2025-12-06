use tauri::Window;
use crate::{AppState, storage, downloads};

// Window commands
#[tauri::command]
pub async fn window_minimize(window: Window) -> Result<(), String> {
    window.minimize().map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn window_maximize(window: Window) -> Result<(), String> {
    if window.is_maximized().unwrap_or(false) {
        window.unmaximize().map_err(|e| e.to_string())
    } else {
        window.maximize().map_err(|e| e.to_string())
    }
}

#[tauri::command]
pub async fn window_close(window: Window) -> Result<(), String> {
    window.close().map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn window_fullscreen(window: Window) -> Result<(), String> {
    use tauri::Emitter;
    let is_fullscreen = window.is_fullscreen().unwrap_or(false);
    window.set_fullscreen(!is_fullscreen).map_err(|e| e.to_string())?;
    window.emit("fullscreen-change", !is_fullscreen).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn is_fullscreen(window: Window) -> Result<bool, String> {
    window.is_fullscreen().map_err(|e| e.to_string())
}

// Settings commands
#[tauri::command]
pub async fn get_settings() -> Result<serde_json::Value, String> {
    storage::get_settings().await
}

#[tauri::command]
pub async fn set_settings(settings: serde_json::Value) -> Result<(), String> {
    storage::set_settings(settings).await
}

// Bookmarks commands
#[tauri::command]
pub async fn get_bookmarks() -> Result<Vec<storage::Bookmark>, String> {
    storage::get_bookmarks().await
}

#[tauri::command]
pub async fn set_bookmarks(bookmarks: Vec<storage::Bookmark>) -> Result<(), String> {
    storage::set_bookmarks(bookmarks).await
}

// History commands
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

// External commands
#[tauri::command]
pub async fn open_external(app: tauri::AppHandle, url: String) -> Result<(), String> {
    use tauri_plugin_opener::OpenerExt;
    app.opener().open_url(&url, None::<&str>).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn show_save_dialog(app: tauri::AppHandle, options: serde_json::Value) -> Result<Option<String>, String> {
    use tauri_plugin_dialog::DialogExt;
    
    let mut builder = app.dialog().file();
    
    if let Some(title) = options.get("title").and_then(|v| v.as_str()) {
        builder = builder.set_title(title);
    }
    
    if let Some(default_path) = options.get("defaultPath").and_then(|v| v.as_str()) {
        builder = builder.set_file_name(default_path);
    }
    
    let path = builder.blocking_save_file();
    Ok(path.and_then(|p| p.as_path().map(|path| path.to_string_lossy().to_string())))
}

#[tauri::command]
pub async fn show_error(app: tauri::AppHandle, title: String, message: String) -> Result<(), String> {
    use tauri_plugin_dialog::{DialogExt, MessageDialogKind};
    
    app.dialog()
        .message(message)
        .title(title)
        .kind(MessageDialogKind::Error)
        .blocking_show();
    
    Ok(())
}

// Export/Import bookmarks
#[tauri::command]
pub async fn export_bookmarks(app: tauri::AppHandle, bookmarks: Vec<storage::Bookmark>) -> Result<bool, String> {
    use tauri_plugin_dialog::DialogExt;
    
    let path = app.dialog()
        .file()
        .set_title("Экспорт закладок")
        .set_file_name("bookmarks.json")
        .add_filter("JSON", &["json"])
        .blocking_save_file();
    
    if let Some(file_path) = path {
        if let Some(path) = file_path.as_path() {
            let json = serde_json::to_string_pretty(&bookmarks).map_err(|e| e.to_string())?;
            std::fs::write(path, json).map_err(|e| e.to_string())?;
            Ok(true)
        } else {
            Ok(false)
        }
    } else {
        Ok(false)
    }
}

#[tauri::command]
pub async fn import_bookmarks(app: tauri::AppHandle) -> Result<Option<Vec<storage::Bookmark>>, String> {
    use tauri_plugin_dialog::DialogExt;
    
    let path = app.dialog()
        .file()
        .set_title("Импорт закладок")
        .add_filter("JSON", &["json"])
        .blocking_pick_file();
    
    if let Some(file_path) = path {
        if let Some(path) = file_path.as_path() {
            let content = std::fs::read_to_string(path).map_err(|e| e.to_string())?;
            let bookmarks: Vec<storage::Bookmark> = serde_json::from_str(&content).map_err(|e| e.to_string())?;
            Ok(Some(bookmarks))
        } else {
            Ok(None)
        }
    } else {
        Ok(None)
    }
}

// Tab freezing commands
#[tauri::command]
pub async fn freeze_tab(state: tauri::State<'_, AppState>, tab_id: String) -> Result<bool, String> {
    let mut frozen_tabs = state.frozen_tabs.lock().map_err(|e| e.to_string())?;
    frozen_tabs.insert(tab_id);
    Ok(true)
}

#[tauri::command]
pub async fn unfreeze_tab(state: tauri::State<'_, AppState>, tab_id: String) -> Result<bool, String> {
    let mut frozen_tabs = state.frozen_tabs.lock().map_err(|e| e.to_string())?;
    frozen_tabs.remove(&tab_id);
    Ok(true)
}

#[tauri::command]
pub async fn is_tab_frozen(state: tauri::State<'_, AppState>, tab_id: String) -> Result<bool, String> {
    let frozen_tabs = state.frozen_tabs.lock().map_err(|e| e.to_string())?;
    Ok(frozen_tabs.contains(&tab_id))
}

// Downloads commands
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
pub async fn pause_download(_app: tauri::AppHandle, _id: String) -> Result<(), String> {
    // TODO: Реализовать паузу (требует поддержки Range запросов)
    Ok(())
}

#[tauri::command]
pub async fn resume_download(_app: tauri::AppHandle, _id: String) -> Result<(), String> {
    // TODO: Реализовать возобновление
    Ok(())
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

// Browser import
#[tauri::command]
pub async fn import_from_browser(browser: String) -> Result<Option<storage::ImportResult>, String> {
    storage::import_from_browser(&browser).await
}

#[tauri::command]
pub async fn detect_browsers() -> Result<Vec<storage::DetectedBrowser>, String> {
    storage::detect_browsers().await
}

// First launch detection
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

// Session commands
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

