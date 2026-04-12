import { authenticate, requireAdmin, logActivity, createResponse, createErrorResponse, initDatabase } from './utils.js';
import { normalizeOrderIndex, reorderTeamMembers } from './team-order.js';
import { syncEntityFileReference } from './file-references.js';

// GET /api/admin/team
export async function onRequestGet(context) {
    const { request, env } = context;

    try {
        const user = await authenticate(request, env);
        requireAdmin(user);

        const url = new URL(request.url);
        const search = (url.searchParams.get('search') || '').toLowerCase();

        const db = env.DB;
        await initDatabase(db);

        const result = search
            ? await db.prepare(`
                SELECT * FROM team_members
                WHERE name LIKE ? OR title LIKE ?
                ORDER BY order_index ASC, id ASC
            `).bind(`%${search}%`, `%${search}%`).all()
            : await db.prepare(`
                SELECT * FROM team_members
                ORDER BY order_index ASC, id ASC
            `).all();

        return createResponse({ team: result.results || [] });
    } catch (error) {
        console.error('获取团队成员失败:', error);
        return createErrorResponse(error.message, error.status || 500);
    }
}

// POST /api/admin/team
export async function onRequestPost(context) {
    const { request, env } = context;

    try {
        const user = await authenticate(request, env);
        requireAdmin(user);
        const data = await request.json();
        const {
            name,
            title,
            bio,
            research_area,
            photo_url,
            email,
            phone,
            order_index = 1,
            status = 'active'
        } = data;

        if (!name || !title) {
            return createErrorResponse('缺少必填字段', 400);
        }

        const db = env.DB;
        await initDatabase(db);

        const result = await db.prepare(`
            INSERT INTO team_members (
                name, title, bio, research_area, photo_url,
                email, phone, order_index, status, created_by
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
            name,
            title,
            bio || null,
            research_area || null,
            photo_url || null,
            email || null,
            phone || null,
            normalizeOrderIndex(order_index, 1),
            status || 'active',
            user.username
        ).run();

        const memberId = result.meta.last_row_id;
        await reorderTeamMembers(db, memberId, normalizeOrderIndex(order_index, 1));

        await syncEntityFileReference(db, {
            entityType: 'team_members',
            entityId: memberId,
            fieldName: 'photo_url',
            fileUrl: photo_url
        });

        await logActivity(
            db,
            '添加成员',
            'team_members',
            memberId,
            user.username,
            `添加成员: ${name}`
        );

        return createResponse({ id: memberId, message: '成员添加成功' }, 201);
    } catch (error) {
        console.error('添加团队成员失败:', error);
        return createErrorResponse(error.message, error.status || 500);
    }
}

export async function onRequestOptions() {
    return new Response(null, {
        status: 200,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        }
    });
}
