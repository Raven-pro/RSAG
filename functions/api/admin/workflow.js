export const WORKFLOW_STATUSES = new Set(['draft', 'pending_review', 'published', 'scheduled']);
const STATUS_ALIASES = {
    submitted: 'pending_review',
    accepted: 'published'
};

export function normalizeWorkflowStatus(value, fallback = 'draft') {
    const raw = String(value || '').trim().toLowerCase();
    const status = STATUS_ALIASES[raw] || raw;
    if (WORKFLOW_STATUSES.has(status)) {
        return status;
    }
    const fallbackRaw = String(fallback || '').trim().toLowerCase();
    const backup = STATUS_ALIASES[fallbackRaw] || fallbackRaw;
    if (WORKFLOW_STATUSES.has(backup)) {
        return backup;
    }
    return 'draft';
}

export function parseWorkflowStatusFilter(value) {
    const raw = String(value || '').trim().toLowerCase();
    if (!raw) return '';
    const mapped = STATUS_ALIASES[raw] || raw;
    return WORKFLOW_STATUSES.has(mapped) ? mapped : '';
}

export function normalizeScheduledPublishAt(rawValue, status) {
    if (status !== 'scheduled') {
        return null;
    }

    const text = String(rawValue || '').trim();
    if (!text) {
        throw new Error('定时发布需要填写发布时间');
    }

    const dt = new Date(text);
    if (Number.isNaN(dt.getTime())) {
        throw new Error('定时发布时间格式无效');
    }

    return dt.toISOString();
}

export function buildWorkflowOnCreate({ status, scheduledPublishAt, username }) {
    const now = new Date().toISOString();
    const workflowStatus = normalizeWorkflowStatus(status, 'draft');
    const schedule = normalizeScheduledPublishAt(scheduledPublishAt, workflowStatus);

    const result = {
        status: workflowStatus,
        scheduled_publish_at: schedule,
        submitted_at: null,
        reviewed_by: null,
        reviewed_at: null
    };

    if (workflowStatus === 'pending_review') {
        result.submitted_at = now;
    }

    if (workflowStatus === 'published') {
        result.submitted_at = now;
        result.reviewed_by = username;
        result.reviewed_at = now;
    }

    return result;
}

export function buildWorkflowOnUpdate({ existing, status, scheduledPublishAt, username }) {
    const now = new Date().toISOString();
    const workflowStatus = normalizeWorkflowStatus(status, existing?.status || 'draft');
    const schedule = normalizeScheduledPublishAt(scheduledPublishAt, workflowStatus);

    const result = {
        status: workflowStatus,
        scheduled_publish_at: schedule,
        submitted_at: existing?.submitted_at || null,
        reviewed_by: existing?.reviewed_by || null,
        reviewed_at: existing?.reviewed_at || null
    };

    if (workflowStatus === 'pending_review' && !result.submitted_at) {
        result.submitted_at = now;
    }

    if (workflowStatus === 'published') {
        if (!result.submitted_at) {
            result.submitted_at = now;
        }
        result.reviewed_by = username;
        result.reviewed_at = now;
    }

    return result;
}

export function isPubliclyVisibleStatus(status, scheduledPublishAt) {
    const normalized = normalizeWorkflowStatus(status, 'draft');
    if (normalized === 'published') {
        return true;
    }

    if (normalized !== 'scheduled' || !scheduledPublishAt) {
        return false;
    }

    const schedule = new Date(scheduledPublishAt).getTime();
    if (Number.isNaN(schedule)) {
        return false;
    }

    return schedule <= Date.now();
}
