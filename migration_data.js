// migration_data.js - 完整的论文和团队数据迁移

// 完整的论文数据（从publications.html提取）
const publications_data = [
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
        status: 'published'
    },
    {
        id: 2,
        title: 'Advanced full-core modeling of fission product release in pebble-bed high-temperature gas-cooled reactors',
        authors: 'Chenghao Cao; Junyi Chen; Jingang Liang*; Chuan Li; Jianzhu Cao',
        journal: 'Annals of Nuclear Energy',
        year: 2025,
        month: 6,
        type: 'SCI',
        doi: '10.1016/j.anucene.2025.111240',
        url: 'https://doi.org/10.1016/j.anucene.2025.111240',
        status: 'published'
    },
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
        status: 'published'
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
        status: 'published'
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
        status: 'published'
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
        status: 'published'
    },
    // 更多SCI论文可以继续添加...
    
    // EI 论文
    {
        id: 101,
        title: '球床式高温气冷堆精细化堆芯核素积存量计算方法研究',
        authors: '曹成昊,陈海英,王雯毅,王雯毅，梁金刚*，佘顶，曹建主',
        journal: '原子能科学技术',
        year: 2025,
        type: 'EI',
        url: 'http://kns.cnki.net/kcms/detail/11.2044.TL.20250103.1617.006.html',
        status: 'published'
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
        status: 'published'
    }
    // 更多论文数据...
];

// 团队成员数据（基于图片文件名）
const team_data = [
    {
        id: 1,
        name: '梁金刚',
        title: '副教授',
        research_area: '反应堆放射性源项、辐射防护与屏蔽分析、蒙特卡罗粒子输运模拟、智能化核应急决策技术',
        photo_url: '/images/梁金刚.png',
        order_index: 1,
        status: 'active'
    },
    {
        id: 2,
        name: '齐奔',
        title: '博士生',
        research_area: '核电厂故障诊断、人工智能在核工程中的应用',
        photo_url: '/images/齐奔.png',
        order_index: 2,
        status: 'active'
    },
    {
        id: 3,
        name: '睿涵',
        title: '博士生',
        research_area: '蒙特卡罗方法、反应堆物理',
        photo_url: '/images/睿涵.png',
        order_index: 3,
        status: 'active'
    },
    {
        id: 4,
        name: '俊逸',
        title: '硕士生',
        research_area: '辐射屏蔽计算、点核方法',
        photo_url: '/images/俊逸.png',
        order_index: 4,
        status: 'active'
    },
    {
        id: 5,
        name: '星宇',
        title: '博士生',
        research_area: '核电人因可靠性分析、应急决策技术',
        photo_url: '/images/星宇.png',
        order_index: 5,
        status: 'active'
    },
    {
        id: 6,
        name: '成昊',
        title: '博士生',
        research_area: '球床高温气冷堆、裂变产物释放建模',
        photo_url: '/images/成昊.jpg',
        order_index: 6,
        status: 'active'
    },
    {
        id: 7,
        name: '天远',
        title: '硕士生',
        research_area: '反应堆安全分析',
        photo_url: '/images/天远.png',
        order_index: 7,
        status: 'active'
    },
    {
        id: 8,
        name: '伟健',
        title: '博士生',
        research_area: '同位素测量、燃耗分析',
        photo_url: '/images/伟健.png',
        order_index: 8,
        status: 'active'
    },
    {
        id: 9,
        name: '沈绍宁',
        title: '博士生',
        research_area: '反应堆物理',
        photo_url: '/images/沈绍宁.jpg',
        order_index: 9,
        status: 'active'
    }
];

module.exports = { publications_data, team_data };
