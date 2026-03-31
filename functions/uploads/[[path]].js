import { resolveUploadsBucket } from '../api/admin/file-utils.js';

function getKeyFromParams(params) {
    const raw = params?.path;

    if (Array.isArray(raw)) {
        return raw.join('/');
    }

    if (typeof raw === 'string') {
        return raw;
    }

    return '';
}

async function buildFileResponse(env, params, includeBody = true) {
    const bucket = resolveUploadsBucket(env);
    if (!bucket) {
        return new Response('R2 bucket is not configured', { status: 500 });
    }

    const key = decodeURIComponent(getKeyFromParams(params)).replace(/^\/+/, '');
    if (!key) {
        return new Response('File key is required', { status: 404 });
    }

    const object = await bucket.get(key);
    if (!object) {
        return new Response('File not found', { status: 404 });
    }

    const headers = new Headers();
    headers.set('Cache-Control', 'public, max-age=3600');

    if (object.httpMetadata?.contentType) {
        headers.set('Content-Type', object.httpMetadata.contentType);
    }

    if (typeof object.size === 'number') {
        headers.set('Content-Length', String(object.size));
    }

    return new Response(includeBody ? object.body : null, {
        status: 200,
        headers
    });
}

export async function onRequestGet(context) {
    const { env, params } = context;
    return buildFileResponse(env, params, true);
}

export async function onRequestHead(context) {
    const { env, params } = context;
    return buildFileResponse(env, params, false);
}
