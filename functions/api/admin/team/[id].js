import { authenticate, logActivity, createResponse, createErrorResponse, initDatabase } from '../utils.js';

// GET /api/admin/team/:id
export async function onRequestGet(context) {
    const { request, env, params } = context;

    try {
        await authenticate(request, env);
        const db = env.DB;
        await initDatabase(db);

        const member = await db.prepare('SELECT * FROM team_members WHERE id = ?')
            .bind(params.id)
            .first();

        if (!member) {
            return createErrorResponse('成员不存在', 404);
        }

        return createResponse(member);
    } catch (error) {
        return createErrorResponse(error.message);
    }
}

// PUT /api/admin/team/:id
export async function onRequestPut(context) {
    const { request, env, params } = context;

    try {
        const user = await authenticate(request, env);
        const db = env.DB;
        await initDatabase(db);

        const existing = await db.prepare('SELECT * FROM team_members WHERE id = ?')
            .bind(params.id)
            .first();

        if (!existing) {
            return createErrorResponse('成员不存在', 404);
        }

        const data = await request.json();
        const name = data.name ?? existing.name;
        const title = data.title ?? existing.title;
        const bio = data.bio ?? existing.bio;
        const researchArea = data.research_area ?? existing.research_area;
        const photoUrl = data.photo_url ?? existing.photo_url;
        const email = data.email ?? existing.email;
        const phone = data.phone ?? existing.phone;
        const orderIndex = data.order_index ?? existing.order_index;
        const status = data.status ?? existing.status;

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
            researchArea || null,
            photoUrl || null,
            email || null,
            phone || null,
            orderIndex,
            status,
            params.id
        ).run();

        await logActivity(db, '更新成员', 'team_members', params.id, user.username, `更新成员: ${name}`);

        return createResponse({ message: '成员信息更新成功' });
    } catch (error) {
        return createErrorResponse(error.message);
    }
}

// DELETE /api/admin/team/:id
export async function onRequestDelete(context) {
    const { request, env, params } = context;

    try {
        const user = await authenticate(request, env);
        const db = env.DB;
        await initDatabase(db);

        const existing = await db.prepare('SELECT name FROM team_members WHERE id = ?')
            .bind(params.id)
            .first();

        if (!existing) {
            return createErrorResponse('成员不存在', 404);
        }

        await db.prepare('DELETE FROM team_members WHERE id = ?').bind(params.id).run();
        await logActivity(db, '删除成员', 'team_members', params.id, user.username, `删除成员: ${existing.name}`);

        return createResponse({ message: '成员删除成功' });
    } catch (error) {
        return createErrorResponse(error.message);
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
