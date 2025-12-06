use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use std::collections::HashMap;
use tauri::{AppHandle, Emitter, Manager};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Download {
    pub id: String,
    pub filename: String,
    pub url: String,
    #[serde(rename = "totalBytes")]
    pub total_bytes: i64,
    #[serde(rename = "receivedBytes")]
    pub received_bytes: i64,
    pub state: String,
    #[serde(rename = "startTime")]
    pub start_time: i64,
    #[serde(rename = "savePath")]
    pub save_path: Option<String>,
    #[serde(rename = "speed", default)]
    pub speed: i64,
    #[serde(rename = "mimeType", default)]
    pub mime_type: Option<String>,
}

/// Менеджер активных загрузок
pub struct DownloadManager {
    pub cancel_senders: HashMap<String, tokio::sync::watch::Sender<bool>>,
}

impl DownloadManager {
    pub fn new() -> Self {
        Self {
            cancel_senders: HashMap::new(),
        }
    }
}

fn get_downloads_dir() -> Result<PathBuf, String> {
    // Используем стандартную папку Загрузки
    dirs::download_dir()
        .ok_or_else(|| "Could not find downloads directory".to_string())
}

fn get_downloads_file() -> Result<PathBuf, String> {
    let data_dir = dirs::data_dir()
        .ok_or_else(|| "Could not find data directory".to_string())?
        .join("axion-browser");
    
    std::fs::create_dir_all(&data_dir).map_err(|e| e.to_string())?;
    
    Ok(data_dir.join("downloads.json"))
}

pub async fn get_downloads() -> Result<Vec<Download>, String> {
    let path = get_downloads_file()?;
    
    if !path.exists() {
        return Ok(Vec::new());
    }
    
    let content = tokio::fs::read_to_string(path)
        .await
        .map_err(|e| e.to_string())?;
    
    serde_json::from_str(&content).map_err(|e| e.to_string())
}

pub async fn save_downloads(downloads: Vec<Download>) -> Result<(), String> {
    let path = get_downloads_file()?;
    let content = serde_json::to_string_pretty(&downloads).map_err(|e| e.to_string())?;
    
    tokio::fs::write(path, content)
        .await
        .map_err(|e| e.to_string())
}

pub async fn clear_completed() -> Result<(), String> {
    let path = get_downloads_file()?;
    
    if path.exists() {
        // Читаем текущие загрузки и оставляем только активные
        let downloads = get_downloads().await.unwrap_or_default();
        let active: Vec<Download> = downloads.into_iter()
            .filter(|d| d.state == "progressing")
            .collect();
        
        if active.is_empty() {
            tokio::fs::remove_file(path)
                .await
                .map_err(|e| e.to_string())?;
        } else {
            save_downloads(active).await?;
        }
    }
    
    Ok(())
}

/// Извлечь имя файла из URL или Content-Disposition
fn extract_filename(url: &str, content_disposition: Option<&str>) -> String {
    // Сначала пробуем Content-Disposition
    if let Some(cd) = content_disposition {
        // filename="example.pdf" или filename*=UTF-8''example.pdf
        if let Some(start) = cd.find("filename=") {
            let rest = &cd[start + 9..];
            let filename = if rest.starts_with('"') {
                rest[1..].split('"').next().unwrap_or("download")
            } else {
                rest.split(';').next().unwrap_or("download").trim()
            };
            if !filename.is_empty() {
                return filename.to_string();
            }
        }
    }
    
    // Извлекаем из URL
    if let Ok(parsed) = url::Url::parse(url) {
        if let Some(segments) = parsed.path_segments() {
            if let Some(last) = segments.last() {
                let decoded = urlencoding::decode(last).unwrap_or_else(|_| last.into());
                if !decoded.is_empty() && decoded != "/" {
                    return decoded.to_string();
                }
            }
        }
    }
    
    // Fallback
    format!("download_{}", chrono::Utc::now().timestamp())
}

/// Получить уникальное имя файла (добавляет (1), (2) и т.д. если файл существует)
fn get_unique_filename(dir: &PathBuf, filename: &str) -> String {
    let path = dir.join(filename);
    if !path.exists() {
        return filename.to_string();
    }
    
    let stem = std::path::Path::new(filename)
        .file_stem()
        .and_then(|s| s.to_str())
        .unwrap_or(filename);
    let ext = std::path::Path::new(filename)
        .extension()
        .and_then(|s| s.to_str())
        .map(|e| format!(".{}", e))
        .unwrap_or_default();
    
    for i in 1..1000 {
        let new_name = format!("{} ({}){}", stem, i, ext);
        if !dir.join(&new_name).exists() {
            return new_name;
        }
    }
    
    format!("{}_{}{}", stem, chrono::Utc::now().timestamp(), ext)
}

