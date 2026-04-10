// api_news.js - 从后台API加载新闻数据

document.addEventListener('DOMContentLoaded', function() {
    const newsList = document.getElementById('news-list');

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

        // 1 unit ~= one title line in sidebar; +1 accounts for date line.
        return Math.max(2, Math.ceil(visualWidth / 22) + 1);
    }

    function pickRecentNewsByBudget(items, lang) {
        const budget = 15;
        const minItems = 2;
        const maxItems = 5;
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

    function renderNews(items, lang) {
        newsList.innerHTML = '';

        if (items.length > 0) {
            const recentNews = pickRecentNewsByBudget(items, lang);

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

            const moreNewsLi = document.createElement('li');
            moreNewsLi.className = 'pt-2';
            moreNewsLi.innerHTML = `
                <a href="/news/total.html?lang=${lang}" class="text-sm text-blue-600 hover:underline font-medium" data-lang-key="newsMoreLink">${lang === 'en' ? 'More news »' : '查看所有新闻 »'}</a>
            `;
            newsList.appendChild(moreNewsLi);
        } else {
            const li = document.createElement('li');
            li.innerHTML = `
                <div class="block p-2 rounded">
                    <span class="text-gray-500">${lang === 'en' ? 'No news yet.' : '暂无新闻。'}</span>
                </div>
            `;
            newsList.appendChild(li);
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
});
