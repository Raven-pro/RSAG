#!/usr/bin/env node

const fs = require('fs');
const { execFileSync } = require('child_process');

const workerName = process.env.WORKER_NAME || process.env.CF_WORKER_NAME || process.env.CF_PAGES_PROJECT_NAME || 'rsag2';
const assetsDir = process.env.WORKER_ASSETS_DIR || process.env.PAGES_OUTPUT_DIR || 'public';
const compatibilityDate = process.env.WORKER_COMPATIBILITY_DATE || process.env.COMPATIBILITY_DATE || '2026-04-01';
const outFile = '.tmp_worker.js';
const message = process.env.DEPLOY_MESSAGE || `deploy-${new Date().toISOString()}`;

function runWrangler(args, captureOutput = false) {
    const options = {
        stdio: captureOutput ? ['inherit', 'pipe', 'inherit'] : 'inherit',
        encoding: 'utf8'
    };
    const output = execFileSync('npx', ['wrangler', ...args], options);
    return captureOutput ? output : '';
}

function getLatestVersionId(worker) {
    const raw = runWrangler(['versions', 'list', '--name', worker, '--json'], true);
    const parsed = JSON.parse(raw);
    const versions = Array.isArray(parsed)
        ? parsed
        : Array.isArray(parsed?.items)
            ? parsed.items
            : Array.isArray(parsed?.versions)
                ? parsed.versions
                : [];

    const latest = versions[0] || {};
    const versionId = latest.id || latest.version_id || latest.versionId;
    if (!versionId) {
        throw new Error('未能从 wrangler versions list 输出中解析到 version id');
    }
    return versionId;
}

try {
    console.log(`[deploy] Building Pages Functions worker to ${outFile} ...`);
    runWrangler(['pages', 'functions', 'build', '--outfile', outFile]);

    console.log(`[deploy] Uploading worker version for ${workerName} ...`);
    runWrangler([
        'versions',
        'upload',
        outFile,
        '--name', workerName,
        '--assets', assetsDir,
        '--compatibility-date', compatibilityDate,
        '--message', message
    ]);

    console.log('[deploy] Resolving latest uploaded version id ...');
    const versionId = getLatestVersionId(workerName);
    console.log(`[deploy] Deploying version ${versionId} at 100% traffic ...`);

    runWrangler([
        'versions',
        'deploy',
        '--name', workerName,
        '--version-id', versionId,
        '--percentage', '100',
        '--yes',
        '--message', message
    ]);

    console.log(`[deploy] Success. Worker ${workerName} now serves version ${versionId}.`);
} finally {
    fs.rmSync(outFile, { force: true });
}
