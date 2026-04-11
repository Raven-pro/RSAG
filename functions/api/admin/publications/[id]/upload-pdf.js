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
        assertUploadFile(file, 'PDF 文件');

        if (file.type !== 'application/pdf') {
            return createErrorResponse('仅支持 PDF 文件上传', 400);
        }

        const bucket = resolveUploadsBucket(env);
        if (!bucket) {
            return createErrorResponse('未配置 R2 存储桶绑定', 500);
        }

        const db = env.DB;
        await initDatabase(db);

        const existing = await db.prepare('SELECT id, created_by FROM publications WHERE id = ?').bind(id).first();
        if (!existing) {
            return createErrorResponse('论文不存在', 404);
        }

        if (!isAdmin) {
            requireOwnerOrAdmin(user, existing.created_by, '只能上传自己论文的PDF');
        }

        const key = buildR2Key('pdf', file.name);
        await bucket.put(key, await file.arrayBuffer(), {
            httpMetadata: {
                contentType: 'application/pdf'
            }
        });

        const fileUrl = buildPublicFileUrl(key, env);

        if (isAdmin) {
            await db.prepare(`
                UPDATE publications
                SET pdf_url = ?, updated_at = CURRENT_TIMESTAMP
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

        await logActivity(
            db,
            '上传PDF',
            'publications',
            id,
            user.username,
            `上传PDF: ${file.name}`
        );

        return createResponse({ url: fileUrl, message: 'PDF上传成功' });
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
