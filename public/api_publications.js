// api_publications.js - 从后台API加载论文数据

document.addEventListener('DOMContentLoaded', function() {
    const previewList = document.getElementById('publication-preview-list');

    if (!previewList) {
        console.error('错误：未能找到 ID 为 "publication-preview-list" 的预览列表容器。');
        return;
    }

    const placeholderItems = previewList.querySelectorAll('li');
    const targetLi1 = placeholderItems.length > 0 ? placeholderItems[0] : null;
    const targetLi2 = placeholderItems.length > 1 ? placeholderItems[1] : null;

    if (!targetLi1) {
        console.error('错误：未能找到第一个占位符列表项。');
        return;
    }

    const targetLiClasses = 'bg-white p-4 rounded-md shadow-sm border border-gray-200';

    // 从API加载论文数据
    fetch('/api/publications?lite=1')
        .then(response => {
            if (!response.ok) {
                throw new Error(`加载论文数据失败。状态码: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            const publications = data.publications || [];
            
            // 处理第一个占位符
            targetLi1.classList.remove('publication-loading');
            targetLi1.classList.add(...targetLiClasses.split(' '));

            if (publications.length > 0) {
                const pub1 = publications[0];
                targetLi1.innerHTML = `
                    <p class="text-gray-700">
                        <strong>${pub1.title}</strong><br>
                        ${pub1.authors}<br>
                        <em>${pub1.journal}</em>, ${pub1.year}
                        ${pub1.doi ? `<br>DOI: <a href="https://doi.org/${pub1.doi}" target="_blank" class="text-blue-600 hover:underline">${pub1.doi}</a>` : ''}
                    </p>
                `;
            } else {
                targetLi1.innerHTML = '<p class="content-placeholder text-gray-700">暂无论文发表。</p>';
            }

            // 处理第二个占位符
            if (targetLi2) {
                targetLi2.classList.remove('publication-loading');
                targetLi2.classList.add(...targetLiClasses.split(' '));

                if (publications.length > 1) {
                    const pub2 = publications[1];
                    targetLi2.innerHTML = `
                        <p class="text-gray-700">
                            <strong>${pub2.title}</strong><br>
                            ${pub2.authors}<br>
                            <em>${pub2.journal}</em>, ${pub2.year}
                            ${pub2.doi ? `<br>DOI: <a href="https://doi.org/${pub2.doi}" target="_blank" class="text-blue-600 hover:underline">${pub2.doi}</a>` : ''}
                        </p>
                    `;
                    targetLi2.style.display = '';
                } else {
                    targetLi2.style.display = 'none';
                    console.log('信息：只找到一篇论文，已隐藏第二个预览占位符。');
                }
            }

        })
        .catch(error => {
            console.error('错误：获取论文数据时出错:', error);

            // 处理第一个占位符的出错状态
            targetLi1.classList.remove('publication-loading');
            targetLi1.classList.add(...targetLiClasses.split(' '));
            targetLi1.classList.add('publication-error');
            targetLi1.innerHTML = `<p class="content-placeholder text-gray-700">加载论文时出错: ${error.message}</p>`;

            // 隐藏第二个占位符
            if (targetLi2) {
                targetLi2.style.display = 'none';
            }
        });
});
