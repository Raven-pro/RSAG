// 本地测试服务器（稳定版）
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const { execFile } = require('child_process');
const { publications_data, team_data } = require('./migration_data.js');

const app = express();
const PORT = 3000;

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// 兼容无 .html 后缀的后台路径，避免旧链接或缓存导致 404。
const ADMIN_PAGES = new Set(['login', 'dashboard', 'publications', 'news', 'team', 'files']);
app.get('/admin', (req, res) => {
  res.redirect('/admin/login.html');
});
app.get('/admin/:page', (req, res, next) => {
  const page = String(req.params.page || '').toLowerCase();
  if (!ADMIN_PAGES.has(page)) return next();
  res.sendFile(path.join(__dirname, 'public', 'admin', `${page}.html`));
});
// 提供 uploads 静态访问
const UPLOAD_ROOT = path.join(__dirname, 'public', 'uploads');
const IMAGE_DIR = path.join(UPLOAD_ROOT, 'images');
const PDF_DIR = path.join(UPLOAD_ROOT, 'pdfs');
const FILE_DIR = path.join(UPLOAD_ROOT, 'files');
const LATEX_DIR = path.join(UPLOAD_ROOT, 'latex');
const LATEX_PROJ_DIR = path.join(LATEX_DIR, 'projects');
if (!fs.existsSync(UPLOAD_ROOT)) fs.mkdirSync(UPLOAD_ROOT, { recursive: true });
if (!fs.existsSync(IMAGE_DIR)) fs.mkdirSync(IMAGE_DIR, { recursive: true });
if (!fs.existsSync(PDF_DIR)) fs.mkdirSync(PDF_DIR, { recursive: true });
if (!fs.existsSync(FILE_DIR)) fs.mkdirSync(FILE_DIR, { recursive: true });
if (!fs.existsSync(LATEX_DIR)) fs.mkdirSync(LATEX_DIR, { recursive: true });
if (!fs.existsSync(LATEX_PROJ_DIR)) fs.mkdirSync(LATEX_PROJ_DIR, { recursive: true });
app.use('/uploads', express.static(UPLOAD_ROOT));

// JSON 持久化
const DATA_FILE = path.join(__dirname, 'data.json');
function loadData() {
  try {
    if (!fs.existsSync(DATA_FILE)) return null;
    const txt = fs.readFileSync(DATA_FILE, 'utf-8');
    return JSON.parse(txt);
  } catch { return null; }
}
function saveData() {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(mockData, null, 2));
  } catch {}
}

// ============================
// Mock 数据
// ============================
const users = [
  { id: 1, username: 'admin', password: 'rsag2025!', role: 'admin' },
  { id: 2, username: 'editor', password: 'rsag_edit2025', role: 'editor' }
];

const mockData = {
  publications: [],
  news: [
    {
      id: 1,
      title: '祝贺！萧星宇同学论文入选第六届中国"双法"研究会风险管理分会学术年会推荐名单',
      summary: '祝贺团队成员在学术评选活动中取得优异成绩',
      content: '<p>在第六届中国"双法"研究会风险管理分会学术年会暨2025年清华大学质量与可靠性研究院年会论文评选活动中，我团队成员萧星宇的研究论文经过严格的评审程序，成功入选推荐名单。</p>',
      author: '管理员',
      publish_date: '2025-08-11',
      category: 'award',
      status: 'published',
      created_at: new Date().toISOString()
    },
    {
      id: 2,
      title: '课题组在 HTGR 裂变产物释放建模方面取得新进展',
      summary: '在 ANE 期刊发表重要研究成果',
      content: '<p>我们提出的全堆芯裂变产物释放模型获得同行认可。</p>',
      author: '管理员',
      publish_date: '2025-07-15',
      category: 'research',
      status: 'published',
      created_at: new Date().toISOString()
    },
    {
      id: 3,
      title: 'HTR-PM 多物理耦合仿真取得突破',
      summary: '在 NSE 期刊发表高保真仿真研究',
      content: '<p>建立了中子学/热工水力学/球流三场高保真耦合模型。</p>',
      author: '管理员',
      publish_date: '2025-05-10',
      category: 'research',
      status: 'published',
      created_at: new Date().toISOString()
    },
    {
      id: 4,
      title: '参加国际反应堆物理会议并作主题报告',
      summary: '展示研究成果，获得同行认可',
      content: '<p>关于球床高温气冷堆安全分析的主题报告获广泛关注。</p>',
      author: '管理员',
      publish_date: '2025-04-25',
      category: 'conference',
      status: 'published',
      created_at: new Date().toISOString()
    },
    {
      id: 5,
      title: '欢迎新成员加入 RSAG 课题组',
      summary: '新研究生同学入组',
      content: '<p>欢迎新同学加入团队，期待取得更多成果。</p>',
      author: '管理员',
      publish_date: '2025-04-20',
      category: 'team',
      status: 'published',
      created_at: new Date().toISOString()
    }
  ],
  team: [
    {
      id: 1,
      name: '梁金刚',
      title: '副教授',
      research_area: '反应堆放射性源项、辐射防护与屏蔽分析、蒙特卡罗粒子输运模拟、智能化核应急决策技术',
      photo_url: '/images/梁金刚.png',
      order_index: 1,
      status: 'active',
      created_at: new Date().toISOString()
    },
    {
      id: 2,
      name: '齐奔',
      title: '博士/硕士',
      research_area: '核能系统智能化监测、诊断与预测',
      photo_url: '/images/齐奔.png',
      order_index: 2,
      status: 'active',
      created_at: new Date().toISOString()
    },
    {
      id: 3,
      name: '李睿涵',
      title: '博士',
      research_area: '高温气冷堆高保真多物理耦合研究',
      photo_url: '/images/睿涵.png',
      order_index: 3,
      status: 'active',
      created_at: new Date().toISOString()
    },
    {
      id: 4,
      name: '张伟健',
      title: '硕士',
      research_area: '辐射屏蔽先进计算方法、GPU 并行',
      photo_url: '/images/伟健.png',
      order_index: 4,
      status: 'active',
      created_at: new Date().toISOString()
    }
  ],
  files: [],
  activities: []
};

