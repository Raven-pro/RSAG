// 新闻管理API
import { authenticate, logActivity, buildPaginationQuery, createResponse, createErrorResponse, initDatabase } from './utils.js';

// GET /api/admin/news - 获取新闻列表
export async function onRequestGet(context) {
    const { request, env } = context;
    
    try {
        // 认证检查
        await authenticate(request, env);
        
        const url = new URL(request.url);
        const page = parseInt(url.searchParams.get('page') || '1');
        const limit = parseInt(url.searchParams.get('limit') || '10');
        const search = url.searchParams.get('search') || '';
        const status = url.searchParams.get('status') || '';
        
        const db = env.DB;
        
        // 确保数据库已初始化
        await initDatabase(db);
        
        let baseQuery = 'SELECT * FROM news';
        let countQuery = 'SELECT COUNT(*) as total FROM news';
        let params = [];
        let whereConditions = [];
        
        if (search) {
            whereConditions.push('(title LIKE ? OR content LIKE ? OR author LIKE ?)');
            params.push(`%${search}%`, `%${search}%`, `%${search}%`);
        }
        
        if (status) {
            whereConditions.push('status = ?');
            params.push(status);
        }
        
        if (whereConditions.length > 0) {
            const whereClause = ' WHERE ' + whereConditions.join(' AND ');
            baseQuery += whereClause;
            countQuery += whereClause;
        }
        
        baseQuery += ' ORDER BY publish_date DESC, created_at DESC';
        
        // 获取总数
        const totalResult = await db.prepare(countQuery).bind(...params).first();
        const total = totalResult.total;
        
        // 分页查询
        const paginationQuery = buildPaginationQuery(baseQuery, page, limit);
        const news = await db.prepare(paginationQuery.query)
            .bind(...params, ...paginationQuery.params)
            .all();
        
        return createResponse({
            data: news.results || [],
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
                currentPage: page
            }
        });
        
    } catch (error) {
        console.error('获取新闻列表失败:', error);
        return createErrorResponse(error.message);
    }
}

// POST /api/admin/news - 添加新闻
export async function onRequestPost(context) {
    const { request, env } = context;
    
    try {
        // 认证检查
        const user = await authenticate(request, env);
        
        const data = await request.json();
        const {
            title, summary, content, author, publish_date,
            featured_image, category = 'general', tags, status = 'published'
        } = data;
        
        // 验证必填字段
        if (!title || !content || !author || !publish_date) {
            return createErrorResponse('缺少必填字段', 400);
        }
        
        const db = env.DB;
        await initDatabase(db);
        
        const result = await db.prepare(`
            INSERT INTO news (
                title, summary, content, author, publish_date,
                featured_image, category, tags, status, created_by
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
            title, summary || null, content, author, publish_date,
            featured_image || null, category, tags || null, status, user.username
        ).run();
        
        // 记录活动日志
        await logActivity(
            db, '发布新闻', 'news', result.meta.last_row_id,
            user.username, `发布新闻: ${title}`
        );
        
        return createResponse({
            id: result.meta.last_row_id,
            message: '新闻发布成功'
        }, 201);
        
    } catch (error) {
        console.error('发布新闻失败:', error);
        return createErrorResponse(error.message);
    }
}

// GET /api/admin/news/[id] - 获取单个新闻
export async function onRequestGetSingle(context) {
    const { request, env, params } = context;
    
    try {
        await authenticate(request, env);
        
        const id = params.id;
        const db = env.DB;
        
        const news = await db.prepare('SELECT * FROM news WHERE id = ?')
            .bind(id)
            .first();
        
        if (!news) {
            return createErrorResponse('新闻不存在', 404);
        }
        
        return createResponse(news);
        
    } catch (error) {
        console.error('获取新闻失败:', error);
        return createErrorResponse(error.message);
    }
}

// PUT /api/admin/news/[id] - 更新新闻
export async function onRequestPut(context) {
    const { request, env, params } = context;
    
    try {
        const user = await authenticate(request, env);
        
        const id = params.id;
        const data = await request.json();
        const {
            title, summary, content, author, publish_date,
            featured_image, category, tags, status
        } = data;
        
        const db = env.DB;
        
        // 检查新闻是否存在
        const existing = await db.prepare('SELECT * FROM news WHERE id = ?')
            .bind(id)
            .first();
        
        if (!existing) {
            return createErrorResponse('新闻不存在', 404);
        }
        
        await db.prepare(`
            UPDATE news SET
                title = ?, summary = ?, content = ?, author = ?, publish_date = ?,
                featured_image = ?, category = ?, tags = ?, status = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `).bind(
            title, summary || null, content, author, publish_date,
            featured_image || null, category, tags || null, status, id
        ).run();
        
        // 记录活动日志
        await logActivity(
            db, '更新新闻', 'news', id,
            user.username, `更新新闻: ${title}`
        );
        
        return createResponse({ message: '新闻更新成功' });
        
    } catch (error) {
        console.error('更新新闻失败:', error);
        return createErrorResponse(error.message);
    }
}

// DELETE /api/admin/news/[id] - 删除新闻
export async function onRequestDelete(context) {
    const { request, env, params } = context;
    
    try {
        const user = await authenticate(request, env);
        
        const id = params.id;
        const db = env.DB;
        
        // 检查新闻是否存在
        const existing = await db.prepare('SELECT title FROM news WHERE id = ?')
            .bind(id)
            .first();
        
        if (!existing) {
            return createErrorResponse('新闻不存在', 404);
        }
        
        await db.prepare('DELETE FROM news WHERE id = ?').bind(id).run();
        
        // 记录活动日志
        await logActivity(
            db, '删除新闻', 'news', id,
            user.username, `删除新闻: ${existing.title}`
        );
        
        return createResponse({ message: '新闻删除成功' });
        
    } catch (error) {
        console.error('删除新闻失败:', error);
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
