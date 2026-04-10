# RSAG 网站（Cloudflare Pages + Functions）

本仓库是 RSAG 课题组网站的可部署版本，包含：
- 前台静态页面（public）
- Cloudflare Pages Functions API（functions）
- 管理后台（新闻、论文、团队、文件）
- 内容工作流（草稿 / 待审核 / 已发布 / 定时发布）
- D1 / KV / R2 / AI 绑定

## 当前状态
- 已完成 Cloudflare Pages 部署链路适配
- 已完成内容工作流与批量状态流转（新闻与论文）
- 已通过本地构建校验：`npm run build`

## 快速开始
1. 安装依赖
   - `npm ci`
2. 构建检查
   - `npm run cf:check`
3. 本地预览（可选）
   - `npm run cf:dev`

## Cloudflare 部署
部署步骤请直接使用文档：
- [CLOUDFLARE_DEPLOY.md](CLOUDFLARE_DEPLOY.md)

推荐方式：
- Git 自动部署（Pages 连接仓库）
- Build command: `npm run build`
- Build output directory: `public`
- 不要配置 Worker 风格 deploy command（不要填 `wrangler deploy`）

## 关键脚本
- `npm run build`：构建并校验 Pages Functions
- `npm run cf:check`：部署前检查（配置 + 绑定 + 构建）
- `npm run cf:dev`：本地运行 Pages
- `npm run migrate:legacy`：从 `data.json` + `public/news/item*.html` 生成 D1 导入 SQL
- `npm run migrate:legacy:local`：将历史数据导入本地 D1
- `npm run migrate:legacy:remote`：将历史数据导入云端 D1
- `npm run deploy`：手动 Pages 发布（本地执行）

## 历史数据上云（一次性迁移）
当云端 D1 数据不完整时，可以把历史静态数据先导入云端：

1. 生成 SQL（仅生成，不执行）
   - `npm run migrate:legacy`
2. 执行到云端 D1
   - `npm run migrate:legacy:remote`

说明：
- 新闻会合并 `data.json` 与 `public/news/item*.html`，并自动保留静态页中的正文和图片链接。
- 图片位于 `public/images/**` 时，会随 Pages 静态资源发布，不需要额外写入 D1。
- 导入 SQL 使用“存在则跳过”的方式，可重复执行，避免重复插入同一条记录。

## 目录说明
- `public/`：前台页面和管理后台页面
- `functions/`：Cloudflare Pages Functions API
- `scripts/deploy-pages.js`：手动发布脚本
- `scripts/predeploy-check.js`：部署前自动检查
- `wrangler.toml`：Cloudflare 绑定配置

## 注意事项
- 管理后台登录与 JWT 密钥必须在 Cloudflare 中配置为 Secrets。
- `OPENAI_API_KEY` 用于聊天接口；不配置会影响 `/api/chat`。
- 上传文件依赖 R2；请确保 `UPLOADS_BUCKET` 绑定存在。
