# RSAG 网站（Cloudflare Pages + Functions）

RSAG 课题组网站的生产代码仓库。

本项目采用 Cloudflare Pages + Pages Functions 架构，提供：
- 前台展示站点（新闻、论文、团队、联系方式）
- 管理后台（新闻、论文、团队、文件、用户、统计）
- 工作流与权限控制（admin/member）
- D1 + R2 + KV + AI 绑定能力

当前维护策略：
- 数据源以云端 D1 为准
- 历史导入脚本与本地历史数据已下线
- 推荐通过 Git 自动部署到 Cloudflare Pages
- 本 README 作为唯一项目与部署手册

## 1. 技术栈

- 前端：原生 HTML/CSS/JavaScript + Tailwind CDN
- 后端：Cloudflare Pages Functions（JavaScript）
- 数据库：Cloudflare D1（SQLite）
- 文件存储：Cloudflare R2
- 键值缓存：Cloudflare KV（聊天配额计数）
- AI：Cloudflare AI + OpenAI API Key（聊天接口）

## 2. 核心功能

### 2.1 前台站点
- 首页：新闻摘要、论文摘要、团队成员
- 新闻页：列表与详情
- 论文页：公开论文列表与筛选
- 团队页：成员信息展示

### 2.2 管理后台
- 登录鉴权：JWT
- 模块：仪表板、新闻、论文、团队、文件、用户
- 角色：
  - admin：全模块访问
  - member：受限访问（新闻/论文相关）

### 2.3 内容工作流
新闻与论文支持统一状态流：
- draft
- pending_review
- pending_delete
- scheduled
- published

说明：
- scheduled 在到达发布时间后自动对外可见
- 已发布内容由成员发起删除时可进入 pending_delete，待管理员确认

### 2.4 文件与论文 PDF 规则
- 上传入口：后台接口 + R2
- 论文 PDF 支持后台编辑流程（含上传进度、绑定、清理）
- 前台不提供论文 PDF 下载入口

## 3. 项目结构

```text
RSAG/
├── functions/                  # Cloudflare Pages Functions
│   └── api/
│       ├── chat.js             # 聊天接口
│       ├── news.js             # 公共新闻接口
│       ├── publications.js     # 公共论文接口
│       ├── team.js             # 公共团队接口
│       └── admin/              # 后台接口（鉴权、工作流、上传、统计等）
├── public/                     # 静态资源与前端页面
│   ├── index.html              # 首页
│   ├── publications-api.html   # 公开论文页面
│   ├── news/                   # 新闻前台页面
│   ├── admin/                  # 管理后台页面
│   ├── api_news.js             # 首页新闻加载脚本
│   ├── api_publications.js     # 首页论文加载脚本
│   ├── api_team.js             # 首页团队加载脚本
│   └── script.js               # 全站公共脚本
├── scripts/
│   ├── predeploy-check.js      # 部署前检查
│   └── deploy-pages.js         # 手动部署脚本
├── wrangler.toml               # Cloudflare 绑定配置
└── package.json                # 项目脚本
```

## 4. 开发与使用

### 4.1 环境要求
- Node.js 18+
- npm 9+
- 已安装/可调用 wrangler（npx 即可）

### 4.2 安装依赖

```bash
npm ci
```

### 4.3 常用命令

```bash
# 构建 Functions 到 .cf-build
npm run build

# 部署前检查（wrangler 配置 + 构建）
npm run cf:check

# 本地运行 Pages（前台 + Functions）
npm run cf:dev

# 手动部署到 Cloudflare Pages
npm run deploy

# 先检查再部署
npm run deploy:manual
```

### 4.4 本地联调建议流程
1. 执行 npm run cf:check，先保证可构建。
2. 执行 npm run cf:dev，在本地验证页面和接口。
3. 重点验证：
   - 首页新闻/论文/团队是否正常渲染
   - 管理后台登录、编辑、状态流转
   - 上传与文件管理

## 5. API 概览

### 5.1 公开接口
- GET /api/news
- GET /api/news/{id}
- GET /api/publications
- GET /api/team
- POST /api/chat

### 5.2 后台接口（需鉴权）
- /api/admin/auth/login
- /api/admin/news, /api/admin/news/{id}, /api/admin/news/batch
- /api/admin/publications, /api/admin/publications/{id}, /api/admin/publications/batch
- /api/admin/publications/{id}/upload-pdf
- /api/admin/publications/{id}/bind-pdf
- /api/admin/team, /api/admin/team/{id}
- /api/admin/files, /api/admin/files/{id}
- /api/admin/upload
- /api/admin/users, /api/admin/users/{id}
- /api/admin/stats, /api/admin/activities

