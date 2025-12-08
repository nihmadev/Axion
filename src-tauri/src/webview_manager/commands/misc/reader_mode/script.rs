pub fn get_reader_mode_script() -> String {
    use super::unsupported_sites::UNSUPPORTED_SITES_JS;
    use super::site_detection::SITE_DETECTION_JS;
    use super::content_finder::CONTENT_FINDER_JS;
    use super::metadata::METADATA_EXTRACTORS_JS;
    use super::styles::READER_MODE_STYLES;
    use super::template::{READER_MODE_TEMPLATE_JS, CONTENT_CLEANUP_JS};
    use super::notifications::{NOTIFICATION_STYLES_JS, UNSUPPORTED_NOTIFICATION_JS, NO_CONTENT_NOTIFICATION_JS};

    format!(
r#"(function() {{
    if (document.body.classList.contains('axion-reader-mode')) {{
        location.reload();
        return {{ success: true, action: 'exit' }};
    }}
    
    const hostname = window.location.hostname.toLowerCase();
    
    {}
    
    if (isUnsupported) {{
        const NOTIFICATION_STYLES = `{}`;
        {}
    }}
    
    {}
    
    {}
    
    {}
    
    const mainContent = findMainContent();
    if (!mainContent) {{
        const NOTIFICATION_STYLES = `{}`;
        {}
    }}
    
    const title = getTitle();
    const author = getAuthor();
    const publishDate = getPublishDate();
    const subreddit = getSubreddit();
    const content = mainContent.innerHTML;
    
    const READER_STYLES = `{}`;
    
    {}
    
    {}
    
    console.log('Reader Mode: Activated for', hostname);
    return {{ success: true, action: 'enter' }};
}})();"#,
        UNSUPPORTED_SITES_JS,
        NOTIFICATION_STYLES_JS,
        UNSUPPORTED_NOTIFICATION_JS,
        SITE_DETECTION_JS,
        CONTENT_FINDER_JS,
        METADATA_EXTRACTORS_JS,
        NOTIFICATION_STYLES_JS,
        NO_CONTENT_NOTIFICATION_JS,
        READER_MODE_STYLES,
        READER_MODE_TEMPLATE_JS,
        CONTENT_CLEANUP_JS
    )
}
