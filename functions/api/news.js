import { createResponse, createErrorResponse, initDatabase } from './admin/utils.js';

// GET /api/news - public news list
export async function onRequestGet(context) {
    const { env, request } = context;

    try {
        const db = env.DB;
        if (!db) {
            return createErrorResponse('数据库未绑定', 500);
        }

        const url = new URL(request.url);
        const lite = url.searchParams.get('lite') === '1';

        await initDatabase(db);

        const query = lite
            ? `
                SELECT
                    id,
                    title,
                    title_en,
                    summary,
                    summary_en,
                    substr(coalesce(content, ''), 1, 320) as content_preview,
                    substr(coalesce(content_en, ''), 1, 320) as content_en_preview,
                    author,
                    publish_date,
                    featured_image,
                    category,
                    tags,
                    status,
                    scheduled_publish_at,
                    created_at,
                    updated_at
                FROM news
                WHERE status = 'published'
                   OR (status = 'scheduled' AND scheduled_publish_at IS NOT NULL AND datetime(scheduled_publish_at) <= datetime('now'))
                ORDER BY COALESCE(scheduled_publish_at, publish_date) DESC, created_at DESC
            `
            : `
                SELECT id, title, title_en, summary, summary_en, content, content_en, author, publish_date, featured_image, category, tags, status,
                       scheduled_publish_at, submitted_at, reviewed_by, reviewed_at,
                       created_at, updated_at
                FROM news
                WHERE status = 'published'
                   OR (status = 'scheduled' AND scheduled_publish_at IS NOT NULL AND datetime(scheduled_publish_at) <= datetime('now'))
                ORDER BY COALESCE(scheduled_publish_at, publish_date) DESC, created_at DESC
            `;

        const result = await db.prepare(query).all();

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
