// 管理后台认证API
import { ensureUsersSchema, ensureDefaultAdminUser, normalizeRole, verifyPassword } from './security.js';

export async function onRequestPost(context) {
    const { request, env } = context;
    
    try {
        const body = await request.json();
        const username = String(body?.username || '').trim();
        const password = String(body?.password || '');

        if (!username || !password) {
            return jsonResponse({ error: '请输入用户名和密码' }, 400);
        }

        const db = env.DB;
        if (!db) {
            return jsonResponse({ error: '数据库未配置' }, 500);
        }

        await ensureUsersSchema(db);
        await ensureDefaultAdminUser(db, env);

        const user = await db.prepare(`
            SELECT id, username, password_hash, role, is_active
            FROM users
            WHERE username = ?
            LIMIT 1
        `).bind(username).first();

        if (!user) {
            return jsonResponse({ error: '用户名或密码错误' }, 401);
        }

        if (Number.parseInt(user.is_active, 10) !== 1) {
            return jsonResponse({ error: '账号已被禁用，请联系管理员' }, 403);
        }

        const passwordValid = await verifyPassword(password, user.password_hash);
        if (!passwordValid) {
            return jsonResponse({ error: '用户名或密码错误' }, 401);
        }

        const role = normalizeRole(user.role);

        if (String(user.role || '').toLowerCase() !== role) {
            await db.prepare(`
                UPDATE users
                SET role = ?, updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            `).bind(role, user.id).run();
        }

        await db.prepare(`
            UPDATE users
            SET last_login_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `).bind(user.id).run();
        
        // 生成JWT token（简化版本）
        const payload = {
            userId: user.id,
            username: user.username,
            role,
            exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24小时过期
        };
        
        const token = await generateJWT(payload, env.JWT_SECRET || 'rsag-secret-key-2025');
        
        return jsonResponse({
            token,
            user: {
                id: user.id,
                username: user.username,
                role
            }
        }, 200);
        
    } catch (error) {
        console.error('登录处理错误:', error);
        return jsonResponse({ error: '服务器内部错误' }, 500);
    }
}

function jsonResponse(data, status = 200) {
    return new Response(JSON.stringify(data), {
        status,
        headers: {
            'Content-Type': 'application/json'
        }
    });
}

// 简化的JWT生成函数
async function generateJWT(payload, secret) {
    const header = {
        alg: 'HS256',
        typ: 'JWT'
    };
    
    const encodedHeader = btoa(JSON.stringify(header)).replace(/[+/]/g, char => char === '+' ? '-' : '_').replace(/=/g, '');
    const encodedPayload = btoa(JSON.stringify(payload)).replace(/[+/]/g, char => char === '+' ? '-' : '_').replace(/=/g, '');
    
    const data = `${encodedHeader}.${encodedPayload}`;
    
    const key = await crypto.subtle.importKey(
        'raw',
        new TextEncoder().encode(secret),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
    );
    
    const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data));
    const encodedSignature = btoa(String.fromCharCode(...new Uint8Array(signature)))
        .replace(/[+/]/g, char => char === '+' ? '-' : '_')
        .replace(/=/g, '');
    
    return `${data}.${encodedSignature}`;
}

// 验证JWT token
export async function verifyJWT(token, secret) {
    try {
        const [header, payload, signature] = token.split('.');
        
        if (!header || !payload || !signature) {
            throw new Error('Invalid token format');
        }
        
        const data = `${header}.${payload}`;
        
        const key = await crypto.subtle.importKey(
            'raw',
            new TextEncoder().encode(secret),
            { name: 'HMAC', hash: 'SHA-256' },
            false,
            ['verify']
        );
        
        const expectedSignature = new Uint8Array(
            atob(signature.replace(/[-_]/g, char => char === '-' ? '+' : '/') + '=='.slice(0, (4 - signature.length % 4) % 4))
                .split('').map(char => char.charCodeAt(0))
        );
        
        const isValid = await crypto.subtle.verify(
            'HMAC',
            key,
            expectedSignature,
            new TextEncoder().encode(data)
        );
        
        if (!isValid) {
            throw new Error('Invalid signature');
        }
        
        const payloadBase64 = payload.replace(/[-_]/g, char => char === '-' ? '+' : '/');
        const paddedPayload = payloadBase64 + '==='.slice((payloadBase64.length + 3) % 4);
        const decodedPayload = JSON.parse(atob(paddedPayload));
        decodedPayload.role = normalizeRole(decodedPayload.role);
        
        if (decodedPayload.exp && decodedPayload.exp < Date.now() / 1000) {
            throw new Error('Token expired');
        }
        
        return decodedPayload;
        
    } catch (error) {
        throw new Error('Token verification failed');
    }
}
