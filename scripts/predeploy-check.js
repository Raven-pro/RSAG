#!/usr/bin/env node

const fs = require('fs');
const { execSync } = require('child_process');

const root = process.cwd();
const wranglerPath = `${root}/wrangler.toml`;

function fail(message) {
  console.error(`[cf:check] ERROR: ${message}`);
  process.exit(1);
}

function info(message) {
  console.log(`[cf:check] ${message}`);
}

function validateWranglerConfig(content) {
  const requiredTokens = [
    '[[d1_databases]]',
    '[[kv_namespaces]]',
    '[[r2_buckets]]',
    '[assets]',
    'directory = "public"',
    '[ai]'
  ];

  for (const token of requiredTokens) {
    if (!content.includes(token)) {
      fail(`wrangler.toml 缺少配置项: ${token}`);
    }
  }

  const badPlaceholders = [
    'your_database_id',
    'your_kv_namespace_id',
    'your_bucket_name',
    'your_project_name'
  ];

  for (const placeholder of badPlaceholders) {
    if (content.includes(placeholder)) {
      fail(`wrangler.toml 仍包含占位符: ${placeholder}`);
    }
  }
}

function main() {
  info('开始部署前检查');

  if (!fs.existsSync(wranglerPath)) {
    fail('未找到 wrangler.toml');
  }

  const wranglerContent = fs.readFileSync(wranglerPath, 'utf8');
  validateWranglerConfig(wranglerContent);
  info('wrangler.toml 配置检查通过');

  try {
    execSync('npm run build', { stdio: 'inherit' });
    info('构建检查通过');
  } catch (error) {
    fail('构建失败，请先修复后再部署');
  }

  info('部署前检查全部通过');
  info('下一步可执行: npm run deploy');
}

main();
