export function normalizeOrderIndex(value, fallback = 1) {
    const parsed = Number.parseInt(String(value ?? ''), 10);
    if (Number.isInteger(parsed) && parsed > 0) {
        return parsed;
    }

    const fallbackParsed = Number.parseInt(String(fallback ?? ''), 10);
    if (Number.isInteger(fallbackParsed) && fallbackParsed > 0) {
        return fallbackParsed;
    }

    return 1;
}

export async function reorderTeamMembers(db, memberId = null, targetOrder = null) {
    const rows = await db.prepare(`
        SELECT id
        FROM team_members
        ORDER BY order_index ASC, id ASC
    `).all();

    let orderedIds = (rows.results || []).map((row) => Number.parseInt(row.id, 10)).filter((id) => Number.isInteger(id) && id > 0);

    if (memberId !== null && memberId !== undefined) {
        const targetId = Number.parseInt(memberId, 10);
        if (Number.isInteger(targetId) && targetId > 0) {
            orderedIds = orderedIds.filter((id) => id !== targetId);
            const normalizedTargetOrder = normalizeOrderIndex(targetOrder, 1);
            const insertIndex = Math.min(Math.max(normalizedTargetOrder - 1, 0), orderedIds.length);
            orderedIds.splice(insertIndex, 0, targetId);
        }
    }

    for (let index = 0; index < orderedIds.length; index += 1) {
        const id = orderedIds[index];
        const orderIndex = index + 1;
        await db.prepare(`
            UPDATE team_members
            SET order_index = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `).bind(orderIndex, id).run();
    }
}