import { authenticate, logActivity, createResponse, createErrorResponse, initDatabase } from '../utils.js';

// GET /api/admin/news/:id
export async function onRequestGet(context) {
    const { request, env, params } = context;

    try {
        await authenticate(request, env);

        const db = env.DB;
        await initDatabase(db);

        const news = await db.prepare('SELECT * FROM news WHERE id = ?')
            .bind(params.id)
            .first();

        if (!news) {
            return createErrorResponse('新闻不存在', 404);
        }

        return createResponse(news);
    } catch (error) {
        return createErrorResponse(error.message);
    }
}

// PUT /api/admin/news/:id
export async function onRequestPut(context) {
    const { request, env, params } = context;

    try {
        const user = await authenticate(request, env);
        const db = env.DB;
        await initDatabase(db);

        const existing = await db.prepare('SELECT * FROM news WHERE id = ?')
            .bind(params.id)
            .first();

        if (!existing) {
            return createErrorResponse('新闻不存在', 404);
        }

        const data = await request.json();
        const title = data.title ?? existing.title;
        const summary = data.summary ?? existing.summary;
        const content = data.content ?? existing.content;
        const author = data.author ?? existing.author;
        const publishDate = data.publish_date ?? existing.publish_date;
        const featuredImage = data.featured_image ?? existing.featured_image;
        const category = data.category ?? existing.category;
        const tags = data.tags ?? existing.tags;
        const status = data.status ?? existing.status;

        await db.prepare(`
            UPDATE news SET
                title = ?,
                summary = ?,
                content = ?,
                author = ?,
                publish_date = ?,
                featured_image = ?,
                category = ?,
                tags = ?,
                status = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `).bind(
            title,
            summary || null,
            content,
            author,
            publishDate,
            featuredImage || null,
            category,
            tags || null,
            status,
            params.id
        ).run();

        await logActivity(db, '更新新闻', 'news', params.id, user.username, `更新新闻: ${title}`);

        return createResponse({ message: '新闻更新成功' });
    } catch (error) {
        return createErrorResponse(error.message);
    }
}

// DELETE /api/admin/news/:id
export async function onRequestDelete(context) {
    const { request, env, params } = context;

    try {
        const user = await authenticate(request, env);
        const db = env.DB;
        await initDatabase(db);

        const existing = await db.prepare('SELECT title FROM news WHERE id = ?')
            .bind(params.id)
            .first();

        if (!existing) {
            return createErrorResponse('新闻不存在', 404);
        }

        await db.prepare('DELETE FROM news WHERE id = ?').bind(params.id).run();
        await logActivity(db, '删除新闻', 'news', params.id, user.username, `删除新闻: ${existing.title}`);

        return createResponse({ message: '新闻删除成功' });
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
