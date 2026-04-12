import { authenticate, requireAdmin, logActivity, createResponse, createErrorResponse, initDatabase } from '../../utils.js';
import { reorderTeamMembers } from '../../team-order.js';

function parseDirection(value) {
    const direction = String(value || '').trim().toLowerCase();
    if (direction === 'up' || direction === 'down') {
        return direction;
    }
    return null;
}

// POST /api/admin/team/[id]/move
export async function onRequestPost(context) {
    const { request, env, params } = context;

    try {
        const user = await authenticate(request, env);
        requireAdmin(user);

        const id = Number.parseInt(params.id || '', 10);
        if (!Number.isInteger(id) || id <= 0) {
            return createErrorResponse('无效的成员 ID', 400);
        }

        const payload = await request.json();
        const direction = parseDirection(payload?.direction);
        if (!direction) {
            return createErrorResponse('无效的移动方向', 400);
        }

        const db = env.DB;
        await initDatabase(db);

        const rows = await db.prepare(`
            SELECT id, name, order_index
            FROM team_members
            ORDER BY order_index ASC, id ASC
        `).all();

        const members = rows.results || [];
        const currentIndex = members.findIndex((member) => Number.parseInt(member.id, 10) === id);

        if (currentIndex < 0) {
            return createErrorResponse('成员不存在', 404);
        }

        const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
        if (targetIndex < 0 || targetIndex >= members.length) {
            return createResponse({
                message: direction === 'up' ? '成员已经在最前面' : '成员已经在最后面',
                changed: false
            });
        }

        const targetOrder = targetIndex + 1;
        await reorderTeamMembers(db, id, targetOrder);

        const memberName = String(members[currentIndex]?.name || id);
        await logActivity(
            db,
            direction === 'up' ? '成员上移' : '成员下移',
            'team_members',
            id,
            user.username,
            `${memberName}${direction === 'up' ? '上移' : '下移'}到第 ${targetOrder} 位`
        );

        return createResponse({
            message: '成员顺序已更新',
            changed: true,
            order_index: targetOrder
        });
    } catch (error) {
        console.error('调整成员顺序失败:', error);
        return createErrorResponse(error.message, error.status || 500);
    }
}

export async function onRequestOptions() {
    return new Response(null, {
        status: 200,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        }
    });
}
