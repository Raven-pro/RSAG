// 本地测试服务器
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = 3000;
const SECRET_KEY = 'rsag2025-secret-key';

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// 模拟用户数据
const users = [
    { id: 1, username: 'admin', password: 'rsag2025!', role: 'admin' },
    { id: 2, username: 'editor', password: 'rsag_edit2025', role: 'editor' }
];

// 模拟数据
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
            title: 'Research on transient thermal-hydraulic characteristics of RINS circuit based on small break LOCA',
            authors: 'Tianyuan Li; Jingang Liang*; Ben Qi; Jun Sun; Bin Wang',
            journal: 'Nuclear Engineering and Design',
            year: 2024,
            month: '12',
            doi: '10.1016/j.nucengdes.2024.113768',
            url: 'https://doi.org/10.1016/j.nucengdes.2024.113768',
            type: 'SCI',
            status: 'published',
            created_at: new Date().toISOString()
        }
    ],
    news: [
        {
            id: 1,
            title: '新疆大学可靠性工程研究团队来访研究所',
            content: '2025年8月11日，新疆大学可靠性工程研究团队一行来访我们研究所，就核电站系统可靠性评估方法进行了深入交流。',
            author: '管理员',
            published_date: '2025-08-11',
            image: '/images/news/2025-8-11-新疆可靠性/2025-8-11新疆可靠性1.jpg',
            created_at: new Date().toISOString()
        }
    ],
    team: [
        {
            id: 1,
            name: '梁金刚',
            position: '研究员/博导',
            education: '博士',
            research: '核安全分析、系统可靠性',
            email: 'liangjg@xjtu.edu.cn',
            photo: '/images/梁金刚.png',
            created_at: new Date().toISOString()
        }
    ],
    activities: [
        {
            id: 1,
            type: '登录',
            description: '管理员登录系统',
            user: 'admin',
            timestamp: new Date().toISOString()
        }
    ]
};

// 记录活动
function logActivity(type, description, user) {
    const activity = {
        id: mockData.activities.length + 1,
        type,
        description,
        user,
        timestamp: new Date().toISOString()
    };
    mockData.activities.unshift(activity);
}

// JWT认证中间件
function authenticate(req, res, next) {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({ error: '需要认证' });
    }
    
    try {
        const decoded = jwt.verify(token, SECRET_KEY);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ error: '无效的token' });
    }
}

// 登录
app.post('/api/admin/login', (req, res) => {
    const { username, password } = req.body;
    
    const user = users.find(u => u.username === username && u.password === password);
    
    if (!user) {
        return res.status(401).json({ error: '用户名或密码错误' });
    }
    
    const token = jwt.sign(
        { id: user.id, username: user.username, role: user.role },
        SECRET_KEY,
        { expiresIn: '24h' }
    );
    
    logActivity('登录', `用户 ${username} 登录系统`, username);
    
    res.json({
        token,
        user: {
            username: user.username,
            role: user.role
        }
    });
});

// 统计数据
app.get('/api/admin/stats', authenticate, (req, res) => {
    res.json({
        publications: mockData.publications.length,
        news: mockData.news.length,
        team: mockData.team.length,
        activities: mockData.activities.length
    });
});

// 最近活动
app.get('/api/admin/activities', authenticate, (req, res) => {
    const limit = parseInt(req.query.limit || '10');
    res.json({ activities: mockData.activities.slice(0, limit) });
});

// 论文管理API
app.get('/api/admin/publications', authenticate, (req, res) => {
    res.json({ publications: mockData.publications });
});

// 获取单个论文
app.get('/api/admin/publications/:id', authenticate, (req, res) => {
    const id = parseInt(req.params.id);
    const publication = mockData.publications.find(p => p.id === id);
    
    if (!publication) {
        return res.status(404).json({ error: '论文未找到' });
    }
    
    res.json(publication);
});

