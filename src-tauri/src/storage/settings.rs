use super::ensure_data_dir;

pub async fn get_settings() -> Result<serde_json::Value, String> {
    let path = ensure_data_dir()?.join("settings.json");

    if !path.exists() {
        return Ok(serde_json::json!({}));
    }

    let content = tokio::fs::read_to_string(path)
        .await
        .map_err(|e| e.to_string())?;

    serde_json::from_str(&content).map_err(|e| e.to_string())
}

pub async fn set_settings(settings: serde_json::Value) -> Result<(), String> {
    let path = ensure_data_dir()?.join("settings.json");
    let content = serde_json::to_string_pretty(&settings).map_err(|e| e.to_string())?;

    tokio::fs::write(path, content)
        .await
        .map_err(|e| e.to_string())
}
