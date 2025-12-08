pub const READER_MODE_TEMPLATE_JS: &str = r#"
    const readerHTML = `
        ${READER_STYLES}
        <div class="axion-reader-overlay">
            <button class="axion-reader-close" onclick="location.reload()" title="Exit Reader Mode">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M18 6L6 18M6 6l12 12"/>
                </svg>
            </button>
            <div class="axion-reader-container">
                <header class="axion-reader-header">
                    <h1 class="axion-reader-title">${title}</h1>
                    <div class="axion-reader-meta">
                        ${subreddit ? '<span><a href="https://reddit.com/r/' + subreddit + '">/r/' + subreddit + '</a></span>' : ''}
                        ${author ? '<span>' + author + '</span>' : ''}
                        ${publishDate ? '<span>' + publishDate + '</span>' : ''}
                        <span>${Math.ceil(mainContent.innerText.split(/\s+/).length / 200)} min read</span>
                    </div>
                </header>
                <div class="axion-reader-content">
                    ${content}
                </div>
            </div>
        </div>
    `;
    
    document.body.classList.add('axion-reader-mode');
    document.body.insertAdjacentHTML('beforeend', readerHTML);
"#;

pub const CONTENT_CLEANUP_JS: &str = r#"
    const readerContent = document.querySelector('.axion-reader-content');
    if (readerContent) {
        const baseRemoveSelectors = [
            'script', 'style', 'iframe:not([src*="youtube"]):not([src*="vimeo"])', 'noscript',
            '.ad', '.ads', '.advertisement',
            '.comments', '.related-posts', '.sidebar',
            '[id*="google_ads"]', '[id*="taboola"]', '[id*="outbrain"]'
        ];
        
        const aggressiveRemoveSelectors = isReddit || isHackerNews ? [] : [
            '.social-share',
            '[class*="share-"]:not(a)',
            '[class*="-share"]:not(a)',
            '[class*="social-"]:not(a)'
        ];
        
        const removeSelectors = [...baseRemoveSelectors, ...aggressiveRemoveSelectors];
        
        removeSelectors.forEach(sel => {
            try {
                readerContent.querySelectorAll(sel).forEach(el => el.remove());
            } catch (e) {
            }
        });
        
        if (isReddit) {
            readerContent.querySelectorAll('a').forEach(link => {
                const href = link.getAttribute('href') || '';
                if (href.includes('/r/') || href.includes('/u/') || href.includes('/user/')) {
                    link.style.color = '#7c3aed';
                    link.style.textDecoration = 'none';
                }
            });
        }
    }
"#;
