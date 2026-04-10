import { authenticate, createResponse, createErrorResponse, initDatabase, logActivity } from '../utils.js';
import { parseWorkflowStatusFilter, buildWorkflowOnUpdate } from '../workflow.js';

function parseIds(value) {
    if (!Array.isArray(value)) return [];
    const unique = [];
    for (const item of value) {
        const id = Number.parseInt(String(item), 10);
        if (id > 0 && !unique.includes(id)) {
            unique.push(id);
        }
    }
    return unique;
}

function buildInClause(count) {
    return new Array(count).fill('?').join(', ');
}

export async function onRequestPost(context) {
    const { request, env } = context;

    try {
        const user = await authenticate(request, env);
        const payload = await request.json();

        const ids = parseIds(payload?.ids);
        if (!ids.length) {
            return createErrorResponse('请至少选择一篇论文', 400);
        }

        const status = parseWorkflowStatusFilter(payload?.status);
        if (!status) {
            return createErrorResponse('请选择有效的目标状态', 400);
        }

        const scheduledPublishAt = payload?.scheduled_publish_at || null;

        const db = env.DB;
        await initDatabase(db);

        const rows = await db.prepare(`
            SELECT id, title, status, scheduled_publish_at, submitted_at, reviewed_by, reviewed_at
            FROM publications
            WHERE id IN (${buildInClause(ids.length)})
        `).bind(...ids).all();

        const records = rows.results || [];
        if (!records.length) {
            return createErrorResponse('未找到可更新的论文记录', 404);
        }

        for (const row of records) {
            const workflow = buildWorkflowOnUpdate({
                existing: row,
                status,
                scheduledPublishAt,
                username: user.username
            });

            await db.prepare(`
                UPDATE publications SET
                    status = ?,
                    scheduled_publish_at = ?,
                    submitted_at = ?,
                    reviewed_by = ?,
                    reviewed_at = ?,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            `).bind(
                workflow.status,
                workflow.scheduled_publish_at,
                workflow.submitted_at,
                workflow.reviewed_by,
                workflow.reviewed_at,
                row.id
            ).run();
        }

        await logActivity(
            db,
            '批量更新论文状态',
            'publications',
            null,
            user.username,
            `批量更新 ${records.length} 篇论文为 ${status}`
        );

        return createResponse({
            updated: records.length,
            status,
            ids,
            message: `已更新 ${records.length} 篇论文`
        });
    } catch (error) {
        console.error('批量更新论文状态失败:', error);
        return createErrorResponse(error.message);
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
