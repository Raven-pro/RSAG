import { authenticate, requireAdmin, createResponse, createErrorResponse, initDatabase } from './utils.js';

function parsePositiveInt(value, fallback) {
    const parsed = Number.parseInt(value || '', 10);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

// GET /api/admin/files
export async function onRequestGet(context) {
    const { request, env } = context;

    try {
        const user = await authenticate(request, env);
        requireAdmin(user);

        const url = new URL(request.url);
        const page = parsePositiveInt(url.searchParams.get('page'), 1);
        const limit = parsePositiveInt(url.searchParams.get('limit'), 12);
        const search = (url.searchParams.get('search') || '').trim();
        const type = (url.searchParams.get('type') || '').trim().toLowerCase();

        const db = env.DB;
        await initDatabase(db);

        const whereClauses = [];
        const params = [];

        if (search) {
            whereClauses.push('original_name LIKE ?');
            params.push(`%${search}%`);
        }

        if (type) {
            if (type === 'image') {
                whereClauses.push('(category = ? OR file_type LIKE ?)');
                params.push('image', 'image/%');
            } else if (type === 'document') {
                whereClauses.push(`(
                    category = ?
                    OR file_type = 'application/pdf'
                    OR file_type LIKE 'application/msword%'
                    OR file_type LIKE 'application/vnd.%'
                    OR file_type LIKE 'text/%'
                )`);
                params.push('document');
            } else {
                whereClauses.push('category = ?');
                params.push(type);
            }
        }

        const whereSql = whereClauses.length ? `WHERE ${whereClauses.join(' AND ')}` : '';

        const totalResult = await db.prepare(`SELECT COUNT(*) as total FROM files ${whereSql}`)
            .bind(...params)
            .first();
        const total = totalResult?.total || 0;

        const totalPages = Math.max(1, Math.ceil(total / limit));
        const currentPage = Math.min(Math.max(page, 1), totalPages);
        const offset = (currentPage - 1) * limit;

        const filesResult = await db.prepare(`
            SELECT id, filename, original_name, file_url, file_type, file_size, category, uploaded_by, created_at
            FROM files
            ${whereSql}
            ORDER BY created_at DESC, id DESC
            LIMIT ? OFFSET ?
        `).bind(...params, limit, offset).all();

        return createResponse({
            files: filesResult.results || [],
            totalPages,
            currentPage
        });
    } catch (error) {
        console.error('获取文件列表失败:', error);
        return createErrorResponse(error.message, error.status || 500);
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
