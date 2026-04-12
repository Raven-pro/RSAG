import { authenticate, requireAdmin, createResponse, createErrorResponse, initDatabase } from './utils.js';

function parsePositiveInt(value, fallback) {
    const parsed = Number.parseInt(value || '', 10);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function normalizeStatusFilter(value) {
    const status = String(value || '').trim().toLowerCase();
    if (['active', 'orphan', 'pending_delete', 'all'].includes(status)) {
        return status;
    }
    return 'active';
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
        const status = normalizeStatusFilter(url.searchParams.get('status'));

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

        if (status === 'pending_delete') {
            whereClauses.push("lifecycle_status = 'pending_delete'");
        } else if (status === 'orphan') {
            whereClauses.push("lifecycle_status = 'active'");
            whereClauses.push('is_orphan = 1');
        } else if (status === 'active') {
            whereClauses.push("lifecycle_status = 'active'");
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
            SELECT
                id, filename, original_name, file_url, file_type, file_size, category,
                uploaded_by, lifecycle_status, reference_count, is_orphan, deleted_at, deleted_by,
                created_at, updated_at
            FROM files
            ${whereSql}
            ORDER BY
                CASE WHEN lifecycle_status = 'pending_delete' THEN 1 ELSE 0 END ASC,
                created_at DESC,
                id DESC
            LIMIT ? OFFSET ?
        `).bind(...params, limit, offset).all();

        return createResponse({
            files: filesResult.results || [],
            totalPages,
            currentPage,
            filters: {
                search,
                type,
                status
            }
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
