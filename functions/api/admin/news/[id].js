import { authenticate, logActivity, createResponse, createErrorResponse, initDatabase } from '../utils.js';
import { normalizeWorkflowStatus, buildWorkflowOnUpdate } from '../workflow.js';

function hydrateNewsRow(row) {
    return {
        ...row,
        status: normalizeWorkflowStatus(row?.status, 'draft')
    };
}

// GET /api/admin/news/[id]
export async function onRequestGet(context) {
    const { request, env, params } = context;

    try {
        await authenticate(request, env);

        const id = parseInt(params.id || '', 10);
        if (!Number.isInteger(id) || id <= 0) {
            return createErrorResponse('无效的新闻 ID', 400);
        }

        const db = env.DB;
        await initDatabase(db);

        const news = await db.prepare('SELECT * FROM news WHERE id = ?').bind(id).first();
        if (!news) {
            return createErrorResponse('新闻不存在', 404);
        }

        return createResponse(hydrateNewsRow(news));
    } catch (error) {
        console.error('获取新闻失败:', error);
        return createErrorResponse(error.message);
    }
}

// PUT /api/admin/news/[id]
export async function onRequestPut(context) {
    const { request, env, params } = context;

    try {
        const user = await authenticate(request, env);

        const id = parseInt(params.id || '', 10);
        if (!Number.isInteger(id) || id <= 0) {
            return createErrorResponse('无效的新闻 ID', 400);
        }

        const data = await request.json();
        const {
            title, summary, content, author, publish_date,
            title_en, summary_en, content_en,
            featured_image, category, tags, status,
            scheduled_publish_at
        } = data;

        if (!title || !content || !author || !publish_date || !title_en || !content_en) {
            return createErrorResponse('缺少必填字段（中英文标题与正文都需要填写）', 400);
        }

        const db = env.DB;
        await initDatabase(db);

        const existing = await db.prepare('SELECT * FROM news WHERE id = ?').bind(id).first();
        if (!existing) {
            return createErrorResponse('新闻不存在', 404);
        }

        const workflow = buildWorkflowOnUpdate({
            existing,
            status,
            scheduledPublishAt: scheduled_publish_at,
            username: user.username
        });

        await db.prepare(`
            UPDATE news SET
                title = ?, title_en = ?, summary = ?, summary_en = ?, content = ?, content_en = ?, author = ?, publish_date = ?,
                featured_image = ?, category = ?, tags = ?, status = ?,
                scheduled_publish_at = ?, submitted_at = ?, reviewed_by = ?, reviewed_at = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `).bind(
            title, title_en, summary || null, summary_en || null, content, content_en, author, publish_date,
            featured_image || null, category, tags || null,
            workflow.status, workflow.scheduled_publish_at, workflow.submitted_at, workflow.reviewed_by, workflow.reviewed_at,
            id
        ).run();

        await logActivity(db, '更新新闻', 'news', id, user.username, `更新新闻: ${title}`);

        return createResponse({
            message: '新闻更新成功',
            frontend_url: `/news/detail.html?id=${id}`
        });
    } catch (error) {
        console.error('更新新闻失败:', error);
        return createErrorResponse(error.message);
    }
}

// DELETE /api/admin/news/[id]
export async function onRequestDelete(context) {
    const { request, env, params } = context;

    try {
        const user = await authenticate(request, env);

        const id = parseInt(params.id || '', 10);
        if (!Number.isInteger(id) || id <= 0) {
            return createErrorResponse('无效的新闻 ID', 400);
        }

        const db = env.DB;
        await initDatabase(db);

        const existing = await db.prepare('SELECT title FROM news WHERE id = ?').bind(id).first();
        if (!existing) {
            return createErrorResponse('新闻不存在', 404);
        }

        await db.prepare('DELETE FROM news WHERE id = ?').bind(id).run();

        await logActivity(db, '删除新闻', 'news', id, user.username, `删除新闻: ${existing.title}`);

        return createResponse({ message: '新闻删除成功' });
    } catch (error) {
        console.error('删除新闻失败:', error);
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