// 先尝试从 data.json 恢复
const loaded = loadData();
if (loaded) {
  try { Object.assign(mockData, loaded); } catch {}
}

// 从静态 HTML 导入发表列表（当迁移数据不足时）
function importPublicationsFromHTMLIfNeeded() {
  try {
    if (mockData.publications && mockData.publications.length >= 20) return; // 数据已较完整
    const htmlPath = path.join(__dirname, 'public', 'publications.html');
    if (!fs.existsSync(htmlPath)) return;
    const html = fs.readFileSync(htmlPath, 'utf-8');

    function extractSection(sectionTitle) {
      const idx = html.indexOf(`<h2>${sectionTitle}`);
      if (idx === -1) return [];
      const olStart = html.indexOf('<ol>', idx);
      const olEnd = html.indexOf('</ol>', olStart);
      if (olStart === -1 || olEnd === -1) return [];
      const olContent = html.slice(olStart, olEnd);
      const liRegex = /<li>([\s\S]*?)<\/li>/g;
      const items = [];
      let m;
      while ((m = liRegex.exec(olContent)) !== null) {
        items.push(m[1]);
      }
      return items;
    }

    function parseLiToPublication(liHtml, primaryType) {
      // 提取标题（英文引号中的内容）
      const titleMatch = liHtml.match(/"([^"]+)"/);
      const title = titleMatch ? titleMatch[1] : '';
      // 提取期刊/会议
      const journalMatch = liHtml.match(/<em>(.*?)<\/em>/i);
      const journal = journalMatch ? journalMatch[1] : '';
      // 提取 DOI 链接
      const urlMatch = liHtml.match(/href="(https?:[^\"]+)"/i);
      const url = urlMatch ? urlMatch[1] : '';
      // 提取作者（在标题前的一段，以点号分隔）
      const authorPart = liHtml.split('"')[0];
      const authors = authorPart.replace(/<[^>]+>/g, '').trim().replace(/\.$/, '');
      // 提取日期中的年份和月份（格式如 2025-07 或 2024-12）
      const ymMatch = liHtml.match(/\b(20\d{2})[-\/\.](\d{1,2})\b/);
      const year = ymMatch ? parseInt(ymMatch[1], 10) : (new Date()).getFullYear();
      const month = ymMatch ? String(parseInt(ymMatch[2], 10)).padStart(2, '0') : '12';

      const types = [primaryType];
      return {
        id: undefined,
        title,
        authors,
        journal,
        year,
        month,
        types,
        // 兼容旧字段
        type: primaryType === 'Conference' ? 'Conference' : primaryType,
        doi: '',
        url,
        status: 'published',
        created_at: new Date().toISOString()
      };
    }

    const sciLis = extractSection('SCI (Science Citation Index) Journal Papers');
    const eiLis = extractSection('EI (Engineering Index) Papers');
    const imported = [];
    sciLis.forEach(li => imported.push(parseLiToPublication(li, 'SCI')));
    eiLis.forEach(li => imported.push(parseLiToPublication(li, 'EI')));

    // 去重：根据标题判断
    const existedTitles = new Set((mockData.publications || []).map(p => (p.title || '').toLowerCase()));
    const newOnes = imported.filter(p => p.title && !existedTitles.has(p.title.toLowerCase()));
    // 赋予新 ID 并加入
    newOnes.forEach(p => {
      p.id = (mockData.publications?.length || 0) + 1;
      mockData.publications.push(p);
    });
    if (newOnes.length) {
      console.log(`已从 publications.html 导入 ${newOnes.length} 篇发表记录`);
    }
  } catch (e) {
    console.warn('导入 publications.html 失败:', e.message);
  }
}

