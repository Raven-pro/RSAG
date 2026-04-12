// 数据库工具函数和认证中间件
import { ensureUsersSchema, normalizeRole } from './auth/security.js';

function createHttpError(message, status = 500) {
    const error = new Error(message);
    error.status = status;
    return error;
}

// 认证中间件
export async function authenticate(request, env) {
    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new Error('未提供认证令牌');
    }
    
    const token = authHeader.substring(7);
    
    try {
        const { verifyJWT } = await import('./auth/login.js');
        const payload = await verifyJWT(token, env.JWT_SECRET || 'rsag-secret-key-2025');
        return {
            ...payload,
            role: normalizeRole(payload?.role)
        };
    } catch (error) {
        throw new Error('认证失败');
    }
}

export function isAdminUser(user) {
    return normalizeRole(user?.role) === 'admin';
}

export function requireAdmin(user, message = '仅管理员可执行该操作') {
    if (!isAdminUser(user)) {
        throw createHttpError(message, 403);
    }
}

export function requireOwnerOrAdmin(user, ownerUsername, message = '无权访问该资源') {
    if (isAdminUser(user)) {
        return;
    }
    if (!ownerUsername || String(ownerUsername) !== String(user?.username || '')) {
        throw createHttpError(message, 403);
    }
}

// 数据库初始化
export async function initDatabase(db) {
    try {
        await ensureUsersSchema(db);

        // 创建论文表
        await db.prepare(`
            CREATE TABLE IF NOT EXISTS publications (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                authors TEXT NOT NULL,
                journal TEXT NOT NULL,
                year INTEGER NOT NULL,
                volume TEXT,
                doi TEXT,
                url TEXT,
                type TEXT,
                types TEXT,
                pdf_url TEXT,
                abstract TEXT,
                keywords TEXT,
                status TEXT DEFAULT 'published',
                scheduled_publish_at DATETIME,
                submitted_at DATETIME,
                reviewed_by TEXT,
                reviewed_at DATETIME,
                created_by TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `).run();

        // 创建新闻表
        await db.prepare(`
            CREATE TABLE IF NOT EXISTS news (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                title_en TEXT,
                summary TEXT,
                summary_en TEXT,
                content TEXT NOT NULL,
                content_en TEXT,
                author TEXT NOT NULL,
                publish_date DATE NOT NULL,
                featured_image TEXT,
                category TEXT DEFAULT 'general',
                tags TEXT,
                status TEXT DEFAULT 'published',
                scheduled_publish_at DATETIME,
                submitted_at DATETIME,
                reviewed_by TEXT,
                reviewed_at DATETIME,
                created_by TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `).run();

        // 创建团队成员表
        await db.prepare(`
            CREATE TABLE IF NOT EXISTS team_members (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                title TEXT NOT NULL,
                bio TEXT,
                research_area TEXT,
                photo_url TEXT,
                email TEXT,
                phone TEXT,
                order_index INTEGER DEFAULT 0,
                status TEXT DEFAULT 'active',
                created_by TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `).run();

        // 创建文件表
        await db.prepare(`
            CREATE TABLE IF NOT EXISTS files (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                filename TEXT NOT NULL,
                original_name TEXT NOT NULL,
                file_url TEXT NOT NULL,
                file_type TEXT NOT NULL,
                file_size INTEGER,
                category TEXT,
                uploaded_by TEXT,
                lifecycle_status TEXT DEFAULT 'active',
                reference_count INTEGER DEFAULT 0,
                is_orphan INTEGER DEFAULT 0,
                deleted_at DATETIME,
                deleted_by TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `).run();

        // 创建文件引用关系表
        await db.prepare(`
            CREATE TABLE IF NOT EXISTS file_references (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                file_id INTEGER NOT NULL,
                entity_type TEXT NOT NULL,
                entity_id INTEGER NOT NULL,
                field_name TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(file_id, entity_type, entity_id, field_name)
            )
        `).run();
        await db.prepare('CREATE INDEX IF NOT EXISTS idx_file_refs_entity ON file_references(entity_type, entity_id)').run();
        await db.prepare('CREATE INDEX IF NOT EXISTS idx_file_refs_file ON file_references(file_id)').run();
        await db.prepare('CREATE INDEX IF NOT EXISTS idx_publications_created_at ON publications(created_at)').run();
        await db.prepare('CREATE INDEX IF NOT EXISTS idx_publications_status_created_at ON publications(status, created_at)').run();
        await db.prepare('CREATE INDEX IF NOT EXISTS idx_news_publish_date ON news(publish_date)').run();
        await db.prepare('CREATE INDEX IF NOT EXISTS idx_news_created_at ON news(created_at)').run();
        await db.prepare('CREATE INDEX IF NOT EXISTS idx_files_created_at ON files(created_at)').run();

        await ensureColumnExists(db, 'publications', 'type', 'TEXT');
        await ensureColumnExists(db, 'publications', 'types', 'TEXT');
        await ensureColumnExists(db, 'publications', 'pdf_url', 'TEXT');
        await ensureColumnExists(db, 'publications', 'scheduled_publish_at', 'DATETIME');
        await ensureColumnExists(db, 'publications', 'submitted_at', 'DATETIME');
        await ensureColumnExists(db, 'publications', 'reviewed_by', 'TEXT');
        await ensureColumnExists(db, 'publications', 'reviewed_at', 'DATETIME');
        await ensureColumnExists(db, 'news', 'scheduled_publish_at', 'DATETIME');
        await ensureColumnExists(db, 'news', 'submitted_at', 'DATETIME');
        await ensureColumnExists(db, 'news', 'reviewed_by', 'TEXT');
        await ensureColumnExists(db, 'news', 'reviewed_at', 'DATETIME');
        await ensureColumnExists(db, 'news', 'title_en', 'TEXT');
        await ensureColumnExists(db, 'news', 'summary_en', 'TEXT');
        await ensureColumnExists(db, 'news', 'content_en', 'TEXT');
        await ensureColumnExists(db, 'files', 'category', 'TEXT');
        await ensureColumnExists(db, 'files', 'lifecycle_status', "TEXT DEFAULT 'active'");
        await ensureColumnExists(db, 'files', 'reference_count', 'INTEGER DEFAULT 0');
        await ensureColumnExists(db, 'files', 'is_orphan', 'INTEGER DEFAULT 0');
        await ensureColumnExists(db, 'files', 'deleted_at', 'DATETIME');
        await ensureColumnExists(db, 'files', 'deleted_by', 'TEXT');
        await ensureColumnExists(db, 'files', 'updated_at', 'DATETIME DEFAULT CURRENT_TIMESTAMP');

        // 兼容历史状态值，统一映射到新工作流状态
        await db.prepare("UPDATE publications SET status = 'pending_review' WHERE lower(status) = 'submitted'").run();
        await db.prepare("UPDATE publications SET status = 'published' WHERE lower(status) = 'accepted'").run();
        await db.prepare("UPDATE news SET status = 'pending_review' WHERE lower(status) = 'submitted'").run();
        await db.prepare("UPDATE news SET status = 'published' WHERE lower(status) = 'accepted'").run();

        // 回填文件与业务实体之间的引用关系（幂等）
        await db.prepare(`
            INSERT OR IGNORE INTO file_references (file_id, entity_type, entity_id, field_name)
            SELECT f.id, 'news', n.id, 'featured_image'
            FROM news n
            JOIN files f ON f.file_url = n.featured_image
            WHERE n.featured_image IS NOT NULL AND trim(n.featured_image) <> ''
        `).run();
        await db.prepare(`
            INSERT OR IGNORE INTO file_references (file_id, entity_type, entity_id, field_name)
            SELECT f.id, 'team_members', t.id, 'photo_url'
            FROM team_members t
            JOIN files f ON f.file_url = t.photo_url
            WHERE t.photo_url IS NOT NULL AND trim(t.photo_url) <> ''
        `).run();
        await db.prepare(`
            INSERT OR IGNORE INTO file_references (file_id, entity_type, entity_id, field_name)
            SELECT f.id, 'publications', p.id, 'pdf_url'
            FROM publications p
            JOIN files f ON f.file_url = p.pdf_url
            WHERE p.pdf_url IS NOT NULL AND trim(p.pdf_url) <> ''
        `).run();

        await db.prepare(`
            UPDATE files
            SET reference_count = (
                    SELECT COUNT(*)
                    FROM file_references r
                    WHERE r.file_id = files.id
                ),
                is_orphan = CASE
                    WHEN (
                        SELECT COUNT(*)
                        FROM file_references r
                        WHERE r.file_id = files.id
                    ) > 0 THEN 0
                    WHEN lower(COALESCE(category, '')) IN ('news', 'avatar', 'pdf') THEN 1
                    ELSE COALESCE(is_orphan, 0)
                END,
                lifecycle_status = COALESCE(NULLIF(trim(lifecycle_status), ''), 'active'),
                updated_at = COALESCE(updated_at, CURRENT_TIMESTAMP)
        `).run();

        // 创建活动日志表
        await db.prepare(`
            CREATE TABLE IF NOT EXISTS activity_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                action TEXT NOT NULL,
                table_name TEXT NOT NULL,
                record_id INTEGER,
                user TEXT NOT NULL,
                details TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `).run();

        console.log('数据库初始化完成');
        
        // 插入示例数据
        await insertSampleData(db);
        
    } catch (error) {
        console.error('数据库初始化失败:', error);
        throw error;
    }
}

