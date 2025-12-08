pub const SITE_DETECTION_JS: &str = r#"
    const isReddit = hostname.includes('reddit.com');
    const isHackerNews = hostname.includes('news.ycombinator.com');
    const isMedium = hostname.includes('medium.com');
    const isSubstack = hostname.includes('substack.com');
    const isWikipedia = hostname.includes('wikipedia.org');
"#;