importPublicationsFromHTMLIfNeeded();
// 导入后持久化一次
saveData();

// 兼容恢复：从 migration_data.js 合并缺失的团队/发表数据（按名称/标题去重）
function restoreFromMigrationIfNeeded() {
  let changed = false;
  try {
    if (Array.isArray(team_data) && team_data.length) {
      const existingNames = new Set((mockData.team || []).map(m => (m.name || '').trim()));
      const toAdd = team_data.filter(m => m && m.name && !existingNames.has(m.name.trim()));
      if (toAdd.length) {
        const nextId = (mockData.team && mockData.team.length)
          ? Math.max(...mockData.team.map(t => t.id || 0)) + 1
          : 1;
        toAdd.forEach((m, idx) => {
          mockData.team.push({
            id: nextId + idx,
            name: m.name,
            title: m.title || m.position || '',
            research_area: m.research_area || m.research || '',
            photo_url: m.photo_url || m.photo || '',
            status: m.status || 'active',
            order_index: m.order_index || (nextId + idx),
            created_at: new Date().toISOString()
          });
        });
        changed = true;
      }
      // 排序稳定
      mockData.team = (mockData.team || []).sort((a, b) => (a.order_index || 0) - (b.order_index || 0));
    }

    if (Array.isArray(publications_data) && publications_data.length) {
      const existingTitles = new Set((mockData.publications || []).map(p => (p.title || '').toLowerCase()));
      const toAddPubs = publications_data.filter(p => p && p.title && !existingTitles.has(p.title.toLowerCase()));
      if (toAddPubs.length) {
        const nextIdP = (mockData.publications && mockData.publications.length)
          ? Math.max(...mockData.publications.map(t => t.id || 0)) + 1
          : 1;
        toAddPubs.forEach((p, idx) => {
          const types = Array.isArray(p.types) ? p.types : (p.type ? [p.type] : []);
          mockData.publications.push({
            id: nextIdP + idx,
            title: p.title || '',
            authors: p.authors || '',
            journal: p.journal || '',
            year: p.year || new Date().getFullYear(),
            month: p.month ? String(p.month).padStart(2, '0') : '12',
            types,
            type: p.type || (types.includes('SCI') ? 'SCI' : (types.includes('EI') ? 'EI' : (types[0] || 'Conference'))),
            doi: p.doi || '',
            url: p.url || '',
            status: p.status || 'published',
            created_at: new Date().toISOString()
          });
        });
        changed = true;
      }
    }
  } catch (e) {
    console.warn('恢复迁移数据时出错:', e.message);
  }
  if (changed) saveData();
}

restoreFromMigrationIfNeeded();

// ============================
// 伪 JWT（与前端 AdminUtils 兼容）
// ============================
function generateToken(user) {
  const header = { alg: 'none', typ: 'JWT' };
  const payload = {
    username: user.username,
    role: user.role,
    exp: Math.floor(Date.now() / 1000) + 24 * 60 * 60
  };
  const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64');
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64');
  return `${encodedHeader}.${encodedPayload}.signature`;
}

function verifyToken(token) {
  const parts = token.split('.');
  if (parts.length !== 3) throw new Error('Invalid token');
  const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
  if (!payload.exp || payload.exp < Date.now() / 1000) throw new Error('Token expired');
  return payload;
}

function authenticate(req, res, next) {
  const authHeader = req.headers.authorization || '';
  if (!authHeader.startsWith('Bearer ')) return res.status(401).json({ error: '未提供认证令牌' });
  try {
    const token = authHeader.substring(7);
    req.user = verifyToken(token);
    next();
  } catch (e) {
    return res.status(401).json({ error: '认证失败' });
  }
}

function logActivity(action, tableName, recordId, user, details = null) {
  const activity = {
    id: mockData.activities.length + 1,
    action,
    table_name: tableName,
    record_id: recordId,
    user,
    details,
    created_at: new Date().toISOString()
  };
  mockData.activities.unshift(activity);
  if (mockData.activities.length > 50) mockData.activities = mockData.activities.slice(0, 50);
}

function inferFileCategory(fileType = '') {
  if (fileType.startsWith('image/')) return 'image';
  if (fileType.includes('pdf') || fileType.includes('word') || fileType.includes('document') || fileType.includes('excel') || fileType.includes('spreadsheet') || fileType.includes('powerpoint') || fileType.includes('presentation')) {
    return 'document';
  }
  return 'general';
}

const ALLOWED_DOC_MIME = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
  'text/csv',
  'application/zip',
  'application/x-zip-compressed'
]);

function isAllowedUploadMime(mime = '') {
  return mime.startsWith('image/') || ALLOWED_DOC_MIME.has(mime);
}

