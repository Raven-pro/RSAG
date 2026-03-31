import { authenticate, logActivity, createResponse, createErrorResponse, initDatabase } from '../utils.js';

// GET /api/admin/publications/[id]
export async function onRequestGet(context) {
    const { request, env, params } = context;

    try {
        await authenticate(request, env);

        const id = parseInt(params.id || '', 10);
        if (!Number.isInteger(id) || id <= 0) {
            return createErrorResponse('无效的论文 ID', 400);
        }

        const db = env.DB;
        await initDatabase(db);

        const publication = await db.prepare('SELECT * FROM publications WHERE id = ?').bind(id).first();
        if (!publication) {
            return createErrorResponse('论文不存在', 404);
        }

        return createResponse(publication);
    } catch (error) {
        console.error('获取论文失败:', error);
        return createErrorResponse(error.message);
    }
}

// PUT /api/admin/publications/[id]
export async function onRequestPut(context) {
    const { request, env, params } = context;

    try {
        const user = await authenticate(request, env);

        const id = parseInt(params.id || '', 10);
        if (!Number.isInteger(id) || id <= 0) {
            return createErrorResponse('无效的论文 ID', 400);
        }

        const data = await request.json();
        const {
            title, authors, journal, year, volume, doi, url,
            abstract, keywords, status
        } = data;

        const db = env.DB;
        await initDatabase(db);

        const existing = await db.prepare('SELECT * FROM publications WHERE id = ?').bind(id).first();
        if (!existing) {
            return createErrorResponse('论文不存在', 404);
        }

        await db.prepare(`
            UPDATE publications SET
                title = ?, authors = ?, journal = ?, year = ?, volume = ?,
                doi = ?, url = ?, abstract = ?, keywords = ?, status = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `).bind(
            title, authors, journal, year, volume || null, doi || null,
            url || null, abstract || null, keywords || null, status, id
        ).run();

        await logActivity(db, '更新论文', 'publications', id, user.username, `更新论文: ${title}`);

        return createResponse({
            message: '论文更新成功',
            frontend_url: '/publications-api.html'
        });
    } catch (error) {
        console.error('更新论文失败:', error);
        return createErrorResponse(error.message);
    }
}

// DELETE /api/admin/publications/[id]
export async function onRequestDelete(context) {
    const { request, env, params } = context;

    try {
        const user = await authenticate(request, env);

        const id = parseInt(params.id || '', 10);
        if (!Number.isInteger(id) || id <= 0) {
            return createErrorResponse('无效的论文 ID', 400);
        }

        const db = env.DB;
        await initDatabase(db);

        const existing = await db.prepare('SELECT title FROM publications WHERE id = ?').bind(id).first();
        if (!existing) {
            return createErrorResponse('论文不存在', 404);
        }

        await db.prepare('DELETE FROM publications WHERE id = ?').bind(id).run();

        await logActivity(db, '删除论文', 'publications', id, user.username, `删除论文: ${existing.title}`);

        return createResponse({ message: '论文删除成功' });
    } catch (error) {
        console.error('删除论文失败:', error);
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
