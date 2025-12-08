
pub mod commands;

use adblock::Engine;
use adblock::FilterSet;
use adblock::lists::ParseOptions;
use adblock::request::Request;
use std::sync::{Mutex, RwLock, LazyLock, atomic::{AtomicBool, AtomicU64, Ordering}};
use std::collections::HashMap;
use serde::{Deserialize, Serialize};
const EASYLIST_URL: &str = "https:
const EASYPRIVACY_URL: &str = "https:
const UBLOCK_FILTERS_URL: &str = "https:
const UBLOCK_PRIVACY_URL: &str = "https:
const UBLOCK_BADWARE_URL: &str = "https:
const PETER_LOWE_URL: &str = "https:
const FALLBACK_RULES: &str = r#"
||googlesyndication.com^
||googleadservices.com^
||doubleclick.net^
||google-analytics.com^
||googletagmanager.com^
||facebook.com/tr^
||connect.facebook.net^
||analytics.
||tracking.
||tracker.
||adserver.
||ads.
||ad.doubleclick.
||pagead2.googlesyndication.com^
||securepubads.g.doubleclick.net^
||tpc.googlesyndication.com^
||www.googletagservices.com^
||adservice.google.
||adsense.
||adwords.
||yandex.ru/metrika^
||mc.yandex.ru^
||top-fwz1.mail.ru^
||vk.com/rtrg^
||pixel.
||beacon.
||telemetry.
||metrics.
||stats.
||collect.
||log.
||events.
||amplitude.com^
||mixpanel.com^
||segment.io^
||segment.com^
||hotjar.com^
||fullstory.com^
||mouseflow.com^
||crazyegg.com^
||optimizely.com^
||taboola.com^
||outbrain.com^
||criteo.com^
||pubmatic.com^
||rubiconproject.com^
||openx.net^
||adnxs.com^
||amazon-adsystem.com^
||moatads.com^
||scorecardresearch.com^
||quantserve.com^
||chartbeat.com^
||newrelic.com^
||nr-data.net^
||sentry.io^
||bugsnag.com^
||rollbar.com^
"#;
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct BlockerStats {
    pub total_blocked: u64,
    pub ads_blocked: u64,
    pub trackers_blocked: u64,
    pub blocked_domains: HashMap<String, u64>,
}
static BLOCKER_ENABLED: AtomicBool = AtomicBool::new(true);
static LISTS_LOADED: AtomicBool = AtomicBool::new(false);
static TOTAL_BLOCKED: AtomicU64 = AtomicU64::new(0);
static ADS_BLOCKED: AtomicU64 = AtomicU64::new(0);
static TRACKERS_BLOCKED: AtomicU64 = AtomicU64::new(0);