function isFileTypeCompatible(uploadType = '', mime = '') {
  const type = String(uploadType || '').toLowerCase();
  if (!type || type === 'general') return true;
  if (type === 'news' || type === 'avatar' || type === 'image') return mime.startsWith('image/');
  if (type === 'pdf') return mime === 'application/pdf';
  if (type === 'document') return ALLOWED_DOC_MIME.has(mime);
  return true;
}

function removeUploadedFile(filePath) {
  if (!filePath) return;
  fs.unlink(filePath, () => {});
}

const uploadStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) return cb(null, IMAGE_DIR);
    if (file.mimetype === 'application/pdf') return cb(null, PDF_DIR);
    return cb(null, FILE_DIR);
  },
  filename: (req, file, cb) => {
    const originalName = (file.originalname || 'upload.bin').replace(/[^a-zA-Z0-9._-]/g, '_');
    cb(null, `${Date.now()}_${originalName}`);
  }
});
const uploadGeneric = multer({ storage: uploadStorage, limits: { fileSize: 50 * 1024 * 1024 } });

// ============================
// 公开 API（给前台使用）
// ============================
app.get('/api/publications', (req, res) => {
  const pubs = mockData.publications
    .filter(p => (p.status || 'published') === 'published')
    .map(p => ({
      ...p,
      // 兼容：如有 types 则回填 type 以供前端过滤
      type: p.type || (Array.isArray(p.types) && (p.types.includes('SCI') ? 'SCI' : (p.types.includes('EI') ? 'EI' : (p.types.length ? 'Conference' : 'Other'))))
    }))
    .sort((a, b) => (b.year - a.year) || (parseInt(b.month || '12') - parseInt(a.month || '12')));
  res.json({ publications: pubs });
});

app.get('/api/news', (req, res) => {
  const news = mockData.news
    .map(n => ({ ...n, publish_date: n.publish_date || n.published_date }))
    .filter(n => (n.status || 'published') === 'published')
    .sort((a, b) => new Date(b.publish_date) - new Date(a.publish_date));
  res.json({ news });
});

app.get('/api/news/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: '无效的新闻 ID' });
  }

  const item = mockData.news
    .map(n => ({ ...n, publish_date: n.publish_date || n.published_date }))
    .find(n => n.id === id && (n.status || 'published') === 'published');

  if (!item) {
    return res.status(404).json({ error: '新闻不存在' });
  }

  return res.json({ news: item });
});

app.get('/api/team', (req, res) => {
  const team = mockData.team
    .map(t => ({
      id: t.id,
      name: t.name,
      title: t.title || t.position || '',
      research_area: t.research_area || t.research || '',
      photo_url: t.photo_url || t.photo || '',
      status: t.status || 'active',
      order_index: t.order_index || t.id
    }))
    .sort((a, b) => (a.order_index || 0) - (b.order_index || 0));
  res.json({ team });
});

// 聊天占位（本地）
app.post('/api/chat', (req, res) => {
  const { language } = req.body || {};
  const reply = language === 'en'
    ? 'This is a local mock reply. The production assistant will be enabled after deployment.'
    : '本地环境为模拟回复。部署到生产后将启用智能助手服务。';
  res.type('text').send(reply);
});

// ============================
// 管理后台 API（需要认证）
// ============================
// 登录（兼容两种路径）
app.post('/api/admin/login', (req, res) => {
  const { username, password } = req.body || {};
  const user = users.find(u => u.username === username && u.password === password);
  if (!user) return res.status(401).json({ error: '用户名或密码错误' });
  const token = generateToken(user);
  logActivity('登录', 'auth', user.id, username, '用户登录');
  res.json({ token, user: { username: user.username, role: user.role } });
});
app.post('/api/admin/auth/login', (req, res) => {
  const { username, password } = req.body || {};
  const user = users.find(u => u.username === username && u.password === password);
  if (!user) return res.status(401).json({ error: '用户名或密码错误' });
  const token = generateToken(user);
  logActivity('登录', 'auth', user.id, username, '用户登录');
  res.json({ token, user: { username: user.username, role: user.role } });
});

// 统计
app.get('/api/admin/stats', authenticate, (req, res) => {
  res.json({
    publications: mockData.publications.length,
    news: mockData.news.filter(n => (n.status || 'published') === 'published').length,
    team: mockData.team.filter(t => (t.status || 'active') === 'active').length,
    files: mockData.files.length
  });
});

// 活动
app.get('/api/admin/activities', authenticate, (req, res) => {
  const limit = parseInt(req.query.limit || '10');
  res.json({ activities: mockData.activities.slice(0, limit) });
});

