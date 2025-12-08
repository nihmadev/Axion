use std::path::PathBuf;
use tauri::{AppHandle, Emitter, Manager};

use super::types::Download;
use super::storage::{get_downloads, save_downloads};
use super::utils::{get_downloads_dir, extract_filename, get_unique_filename};
pub async fn start_download(
    app: AppHandle,
    url: String,
    suggested_filename: Option<String>,
) -> Result<Download, String> {
    let download_id = format!("dl_{}", uuid::Uuid::new_v4().to_string().replace("-", "")[..12].to_string());
    let downloads_dir = get_downloads_dir()?;
    
    let client = reqwest::Client::builder()
        .user_agent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36")
        .build()
        .map_err(|e| e.to_string())?;
    
    let head_response = client.head(&url).send().await;
    
    let (total_bytes, content_disposition, mime_type) = match head_response {
        Ok(resp) => {
            let headers = resp.headers();
            let size = headers.get("content-length")
                .and_then(|v| v.to_str().ok())
                .and_then(|s| s.parse::<i64>().ok())
                .unwrap_or(-1);
            let cd = headers.get("content-disposition")
                .and_then(|v| v.to_str().ok())
                .map(|s| s.to_string());
            let mime = headers.get("content-type")
                .and_then(|v| v.to_str().ok())
                .map(|s| s.split(';').next().unwrap_or(s).trim().to_string());
            (size, cd, mime)
        }
        Err(_) => (-1, None, None),
    };
    
    let filename = suggested_filename.unwrap_or_else(|| {
        extract_filename(&url, content_disposition.as_deref())
    });
    let unique_filename = get_unique_filename(&downloads_dir, &filename);
    let save_path = downloads_dir.join(&unique_filename);
    
    let download = Download {
        id: download_id.clone(),
        filename: unique_filename.clone(),
        url: url.clone(),
        total_bytes,
        received_bytes: 0,
        state: "progressing".to_string(),
        start_time: chrono::Utc::now().timestamp_millis(),
        save_path: Some(save_path.to_string_lossy().to_string()),
        speed: 0,
        mime_type,
    };
    
    let _ = app.emit("download-started", &download);
    let _ = app.emit("download-update", &download);
    
    let mut downloads = get_downloads().await.unwrap_or_default();
    downloads.insert(0, download.clone());
    let _ = save_downloads(downloads).await;
    
    let (cancel_tx, mut cancel_rx) = tokio::sync::watch::channel(false);
    
    {
        let state = app.state::<crate::AppState>();
        if let Ok(mut manager) = state.download_manager.lock() {
            manager.cancel_senders.insert(download_id.clone(), cancel_tx);
        };
    }
    
    let app_clone = app.clone();
    let download_id_clone = download_id.clone();
    let url_clone = url.clone();
    let save_path_clone = save_path.clone();
    
    tokio::spawn(async move {
        let result = download_file(
            app_clone.clone(),
            download_id_clone.clone(),
            url_clone,
            save_path_clone.clone(),
            total_bytes,
            &mut cancel_rx,
        ).await;
        
        {
            let state = app_clone.state::<crate::AppState>();
            if let Ok(mut manager) = state.download_manager.lock() {
                manager.cancel_senders.remove(&download_id_clone);
            };
        }
        
        let (final_state, final_bytes) = match &result {
            Ok(bytes) => ("completed", *bytes),
            Err(e) if e.contains("cancelled") => ("cancelled", 0),
            Err(_) => ("interrupted", 0),
        };
        
        if let Ok(mut downloads) = get_downloads().await {
            if let Some(dl) = downloads.iter_mut().find(|d| d.id == download_id_clone) {
                dl.state = final_state.to_string();
                if final_state == "completed" {
                    dl.received_bytes = final_bytes;
                    dl.total_bytes = final_bytes;
                    dl.speed = 0;
                }
                let _ = app_clone.emit("download-progress", dl.clone());
                let _ = app_clone.emit("download-update", dl.clone());
                let _ = app_clone.emit("download-completed", dl.clone());
            }
            let _ = save_downloads(downloads).await;
        }
    });
    
    Ok(download)
}
async fn download_file(
    app: AppHandle,
    download_id: String,
    url: String,
    save_path: PathBuf,
    total_bytes: i64,
    cancel_rx: &mut tokio::sync::watch::Receiver<bool>,
) -> Result<i64, String> {
    use tokio::io::AsyncWriteExt;
    use futures_util::StreamExt;
    
    let client = reqwest::Client::builder()
        .user_agent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36")
        .build()
        .map_err(|e| e.to_string())?;
    
    let response = client.get(&url).send().await.map_err(|e| e.to_string())?;
    
    if !response.status().is_success() {
        return Err(format!("HTTP error: {}", response.status()));
    }
    
    let actual_total_bytes = response.headers()
        .get("content-length")
        .and_then(|v| v.to_str().ok())
        .and_then(|s| s.parse::<i64>().ok())
        .unwrap_or(total_bytes);
    
    let total_bytes = if total_bytes <= 0 && actual_total_bytes > 0 {
        if let Ok(mut downloads) = get_downloads().await {
            if let Some(dl) = downloads.iter_mut().find(|d| d.id == download_id) {
                dl.total_bytes = actual_total_bytes;
                let _ = app.emit("download-progress", dl.clone());
                let _ = app.emit("download-update", dl.clone());
                let _ = save_downloads(downloads.clone()).await;
            }
        }
        actual_total_bytes
    } else {
        total_bytes
    };
    
    let mut file = tokio::fs::File::create(&save_path).await.map_err(|e| e.to_string())?;
    let mut stream = response.bytes_stream();
    
    let mut received_bytes: i64 = 0;
    let mut last_update = std::time::Instant::now();
    let mut last_bytes = 0i64;
    let update_interval = std::time::Duration::from_millis(250);
    
    let mut first_update_sent = false;
    
    while let Some(chunk_result) = stream.next().await {
        if *cancel_rx.borrow() {
            let _ = tokio::fs::remove_file(&save_path).await;
            return Err("Download cancelled".to_string());
        }
        
        let chunk = chunk_result.map_err(|e| e.to_string())?;
        file.write_all(&chunk).await.map_err(|e| e.to_string())?;
        received_bytes += chunk.len() as i64;
        
        let now = std::time::Instant::now();
        let should_update = !first_update_sent || now.duration_since(last_update) >= update_interval;
        
        if should_update {
            let elapsed = now.duration_since(last_update).as_secs_f64();
            let bytes_diff = received_bytes - last_bytes;
            let speed = if elapsed > 0.0 { (bytes_diff as f64 / elapsed) as i64 } else { 0 };
            
            let effective_total = if total_bytes > 0 { total_bytes } else { received_bytes };
            
            if let Ok(mut downloads) = get_downloads().await {
                if let Some(dl) = downloads.iter_mut().find(|d| d.id == download_id) {
                    dl.received_bytes = received_bytes;
                    dl.total_bytes = effective_total;
                    dl.speed = speed;
                    let _ = app.emit("download-progress", dl.clone());
                    let _ = app.emit("download-update", dl.clone());
                    let _ = save_downloads(downloads.clone()).await;
                }
            }
            
            last_update = now;
            last_bytes = received_bytes;
            first_update_sent = true;
        }
    }
    
    file.flush().await.map_err(|e| e.to_string())?;
    
    Ok(received_bytes)
}
pub async fn cancel_download_by_id(app: &AppHandle, id: &str) -> Result<(), String> {
    {
        let state = app.state::<crate::AppState>();
        if let Ok(manager) = state.download_manager.lock() {
            if let Some(tx) = manager.cancel_senders.get(id) {
                let _ = tx.send(true);
            }
        };
    }
    
    if let Ok(mut downloads) = get_downloads().await {
        if let Some(dl) = downloads.iter_mut().find(|d| d.id == id) {
            dl.state = "cancelled".to_string();
            let _ = app.emit("download-update", dl.clone());
        }
        let _ = save_downloads(downloads).await;
    }
    
    Ok(())
}
