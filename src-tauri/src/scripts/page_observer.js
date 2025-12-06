// Axion Page Observer Script
// Отслеживает изменения URL, title и favicon на странице
// и отправляет их в Rust через специальный title-based IPC

(function() {
    // Избегаем повторной инициализации
    if (window.__AXION_OBSERVER_INITIALIZED__) return 'already_initialized';
    window.__AXION_OBSERVER_INITIALIZED__ = true;
    
    // Флаг для предотвращения рекурсии при изменении title
    let isSendingData = false;
    let pendingSend = null;
    
    // Функция для получения favicon
    function getFavicon() {
        // Приоритет: apple-touch-icon > icon > shortcut icon > default
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
        
        // Fallback: /favicon.ico
        try {
            return new URL('/favicon.ico', window.location.origin).href;
        } catch {
            return '';
        }
    }
    
    // Функция для получения Open Graph данных
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
    
    // Функция для получения лучшего title
    function getBestTitle() {
        // Приоритет: document.title > og:title > og:site_name > hostname
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
    
    // Отправляет данные в Rust через специальный title
    // Формат: __AXION_IPC__:{"url":"...","title":"...","favicon":"..."}
    function sendToRust(url, title, favicon) {
        const data = JSON.stringify({ url, title, favicon });
        
        // Не отправляем если данные не изменились
        if (data === lastSentData) return;
        lastSentData = data;
        
        // Если уже отправляем - откладываем
        if (isSendingData) {
            pendingSend = { url, title, favicon };
            return;
        }
        
        // Используем title как IPC канал
        isSendingData = true;
        const originalTitle = document.title;
        document.title = '__AXION_IPC__:' + data;
        
        // Восстанавливаем оригинальный title через setTimeout
        // Используем 50ms чтобы гарантировать что Tauri успеет получить событие
        // on_document_title_changed работает синхронно, но нужно время на доставку
        setTimeout(() => {
            document.title = originalTitle || title; // Используем реальный title если original пустой
            isSendingData = false;
            
            // Если были отложенные обновления, отправляем их
            if (pendingSend) {
                const pending = pendingSend;
                pendingSend = null;
                sendToRust(pending.url, pending.title, pending.favicon);
            }
        }, 50);
    }
    
    function updatePageInfo() {
        // Игнорируем изменения во время отправки данных
        if (isSendingData) {
            return;
        }
        
        const currentUrl = window.location.href;
        const currentTitle = getBestTitle();
        const currentFavicon = getFavicon();
        
        // Проверяем изменения
        const urlChanged = currentUrl !== lastUrl;
        const titleChanged = currentTitle !== lastTitle;
        const faviconChanged = currentFavicon !== lastFavicon;
        
        if (urlChanged || titleChanged || faviconChanged) {
            lastUrl = currentUrl;
            lastTitle = currentTitle;
            lastFavicon = currentFavicon;
            
            // Сохраняем в глобальную переменную для чтения из Rust
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
            
            // Отправляем данные в Rust
            sendToRust(currentUrl, currentTitle, currentFavicon);
        }
    }
    
    // Отслеживаем изменения title через MutationObserver
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
    
    // Отслеживаем изменения favicon
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
    
    // Перехватываем History API
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
    
    // События навигации
    window.addEventListener('popstate', () => setTimeout(updatePageInfo, 0));
    window.addEventListener('hashchange', updatePageInfo);
    
    // Событие загрузки
    window.addEventListener('load', () => {
        observeTitle();
        observeHead();
        updatePageInfo();
    });
    
    // Событие DOMContentLoaded
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
    
    // Периодическая проверка как fallback (для SPA)
    // Быстрая проверка (200ms) для обнаружения навигации
    setInterval(updatePageInfo, 200);
    
    // Отслеживаем клики по ссылкам (SPA часто навигируются через click)
    document.addEventListener('click', (e) => {
        // Проверяем после небольшой задержки (дать время на навигацию)
        setTimeout(updatePageInfo, 100);
        setTimeout(updatePageInfo, 300);
    }, true);
    
    // Отслеживаем submit форм
    document.addEventListener('submit', () => {
        setTimeout(updatePageInfo, 100);
        setTimeout(updatePageInfo, 500);
    }, true);
    
    // Начальное обновление - несколько раз для надёжности
    updatePageInfo();
    setTimeout(updatePageInfo, 100);
    setTimeout(updatePageInfo, 500);
    setTimeout(updatePageInfo, 1000);
    
    return 'initialized';
})();
