import {
    authenticate,
    requireAdmin,
    logActivity,
    createResponse,
    createErrorResponse,
    initDatabase
} from '../utils.js';
import { hashPassword, normalizeRole } from '../auth/security.js';

function parseUserId(rawId) {
    const id = Number.parseInt(rawId || '', 10);
    return Number.isInteger(id) && id > 0 ? id : null;
}

function parseActiveFlag(value) {
    if (value === undefined || value === null || value === '') {
        return null;
    }
    if (typeof value === 'boolean') {
        return value ? 1 : 0;
    }
    const text = String(value).trim().toLowerCase();
    if (['1', 'true', 'yes'].includes(text)) return 1;
    if (['0', 'false', 'no'].includes(text)) return 0;
    return null;
}

async function fetchUserById(db, id) {
    return db.prepare(`
        SELECT id, username, role, is_active, created_by, last_login_at, created_at, updated_at
        FROM users
        WHERE id = ?
    `).bind(id).first();
}

// GET /api/admin/users/[id]
export async function onRequestGet(context) {
    const { request, env, params } = context;

    try {
        const user = await authenticate(request, env);
        requireAdmin(user);

        const id = parseUserId(params.id);
        if (!id) {
            return createErrorResponse('无效的用户 ID', 400);
        }

        const db = env.DB;
        await initDatabase(db);

        const target = await fetchUserById(db, id);
        if (!target) {
            return createErrorResponse('用户不存在', 404);
        }

        return createResponse(target);
    } catch (error) {
        console.error('获取用户详情失败:', error);
        return createErrorResponse(error.message, error.status || 500);
    }
}

// PUT /api/admin/users/[id]
export async function onRequestPut(context) {
    const { request, env, params } = context;

    try {
        const admin = await authenticate(request, env);
        requireAdmin(admin);

        const id = parseUserId(params.id);
        if (!id) {
            return createErrorResponse('无效的用户 ID', 400);
        }

        const payload = await request.json();
        const newPassword = payload?.password;
        const activeFlag = parseActiveFlag(payload?.is_active);

        if ((newPassword === undefined || newPassword === null || String(newPassword) === '') && activeFlag === null) {
            return createErrorResponse('请提供需要更新的字段', 400);
        }

        const db = env.DB;
        await initDatabase(db);

        const target = await fetchUserById(db, id);
        if (!target) {
            return createErrorResponse('用户不存在', 404);
        }

        const targetRole = normalizeRole(target.role);
        if (targetRole === 'admin') {
            return createErrorResponse('超级管理员账号不允许在此处修改', 400);
        }

        const updates = [];
        const paramsToBind = [];
        const activityParts = [];

        if (newPassword !== undefined && newPassword !== null && String(newPassword) !== '') {
            const passwordHash = await hashPassword(String(newPassword));
            updates.push('password_hash = ?');
            paramsToBind.push(passwordHash);
            activityParts.push('重置密码');
        }

        if (activeFlag !== null) {
            updates.push('is_active = ?');
            paramsToBind.push(activeFlag);
            activityParts.push(activeFlag === 1 ? '启用账号' : '停用账号');
        }

        updates.push("role = 'member'");
        updates.push('updated_at = CURRENT_TIMESTAMP');

        await db.prepare(`
            UPDATE users
            SET ${updates.join(', ')}
            WHERE id = ?
        `).bind(...paramsToBind, id).run();

        await logActivity(
            db,
            '更新成员账号',
            'users',
            id,
            admin.username,
            `${activityParts.join('、') || '更新账号'}: ${target.username}`
        );

        const updated = await fetchUserById(db, id);
        return createResponse({
            user: updated,
            message: '账号更新成功'
        });
    } catch (error) {
        console.error('更新成员账号失败:', error);
        return createErrorResponse(error.message, error.status || 500);
    }
}

// DELETE /api/admin/users/[id]
export async function onRequestDelete(context) {
    const { request, env, params } = context;

    try {
        const admin = await authenticate(request, env);
        requireAdmin(admin);

        const id = parseUserId(params.id);
        if (!id) {
            return createErrorResponse('无效的用户 ID', 400);
        }

        const db = env.DB;
        await initDatabase(db);

        const target = await fetchUserById(db, id);
        if (!target) {
            return createErrorResponse('用户不存在', 404);
        }

        const targetRole = normalizeRole(target.role);
        if (targetRole === 'admin') {
            return createErrorResponse('超级管理员账号不允许删除', 400);
        }

        const currentAdminId = Number.parseInt(admin?.userId, 10);
        if (Number.isInteger(currentAdminId) && currentAdminId === id) {
            return createErrorResponse('不能删除当前登录账号', 400);
        }

        await db.prepare('DELETE FROM users WHERE id = ?').bind(id).run();

        await logActivity(
            db,
            '删除成员账号',
            'users',
            id,
            admin.username,
            `删除成员账号: ${target.username}`
        );

        return createResponse({ message: '账号删除成功' });
    } catch (error) {
        console.error('删除成员账号失败:', error);
        return createErrorResponse(error.message, error.status || 500);
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