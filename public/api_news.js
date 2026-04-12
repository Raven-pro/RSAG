// api_news.js - 从后台API加载新闻数据

document.addEventListener('DOMContentLoaded', function() {
    const newsList = document.getElementById('news-list');
    const moreNewsLink = document.getElementById('news-more-link');
    const moreNewsWrapper = document.getElementById('news-more-wrapper');
    const DESKTOP_MIN_WIDTH = 768;
    const DESKTOP_NEWS_ITEMS = 4;
    const MOBILE_NEWS_ITEMS = 3;
    const BASE_VIDEO_GAP = 20;
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

    function getDisplayCount() {
        return window.innerWidth >= DESKTOP_MIN_WIDTH ? DESKTOP_NEWS_ITEMS : MOBILE_NEWS_ITEMS;
    }

    function getLayoutElements() {
        const leftColumn = document.getElementById('home-main-column');
        const rightColumn = document.getElementById('home-sidebar-column');
        const videoBlock = document.getElementById('home-video-block');
        return { leftColumn, rightColumn, videoBlock };
    }

    function resetSidebarStyles() {
        const { rightColumn, videoBlock } = getLayoutElements();
        if (rightColumn) {
            rightColumn.style.height = '';
            rightColumn.style.overflow = '';
            rightColumn.style.boxSizing = '';
        }
        if (videoBlock) {
            videoBlock.style.marginTop = `${BASE_VIDEO_GAP}px`;
            videoBlock.style.flex = '';
        }
        newsList.style.maxHeight = '';
        newsList.style.overflowY = '';
        newsList.style.margin = '';
        newsList.style.padding = '';
        newsList.style.listStyle = '';
        newsList.style.flex = '';
        newsList.style.minHeight = '';
        if (moreNewsWrapper) {
            moreNewsWrapper.style.maxHeight = '';
            moreNewsWrapper.style.overflow = '';
            moreNewsWrapper.style.flex = '';
        }
    }

    function fitSidebarHeightOnDesktop() {
        const { leftColumn, rightColumn, videoBlock } = getLayoutElements();
        if (!leftColumn || !rightColumn || !videoBlock) {
            return;
        }

        if (window.innerWidth < DESKTOP_MIN_WIDTH) {
            resetSidebarStyles();
            return;
        }

        const leftHeight = Math.round(leftColumn.getBoundingClientRect().height);
        if (!Number.isFinite(leftHeight) || leftHeight <= 0) {
            resetSidebarStyles();
            return;
        }

        rightColumn.style.height = `${leftHeight}px`;
        rightColumn.style.overflow = 'hidden';
        rightColumn.style.boxSizing = 'border-box';
        videoBlock.style.marginTop = 'auto';
        videoBlock.style.flex = '0 0 auto';

        newsList.style.margin = '0';
        newsList.style.padding = '0';
        newsList.style.listStyle = 'none';
        newsList.style.flex = '1 1 auto';
        newsList.style.minHeight = '0';
        newsList.style.maxHeight = 'none';
        newsList.style.overflowY = 'hidden';

        if (moreNewsWrapper) {
            moreNewsWrapper.style.flex = '0 0 auto';
        }
    }

    function scheduleSidebarFit() {
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                fitSidebarHeightOnDesktop();
            });
        });
    }

    function renderNewsList(recentNews, lang) {
        newsList.innerHTML = '';

        recentNews.forEach(item => {
            const li = document.createElement('li');
            const title = lang === 'en' ? (item.title_en || item.title) : (item.title || item.title_en);
            const formattedDate = formatDate(item.publish_date, lang);

            li.innerHTML = `
                <a href="/news/detail.html?id=${encodeURIComponent(item.id)}&lang=${lang}" class="block group hover:bg-gray-50 p-2 rounded transition-colors duration-150">
                    <span title="${title}" class="font-medium text-blue-700 group-hover:text-blue-900 group-hover:underline" style="display:-webkit-box; -webkit-line-clamp:2; line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; text-overflow:ellipsis; line-height:1.45; max-height:2.9em;">${title}</span>
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
        scheduleSidebarFit();
    }

    function renderNews(items, lang) {
        latestNews = Array.isArray(items) ? items : [];
        latestLang = lang;
        updateMoreNewsLink(lang);

        if (!latestNews.length) {
            renderNoNews(lang);
            return;
        }

        const fixedCount = Math.max(1, getDisplayCount());
        renderNewsList(latestNews.slice(0, fixedCount), lang);
        scheduleSidebarFit();
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
        scheduleSidebarFit();
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
            scheduleSidebarFit();
        });
    }

    const videoIframe = document.querySelector('#home-video-block iframe');
    if (videoIframe) {
        videoIframe.addEventListener('load', () => {
            scheduleSidebarFit();
        });
    }

    window.addEventListener('load', () => {
        scheduleSidebarFit();
    });

    if (typeof ResizeObserver === 'function') {
        const { leftColumn } = getLayoutElements();
        const observer = new ResizeObserver(() => {
            scheduleSidebarFit();
        });
        if (leftColumn) observer.observe(leftColumn);
    }

});
