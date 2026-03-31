import { authenticate, logActivity, createResponse, createErrorResponse, initDatabase } from '../utils.js';

// GET /api/admin/publications/:id
export async function onRequestGet(context) {
    const { request, env, params } = context;

    try {
        await authenticate(request, env);

        const db = env.DB;
        await initDatabase(db);

        const publication = await db.prepare('SELECT * FROM publications WHERE id = ?')
            .bind(params.id)
            .first();

        if (!publication) {
            return createErrorResponse('论文不存在', 404);
        }

        return createResponse(publication);
    } catch (error) {
        return createErrorResponse(error.message);
    }
}

// PUT /api/admin/publications/:id
export async function onRequestPut(context) {
    const { request, env, params } = context;

    try {
        const user = await authenticate(request, env);
        const db = env.DB;
        await initDatabase(db);

        const existing = await db.prepare('SELECT * FROM publications WHERE id = ?')
            .bind(params.id)
            .first();

        if (!existing) {
            return createErrorResponse('论文不存在', 404);
        }

        const data = await request.json();
        const title = data.title ?? existing.title;
        const authors = data.authors ?? existing.authors;
        const journal = data.journal ?? existing.journal;
        const year = data.year ?? existing.year;
        const volume = data.volume ?? existing.volume;
        const doi = data.doi ?? existing.doi;
        const url = data.url ?? existing.url;
        const pdfUrl = data.pdf_url ?? existing.pdf_url;
        const abstract = data.abstract ?? existing.abstract;
        const keywords = data.keywords ?? existing.keywords;
        const status = data.status ?? existing.status;

        await db.prepare(`
            UPDATE publications SET
                title = ?,
                authors = ?,
                journal = ?,
                year = ?,
                volume = ?,
                doi = ?,
                url = ?,
                pdf_url = ?,
                abstract = ?,
                keywords = ?,
                status = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `).bind(
            title,
            authors,
            journal,
            year,
            volume || null,
            doi || null,
            url || null,
            pdfUrl || null,
            abstract || null,
            keywords || null,
            status,
            params.id
        ).run();

        await logActivity(db, '更新论文', 'publications', params.id, user.username, `更新论文: ${title}`);

        return createResponse({ message: '论文更新成功' });
    } catch (error) {
        return createErrorResponse(error.message);
    }
}

// DELETE /api/admin/publications/:id
export async function onRequestDelete(context) {
    const { request, env, params } = context;

    try {
        const user = await authenticate(request, env);
        const db = env.DB;
        await initDatabase(db);

        const existing = await db.prepare('SELECT title FROM publications WHERE id = ?')
            .bind(params.id)
            .first();

        if (!existing) {
            return createErrorResponse('论文不存在', 404);
        }

        await db.prepare('DELETE FROM publications WHERE id = ?').bind(params.id).run();
        await logActivity(db, '删除论文', 'publications', params.id, user.username, `删除论文: ${existing.title}`);

        return createResponse({ message: '论文删除成功' });
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