// 插入示例数据
async function insertSampleData(db) {
    try {
        // 检查是否已有数据
        const publicationCount = await db.prepare('SELECT COUNT(*) as count FROM publications').first();
        
        if (publicationCount.count === 0) {
            // 插入示例论文
            await db.prepare(`
                INSERT INTO publications (title, authors, journal, year, doi, url, status, created_by)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `).bind(
                'Advanced full-core modeling of fission product release in pebble-bed high-temperature gas-cooled reactors',
                'Chenghao Cao',
                'Annals of Nuclear Energy',
                2025,
                '10.1016/j.anucene.2025.111240',
                'https://doi.org/10.1016/j.anucene.2025.111240',
                'published',
                'system'
            ).run();

            await db.prepare(`
                INSERT INTO publications (title, authors, journal, year, doi, url, status, created_by)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `).bind(
                'High-Fidelity Neutronics/Thermal Hydraulics/Pebble Flow Coupling Simulation of Pebble Bed Reactor HTR-PM',
                'Ruihan Li',
                'Nuclear Science and Engineering',
                2025,
                '10.1080/00295639.2025.2471712',
                'https://doi.org/10.1080/00295639.2025.2471712',
                'published',
                'system'
            ).run();
        }

        const newsCount = await db.prepare('SELECT COUNT(*) as count FROM news').first();
        
        if (newsCount.count === 0) {
            // 插入示例新闻
            await db.prepare(`
                INSERT INTO news (title, summary, content, author, publish_date, category, status, created_by)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `).bind(
                '团队成员萧星宇论文在第六届中国"双法"研究会风险管理分会学术年会暨2025年清华大学质量与可靠性研究院年会论文评选活动中入选推荐名单',
                '祝贺团队成员在学术评选活动中取得优异成绩',
                '<p>在第六届中国"双法"研究会风险管理分会学术年会暨2025年清华大学质量与可靠性研究院年会论文评选活动中，我团队成员萧星宇的研究论文经过严格的评审程序，成功入选推荐名单。</p><p>这一成果体现了我们团队在核电人因可靠性分析领域的研究实力，也为相关领域的学术交流做出了贡献。</p>',
                '管理员',
                '2025-08-11',
                'award',
                'published',
                'system'
            ).run();

            await db.prepare(`
                INSERT INTO news (title, summary, content, author, publish_date, category, status, created_by)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `).bind(
                '祝贺！团队成员齐奔和李睿涵通过博士论文答辩',
                '两位博士研究生顺利完成学位论文答辩',
                '<p>近日，我们课题组的两位博士研究生齐奔和李睿涵顺利通过了博士学位论文答辩。</p><p>齐奔的研究方向为核能系统智能化监测、诊断与预测，李睿涵专注于高温气冷堆高保真多物理耦合研究。两位同学的研究成果为相关领域做出了重要贡献。</p><p>祝贺两位博士顺利毕业，期待他们在未来的学术道路上取得更大成就！</p>',
                '管理员',
                '2025-05-09',
                'personnel',
                'published',
                'system'
            ).run();
        }

        const teamCount = await db.prepare('SELECT COUNT(*) as count FROM team_members').first();
        
        if (teamCount.count === 0) {
            // 插入团队成员示例数据
            const teamMembers = [
                {
                    name: '梁金刚',
                    title: '副教授',
                    research_area: '反应堆放射性源项、辐射防护与屏蔽分析、蒙特卡罗粒子输运模拟、智能化核应急决策技术',
                    photo_url: '/images/梁金刚.png',
                    order_index: 1
                },
                {
                    name: '齐奔',
                    title: '博士',
                    research_area: '核能系统智能化监测、诊断与预测',
                    photo_url: '/images/齐奔.png',
                    order_index: 2
                },
                {
                    name: '李睿涵',
                    title: '博士',
                    research_area: '高温气冷堆高保真多物理耦合研究',
                    photo_url: '/images/睿涵.png',
                    order_index: 3
                },
                {
                    name: '张伟健',
                    title: '硕士',
                    research_area: '基于γ谱法的高温气冷堆辐照燃料源项实验基准设计',
                    photo_url: '/images/伟健.png',
                    order_index: 4
                },
                {
                    name: '陈俊逸',
                    title: '博士生',
                    research_area: '辐射屏蔽先进计算方法、GPU并行开发研究',
                    photo_url: '/images/俊逸.png',
                    order_index: 5
                },
                {
                    name: '萧星宇',
                    title: '博士生',
                    research_area: '先进核电系统人因可靠性建模与智能评估',
                    photo_url: '/images/星宇.png',
                    order_index: 6
                },
                {
                    name: '曹成昊',
                    title: '硕士生',
                    research_area: '高温气冷堆放射性源项分析',
                    photo_url: '/images/成昊.jpg',
                    order_index: 7
                },
                {
                    name: '郭天远',
                    title: '硕士生',
                    research_area: '高温气冷堆事故工况下裂变产物迁移行为及厂房滞留效应研究',
                    photo_url: '/images/天远.png',
                    order_index: 8
                },
                {
                    name: '沈绍宁',
                    title: '博士生/科研助理',
                    research_area: '中子输运',
                    photo_url: '/images/沈绍宁.jpg',
                    order_index: 9
                }
            ];

            for (const member of teamMembers) {
                await db.prepare(`
                    INSERT INTO team_members (name, title, research_area, photo_url, order_index, created_by)
                    VALUES (?, ?, ?, ?, ?, ?)
                `).bind(
                    member.name,
                    member.title,
                    member.research_area,
                    member.photo_url,
                    member.order_index,
                    'system'
                ).run();
            }
        }

        console.log('示例数据插入完成');
        
    } catch (error) {
        console.error('插入示例数据失败:', error);
    }
}