// 论文（分页 + 搜索，返回 publications/totalPages/currentPage）
app.get('/api/admin/publications', authenticate, (req, res) => {
  const page = parseInt(req.query.page || '1');
  const limit = parseInt(req.query.limit || '10');
  const search = (req.query.search || '').toString().toLowerCase();

  let filtered = mockData.publications;
  if (search) {
    filtered = filtered.filter(p =>
      (p.title || '').toLowerCase().includes(search) ||
      (p.authors || '').toLowerCase().includes(search) ||
      (p.journal || '').toLowerCase().includes(search)
    );
  }
  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / (limit || 1)));
  const currentPage = Math.min(Math.max(1, page), totalPages);
  const start = (currentPage - 1) * limit;
  const publications = filtered.slice(start, start + limit);

  res.json({ publications, totalPages, currentPage });
});

app.get('/api/admin/publications/:id', authenticate, (req, res) => {
  const id = parseInt(req.params.id);
  const pub = mockData.publications.find(p => p.id === id);
  if (!pub) return res.status(404).json({ error: '论文不存在' });
  res.json(pub);
});

app.post('/api/admin/publications', authenticate, (req, res) => {
  const publication = {
    id: mockData.publications.length + 1,
    ...req.body,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  // 兼容 types 多选 -> 回填 legacy type（优先级：SCI > EI > Conference）
  if (Array.isArray(publication.types) && !publication.type) {
    if (publication.types.includes('SCI')) publication.type = 'SCI';
    else if (publication.types.includes('EI')) publication.type = 'EI';
    else publication.type = 'Conference';
  }
  mockData.publications.unshift(publication);
  saveData();
  logActivity('添加论文', 'publications', publication.id, req.user.username, `添加论文: ${publication.title}`);
  res.status(201).json({ id: publication.id, message: '论文添加成功', frontend_url: '/publications-api.html' });
});

app.put('/api/admin/publications/:id', authenticate, (req, res) => {
  const id = parseInt(req.params.id);
  const index = mockData.publications.findIndex(p => p.id === id);
  if (index === -1) return res.status(404).json({ error: '论文不存在' });
  mockData.publications[index] = {
    ...mockData.publications[index],
    ...req.body,
    updated_at: new Date().toISOString()
  };
  saveData();
  // 兼容 types 多选 -> 回填 legacy type
  const cur = mockData.publications[index];
  if (Array.isArray(cur.types) && !cur.type) {
    if (cur.types.includes('SCI')) cur.type = 'SCI';
    else if (cur.types.includes('EI')) cur.type = 'EI';
    else cur.type = 'Conference';
  }
  logActivity('更新论文', 'publications', id, req.user.username, `更新论文: ${req.body.title || mockData.publications[index].title}`);
  res.json({ message: '论文更新成功', frontend_url: '/publications-api.html' });
});

app.delete('/api/admin/publications/:id', authenticate, (req, res) => {
  const id = parseInt(req.params.id);
  const index = mockData.publications.findIndex(p => p.id === id);
  if (index === -1) return res.status(404).json({ error: '论文不存在' });
  const removed = mockData.publications.splice(index, 1)[0];
  saveData();
  logActivity('删除论文', 'publications', id, req.user.username, `删除论文: ${removed.title}`);
  res.json({ message: '论文删除成功' });
});

// 新闻（分页 + 搜索，返回 news/totalPages/currentPage）
app.get('/api/admin/news', authenticate, (req, res) => {
  const page = parseInt(req.query.page || '1');
  const limit = parseInt(req.query.limit || '10');
  const search = (req.query.search || '').toString().toLowerCase();

  let filtered = mockData.news;
  if (search) {
    filtered = filtered.filter(n =>
      (n.title || '').toLowerCase().includes(search) ||
      (n.summary || '').toLowerCase().includes(search) ||
      (n.content || '').toLowerCase().includes(search)
    );
  }
  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / (limit || 1)));
  const currentPage = Math.min(Math.max(1, page), totalPages);
  const start = (currentPage - 1) * limit;
  const news = filtered.slice(start, start + limit);

  res.json({ news, totalPages, currentPage });
});

app.get('/api/admin/news/:id', authenticate, (req, res) => {
  const id = parseInt(req.params.id);
  const n = mockData.news.find(x => x.id === id);
  if (!n) return res.status(404).json({ error: '新闻不存在' });
  res.json({ ...n, publish_date: n.publish_date || n.published_date });
});

