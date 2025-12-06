mod bookmarks;
mod history;
mod import;
mod session;
mod settings;

use serde::{Deserialize, Serialize};
use std::path::PathBuf;

// Re-exports
pub use bookmarks::{get_bookmarks, set_bookmarks};
pub use history::{add_history, clear_history, get_history, set_history};
pub use import::{detect_browsers, import_from_browser, DetectedBrowser, ImportResult};
pub use session::{clear_session, restore_session, save_session};
pub use settings::{get_settings, set_settings};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Bookmark {
    pub id: String,
    pub url: String,
    pub title: String,
    pub favicon: Option<String>,
    #[serde(rename = "createdAt")]
    pub created_at: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HistoryEntry {
    pub id: String,
    pub url: String,
    pub title: String,
    pub favicon: Option<String>,
    #[serde(rename = "visitedAt")]
    pub visited_at: i64,
}

pub fn get_data_dir() -> Result<PathBuf, String> {
    dirs::data_dir()
        .ok_or_else(|| "Could not find data directory".to_string())
        .map(|p| p.join("axion-browser"))
}

pub fn ensure_data_dir() -> Result<PathBuf, String> {
    let dir = get_data_dir()?;
    std::fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    Ok(dir)
}
