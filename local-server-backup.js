// 本地测试服务器
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs        {
            id: 7,
            title: 'MC/Sub-Channel Coupling for Steady State and Transient Simulation of Xi\'an Pulsed Reactor',
            authors: 'Ruihan Li, Lipeng Wang*, Jingang Liang, Xinyi Zhang, Lixin Chen',
            journal: 'Annals of Nuclear Energy',
            year: 2025,
            month: '01',
            doi: '10.1016/j.anucene.2024.110882',
            url: 'https://doi.org/10.1016/j.anucene.2024.110882',
            type: 'SCI',
            status: 'published',
            created_at: new Date().toISOString()
        },s');

const app = express();
const PORT = 3000;

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// 模拟数据存储（生产环境中这些数据会存储在Cloudflare D1中）
let mockData = {
    users: [
        { id: 1, username: 'admin', password: 'rsag2025!', role: 'admin' },
        { id: 2, username: 'editor', password: 'rsag_edit2025', role: 'editor' }
    ],
    publications: [
        // SCI 论文
        {
            id: 1,
            title: 'A transient detection framework in nuclear power plants using zero-shot learning based on digital twins',
            authors: 'Ben Qi; Jun Sun; Zhe Sui; Xingyu Xiao; Jingang Liang*',
            journal: 'Progress in Nuclear Energy',
            year: 2025,
            month: 7,
            type: 'SCI',
            doi: '10.1016/j.pnucene.2025.105848',
            url: 'https://doi.org/10.1016/j.pnucene.2025.105848',
            status: 'published',
            created_at: new Date().toISOString()
        },
        publications: [
        // SCI期刊论文
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
            title: 'POKER: A new point kernel 3D radiation field characterization code with stratified and deep shielding capabilities',
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
            title: 'Enhancing accuracy and efficiency of RMC/SUBCHAN neutronics and thermal-hydraulics coupling system for BEAVRS simulation',
            authors: 'Hao Luo; Kaiwen Li; Jie Li; Zhaoyuan Liu; Jingang Liang*; Jiyang Yu; Shanfang Huang; Kan Wang',
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
            title: 'A Dynamic Risk-Informed Framework for Emergency Human Error Prevention in High-Risk Industries: A Nuclear Power Plant Case Study',
            authors: 'Xingyu Xiao, Ben Qi, Shunshun Liu, Peng Chen, Jingang Liang*, Jiejuan Tong, Haitao Wang',
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
            title: 'High-Fidelity Neutronics/Thermal Hydraulics/Pebble Flow Coupling Simulation of Pebble Bed Reactor HTR-PM',
            authors: 'Ruihan Li; Junyi Chen; Aixin Zhu; Jingang Liang*; Ding She; Hongjian Zhang',
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
            title: 'MC/Sub-Channel Coupling for Steady State and Transient Simulation of Xi'an Pulsed Reactor',
            authors: 'Ruihan Li, Lipeng Wang*, Jingang Liang, Xinyi Zhang, Lixin Chen',
            journal: 'Annals of Nuclear Energy',
            year: 2025,
            month: '01',
            doi: '10.1016/j.anucene.2024.110882',
            url: 'https://doi.org/10.1016/j.anucene.2024.110882',
            type: 'SCI',
            status: 'published',
            created_at: new Date().toISOString()
        },
        {
            id: 8,
            title: 'Adaptive Modeling Pulsed Neutron Burst Shape for Acquiring Net Inelastic Gamma Spectra',
            authors: 'Yi Ge, Jingang Liang, Qiong Zhang*',
            journal: 'IEEE Transactions on Nuclear Science',
            year: 2024,
            month: '11',
            doi: '10.1109/TNS.2024.3479291',
            url: 'https://doi.org/10.1109/TNS.2024.3479291',
            type: 'SCI',
            status: 'published',
            created_at: new Date().toISOString()
        },
        {
            id: 9,
            title: 'Monte Carlo Transport Correction for Graphite-moderated Nuclear Reactors Using the Cumulative Migration Method',
            authors: 'Zhaoyuan Liu, Jingang Liang*, Han Zhang, Wenbin Wu, Haihong Zhang, Zhenyu Wang, Tao Liu',
            journal: 'Annals of Nuclear Energy',
            year: 2024,
            month: '12',
            doi: '10.1016/j.anucene.2024.110813',
            url: 'https://doi.org/10.1016/j.anucene.2024.110813',
            type: 'SCI',
            status: 'published',
            created_at: new Date().toISOString()
        },
        {
            id: 10,
            title: 'Multimodal Learning Using Large Language Models to Improve Transient Identification of Nuclear Power Plants',
            authors: 'Ben Qi, Jun Sun, Zhe Sui, Xingyu Xiao, Jingang Liang*',
            journal: 'Progress in Nuclear Energy',
            year: 2024,
            month: '12',
            doi: '10.1016/j.pnucene.2024.105421',
            url: 'https://doi.org/10.1016/j.pnucene.2024.105421',
            type: 'SCI',
            status: 'published',
            created_at: new Date().toISOString()
        },
        // EI期刊论文
        {
            id: 101,
            title: '球床式高温气冷堆精细化堆芯核素积存量计算方法研究',
            authors: '曹成昊,陈海英,王雯毅,王雯毅，梁金刚*，佘顶，曹建主',
            journal: '原子能科学技术',
            year: 2025,
            month: '01',
            doi: '',
            url: 'http://kns.cnki.net/kcms/detail/11.2044.TL.20250103.1617.006.html',
            type: 'EI',
            status: 'published',
            created_at: new Date().toISOString()
        },
        {
            id: 102,
            title: 'Development of an Integrated Point Kernel Shielding Calculation Code for Fast Three-Dimensional Radiation Field Characterization',
            authors: 'Junyi Chen, Ruihan Li, Jingang Liang*',
            journal: 'Proceedings of the 2024 31st International Conference on Nuclear Engineering',
            year: 2024,
            month: '08',
            doi: '',
            url: '',
            type: 'Conference',
            status: 'published',
            created_at: new Date().toISOString()
        },
        {
            id: 103,
            title: 'Research on Accident Diagnosis Method in Nuclear Power Plants Based on Generative Adversarial Networks and Underlying Deep Learning Networks',
            authors: 'Ben Qi, Yu Wang, Xingyu Xiao, Jingang Liang*',
            journal: 'Proceedings of the 2024 31st International Conference on Nuclear Engineering',
            year: 2024,
            month: '08',
            doi: '',
            url: '',
            type: 'Conference',
            status: 'published',
            created_at: new Date().toISOString()
        },
        {
            id: 104,
            title: 'High-Fidelity Depletion-Pebble-Flow Coupling Simulation of Pebble Bed Reactor HTR-PM',
            authors: 'Ruihan Li, Jingang Liang*, Ding She, Weijian Zhang',
            journal: 'Proceedings of the 2024 31st International Conference on Nuclear Engineering',
            year: 2024,
            month: '08',
            doi: '',
            url: '',
            type: 'Conference',
            status: 'published',
            created_at: new Date().toISOString()
        },
        {
            id: 105,
            title: '基于弥散颗粒燃料的先进核反应堆大规模并行模拟与优化',
            authors: '李睿涵, 侯叶凡, 李玉辉, 刘召远, 张海红, 梁金刚*',
            journal: '计算机研究与发展',
            year: 2024,
            month: '04',
            doi: '10.7544/issn1000-1239.202221032',
            url: 'https://doi.org/10.7544/issn1000-1239.202221032',
            type: 'EI',
            status: 'published',
            created_at: new Date().toISOString()
        }
    ],,
        {
            id: 3,
            title: 'POKER: A new point kernel 3D radiation field characterization code with stratified and deep shielding capabilities',
            authors: 'Junyi Chen; Ruihan Li; Yujia Chen; Chenghao Cao; Jingang Liang*',
            journal: 'Nuclear Engineering and Technology',
            year: 2025,
            month: 6,
            type: 'SCI',
            doi: '10.1016/j.net.2024.103410',
            url: 'https://doi.org/10.1016/j.net.2024.103410',
            status: 'published',
            created_at: new Date().toISOString()
        },
        {
            id: 4,
            title: 'Enhancing accuracy and efficiency of RMC/SUBCHAN neutronics and thermal-hydraulics coupling system for BEAVRS simulation',
            authors: 'Hao Luo; Kaiwen Li; Jie Li; Zhaoyuan Liu; Jingang Liang*; Jiyang Yu; Shanfang Huang; Kan Wang',
            journal: 'Progress in Nuclear Energy',
            year: 2025,
            month: 5,
            type: 'SCI',
            doi: '10.1016/j.pnucene.2025.105666',
            url: 'https://doi.org/10.1016/j.pnucene.2025.105666',
            status: 'published',
            created_at: new Date().toISOString()
        },
        {
            id: 5,
            title: 'A Dynamic Risk-Informed Framework for Emergency Human Error Prevention in High-Risk Industries: A Nuclear Power Plant Case Study',
            authors: 'Xingyu Xiao, Ben Qi, Shunshun Liu, Peng Chen, Jingang Liang*, Jiejuan Tong, Haitao Wang',
            journal: 'Reliability Engineering and System Safety',
            year: 2025,
            month: 4,
            type: 'SCI',
            doi: '10.1016/j.ress.2025.111080',
            url: 'https://doi.org/10.1016/j.ress.2025.111080',
            status: 'published',
            created_at: new Date().toISOString()
        },
        {
            id: 6,
            title: 'High-Fidelity Neutronics/Thermal Hydraulics/Pebble Flow Coupling Simulation of Pebble Bed Reactor HTR-PM',
            authors: 'Ruihan Li; Junyi Chen; Aixin Zhu; Jingang Liang*; Ding She; Hongjian Zhang',
            journal: 'Nuclear Science and Engineering',
            year: 2025,
            month: 3,
            type: 'SCI',
            doi: '10.1080/00295639.2025.2471712',
            url: 'https://doi.org/10.1080/00295639.2025.2471712',
            status: 'published',
            created_at: new Date().toISOString()
        },
        // EI 论文示例
        {
            id: 101,
            title: '球床式高温气冷堆精细化堆芯核素积存量计算方法研究',
            authors: '曹成昊,陈海英,王雯毅,王雯毅，梁金刚*，佘顶，曹建主',
            journal: '原子能科学技术',
            year: 2025,
            type: 'EI',
            url: 'http://kns.cnki.net/kcms/detail/11.2044.TL.20250103.1617.006.html',
            status: 'published',
            created_at: new Date().toISOString()
        },
        {
            id: 102,
            title: 'Development of an Integrated Point Kernel Shielding Calculation Code for Fast Three-Dimensional Radiation Field Characterization',
            authors: 'Junyi Chen, Ruihan Li, Jingang Liang*',
            journal: 'Proceedings of the 2024 31st International Conference on Nuclear Engineering',
            year: 2024,
            month: 8,
            type: 'EI',
            conference_location: 'Prague, Czech Republic',
            status: 'published',
            created_at: new Date().toISOString()
        }
    ],
    news: [
        {
            id: 1,
            title: '祝贺！萧星宇同学论文入选第六届中国"双法"研究会风险管理分会学术年会推荐名单',
            summary: '祝贺团队成员在学术评选活动中取得优异成绩',
            content: '<p>在第六届中国"双法"研究会风险管理分会学术年会暨2025年清华大学质量与可靠性研究院年会论文评选活动中，我团队成员萧星宇的研究论文经过严格的评审程序，成功入选推荐名单。</p><p>这一成果体现了我们团队在核电人因可靠性分析领域的研究实力，也为相关领域的学术交流做出了贡献。</p>',
            author: '管理员',
            publish_date: '2025-08-11',
            category: 'award',
            status: 'published',
            created_at: new Date().toISOString()
        },
        {
            id: 2,
            title: '课题组最新研究成果：先进球床高温气冷堆全堆芯裂变产物释放建模',
            summary: '在Annals of Nuclear Energy期刊发表重要研究成果',
            content: '<p>课题组在球床高温气冷堆裂变产物释放建模方面取得重要进展，相关成果已发表在《Annals of Nuclear Energy》期刊上。</p><p>该研究建立了先进的全堆芯裂变产物释放模型，为球床高温气冷堆的安全分析提供了重要的理论基础。</p>',
            author: '管理员', 
            publish_date: '2025-07-15',
            category: 'research',
            status: 'published',
            created_at: new Date().toISOString()
        },
        {
            id: 3,
            title: 'HTR-PM示范工程多物理场耦合仿真研究取得突破',
            summary: '在Nuclear Science and Engineering期刊发表高保真仿真研究',
            content: '<p>课题组在HTR-PM示范工程的多物理场耦合仿真方面取得重要进展，相关研究成果发表在《Nuclear Science and Engineering》期刊。</p><p>该研究建立了高保真的中子学/热工水力学/球流三场耦合模型，为球床反应堆的设计和安全分析提供了重要支撑。</p>',
            author: '管理员',
            publish_date: '2025-05-10',
            category: 'research', 
            status: 'published',
            created_at: new Date().toISOString()
        },
        {
            id: 4,
            title: '课题组参加国际反应堆物理会议并作主题报告',
            summary: '在国际会议上展示研究成果，获得同行认可',
            content: '<p>课题组成员参加了国际反应堆物理会议，并在会议上作了关于球床高温气冷堆安全分析的主题报告。</p><p>报告得到了国际同行的广泛关注和积极评价，展示了我们在该领域的研究实力。</p>',
            author: '管理员',
            publish_date: '2025-04-25',
            category: 'conference',
            status: 'published', 
            created_at: new Date().toISOString()
        },
        {
            id: 5,
            title: '欢迎新成员加入RSAG课题组',
            summary: '新研究生同学加入课题组',
            content: '<p>我们很高兴地宣布，新的研究生同学正式加入RSAG课题组，开始在反应堆安全与分析领域的研究工作。</p><p>欢迎新同学的加入，期待在未来的研究中取得更多突破性成果。</p>',
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
        }
    ],
    files: [],
    activities: []
};