app.post('/api/admin/news', authenticate, (req, res) => {
  const news = {
    id: mockData.news.length + 1,
    ...req.body,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  mockData.news.unshift(news);
  saveData();
  logActivity('发布新闻', 'news', news.id, req.user.username, `发布新闻: ${news.title}`);
  res.status(201).json({ id: news.id, message: '新闻发布成功', frontend_url: `/news/detail.html?id=${news.id}` });
});

app.put('/api/admin/news/:id', authenticate, (req, res) => {
  const id = parseInt(req.params.id);
  const index = mockData.news.findIndex(n => n.id === id);
  if (index === -1) return res.status(404).json({ error: '新闻不存在' });
  mockData.news[index] = {
    ...mockData.news[index],
    ...req.body,
    updated_at: new Date().toISOString()
  };
  saveData();
  logActivity('更新新闻', 'news', id, req.user.username, `更新新闻: ${req.body.title || mockData.news[index].title}`);
  res.json({ message: '新闻更新成功', frontend_url: `/news/detail.html?id=${id}` });
});

app.delete('/api/admin/news/:id', authenticate, (req, res) => {
  const id = parseInt(req.params.id);
  const index = mockData.news.findIndex(n => n.id === id);
  if (index === -1) return res.status(404).json({ error: '新闻不存在' });
  const removed = mockData.news.splice(index, 1)[0];
  saveData();
  logActivity('删除新闻', 'news', id, req.user.username, `删除新闻: ${removed.title}`);
  res.json({ message: '新闻删除成功' });
});

// 团队（搜索，返回 team 数组）
app.get('/api/admin/team', authenticate, (req, res) => {
  const search = (req.query.search || '').toString().toLowerCase();
  let team = mockData.team;
  if (search) {
    team = team.filter(t =>
      (t.name || '').toLowerCase().includes(search) ||
      ((t.title || t.position || '').toLowerCase().includes(search))
    );
  }
  team = team.sort((a, b) => (a.order_index || 0) - (b.order_index || 0));
  res.json({ team });
});

app.get('/api/admin/team/:id', authenticate, (req, res) => {
  const id = parseInt(req.params.id);
  const member = mockData.team.find(t => t.id === id);
  if (!member) return res.status(404).json({ error: '成员不存在' });
  res.json(member);
});

app.post('/api/admin/team', authenticate, (req, res) => {
  const member = {
    id: mockData.team.length + 1,
    ...req.body,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  mockData.team.push(member);
  saveData();
  logActivity('添加成员', 'team', member.id, req.user.username, `添加成员: ${member.name}`);
  res.status(201).json({ id: member.id, message: '成员添加成功' });
});

app.put('/api/admin/team/:id', authenticate, (req, res) => {
  const id = parseInt(req.params.id);
  const index = mockData.team.findIndex(t => t.id === id);
  if (index === -1) return res.status(404).json({ error: '成员不存在' });
  mockData.team[index] = {
    ...mockData.team[index],
    ...req.body,
    updated_at: new Date().toISOString()
  };
  saveData();
  logActivity('更新成员', 'team', id, req.user.username, `更新成员: ${req.body.name || mockData.team[index].name}`);
  res.json({ message: '成员信息更新成功' });
});

app.delete('/api/admin/team/:id', authenticate, (req, res) => {
  const id = parseInt(req.params.id);
  const index = mockData.team.findIndex(t => t.id === id);
  if (index === -1) return res.status(404).json({ error: '成员不存在' });
  const removed = mockData.team.splice(index, 1)[0];
  saveData();
  logActivity('删除成员', 'team', id, req.user.username, `删除成员: ${removed.name}`);
  res.json({ message: '成员删除成功' });
});

// 文件管理（分页 + 搜索 + 类型过滤，返回 files/totalPages/currentPage）
app.get('/api/admin/files', authenticate, (req, res) => {
  const page = parseInt(req.query.page || '1');
  const limit = parseInt(req.query.limit || '12');
  const search = (req.query.search || '').toString().toLowerCase();
  const type = (req.query.type || '').toString().toLowerCase();

  let files = mockData.files;
  if (search) files = files.filter(f => (f.original_name || '').toLowerCase().includes(search));
  if (type) {
    files = files.filter(f => {
      const fileType = (f.file_type || '').toLowerCase();
      const category = ((f.category || '').toLowerCase()) || inferFileCategory(fileType);
      if (type === 'document') return category === 'document';
      if (type === 'image') return category === 'image';
      return category === type;
    });
  }

  const total = files.length;
  const totalPages = Math.max(1, Math.ceil(total / (limit || 1)));
  const currentPage = Math.min(Math.max(1, page), totalPages);
  const start = (currentPage - 1) * limit;
  const pageFiles = files.slice(start, start + limit);

  res.json({ files: pageFiles, totalPages, currentPage });
});

app.get('/api/admin/files/:id', authenticate, (req, res) => {
  const id = parseInt(req.params.id);
  const file = mockData.files.find(f => f.id === id);
  if (!file) return res.status(404).json({ error: '文件不存在' });
  res.json(file);
});

app.post('/api/admin/upload', authenticate, uploadGeneric.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: '未收到文件' });

  const type = (req.body?.type || '').toString().toLowerCase();
  const mimeType = req.file.mimetype || '';

  if (!isAllowedUploadMime(mimeType)) {
    removeUploadedFile(req.file.path);
    return res.status(400).json({ error: '不支持的文件类型，仅允许图片、PDF 和常见办公文档' });
  }

  if (!isFileTypeCompatible(type, mimeType)) {
    removeUploadedFile(req.file.path);
    return res.status(400).json({ error: '上传类型与文件类型不匹配' });
  }

  const folderName = req.file.destination === IMAGE_DIR ? 'images' : (req.file.destination === PDF_DIR ? 'pdfs' : 'files');
  const fileUrl = `/uploads/${folderName}/${req.file.filename}`;
  const category = type || inferFileCategory(mimeType);

  const newFile = {
    id: mockData.files.length + 1,
    filename: req.file.filename,
    original_name: req.file.originalname,
    file_url: fileUrl,
    file_type: mimeType,
    file_size: req.file.size,
    category,
    uploaded_by: req.user.username,
    created_at: new Date().toISOString()
  };

  mockData.files.unshift(newFile);
  saveData();
  logActivity('上传文件', 'files', newFile.id, req.user.username, `上传文件: ${newFile.original_name}`);
  res.json({ url: newFile.file_url, file: newFile, message: '文件上传成功' });
});

