#!/usr/bin/env node

const { execSync } = require('child_process');

const ciHints = [
  process.env.CF_PAGES === '1',
  Boolean(process.env.CF_PAGES_BRANCH),
  Boolean(process.env.CF_PAGES_COMMIT_SHA),
  process.env.CI === '1',
  process.env.CI === 'true'
];
const forceWranglerDeploy = process.env.FORCE_WRANGLER_DEPLOY === '1';
const isCloudflarePagesCI = ciHints.some(Boolean) && !forceWranglerDeploy;
const projectName = process.env.CF_PAGES_PROJECT_NAME || process.env.PAGES_PROJECT_NAME || 'rsag2';
const publishDir = process.env.PAGES_OUTPUT_DIR || 'public';

if (isCloudflarePagesCI) {
  console.log('[deploy] Detected CI environment, skipping wrangler deploy.');
  console.log('[deploy] Set FORCE_WRANGLER_DEPLOY=1 only if you really need manual wrangler deployment.');
  console.log('[deploy] Pages will publish build output automatically.');
  process.exit(0);
}

const command = `npx wrangler pages deploy ${publishDir} --project-name ${projectName}`;
console.log(`[deploy] Running: ${command}`);
execSync(command, { stdio: 'inherit' });
