import { createResponse, createErrorResponse, initDatabase } from './admin/utils.js';

// GET /api/publications - public publications list
export async function onRequestGet(context) {
    const { env } = context;

    try {
        const db = env.DB;
        if (!db) {
            return createErrorResponse('数据库未绑定', 500);
        }

        await initDatabase(db);

        const result = await db.prepare(`
            SELECT id, title, authors, journal, year, volume, doi, url, abstract, keywords, status, created_at, updated_at
            FROM publications
            WHERE status = 'published'
            ORDER BY year DESC, created_at DESC
        `).all();

        return createResponse({ publications: result.results || [] });
    } catch (error) {
        console.error('获取公开论文列表失败:', error);
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