app.delete('/api/admin/files/:id', authenticate, (req, res) => {
  const id = parseInt(req.params.id);
  const index = mockData.files.findIndex(f => f.id === id);
  if (index === -1) return res.status(404).json({ error: '文件不存在' });
  mockData.files.splice(index, 1);
  saveData();
  res.json({ message: '文件删除成功' });
});

// PDF 文献上传（保存到 uploads/pdfs，并把 URL 写入 publications.pdf_url）
const pdfStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, PDF_DIR),
  filename: (req, file, cb) => {
    const safe = `${Date.now()}_${file.originalname.replace(/\s+/g, '_')}`;
    cb(null, safe);
  }
});
const uploadPdf = multer({ storage: pdfStorage, limits: { fileSize: 50 * 1024 * 1024 } });

app.post('/api/admin/publications/:id/upload-pdf', authenticate, uploadPdf.single('pdf'), (req, res) => {
  const id = parseInt(req.params.id);
  const index = mockData.publications.findIndex(p => p.id === id);
  if (index === -1) return res.status(404).json({ error: '论文不存在' });
  if (!req.file) return res.status(400).json({ error: '未收到 PDF 文件' });
  if (req.file.mimetype !== 'application/pdf') {
    removeUploadedFile(req.file.path);
    return res.status(400).json({ error: '仅支持 PDF 文件上传' });
  }
  const fileUrl = `/uploads/pdfs/${req.file.filename}`;
  mockData.publications[index].pdf_url = fileUrl;
  mockData.publications[index].updated_at = new Date().toISOString();
  saveData();
  logActivity('上传PDF', 'publications', id, req.user.username, `上传PDF: ${req.file.originalname}`);
  res.json({ url: fileUrl, message: 'PDF上传成功' });
});

// 保存新闻的 LaTeX 源文件
app.post('/api/admin/news/:id/latex', authenticate, (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const index = mockData.news.findIndex(n => n.id === id);
    if (index === -1) return res.status(404).json({ error: '新闻不存在' });
    const { latex, filename } = req.body || {};
    if (!latex || typeof latex !== 'string') {
      return res.status(400).json({ error: '缺少有效的 latex 内容' });
    }
    const safeName = filename && typeof filename === 'string' ? filename.replace(/[^a-zA-Z0-9_\-\.]/g, '_') : `news_${id}_${Date.now()}.tex`;
    const filePath = path.join(LATEX_DIR, safeName);
    fs.writeFileSync(filePath, latex, 'utf-8');
    const url = `/uploads/latex/${safeName}`;
    mockData.news[index].latex_path = url;
    mockData.news[index].updated_at = new Date().toISOString();
    saveData();
    logActivity('上传LaTeX', 'news', id, req.user.username, `保存 LaTeX: ${safeName}`);
    res.json({ url, message: 'LaTeX 已保存' });
  } catch (e) {
    res.status(500).json({ error: '保存失败' });
  }
});

