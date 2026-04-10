import { authenticate, logActivity, createResponse, createErrorResponse, initDatabase } from '../utils.js';
import { normalizeWorkflowStatus, buildWorkflowOnUpdate } from '../workflow.js';

const ALLOWED_TYPES = new Set(['SCI', 'EI', 'Conference', 'DomesticConference']);
const TYPE_ALIASES = {
    '国际会议': 'Conference',
    '国内会议': 'DomesticConference'
};

function normalizeTypeValue(type) {
    const value = String(type || '').trim();
    if (!value) return '';
    const mapped = TYPE_ALIASES[value] || value;
    return ALLOWED_TYPES.has(mapped) ? mapped : '';
}

function normalizeTypesInput(types, fallbackType) {
    let candidates = [];

    if (Array.isArray(types)) {
        candidates = types;
    } else if (typeof types === 'string' && types.trim()) {
        const raw = types.trim();
        if (raw.startsWith('[')) {
            try {
                const parsed = JSON.parse(raw);
                if (Array.isArray(parsed)) {
                    candidates = parsed;
                } else {
                    candidates = [raw];
                }
            } catch {
                candidates = raw.split(',');
            }
        } else {
            candidates = raw.split(',');
        }
    }

    const fallback = normalizeTypeValue(fallbackType);
    if (fallback) {
        candidates.push(fallback);
    }

    const unique = [];
    for (const candidate of candidates) {
        const normalized = normalizeTypeValue(candidate);
        if (normalized && !unique.includes(normalized)) {
            unique.push(normalized);
        }
    }

    return unique;
}

function normalizePrimaryType(types, fallbackType) {
    const normalizedFallback = normalizeTypeValue(fallbackType);
    const ordered = ['SCI', 'EI', 'Conference', 'DomesticConference'];
    for (const type of ordered) {
        if (types.includes(type)) {
            return type;
        }
    }
    return normalizedFallback || (types[0] || null);
}

function serializeTypes(types) {
    return types.length ? JSON.stringify(types) : null;
}

function hydratePublication(row) {
    const types = normalizeTypesInput(row?.types, row?.type);
    return {
        ...row,
        status: normalizeWorkflowStatus(row?.status, 'draft'),
        type: normalizePrimaryType(types, row?.type),
        types
    };
}

// GET /api/admin/publications/[id]
export async function onRequestGet(context) {
    const { request, env, params } = context;

    try {
        await authenticate(request, env);

        const id = parseInt(params.id || '', 10);
        if (!Number.isInteger(id) || id <= 0) {
            return createErrorResponse('无效的论文 ID', 400);
        }

        const db = env.DB;
        await initDatabase(db);

        const publication = await db.prepare('SELECT * FROM publications WHERE id = ?').bind(id).first();
        if (!publication) {
            return createErrorResponse('论文不存在', 404);
        }

        return createResponse(hydratePublication(publication));
    } catch (error) {
        console.error('获取论文失败:', error);
        return createErrorResponse(error.message);
    }
}

// PUT /api/admin/publications/[id]
export async function onRequestPut(context) {
    const { request, env, params } = context;

    try {
        const user = await authenticate(request, env);

        const id = parseInt(params.id || '', 10);
        if (!Number.isInteger(id) || id <= 0) {
            return createErrorResponse('无效的论文 ID', 400);
        }

        const data = await request.json();
        const {
            title, authors, journal, year, volume, doi, url,
            abstract, keywords, type, types, status,
            scheduled_publish_at
        } = data;

        const normalizedTypes = normalizeTypesInput(types, type);
        const normalizedType = normalizePrimaryType(normalizedTypes, type);

        const db = env.DB;
        await initDatabase(db);

        const existing = await db.prepare('SELECT * FROM publications WHERE id = ?').bind(id).first();
        if (!existing) {
            return createErrorResponse('论文不存在', 404);
        }

        const workflow = buildWorkflowOnUpdate({
            existing,
            status,
            scheduledPublishAt: scheduled_publish_at,
            username: user.username
        });

        await db.prepare(`
            UPDATE publications SET
                title = ?, authors = ?, journal = ?, year = ?, volume = ?,
                doi = ?, url = ?, abstract = ?, keywords = ?, type = ?, types = ?, status = ?,
                scheduled_publish_at = ?, submitted_at = ?, reviewed_by = ?, reviewed_at = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `).bind(
            title, authors, journal, year, volume || null, doi || null,
            url || null, abstract || null, keywords || null,
            normalizedType, serializeTypes(normalizedTypes), workflow.status,
            workflow.scheduled_publish_at, workflow.submitted_at, workflow.reviewed_by, workflow.reviewed_at,
            id
        ).run();

        await logActivity(db, '更新论文', 'publications', id, user.username, `更新论文: ${title}`);

        return createResponse({
            message: '论文更新成功',
            frontend_url: '/publications-api.html'
        });
    } catch (error) {
        console.error('更新论文失败:', error);
        return createErrorResponse(error.message);
    }
}

// DELETE /api/admin/publications/[id]
export async function onRequestDelete(context) {
    const { request, env, params } = context;

    try {
        const user = await authenticate(request, env);

        const id = parseInt(params.id || '', 10);
        if (!Number.isInteger(id) || id <= 0) {
            return createErrorResponse('无效的论文 ID', 400);
        }

        const db = env.DB;
        await initDatabase(db);

        const existing = await db.prepare('SELECT title FROM publications WHERE id = ?').bind(id).first();
        if (!existing) {
            return createErrorResponse('论文不存在', 404);
        }

        await db.prepare('DELETE FROM publications WHERE id = ?').bind(id).run();

        await logActivity(db, '删除论文', 'publications', id, user.username, `删除论文: ${existing.title}`);

        return createResponse({ message: '论文删除成功' });
    } catch (error) {
        console.error('删除论文失败:', error);
        return createErrorResponse(error.message);
    }
}

export async function onRequestOptions() {
    return new Response(null, {
        status: 200,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        }
    });
}
