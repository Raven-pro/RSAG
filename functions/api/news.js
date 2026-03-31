import { createResponse, createErrorResponse, initDatabase } from './admin/utils.js';

// GET /api/news - public news list
export async function onRequestGet(context) {
    const { env } = context;

    try {
        const db = env.DB;
        if (!db) {
            return createErrorResponse('数据库未绑定', 500);
        }

        await initDatabase(db);

        const result = await db.prepare(`
            SELECT id, title, summary, content, author, publish_date, featured_image, category, tags, status, created_at, updated_at
            FROM news
            WHERE status = 'published'
            ORDER BY publish_date DESC, created_at DESC
        `).all();

        return createResponse({ news: result.results || [] });
    } catch (error) {
        console.error('获取公开新闻列表失败:', error);
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