// 编译新闻 LaTeX 为 PDF（需要本机安装 pdflatex）
app.post('/api/admin/news/:id/latex-build', authenticate, (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const index = mockData.news.findIndex(n => n.id === id);
    if (index === -1) return res.status(404).json({ error: '新闻不存在' });
    const latexPath = mockData.news[index].latex_path;
    if (!latexPath) return res.status(400).json({ error: '尚未保存 LaTeX 源稿' });

    const fileName = path.basename(latexPath); // news_xxx.tex
    const texAbs = path.join(LATEX_DIR, fileName);
    if (!fs.existsSync(texAbs)) return res.status(404).json({ error: 'LaTeX 文件不存在' });

    const args = ['-interaction=nonstopmode', '-halt-on-error', '-output-directory', LATEX_DIR, texAbs];
    execFile('pdflatex', args, { cwd: LATEX_DIR, timeout: 120000 }, (err, stdout, stderr) => {
      if (err) {
        console.error('pdflatex 错误:', err);
        return res.status(500).json({ error: '编译失败，请检查 LaTeX 源或安装 pdflatex', log: stderr || stdout || String(err) });
      }
      const pdfName = fileName.replace(/\.tex$/i, '.pdf');
      const pdfAbs = path.join(LATEX_DIR, pdfName);
      if (!fs.existsSync(pdfAbs)) {
        return res.status(500).json({ error: '编译失败：未生成 PDF', log: stdout });
      }
      const url = `/uploads/latex/${pdfName}`;
      mockData.news[index].latex_pdf_path = url;
      mockData.news[index].updated_at = new Date().toISOString();
      saveData();
      logActivity('编译LaTeX', 'news', id, req.user.username, `生成 PDF: ${pdfName}`);
      res.json({ url, message: 'PDF 编译成功' });
    });
  } catch (e) {
    res.status(500).json({ error: '编译异常' });
  }
});

// ============== LaTeX 在线编辑：项目与文件 API ==============
function safeName(name) { return String(name).replace(/[^a-zA-Z0-9_\-\.]/g, '_'); }
function listFilesRecursive(rootDir, baseDir = '') {
  const result = [];
  const entries = fs.readdirSync(rootDir, { withFileTypes: true });
  for (const ent of entries) {
    const rel = path.join(baseDir, ent.name);
    const abs = path.join(rootDir, ent.name);
    if (ent.isDirectory()) {
      result.push(...listFilesRecursive(abs, rel));
    } else {
      result.push(rel);
    }
  }
  return result;
}

// 列出项目
app.get('/api/admin/latex/projects', authenticate, (req, res) => {
  const projects = fs.readdirSync(LATEX_PROJ_DIR, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => ({ name: d.name, path: `/uploads/latex/projects/${d.name}/` }));
  res.json({ projects });
});

// 创建项目
app.post('/api/admin/latex/projects', authenticate, (req, res) => {
  const { name } = req.body || {};
  if (!name) return res.status(400).json({ error: '缺少项目名称' });
  const safe = safeName(name);
  const projDir = path.join(LATEX_PROJ_DIR, safe);
  if (!fs.existsSync(projDir)) fs.mkdirSync(projDir, { recursive: true });
  // 初始化一个 main.tex
  const mainTex = path.join(projDir, 'main.tex');
  if (!fs.existsSync(mainTex)) {
    fs.writeFileSync(mainTex, '\\documentclass{article}\n\\usepackage{amsmath, amssymb, graphicx}\n\\title{Title}\n\\author{RSAG}\n\\date{\\today}\n\\begin{document}\n\\maketitle\nHello, RSAG! $E=mc^2$.\\end{document}\n');
  }
  res.json({ message: '项目已创建', name: safe });
});

// 列出项目文件
app.get('/api/admin/latex/projects/:project/files', authenticate, (req, res) => {
  const proj = safeName(req.params.project);
  const projDir = path.join(LATEX_PROJ_DIR, proj);
  if (!fs.existsSync(projDir)) return res.status(404).json({ error: '项目不存在' });
  const files = listFilesRecursive(projDir);
  res.json({ files });
});

// 读取文件
app.get('/api/admin/latex/projects/:project/file', authenticate, (req, res) => {
  const proj = safeName(req.params.project);
  const rel = req.query.path;
  if (!rel) return res.status(400).json({ error: '缺少文件路径' });
  const abs = path.join(LATEX_PROJ_DIR, proj, rel);
  if (!abs.startsWith(path.join(LATEX_PROJ_DIR, proj))) return res.status(400).json({ error: '非法路径' });
  if (!fs.existsSync(abs)) return res.status(404).json({ error: '文件不存在' });
  const content = fs.readFileSync(abs, 'utf-8');
  res.json({ content });
});

// 保存文件
app.post('/api/admin/latex/projects/:project/file', authenticate, (req, res) => {
  const proj = safeName(req.params.project);
  const { path: rel, content } = req.body || {};
  if (!rel) return res.status(400).json({ error: '缺少文件路径' });
  const abs = path.join(LATEX_PROJ_DIR, proj, rel);
  if (!abs.startsWith(path.join(LATEX_PROJ_DIR, proj))) return res.status(400).json({ error: '非法路径' });
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  fs.writeFileSync(abs, content || '', 'utf-8');
  res.json({ message: '保存成功' });
});

// ============================
// 启动
// ============================
app.listen(PORT, () => {
  console.log('🚀 本地测试服务器启动成功！');
  console.log(`📱 管理后台访问地址: http://localhost:${PORT}/admin/login.html`);
  console.log(`🌐 前端网站访问地址: http://localhost:${PORT}/index.html`);
  console.log('👤 管理员账号: admin / rsag2025!');
  console.log('✏️ 编辑员账号: editor / rsag_edit2025');
});
