const ENTITY_TYPE_META = {
    news: {
        label: '新闻',
        adminUrl: '/admin/news.html',
        frontUrl: (id) => `/news/detail.html?id=${id}`
    },
    team_members: {
        label: '成员',
        adminUrl: '/admin/team.html',
        frontUrl: () => '/index.html#team'
    },
    publications: {
        label: '论文',
        adminUrl: '/admin/publications.html',
        frontUrl: () => '/publications-api.html'
    }
};

const FIELD_NAME_LABELS = {
    featured_image: '封面图',
    content_images: '正文图片',
    photo_url: '成员头像',
    pdf_url: '论文 PDF'
};

function toPositiveInt(value) {
    const parsed = Number.parseInt(value || '', 10);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function buildInClausePlaceholders(values) {
    if (!Array.isArray(values) || values.length === 0) {
        return '';
    }
    return values.map(() => '?').join(', ');
}

function normalizeEntityName(value) {
    const text = String(value || '').trim();
    return text || '已删除记录';
}

function normalizeFieldLabel(fieldName) {
    const key = String(fieldName || '').trim();
    return FIELD_NAME_LABELS[key] || (key || '引用位置');
}

async function queryReferencesByType(db, fileIds, entityType) {
    const placeholders = buildInClausePlaceholders(fileIds);
    if (!placeholders) {
        return [];
    }

    if (entityType === 'news') {
        const result = await db.prepare(`
            SELECT r.file_id, r.entity_type, r.entity_id, r.field_name, n.title AS entity_name
            FROM file_references r
            LEFT JOIN news n ON n.id = r.entity_id
            WHERE r.entity_type = 'news'
              AND r.file_id IN (${placeholders})
            ORDER BY r.file_id ASC, r.entity_id DESC
        `).bind(...fileIds).all();
        return result.results || [];
    }

    if (entityType === 'team_members') {
        const result = await db.prepare(`
            SELECT r.file_id, r.entity_type, r.entity_id, r.field_name, t.name AS entity_name
            FROM file_references r
            LEFT JOIN team_members t ON t.id = r.entity_id
            WHERE r.entity_type = 'team_members'
              AND r.file_id IN (${placeholders})
            ORDER BY r.file_id ASC, r.entity_id DESC
        `).bind(...fileIds).all();
        return result.results || [];
    }

    if (entityType === 'publications') {
        const result = await db.prepare(`
            SELECT r.file_id, r.entity_type, r.entity_id, r.field_name, p.title AS entity_name
            FROM file_references r
            LEFT JOIN publications p ON p.id = r.entity_id
            WHERE r.entity_type = 'publications'
              AND r.file_id IN (${placeholders})
            ORDER BY r.file_id ASC, r.entity_id DESC
        `).bind(...fileIds).all();
        return result.results || [];
    }

    return [];
}

function decorateReferenceRow(row) {
    const fileId = toPositiveInt(row?.file_id);
    const entityId = toPositiveInt(row?.entity_id);
    const entityType = String(row?.entity_type || '').trim();
    const fieldName = String(row?.field_name || '').trim();

    if (!fileId || !entityId || !entityType) {
        return null;
    }

    const meta = ENTITY_TYPE_META[entityType] || {};

    return {
        file_id: fileId,
        entity_type: entityType,
        entity_type_label: meta.label || entityType,
        entity_id: entityId,
        entity_name: normalizeEntityName(row?.entity_name),
        field_name: fieldName,
        location_label: normalizeFieldLabel(fieldName),
        entity_admin_url: meta.adminUrl || '',
        entity_front_url: typeof meta.frontUrl === 'function' ? meta.frontUrl(entityId) : ''
    };
}

export async function enrichFilesWithReferences(db, files = []) {
    if (!Array.isArray(files) || files.length === 0) {
        return files;
    }

    const fileIds = files
        .map((file) => toPositiveInt(file?.id))
        .filter((id) => id !== null);

    if (!fileIds.length) {
        return files;
    }

    const [newsRows, teamRows, publicationRows] = await Promise.all([
        queryReferencesByType(db, fileIds, 'news'),
        queryReferencesByType(db, fileIds, 'team_members'),
        queryReferencesByType(db, fileIds, 'publications')
    ]);

    const allRows = [...newsRows, ...teamRows, ...publicationRows]
        .map(decorateReferenceRow)
        .filter((row) => row !== null);

    const byFileId = new Map();
    for (const row of allRows) {
        const current = byFileId.get(row.file_id) || [];
        current.push(row);
        byFileId.set(row.file_id, current);
    }

    for (const file of files) {
        const fileId = toPositiveInt(file?.id);
        const references = fileId ? (byFileId.get(fileId) || []) : [];
        const grouped = {
            news: references.filter((item) => item.entity_type === 'news'),
            team_members: references.filter((item) => item.entity_type === 'team_members'),
            publications: references.filter((item) => item.entity_type === 'publications')
        };

        file.references = references;
        file.reference_groups = grouped;
        file.reference_breakdown = {
            news: grouped.news.length,
            team_members: grouped.team_members.length,
            publications: grouped.publications.length,
            total: references.length
        };
    }

    return files;
}
