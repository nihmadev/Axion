use super::{ensure_data_dir, HistoryEntry};

pub async fn get_history() -> Result<Vec<HistoryEntry>, String> {
    let path = ensure_data_dir()?.join("history.json");

    if !path.exists() {
        return Ok(Vec::new());
    }

    let content = tokio::fs::read_to_string(path)
        .await
        .map_err(|e| e.to_string())?;

    serde_json::from_str(&content).map_err(|e| e.to_string())
}

pub async fn add_history(entry: HistoryEntry) -> Result<(), String> {
    let mut history = get_history().await?;
    history.insert(0, entry);

    // Ограничиваем до 5000 записей
    if history.len() > 5000 {
        history.truncate(5000);
    }

    let path = ensure_data_dir()?.join("history.json");
    let content = serde_json::to_string_pretty(&history).map_err(|e| e.to_string())?;

    tokio::fs::write(path, content)
        .await
        .map_err(|e| e.to_string())
}

pub async fn clear_history() -> Result<(), String> {
    let path = ensure_data_dir()?.join("history.json");

    if path.exists() {
        tokio::fs::remove_file(path)
            .await
            .map_err(|e| e.to_string())?;
    }

    Ok(())
}

pub async fn set_history(history: Vec<HistoryEntry>) -> Result<(), String> {
    let path = ensure_data_dir()?.join("history.json");
    let content = serde_json::to_string_pretty(&history).map_err(|e| e.to_string())?;

    tokio::fs::write(path, content)
        .await
        .map_err(|e| e.to_string())
}
