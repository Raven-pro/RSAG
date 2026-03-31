import { authenticate, logActivity, createResponse, createErrorResponse, initDatabase } from '../../utils.js';

function sanitizeFileName(name) {
    return name.replace(/[^a-zA-Z0-9._-]/g, '_');
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

// POST /api/admin/publications/:id/upload-pdf
export async function onRequestPost(context) {
    const { request, env, params } = context;

    try {
        const user = await authenticate(request, env);
        const db = env.DB;
        await initDatabase(db);

        const publication = await db.prepare('SELECT id, title FROM publications WHERE id = ?')
            .bind(params.id)
            .first();

        if (!publication) {
            return createErrorResponse('论文不存在', 404);
        }

        const form = await request.formData();
        const pdf = form.get('pdf');

        if (!(pdf instanceof File)) {
            return createErrorResponse('未收到 PDF 文件', 400);
        }

        const bucket = getUploadsBucket(env);
        if (!bucket) {
            return createErrorResponse('未配置 R2 存储桶（UPLOADS_BUCKET）', 500);
        }

        const key = `pdfs/${Date.now()}_${sanitizeFileName(pdf.name || `publication_${params.id}.pdf`)}`;

        await bucket.put(key, await pdf.arrayBuffer(), {
            httpMetadata: {
                contentType: pdf.type || 'application/pdf'
            }
        });

        const fileUrl = buildFileUrl(env, key);

        await db.prepare(`
            UPDATE publications
            SET pdf_url = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `).bind(fileUrl, params.id).run();

        await logActivity(db, '上传PDF', 'publications', params.id, user.username, `上传PDF: ${publication.title}`);

        return createResponse({ url: fileUrl, message: 'PDF上传成功' });
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
