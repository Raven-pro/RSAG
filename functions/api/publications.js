import { createResponse, createErrorResponse, initDatabase } from './admin/utils.js';

const ALLOWED_TYPES = new Set(['SCI', 'EI', 'Conference', 'DomesticConference']);
const TYPE_ALIASES = new Map([
    ['sci', 'SCI'],
    ['sci期刊', 'SCI'],
    ['sci收录', 'SCI'],
    ['ei', 'EI'],
    ['ei期刊', 'EI'],
    ['ei收录', 'EI'],
    ['conference', 'Conference'],
    ['internationalconference', 'Conference'],
    ['国际会议', 'Conference'],
    ['domesticconference', 'DomesticConference'],
    ['国内会议', 'DomesticConference']
]);

function normalizeTypeValue(type) {
    const value = String(type || '').trim();
    if (!value) return '';
    if (ALLOWED_TYPES.has(value)) return value;
    const aliasKey = value.toLowerCase().replace(/\s+/g, '');
    const mapped = TYPE_ALIASES.get(aliasKey) || '';
    return ALLOWED_TYPES.has(mapped) ? mapped : '';
}

function parseTypes(typesValue, fallbackType) {
    let values = [];

    if (Array.isArray(typesValue)) {
        values = typesValue;
    } else if (typeof typesValue === 'string' && typesValue.trim()) {
        const raw = typesValue.trim();
        if (raw.startsWith('[')) {
            try {
                const parsed = JSON.parse(raw);
                values = Array.isArray(parsed) ? parsed : [raw];
            } catch {
                values = raw.split(',');
            }
        } else {
            values = raw.split(',');
        }
    }

    const fallback = normalizeTypeValue(fallbackType);
    if (fallback) values.push(fallback);

    const unique = [];
    for (const item of values) {
        const normalized = normalizeTypeValue(item);
        if (normalized && !unique.includes(normalized)) {
            unique.push(normalized);
        }
    }
    return unique;
}

function withTypes(row) {
    const types = parseTypes(row?.types, row?.type);
    return {
        ...row,
        type: types[0] || normalizeTypeValue(row?.type) || null,
        types
    };
}

// GET /api/publications - public publications list
export async function onRequestGet(context) {
    const { env, request } = context;

    try {
        const db = env.DB;
        if (!db) {
            return createErrorResponse('数据库未绑定', 500);
        }

        const url = new URL(request.url);
        const lite = url.searchParams.get('lite') === '1';

        await initDatabase(db);

        const query = lite
            ? `
                SELECT
                    id,
                    title,
                    authors,
                    journal,
                    year,
                    volume,
                    doi,
                    url,
                    type,
                    types,
                    status,
                    scheduled_publish_at,
                    created_at,
                    updated_at
                FROM publications
                WHERE status = 'published'
                   OR (status = 'scheduled' AND scheduled_publish_at IS NOT NULL AND datetime(scheduled_publish_at) <= datetime('now'))
                ORDER BY year DESC, created_at DESC
            `
            : `
                SELECT id, title, authors, journal, year, volume, doi, url, abstract, keywords,
                    type, types, status, scheduled_publish_at, submitted_at, reviewed_by, reviewed_at,
                    created_at, updated_at
                FROM publications
                WHERE status = 'published'
                   OR (status = 'scheduled' AND scheduled_publish_at IS NOT NULL AND datetime(scheduled_publish_at) <= datetime('now'))
                ORDER BY year DESC, created_at DESC
            `;

        const result = await db.prepare(query).all();

        return createResponse({ publications: (result.results || []).map(withTypes) });
    } catch (error) {
        console.error('获取公开论文列表失败:', error);
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
