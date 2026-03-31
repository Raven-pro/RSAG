# Cloudflare Deployment Guide

## 1. Prerequisites
- Install Wrangler CLI: `npm i -g wrangler` or use `npx wrangler`
- Login: `npx wrangler login`
- Ensure `wrangler.toml` exists at project root

## 1.1 Git Auto Deploy (Recommended)
If you deploy by connecting Git repository in Cloudflare Pages, use these settings:
- Framework preset: `None`
- Build command: `npm run build`
- Build output directory: `public`
- Root directory: `/` (or keep empty)
- Do **not** set custom Deploy command (especially avoid `npx wrangler deploy`)

In this repository, `npm run build` only validates Pages Functions bundling and keeps static site output in `public`.

## 2. Create and bind cloud resources

### D1
1. `npx wrangler d1 create rsag-db`
2. Copy `database_id` into `wrangler.toml` `[[d1_databases]]`

### KV
1. `npx wrangler kv namespace create CHAT_COUNT_KV`
2. Copy returned `id` into `wrangler.toml` `[[kv_namespaces]]`

### R2
1. `npx wrangler r2 bucket create rsag-uploads`
2. Confirm `[[r2_buckets]]` uses `bucket_name = "rsag-uploads"`

## 3. Configure secrets
- `npx wrangler secret put JWT_SECRET`
- `npx wrangler secret put OPENAI_API_KEY`

## 4. Local pages/functions preview
- `npm run cf:dev`

## 5. Deploy to Cloudflare Pages
- `npm run deploy`
- Do not use `npx wrangler deploy` for this repository (it is a Pages project, not a single Worker entry-point project).
- If you run command directly, use:
  - `npx wrangler pages deploy public --project-name rsag-pages`

## 6. Post-deploy checks
- Verify public APIs:
  - `/api/news`
  - `/api/news/{id}`
  - `/api/publications`
  - `/api/team`
- Verify admin APIs:
  - `/api/admin/auth/login`
  - `/api/admin/news`
  - `/api/admin/news/{id}`
  - `/api/admin/publications`
  - `/api/admin/publications/{id}`
  - `/api/admin/publications/{id}/upload-pdf`
  - `/api/admin/team`
  - `/api/admin/team/{id}`
  - `/api/admin/files`
  - `/api/admin/files/{id}`
  - `/api/admin/upload`
- Verify chat endpoint:
  - `/api/chat`
- Verify uploaded file access endpoint:
  - `/uploads/{key}` (served by `functions/uploads/[[path]].js`)

## Notes
- Replace placeholder IDs in `wrangler.toml` before deployment.
- `PUBLIC_UPLOAD_BASE_URL` is optional. If empty, upload API returns same-domain URLs like `/uploads/images/...`.

## Troubleshooting

### Error: still executing `npx wrangler deploy`
Symptom in build log:
- `Executing user deploy command: npx wrangler deploy`
- followed by `Missing entry-point to Worker script or to assets directory`

Cause:
- Cloudflare project is still configured with a custom Deploy command for Worker-style deployment.

Fix:
1. Open Cloudflare Dashboard -> Workers & Pages -> your project -> Settings -> Builds & deployments.
2. Ensure this is a Pages project configuration:
  - Build command: `npm run build`
  - Build output directory: `public`
3. Remove custom Deploy command, or change it to:
  - `npm run deploy`
4. Trigger a new deployment (Retry deployment or push a new commit).

Repository safeguard:
- `npm run deploy` now auto-detects Cloudflare Pages CI (`CF_PAGES=1`) and exits successfully without calling Wrangler API.
- This avoids token-scope authentication failures during Git auto deploy while preserving local manual deploy capability.

If UI still forces a Deploy command workflow, create a new Pages project (`Create application -> Pages -> Connect to Git`) and reuse this repository/config.
