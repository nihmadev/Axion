
use super::BlockerStats;
use serde::{Deserialize, Serialize};
#[derive(Debug, Serialize, Deserialize)]
pub struct BlockerStatus {
    pub enabled: bool,
    pub lists_loaded: bool,
    pub stats: BlockerStats,
}
#[tauri::command]
pub async fn init_adblock() -> Result<usize, String> {
    super::load_filter_lists().await
}
#[tauri::command]
pub fn check_url_blocked(url: String, source_url: String, request_type: String) -> bool {
    super::should_block_url(&url, &source_url, &request_type)
}
#[tauri::command]
pub fn set_adblock_enabled(enabled: bool) {
    super::set_enabled(enabled);
}
#[tauri::command]
pub fn get_adblock_status() -> BlockerStatus {
    BlockerStatus {
        enabled: super::is_enabled(),
        lists_loaded: super::are_lists_loaded(),
        stats: super::get_stats(),
    }
}
#[tauri::command]
pub fn get_adblock_stats() -> BlockerStats {
    super::get_stats()
}
#[tauri::command]
pub fn reset_adblock_stats() {
    super::reset_stats();
}
#[tauri::command]
pub fn add_custom_filters(rules: String) -> Result<(), String> {
    super::add_custom_rules(&rules)
}
