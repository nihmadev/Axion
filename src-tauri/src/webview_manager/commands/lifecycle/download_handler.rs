use tauri::{AppHandle, Emitter, Manager};
use tauri::webview::DownloadEvent;
use std::path::PathBuf;
use crate::webview_manager::polling::extract_filename_from_url;
use super::utils::get_filename_from_headers;

pub fn handle_download(app_download: AppHandle) -> impl Fn(tauri::Webview<tauri::Wry>, DownloadEvent) -> bool + Send + Sync + 'static {
    move |_webview, event| {
        match event {
            DownloadEvent::Requested { url, destination } => {
                handle_download_requested(&app_download, url, destination)
            }
            DownloadEvent::Finished { url, path, success } => {
                handle_download_finished(&app_download, url, path, success)
            }
            _ => true,
        }
    }
}

fn handle_download_requested(
    app_download: &AppHandle,
    url: url::Url,
    destination: &mut PathBuf,
) -> bool {
    let url_str = url.to_string();
    
    let downloads_dir = dirs::download_dir()
        .unwrap_or_else(|| PathBuf::from("."));
    
    let filename = get_filename_from_headers(&url_str)
        .unwrap_or_else(|| extract_filename_from_url(&url_str));
    
    let filename = crate::downloads::utils::get_unique_filename(&downloads_dir, &filename);
    let save_path = downloads_dir.join(&filename);
    
    *destination = save_path.clone();
    
    let download_id = format!("dl_{}", uuid::Uuid::new_v4().to_string().replace("-", "")[..12].to_string());
    
    let download = serde_json::json!({
        "id": download_id,
        "filename": filename,
        "url": url_str,
        "totalBytes": -1,
        "receivedBytes": 0,
        "state": "progressing",
        "startTime": chrono::Utc::now().timestamp_millis(),
        "savePath": save_path.to_string_lossy().to_string(),
        "speed": 0,
        "mimeType": serde_json::Value::Null
    });
    
    let _ = app_download.emit("download-started", &download);
    let _ = app_download.emit("download-update", &download);
    
    let dl = crate::downloads::Download {
        id: download_id.clone(),
        filename: filename.clone(),
        url: url_str.clone(),
        total_bytes: -1,
        received_bytes: 0,
        state: "progressing".to_string(),
        start_time: chrono::Utc::now().timestamp_millis(),
        save_path: Some(save_path.to_string_lossy().to_string()),
        speed: 0,
        mime_type: None,
    };
    
    {
        let state = app_download.state::<crate::AppState>();
        if let Ok(mut downloads) = state.downloads.lock() {
            downloads.insert(url_str.clone(), dl.clone());
        };
    }
    
    let dl_for_save = dl.clone();
    tauri::async_runtime::spawn(async move {
        if let Ok(mut downloads) = crate::downloads::get_downloads().await {
            downloads.insert(0, dl_for_save);
            let _ = crate::downloads::save_downloads(downloads).await;
        }
    });
    
    true
}

fn handle_download_finished(
    app_download: &AppHandle,
    url: url::Url,
    path: Option<PathBuf>,
    success: bool,
) -> bool {
    let url_str = url.to_string();
    
    let download_info = {
        let state = app_download.state::<crate::AppState>();
        let result = if let Ok(mut downloads) = state.downloads.lock() {
            downloads.remove(&url_str)
        } else {
            None
        };
        result
    };
    
    if let Some(mut dl) = download_info {
        dl.state = if success { "completed".to_string() } else { "interrupted".to_string() };
        
        if success {
            if let Some(ref p) = path {
                if let Ok(metadata) = std::fs::metadata(p) {
                    dl.total_bytes = metadata.len() as i64;
                    dl.received_bytes = metadata.len() as i64;
                }
            }
        }
        
        let _ = app_download.emit("download-update", &dl);
        let _ = app_download.emit("download-completed", &dl);
        
        let dl_clone = dl.clone();
        tauri::async_runtime::spawn(async move {
            if let Ok(mut downloads) = crate::downloads::get_downloads().await {
                if !downloads.iter().any(|d| d.id == dl_clone.id) {
                    downloads.insert(0, dl_clone);
                    let _ = crate::downloads::save_downloads(downloads).await;
                } else {
                    if let Some(existing) = downloads.iter_mut().find(|d| d.id == dl_clone.id) {
                        *existing = dl_clone;
                    }
                    let _ = crate::downloads::save_downloads(downloads).await;
                }
            }
        });
    }
    
    true
}