## 6. Cloudflare 配置

### 6.1 wrangler.toml 绑定
当前项目使用以下绑定：
- D1：DB
- KV：CHAT_COUNT_KV
- R2：UPLOADS_BUCKET
- AI：AI
- Vars：PUBLIC_UPLOAD_BASE_URL

### 6.2 Secrets 建议

必配（生产强烈建议）：
- JWT_SECRET
- ADMIN_USERNAME
- ADMIN_PASSWORD

可选：
- OPENAI_API_KEY（不配置则聊天接口不可用）
- PUBLIC_UPLOAD_BASE_URL（不配置可走同域 uploads 路径）

说明：
- 若未配置 ADMIN_USERNAME/ADMIN_PASSWORD，系统会使用默认回退账号初始化管理员，仅适合临时调试。

## 7. 部署方式

### 7.1 Git 自动部署（推荐）
Cloudflare Pages 项目建议配置：
- Framework preset: None
- Build command: npm run build
- Build output directory: public
- Root directory: /

注意：
- 不要填写 wrangler deploy 作为 Deploy command。

### 7.2 本地手动部署

```bash
npm run deploy:manual
```

该命令会先检查后部署，适合临时发布或应急回滚场景。

### 7.3 首次初始化 Cloudflare 资源（仅一次）
如资源已存在，可跳过创建，仅核对 `wrangler.toml` 绑定值。

1. D1
   - `npx wrangler d1 create rsag-db`
   - 将返回的 `database_id` 填入 `wrangler.toml` 的 `[[d1_databases]]`
2. KV
   - `npx wrangler kv namespace create CHAT_COUNT_KV`
   - 将返回的 `id` 填入 `wrangler.toml` 的 `[[kv_namespaces]]`
3. R2
   - `npx wrangler r2 bucket create rsag-uploads`
   - 核对 `wrangler.toml` 的 `[[r2_buckets]]`：
     - `binding = "UPLOADS_BUCKET"`
     - `bucket_name = "rsag-uploads"`

### 7.4 配置 Pages Secrets（生产必做）
先登录 Cloudflare：`npx wrangler login`

必配：
- `npx wrangler pages secret put JWT_SECRET --project-name rsag2`
- `npx wrangler pages secret put ADMIN_USERNAME --project-name rsag2`
- `npx wrangler pages secret put ADMIN_PASSWORD --project-name rsag2`

可选：
- `npx wrangler pages secret put EDITOR_PASSWORD --project-name rsag2`
- `npx wrangler pages secret put OPENAI_API_KEY --project-name rsag2`
- `npx wrangler pages secret put PUBLIC_UPLOAD_BASE_URL --project-name rsag2`

### 7.5 Pages 控制台构建参数（Git 自动部署）
在 Cloudflare Pages 项目中确认：
1. Framework preset: `None`
2. Build command: `npm run build`
3. Build output directory: `public`
4. Root directory: `/`（或留空）
5. 不配置 Deploy command，尤其不要填 `wrangler deploy`

## 8. 发布后验收清单

1. 公开页面可访问：
   - 首页
   - 新闻列表/详情
   - 论文列表
   - 团队区块
2. 公共 API 返回 JSON 正常：/api/news, /api/publications, /api/team
3. 后台登录、增删改查、工作流状态流转正常
4. 文件上传与 R2 URL 可访问
5. 定时发布内容到点可见

## 9. 常见问题

### 9.1 部署后前台一直显示“正在加载”
优先检查：
1. Pages 生产环境绑定是否齐全（D1/KV/R2/AI/Secrets）。
2. 构建设置是否正确（尤其是 Build command 与 output 目录）。
3. 浏览器/CDN 缓存是否命中旧版本（可强刷后再测）。

### 9.2 /api/chat 调用失败
1. 检查 OPENAI_API_KEY 是否已配置。
2. 检查 CHAT_COUNT_KV 绑定是否生效。

### 9.3 上传成功但文件打不开
1. 检查 UPLOADS_BUCKET 是否绑定。
2. 检查 PUBLIC_UPLOAD_BASE_URL 配置是否与实际公开路径一致。

## 10. 安全与维护建议

1. 首次上线后立即设置强密码并更换默认管理员凭据。
2. 仅通过 Cloudflare Pages Secrets 管理敏感信息，不写入仓库。
3. 每次发布前执行 npm run cf:check。
4. 重要变更先在 Preview 环境验收，再发布生产环境。
