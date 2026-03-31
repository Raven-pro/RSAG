import { createResponse, createErrorResponse, initDatabase } from './admin/utils.js';

// GET /api/team - public team list
export async function onRequestGet(context) {
    const { env } = context;

    try {
        const db = env.DB;
        if (!db) {
            return createErrorResponse('数据库未绑定', 500);
        }

        await initDatabase(db);

        const result = await db.prepare(`
            SELECT id, name, title, research_area, photo_url, status, order_index, created_at, updated_at
            FROM team_members
            ORDER BY order_index ASC, id ASC
        `).all();

        return createResponse({ team: result.results || [] });
    } catch (error) {
        console.error('获取公开团队列表失败:', error);
        return createErrorResponse(error.message);
    }
}

export async function onRequestOptions() {
    return new Response(null, {
        status: 200,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        }
    });
}
