import { authenticate, requireAdmin, logActivity, createResponse, createErrorResponse, initDatabase } from '../utils.js';

// GET /api/admin/team/[id]
export async function onRequestGet(context) {
    const { request, env, params } = context;

    try {
        const user = await authenticate(request, env);
        requireAdmin(user);

        const id = Number.parseInt(params.id || '', 10);
        if (!Number.isInteger(id) || id <= 0) {
            return createErrorResponse('无效的成员 ID', 400);
        }

        const db = env.DB;
        await initDatabase(db);

        const member = await db.prepare('SELECT * FROM team_members WHERE id = ?').bind(id).first();
        if (!member) {
            return createErrorResponse('成员不存在', 404);
        }

        return createResponse(member);
    } catch (error) {
        console.error('获取成员详情失败:', error);
        return createErrorResponse(error.message, error.status || 500);
    }
}

// PUT /api/admin/team/[id]
export async function onRequestPut(context) {
    const { request, env, params } = context;

    try {
        const user = await authenticate(request, env);
        requireAdmin(user);

        const id = Number.parseInt(params.id || '', 10);
        if (!Number.isInteger(id) || id <= 0) {
            return createErrorResponse('无效的成员 ID', 400);
        }

        const data = await request.json();
        const {
            name,
            title,
            bio,
            research_area,
            photo_url,
            email,
            phone,
            order_index,
            status
        } = data;

        const db = env.DB;
        await initDatabase(db);

        const existing = await db.prepare('SELECT id, name FROM team_members WHERE id = ?').bind(id).first();
        if (!existing) {
            return createErrorResponse('成员不存在', 404);
        }

        await db.prepare(`
            UPDATE team_members SET
                name = ?,
                title = ?,
                bio = ?,
                research_area = ?,
                photo_url = ?,
                email = ?,
                phone = ?,
                order_index = ?,
                status = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `).bind(
            name,
            title,
            bio || null,
            research_area || null,
            photo_url || null,
            email || null,
            phone || null,
            Number.parseInt(order_index, 10) || 1,
            status || 'active',
            id
        ).run();

        await logActivity(
            db,
            '更新成员',
            'team_members',
            id,
            user.username,
            `更新成员: ${name || existing.name}`
        );

        return createResponse({ message: '成员信息更新成功' });
    } catch (error) {
        console.error('更新成员失败:', error);
        return createErrorResponse(error.message, error.status || 500);
    }
}

// DELETE /api/admin/team/[id]
export async function onRequestDelete(context) {
    const { request, env, params } = context;

    try {
        const user = await authenticate(request, env);
        requireAdmin(user);

        const id = Number.parseInt(params.id || '', 10);
        if (!Number.isInteger(id) || id <= 0) {
            return createErrorResponse('无效的成员 ID', 400);
        }

        const db = env.DB;
        await initDatabase(db);

        const existing = await db.prepare('SELECT name FROM team_members WHERE id = ?').bind(id).first();
        if (!existing) {
            return createErrorResponse('成员不存在', 404);
        }

        await db.prepare('DELETE FROM team_members WHERE id = ?').bind(id).run();

        await logActivity(
            db,
            '删除成员',
            'team_members',
            id,
            user.username,
            `删除成员: ${existing.name}`
        );

        return createResponse({ message: '成员删除成功' });
    } catch (error) {
        console.error('删除成员失败:', error);
        return createErrorResponse(error.message, error.status || 500);
    }
}

export async function onRequestOptions() {
    return new Response(null, {
        status: 200,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        }
    });
}