// 记录活动日志
export async function logActivity(db, action, tableName, recordId, user, details = null) {
    try {
        await db.prepare(`
            INSERT INTO activity_logs (action, table_name, record_id, user, details)
            VALUES (?, ?, ?, ?, ?)
        `).bind(action, tableName, recordId, user, details).run();
    } catch (error) {
        console.error('记录活动日志失败:', error);
    }
}

async function ensureColumnExists(db, tableName, columnName, columnType) {
    try {
        await db.prepare(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${columnType}`).run();
    } catch (error) {
        const message = String(error?.message || '');
        if (message.includes('duplicate column name')) {
            return;
        }

        // D1/SQLite 在 ALTER TABLE ADD COLUMN 时不接受 DEFAULT CURRENT_TIMESTAMP 这类非常量默认值。
        // 遇到该错误时自动去掉默认值并重试，避免初始化流程中断。
        if (/non-constant default|default value of column .* is not constant/i.test(message)) {
            const fallbackType = String(columnType || '').replace(/\s+DEFAULT\s+CURRENT_TIMESTAMP\b/i, '').trim();
            if (fallbackType && fallbackType !== columnType) {
                try {
                    await db.prepare(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${fallbackType}`).run();
                    return;
                } catch (retryError) {
                    const retryMessage = String(retryError?.message || '');
                    if (retryMessage.includes('duplicate column name')) {
                        return;
                    }
                    throw retryError;
                }
            }
        }

        throw error;
    }
}

// 通用分页查询
export function buildPaginationQuery(baseQuery, page = 1, limit = 10) {
    const offset = (page - 1) * limit;
    return {
        query: `${baseQuery} LIMIT ? OFFSET ?`,
        params: [limit, offset]
    };
}

// 通用响应格式
export function createResponse(data, status = 200) {
    return new Response(JSON.stringify(data), {
        status,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        }
    });
}

// 错误响应
export function createErrorResponse(message, status = 500) {
    return createResponse({ error: message }, status);
}
