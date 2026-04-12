import { authenticate, requireAdmin, createResponse, createErrorResponse, initDatabase } from './utils.js';
import { enrichFilesWithReferences } from './files/reference-resolver.js';

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

function parseBooleanFlag(value) {
    const text = String(value || '').trim().toLowerCase();
    return ['1', 'true', 'yes', 'y', 'on'].includes(text);
}

function buildReferenceSections(files = []) {
    const sections = {
        news: [],
        team_members: [],
        publications: [],
        unreferenced: []
    };

    for (const file of files) {
        const groups = file?.reference_groups || {};
        const newsRefs = Array.isArray(groups.news) ? groups.news : [];
        const teamRefs = Array.isArray(groups.team_members) ? groups.team_members : [];
        const publicationRefs = Array.isArray(groups.publications) ? groups.publications : [];

        let placed = false;
        if (newsRefs.length > 0) {
            sections.news.push(file);
            placed = true;
        }
        if (teamRefs.length > 0) {
            sections.team_members.push(file);
            placed = true;
        }
        if (publicationRefs.length > 0) {
            sections.publications.push(file);
            placed = true;
        }

        if (!placed) {
            sections.unreferenced.push(file);
        }
    }

    return sections;
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
        const grouped = parseBooleanFlag(url.searchParams.get('grouped'));

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

        const pagedSql = `
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
        `;

        const groupedSql = `
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
        `;

        const filesResult = grouped
            ? await db.prepare(groupedSql).bind(...params).all()
            : await db.prepare(pagedSql).bind(...params, limit, offset).all();

        const files = filesResult.results || [];
        await enrichFilesWithReferences(db, files);

        if (grouped) {
            return createResponse({
                grouped: true,
                files,
                sections: buildReferenceSections(files),
                total,
                filters: {
                    search,
                    type,
                    status
                }
            });
        }

        return createResponse({
            files,
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