// 生成简单的JWT token（仅用于测试）
function generateToken(user) {
    const header = { alg: 'none', typ: 'JWT' };
    const payload = {
        username: user.username,
        role: user.role,
        exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24小时
    };
    
    // 创建伪JWT格式（header.payload.signature）
    const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64');
    const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64');
    return `${encodedHeader}.${encodedPayload}.signature`;
}

// 验证token
function verifyToken(token) {
    try {
        // 解析伪JWT格式
        const parts = token.split('.');
        if (parts.length !== 3) {
            throw new Error('Invalid token format');
        }
        
        const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
        if (payload.exp < Date.now() / 1000) {
            throw new Error('Token expired');
        }
        return payload;
    } catch (error) {
        throw new Error('Invalid token');
    }
}

// 认证中间件
function authenticate(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: '未提供认证令牌' });
    }
    
    const token = authHeader.substring(7);
    try {
        req.user = verifyToken(token);
        next();
    } catch (error) {
        return res.status(401).json({ error: '认证失败' });
    }
}

// 记录活动
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
    // 只保留最近50条记录
    if (mockData.activities.length > 50) {
        mockData.activities = mockData.activities.slice(0, 50);
    }
}

// API路由

// =============================================================================
// 公开API端点（不需要认证）
// =============================================================================

