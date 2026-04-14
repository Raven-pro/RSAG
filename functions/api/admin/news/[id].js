import {
    authenticate,
    isAdminUser,
    requireOwnerOrAdmin,
    logActivity,
    createResponse,
    createErrorResponse,
    initDatabase
} from '../utils.js';
import { normalizeWorkflowStatus, buildWorkflowOnUpdate } from '../workflow.js';
import { syncEntityFileReference, syncEntityFileReferences, clearEntityFileReferences } from '../file-references.js';

function hydrateNewsRow(row) {
    return {
        ...row,
        status: normalizeWorkflowStatus(row?.status, 'draft')
    };
}

function resolveMemberEditableStatus(rawStatus, fallback = 'draft') {
    const normalized = normalizeWorkflowStatus(rawStatus, fallback);
    return normalized === 'pending_review' ? 'pending_review' : 'draft';
}

function extractEmbeddedImageUrls(...contents) {
    const merged = contents.map((item) => String(item || '')).join('\n');
    if (!merged.trim()) {
        return [];
    }

    const urls = new Set();

    const markdownPattern = /!\[[^\]]*\]\(([^)\n]+)\)/g;
    let markdownMatch;
    while ((markdownMatch = markdownPattern.exec(merged)) !== null) {
        const raw = String(markdownMatch[1] || '').trim();
        if (!raw) continue;
        const normalized = raw.replace(/^<|>$/g, '').split(/\s+/)[0].trim();
        if (normalized) {
            urls.add(normalized);
        }
    }

    const htmlPattern = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi;
    let htmlMatch;
    while ((htmlMatch = htmlPattern.exec(merged)) !== null) {
        const normalized = String(htmlMatch[1] || '').trim();
        if (normalized) {
            urls.add(normalized);
        }
    }

    return Array.from(urls.values());
}

// GET /api/admin/news/[id]
export async function onRequestGet(context) {
    const { request, env, params } = context;

    try {
        const user = await authenticate(request, env);

        const id = parseInt(params.id || '', 10);
        if (!Number.isInteger(id) || id <= 0) {
            return createErrorResponse('无效的新闻 ID', 400);
        }

        const db = env.DB;
        await initDatabase(db);

        const news = await db.prepare('SELECT * FROM news WHERE id = ?').bind(id).first();
        if (!news) {
            return createErrorResponse('新闻不存在', 404);
        }

        requireOwnerOrAdmin(user, news.created_by, '只能查看自己提交的新闻');

        return createResponse(hydrateNewsRow(news));
    } catch (error) {
        console.error('获取新闻失败:', error);
        return createErrorResponse(error.message, error.status || 500);
    }
}

