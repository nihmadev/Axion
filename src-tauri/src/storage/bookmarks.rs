use super::{ensure_data_dir, Bookmark};

pub async fn get_bookmarks() -> Result<Vec<Bookmark>, String> {
    let path = ensure_data_dir()?.join("bookmarks.json");

    if !path.exists() {
        return Ok(Vec::new());
    }

    let content = tokio::fs::read_to_string(path)
        .await
        .map_err(|e| e.to_string())?;

    serde_json::from_str(&content).map_err(|e| e.to_string())
}

pub async fn set_bookmarks(bookmarks: Vec<Bookmark>) -> Result<(), String> {
    let path = ensure_data_dir()?.join("bookmarks.json");
    let content = serde_json::to_string_pretty(&bookmarks).map_err(|e| e.to_string())?;

    tokio::fs::write(path, content)
        .await
        .map_err(|e| e.to_string())
}
