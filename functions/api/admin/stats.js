// 统计数据API
import { authenticate, requireAdmin, createResponse, createErrorResponse, initDatabase } from './utils.js';

const DAY_MS = 24 * 60 * 60 * 1000;
const WEEK_MS = 7 * DAY_MS;
const ALLOWED_GRANULARITIES = ['day', 'week'];
const ALLOWED_TYPES = ['SCI', 'EI', 'Conference', 'DomesticConference'];
const TYPE_ALIASES = new Map([
    ['sci', 'SCI'],
    ['sci期刊', 'SCI'],
    ['sci收录', 'SCI'],
    ['ei', 'EI'],
    ['ei期刊', 'EI'],
    ['ei收录', 'EI'],
    ['conference', 'Conference'],
    ['internationalconference', 'Conference'],
    ['国际会议', 'Conference'],
    ['domesticconference', 'DomesticConference'],
    ['国内会议', 'DomesticConference']
]);
const WORKFLOW_STATUSES = ['draft', 'pending_review', 'pending_delete', 'scheduled', 'published'];
const WORKFLOW_ALIASES = {
    submitted: 'pending_review',
    accepted: 'published',
    delete_pending: 'pending_delete'
};

function parseRangeDays(rawValue) {
    const parsed = Number.parseInt(String(rawValue || ''), 10);
    if ([7, 30, 90, 180].includes(parsed)) {
        return parsed;
    }
    return 30;
}

function parseGranularity(rawValue) {
    const value = String(rawValue || '').trim().toLowerCase();
    if (ALLOWED_GRANULARITIES.includes(value)) {
        return value;
    }
    return 'day';
}

function toDateKeyUtc(date) {
    return date.toISOString().slice(0, 10);
}

