pub const METADATA_EXTRACTORS_JS: &str = r#"
    function getTitle() {
        if (isReddit) {
            const postTitle = document.querySelector('[data-testid="post-title"]') ||
                              document.querySelector('.Post h1') ||
                              document.querySelector('shreddit-post h1') ||
                              document.querySelector('.title a');
            if (postTitle) return postTitle.innerText;
        }
        
        const h1 = document.querySelector('h1');
        if (h1) return h1.innerText;
        
        const ogTitle = document.querySelector('meta[property="og:title"]');
        if (ogTitle) return ogTitle.content;
        
        return document.title;
    }
    
    function getAuthor() {
        if (isReddit) {
            const author = document.querySelector('[data-testid="post_author_link"]') ||
                           document.querySelector('.Post a[href*="/user/"]') ||
                           document.querySelector('a.author');
            if (author) return author.innerText;
        }
        
        const selectors = [
            '[rel="author"]',
            '.author',
            '.byline',
            '[itemprop="author"]',
            'meta[name="author"]'
        ];
        
        for (const sel of selectors) {
            const el = document.querySelector(sel);
            if (el) {
                return el.content || el.innerText || '';
            }
        }
        return '';
    }
    
    function getPublishDate() {
        const selectors = [
            'time[datetime]',
            '[itemprop="datePublished"]',
            '.publish-date',
            '.post-date',
            'meta[property="article:published_time"]'
        ];
        
        for (const sel of selectors) {
            const el = document.querySelector(sel);
            if (el) {
                const date = el.datetime || el.content || el.innerText;
                if (date) {
                    try {
                        return new Date(date).toLocaleDateString();
                    } catch {
                        return date;
                    }
                }
            }
        }
        return '';
    }
    
    function getSubreddit() {
        if (!isReddit) return '';
        const subredditLink = document.querySelector('a[href*="/r/"][data-click-id="subreddit"]') ||
                              document.querySelector('a.subreddit') ||
                              document.querySelector('shreddit-post')?.getAttribute('subreddit-prefixed-name');
        if (subredditLink) {
            return typeof subredditLink === 'string' ? subredditLink : subredditLink.innerText;
        }
        const match = window.location.pathname.match(/\/r\/([^\/]+)/);
        return match ? 'r/' + match[1] : '';
    }
"#;
