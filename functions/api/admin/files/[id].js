import { authenticate, isAdminUser, requireAdmin, logActivity, createResponse, createErrorResponse, initDatabase } from '../utils.js';
import { resolveUploadsBucket } from '../file-utils.js';

// GET /api/admin/files/[id]
export async function onRequestGet(context) {
    const { request, env, params } = context;

    try {
        const user = await authenticate(request, env);
        requireAdmin(user);

        const id = Number.parseInt(params.id || '', 10);
        if (!Number.isInteger(id) || id <= 0) {
            return createErrorResponse('无效的文件 ID', 400);
        }

        const db = env.DB;
        await initDatabase(db);

        const file = await db.prepare(`
            SELECT id, filename, original_name, file_url, file_type, file_size, category, uploaded_by, created_at
            FROM files
            WHERE id = ?
        `).bind(id).first();

        if (!file) {
            return createErrorResponse('文件不存在', 404);
        }

        return createResponse(file);
    } catch (error) {
        console.error('获取文件详情失败:', error);
        return createErrorResponse(error.message, error.status || 500);
    }
}

// DELETE /api/admin/files/[id]
export async function onRequestDelete(context) {
    const { request, env, params } = context;

    try {
        const user = await authenticate(request, env);
        const isAdmin = isAdminUser(user);

        const id = Number.parseInt(params.id || '', 10);
        if (!Number.isInteger(id) || id <= 0) {
            return createErrorResponse('无效的文件 ID', 400);
        }

        const db = env.DB;
        await initDatabase(db);

        const existing = await db.prepare('SELECT filename, original_name, uploaded_by, category FROM files WHERE id = ?').bind(id).first();
        if (!existing) {
            return createErrorResponse('文件不存在', 404);
        }

        if (!isAdmin) {
            const owner = String(existing.uploaded_by || '');
            if (owner !== String(user.username || '')) {
                return createErrorResponse('只能删除自己上传的文件', 403);
            }

            const category = String(existing.category || '').toLowerCase();
            if (!['news', 'avatar'].includes(category)) {
                return createErrorResponse('仅允许删除自己上传的新闻/头像文件', 403);
            }
        }

        const bucket = resolveUploadsBucket(env);
        if (bucket && existing.filename) {
            await bucket.delete(String(existing.filename).replace(/^\/+/, ''));
        }

        await db.prepare('DELETE FROM files WHERE id = ?').bind(id).run();

        await logActivity(
            db,
            isAdmin ? '删除文件' : '删除自己上传的文件',
            'files',
            id,
            user.username,
            `删除文件: ${existing.original_name || existing.filename}`
        );

        return createResponse({ message: '文件删除成功' });
    } catch (error) {
        console.error('删除文件失败:', error);
        return createErrorResponse(error.message, error.status || 500);
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