// 获取公开的论文列表
app.get('/api/publications', (req, res) => {
    const publishedPublications = mockData.publications.filter(pub => pub.status === 'published');
    res.json({
        publications: publishedPublications
    });
});

// 获取公开的新闻列表
app.get('/api/news', (req, res) => {
    const publishedNews = mockData.news
        .filter(news => news.status === 'published')
        .sort((a, b) => new Date(b.publish_date) - new Date(a.publish_date)); // 按日期倒序
    res.json({
        news: publishedNews
    });
});

// 获取公开的团队成员列表
app.get('/api/team', (req, res) => {
    const activeTeam = mockData.team
        .filter(member => member.status === 'active')
        .sort((a, b) => a.order_index - b.order_index); // 按排序顺序
    res.json({
        team: activeTeam
    });
});

// =============================================================================
// 管理后台API端点（需要认证）
// =============================================================================

// 登录
app.post('/api/admin/auth/login', (req, res) => {
    const { username, password } = req.body;
    
    const user = mockData.users.find(u => u.username === username && u.password === password);
    if (!user) {
        return res.status(401).json({ error: '用户名或密码错误' });
    }
    
    const token = generateToken(user);
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
        news: mockData.news.filter(n => n.status === 'published').length,
        team: mockData.team.filter(t => t.status === 'active').length,
        files: mockData.files.length
    });
});

