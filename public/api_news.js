// api_news.js - 从后台API加载新闻数据

document.addEventListener('DOMContentLoaded', function() {
    const newsList = document.getElementById('news-list');

    if (!newsList) {
        console.error('错误：未能找到 ID 为 "news-list" 的新闻列表容器。');
        return;
    }

    // 从API加载新闻数据
    fetch('/api/news')
        .then(response => {
            if (!response.ok) {
                throw new Error(`加载新闻数据失败。状态码: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            const news = data.news || [];
            
            // 清空加载提示
            newsList.innerHTML = '';
            
            if (news.length > 0) {
                // 只显示最近5条新闻
                const recentNews = news.slice(0, 5);
                
                recentNews.forEach(item => {
                    const li = document.createElement('li');
                    
                    // 格式化日期
                    const publishDate = new Date(item.publish_date);
                    const formattedDate = publishDate.toLocaleDateString('zh-CN', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                    });
                    
                    li.innerHTML = `
                        <a href="/news/item${item.id}.html" class="block group hover:bg-gray-50 p-2 rounded transition-colors duration-150">
                            <span class="font-medium text-blue-700 group-hover:text-blue-900 group-hover:underline">${item.title}</span><br>
                            <span class="text-sm text-gray-500">${formattedDate}</span>
                        </a>
                    `;
                    
                    newsList.appendChild(li);
                });
                
                // 添加"查看所有新闻"链接
                const moreNewsLi = document.createElement('li');
                moreNewsLi.className = 'pt-2';
                moreNewsLi.innerHTML = `
                    <a href="/news/total.html" class="text-sm text-blue-600 hover:underline font-medium" data-lang-key="newsMoreLink">查看所有新闻 »</a>
                `;
                newsList.appendChild(moreNewsLi);
                
            } else {
                // 没有新闻
                const li = document.createElement('li');
                li.innerHTML = `
                    <div class="block p-2 rounded">
                        <span class="text-gray-500">暂无新闻。</span>
                    </div>
                `;
                newsList.appendChild(li);
            }

        })
        .catch(error => {
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
});
