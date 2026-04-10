import {
    authenticate,
    requireAdmin,
    logActivity,
    createResponse,
    createErrorResponse,
    initDatabase
} from './utils.js';
import { hashPassword } from './auth/security.js';

function normalizeUsername(value) {
    return String(value || '').trim();
}

function isValidUsername(username) {
    return /^[A-Za-z0-9_.-]{3,32}$/.test(username);
}

// GET /api/admin/users
export async function onRequestGet(context) {
    const { request, env } = context;

    try {
        const user = await authenticate(request, env);
        requireAdmin(user);

        const db = env.DB;
        await initDatabase(db);

        const result = await db.prepare(`
            SELECT id, username, role, is_active, created_by, last_login_at, created_at, updated_at
            FROM users
            ORDER BY CASE WHEN role = 'admin' THEN 0 ELSE 1 END, created_at ASC, id ASC
        `).all();

        return createResponse({ users: result.results || [] });
    } catch (error) {
        console.error('获取用户列表失败:', error);
        return createErrorResponse(error.message, error.status || 500);
    }
}

// POST /api/admin/users
export async function onRequestPost(context) {
    const { request, env } = context;

    try {
        const admin = await authenticate(request, env);
        requireAdmin(admin);

        const payload = await request.json();
        const username = normalizeUsername(payload?.username);
        const password = String(payload?.password || '');
        const role = String(payload?.role || 'member').trim().toLowerCase();

        if (!isValidUsername(username)) {
            return createErrorResponse('用户名需为 3-32 位，仅支持字母、数字、下划线、点和连字符', 400);
        }

        if (role !== 'member') {
            return createErrorResponse('只允许创建成员账号', 400);
        }

        const passwordHash = await hashPassword(password);

        const db = env.DB;
        await initDatabase(db);

        const existing = await db.prepare('SELECT id FROM users WHERE username = ?').bind(username).first();
        if (existing) {
            return createErrorResponse('用户名已存在', 409);
        }

        const result = await db.prepare(`
            INSERT INTO users (username, password_hash, role, is_active, created_by)
            VALUES (?, ?, 'member', 1, ?)
        `).bind(username, passwordHash, admin.username).run();

        const createdId = result.meta.last_row_id;
        await logActivity(
            db,
            '创建成员账号',
            'users',
            createdId,
            admin.username,
            `创建成员账号: ${username}`
        );

        return createResponse({
            id: createdId,
            username,
            role: 'member',
            is_active: 1,
            message: '成员账号创建成功'
        }, 201);
    } catch (error) {
        console.error('创建成员账号失败:', error);
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