// 活动日志
app.get('/api/admin/activities', authenticate, (req, res) => {
    const limit = parseInt(req.query.limit || '10');
    res.json(mockData.activities.slice(0, limit));
});

// 论文管理
app.get('/api/admin/publications', authenticate, (req, res) => {
    const page = parseInt(req.query.page || '1');
    const limit = parseInt(req.query.limit || '10');
    const search = req.query.search || '';
    
    let filtered = mockData.publications;
    if (search) {
        filtered = filtered.filter(p => 
            p.title.toLowerCase().includes(search.toLowerCase()) ||
            p.authors.toLowerCase().includes(search.toLowerCase()) ||
            p.journal.toLowerCase().includes(search.toLowerCase())
        );
    }
    
    const total = filtered.length;
    const start = (page - 1) * limit;
    const data = filtered.slice(start, start + limit);
    
    res.json({
        data,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
            currentPage: page
        }
    });
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
    
    res.status(201).json({
        id: publication.id,
        message: '论文添加成功'
    });
});

app.get('/api/admin/publications/:id', authenticate, (req, res) => {
    const id = parseInt(req.params.id);
    const publication = mockData.publications.find(p => p.id === id);
    
    if (!publication) {
        return res.status(404).json({ error: '论文不存在' });
    }
    
    res.json(publication);
});

