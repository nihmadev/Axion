pub mod types;
mod manager;
pub mod polling;

pub mod commands;

pub use types::WebViewBounds;
pub use manager::WebViewManager;

pub const CHROME_USER_AGENT: &str = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";
