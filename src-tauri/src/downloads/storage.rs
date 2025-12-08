use super::types::Download;
use super::utils::get_downloads_file;

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
