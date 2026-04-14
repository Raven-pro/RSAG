import {
    authenticate,
    isAdminUser,
    requireOwnerOrAdmin,
    logActivity,
    createResponse,
    createErrorResponse,
    initDatabase
} from '../../utils.js';
import { assertUploadFile, buildPublicFileUrl, buildR2Key, resolveUploadsBucket } from '../../file-utils.js';
import { syncEntityFileReference } from '../../file-references.js';
import { normalizeWorkflowStatus } from '../../workflow.js';

function extractUploadsKeyFromUrl(fileUrl) {
    const text = String(fileUrl || '').trim();
    if (!text) return '';

    const marker = '/uploads/';

    try {
        const pathname = text.startsWith('http://') || text.startsWith('https://')
            ? new URL(text).pathname
            : text;
        const index = pathname.indexOf(marker);
        if (index < 0) return '';
        return decodeURIComponent(pathname.slice(index + marker.length).replace(/^\/+/, ''));
    } catch {
        const index = text.indexOf(marker);
        if (index < 0) return '';
        return text.slice(index + marker.length).replace(/^\/+/, '');
    }
}

// POST /api/admin/publications/[id]/upload-pdf
export async function onRequestPost(context) {
    const { request, env, params } = context;

    try {
        const user = await authenticate(request, env);
        const isAdmin = isAdminUser(user);

        const id = Number.parseInt(params.id || '', 10);
        if (!Number.isInteger(id) || id <= 0) {
            return createErrorResponse('无效的论文 ID', 400);
        }

        const formData = await request.formData();
        const file = formData.get('pdf');
        assertUploadFile(file, 'PDF 文件', {
            uploadType: 'pdf',
            mimeType: String(file?.type || 'application/octet-stream')
        });

        if (file.type !== 'application/pdf') {
            return createErrorResponse('仅支持 PDF 文件上传', 400);
        }

        const bucket = resolveUploadsBucket(env);
        if (!bucket) {
            return createErrorResponse('未配置 R2 存储桶绑定', 500);
        }

        const db = env.DB;
        await initDatabase(db);

        const existing = await db.prepare('SELECT id, created_by, pdf_url, status FROM publications WHERE id = ?').bind(id).first();
        if (!existing) {
            return createErrorResponse('论文不存在', 404);
        }

        if (!isAdmin) {
            requireOwnerOrAdmin(user, existing.created_by, '只能上传自己论文的PDF');
        }

        const currentStatus = normalizeWorkflowStatus(existing.status, 'draft');
        if (!isAdmin && currentStatus === 'pending_delete') {
            return createErrorResponse('该论文处于删除待审核状态，暂不可上传 PDF', 409);
        }

        const key = buildR2Key('pdf', file.name);
        await bucket.put(key, await file.arrayBuffer(), {
            httpMetadata: {
                contentType: 'application/pdf'
            }
        });

        const fileUrl = buildPublicFileUrl(key, env);
        const previousPdfKey = extractUploadsKeyFromUrl(existing.pdf_url);

        await db.prepare(`
            INSERT INTO files (
                filename, original_name, file_url, file_type,
                file_size, category, uploaded_by,
                lifecycle_status, reference_count, is_orphan
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
            key,
            file.name,
            fileUrl,
            'application/pdf',
            file.size,
            'pdf',
            user.username,
            'active',
            0,
            1
        ).run();

        if (isAdmin) {
            await db.prepare(`
                UPDATE publications
                SET pdf_url = ?, updated_at = CURRENT_TIMESTAMP
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

        if (existing.pdf_url && existing.pdf_url !== fileUrl) {
            const previousFile = await db.prepare(`
                SELECT id, reference_count
                FROM files
                WHERE file_url = ?
                ORDER BY id DESC
                LIMIT 1
            `).bind(existing.pdf_url).first();

            const previousReferenceCount = Number.parseInt(previousFile?.reference_count, 10) || 0;

            if (previousFile?.id && previousReferenceCount === 0) {
                await db.prepare(`
                    UPDATE files
                    SET lifecycle_status = 'pending_delete',
                        deleted_at = CURRENT_TIMESTAMP,
                        deleted_by = ?,
                        updated_at = CURRENT_TIMESTAMP
                    WHERE id = ?
                `).bind(user.username, previousFile.id).run();
            } else if (!previousFile?.id && bucket && previousPdfKey && previousPdfKey !== key) {
                // 兼容历史未入 files 表的旧 PDF，仍执行一次兜底清理
                try {
                    await bucket.delete(previousPdfKey);
                } catch (cleanupError) {
                    console.warn('清理旧 PDF 文件失败:', cleanupError);
                }
            }
        }

        await logActivity(
            db,
            isAdmin ? '上传PDF' : (currentStatus === 'draft' ? '上传PDF（草稿）' : '上传PDF并提交审核'),
            'publications',
            id,
            user.username,
            `上传PDF: ${file.name}`
        );

        return createResponse({
            url: fileUrl,
            message: isAdmin
                ? 'PDF上传成功'
                : (currentStatus === 'draft' ? 'PDF上传成功，草稿状态保持不变' : 'PDF上传成功，已重新提交审核')
        });
    } catch (error) {
        console.error('上传论文 PDF 失败:', error);
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
