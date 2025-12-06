//! WebView Manager module
//! 
//! Управление нативными WebView для вкладок браузера

pub mod types;
mod manager;
pub mod polling;

// Commands module - public for tauri macro access
pub mod commands;

// Re-export public types
pub use types::WebViewBounds;
pub use manager::WebViewManager;

// User-Agent для совместимости с Google и другими сайтами
pub const CHROME_USER_AGENT: &str = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";