app.post('/api/admin/publications', authenticate, (req, res) => {
    const publication = {
        id: mockData.publications.length + 1,
        ...req.body,
        created_at: new Date().toISOString()
    };
    
    mockData.publications.push(publication);
    logActivity('添加论文', `添加了论文: ${publication.title}`, req.user.username);
    
    res.status(201).json({ message: '论文添加成功', publication });
});

app.put('/api/admin/publications/:id', authenticate, (req, res) => {
    const id = parseInt(req.params.id);
    const index = mockData.publications.findIndex(p => p.id === id);
    
    if (index === -1) {
        return res.status(404).json({ error: '论文未找到' });
    }
    
    mockData.publications[index] = {
        ...mockData.publications[index],
        ...req.body,
        updated_at: new Date().toISOString()
    };
    
    logActivity('更新论文', `更新了论文: ${mockData.publications[index].title}`, req.user.username);
    
    res.json({ message: '论文更新成功', publication: mockData.publications[index] });
});

// 新闻管理API
app.get('/api/admin/news', authenticate, (req, res) => {
    res.json({ news: mockData.news });
});

// 获取单个新闻
app.get('/api/admin/news/:id', authenticate, (req, res) => {
    const id = parseInt(req.params.id);
    const news = mockData.news.find(n => n.id === id);
    
    if (!news) {
        return res.status(404).json({ error: '新闻未找到' });
    }
    
    res.json(news);
});

app.post('/api/admin/news', authenticate, (req, res) => {
    const news = {
        id: mockData.news.length + 1,
        ...req.body,
        created_at: new Date().toISOString()
    };
    
    mockData.news.push(news);
    logActivity('添加新闻', `添加了新闻: ${news.title}`, req.user.username);
    
    res.status(201).json({ message: '新闻添加成功', news });
});

app.put('/api/admin/news/:id', authenticate, (req, res) => {
    const id = parseInt(req.params.id);
    const index = mockData.news.findIndex(n => n.id === id);
    
    if (index === -1) {
        return res.status(404).json({ error: '新闻未找到' });
    }
    
    mockData.news[index] = {
        ...mockData.news[index],
        ...req.body,
        updated_at: new Date().toISOString()
    };
    
    logActivity('更新新闻', `更新了新闻: ${mockData.news[index].title}`, req.user.username);
    
    res.json({ message: '新闻更新成功', news: mockData.news[index] });
});

// 团队管理API
app.get('/api/admin/team', authenticate, (req, res) => {
    res.json({ team: mockData.team });
});

// 获取单个团队成员
app.get('/api/admin/team/:id', authenticate, (req, res) => {
    const id = parseInt(req.params.id);
    const member = mockData.team.find(t => t.id === id);
    
    if (!member) {
        return res.status(404).json({ error: '成员不存在' });
    }
    
    res.json(member);
});

app.post('/api/admin/team', authenticate, (req, res) => {
    const member = {
        id: mockData.team.length + 1,
        ...req.body,
        created_at: new Date().toISOString()
    };
    
    mockData.team.push(member);
    logActivity('添加成员', `添加了团队成员: ${member.name}`, req.user.username);
    
    res.status(201).json({ message: '成员添加成功', member });
});

app.put('/api/admin/team/:id', authenticate, (req, res) => {
    const id = parseInt(req.params.id);
    const index = mockData.team.findIndex(t => t.id === id);
    
    if (index === -1) {
        return res.status(404).json({ error: '成员不存在' });
    }
    
    mockData.team[index] = {
        ...mockData.team[index],
        ...req.body,
        updated_at: new Date().toISOString()
    };
    
    logActivity('更新成员', `更新了团队成员: ${mockData.team[index].name}`, req.user.username);
    
    res.json({ message: '成员更新成功', member: mockData.team[index] });
});

// 启动服务器
app.listen(PORT, () => {
    console.log('🚀 本地测试服务器启动成功！');
    console.log(`📱 管理后台访问地址: http://localhost:${PORT}/admin/login.html`);
    console.log(`🌐 前端网站访问地址: http://localhost:${PORT}/index.html`);
    console.log('👤 管理员账号: admin / rsag2025!');
    console.log('✏️ 编辑员账号: editor / rsag_edit2025');
});
