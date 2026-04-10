const PASSWORD_SCHEME = 'pbkdf2_sha256';
const PASSWORD_ITERATIONS = 120000;
const PASSWORD_KEY_BYTES = 32;

const VALID_ROLES = new Set(['admin', 'member']);

function encodeBase64Url(bytes) {
    const binary = String.fromCharCode(...bytes);
    return btoa(binary)
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/g, '');
}

function decodeBase64Url(value) {
    const normalized = String(value || '')
        .replace(/-/g, '+')
        .replace(/_/g, '/');
    const padding = '='.repeat((4 - (normalized.length % 4)) % 4);
    const raw = atob(normalized + padding);
    return Uint8Array.from(raw, (char) => char.charCodeAt(0));
}

function timingSafeEqual(left, right) {
    if (left.length !== right.length) {
        return false;
    }
    let diff = 0;
    for (let i = 0; i < left.length; i += 1) {
        diff |= left[i] ^ right[i];
    }
    return diff === 0;
}

async function derivePasswordHash(password, saltBytes, iterations) {
    const passwordKey = await crypto.subtle.importKey(
        'raw',
        new TextEncoder().encode(String(password || '')),
        'PBKDF2',
        false,
        ['deriveBits']
    );

    const derivedBits = await crypto.subtle.deriveBits(
        {
            name: 'PBKDF2',
            hash: 'SHA-256',
            salt: saltBytes,
            iterations
        },
        passwordKey,
        PASSWORD_KEY_BYTES * 8
    );

    return new Uint8Array(derivedBits);
}

function assertPasswordInput(password) {
    const value = String(password || '');
    if (value.length < 8) {
        throw new Error('密码至少需要 8 个字符');
    }
}

export function normalizeRole(role) {
    const value = String(role || '').trim().toLowerCase();
    if (value === 'editor') {
        return 'member';
    }
    if (VALID_ROLES.has(value)) {
        return value;
    }
    return 'member';
}

export async function hashPassword(password) {
    assertPasswordInput(password);
    const saltBytes = crypto.getRandomValues(new Uint8Array(16));
    const derivedBytes = await derivePasswordHash(password, saltBytes, PASSWORD_ITERATIONS);
    return `${PASSWORD_SCHEME}$${PASSWORD_ITERATIONS}$${encodeBase64Url(saltBytes)}$${encodeBase64Url(derivedBytes)}`;
}

export async function verifyPassword(password, encodedHash) {
    const stored = String(encodedHash || '');
    if (!stored) {
        return false;
    }

    // Legacy fallback: if hash format is unknown, compare plain text directly.
    if (!stored.includes('$')) {
        return stored === String(password || '');
    }

    const [scheme, iterationsRaw, saltRaw, hashRaw] = stored.split('$');
    if (scheme !== PASSWORD_SCHEME || !iterationsRaw || !saltRaw || !hashRaw) {
        return false;
    }

    const iterations = Number.parseInt(iterationsRaw, 10);
    if (!Number.isInteger(iterations) || iterations <= 0) {
        return false;
    }

    const saltBytes = decodeBase64Url(saltRaw);
    const expectedBytes = decodeBase64Url(hashRaw);
    const actualBytes = await derivePasswordHash(password, saltBytes, iterations);
    return timingSafeEqual(actualBytes, expectedBytes);
}

async function ensureColumnExists(db, tableName, columnName, columnType) {
    try {
        await db.prepare(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${columnType}`).run();
    } catch (error) {
        const message = String(error?.message || '');
        if (!message.includes('duplicate column name')) {
            throw error;
        }
    }
}

export async function ensureUsersSchema(db) {
    await db.prepare(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            role TEXT NOT NULL DEFAULT 'member',
            is_active INTEGER NOT NULL DEFAULT 1,
            created_by TEXT,
            last_login_at DATETIME,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `).run();

    await ensureColumnExists(db, 'users', 'role', "TEXT NOT NULL DEFAULT 'member'");
    await ensureColumnExists(db, 'users', 'is_active', 'INTEGER NOT NULL DEFAULT 1');
    await ensureColumnExists(db, 'users', 'created_by', 'TEXT');
    await ensureColumnExists(db, 'users', 'last_login_at', 'DATETIME');
    await ensureColumnExists(db, 'users', 'updated_at', 'DATETIME DEFAULT CURRENT_TIMESTAMP');

    await db.prepare("UPDATE users SET role = 'member' WHERE role IS NULL OR trim(role) = '' OR lower(role) IN ('editor', 'user')").run();
    await db.prepare("UPDATE users SET role = 'admin' WHERE lower(role) = 'admin'").run();
    await db.prepare('UPDATE users SET is_active = 1 WHERE is_active IS NULL').run();
}

export async function ensureDefaultAdminUser(db, env) {
    const adminUsername = String(env.ADMIN_USERNAME || 'admin').trim();
    const adminPassword = String(env.ADMIN_PASSWORD || 'rsag2025!');

    const adminCountResult = await db.prepare(
        "SELECT COUNT(*) AS count FROM users WHERE role = 'admin' AND is_active = 1"
    ).first();
    const adminCount = Number.parseInt(adminCountResult?.count, 10) || 0;

    if (adminCount > 0) {
        return;
    }

    const adminHash = await hashPassword(adminPassword);
    const existingUser = await db.prepare('SELECT id FROM users WHERE username = ?').bind(adminUsername).first();

    if (existingUser?.id) {
        await db.prepare(`
            UPDATE users
            SET password_hash = ?, role = 'admin', is_active = 1, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `).bind(adminHash, existingUser.id).run();
        return;
    }

    await db.prepare(`
        INSERT INTO users (username, password_hash, role, is_active, created_by)
        VALUES (?, ?, 'admin', 1, 'system')
    `).bind(adminUsername, adminHash).run();
}