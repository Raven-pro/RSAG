import { authenticate, logActivity, createResponse, createErrorResponse, initDatabase } from './utils.js';

// GET /api/admin/team
export async function onRequestGet(context) {
    const { request, env } = context;

    try {
        await authenticate(request, env);

        const url = new URL(request.url);
        const search = (url.searchParams.get('search') || '').trim();

        const db = env.DB;
        await initDatabase(db);

        let query = 'SELECT * FROM team_members';
        const params = [];

        if (search) {
            query += ' WHERE name LIKE ? OR title LIKE ? OR research_area LIKE ?';
            params.push(`%${search}%`, `%${search}%`, `%${search}%`);
        }

        query += ' ORDER BY order_index ASC, created_at DESC';

        const result = await db.prepare(query).bind(...params).all();
        return createResponse({ team: result.results || [] });
    } catch (error) {
        return createErrorResponse(error.message);
    }
}

// POST /api/admin/team
export async function onRequestPost(context) {
    const { request, env } = context;

    try {
        const user = await authenticate(request, env);
        const db = env.DB;
        await initDatabase(db);

        const data = await request.json();
        if (!data.name || !data.title) {
            return createErrorResponse('缺少必填字段', 400);
        }

        const result = await db.prepare(`
            INSERT INTO team_members (
                name,
                title,
                bio,
                research_area,
                photo_url,
                email,
                phone,
                order_index,
                status,
                created_by
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
            data.name,
            data.title,
            data.bio || null,
            data.research_area || null,
            data.photo_url || null,
            data.email || null,
            data.phone || null,
            data.order_index || 0,
            data.status || 'active',
            user.username
        ).run();

        await logActivity(db, '添加成员', 'team_members', result.meta.last_row_id, user.username, `添加成员: ${data.name}`);

        return createResponse({ id: result.meta.last_row_id, message: '成员添加成功' }, 201);
    } catch (error) {
        return createErrorResponse(error.message);
    }
}

export async function onRequestOptions() {
    return new Response(null, {
        status: 200,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        }
    });
}
