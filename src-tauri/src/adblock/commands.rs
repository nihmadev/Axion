//! Tauri commands for ad blocker management

use super::BlockerStats;
use serde::{Deserialize, Serialize};

/// Response for blocker status
#[derive(Debug, Serialize, Deserialize)]
pub struct BlockerStatus {
    pub enabled: bool,
    pub lists_loaded: bool,
    pub stats: BlockerStats,
}

/// Initialize ad blocker and load filter lists
#[tauri::command]
pub async fn init_adblock() -> Result<usize, String> {
    super::load_filter_lists().await
}

/// Check if a URL should be blocked
#[tauri::command]
pub fn check_url_blocked(url: String, source_url: String, request_type: String) -> bool {
    super::should_block_url(&url, &source_url, &request_type)
}

/// Enable or disable the ad blocker
#[tauri::command]
pub fn set_adblock_enabled(enabled: bool) {
    super::set_enabled(enabled);
}

/// Get ad blocker status
#[tauri::command]
pub fn get_adblock_status() -> BlockerStatus {
    BlockerStatus {
        enabled: super::is_enabled(),
        lists_loaded: super::are_lists_loaded(),
        stats: super::get_stats(),
    }
}

/// Get blocking statistics
#[tauri::command]
pub fn get_adblock_stats() -> BlockerStats {
    super::get_stats()
}

/// Reset blocking statistics
#[tauri::command]
pub fn reset_adblock_stats() {
    super::reset_stats();
}

/// Add custom filter rules
#[tauri::command]
pub fn add_custom_filters(rules: String) -> Result<(), String> {
    super::add_custom_rules(&rules)
}
