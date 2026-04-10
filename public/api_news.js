// api_news.js - 从后台API加载新闻数据

document.addEventListener('DOMContentLoaded', function() {
    const newsList = document.getElementById('news-list');
    const moreNewsLink = document.getElementById('news-more-link');
    const moreNewsWrapper = document.getElementById('news-more-wrapper');
    const DESKTOP_MIN_WIDTH = 768;
    const BASE_VIDEO_GAP = 20; // equals mt-5
    const MAX_NEWS_ITEMS = 5;
    let latestNews = [];
    let latestLang = 'zh';

    if (!newsList) {
        console.error('错误：未能找到 ID 为 "news-list" 的新闻列表容器。');
        return;
    }

    function resolveLanguage() {
        const saved = localStorage.getItem('preferredLanguage');
        if (saved === 'zh' || saved === 'en') return saved;
        return 'zh';
    }

    function formatDate(dateValue, lang) {
        const publishDate = new Date(dateValue);
        return publishDate.toLocaleDateString(lang === 'en' ? 'en-US' : 'zh-CN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    function estimateTitleUnits(title) {
        const text = String(title || '').trim();
        if (!text) return 2;

        const cjkCount = (text.match(/[\u4e00-\u9fff]/g) || []).length;
        const latinCount = (text.match(/[A-Za-z0-9]/g) || []).length;
        const otherCount = Math.max(0, text.length - cjkCount - latinCount);

        // Rough visual width estimation: CJK chars are wider than Latin chars.
        const visualWidth = cjkCount + latinCount * 0.55 + otherCount * 0.8;

        // Sidebar is relatively narrow; use tighter width to better reflect multi-line wrapping.
        // 1 unit ~= one title line in sidebar; +1 accounts for date line.
        return Math.max(2, Math.ceil(visualWidth / 16) + 1);
    }

    function pickRecentNewsByBudget(items, lang) {
        const budget = 14;
        const minItems = 2;
        const maxItems = Math.min(MAX_NEWS_ITEMS, items.length || MAX_NEWS_ITEMS);
        const selected = [];
        let used = 0;

        for (const item of items.slice(0, maxItems)) {
            const title = lang === 'en' ? (item.title_en || item.title) : (item.title || item.title_en);
            const units = estimateTitleUnits(title);

            if (selected.length >= minItems && used + units > budget) {
                break;
            }

            selected.push(item);
            used += units;
        }

        if (selected.length === 0 && items.length > 0) {
            selected.push(items[0]);
        }

        return selected;
    }

    function getLayoutElements() {
        const leftColumn = document.getElementById('home-main-column');
        const rightColumn = document.getElementById('home-sidebar-column');
        const videoBlock = document.getElementById('home-video-block');
        return { leftColumn, rightColumn, videoBlock };
    }

    function renderNewsList(recentNews, lang) {
        newsList.innerHTML = '';

        recentNews.forEach(item => {
            const li = document.createElement('li');
            const title = lang === 'en' ? (item.title_en || item.title) : (item.title || item.title_en);
            const formattedDate = formatDate(item.publish_date, lang);

            li.innerHTML = `
                <a href="/news/detail.html?id=${encodeURIComponent(item.id)}&lang=${lang}" class="block group hover:bg-gray-50 p-2 rounded transition-colors duration-150">
                    <span class="font-medium text-blue-700 group-hover:text-blue-900 group-hover:underline">${title}</span><br>
                    <span class="text-sm text-gray-500">${formattedDate}</span>
                </a>
            `;

            newsList.appendChild(li);
        });
    }

    function updateMoreNewsLink(lang) {
        if (!moreNewsLink) return;
        moreNewsLink.href = `/news/total.html?lang=${lang}`;
        moreNewsLink.textContent = lang === 'en' ? 'More news »' : '查看所有新闻 »';
    }

    function renderNoNews(lang) {
        newsList.innerHTML = '';
        const li = document.createElement('li');
        li.innerHTML = `
            <div class="block p-2 rounded">
                <span class="text-gray-500">${lang === 'en' ? 'No news yet.' : '暂无新闻。'}</span>
            </div>
        `;
        newsList.appendChild(li);
        updateMoreNewsLink(lang);
    }

    function fitSidebarHeightOnDesktop(items, lang) {
        const { leftColumn, rightColumn, videoBlock } = getLayoutElements();
        if (!leftColumn || !rightColumn || !videoBlock) {
            return false;
        }

        function resetSidebarStyles() {
            rightColumn.style.height = '';
            rightColumn.style.overflow = '';
            newsList.style.maxHeight = '';
            newsList.style.overflowY = '';
            videoBlock.style.marginTop = `${BASE_VIDEO_GAP}px`;
            if (moreNewsWrapper) {
                moreNewsWrapper.style.maxHeight = '';
                moreNewsWrapper.style.overflow = '';
            }
        }

        if (window.innerWidth < DESKTOP_MIN_WIDTH) {
            resetSidebarStyles();
            return false;
        }

        const leftHeight = Math.round(leftColumn.getBoundingClientRect().height);
        if (!Number.isFinite(leftHeight) || leftHeight <= 0) {
            resetSidebarStyles();
            return false;
        }

        rightColumn.style.height = `${leftHeight}px`;
        rightColumn.style.overflow = 'hidden';
        videoBlock.style.marginTop = 'auto';
        newsList.style.maxHeight = '';
        newsList.style.overflowY = 'hidden';

        const heading = rightColumn.querySelector('h2');
        const headingHeight = heading ? Math.ceil(heading.getBoundingClientRect().height) : 0;
        const videoHeight = Math.ceil(videoBlock.getBoundingClientRect().height);
        const moreHeight = moreNewsWrapper ? Math.ceil(moreNewsWrapper.getBoundingClientRect().height) : 0;
        const safetyGap = 16;
        const availableListHeight = Math.max(
            96,
            Math.floor(leftHeight - headingHeight - videoHeight - moreHeight - BASE_VIDEO_GAP - safetyGap)
        );

        newsList.style.maxHeight = `${availableListHeight}px`;
        newsList.style.overflowY = 'hidden';

        const maxCount = Math.min(MAX_NEWS_ITEMS, items.length);
        if (maxCount <= 0) {
            return true;
        }

        let chosenCount = 0;

        for (let count = maxCount; count >= 1; count -= 1) {
            renderNewsList(items.slice(0, count), lang);
            if (newsList.scrollHeight <= availableListHeight + 1) {
                chosenCount = count;
                break;
            }
        }

        if (chosenCount === 0) {
            renderNewsList(items.slice(0, 1), lang);
            if (newsList.scrollHeight > availableListHeight + 1) {
                newsList.style.overflowY = 'auto';
            }
            return true;
        }

        renderNewsList(items.slice(0, chosenCount), lang);
        if (newsList.scrollHeight > availableListHeight + 1) {
            newsList.style.overflowY = 'auto';
        }

        return true;
    }

    function renderNews(items, lang) {
        latestNews = Array.isArray(items) ? items : [];
        latestLang = lang;
        updateMoreNewsLink(lang);

        if (!latestNews.length) {
            renderNoNews(lang);
            return;
        }

        const fitted = fitSidebarHeightOnDesktop(latestNews, lang);
        if (!fitted) {
            const recentNews = pickRecentNewsByBudget(latestNews, lang);
            renderNewsList(recentNews, lang);
        }
    }

    async function loadNewsFromApi() {
        const lang = resolveLanguage();
        const response = await fetch('/api/news');
        if (!response.ok) {
            throw new Error(`加载新闻数据失败。状态码: ${response.status}`);
        }
        const data = await response.json();
        const news = data.news || [];
        renderNews(news, lang);
    }

    // 从API加载新闻数据
    loadNewsFromApi().catch(error => {
            console.error('错误：获取新闻数据时出错:', error);
            
            // 显示错误信息
            newsList.innerHTML = `
                <li class="news-error">
                    <div class="block p-2 rounded">
                        <span class="text-red-500">加载新闻时出错: ${error.message}</span>
                    </div>
                </li>
            `;
        });

    window.addEventListener('rsag-language-change', () => {
        loadNewsFromApi().catch((error) => {
            console.error('语言切换后刷新新闻失败:', error);
        });
    });

    const handleResize = (() => {
        let timer = null;
        return () => {
            if (timer) clearTimeout(timer);
            timer = setTimeout(() => {
                renderNews(latestNews, latestLang);
            }, 120);
        };
    })();

    window.addEventListener('resize', handleResize);

    const homeImage = document.querySelector('#home img');
    if (homeImage && !homeImage.complete) {
        homeImage.addEventListener('load', () => {
            renderNews(latestNews, latestLang);
        });
    }

    const videoIframe = document.querySelector('#home-video-block iframe');
    if (videoIframe) {
        videoIframe.addEventListener('load', () => {
            renderNews(latestNews, latestLang);
        });
    }
});
