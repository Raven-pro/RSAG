// 新闻管理API
import { authenticate, isAdminUser, logActivity, buildPaginationQuery, createResponse, createErrorResponse, initDatabase } from './utils.js';
import { normalizeWorkflowStatus, parseWorkflowStatusFilter, buildWorkflowOnCreate } from './workflow.js';

function hydrateNewsRow(row) {
    return {
        ...row,
        status: normalizeWorkflowStatus(row?.status, 'draft')
    };
}

// GET /api/admin/news - 获取新闻列表
export async function onRequestGet(context) {
    const { request, env } = context;
    
    try {
        // 认证检查
        const user = await authenticate(request, env);
        const isAdmin = isAdminUser(user);
        
        const url = new URL(request.url);
        const page = parseInt(url.searchParams.get('page') || '1');
        const limit = parseInt(url.searchParams.get('limit') || '10');
        const search = url.searchParams.get('search') || '';
        const status = parseWorkflowStatusFilter(url.searchParams.get('status') || '');
        
        const db = env.DB;
        
        // 确保数据库已初始化
        await initDatabase(db);
        
        let baseQuery = 'SELECT * FROM news';
        let countQuery = 'SELECT COUNT(*) as total FROM news';
        let params = [];
        let whereConditions = [];
        
        if (search) {
            whereConditions.push('(title LIKE ? OR title_en LIKE ? OR content LIKE ? OR content_en LIKE ? OR author LIKE ?)');
            params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
        }
        
        if (status) {
            whereConditions.push('status = ?');
            params.push(status);
        }

        if (!isAdmin) {
            whereConditions.push('created_by = ?');
            params.push(user.username);
        }
        
        if (whereConditions.length > 0) {
            const whereClause = ' WHERE ' + whereConditions.join(' AND ');
            baseQuery += whereClause;
            countQuery += whereClause;
        }
        
        baseQuery += ' ORDER BY COALESCE(scheduled_publish_at, publish_date) DESC, created_at DESC';
        
        // 获取总数
        const totalResult = await db.prepare(countQuery).bind(...params).first();
        const total = totalResult.total;
        
        // 分页查询
        const paginationQuery = buildPaginationQuery(baseQuery, page, limit);
        const news = await db.prepare(paginationQuery.query)
            .bind(...params, ...paginationQuery.params)
            .all();

        const rows = (news.results || []).map(hydrateNewsRow);
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
                status
            }
        });
        
    } catch (error) {
        console.error('获取新闻列表失败:', error);
        return createErrorResponse(error.message, error.status || 500);
    }
}

// POST /api/admin/news - 添加新闻
export async function onRequestPost(context) {
    const { request, env } = context;
    
    try {
        // 认证检查
        const user = await authenticate(request, env);
        const isAdmin = isAdminUser(user);
        
        const data = await request.json();
        const {
            title, summary, content, author, publish_date,
            title_en, summary_en, content_en,
            featured_image, category = 'general', tags,
            status = 'draft',
            scheduled_publish_at
        } = data;
        
        // 验证必填字段
        const authorName = isAdmin ? (String(author || '').trim() || user.username) : user.username;

        if (!title || !content || !authorName || !publish_date || !title_en || !content_en) {
            return createErrorResponse('缺少必填字段（中英文标题与正文都需要填写）', 400);
        }
        
        const db = env.DB;
        await initDatabase(db);

        const workflow = buildWorkflowOnCreate({
            status: isAdmin ? status : 'pending_review',
            scheduledPublishAt: scheduled_publish_at,
            username: user.username
        });
        
        const result = await db.prepare(`
            INSERT INTO news (
                title, title_en, summary, summary_en, content, content_en, author, publish_date,
                featured_image, category, tags, status,
                scheduled_publish_at, submitted_at, reviewed_by, reviewed_at,
                created_by
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
            title, title_en, summary || null, summary_en || null, content, content_en, authorName, publish_date,
            featured_image || null, category, tags || null,
            workflow.status, workflow.scheduled_publish_at, workflow.submitted_at, workflow.reviewed_by, workflow.reviewed_at,
            user.username
        ).run();
        
        // 记录活动日志
        await logActivity(
            db, isAdmin ? '发布新闻' : '提交新闻审核', 'news', result.meta.last_row_id,
            user.username, `${isAdmin ? '发布新闻' : '提交新闻审核'}: ${title}`
        );
        
        return createResponse({
            id: result.meta.last_row_id,
            message: isAdmin ? '新闻发布成功' : '新闻已提交审核',
            frontend_url: `/news/detail.html?id=${result.meta.last_row_id}`
        }, 201);
        
    } catch (error) {
        console.error('发布新闻失败:', error);
        return createErrorResponse(error.message, error.status || 500);
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
