// 统计数据API
import { authenticate, createResponse, createErrorResponse, initDatabase } from './utils.js';

const DAY_MS = 24 * 60 * 60 * 1000;
const ALLOWED_TYPES = ['SCI', 'EI', 'Conference', 'DomesticConference'];

function parseRangeDays(rawValue) {
    const parsed = Number.parseInt(String(rawValue || ''), 10);
    if ([7, 30, 90, 180].includes(parsed)) {
        return parsed;
    }
    return 30;
}

function getDateBuckets(days) {
    const buckets = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = days - 1; i >= 0; i -= 1) {
        const dt = new Date(today.getTime() - i * DAY_MS);
        buckets.push(dt.toISOString().slice(0, 10));
    }

    return buckets;
}

function toCountSeries(rows, buckets) {
    const map = new Map();
    for (const row of rows || []) {
        map.set(row.day, Number.parseInt(row.count, 10) || 0);
    }
    return buckets.map((day) => map.get(day) || 0);
}

function parsePublicationTypes(typesRaw, typeRaw) {
    let values = [];

    if (typeof typesRaw === 'string' && typesRaw.trim()) {
        const raw = typesRaw.trim();
        if (raw.startsWith('[')) {
            try {
                const parsed = JSON.parse(raw);
                values = Array.isArray(parsed) ? parsed : [];
            } catch {
                values = raw.split(',');
            }
        } else {
            values = raw.split(',');
        }
    }

    if (typeRaw) {
        values.push(typeRaw);
    }

    const unique = [];
    for (const value of values) {
        const normalized = String(value || '').trim();
        if (ALLOWED_TYPES.includes(normalized) && !unique.includes(normalized)) {
            unique.push(normalized);
        }
    }

    return unique;
}

function buildPublicationTypeDistribution(rows) {
    const counts = {
        SCI: 0,
        EI: 0,
        Conference: 0,
        DomesticConference: 0
    };

    for (const row of rows || []) {
        const types = parsePublicationTypes(row.types, row.type);
        if (types.length === 0) {
            continue;
        }
        for (const type of types) {
            counts[type] += 1;
        }
    }

    const labels = {
        SCI: 'SCI',
        EI: 'EI',
        Conference: '国际会议',
        DomesticConference: '国内会议'
    };

    return ALLOWED_TYPES.map((type) => ({
        type,
        label: labels[type],
        count: counts[type]
    }));
}

// GET /api/admin/stats - 获取统计数据
export async function onRequestGet(context) {
    const { request, env } = context;
    
    try {
        // 认证检查
        await authenticate(request, env);

        const url = new URL(request.url);
        const rangeDays = parseRangeDays(url.searchParams.get('rangeDays') || url.searchParams.get('range'));
        const offsetExpr = `-${rangeDays - 1} day`;
        
        const db = env.DB;
        await initDatabase(db);
        
        // 获取概览统计
        const [
            publicationsCount,
            newsCount,
            teamCount,
            filesCount,
            publicationTrendRows,
            newsTrendRows,
            filesTrendRows,
            publicationTypeRows,
            recentActivities
        ] = await Promise.all([
            db.prepare('SELECT COUNT(*) as count FROM publications').first(),
            db.prepare('SELECT COUNT(*) as count FROM news WHERE status = "published"').first(),
            db.prepare('SELECT COUNT(*) as count FROM team_members WHERE status = "active"').first(),
            db.prepare('SELECT COUNT(*) as count FROM files').first(),
            db.prepare(`
                SELECT date(created_at) as day, COUNT(*) as count
                FROM publications
                WHERE date(created_at) >= date('now', ?)
                GROUP BY date(created_at)
                ORDER BY day ASC
            `).bind(offsetExpr).all(),
            db.prepare(`
                SELECT date(COALESCE(publish_date, created_at)) as day, COUNT(*) as count
                FROM news
                WHERE date(COALESCE(publish_date, created_at)) >= date('now', ?)
                GROUP BY date(COALESCE(publish_date, created_at))
                ORDER BY day ASC
            `).bind(offsetExpr).all(),
            db.prepare(`
                SELECT date(created_at) as day, COUNT(*) as count
                FROM files
                WHERE date(created_at) >= date('now', ?)
                GROUP BY date(created_at)
                ORDER BY day ASC
            `).bind(offsetExpr).all(),
            db.prepare('SELECT type, types FROM publications').all(),
            db.prepare(`
                SELECT action, user, details, created_at
                FROM activity_logs
                ORDER BY created_at DESC
                LIMIT 8
            `).all()
        ]);

        const buckets = getDateBuckets(rangeDays);
        const publicationTypeDistribution = buildPublicationTypeDistribution(publicationTypeRows.results || []);
        
        return createResponse({
            publications: publicationsCount.count,
            news: newsCount.count,
            team: teamCount.count,
            files: filesCount.count,
            rangeDays,
            trends: {
                dates: buckets,
                publications: toCountSeries(publicationTrendRows.results || [], buckets),
                news: toCountSeries(newsTrendRows.results || [], buckets),
                files: toCountSeries(filesTrendRows.results || [], buckets)
            },
            distributions: {
                publicationTypes: publicationTypeDistribution
            },
            recentActivities: recentActivities.results || [],
            lastUpdate: new Date().toISOString()
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
