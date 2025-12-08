
(function() {
    if (window.__AXION_OBSERVER_INITIALIZED__) return 'already_initialized';
    window.__AXION_OBSERVER_INITIALIZED__ = true;
    
    let isSendingData = false;
    let pendingSend = null;
    
    function getFavicon() {
        const selectors = [
            'link[rel="apple-touch-icon"]',
            'link[rel="apple-touch-icon-precomposed"]',
            'link[rel="icon"][sizes="192x192"]',
            'link[rel="icon"][sizes="128x128"]',
            'link[rel="icon"][sizes="96x96"]',
            'link[rel="icon"][sizes="64x64"]',
            'link[rel="icon"][sizes="32x32"]',
            'link[rel="icon"]',
            'link[rel="shortcut icon"]',
        ];
        
        for (const selector of selectors) {
            const link = document.querySelector(selector);
            if (link && link.href) {
                return link.href;
            }
        }
        
        try {
            return new URL('/favicon.ico', window.location.origin).href;
        } catch {
            return '';
        }
    }
    
    function getOpenGraphData() {
        const ogTitle = document.querySelector('meta[property="og:title"]');
        const ogImage = document.querySelector('meta[property="og:image"]');
        const ogSiteName = document.querySelector('meta[property="og:site_name"]');
        
        return {
            title: ogTitle?.content || '',
            image: ogImage?.content || '',
            siteName: ogSiteName?.content || '',
        };
    }
    
    function getBestTitle() {
        const docTitle = document.title?.trim();
        if (docTitle && docTitle.length > 0) {
            return docTitle;
        }
        
        const og = getOpenGraphData();
        if (og.title) return og.title;
        if (og.siteName) return og.siteName;
        
        try {
            return window.location.hostname.replace('www.', '');
        } catch {
            return '';
        }
    }
    
    let lastUrl = '';
    let lastTitle = '';
    let lastFavicon = '';
    let lastSentData = '';
    
    function sendToRust(url, title, favicon) {
        const data = JSON.stringify({ url, title, favicon });
        
        if (data === lastSentData) return;
        lastSentData = data;
        
        if (isSendingData) {
            pendingSend = { url, title, favicon };
            return;
        }
        
        isSendingData = true;
        const originalTitle = document.title;
        document.title = '__AXION_IPC__:' + data;
        
        setTimeout(() => {
            document.title = originalTitle || title;
            isSendingData = false;
            
            if (pendingSend) {
                const pending = pendingSend;
                pendingSend = null;
                sendToRust(pending.url, pending.title, pending.favicon);
            }
        }, 50);
    }
    
    function updatePageInfo() {
        if (isSendingData) {
            return;
        }
        
        const currentUrl = window.location.href;
        const currentTitle = getBestTitle();
        const currentFavicon = getFavicon();
        
        const urlChanged = currentUrl !== lastUrl;
        const titleChanged = currentTitle !== lastTitle;
        const faviconChanged = currentFavicon !== lastFavicon;
        
        if (urlChanged || titleChanged || faviconChanged) {
            lastUrl = currentUrl;
            lastTitle = currentTitle;
            lastFavicon = currentFavicon;
            
            window.__AXION_PAGE_INFO__ = {
                url: currentUrl,
                title: currentTitle,
                favicon: currentFavicon,
                timestamp: Date.now(),
                changed: {
                    url: urlChanged,
                    title: titleChanged,
                    favicon: faviconChanged,
                }
            };
            
            sendToRust(currentUrl, currentTitle, currentFavicon);
        }
    }
    
    const titleObserver = new MutationObserver(updatePageInfo);
    
    function observeTitle() {
        const titleElement = document.querySelector('title');
        if (titleElement) {
            titleObserver.observe(titleElement, { 
                childList: true, 
                characterData: true, 
                subtree: true 
            });
        }
    }
    
    const headObserver = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
            if (mutation.type === 'childList') {
                for (const node of mutation.addedNodes) {
                    if (node.nodeName === 'LINK' && 
                        (node.rel?.includes('icon') || node.rel?.includes('apple-touch'))) {
                        updatePageInfo();
                        break;
                    }
                }
            }
        }
    });
    
    function observeHead() {
        const head = document.head;
        if (head) {
            headObserver.observe(head, { childList: true, subtree: true });
        }
    }
    
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;
    
    history.pushState = function(...args) {
        originalPushState.apply(this, args);
        setTimeout(updatePageInfo, 0);
    };
    
    history.replaceState = function(...args) {
        originalReplaceState.apply(this, args);
        setTimeout(updatePageInfo, 0);
    };
    
    window.addEventListener('popstate', () => setTimeout(updatePageInfo, 0));
    window.addEventListener('hashchange', updatePageInfo);
    
    window.addEventListener('load', () => {
        observeTitle();
        observeHead();
        updatePageInfo();
    });
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            observeTitle();
            observeHead();
            updatePageInfo();
        });
    } else {
        observeTitle();
        observeHead();
    }
    
    setInterval(updatePageInfo, 1000);
    
    document.addEventListener('click', (e) => {
        setTimeout(updatePageInfo, 150);
    }, true);
    
    document.addEventListener('submit', () => {
        setTimeout(updatePageInfo, 200);
    }, true);
    
    updatePageInfo();
    setTimeout(updatePageInfo, 300);
    
    return 'initialized';
})();
