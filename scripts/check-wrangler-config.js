#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const configPath = path.join(process.cwd(), 'wrangler.toml');
if (!fs.existsSync(configPath)) {
  console.error('[wrangler-check] Missing wrangler.toml');
  process.exit(1);
}

const config = fs.readFileSync(configPath, 'utf8');
const placeholders = [
  'REPLACE_WITH_D1_DATABASE_ID',
  'REPLACE_WITH_KV_NAMESPACE_ID',
  'REPLACE_WITH_',
  'database_id = ""',
  'id = ""'
];

const hit = placeholders.find((token) => config.includes(token));
if (hit) {
  console.error('[wrangler-check] Invalid Wrangler bindings: placeholder values are still present.');
  console.error('[wrangler-check] Please set real D1/KV IDs in wrangler.toml before deployment.');
  process.exit(1);
}

if (!config.includes('main = ".cf-build/index.js"')) {
  console.error('[wrangler-check] wrangler.toml is missing main = ".cf-build/index.js" for versions upload flow.');
  process.exit(1);
}

if (!config.includes('[assets]') || !config.includes('directory = "public"')) {
  console.error('[wrangler-check] wrangler.toml is missing assets directory configuration.');
  process.exit(1);
}

console.log('[wrangler-check] Wrangler config looks valid for versions upload.');
