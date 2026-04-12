import { authenticate, requireAdmin, logActivity, createResponse, createErrorResponse, initDatabase } from '../utils.js';
import { resolveUploadsBucket } from '../file-utils.js';

function parseKeepDays(value) {
    const days = Number.parseInt(value || '', 10);
    if (!Number.isInteger(days)) {
        return 7;
    }
    return Math.min(Math.max(days, 0), 365);
}

// POST /api/admin/files/cleanup
export async function onRequestPost(context) {
    const { request, env } = context;

    try {
        const user = await authenticate(request, env);
        requireAdmin(user);

        const payload = await request.json();
        const keepDays = parseKeepDays(payload?.keepDays);
        const cutoffDate = new Date(Date.now() - keepDays * 24 * 60 * 60 * 1000).toISOString();

        const db = env.DB;
        await initDatabase(db);

        const candidates = await db.prepare(`
            SELECT id, filename, original_name
            FROM files
            WHERE lifecycle_status = 'pending_delete'
              AND deleted_at IS NOT NULL
              AND datetime(deleted_at) <= datetime(?)
            ORDER BY deleted_at ASC, id ASC
        `).bind(cutoffDate).all();

        const rows = candidates.results || [];
        if (!rows.length) {
            return createResponse({
                message: '回收站暂无可清理文件',
                keepDays,
                deletedCount: 0,
                failedCount: 0
            });
        }

        const bucket = resolveUploadsBucket(env);
        let deletedCount = 0;
        let failedCount = 0;

        for (const item of rows) {
            const id = Number.parseInt(item.id, 10);
            if (!Number.isInteger(id) || id <= 0) {
                failedCount += 1;
                continue;
            }

            try {
                if (bucket && item.filename) {
                    await bucket.delete(String(item.filename).replace(/^\/+/, ''));
                }

                await db.prepare('DELETE FROM file_references WHERE file_id = ?').bind(id).run();
                await db.prepare('DELETE FROM files WHERE id = ?').bind(id).run();

                await logActivity(
                    db,
                    '清理回收站文件',
                    'files',
                    id,
                    user.username,
                    `彻底删除文件: ${item.original_name || item.filename || id}`
                );

                deletedCount += 1;
            } catch (cleanupError) {
                failedCount += 1;
                console.error(`清理回收站文件失败 id=${id}:`, cleanupError);
            }
        }

        return createResponse({
            message: `清理完成，成功 ${deletedCount} 个，失败 ${failedCount} 个`,
            keepDays,
            deletedCount,
            failedCount
        });
    } catch (error) {
        console.error('清理回收站失败:', error);
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