std::thread_local! {
    static ENGINE: std::cell::RefCell<Option<Engine>> = std::cell::RefCell::new(None);
}
static FILTER_RULES: LazyLock<RwLock<Vec<String>>> = LazyLock::new(|| RwLock::new(Vec::new()));
static BLOCKED_DOMAINS: LazyLock<Mutex<HashMap<String, u64>>> = LazyLock::new(|| Mutex::new(HashMap::new()));
fn ensure_engine_initialized() {
    ENGINE.with(|engine| {
        let mut engine_ref = engine.borrow_mut();
        if engine_ref.is_none() {
            let mut filter_set = FilterSet::new(true);
            
            filter_set.add_filter_list(FALLBACK_RULES, ParseOptions::default());
            
            if let Ok(rules) = FILTER_RULES.read() {
                for rule_list in rules.iter() {
                    filter_set.add_filter_list(rule_list, ParseOptions::default());
                }
            }
            
            *engine_ref = Some(Engine::from_filter_set(filter_set, true));
        }
    });
}
pub fn should_block_url(url: &str, source_url: &str, request_type: &str) -> bool {
    if !BLOCKER_ENABLED.load(Ordering::Relaxed) {
        return false;
    }
    
    ensure_engine_initialized();
    
    let request = match Request::new(url, source_url, request_type) {
        Ok(req) => req,
        Err(_) => return false,
    };
    
    let matched = ENGINE.with(|engine| {
        if let Some(ref eng) = *engine.borrow() {
            eng.check_network_request(&request).matched
        } else {
            false
        }
    });
    
    if matched {
        TOTAL_BLOCKED.fetch_add(1, Ordering::Relaxed);
        
        let url_lower = url.to_lowercase();
        if url_lower.contains("track") || url_lower.contains("analytics") 
            || url_lower.contains("telemetry") || url_lower.contains("metric") {
            TRACKERS_BLOCKED.fetch_add(1, Ordering::Relaxed);
        } else {
            ADS_BLOCKED.fetch_add(1, Ordering::Relaxed);
        }
        
        if let Ok(parsed) = url::Url::parse(url) {
            if let Some(domain) = parsed.host_str() {
                if let Ok(mut domains) = BLOCKED_DOMAINS.lock() {
                    *domains.entry(domain.to_string()).or_insert(0) += 1;
                }
            }
        }
    }
    
    matched
}
pub async fn load_filter_lists() -> Result<usize, String> {
    let lists = vec![
        ("EasyList", EASYLIST_URL),
        ("EasyPrivacy", EASYPRIVACY_URL),
        ("uBlock Filters", UBLOCK_FILTERS_URL),
        ("uBlock Privacy", UBLOCK_PRIVACY_URL),
        ("uBlock Badware", UBLOCK_BADWARE_URL),
        ("Peter Lowe's List", PETER_LOWE_URL),
    ];
    
    let mut downloaded_rules: Vec<String> = Vec::new();
    let mut total_rules = 0;
    
    for (name, url) in lists {
        match reqwest::get(url).await {
            Ok(response) => {
                if let Ok(text) = response.text().await {
                    let lines_count = text.lines().count();
                    downloaded_rules.push(text);
                    total_rules += lines_count;
                    println!("[AdBlock] Loaded {} with {} rules", name, lines_count);
                }
            }
            Err(e) => {
                eprintln!("[AdBlock] Failed to load {}: {}", name, e);
            }
        }
    }
    
    if let Ok(mut rules) = FILTER_RULES.write() {
        *rules = downloaded_rules;
    }
    
    ENGINE.with(|engine| {
        *engine.borrow_mut() = None;
    });
    
    LISTS_LOADED.store(true, Ordering::Relaxed);
    
    println!("[AdBlock] Total rules loaded: {}", total_rules);
    Ok(total_rules)
}
pub fn set_enabled(enabled: bool) {
    BLOCKER_ENABLED.store(enabled, Ordering::Relaxed);
}
pub fn is_enabled() -> bool {
    BLOCKER_ENABLED.load(Ordering::Relaxed)
}
pub fn are_lists_loaded() -> bool {
    LISTS_LOADED.load(Ordering::Relaxed)
}
pub fn get_stats() -> BlockerStats {
    let blocked_domains = BLOCKED_DOMAINS.lock()
        .map(|d| d.clone())
        .unwrap_or_default();
    
    BlockerStats {
        total_blocked: TOTAL_BLOCKED.load(Ordering::Relaxed),
        ads_blocked: ADS_BLOCKED.load(Ordering::Relaxed),
        trackers_blocked: TRACKERS_BLOCKED.load(Ordering::Relaxed),
        blocked_domains,
    }
}
pub fn reset_stats() {
    TOTAL_BLOCKED.store(0, Ordering::Relaxed);
    ADS_BLOCKED.store(0, Ordering::Relaxed);
    TRACKERS_BLOCKED.store(0, Ordering::Relaxed);
    if let Ok(mut domains) = BLOCKED_DOMAINS.lock() {
        domains.clear();
    }
}
pub fn add_custom_rules(rules: &str) -> Result<(), String> {
    if let Ok(mut stored_rules) = FILTER_RULES.write() {
        stored_rules.push(rules.to_string());
    }
    
    ENGINE.with(|engine| {
        *engine.borrow_mut() = None;
    });
    
    println!("[AdBlock] Added custom rules: {} lines", rules.lines().count());
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_basic_blocking() {
        assert!(should_block_url(
            "https:
            "https:
            "script"
        ));
        
        assert!(should_block_url(
            "https:
            "https:
            "script"
        ));
        
        assert!(!should_block_url(
            "https:
            "https:
            "document"
        ));
    }
}