// PUT /api/admin/news/[id]
export async function onRequestPut(context) {
    const { request, env, params } = context;

    try {
        const user = await authenticate(request, env);
        const isAdmin = isAdminUser(user);

        const id = parseInt(params.id || '', 10);
        if (!Number.isInteger(id) || id <= 0) {
            return createErrorResponse('无效的新闻 ID', 400);
        }

        const data = await request.json();
        const {
            title, summary, content, author, publish_date,
            title_en, summary_en, content_en,
            featured_image, category, tags, status,
            scheduled_publish_at
        } = data;

        const authorName = isAdmin ? String(author || '').trim() : user.username;

        if (!title || !content || !authorName || !publish_date || !title_en || !content_en) {
            return createErrorResponse('缺少必填字段（中英文标题与正文都需要填写）', 400);
        }

        const db = env.DB;
        await initDatabase(db);

        const existing = await db.prepare('SELECT * FROM news WHERE id = ?').bind(id).first();
        if (!existing) {
            return createErrorResponse('新闻不存在', 404);
        }

        requireOwnerOrAdmin(user, existing.created_by, '只能编辑自己提交的新闻');

        if (!isAdmin) {
            const existingStatus = normalizeWorkflowStatus(existing.status, 'draft');
            if (existingStatus === 'pending_delete') {
                return createErrorResponse('该新闻处于删除待审核状态，暂不可编辑', 409);
            }
        }

        const targetStatus = isAdmin
            ? status
            : resolveMemberEditableStatus(status, normalizeWorkflowStatus(existing.status, 'draft'));

        const workflow = buildWorkflowOnUpdate({
            existing,
            status: targetStatus,
            scheduledPublishAt: scheduled_publish_at,
            username: user.username
        });

        await db.prepare(`
            UPDATE news SET
                title = ?, title_en = ?, summary = ?, summary_en = ?, content = ?, content_en = ?, author = ?, publish_date = ?,
                featured_image = ?, category = ?, tags = ?, status = ?,
                scheduled_publish_at = ?, submitted_at = ?, reviewed_by = ?, reviewed_at = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `).bind(
            title, title_en, summary || null, summary_en || null, content, content_en, authorName, publish_date,
            featured_image || null, category, tags || null,
            workflow.status, workflow.scheduled_publish_at, workflow.submitted_at, workflow.reviewed_by, workflow.reviewed_at,
            id
        ).run();

        await syncEntityFileReference(db, {
            entityType: 'news',
            entityId: id,
            fieldName: 'featured_image',
            fileUrl: featured_image
        });

        await syncEntityFileReferences(db, {
            entityType: 'news',
            entityId: id,
            fieldName: 'content_images',
            fileUrls: extractEmbeddedImageUrls(content, content_en)
        });

        await logActivity(
            db,
            isAdmin ? '更新新闻' : (workflow.status === 'pending_review' ? '更新并提交审核' : '更新新闻草稿'),
            'news',
            id,
            user.username,
            `${isAdmin ? '更新新闻' : (workflow.status === 'pending_review' ? '更新并提交审核' : '更新新闻草稿')}: ${title}`
        );

        return createResponse({
            message: isAdmin ? '新闻更新成功' : (workflow.status === 'pending_review' ? '新闻已更新并重新提交审核' : '新闻草稿已更新'),
            frontend_url: `/news/detail.html?id=${id}`
        });
    } catch (error) {
        console.error('更新新闻失败:', error);
        return createErrorResponse(error.message, error.status || 500);
    }
}

// DELETE /api/admin/news/[id]
export async function onRequestDelete(context) {
    const { request, env, params } = context;

    try {
        const user = await authenticate(request, env);
        const isAdmin = isAdminUser(user);

        const id = parseInt(params.id || '', 10);
        if (!Number.isInteger(id) || id <= 0) {
            return createErrorResponse('无效的新闻 ID', 400);
        }

        const db = env.DB;
        await initDatabase(db);

        const existing = await db.prepare('SELECT title, created_by, status FROM news WHERE id = ?').bind(id).first();
        if (!existing) {
            return createErrorResponse('新闻不存在', 404);
        }

        requireOwnerOrAdmin(user, existing.created_by, '只能删除自己提交的新闻');

        if (!isAdmin) {
            const normalizedStatus = normalizeWorkflowStatus(existing.status, 'draft');

            if (normalizedStatus === 'pending_delete') {
                return createResponse({ message: '该新闻已提交删除审核，请等待管理员处理' });
            }

            if (normalizedStatus === 'published') {
                await db.prepare(`
                    UPDATE news
                    SET status = 'pending_delete',
                        submitted_at = CURRENT_TIMESTAMP,
                        reviewed_by = NULL,
                        reviewed_at = NULL,
                        scheduled_publish_at = NULL,
                        updated_at = CURRENT_TIMESTAMP
                    WHERE id = ?
                `).bind(id).run();

                await logActivity(
                    db,
                    '提交新闻删除审核',
                    'news',
                    id,
                    user.username,
                    `提交删除审核: ${existing.title}`
                );

                return createResponse({ message: '删除申请已提交，待管理员审核' });
            }
        }

        await clearEntityFileReferences(db, {
            entityType: 'news',
            entityId: id
        });

        await db.prepare('DELETE FROM news WHERE id = ?').bind(id).run();

        await logActivity(db, '删除新闻', 'news', id, user.username, `删除新闻: ${existing.title}`);

        return createResponse({ message: isAdmin ? '新闻删除成功' : '已删除本人新闻' });
    } catch (error) {
        console.error('删除新闻失败:', error);
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
