/// JavaScript для поиска основного контента на странице
pub const CONTENT_FINDER_JS: &str = r#"
    // Функция для подсчёта текстовой плотности элемента
    function getTextDensity(el) {
        const text = el.innerText || '';
        const links = el.querySelectorAll('a');
        let linkTextLength = 0;
        links.forEach(a => linkTextLength += (a.innerText || '').length);
        const textLength = text.length;
        if (textLength === 0) return 0;
        return (textLength - linkTextLength) / textLength;
    }
    
    // Функция для поиска основного контента с сайт-специфичными селекторами
    function findMainContent() {
        let selectors = [];
        let minTextLength = 500;
        
        // Сайт-специфичные селекторы
        if (isReddit) {
            selectors = [
                '[data-testid="post-container"]',
                '.Post',
                '[data-click-id="text"]',
                '.thing .usertext-body',
                '.expando .usertext-body',
                'shreddit-post',
                '.md'  // Markdown контент на Reddit
            ];
            minTextLength = 100; // Reddit посты могут быть короткими
        } else if (isHackerNews) {
            selectors = [
                '.fatitem',
                '.comment-tree',
                '.storylink + .subtext + .itemlist'
            ];
            minTextLength = 50;
        } else if (isMedium) {
            selectors = [
                'article',
                '.postArticle-content',
                '.section-content'
            ];
        } else if (isSubstack) {
            selectors = [
                '.post-content',
                '.body',
                'article'
            ];
        } else if (isWikipedia) {
            selectors = [
                '#mw-content-text',
                '.mw-parser-output',
                '#bodyContent'
            ];
        } else {
            // Общие селекторы для статей
            selectors = [
                'article',
                '[role="main"]',
                'main',
                '.post-content',
                '.article-content',
                '.entry-content',
                '.content-body',
                '.story-body',
                '#article-body',
                '.article-body',
                '.post-body',
                '.article__body',
                '.story-content',
                '.prose',
                '.markdown-body'
            ];
        }
        
        for (const selector of selectors) {
            const el = document.querySelector(selector);
            if (el && el.innerText.length > minTextLength) {
                return el;
            }
        }
        
        // Fallback: ищем элемент с наибольшим количеством текста
        const candidates = document.querySelectorAll('div, section');
        let bestElement = null;
        let bestScore = 0;
        
        candidates.forEach(el => {
            const text = el.innerText || '';
            const paragraphs = el.querySelectorAll('p');
            const density = getTextDensity(el);
            
            // Адаптивные пороги в зависимости от сайта
            const minLen = isReddit || isHackerNews ? 100 : 500;
            const minParagraphs = isReddit || isHackerNews ? 1 : 2;
            
            if (text.length < minLen || text.length > 100000) return;
            if (paragraphs.length < minParagraphs) return;
            
            // Считаем score на основе количества параграфов и плотности текста
            const score = paragraphs.length * density * (text.length / 1000);
            
            if (score > bestScore) {
                bestScore = score;
                bestElement = el;
            }
        });
        
        return bestElement;
    }
"#;
