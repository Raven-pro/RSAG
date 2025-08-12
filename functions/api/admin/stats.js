// 统计数据API
import { authenticate, createResponse, createErrorResponse, initDatabase } from '../utils.js';

// GET /api/admin/stats - 获取统计数据
export async function onRequestGet(context) {
    const { request, env } = context;
    
    try {
        // 认证检查
        await authenticate(request, env);
        
        const db = env.DB;
        await initDatabase(db);
        
        // 获取各项统计数据
        const publicationsCount = await db.prepare('SELECT COUNT(*) as count FROM publications').first();
        const newsCount = await db.prepare('SELECT COUNT(*) as count FROM news WHERE status = "published"').first();
        const teamCount = await db.prepare('SELECT COUNT(*) as count FROM team_members WHERE status = "active"').first();
        const filesCount = await db.prepare('SELECT COUNT(*) as count FROM files').first();
        
        return createResponse({
            publications: publicationsCount.count,
            news: newsCount.count,
            team: teamCount.count,
            files: filesCount.count
        });
        
    } catch (error) {
        console.error('获取统计数据失败:', error);
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