function getUtcDayStart(date) {
    return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function addUtcDays(date, days) {
    return new Date(date.getTime() + days * DAY_MS);
}

function getUtcWeekStart(date) {
    const weekday = date.getUTCDay();
    const offset = (weekday + 6) % 7;
    return addUtcDays(getUtcDayStart(date), -offset);
}

function getDateBuckets(days, granularity = 'day') {
    const buckets = [];
    const today = getUtcDayStart(new Date());

    if (granularity === 'week') {
        const rangeStart = addUtcDays(today, -(days - 1));
        const startWeek = getUtcWeekStart(rangeStart);
        const endWeek = getUtcWeekStart(today);

        for (let cursor = startWeek; cursor.getTime() <= endWeek.getTime(); cursor = new Date(cursor.getTime() + WEEK_MS)) {
            buckets.push(toDateKeyUtc(cursor));
        }
        return buckets;
    }

    for (let i = days - 1; i >= 0; i -= 1) {
        const dt = addUtcDays(today, -i);
        buckets.push(toDateKeyUtc(dt));
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

function calculateMovingAverage(series, windowSize) {
    const values = Array.isArray(series) ? series : [];
    const window = Math.max(1, Number.parseInt(windowSize, 10) || 1);
    const result = [];

    for (let i = 0; i < values.length; i += 1) {
        const start = Math.max(0, i - window + 1);
        const segment = values.slice(start, i + 1);
        const sum = segment.reduce((acc, cur) => acc + (Number(cur) || 0), 0);
        result.push(Number((sum / segment.length).toFixed(2)));
    }

    return result;
}

function findPeakPoint(series, buckets) {
    const values = Array.isArray(series) ? series : [];
    const labels = Array.isArray(buckets) ? buckets : [];
    let peakIndex = 0;
    let peakValue = 0;

    for (let i = 0; i < values.length; i += 1) {
        const value = Number(values[i]) || 0;
        if (value > peakValue) {
            peakValue = value;
            peakIndex = i;
        }
    }

    return {
        index: peakIndex,
        date: labels[peakIndex] || null,
        value: peakValue
    };
}

function buildTrendDateExpr(sourceExpr, granularity) {
    if (granularity === 'week') {
        return `date(${sourceExpr}, '-' || ((CAST(strftime('%w', ${sourceExpr}) AS INTEGER) + 6) % 7) || ' days')`;
    }
    return `date(${sourceExpr})`;
}

function normalizeTypeValue(value) {
    const text = String(value || '').trim();
    if (!text) return '';
    if (ALLOWED_TYPES.includes(text)) return text;
    const aliasKey = text.toLowerCase().replace(/\s+/g, '');
    const mapped = TYPE_ALIASES.get(aliasKey) || text;
    return ALLOWED_TYPES.includes(mapped) ? mapped : '';
}

function inferPublicationType(row) {
    const title = String(row?.title || '');
    const journal = String(row?.journal || '');
    const keywords = String(row?.keywords || '');
    const doi = String(row?.doi || '');
    const mixed = `${title} ${journal} ${keywords}`;
    const lower = mixed.toLowerCase();

    if (/国内会议|中文会议/.test(mixed)) {
        return 'DomesticConference';
    }

    if (/国际会议/.test(mixed) || /international conference/.test(lower)) {
        return 'Conference';
    }

    if (/conference|symposium|workshop|proceedings|forum/.test(lower)) {
        return 'Conference';
    }

    if (/会议|论坛|研讨会|年会/.test(mixed)) {
        return /国际/.test(mixed) ? 'Conference' : 'DomesticConference';
    }

    if (/\bsci\b/.test(lower)) {
        return 'SCI';
    }

    if (/\bei\b/.test(lower)) {
        return 'EI';
    }

    if (doi || journal) {
        return 'SCI';
    }

    return '';
}

function parsePublicationTypes(row) {
    let values = [];
    const typesRaw = row?.types;
    const typeRaw = row?.type;

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

    const type = normalizeTypeValue(typeRaw);
    if (type) {
        values.push(type);
    }

    const unique = [];
    for (const value of values) {
        const normalized = normalizeTypeValue(value);
        if (normalized && !unique.includes(normalized)) {
            unique.push(normalized);
        }
    }

    if (unique.length === 0) {
        const inferred = inferPublicationType(row);
        if (inferred) {
            unique.push(inferred);
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
        const types = parsePublicationTypes(row);
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

function normalizeWorkflowStatus(value) {
    const raw = String(value || '').trim().toLowerCase();
    const mapped = WORKFLOW_ALIASES[raw] || raw;
    return WORKFLOW_STATUSES.includes(mapped) ? mapped : 'draft';
}

function buildWorkflowSummary(rows, extras = {}) {
    const result = {
        draft: 0,
        pending_review: 0,
        pending_delete: 0,
        scheduled: 0,
        published: 0,
        total: 0,
        dueScheduled: Number(extras.dueScheduled) || 0,
        stalePendingReview: Number(extras.stalePendingReview) || 0
    };

    for (const row of rows || []) {
        const status = normalizeWorkflowStatus(row?.status);
        const count = Number.parseInt(row?.count, 10) || 0;
        result[status] += count;
        result.total += count;
    }

    return result;
}

// GET /api/admin/stats - 获取统计数据
export async function onRequestGet(context) {
    const { request, env } = context;
    
    try {
        // 认证检查
        const user = await authenticate(request, env);
        requireAdmin(user);

        const url = new URL(request.url);
        const rangeDays = parseRangeDays(url.searchParams.get('rangeDays') || url.searchParams.get('range'));
        const granularity = parseGranularity(url.searchParams.get('granularity'));
        const offsetExpr = `-${rangeDays - 1} day`;
        const publicationDateExpr = buildTrendDateExpr('created_at', granularity);
        const newsSourceExpr = 'COALESCE(publish_date, created_at)';
        const newsDateExpr = buildTrendDateExpr(newsSourceExpr, granularity);
        const filesDateExpr = buildTrendDateExpr('created_at', granularity);
        
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
            recentActivities,
            publicationWorkflowRows,
            newsWorkflowRows,
            duePublicationScheduled,
            dueNewsScheduled,
            stalePublicationPending,
            staleNewsPending
        ] = await Promise.all([
            db.prepare('SELECT COUNT(*) as count FROM publications').first(),
            db.prepare('SELECT COUNT(*) as count FROM news WHERE status = "published"').first(),
            db.prepare('SELECT COUNT(*) as count FROM team_members').first(),
            db.prepare('SELECT COUNT(*) as count FROM files').first(),
            db.prepare(`
                SELECT ${publicationDateExpr} as day, COUNT(*) as count
                FROM publications
                WHERE ${publicationDateExpr} >= date('now', ?)
                GROUP BY ${publicationDateExpr}
                ORDER BY day ASC
            `).bind(offsetExpr).all(),
            db.prepare(`
                SELECT ${newsDateExpr} as day, COUNT(*) as count
                FROM news
                WHERE ${newsDateExpr} >= date('now', ?)
                GROUP BY ${newsDateExpr}
                ORDER BY day ASC
            `).bind(offsetExpr).all(),
            db.prepare(`
                SELECT ${filesDateExpr} as day, COUNT(*) as count
                FROM files
                WHERE ${filesDateExpr} >= date('now', ?)
                GROUP BY ${filesDateExpr}
                ORDER BY day ASC
            `).bind(offsetExpr).all(),
            db.prepare('SELECT type, types, title, journal, keywords, doi FROM publications').all(),
            db.prepare(`
                SELECT action, user, details, created_at
                FROM activity_logs
                ORDER BY created_at DESC
                LIMIT 8
            `).all(),
            db.prepare('SELECT status, COUNT(*) as count FROM publications GROUP BY status').all(),
            db.prepare('SELECT status, COUNT(*) as count FROM news GROUP BY status').all(),
            db.prepare(`
                SELECT COUNT(*) as count
                FROM publications
                WHERE status = 'scheduled'
                  AND scheduled_publish_at IS NOT NULL
                  AND datetime(scheduled_publish_at) <= datetime('now')
            `).first(),
            db.prepare(`
                SELECT COUNT(*) as count
                FROM news
                WHERE status = 'scheduled'
                  AND scheduled_publish_at IS NOT NULL
                  AND datetime(scheduled_publish_at) <= datetime('now')
            `).first(),
            db.prepare(`
                SELECT COUNT(*) as count
                FROM publications
                WHERE status = 'pending_review'
                  AND submitted_at IS NOT NULL
                  AND datetime(submitted_at) <= datetime('now', '-3 day')
            `).first(),
            db.prepare(`
                SELECT COUNT(*) as count
                FROM news
                WHERE status = 'pending_review'
                  AND submitted_at IS NOT NULL
                  AND datetime(submitted_at) <= datetime('now', '-3 day')
            `).first()
        ]);

        const buckets = getDateBuckets(rangeDays, granularity);
        const movingAverageWindow = granularity === 'week' ? 4 : 7;
        const publicationSeries = toCountSeries(publicationTrendRows.results || [], buckets);
        const newsSeries = toCountSeries(newsTrendRows.results || [], buckets);
        const filesSeries = toCountSeries(filesTrendRows.results || [], buckets);
        const publicationMovingAvg = calculateMovingAverage(publicationSeries, movingAverageWindow);
        const newsMovingAvg = calculateMovingAverage(newsSeries, movingAverageWindow);
        const filesMovingAvg = calculateMovingAverage(filesSeries, movingAverageWindow);
        const publicationTypeDistribution = buildPublicationTypeDistribution(publicationTypeRows.results || []);
        const publicationWorkflow = buildWorkflowSummary(publicationWorkflowRows.results || [], {
            dueScheduled: duePublicationScheduled?.count,
            stalePendingReview: stalePublicationPending?.count
        });
        const newsWorkflow = buildWorkflowSummary(newsWorkflowRows.results || [], {
            dueScheduled: dueNewsScheduled?.count,
            stalePendingReview: staleNewsPending?.count
        });
        const workflowTotals = {
            pendingReview: publicationWorkflow.pending_review + newsWorkflow.pending_review,
            pendingDelete: publicationWorkflow.pending_delete + newsWorkflow.pending_delete,
            dueScheduled: publicationWorkflow.dueScheduled + newsWorkflow.dueScheduled,
            stalePendingReview: publicationWorkflow.stalePendingReview + newsWorkflow.stalePendingReview
        };
        
        return createResponse({
            publications: publicationsCount.count,
            news: newsCount.count,
            team: teamCount.count,
            files: filesCount.count,
            rangeDays,
            granularity,
            trends: {
                dates: buckets,
                granularity,
                movingAverageWindow,
                publications: publicationSeries,
                news: newsSeries,
                files: filesSeries,
                publicationsMovingAvg: publicationMovingAvg,
                newsMovingAvg: newsMovingAvg,
                filesMovingAvg: filesMovingAvg,
                peaks: {
                    publications: findPeakPoint(publicationSeries, buckets),
                    news: findPeakPoint(newsSeries, buckets),
                    files: findPeakPoint(filesSeries, buckets)
                }
            },
            distributions: {
                publicationTypes: publicationTypeDistribution
            },
            workflow: {
                publications: publicationWorkflow,
                news: newsWorkflow,
                totals: workflowTotals
            },
            recentActivities: recentActivities.results || [],
            lastUpdate: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('获取统计数据失败:', error);
        return createErrorResponse(error.message, error.status || 500);
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
