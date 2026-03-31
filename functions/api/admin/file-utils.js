const ALLOWED_DOC_MIME = new Set([
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
    'text/csv',
    'application/zip',
    'application/x-zip-compressed'
]);

const MAX_UPLOAD_BYTES = 50 * 1024 * 1024;

export function inferFileCategoryFromMime(mime = '') {
    if (mime.startsWith('image/')) {
        return 'image';
    }

    if (ALLOWED_DOC_MIME.has(mime)) {
        return 'document';
    }

    return 'general';
}

export function isAllowedUploadMime(mime = '') {
    return mime.startsWith('image/') || ALLOWED_DOC_MIME.has(mime);
}

export function isFileTypeCompatible(uploadType = '', mime = '') {
    const type = String(uploadType || '').toLowerCase();

    if (!type || type === 'general') {
        return true;
    }

    if (type === 'news' || type === 'avatar' || type === 'image') {
        return mime.startsWith('image/');
    }

    if (type === 'pdf') {
        return mime === 'application/pdf';
    }

    if (type === 'document') {
        return ALLOWED_DOC_MIME.has(mime);
    }

    return true;
}

export function sanitizeFilename(filename = '') {
    return String(filename || 'upload.bin').replace(/[^a-zA-Z0-9._-]/g, '_');
}

export function inferFileCategoryFromRecord(file = {}) {
    if (file.category) {
        return String(file.category).toLowerCase();
    }

    if (typeof file.filename === 'string' && file.filename.includes('/')) {
        return file.filename.split('/')[0].toLowerCase();
    }

    return inferFileCategoryFromMime(String(file.file_type || ''));
}

export function buildR2Key(uploadType = '', originalName = '') {
    const normalizedType = String(uploadType || '').toLowerCase();
    const safeName = sanitizeFilename(originalName);
    const timePrefix = `${Date.now()}`;

    let folder = 'files';
    if (normalizedType === 'pdf') {
        folder = 'pdfs';
    } else if (normalizedType === 'news' || normalizedType === 'avatar' || normalizedType === 'image') {
        folder = 'images';
    }

    return `${folder}/${timePrefix}_${safeName}`;
}

export function getUploadCategory(uploadType = '', mime = '') {
    const normalizedType = String(uploadType || '').toLowerCase();

    if (normalizedType === 'news' || normalizedType === 'avatar' || normalizedType === 'pdf') {
        return normalizedType;
    }

    if (normalizedType === 'image' || normalizedType === 'document' || normalizedType === 'general') {
        return normalizedType;
    }

    return inferFileCategoryFromMime(mime);
}

export function assertUploadFile(file, expectedFieldLabel = '文件') {
    if (!file) {
        throw new Error(`未收到${expectedFieldLabel}`);
    }

    if (file.size > MAX_UPLOAD_BYTES) {
        throw new Error('文件超过 50MB 限制');
    }
}

export function resolveUploadsBucket(env) {
    return env.UPLOADS_BUCKET || env.R2_BUCKET || env.BUCKET || env.ASSETS_BUCKET || null;
}

export function buildPublicFileUrl(key, env) {
    const baseUrl = String(env.PUBLIC_UPLOAD_BASE_URL || env.R2_PUBLIC_BASE_URL || '').trim().replace(/\/$/, '');
    const normalizedKey = String(key || '').replace(/^\/+/, '');

    if (!normalizedKey) {
        return '/uploads';
    }

    if (baseUrl) {
        return `${baseUrl}/${encodeURIComponent(normalizedKey).replace(/%2F/g, '/')}`;
    }

    return `/uploads/${normalizedKey}`;
}
