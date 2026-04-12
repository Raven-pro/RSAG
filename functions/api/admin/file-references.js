function normalizeText(value) {
    return String(value || '').trim();
}

function toPositiveInt(value) {
    const parsed = Number.parseInt(value || '', 10);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function normalizeCategory(value) {
    return normalizeText(value).toLowerCase();
}

export function normalizeFileUrl(fileUrl) {
    return normalizeText(fileUrl);
}

async function getLatestFileByUrl(db, fileUrl) {
    const normalizedUrl = normalizeFileUrl(fileUrl);
    if (!normalizedUrl) return null;

    return db.prepare(`
        SELECT id, category
        FROM files
        WHERE file_url = ?
        ORDER BY id DESC
        LIMIT 1
    `).bind(normalizedUrl).first();
}

export async function refreshFileReferenceStats(db, fileId) {
    const safeFileId = toPositiveInt(fileId);
    if (!safeFileId) return;

    const file = await db.prepare('SELECT id, category FROM files WHERE id = ?').bind(safeFileId).first();
    if (!file) return;

    const countResult = await db.prepare('SELECT COUNT(*) AS count FROM file_references WHERE file_id = ?').bind(safeFileId).first();
    const referenceCount = Number.parseInt(countResult?.count, 10) || 0;

    const category = normalizeCategory(file.category);
    const shouldTrackOrphan = ['news', 'avatar', 'pdf'].includes(category);
    const isOrphan = shouldTrackOrphan && referenceCount === 0 ? 1 : 0;

    await db.prepare(`
        UPDATE files
        SET reference_count = ?,
            is_orphan = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
    `).bind(referenceCount, isOrphan, safeFileId).run();
}

export async function syncEntityFileReference(db, { entityType, entityId, fieldName, fileUrl }) {
    const safeEntityType = normalizeText(entityType);
    const safeFieldName = normalizeText(fieldName);
    const safeEntityId = toPositiveInt(entityId);

    if (!safeEntityType || !safeFieldName || !safeEntityId) {
        return;
    }

    const existingRefs = await db.prepare(`
        SELECT file_id
        FROM file_references
        WHERE entity_type = ? AND entity_id = ? AND field_name = ?
    `).bind(safeEntityType, safeEntityId, safeFieldName).all();

    const existingRows = existingRefs.results || [];
    const existingFileIds = existingRows
        .map((row) => toPositiveInt(row.file_id))
        .filter((id) => id !== null);

    const targetFile = await getLatestFileByUrl(db, fileUrl);
    const targetFileId = toPositiveInt(targetFile?.id);

    const alreadyLinked = targetFileId
        && existingFileIds.length === 1
        && existingFileIds[0] === targetFileId;

    if (alreadyLinked) {
        await refreshFileReferenceStats(db, targetFileId);
        return;
    }

    if (existingRows.length) {
        await db.prepare(`
            DELETE FROM file_references
            WHERE entity_type = ? AND entity_id = ? AND field_name = ?
        `).bind(safeEntityType, safeEntityId, safeFieldName).run();

        for (const oldFileId of existingFileIds) {
            await refreshFileReferenceStats(db, oldFileId);
        }
    }

    if (!targetFileId) {
        return;
    }

    await db.prepare(`
        INSERT OR IGNORE INTO file_references (file_id, entity_type, entity_id, field_name)
        VALUES (?, ?, ?, ?)
    `).bind(targetFileId, safeEntityType, safeEntityId, safeFieldName).run();

    await refreshFileReferenceStats(db, targetFileId);
}

export async function clearEntityFileReferences(db, { entityType, entityId }) {
    const safeEntityType = normalizeText(entityType);
    const safeEntityId = toPositiveInt(entityId);

    if (!safeEntityType || !safeEntityId) {
        return;
    }

    const existingRefs = await db.prepare(`
        SELECT DISTINCT file_id
        FROM file_references
        WHERE entity_type = ? AND entity_id = ?
    `).bind(safeEntityType, safeEntityId).all();

    const fileIds = (existingRefs.results || [])
        .map((row) => toPositiveInt(row.file_id))
        .filter((id) => id !== null);

    if (fileIds.length === 0) {
        return;
    }

    await db.prepare(`
        DELETE FROM file_references
        WHERE entity_type = ? AND entity_id = ?
    `).bind(safeEntityType, safeEntityId).run();

    for (const fileId of fileIds) {
        await refreshFileReferenceStats(db, fileId);
    }
}
