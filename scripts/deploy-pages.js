#!/usr/bin/env node

const { execSync } = require('child_process');

const isCloudflarePagesCI = process.env.CF_PAGES === '1';

if (isCloudflarePagesCI) {
  console.log('[deploy] Detected Cloudflare Pages CI (CF_PAGES=1), skipping wrangler deploy.');
  console.log('[deploy] Pages will publish build output automatically.');
  process.exit(0);
}

const command = 'npx wrangler pages deploy public --project-name rsag-pages';
console.log(`[deploy] Running: ${command}`);
execSync(command, { stdio: 'inherit' });
