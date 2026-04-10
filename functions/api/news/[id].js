import { createResponse, createErrorResponse, initDatabase } from '../admin/utils.js';

// GET /api/news/[id] - public news detail
export async function onRequestGet(context) {
    const { env, params } = context;

    try {
        const db = env.DB;
        if (!db) {
            return createErrorResponse('数据库未绑定', 500);
        }

        const id = parseInt(params.id || '', 10);
        if (!Number.isInteger(id) || id <= 0) {
            return createErrorResponse('无效的新闻 ID', 400);
        }

        await initDatabase(db);

        const news = await db.prepare(`
                        SELECT id, title, summary, content, author, publish_date, featured_image, category, tags, status,
                                     scheduled_publish_at, submitted_at, reviewed_by, reviewed_at,
                                     created_at, updated_at
            FROM news
                        WHERE id = ?
                            AND (
                                status = 'published'
                                OR (status = 'scheduled' AND scheduled_publish_at IS NOT NULL AND datetime(scheduled_publish_at) <= datetime('now'))
                            )
        `).bind(id).first();

        if (!news) {
            return createErrorResponse('新闻不存在', 404);
        }

        return createResponse({ news });
    } catch (error) {
        console.error('获取公开新闻详情失败:', error);
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
