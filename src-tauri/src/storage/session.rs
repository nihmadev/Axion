use super::ensure_data_dir;

pub async fn save_session(session_data: serde_json::Value) -> Result<bool, String> {
    let path = ensure_data_dir()?.join("session.json");
    let content = serde_json::to_string_pretty(&session_data).map_err(|e| e.to_string())?;

    tokio::fs::write(path, content)
        .await
        .map_err(|e| e.to_string())?;

    Ok(true)
}

pub async fn restore_session() -> Result<Option<serde_json::Value>, String> {
    let path = ensure_data_dir()?.join("session.json");

    if !path.exists() {
        return Ok(None);
    }

    let content = tokio::fs::read_to_string(path)
        .await
        .map_err(|e| e.to_string())?;

    let session: serde_json::Value = serde_json::from_str(&content).map_err(|e| e.to_string())?;

    Ok(Some(session))
}

pub async fn clear_session() -> Result<bool, String> {
    let path = ensure_data_dir()?.join("session.json");

    if path.exists() {
        tokio::fs::remove_file(path)
            .await
            .map_err(|e| e.to_string())?;
    }

    Ok(true)
}
