import { authenticate, isAdminUser, requireAdmin, logActivity, createResponse, createErrorResponse, initDatabase } from '../utils.js';
import { resolveUploadsBucket } from '../file-utils.js';
import { enrichFilesWithReferences } from './reference-resolver.js';

function parseBooleanFlag(value) {
    const text = String(value || '').trim().toLowerCase();
    return ['1', 'true', 'yes', 'y', 'on'].includes(text);
}

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
            SELECT
                id, filename, original_name, file_url, file_type, file_size, category,
                uploaded_by, lifecycle_status, reference_count, is_orphan, deleted_at, deleted_by,
                created_at, updated_at
            FROM files
            WHERE id = ?
        `).bind(id).first();

        if (!file) {
            return createErrorResponse('文件不存在', 404);
        }

        await enrichFilesWithReferences(db, [file]);

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
        const url = new URL(request.url);
        const hardDelete = parseBooleanFlag(url.searchParams.get('hard'));

        const id = Number.parseInt(params.id || '', 10);
        if (!Number.isInteger(id) || id <= 0) {
            return createErrorResponse('无效的文件 ID', 400);
        }

        const db = env.DB;
        await initDatabase(db);

        const existing = await db.prepare('SELECT filename, original_name, uploaded_by, category, reference_count, lifecycle_status FROM files WHERE id = ?').bind(id).first();
        if (!existing) {
            return createErrorResponse('文件不存在', 404);
        }

        const lifecycleStatus = String(existing.lifecycle_status || 'active').toLowerCase();
        if (lifecycleStatus === 'pending_delete' && !hardDelete) {
            return createResponse({ message: '文件已在回收站中' });
        }

        const referenceCount = Number.parseInt(existing.reference_count, 10) || 0;
        if (referenceCount > 0) {
            return createErrorResponse('文件仍被内容引用，暂不能删除', 409);
        }

        if (!isAdmin) {
            const owner = String(existing.uploaded_by || '');
            if (owner !== String(user.username || '')) {
                return createErrorResponse('只能删除自己上传的文件', 403);
            }

            const category = String(existing.category || '').toLowerCase();
            if (!['news', 'avatar', 'pdf'].includes(category)) {
                return createErrorResponse('仅允许删除自己上传的新闻/头像/PDF 文件', 403);
            }
        }

        if (lifecycleStatus === 'pending_delete' && hardDelete) {
            const bucket = resolveUploadsBucket(env);
            if (bucket && existing.filename) {
                await bucket.delete(String(existing.filename).replace(/^\/+/, ''));
            }

            await db.prepare('DELETE FROM file_references WHERE file_id = ?').bind(id).run();
            await db.prepare('DELETE FROM files WHERE id = ?').bind(id).run();

            await logActivity(
                db,
                isAdmin ? '彻底删除文件' : '自己上传文件彻底删除',
                'files',
                id,
                user.username,
                `彻底删除文件: ${existing.original_name || existing.filename}`
            );

            return createResponse({ message: '文件已彻底删除' });
        }

        await db.prepare(`
            UPDATE files
            SET lifecycle_status = 'pending_delete',
                deleted_at = CURRENT_TIMESTAMP,
                deleted_by = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `).bind(user.username, id).run();

        await logActivity(
            db,
            isAdmin ? '文件移入回收站' : '自己上传文件移入回收站',
            'files',
            id,
            user.username,
            `移入回收站: ${existing.original_name || existing.filename}`
        );

        return createResponse({ message: '文件已移入回收站' });
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
