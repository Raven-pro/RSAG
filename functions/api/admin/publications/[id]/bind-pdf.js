import {
    authenticate,
    isAdminUser,
    requireOwnerOrAdmin,
    logActivity,
    createResponse,
    createErrorResponse,
    initDatabase
} from '../../utils.js';
import { syncEntityFileReference } from '../../file-references.js';
import { normalizeWorkflowStatus } from '../../workflow.js';

function normalizeFileUrl(value) {
    return String(value || '').trim();
}

function isPdfFile(file = {}) {
    const fileType = String(file.file_type || '').toLowerCase();
    const category = String(file.category || '').toLowerCase();
    return category === 'pdf' || fileType === 'application/pdf' || fileType.includes('pdf');
}

// POST /api/admin/publications/[id]/bind-pdf
export async function onRequestPost(context) {
    const { request, env, params } = context;

    try {
        const user = await authenticate(request, env);
        const isAdmin = isAdminUser(user);

        const id = Number.parseInt(params.id || '', 10);
        if (!Number.isInteger(id) || id <= 0) {
            return createErrorResponse('无效的论文 ID', 400);
        }

        const payload = await request.json();
        const fileUrl = normalizeFileUrl(payload?.file_url);
        if (!fileUrl) {
            return createErrorResponse('缺少 PDF 文件链接', 400);
        }

        const db = env.DB;
        await initDatabase(db);

        const publication = await db.prepare(`
            SELECT id, title, created_by, pdf_url, status
            FROM publications
            WHERE id = ?
        `).bind(id).first();

        if (!publication) {
            return createErrorResponse('论文不存在', 404);
        }

        if (!isAdmin) {
            requireOwnerOrAdmin(user, publication.created_by, '只能绑定自己论文的PDF');
        }

        const currentStatus = normalizeWorkflowStatus(publication.status, 'draft');
        if (!isAdmin && currentStatus === 'pending_delete') {
            return createErrorResponse('该论文处于删除待审核状态，暂不可绑定 PDF', 409);
        }

        const targetFile = await db.prepare(`
            SELECT id, original_name, file_type, category, lifecycle_status
            FROM files
            WHERE file_url = ?
            ORDER BY id DESC
            LIMIT 1
        `).bind(fileUrl).first();

        if (!targetFile) {
            return createErrorResponse('文件库中未找到该 PDF，请先上传到文件库', 404);
        }

        if (String(targetFile.lifecycle_status || '').toLowerCase() === 'pending_delete') {
            return createErrorResponse('该 PDF 已在回收站中，无法绑定', 409);
        }

        if (!isPdfFile(targetFile)) {
            return createErrorResponse('该文件不是 PDF，无法绑定到论文', 400);
        }

        if (isAdmin) {
            await db.prepare(`
                UPDATE publications
                SET pdf_url = ?,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            `).bind(fileUrl, id).run();
        } else {
            if (currentStatus === 'draft') {
                await db.prepare(`
                    UPDATE publications
                    SET pdf_url = ?,
                        updated_at = CURRENT_TIMESTAMP
                    WHERE id = ?
                `).bind(fileUrl, id).run();
            } else {
                await db.prepare(`
                    UPDATE publications
                    SET pdf_url = ?,
                        status = 'pending_review',
                        submitted_at = CURRENT_TIMESTAMP,
                        reviewed_by = NULL,
                        reviewed_at = NULL,
                        updated_at = CURRENT_TIMESTAMP
                    WHERE id = ?
                `).bind(fileUrl, id).run();
            }
        }

        await syncEntityFileReference(db, {
            entityType: 'publications',
            entityId: id,
            fieldName: 'pdf_url',
            fileUrl
        });

        await logActivity(
            db,
            isAdmin ? '绑定论文PDF' : (currentStatus === 'draft' ? '绑定论文PDF（草稿）' : '绑定论文PDF并提交审核'),
            'publications',
            id,
            user.username,
            `${isAdmin ? '绑定论文PDF' : (currentStatus === 'draft' ? '绑定论文PDF（草稿）' : '绑定论文PDF并提交审核')}: ${publication.title} <- ${targetFile.original_name || 'PDF'}`
        );

        return createResponse({
            publicationId: id,
            url: fileUrl,
            message: isAdmin
                ? '论文 PDF 绑定成功'
                : (currentStatus === 'draft' ? '论文 PDF 已绑定，草稿状态保持不变' : '论文 PDF 已绑定并提交审核')
        });
    } catch (error) {
        console.error('绑定论文 PDF 失败:', error);
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
