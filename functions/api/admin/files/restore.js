import { authenticate, requireAdmin, logActivity, createResponse, createErrorResponse, initDatabase } from '../utils.js';

function parseFileId(value) {
    const id = Number.parseInt(value || '', 10);
    return Number.isInteger(id) && id > 0 ? id : null;
}

// POST /api/admin/files/restore
export async function onRequestPost(context) {
    const { request, env } = context;

    try {
        const user = await authenticate(request, env);
        requireAdmin(user);

        const payload = await request.json();
        const id = parseFileId(payload?.id);
        if (!id) {
            return createErrorResponse('无效的文件 ID', 400);
        }

        const db = env.DB;
        await initDatabase(db);

        const existing = await db.prepare(`
            SELECT id, original_name, category, lifecycle_status, reference_count
            FROM files
            WHERE id = ?
        `).bind(id).first();

        if (!existing) {
            return createErrorResponse('文件不存在', 404);
        }

        const status = String(existing.lifecycle_status || 'active').toLowerCase();
        if (status !== 'pending_delete') {
            return createResponse({ message: '文件当前不在回收站中' });
        }

        const referenceCount = Number.parseInt(existing.reference_count, 10) || 0;
        const category = String(existing.category || '').toLowerCase();
        const isOrphan = referenceCount === 0 && ['news', 'avatar', 'pdf'].includes(category) ? 1 : 0;

        await db.prepare(`
            UPDATE files
            SET lifecycle_status = 'active',
                is_orphan = ?,
                deleted_at = NULL,
                deleted_by = NULL,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `).bind(isOrphan, id).run();

        await logActivity(
            db,
            '恢复文件',
            'files',
            id,
            user.username,
            `恢复文件: ${existing.original_name || id}`
        );

        return createResponse({ message: '文件已恢复' });
    } catch (error) {
        console.error('恢复文件失败:', error);
        return createErrorResponse(error.message, error.status || 500);
    }
}

export async function onRequestOptions() {
    return new Response(null, {
        status: 200,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        }
    });
}
