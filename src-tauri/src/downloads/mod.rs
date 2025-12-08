mod types;
pub mod utils;
mod storage;
mod downloader;

pub use types::{Download, DownloadManager};
pub use storage::{get_downloads, save_downloads, clear_completed};
pub use downloader::{start_download, cancel_download_by_id};
