import { authenticate, logActivity, createResponse, createErrorResponse, initDatabase } from '../utils.js';

// GET /api/admin/files/:id
export async function onRequestGet(context) {
    const { request, env, params } = context;

    try {
        await authenticate(request, env);

        const db = env.DB;
        await initDatabase(db);

        const file = await db.prepare('SELECT * FROM files WHERE id = ?')
            .bind(params.id)
            .first();

        if (!file) {
            return createErrorResponse('文件不存在', 404);
        }

        return createResponse(file);
    } catch (error) {
        return createErrorResponse(error.message);
    }
}

// DELETE /api/admin/files/:id
export async function onRequestDelete(context) {
    const { request, env, params } = context;

    try {
        const user = await authenticate(request, env);

        const db = env.DB;
        await initDatabase(db);

        const existing = await db.prepare('SELECT original_name FROM files WHERE id = ?')
            .bind(params.id)
            .first();

        if (!existing) {
            return createErrorResponse('文件不存在', 404);
        }

        await db.prepare('DELETE FROM files WHERE id = ?').bind(params.id).run();
        await logActivity(db, '删除文件', 'files', params.id, user.username, `删除文件: ${existing.original_name}`);

        return createResponse({ message: '文件删除成功' });
    } catch (error) {
        return createErrorResponse(error.message);
    }
}

export async function onRequestOptions() {
    return new Response(null, {
        status: 200,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        }
    });
}
