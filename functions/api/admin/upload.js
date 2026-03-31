import { authenticate, logActivity, createResponse, createErrorResponse, initDatabase } from './utils.js';

function sanitizeFileName(name) {
    return name.replace(/[^a-zA-Z0-9._-]/g, '_');
}

function inferFileCategory(fileType = '', requestedType = '') {
    if (requestedType) return requestedType;
    if (fileType.startsWith('image/')) return 'image';
    if (fileType.includes('pdf') || fileType.includes('word') || fileType.includes('document') || fileType.includes('excel') || fileType.includes('spreadsheet') || fileType.includes('powerpoint') || fileType.includes('presentation')) {
        return 'document';
    }
    return 'general';
}

function getUploadsBucket(env) {
    return env.UPLOADS_BUCKET || env.R2_BUCKET || env.BUCKET || null;
}

function buildFileUrl(env, key) {
    const base = env.R2_PUBLIC_BASE_URL || env.PUBLIC_UPLOAD_BASE_URL;
    if (base) {
        return `${base.replace(/\/$/, '')}/${key}`;
    }
    return `/uploads/${key}`;
}

// POST /api/admin/upload
export async function onRequestPost(context) {
    const { request, env } = context;

    try {
        const user = await authenticate(request, env);
        const db = env.DB;
        await initDatabase(db);

        const form = await request.formData();
        const file = form.get('file');
        const requestedType = (form.get('type') || '').toString().trim().toLowerCase();

        if (!(file instanceof File)) {
            return createErrorResponse('未收到文件', 400);
        }

        const bucket = getUploadsBucket(env);
        if (!bucket) {
            return createErrorResponse('未配置 R2 存储桶（UPLOADS_BUCKET）', 500);
        }

        const safeName = sanitizeFileName(file.name || `upload_${Date.now()}`);
        const category = inferFileCategory(file.type || '', requestedType);
        const folder = category === 'image' || category === 'avatar' || category === 'news' ? 'images' : 'files';
        const key = `${folder}/${Date.now()}_${safeName}`;

        await bucket.put(key, await file.arrayBuffer(), {
            httpMetadata: {
                contentType: file.type || 'application/octet-stream'
            }
        });

        const fileUrl = buildFileUrl(env, key);
        const result = await db.prepare(`
            INSERT INTO files (
                filename,
                original_name,
                file_url,
                file_type,
                file_size,
                category,
                uploaded_by
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `).bind(
            key.split('/').pop(),
            file.name,
            fileUrl,
            file.type || 'application/octet-stream',
            file.size || 0,
            category,
            user.username
        ).run();

        const storedFile = {
            id: result.meta.last_row_id,
            filename: key.split('/').pop(),
            original_name: file.name,
            file_url: fileUrl,
            file_type: file.type || 'application/octet-stream',
            file_size: file.size || 0,
            category,
            uploaded_by: user.username,
            created_at: new Date().toISOString()
        };

        await logActivity(db, '上传文件', 'files', storedFile.id, user.username, `上传文件: ${file.name}`);

        return createResponse({
            url: fileUrl,
            file: storedFile,
            message: '文件上传成功'
        });
    } catch (error) {
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
