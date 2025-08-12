// 本地测试服务器（稳定版）
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 3000;

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// ============================
// Mock 数据
// ============================
const users = [
  { id: 1, username: 'admin', password: 'rsag2025!', role: 'admin' },
  { id: 2, username: 'editor', password: 'rsag_edit2025', role: 'editor' }
];

const mockData = {
  publications: [
    {
      id: 1,
      title: 'A transient detection framework in nuclear power plants using zero-shot learning based on digital twins',
      authors: 'Ben Qi; Jun Sun; Zhe Sui; Xingyu Xiao; Jingang Liang*',
      journal: 'Progress in Nuclear Energy',
      year: 2025,
      month: '07',
      doi: '10.1016/j.pnucene.2025.105848',
      url: 'https://doi.org/10.1016/j.pnucene.2025.105848',
      type: 'SCI',
      status: 'published',
      created_at: new Date().toISOString()
    },
    {
      id: 2,
      title: 'Advanced full-core modeling of fission product release in pebble-bed high-temperature gas-cooled reactors',
      authors: 'Chenghao Cao; Junyi Chen; Jingang Liang*; Chuan Li; Jianzhu Cao',
      journal: 'Annals of Nuclear Energy',
      year: 2025,
      month: '06',
      doi: '10.1016/j.anucene.2025.111240',
      url: 'https://doi.org/10.1016/j.anucene.2025.111240',
      type: 'SCI',
      status: 'published',
      created_at: new Date().toISOString()
    },
    {
      id: 3,
      title: 'POKER: a new point kernel 3D radiation field characterization code',
      authors: 'Junyi Chen; Ruihan Li; Yujia Chen; Chenghao Cao; Jingang Liang*',
      journal: 'Nuclear Engineering and Technology',
      year: 2025,
      month: '06',
      doi: '10.1016/j.net.2024.103410',
      url: 'https://doi.org/10.1016/j.net.2024.103410',
      type: 'SCI',
      status: 'published',
      created_at: new Date().toISOString()
    },
    {
      id: 4,
      title: 'Enhancing accuracy and efficiency of RMC/SUBCHAN coupling system for BEAVRS',
      authors: 'Hao Luo; Kaiwen Li; Jie Li; Zhaoyuan Liu; Jingang Liang*; Kan Wang',
      journal: 'Progress in Nuclear Energy',
      year: 2025,
      month: '05',
      doi: '10.1016/j.pnucene.2025.105666',
      url: 'https://doi.org/10.1016/j.pnucene.2025.105666',
      type: 'SCI',
      status: 'published',
      created_at: new Date().toISOString()
    },
    {
      id: 5,
      title: 'Dynamic Risk-Informed Framework for Emergency Human Error Prevention',
      authors: 'Xingyu Xiao; Ben Qi; Peng Chen; Jingang Liang*',
      journal: 'Reliability Engineering and System Safety',
      year: 2025,
      month: '04',
      doi: '10.1016/j.ress.2025.111080',
      url: 'https://doi.org/10.1016/j.ress.2025.111080',
      type: 'SCI',
      status: 'published',
      created_at: new Date().toISOString()
    },
    {
      id: 6,
      title: 'High-Fidelity N/T/Pebble Flow Coupling Simulation of HTR-PM',
      authors: 'Ruihan Li; Junyi Chen; Aixin Zhu; Jingang Liang*',
      journal: 'Nuclear Science and Engineering',
      year: 2025,
      month: '03',
      doi: '10.1080/00295639.2025.2471712',
      url: 'https://doi.org/10.1080/00295639.2025.2471712',
      type: 'SCI',
      status: 'published',
      created_at: new Date().toISOString()
    },
    {
      id: 7,
      title: "MC/Sub-Channel Coupling for Xi'an Pulsed Reactor",
      authors: 'Ruihan Li; Lipeng Wang*; Jingang Liang; Xinyi Zhang; Lixin Chen',
      journal: 'Annals of Nuclear Energy',
      year: 2025,
      month: '01',
      doi: '10.1016/j.anucene.2024.110882',
      url: 'https://doi.org/10.1016/j.anucene.2024.110882',
      type: 'SCI',
      status: 'published',
      created_at: new Date().toISOString()
    }
  ],
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

// 恢复初始迁移数据（如存在）
try {
  const migration = require('./migration_data.js');
  if (migration && Array.isArray(migration.publications_data)) {
    mockData.publications = migration.publications_data.map((p, idx) => ({
      id: p.id ?? idx + 1,
      title: p.title,
      authors: p.authors,
      journal: p.journal,
      year: p.year,
      month: (p.month !== undefined ? String(p.month) : '12').padStart(2, '0'),
      type: p.type,
      doi: p.doi || '',
      url: p.url || '',
      status: p.status || 'published',
      created_at: new Date().toISOString()
    }));
  }
  if (migration && Array.isArray(migration.team_data)) {
    mockData.team = migration.team_data.map((t, idx) => ({
      id: t.id ?? idx + 1,
      name: t.name,
      title: t.title,
      research_area: t.research_area || '',
      photo_url: t.photo_url || '',
      order_index: t.order_index ?? (idx + 1),
      status: t.status || 'active',
      created_at: new Date().toISOString()
    }));
  }
} catch (e) {
  console.warn('未加载迁移数据（migration_data.js）:', e.message);
}

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

// ============================
// 公开 API（给前台使用）
// ============================
app.get('/api/publications', (req, res) => {
  const pubs = mockData.publications
    .filter(p => (p.status || 'published') === 'published')
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
  mockData.publications.unshift(publication);
  logActivity('添加论文', 'publications', publication.id, req.user.username, `添加论文: ${publication.title}`);
  res.status(201).json({ id: publication.id, message: '论文添加成功' });
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
  logActivity('更新论文', 'publications', id, req.user.username, `更新论文: ${req.body.title || mockData.publications[index].title}`);
  res.json({ message: '论文更新成功' });
});

app.delete('/api/admin/publications/:id', authenticate, (req, res) => {
  const id = parseInt(req.params.id);
  const index = mockData.publications.findIndex(p => p.id === id);
  if (index === -1) return res.status(404).json({ error: '论文不存在' });
  const removed = mockData.publications.splice(index, 1)[0];
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
  logActivity('发布新闻', 'news', news.id, req.user.username, `发布新闻: ${news.title}`);
  res.status(201).json({ id: news.id, message: '新闻发布成功' });
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
  logActivity('更新新闻', 'news', id, req.user.username, `更新新闻: ${req.body.title || mockData.news[index].title}`);
  res.json({ message: '新闻更新成功' });
});

app.delete('/api/admin/news/:id', authenticate, (req, res) => {
  const id = parseInt(req.params.id);
  const index = mockData.news.findIndex(n => n.id === id);
  if (index === -1) return res.status(404).json({ error: '新闻不存在' });
  const removed = mockData.news.splice(index, 1)[0];
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
  logActivity('更新成员', 'team', id, req.user.username, `更新成员: ${req.body.name || mockData.team[index].name}`);
  res.json({ message: '成员信息更新成功' });
});

app.delete('/api/admin/team/:id', authenticate, (req, res) => {
  const id = parseInt(req.params.id);
  const index = mockData.team.findIndex(t => t.id === id);
  if (index === -1) return res.status(404).json({ error: '成员不存在' });
  const removed = mockData.team.splice(index, 1)[0];
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
  if (type) files = files.filter(f => (f.file_type || '').toLowerCase().includes(type));

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

app.post('/api/admin/upload', authenticate, (req, res) => {
  // 模拟上传成功
  const mockFile = {
    id: mockData.files.length + 1,
    filename: `mock_file_${Date.now()}.jpg`,
    original_name: 'uploaded_file.jpg',
    file_url: '/images/HTR-PM.jpg',
    file_type: 'image/jpeg',
    file_size: 1024 * 100,
    uploaded_by: req.user.username,
    created_at: new Date().toISOString()
  };
  mockData.files.push(mockFile);
  res.json({ url: mockFile.file_url, message: '文件上传成功' });
});

app.delete('/api/admin/files/:id', authenticate, (req, res) => {
  const id = parseInt(req.params.id);
  const index = mockData.files.findIndex(f => f.id === id);
  if (index === -1) return res.status(404).json({ error: '文件不存在' });
  mockData.files.splice(index, 1);
  res.json({ message: '文件删除成功' });
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