app.put('/api/admin/publications/:id', authenticate, (req, res) => {
    const id = parseInt(req.params.id);
    const index = mockData.publications.findIndex(p => p.id === id);
    
    if (index === -1) {
        return res.status(404).json({ error: '论文不存在' });
    }
    
    mockData.publications[index] = {
        ...mockData.publications[index],
        ...req.body,
        updated_at: new Date().toISOString()
    };
    
    logActivity('更新论文', 'publications', id, req.user.username, `更新论文: ${req.body.title}`);
    
    res.json({ message: '论文更新成功' });
});

app.delete('/api/admin/publications/:id', authenticate, (req, res) => {
    const id = parseInt(req.params.id);
    const index = mockData.publications.findIndex(p => p.id === id);
    
    if (index === -1) {
        return res.status(404).json({ error: '论文不存在' });
    }
    
    const publication = mockData.publications[index];
    mockData.publications.splice(index, 1);
    
    logActivity('删除论文', 'publications', id, req.user.username, `删除论文: ${publication.title}`);
    
    res.json({ message: '论文删除成功' });
});

// 新闻管理（类似论文管理的结构）
app.get('/api/admin/news', authenticate, (req, res) => {
    const page = parseInt(req.query.page || '1');
    const limit = parseInt(req.query.limit || '10');
    const search = req.query.search || '';
    
    let filtered = mockData.news;
    if (search) {
        filtered = filtered.filter(n => 
            n.title.toLowerCase().includes(search.toLowerCase()) ||
            n.content.toLowerCase().includes(search.toLowerCase())
        );
    }
    
    const total = filtered.length;
    const start = (page - 1) * limit;
    const data = filtered.slice(start, start + limit);
    
    res.json({
        data,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
            currentPage: page
        }
    });
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
    
    res.status(201).json({
        id: news.id,
        message: '新闻发布成功'
    });
});

app.get('/api/admin/news/:id', authenticate, (req, res) => {
    const id = parseInt(req.params.id);
    const news = mockData.news.find(n => n.id === id);
    
    if (!news) {
        return res.status(404).json({ error: '新闻不存在' });
    }
    
    res.json(news);
});

