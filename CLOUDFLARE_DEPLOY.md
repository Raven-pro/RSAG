# Cloudflare 部署手册（可直接执行）

本项目已按 Cloudflare Pages + Functions 结构整理完成，按本文步骤可直接部署。

## 0. 项目信息
- Pages 项目名建议统一为：`rsag2`
- 静态目录：`public`
- Functions 目录：`functions`
- 配置文件：`wrangler.toml`

## 1. 本地准备
1. 安装依赖
   - `npm ci`
2. 登录 Cloudflare
   - `npx wrangler login`
3. 部署前检查
   - `npm run cf:check`

如果 `cf:check` 失败，请先修复后再继续。

## 2. 创建或确认 Cloudflare 资源
如果你已经创建过同名资源，可跳过创建步骤，仅保留“确认绑定”。

### 2.1 D1
1. 创建
   - `npx wrangler d1 create rsag-db`
2. 将返回的 `database_id` 写入 [wrangler.toml](wrangler.toml) 的 `[[d1_databases]]`

### 2.2 KV
1. 创建
   - `npx wrangler kv namespace create CHAT_COUNT_KV`
2. 将返回的 `id` 写入 [wrangler.toml](wrangler.toml) 的 `[[kv_namespaces]]`

### 2.3 R2
1. 创建
   - `npx wrangler r2 bucket create rsag-uploads`
2. 确认 [wrangler.toml](wrangler.toml) 中 `[[r2_buckets]]` 为：
   - `binding = "UPLOADS_BUCKET"`
   - `bucket_name = "rsag-uploads"`

## 3. 配置 Pages Secrets（必须）
以下命令请在项目根目录执行，并使用你的 Pages 项目名。

1. JWT 与后台账号
   - `npx wrangler pages secret put JWT_SECRET --project-name rsag2`
   - `npx wrangler pages secret put ADMIN_USERNAME --project-name rsag2`
   - `npx wrangler pages secret put ADMIN_PASSWORD --project-name rsag2`
   - `npx wrangler pages secret put EDITOR_PASSWORD --project-name rsag2`
2. 聊天能力（可选但建议）
   - `npx wrangler pages secret put OPENAI_API_KEY --project-name rsag2`
3. 上传访问前缀（可选）
   - `npx wrangler pages secret put PUBLIC_UPLOAD_BASE_URL --project-name rsag2`

说明：
- 如果不配置 `OPENAI_API_KEY`，聊天接口会不可用。
- 如果不配置后台账号 secrets，会使用代码默认回退账号，不建议用于生产环境。

## 4. Cloudflare Pages 控制台构建设置（Git 自动部署）
推荐方式是“连接 Git 仓库自动部署”。

请在 Pages 项目中确认：
1. Framework preset：`None`
2. Build command：`npm run build`
3. Build output directory：`public`
4. Root directory：`/`（或留空）
5. 不要配置自定义 Deploy command，尤其不要填 `npx wrangler deploy`

## 5. 两种发布方式

### 5.1 Git 自动部署（推荐）
1. 推送代码到仓库分支
2. Pages 自动执行构建并发布

### 5.2 本地手动发布
1. 执行
   - `npm run deploy:manual`
2. 该命令会先执行 `cf:check`，再执行 Pages 发布

## 6. 发布后验收清单

### 6.1 公开接口
- `/api/news`
- `/api/news/{id}`
- `/api/publications`
- `/api/team`

### 6.2 管理接口
- `/api/admin/auth/login`
- `/api/admin/news`
- `/api/admin/news/{id}`
- `/api/admin/news/batch`
- `/api/admin/publications`
- `/api/admin/publications/{id}`
- `/api/admin/publications/batch`
- `/api/admin/publications/{id}/upload-pdf`
- `/api/admin/team`
- `/api/admin/files`
- `/api/admin/upload`
- `/api/admin/stats`

### 6.3 页面功能
- 管理后台登录
- 新闻与论文的工作流状态流转
- 批量状态更新
- 定时发布到点可见
- 仪表板工作流看板

## 7. 常见问题

### 7.1 构建日志出现 wrangler deploy 相关报错
原因：Pages 项目被错误配置成 Worker 风格 deploy 命令。

修复：
1. 打开 Pages 项目设置 -> Builds & deployments
2. 删除自定义 Deploy command
3. 只保留 Build command: `npm run build`
4. 重试部署

### 7.2 本地 cf:dev 偶发中断
如果你启用了 AI 远程绑定，本地网络波动可能导致超时中断。建议：
1. 以 `npm run build` 作为必选构建校验
2. 数据逻辑验证优先使用 D1 本地 SQL

### 7.3 上传链接无法访问
请检查：
1. `UPLOADS_BUCKET` 绑定是否生效
2. `PUBLIC_UPLOAD_BASE_URL` 是否配置正确（可留空使用同域 `/uploads/...`）
