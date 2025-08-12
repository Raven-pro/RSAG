// 论文管理API
import { authenticate, logActivity, buildPaginationQuery, createResponse, createErrorResponse, initDatabase } from '../utils.js';

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
        
        const db = env.DB;
        
        // 确保数据库已初始化
        await initDatabase(db);
        
        let baseQuery = 'SELECT * FROM publications';
        let countQuery = 'SELECT COUNT(*) as total FROM publications';
        let params = [];
        
        if (search) {
            const searchCondition = ' WHERE title LIKE ? OR authors LIKE ? OR journal LIKE ?';
            baseQuery += searchCondition;
            countQuery += searchCondition;
            params = [`%${search}%`, `%${search}%`, `%${search}%`];
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
        
        return createResponse({
            data: publications.results || [],
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
                currentPage: page
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
            abstract, keywords, status = 'published'
        } = data;
        
        // 验证必填字段
        if (!title || !authors || !journal || !year) {
            return createErrorResponse('缺少必填字段', 400);
        }
        
        const db = env.DB;
        await initDatabase(db);
        
        const result = await db.prepare(`
            INSERT INTO publications (
                title, authors, journal, year, volume, doi, url,
                abstract, keywords, status, created_by
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
            title, authors, journal, year, volume || null, doi || null,
            url || null, abstract || null, keywords || null, status, user.username
        ).run();
        
        // 记录活动日志
        await logActivity(
            db, '添加论文', 'publications', result.meta.last_row_id,
            user.username, `添加论文: ${title}`
        );
        
        return createResponse({
            id: result.meta.last_row_id,
            message: '论文添加成功'
        }, 201);
        
    } catch (error) {
        console.error('添加论文失败:', error);
        return createErrorResponse(error.message);
    }
}

// GET /api/admin/publications/[id] - 获取单个论文
export async function onRequestGetSingle(context) {
    const { request, env, params } = context;
    
    try {
        await authenticate(request, env);
        
        const id = params.id;
        const db = env.DB;
        
        const publication = await db.prepare('SELECT * FROM publications WHERE id = ?')
            .bind(id)
            .first();
        
        if (!publication) {
            return createErrorResponse('论文不存在', 404);
        }
        
        return createResponse(publication);
        
    } catch (error) {
        console.error('获取论文失败:', error);
        return createErrorResponse(error.message);
    }
}

// PUT /api/admin/publications/[id] - 更新论文
export async function onRequestPut(context) {
    const { request, env, params } = context;
    
    try {
        const user = await authenticate(request, env);
        
        const id = params.id;
        const data = await request.json();
        const {
            title, authors, journal, year, volume, doi, url,
            abstract, keywords, status
        } = data;
        
        const db = env.DB;
        
        // 检查论文是否存在
        const existing = await db.prepare('SELECT * FROM publications WHERE id = ?')
            .bind(id)
            .first();
        
        if (!existing) {
            return createErrorResponse('论文不存在', 404);
        }
        
        await db.prepare(`
            UPDATE publications SET
                title = ?, authors = ?, journal = ?, year = ?, volume = ?,
                doi = ?, url = ?, abstract = ?, keywords = ?, status = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `).bind(
            title, authors, journal, year, volume || null, doi || null,
            url || null, abstract || null, keywords || null, status, id
        ).run();
        
        // 记录活动日志
        await logActivity(
            db, '更新论文', 'publications', id,
            user.username, `更新论文: ${title}`
        );
        
        return createResponse({ message: '论文更新成功' });
        
    } catch (error) {
        console.error('更新论文失败:', error);
        return createErrorResponse(error.message);
    }
}

// DELETE /api/admin/publications/[id] - 删除论文
export async function onRequestDelete(context) {
    const { request, env, params } = context;
    
    try {
        const user = await authenticate(request, env);
        
        const id = params.id;
        const db = env.DB;
        
        // 检查论文是否存在
        const existing = await db.prepare('SELECT title FROM publications WHERE id = ?')
            .bind(id)
            .first();
        
        if (!existing) {
            return createErrorResponse('论文不存在', 404);
        }
        
        await db.prepare('DELETE FROM publications WHERE id = ?').bind(id).run();
        
        // 记录活动日志
        await logActivity(
            db, '删除论文', 'publications', id,
            user.username, `删除论文: ${existing.title}`
        );
        
        return createResponse({ message: '论文删除成功' });
        
    } catch (error) {
        console.error('删除论文失败:', error);
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