app.put('/api/admin/news/:id', authenticate, (req, res) => {
    const id = parseInt(req.params.id);
    const index = mockData.news.findIndex(n => n.id === id);
    
    if (index === -1) {
        return res.status(404).json({ error: '新闻不存在' });
    }
    
    mockData.news[index] = {
        ...mockData.news[index],
        ...req.body,
        updated_at: new Date().toISOString()
    };
    
    logActivity('更新新闻', 'news', id, req.user.username, `更新新闻: ${req.body.title}`);
    
    res.json({ message: '新闻更新成功' });
});

app.delete('/api/admin/news/:id', authenticate, (req, res) => {
    const id = parseInt(req.params.id);
    const index = mockData.news.findIndex(n => n.id === id);
    
    if (index === -1) {
        return res.status(404).json({ error: '新闻不存在' });
    }
    
    const news = mockData.news[index];
    mockData.news.splice(index, 1);
    
    logActivity('删除新闻', 'news', id, req.user.username, `删除新闻: ${news.title}`);
    
    res.json({ message: '新闻删除成功' });
});

// 团队管理
app.get('/api/admin/team', authenticate, (req, res) => {
    const search = req.query.search || '';
    
    let filtered = mockData.team;
    if (search) {
        filtered = filtered.filter(t => 
            t.name.toLowerCase().includes(search.toLowerCase()) ||
            t.title.toLowerCase().includes(search.toLowerCase())
        );
    }
    
    // 按order_index排序
    filtered.sort((a, b) => (a.order_index || 0) - (b.order_index || 0));
    
    res.json({ data: filtered });
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
    
    res.status(201).json({
        id: member.id,
        message: '成员添加成功'
    });
});

app.get('/api/admin/team/:id', authenticate, (req, res) => {
    const id = parseInt(req.params.id);
    const member = mockData.team.find(t => t.id === id);
    
    if (!member) {
        return res.status(404).json({ error: '成员不存在' });
    }
    
    res.json(member);
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
    
    logActivity('更新成员', 'team', id, req.user.username, `更新成员: ${req.body.name}`);
    
    res.json({ message: '成员信息更新成功' });
});

app.delete('/api/admin/team/:id', authenticate, (req, res) => {
    const id = parseInt(req.params.id);
    const index = mockData.team.findIndex(t => t.id === id);
    
    if (index === -1) {
        return res.status(404).json({ error: '成员不存在' });
    }
    
    const member = mockData.team[index];
    mockData.team.splice(index, 1);
    
    logActivity('删除成员', 'team', id, req.user.username, `删除成员: ${member.name}`);
    
    res.json({ message: '成员删除成功' });
});

// 文件管理（简化版本）
app.get('/api/admin/files', authenticate, (req, res) => {
    res.json({
        data: mockData.files,
        pagination: {
            page: 1,
            limit: 12,
            total: mockData.files.length,
            totalPages: 1,
            currentPage: 1
        }
    });
});

// 文件上传（模拟）
app.post('/api/admin/upload', authenticate, (req, res) => {
    // 模拟文件上传成功
    const mockFile = {
        id: mockData.files.length + 1,
        filename: `mock_file_${Date.now()}.jpg`,
        original_name: 'uploaded_file.jpg',
        file_url: '/images/mock-upload.jpg',
        file_type: 'image/jpeg',
        file_size: 1024 * 100, // 100KB
        uploaded_by: req.user.username,
        created_at: new Date().toISOString()
    };
    
    mockData.files.push(mockFile);
    
    res.json({
        url: mockFile.file_url,
        message: '文件上传成功'
    });
});

// 启动服务器
app.listen(PORT, () => {
    console.log(`🚀 本地测试服务器启动成功！`);
    console.log(`📱 管理后台访问地址: http://localhost:${PORT}/admin/login.html`);
    console.log(`🌐 前端网站访问地址: http://localhost:${PORT}/index.html`);
    console.log(`👤 管理员账号: admin / rsag2025!`);
    console.log(`✏️ 编辑员账号: editor / rsag_edit2025`);
});
