// 管理后台认证API
export async function onRequestPost(context) {
    const { request, env } = context;
    
    try {
        const { username, password } = await request.json();
        
        // 简单的用户验证（在生产环境中应该使用更安全的方式）
        const validUsers = {
            'admin': 'rsag2025!', // 管理员账号
            'editor': 'rsag_edit2025' // 编辑员账号
        };
        
        if (!validUsers[username] || validUsers[username] !== password) {
            return new Response(JSON.stringify({
                error: '用户名或密码错误'
            }), {
                status: 401,
                headers: {
                    'Content-Type': 'application/json'
                }
            });
        }
        
        // 生成JWT token（简化版本）
        const payload = {
            username,
            role: username === 'admin' ? 'admin' : 'editor',
            exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24小时过期
        };
        
        const token = await generateJWT(payload, env.JWT_SECRET || 'rsag-secret-key-2025');
        
        return new Response(JSON.stringify({
            token,
            user: {
                username,
                role: payload.role
            }
        }), {
            status: 200,
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
    } catch (error) {
        console.error('登录处理错误:', error);
        return new Response(JSON.stringify({
            error: '服务器内部错误'
        }), {
            status: 500,
            headers: {
                'Content-Type': 'application/json'
            }
        });
    }
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
        
        const decodedPayload = JSON.parse(atob(payload.replace(/[-_]/g, char => char === '-' ? '+' : '/')));
        
        if (decodedPayload.exp && decodedPayload.exp < Date.now() / 1000) {
            throw new Error('Token expired');
        }
        
        return decodedPayload;
        
    } catch (error) {
        throw new Error('Token verification failed');
    }
}