/// Начать загрузку файла
pub async fn start_download(
    app: AppHandle,
    url: String,
    suggested_filename: Option<String>,
) -> Result<Download, String> {
    let download_id = format!("dl_{}", uuid::Uuid::new_v4().to_string().replace("-", "")[..12].to_string());
    let downloads_dir = get_downloads_dir()?;
    
    // Создаём HTTP клиент
    let client = reqwest::Client::builder()
        .user_agent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36")
        .build()
        .map_err(|e| e.to_string())?;
    
    // Делаем HEAD запрос для получения информации
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
    
    // Определяем имя файла
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
    
    // Отправляем начальное событие
    let _ = app.emit("download-started", &download);
    let _ = app.emit("download-update", &download);
    
    // Сохраняем в историю
    let mut downloads = get_downloads().await.unwrap_or_default();
    downloads.insert(0, download.clone());
    let _ = save_downloads(downloads).await;
    
    // Создаём канал для отмены
    let (cancel_tx, mut cancel_rx) = tokio::sync::watch::channel(false);
    
    // Сохраняем sender для возможности отмены
    {
        let state = app.state::<crate::AppState>();
        if let Ok(mut manager) = state.download_manager.lock() {
            manager.cancel_senders.insert(download_id.clone(), cancel_tx);
        };
    }
    
    // Запускаем загрузку в фоне
    let app_clone = app.clone();
    let download_id_clone = download_id.clone();
    let url_clone = url.clone();
    let save_path_clone = save_path.clone();
    
    tokio::spawn(async move {
        let result = download_file(
            app_clone.clone(),
            download_id_clone.clone(),
            url_clone,
            save_path_clone,
            total_bytes,
            &mut cancel_rx,
        ).await;
        
        // Удаляем из активных загрузок
        {
            let state = app_clone.state::<crate::AppState>();
            if let Ok(mut manager) = state.download_manager.lock() {
                manager.cancel_senders.remove(&download_id_clone);
            };
        }
        
        // Обновляем статус
        let final_state = match result {
            Ok(()) => "completed",
            Err(ref e) if e.contains("cancelled") => "cancelled",
            Err(_) => "interrupted",
        };
        
        // Обновляем в истории
        if let Ok(mut downloads) = get_downloads().await {
            if let Some(dl) = downloads.iter_mut().find(|d| d.id == download_id_clone) {
                dl.state = final_state.to_string();
                if final_state == "completed" {
                    dl.received_bytes = dl.total_bytes;
                }
                let _ = app_clone.emit("download-update", dl.clone());
                let _ = app_clone.emit("download-completed", dl.clone());
            }
            let _ = save_downloads(downloads).await;
        }
    });
    
    Ok(download)
}

/// Загрузка файла с прогрессом
async fn download_file(
    app: AppHandle,
    download_id: String,
    url: String,
    save_path: PathBuf,
    total_bytes: i64,
    cancel_rx: &mut tokio::sync::watch::Receiver<bool>,
) -> Result<(), String> {
    use tokio::io::AsyncWriteExt;
    
    let client = reqwest::Client::builder()
        .user_agent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36")
        .build()
        .map_err(|e| e.to_string())?;
    
    let response = client.get(&url).send().await.map_err(|e| e.to_string())?;
    
    if !response.status().is_success() {
        return Err(format!("HTTP error: {}", response.status()));
    }
    
    let mut file = tokio::fs::File::create(&save_path).await.map_err(|e| e.to_string())?;
    let mut stream = response.bytes_stream();
    
    let mut received_bytes: i64 = 0;
    let mut last_update = std::time::Instant::now();
    let mut last_bytes = 0i64;
    let update_interval = std::time::Duration::from_millis(250);
    
    use futures_util::StreamExt;
    
    while let Some(chunk_result) = stream.next().await {
        // Проверяем отмену
        if *cancel_rx.borrow() {
            let _ = tokio::fs::remove_file(&save_path).await;
            return Err("Download cancelled".to_string());
        }
        
        let chunk = chunk_result.map_err(|e| e.to_string())?;
        file.write_all(&chunk).await.map_err(|e| e.to_string())?;
        received_bytes += chunk.len() as i64;
        
        // Отправляем обновление прогресса
        let now = std::time::Instant::now();
        if now.duration_since(last_update) >= update_interval {
            let elapsed = now.duration_since(last_update).as_secs_f64();
            let bytes_diff = received_bytes - last_bytes;
            let speed = if elapsed > 0.0 { (bytes_diff as f64 / elapsed) as i64 } else { 0 };
            
            let update = serde_json::json!({
                "id": download_id,
                "receivedBytes": received_bytes,
                "totalBytes": total_bytes,
                "speed": speed,
                "state": "progressing"
            });
            let _ = app.emit("download-progress", &update);
            let _ = app.emit("download-update", &update);
            
            last_update = now;
            last_bytes = received_bytes;
        }
    }
    
    file.flush().await.map_err(|e| e.to_string())?;
    
    Ok(())
}

/// Отменить загрузку
pub async fn cancel_download_by_id(app: &AppHandle, id: &str) -> Result<(), String> {
    // Отправляем сигнал отмены
    {
        let state = app.state::<crate::AppState>();
        if let Ok(manager) = state.download_manager.lock() {
            if let Some(tx) = manager.cancel_senders.get(id) {
                let _ = tx.send(true);
            }
        };
    }
    
    // Обновляем статус в истории
    if let Ok(mut downloads) = get_downloads().await {
        if let Some(dl) = downloads.iter_mut().find(|d| d.id == id) {
            dl.state = "cancelled".to_string();
            let _ = app.emit("download-update", dl.clone());
        }
        let _ = save_downloads(downloads).await;
    }
    
    Ok(())
}
