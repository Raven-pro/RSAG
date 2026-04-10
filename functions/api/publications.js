import { createResponse, createErrorResponse, initDatabase } from './admin/utils.js';

const ALLOWED_TYPES = new Set(['SCI', 'EI', 'Conference', 'DomesticConference']);

function normalizeTypeValue(type) {
    const value = String(type || '').trim();
    return ALLOWED_TYPES.has(value) ? value : '';
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
    const { env } = context;

    try {
        const db = env.DB;
        if (!db) {
            return createErrorResponse('数据库未绑定', 500);
        }

        await initDatabase(db);

        const result = await db.prepare(`
            SELECT id, title, authors, journal, year, volume, doi, url, abstract, keywords, type, types, status, created_at, updated_at
            FROM publications
            WHERE status = 'published'
            ORDER BY year DESC, created_at DESC
        `).all();

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
