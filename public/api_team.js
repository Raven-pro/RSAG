// api_team.js - 从后台API加载团队成员数据

document.addEventListener('DOMContentLoaded', function() {
    const teamGrid = document.getElementById('team-grid');

    if (!teamGrid) {
        console.error('错误：未能找到 ID 为 "team-grid" 的团队网格容器。');
        return;
    }

    // 从API加载团队成员数据
    fetch('/api/team')
        .then(response => {
            if (!response.ok) {
                throw new Error(`加载团队成员数据失败。状态码: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            // 调整为显示所有成员（包括 alumni/inactive）
            const teamAll = (data.team || []).map(m => ({
                ...m,
                // 兼容可能缺失的字段
                status: m.status || 'active'
            }));

            // 清空加载提示
            teamGrid.innerHTML = '';

            if (teamAll.length > 0) {
                teamAll.forEach(member => {
                    const memberDiv = document.createElement('div');
                    memberDiv.className = 'text-center bg-white p-6 rounded-lg shadow-sm border border-gray-200';

                    // 样式区分状态
                    const isLeader = (member.title || '').includes('教授') || (member.title || '').includes('研究员');
                    const imgBorderClass = isLeader ? 'border-2 border-tsinghua-purple' : '';

                    const statusBadge = (() => {
                        switch (member.status) {
                            case 'active':
                                return '<span class="inline-block px-2 py-1 text-xs rounded-full bg-green-100 text-green-700">在组</span>';
                            case 'alumni':
                                return '<span class="inline-block px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-700">已毕业</span>';
                            case 'inactive':
                                return '<span class="inline-block px-2 py-1 text-xs rounded-full bg-gray-200 text-gray-600">离组</span>';
                            default:
                                return '';
                        }
                    })();

                    memberDiv.innerHTML = `
                        <img src="${member.photo_url}" alt="${member.name}照片" class="w-24 h-24 rounded-full mx-auto mb-4 ${imgBorderClass}" onerror="this.src='https://placehold.co/150x150/cccccc/FFFFFF?text=Photo'">
                        <h3 class="text-lg font-semibold text-gray-800">${member.name}</h3>
                        <p class="${isLeader ? 'text-tsinghua-purple' : 'text-gray-600'}">${member.title || ''}</p>
                        <div class="mt-2">${statusBadge}</div>
                        ${member.research_area ? `<p class="text-sm text-gray-500 mt-2">${member.research_area}</p>` : ''}
                    `;

                    teamGrid.appendChild(memberDiv);
                });
            } else {
                // 没有团队成员
                const emptyDiv = document.createElement('div');
                emptyDiv.className = 'col-span-full text-center py-8';
                emptyDiv.innerHTML = `
                    <div class="text-gray-500">暂无团队成员信息。</div>
                `;
                teamGrid.appendChild(emptyDiv);
            }

        })
        .catch(error => {
            console.error('错误：获取团队成员数据时出错:', error);
            
            // 显示错误信息
            teamGrid.innerHTML = `
                <div class="col-span-full team-error text-center py-8">
                    <div class="text-red-500">加载团队成员时出错: ${error.message}</div>
                </div>
            `;
        });
});
