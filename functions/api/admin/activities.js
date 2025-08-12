// 活动日志API
import { authenticate, createResponse, createErrorResponse, initDatabase } from '../utils.js';

// GET /api/admin/activities - 获取最近活动
export async function onRequestGet(context) {
    const { request, env } = context;
    
    try {
        // 认证检查
        await authenticate(request, env);
        
        const url = new URL(request.url);
        const limit = parseInt(url.searchParams.get('limit') || '10');
        
        const db = env.DB;
        await initDatabase(db);
        
        const activities = await db.prepare(`
            SELECT * FROM activity_logs 
            ORDER BY created_at DESC 
            LIMIT ?
        `).bind(limit).all();
        
        return createResponse(activities.results || []);
        
    } catch (error) {
        console.error('获取活动日志失败:', error);
        return createErrorResponse(error.message);
    }
}

// OPTIONS请求处理
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
