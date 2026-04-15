import { authenticate, isAdminUser, logActivity, createResponse, createErrorResponse, initDatabase } from './utils.js';
import {
    assertUploadFile,
    buildPublicFileUrl,
    buildR2Key,
    getUploadCategory,
    isAllowedUploadMime,
    isFileTypeCompatible,
    resolveUploadsBucket
} from './file-utils.js';

// POST /api/admin/upload
export async function onRequestPost(context) {
    const { request, env } = context;

    try {
        const user = await authenticate(request, env);

        const formData = await request.formData();
        const file = formData.get('file');
        const uploadType = String(formData.get('type') || '').toLowerCase();

        if (!isAdminUser(user) && !['news', 'pdf'].includes(uploadType)) {
            return createErrorResponse('成员账号仅允许上传新闻图片或论文 PDF', 403);
        }

        const mimeType = String(file?.type || 'application/octet-stream');
        assertUploadFile(file, '文件', { uploadType, mimeType });

        if (!isAllowedUploadMime(mimeType)) {
            return createErrorResponse('不支持的文件类型，仅允许图片、PDF 和常见办公文档', 400);
        }

        if (!isFileTypeCompatible(uploadType, mimeType)) {
            return createErrorResponse('上传类型与文件类型不匹配', 400);
        }

        const bucket = resolveUploadsBucket(env);
        if (!bucket) {
            return createErrorResponse('未配置 R2 存储桶绑定', 500);
        }

        const key = buildR2Key(uploadType, file.name);
        await bucket.put(key, await file.arrayBuffer(), {
            httpMetadata: {
                contentType: mimeType
            }
        });

        const category = getUploadCategory(uploadType, mimeType);
        const fileUrl = buildPublicFileUrl(key, env);
        const initialIsOrphan = ['news', 'avatar', 'pdf'].includes(String(category || '').toLowerCase()) ? 1 : 0;

        const db = env.DB;
        await initDatabase(db);

        const insertResult = await db.prepare(`
            INSERT INTO files (
                filename, original_name, file_url, file_type,
                file_size, category, uploaded_by,
                lifecycle_status, reference_count, is_orphan
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
            key,
            file.name,
            fileUrl,
            mimeType,
            file.size,
            category,
            user.username,
            'active',
            0,
            initialIsOrphan
        ).run();

        const fileId = insertResult.meta.last_row_id;

        await logActivity(
            db,
            '上传文件',
            'files',
            fileId,
            user.username,
            `上传文件: ${file.name}`
        );

        const savedFile = await db.prepare(`
            SELECT id, filename, original_name, file_url, file_type, file_size, category, uploaded_by, created_at
            FROM files
            WHERE id = ?
        `).bind(fileId).first();

        return createResponse({
            url: fileUrl,
            file: savedFile,
            message: '文件上传成功'
        });
    } catch (error) {
        console.error('文件上传失败:', error);
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
