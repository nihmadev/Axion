use serde::{Deserialize, Serialize};

#[derive(Clone, Serialize)]
pub struct WebViewUpdateEvent {
    pub id: String,
    pub url: Option<String>,
    pub title: Option<String>,
    pub favicon: Option<String>,
    pub is_loading: Option<bool>,
    pub can_go_back: Option<bool>,
    pub can_go_forward: Option<bool>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WebViewInfo {
    pub id: String,
    pub url: String,
    pub title: String,
    pub favicon: String,
    pub is_loading: bool,
    pub can_go_back: bool,
    pub can_go_forward: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WebViewBounds {
    pub x: f64,
    pub y: f64,
    pub width: f64,
    pub height: f64,
}
