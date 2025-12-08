pub const UNSUPPORTED_SITES_JS: &str = r#"
    const unsupportedSites = [
        'twitter.com', 'x.com',
        'youtube.com', 'youtu.be',
        'facebook.com', 'fb.com',
        'instagram.com',
        'discord.com', 'discord.gg',
        'twitch.tv',
        'tiktok.com',
        'whatsapp.com',
        'telegram.org', 't.me',
        'slack.com',
        'mail.google.com',
        'outlook.com', 'outlook.live.com',
        'drive.google.com',
        'docs.google.com',
        'sheets.google.com',
        'github.com',
        'gitlab.com',
        'figma.com',
        'notion.so',
        'trello.com',
        'spotify.com',
        'netflix.com',
        'amazon.com',
        'ebay.com',
        'aliexpress.com',
        'maps.google.com',
        'translate.google.com'
    ];
    
    const isUnsupported = unsupportedSites.some(site => hostname.includes(site.replace('www.', '')));
"#;
