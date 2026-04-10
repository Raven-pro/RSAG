// api_team.js - 从后台API加载团队成员数据

document.addEventListener('DOMContentLoaded', function() {
    const teamGrid = document.getElementById('team-grid');
    const detailModal = document.createElement('div');
    detailModal.id = 'team-detail-modal';
    detailModal.style.cssText = 'display:none; position:fixed; inset:0; background:rgba(0,0,0,0.45); z-index:1200; padding:1rem;';
    detailModal.innerHTML = `
        <div style="max-width:700px; margin:4vh auto; background:#fff; border-radius:12px; border:1px solid #e2e8f0; box-shadow:0 20px 40px rgba(0,0,0,0.15); overflow:hidden;">
            <div style="display:flex; justify-content:space-between; align-items:center; padding:1rem 1.25rem; border-bottom:1px solid #e2e8f0;">
                <h3 id="team-detail-title" style="margin:0; color:#1f2937; font-size:1.25rem; font-weight:700;">成员详情</h3>
                <button id="team-detail-close" type="button" style="border:none; background:transparent; color:#64748b; font-size:1.5rem; line-height:1; cursor:pointer;">×</button>
            </div>
            <div id="team-detail-body" style="padding:1.25rem;"></div>
        </div>
    `;
    document.body.appendChild(detailModal);

    if (!teamGrid) {
        console.error('错误：未能找到 ID 为 "team-grid" 的团队网格容器。');
        return;
    }

    function escapeHtml(value) {
        return String(value || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function openMemberDetail(member) {
        const body = document.getElementById('team-detail-body');
        if (!body) return;

        const email = member.email ? `<a href="mailto:${escapeHtml(member.email)}" style="color:#2563eb; text-decoration:underline;">${escapeHtml(member.email)}</a>` : '<span style="color:#94a3b8;">未填写</span>';
        const phone = member.phone ? `<span>${escapeHtml(member.phone)}</span>` : '<span style="color:#94a3b8;">未填写</span>';
        const bio = member.bio ? escapeHtml(member.bio).replace(/\n/g, '<br>') : '<span style="color:#94a3b8;">暂无简介</span>';
        const research = member.research_area ? escapeHtml(member.research_area).replace(/\n/g, '<br>') : '<span style="color:#94a3b8;">未填写</span>';

        body.innerHTML = `
            <div style="display:flex; gap:1rem; flex-wrap:wrap; align-items:flex-start;">
                <img src="${escapeHtml(member.photo_url || 'https://placehold.co/150x150/cccccc/FFFFFF?text=Photo')}" alt="${escapeHtml(member.name)}照片" style="width:92px; height:92px; border-radius:50%; object-fit:cover; border:2px solid #e2e8f0;" onerror="this.src='https://placehold.co/150x150/cccccc/FFFFFF?text=Photo'">
                <div style="flex:1; min-width:220px;">
                    <div style="font-size:1.25rem; color:#111827; font-weight:700; margin-bottom:0.35rem;">${escapeHtml(member.name)}</div>
                    <div style="color:#6A0DAD; font-weight:600; margin-bottom:0.5rem;">${escapeHtml(member.title || '')}</div>
                    <div style="display:grid; grid-template-columns:110px 1fr; row-gap:0.5rem; column-gap:0.5rem; color:#374151; font-size:0.95rem;">
                        <div style="color:#64748b;">研究方向</div><div>${research}</div>
                        <div style="color:#64748b;">个人简介</div><div>${bio}</div>
                        <div style="color:#64748b;">邮箱</div><div>${email}</div>
                        <div style="color:#64748b;">电话</div><div>${phone}</div>
                    </div>
                </div>
            </div>
        `;

        detailModal.style.display = 'block';
        document.body.style.overflow = 'hidden';
    }

    function closeMemberDetail() {
        detailModal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }

    detailModal.addEventListener('click', (event) => {
        if (event.target === detailModal) {
            closeMemberDetail();
        }
    });

    const closeButton = document.getElementById('team-detail-close');
    if (closeButton) {
        closeButton.addEventListener('click', closeMemberDetail);
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
                    memberDiv.style.cursor = 'pointer';

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
                        <p class="text-xs text-blue-600 mt-3">点击查看详细信息</p>
                    `;

                    memberDiv.addEventListener('click', () => openMemberDetail(member));

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
