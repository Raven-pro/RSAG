// 论文管理API
import { authenticate, logActivity, buildPaginationQuery, createResponse, createErrorResponse, initDatabase } from './utils.js';

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
        type: normalizePrimaryType(types, row?.type),
        types
    };
}

// GET /api/admin/publications - 获取论文列表
export async function onRequestGet(context) {
    const { request, env } = context;
    
    try {
        // 认证检查
        await authenticate(request, env);
        
        const url = new URL(request.url);
        const page = parseInt(url.searchParams.get('page') || '1');
        const limit = parseInt(url.searchParams.get('limit') || '10');
        const search = url.searchParams.get('search') || '';
        const type = normalizeTypeValue(url.searchParams.get('type') || '');
        
        const db = env.DB;
        
        // 确保数据库已初始化
        await initDatabase(db);
        
        let baseQuery = 'SELECT * FROM publications';
        let countQuery = 'SELECT COUNT(*) as total FROM publications';
        let params = [];
        const whereConditions = [];
        
        if (search) {
            whereConditions.push('(title LIKE ? OR authors LIKE ? OR journal LIKE ?)');
            params = [`%${search}%`, `%${search}%`, `%${search}%`];
        }

        if (type) {
            whereConditions.push('(type = ? OR types LIKE ?)');
            params.push(type, `%"${type}"%`);
        }

        if (whereConditions.length > 0) {
            const whereClause = ` WHERE ${whereConditions.join(' AND ')}`;
            baseQuery += whereClause;
            countQuery += whereClause;
        }
        
        baseQuery += ' ORDER BY year DESC, created_at DESC';
        
        // 获取总数
        const totalResult = await db.prepare(countQuery).bind(...params).first();
        const total = totalResult.total;
        
        // 分页查询
        const paginationQuery = buildPaginationQuery(baseQuery, page, limit);
        const publications = await db.prepare(paginationQuery.query)
            .bind(...params, ...paginationQuery.params)
            .all();

        const rows = (publications.results || []).map(hydratePublication);
        const safeLimit = Math.max(1, limit);
        
        return createResponse({
            data: rows,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.max(1, Math.ceil(total / safeLimit)),
                currentPage: page
            },
            filters: {
                search,
                type
            }
        });
        
    } catch (error) {
        console.error('获取论文列表失败:', error);
        return createErrorResponse(error.message);
    }
}

// POST /api/admin/publications - 添加论文
export async function onRequestPost(context) {
    const { request, env } = context;
    
    try {
        // 认证检查
        const user = await authenticate(request, env);
        
        const data = await request.json();
        const {
            title, authors, journal, year, volume, doi, url,
            abstract, keywords, type, types, status = 'published'
        } = data;
        
        // 验证必填字段
        if (!title || !authors || !journal || !year) {
            return createErrorResponse('缺少必填字段', 400);
        }
        
        const db = env.DB;
        await initDatabase(db);
        
        const normalizedTypes = normalizeTypesInput(types, type);
        const normalizedType = normalizePrimaryType(normalizedTypes, type);

        const result = await db.prepare(`
            INSERT INTO publications (
                title, authors, journal, year, volume, doi, url,
                abstract, keywords, type, types, status, created_by
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
            title, authors, journal, year, volume || null, doi || null,
            url || null, abstract || null, keywords || null,
            normalizedType, serializeTypes(normalizedTypes), status, user.username
        ).run();
        
        // 记录活动日志
        await logActivity(
            db, '添加论文', 'publications', result.meta.last_row_id,
            user.username, `添加论文: ${title}`
        );
        
        return createResponse({
            id: result.meta.last_row_id,
            message: '论文添加成功',
            frontend_url: '/publications-api.html'
        }, 201);
        
    } catch (error) {
        console.error('添加论文失败:', error);
        return createErrorResponse(error.message);
    }
}

// OPTIONS请求处理
export async function onRequestOptions() {
    return new Response(null, {
        status: 200,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        }
    });
}
