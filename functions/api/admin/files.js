import { authenticate, createResponse, createErrorResponse, initDatabase } from './utils.js';

function inferFileCategory(fileType = '') {
    if (!fileType) return 'general';
    if (fileType.startsWith('image/')) return 'image';
    if (fileType.includes('pdf') || fileType.includes('word') || fileType.includes('document') || fileType.includes('excel') || fileType.includes('spreadsheet') || fileType.includes('powerpoint') || fileType.includes('presentation')) {
        return 'document';
    }
    return 'general';
}

// GET /api/admin/files
export async function onRequestGet(context) {
    const { request, env } = context;

    try {
        await authenticate(request, env);

        const url = new URL(request.url);
        const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10));
        const limit = Math.max(1, parseInt(url.searchParams.get('limit') || '12', 10));
        const search = (url.searchParams.get('search') || '').trim();
        const type = (url.searchParams.get('type') || '').trim().toLowerCase();

        const db = env.DB;
        await initDatabase(db);

        let baseQuery = 'SELECT * FROM files';
        let countQuery = 'SELECT COUNT(*) as total FROM files';
        const conditions = [];
        const params = [];

        if (search) {
            conditions.push('original_name LIKE ?');
            params.push(`%${search}%`);
        }

        if (type) {
            if (type === 'image') {
                conditions.push("(category = 'image' OR file_type LIKE 'image/%')");
            } else if (type === 'document') {
                conditions.push("(category = 'document' OR file_type LIKE '%pdf%' OR file_type LIKE '%word%' OR file_type LIKE '%document%' OR file_type LIKE '%excel%' OR file_type LIKE '%spreadsheet%' OR file_type LIKE '%powerpoint%' OR file_type LIKE '%presentation%')");
            } else {
                conditions.push('category = ?');
                params.push(type);
            }
        }

        if (conditions.length) {
            const where = ` WHERE ${conditions.join(' AND ')}`;
            baseQuery += where;
            countQuery += where;
        }

        baseQuery += ' ORDER BY created_at DESC';

        const totalResult = await db.prepare(countQuery).bind(...params).first();
        const total = totalResult?.total || 0;
        const totalPages = Math.max(1, Math.ceil(total / limit));
        const currentPage = Math.min(page, totalPages);
        const offset = (currentPage - 1) * limit;

        const result = await db.prepare(`${baseQuery} LIMIT ? OFFSET ?`).bind(...params, limit, offset).all();
        const files = (result.results || []).map((file) => ({
            ...file,
            category: file.category || inferFileCategory(file.file_type)
        }));

        return createResponse({ files, totalPages, currentPage });
    } catch (error) {
        return createErrorResponse(error.message);
    }
}

export async function onRequestOptions() {
    return new Response(null, {
        status: 200,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        }
    });
}
