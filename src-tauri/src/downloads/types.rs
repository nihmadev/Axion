use serde::{Deserialize, Serialize};
use std::collections::HashMap;

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

impl Default for DownloadManager {
    fn default() -> Self {
        Self::new()
    }
}
