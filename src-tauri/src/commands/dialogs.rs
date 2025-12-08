use crate::storage;

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
