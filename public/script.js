       // --- Language Data ---
        const languageData = {
            'zh': {
                websiteTitle: "INET-RSAG - 清华大学",
                groupNameShort: "INET-RSAG",
                navHome: "首页",
                navResearch: "研究方向",
                navPublications: "发表论文",
                navTeam: "团队成员",
                navContact: "联系我们",
                navHomeMobile: "首页",
                navResearchMobile: "研究方向",
                navPublicationsMobile: "发表论文",
                navTeamMobile: "团队成员",
                navContactMobile: "联系我们",
                langToggle: "EN", // Text for the button to switch TO English
                langToggleMobile: "EN",
                homeTitle: "欢迎来到INET-RSAG",
                homeSubtitle: "隶属于清华大学核能与新能源技术研究院",
                homeDesc: "致力于通过核反应堆先进模拟分析方法研究，改进核能系统效率及安全水平。",
                newsTitle: "最近新闻",
                newsItem0Title: "欢迎沈绍宁、郭天远同学加入团队", //Welcome Shen Shaoning and Guo Tianyuan to join the team
                newsItem0Date: "2024年9月1日",
                newsItem1Title: "团队成员萧星宇做国奖经验分享",
                newsItem1Date: "2025年4月28日",
                newsItem2Title: "团队成员曹成昊在ANE发表最新研究成果",
                newsItem2Date: "2025年4月28日",
                newsItem3Title: "祝贺！团队成员齐奔和李睿涵通过博士论文答辩",
                newsItem3Date: "2025年5月9日",
                newsItem4Title: "团队成员萧星宇论文在第六届中国“双法”研究会风险管理分会学术年会暨2025年清华大学质量与可靠性研究院年会论文评选活动中入选推荐名单",
                newsItem4Date: "2025年8月11日",
                // newsItem4Title: "测试",
                // newsItem4Date: "测试日期",
                newsMoreLink:"查看所有新闻",
                homeImageAlt: "[Image of 课题组风采]",
                researchTitle: "研究方向",
                researchArea0Desc: "从事先进核反应堆安全分析与风险评价研究，致力于结合高性能计算和人工智能等技术，围绕核反应堆数值模拟、放射性核素行为与防护以及核电厂运行支持相关机理模型，建立高保真、高性能、智能化的安全和风险评价技术体系，改进核能系统效率及安全水平。具体方向包括蒙特卡罗粒子输运、放射性源项、辐射屏蔽、核反应堆多物理耦合分析、核应急决策技术、人因可靠性及核设计软件研发等。",
                researchArea1Title: "核反应堆高保真多物理耦合数值模拟",
                researchArea1Desc: "开展蒙特卡罗粒子输运基础理论算法、先进核能系统建模与模拟技术、多物理多尺度耦合模拟方法研究，构建高保真度中子物理-热工-燃料性能-结构等耦合分析框架，提升核能系统模拟精度与效率。",
                researchArea2Title: "核能系统放射性核素行为和辐射防护技术",
                researchArea2Desc: "研究核反应堆放射性核素（裂变产物和活化产物）产生、释放、迁移等行为机理机制，建立精细化分析新模型、新方法和新框架，研发一体化核电厂源项分析软件；结合高性能计算和数据驱动技术，研发三维动态辐射场快速计算方法和工具，为核设施辐射防护提供支撑。",
                researchArea3Title: "核电厂智能运行与动态风险决策技术",
                researchArea3Desc: "结合深度学习、大语言模型等新兴技术，构建融合人工智能的核电厂异常监测、诊断、预测、征兆分析等决策支持体系，创新动态人因失误风险评估方法，提升核电厂智能化运行水平，推动新一代人因可靠性分析技术发展。",
                publicationsTitle: "发表论文",
                pub1: "Advanced full-core modeling of fission product release in pebble-bed high-temperature gas-cooled reactors[J]., Chenghao Cao. <em> Annals of Nuclear Energy</em>, 2025. <a href=\"https://doi.org/10.1016/j.anucene.2025.111240\" class=\"text-tsinghua-purple hover:underline\">https://doi.org/10.1016/j.anucene.2025.111240</a>",
                pub2: "High-Fidelity Neutronics/Thermal Hydraulics/Pebble Flow Coupling Simulation of Pebble Bed Reactor HTR-PM, Ruihan Li. <em>Nuclear Science and Engineering</em>, 2025. <a href=\"https://doi.org/10.1080/00295639.2025.2471712\" class=\"text-tsinghua-purple hover:underline\">https://doi.org/10.1080/00295639.2025.2471712</a>",
                publicationsLink: "查看所有发表论文 &rarr;",
                teamTitle: "团队成员",
                teamMember1Alt: "[Image of 负责人照片]",
                teamMember1Name: "梁金刚",
                teamMember1Title: "副教授",
                teamMember1Area: "反应堆放射性源项、辐射防护与屏蔽分析、蒙特卡罗粒子输运模拟、智能化核应急决策技术",
                teamMember2Alt: "[Image of 成员照片]",
                teamMember2Name: "齐奔",
                teamMember2Title: "博士/硕士",
                teamMember2Area: "核能系统智能化监测、诊断与预测",
                teamMember3Alt: "[Image of 成员照片]",
                teamMember3Name: "李睿涵",
                teamMember3Title: "博士",
                teamMember3Area: "高温气冷堆高保真多物理耦合研究",
                teamMember4Alt: "[Image of 成员照片]",
                teamMember4Name: "张伟健",
                teamMember4Title: "硕士",
                teamMember4Area: "基于γ谱法的高温气冷堆辐照燃料源项实验基准设计",
                teamMember5Alt: "[Image of 成员照片]",
                teamMember5Name: "陈俊逸",
                teamMember5Title: "博士生",
                teamMember5Area: "辐射屏蔽先进计算方法、GPU并行开发研究",
                teamMember6Alt: "[Image of 成员照片]",
                teamMember6Name: "萧星宇",
                teamMember6Title: "博士生",
                teamMember6Area: "先进核电系统人因可靠性建模与智能评估",
                teamMember7Alt: "[Image of 成员照片]",
                teamMember7Name: "曹成昊",
                teamMember7Title: "硕士生",
                teamMember7Area: "高温气冷堆放射性源项分析",
                teamMember8Alt: "[Image of 成员照片]",
                teamMember8Name: "郭天远",
                teamMember8Title: "硕士生",
                teamMember8Area: "高温气冷堆事故工况下裂变产物迁移行为及厂房滞留效应研究",
                teamMember9Alt: "[Image of 成员照片]",
                teamMember9Name: "沈绍宁",
                teamMember9Title: "博士生/科研助理",
                teamMember9Area: "中子输运",
                contactTitle: "联系我们",
                contactAddrLabel: "地址：",
                contactAddrValue: "北京市海淀区清华大学能科楼D座",
                contactZipLabel: "邮编：",
                contactZipValue: "100084",
                contactEmailLabel: "邮箱：",
                contactEmailValue: "jingang@tsinghua.edu.cn", // Keep email same
                contactWelcomeMsg: "欢迎对我们研究感兴趣的潜在学生、博士后研究员和访问学者与我们联系。",
                footerRights: "&copy; 2025 INET-RSAG, 清华大学. 保留所有权利。",
                footerCredits: "First designed by Ben Qi",                
                // Chat Widget specific
                chatTitle: "智能助手",
                chatWelcome: "你好！有什么可以帮您了解我们课题组的吗？",
                chatPlaceholder: "在此输入您的问题...",
                chatSendButtonTitle: "发送",
                chatButtonTitle: "咨询课题组信息",
                chatLoading: "思考中...",
                chatError: "抱歉，暂时无法连接到助手服务，请稍后再试。"
            },
            'en': {
                websiteTitle: "INET-RSAG - Tsinghua University",
                groupNameShort: "INET-RSAG",
                navHome: "Home",
                navResearch: "Research",
                navPublications: "Publications",
                navTeam: "Team",
                navContact: "Contact",
                navHomeMobile: "Home",
                navResearchMobile: "Research",
                navPublicationsMobile: "Publications",
                navTeamMobile: "Team",
                navContactMobile: "Contact",
                langToggle: "中文", // Text for the button to switch TO Chinese
                langToggleMobile: "中文",
                homeTitle: "Welcome to INET-RSAG",
                homeSubtitle: "Affiliated with the Institute of Nuclear and New Energy Technology, Tsinghua University",
                homeDesc: "We are dedicated to improving the efficiency and safety of nuclear energy systems through advanced simulation and analysis methods for nuclear reactors.",
                newsTitle: "Recent News",
                newsItem0Title: "Welcome Shen Shaoning and Guo Tianyuan to join the team", 
                newsItem0Date: "Sep 1, 2024",
                newsItem1Title: "Team member Xingyu Xiao makes National Award experience sharing",
                newsItem1Date: "Apr 28, 2025",
                newsItem2Title: "Team member Chenghao Cao publishes latest research results at ANE",
                newsItem2Date: "April 28, 2025",
                newsItem3Title: "Congrats! Qi Ben and Li Ruihan passed PhD defenses.",
                newsItem3Date: "May 9, 2025",
                // newsItem4Title: "test",
                // newsItem4Date: "test date",
                newsMoreLink:"More news",
                homeImageAlt: "[Image of Research Group]",
                researchTitle: "Research Directions",
                researchArea0Desc:"The research focuses on safety analysis and risk assessment for advanced nuclear reactors. It aims to integrate technologies like high-performance computing (HPC) and artificial intelligence (AI) with mechanistic models concerning nuclear reactor numerical simulation, radionuclide behavior and protection, and nuclear power plant (NPP) operational support. The goal is to establish a high-fidelity, high-performance, and intelligent technological framework for safety and risk assessment, ultimately enhancing the efficiency and safety levels of nuclear energy systems. Specific research areas include Monte Carlo particle transport, radioactive source term analysis, radiation shielding, nuclear reactor multi-physics coupling analysis, technologies for nuclear emergency decision-making, human reliability analysis (HRA), and the development of nuclear design software.",
                researchArea1Title: "High-fidelity coupled multi-physics numerical simulation for nuclear reactors",
                researchArea1Desc: "Researching fundamental theories/algorithms for Monte Carlo particle transport, advanced nuclear energy system modeling/simulation techniques, and multi-physics multi-scale coupling methods. The goal is to build a high-fidelity coupled analysis framework (neutronics, thermal-hydraulics, fuel performance, structures, etc.) to improve the accuracy and efficiency of nuclear energy system simulations.",
                researchArea2Title: "Radionuclide behavior and radiation protection technology for nuclear energy systems",
                researchArea2Desc: "Researching the mechanisms governing the behavior of radionuclides (fission products and activation products) in nuclear reactors, including their generation, release, and transport. This involves establishing new models, methods, and frameworks for refined analysis, and developing integrated source term analysis software for nuclear power plants. Additionally, by combining high-performance computing (HPC) and data-driven techniques, developing rapid calculation methods and tools for 3D dynamic radiation fields to provide support for radiation protection at nuclear facilities.",
                researchArea3Title: "Intelligent Operation and Dynamic Risk Decision-making Technology for Nuclear Power Plants",
                researchArea3Desc: "Integrating emerging technologies like deep learning (DL) and large language models (LLMs), we aim to build an AI-enhanced decision support system for nuclear power plants (NPPs) covering anomaly detection, diagnosis, prediction, and precursor analysis. This includes innovating methods for dynamic human error risk assessment, enhancing the level of intelligent operation in NPPs, and promoting the development of next-generation Human Reliability Analysis (HRA) technology.",
                publicationsTitle: "Publications",
                pub1: "Advanced full-core modeling of fission product release in pebble-bed high-temperature gas-cooled reactors[J]., Chenghao Cao. <em> Annals of Nuclear Energy</em>, 2025. <a href=\"https://doi.org/10.1016/j.anucene.2025.111240\" class=\"text-tsinghua-purple hover:underline\">https://doi.org/10.1016/j.anucene.2025.111240</a>",
                pub2: "High-Fidelity Neutronics/Thermal Hydraulics/Pebble Flow Coupling Simulation of Pebble Bed Reactor HTR-PM, Ruihan Li. <em>Nuclear Science and Engineering</em>, 2025. <a href=\"https://doi.org/10.1080/00295639.2025.2471712\" class=\"text-tsinghua-purple hover:underline\">https://doi.org/10.1080/00295639.2025.2471712</a>",
                publicationsLink: "View All Publications &rarr;",
                teamTitle: "Team Members",
                teamMember1Alt: "[Image of PI Photo]",
                teamMember1Name: "Jingang Liang",
                teamMember1Title: "Associate Professor",
                teamMember1Area: "Reactor Radioactive Source Program, Radiation Protection and Shielding Analysis, Monte Carlo Particle Transport Simulation, Intelligent Nuclear Emergency Decision Making Technology",
                teamMember2Alt: "[Image of Member Photo]",
                teamMember2Name: "Ben Qi",
                teamMember2Title: "PhD/Master",
                teamMember2Area: "Intelligent monitoring, diagnosis and prediction of nuclear energy systems",
                teamMember3Alt: "[Image of Member Photo]",
                teamMember3Name: "Ruihan Li",
                teamMember3Title: "PhD",
                teamMember3Area: "High-fidelity multi-physics coupling research of high-temperature gas-cooled reactors",
                teamMember4Alt: "[Image of Member Photo]",
                teamMember4Name: "Weijian Zhang",
                teamMember4Title: "Master",
                teamMember4Area: "Experimental benchmark design of high-temperature gas-cooled reactor irradiated fuel source term based on γ spectrometry",
                teamMember5Alt: "[Image of Member Photo]",
                teamMember5Name: "Junyi Chen",
                teamMember5Title: "PhD Candidate",
                teamMember5Area: "Research on advanced calculation methods for radiation shielding and GPU parallel development",
                teamMember6Alt: "[Image of Member Photo]",
                teamMember6Name: "Xingyu Xiao",
                teamMember6Title: "PhD Student",
                teamMember6Area: "Human factors reliability modeling and intelligent assessment of advanced nuclear power systems",
                teamMember7Alt: "[Image of Member Photo]",
                teamMember7Name: "Chenghao Cao",
                teamMember7Title: "Master Student",
                teamMember7Area: "Radioactive source term analysis of high-temperature gas-cooled reactors",
                teamMember8Alt: "[Image of Member Photo]",
                teamMember8Name: "Tianyuan Guo",
                teamMember8Title: "Master Student",
                teamMember8Area: "Research on fission product migration behavior and containment retention effect under accident conditions of high-temperature gas-cooled reactors",
                teamMember9Alt: "[Image of Member Photo]",
                teamMember9Name: "Shaoning Shen",
                teamMember9Title: "PhD Student/Research Assistant",
                teamMember9Area: "Neutron Transport",
                contactTitle: "Contact Us",
                contactAddrLabel: "Address: ",
                contactAddrValue: "Nengke Building D, Tsinghua University, Haidian District, Beijing",
                contactZipLabel: "Zip Code: ",
                contactZipValue: "100084",
                contactEmailLabel: "Email: ",
                contactEmailValue: "jingang@tsinghua.edu.cn", // Keep email same
                contactWelcomeMsg: "We welcome inquiries from prospective students, postdoctoral researchers, and visiting scholars interested in our research.",
                footerRights: "&copy; 2025 INET-RSAG, Tsinghua University. All rights reserved.",
                footerCredits: "First designed by Ben Qi",
                // Chat Widget specific
                chatTitle: "AI Assistant",
                chatWelcome: "Hello! How can I help you learn about our research group?",
                chatPlaceholder: "Type your question here...",
                chatSendButtonTitle: "Send",
                chatButtonTitle: "Ask about the research group",
                chatLoading: "Thinking...",
                chatError: "Sorry, I cannot connect to the assistant service right now. Please try again later."
            }
        };

        let currentLanguage = 'zh'; // Default language

        // --- Function to set language ---
        function setLanguage(lang) {
            if (!languageData[lang]) return; // Exit if language not found

            currentLanguage = lang;
            document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en'; // Update html lang attribute

            const elements = document.querySelectorAll('[data-lang-key]');
            elements.forEach(el => {
                const key = el.getAttribute('data-lang-key');
                if (languageData[lang][key] !== undefined) { // Check if key exists
                    if (key === 'teamMember1Name') {
                        // 特殊处理 teamMember6Name，添加链接
                        const homepageUrl = 'https://www.inet.tsinghua.edu.cn/ineten/info/1143/1647.htm';
                        const link = document.createElement('a');
                        link.href = homepageUrl;
                        link.target = '_blank';
                        link.rel = 'noopener noreferrer';
                        link.className = 'text-gray-800 hover:underline';
                        link.textContent = languageData[lang][key];
        
                        // 清空 <h3> 标签的内容
                        el.innerHTML = '';
                        // 将 <a> 标签添加到 <h3> 标签中
                        el.appendChild(link);
                      } 
                      else if (key === 'teamMember2Name') {
                        // 特殊处理 teamMember6Name，添加链接
                        const homepageUrl = 'https://www.researchgate.net/profile/Ben-Qi?ev=hdr_xprf';
                        const link = document.createElement('a');
                        link.href = homepageUrl;
                        link.target = '_blank';
                        link.rel = 'noopener noreferrer';
                        link.className = 'text-gray-800 hover:underline';
                        link.textContent = languageData[lang][key];
        
                        // 清空 <h3> 标签的内容
                        el.innerHTML = '';
                        // 将 <a> 标签添加到 <h3> 标签中
                        el.appendChild(link);
                      } 
                      else if (key === 'teamMember4Name') {
                        // 特殊处理 teamMember6Name，添加链接
                        const homepageUrl = 'https://github.com/Albert-Zhangweijian';
                        const link = document.createElement('a');
                        link.href = homepageUrl;
                        link.target = '_blank';
                        link.rel = 'noopener noreferrer';
                        link.className = 'text-gray-800 hover:underline';
                        link.textContent = languageData[lang][key];
        
                        // 清空 <h3> 标签的内容
                        el.innerHTML = '';
                        // 将 <a> 标签添加到 <h3> 标签中
                        el.appendChild(link);
                      } 
                    else if (key === 'teamMember6Name') {
                    // 特殊处理 teamMember6Name，添加链接
                    const homepageUrl = 'https://crystalxy123.github.io/';
                    const link = document.createElement('a');
                    link.href = homepageUrl;
                    link.target = '_blank';
                    link.rel = 'noopener noreferrer';
                    link.className = 'text-gray-800 hover:underline';
                    link.textContent = languageData[lang][key];
    
                    // 清空 <h3> 标签的内容
                    el.innerHTML = '';
                    // 将 <a> 标签添加到 <h3> 标签中
                    el.appendChild(link);
                  } 

                  else if (key === 'teamMember7Name') {
                    // 特殊处理 teamMember6Name，添加链接
                    const homepageUrl = 'https://www.researchgate.net/profile/Chenghao-Cao-2?ev=prf_overview';
                    const link = document.createElement('a');
                    link.href = homepageUrl;
                    link.target = '_blank';
                    link.rel = 'noopener noreferrer';
                    link.className = 'text-gray-800 hover:underline';
                    link.textContent = languageData[lang][key];
    
                    // 清空 <h3> 标签的内容
                    el.innerHTML = '';
                    // 将 <a> 标签添加到 <h3> 标签中
                    el.appendChild(link);
                  } 
                  
                  else if (key.startsWith('pub')) {
                    el.innerHTML = languageData[lang][key];
                  } else {
                    el.textContent = languageData[lang][key];
                  }
                } else {
                  console.warn(`Missing translation key: ${key} for language: ${lang}`);
                }
              });


            // Update elements with placeholder text
            const placeholders = document.querySelectorAll('[data-lang-placeholder]');
            placeholders.forEach(el => {
                const key = el.getAttribute('data-lang-placeholder');
                 if (languageData[lang][key] !== undefined) {
                    el.placeholder = languageData[lang][key];
                } else {
                     console.warn(`Missing placeholder translation key: ${key} for language: ${lang}`);
                 }
            });

             // Update elements with title text
            const titles = document.querySelectorAll('[data-lang-title]');
            titles.forEach(el => {
                const key = el.getAttribute('data-lang-title');
                 if (languageData[lang][key] !== undefined) {
                    el.title = languageData[lang][key];
                } else {
                     console.warn(`Missing title translation key: ${key} for language: ${lang}`);
                 }
            });

             // Update elements with alt text
            const alts = document.querySelectorAll('[data-lang-alt]');
            alts.forEach(el => {
                const key = el.getAttribute('data-lang-alt');
                 if (languageData[lang][key] !== undefined) {
                    el.alt = languageData[lang][key];
                } else {
                     console.warn(`Missing alt translation key: ${key} for language: ${lang}`);
                 }
            });


            // Update language toggle button text
            const langToggleBtn = document.getElementById('lang-toggle');
            const langToggleMobileBtn = document.getElementById('lang-toggle-mobile');
            if (langToggleBtn) langToggleBtn.textContent = languageData[lang]['langToggle'];
            if (langToggleMobileBtn) langToggleMobileBtn.textContent = languageData[lang]['langToggleMobile'];


            // Update chat welcome message if chat body is empty or only has the welcome message
            const chatBody = document.getElementById('chat-body');
            const chatBodyContent = chatBody.querySelectorAll('.chat-message');
             if (chatBodyContent.length <= 1) { // Clear previous welcome if exists
                chatBody.innerHTML = ''; // Clear chat body
                if (languageData[lang]['chatWelcome']) {
                    appendMessage(languageData[lang]['chatWelcome'], 'bot'); // Add new welcome message
                }
             }

            // Store language preference (optional)
            localStorage.setItem('preferredLanguage', lang);
            window.dispatchEvent(new CustomEvent('rsag-language-change', { detail: { lang } }));
        }

        // --- Language Toggle Button Handler ---
        function handleLanguageToggle() {
            const newLang = currentLanguage === 'zh' ? 'en' : 'zh';
            setLanguage(newLang);
        }

        // Add listeners to both desktop and mobile toggle buttons
        const langToggleBtn = document.getElementById('lang-toggle');
        const langToggleMobileBtn = document.getElementById('lang-toggle-mobile');
        if (langToggleBtn) langToggleBtn.addEventListener('click', handleLanguageToggle);
        if (langToggleMobileBtn) langToggleMobileBtn.addEventListener('click', handleLanguageToggle);


        // --- Initialize Lucide Icons ---
        lucide.createIcons();

        // --- Mobile Menu Toggle Logic ---
        const menuButton = document.getElementById('menu-button');
        const mobileMenu = document.getElementById('mobile-menu');
        const mobileNavLinks = document.querySelectorAll('#mobile-menu a');
        if (menuButton && mobileMenu) { // Add null checks
            menuButton.addEventListener('click', () => {
                mobileMenu.classList.toggle('hidden');
                const icon = menuButton.querySelector('i');
                if (icon) { // Check if icon exists
                    icon.setAttribute('data-lucide', mobileMenu.classList.contains('hidden') ? 'menu' : 'x');
                    lucide.createIcons(); // Re-render icon
                }
            });
        }

        const allNavLinks = document.querySelectorAll('#navbar-links a[data-target], #mobile-menu a[data-target]');
        allNavLinks.forEach((link) => {
            link.addEventListener('click', (e) => {
                const targetSel = link.getAttribute('data-target') || link.getAttribute('href');
                if (targetSel && targetSel.startsWith('#')) {
                    e.preventDefault();
                    const targetEl = document.querySelector(targetSel);
                    if (targetEl) {
                        targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                    const cleanUrl = `${window.location.pathname}${window.location.search}`;
                    history.replaceState(null, document.title, cleanUrl);
                }

                if (mobileMenu && mobileNavLinks.length) {
                    mobileMenu.classList.add('hidden');
                }
                if (menuButton) {
                    const icon = menuButton.querySelector('i');
                    if (icon) {
                        icon.setAttribute('data-lucide', 'menu');
                        lucide.createIcons();
                    }
                }
            });
        });

        // --- Chat Widget Logic ---
        const chatButton = document.getElementById('chat-button');
        const chatWindow = document.getElementById('chat-window');
        const closeChatButton = document.getElementById('close-chat');
        const chatBody = document.getElementById('chat-body');
        const chatInput = document.getElementById('chat-input');
        const sendButton = document.getElementById('send-button');

        // Ensure all elements exist before adding listeners
        if (chatButton && chatWindow && closeChatButton && chatBody && chatInput && sendButton) {

            // Toggle Chat Window Visibility
            chatButton.addEventListener('click', () => {
                const isHidden = chatWindow.style.display === 'none' || chatWindow.style.display === '';
                chatWindow.style.display = isHidden ? 'flex' : 'none';
                chatButton.style.display = isHidden ? 'none' : 'flex';
                 if (isHidden) {
                    chatInput.focus(); // Focus input when opening
                    chatBody.scrollTop = chatBody.scrollHeight; // Scroll to bottom
                }
            });

            closeChatButton.addEventListener('click', () => {
                chatWindow.style.display = 'none';
                chatButton.style.display = 'flex';
            });

            // Send Message Handler
            const handleSendMessage = async () => {
                const userMessage = chatInput.value.trim();
                if (!userMessage) return; // Don't send empty messages

                appendMessage(userMessage, 'user');
                chatInput.value = ''; // Clear input field
                sendButton.disabled = true; // Disable button while processing
                sendButton.innerHTML = '<i data-lucide="loader-2" class="w-5 h-5 animate-spin"></i>'; // Show loading icon
                lucide.createIcons();

                // Use current language for loading message
                const loadingText = languageData[currentLanguage]?.chatLoading || 'Thinking...';
                const loadingMessageElement = appendMessage(loadingText, 'loading');

                try {
                    // Call the API function pointing to the Worker
                    const botResponse = await callChatApi(userMessage, currentLanguage);
                    if (loadingMessageElement) loadingMessageElement.remove(); // Remove loading message
                    appendMessage(botResponse, 'bot');

                } catch (error) {
                     if (loadingMessageElement) loadingMessageElement.remove(); // Remove loading message on error too
                    console.error("API call failed:", error);
                    // Use current language for error message
                    const errorText = languageData[currentLanguage]?.chatError || 'Sorry, connection failed.';
                    appendMessage(errorText, 'error');
                } finally {
                    // Re-enable send button
                    sendButton.disabled = false;
                    sendButton.innerHTML = '<i data-lucide="send" class="w-5 h-5"></i>'; // Restore send icon
                    lucide.createIcons();
                    chatInput.focus(); // Re-focus input
                }
            };

            // Add event listeners for sending message
            sendButton.addEventListener('click', handleSendMessage);
            chatInput.addEventListener('keypress', (event) => {
                // Send message on Enter key press
                if (event.key === 'Enter') {
                    console.log('Enter key pressed!');
                    handleSendMessage();
                }
            });

        } else {
            console.error("One or more chat widget elements not found.");
        }


        // --- API Call Function to call the Cloudflare Worker ---
        async function callChatApi(message, lang) {
            console.log(`Calling Worker API with message: "${message}" in language: ${lang}`);

            // The relative path that will be routed to your Cloudflare Worker
            // Ensure this matches the route you set up in Pages Functions settings.
            const workerApiUrl = '/api/chat';

            try {
                const response = await fetch(workerApiUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    // Send the user message and language preference to the Worker
                    body: JSON.stringify({
                        message: message,
                        language: lang
                    })
                });

                if (!response.ok) {
                    // Handle errors returned from the Worker itself
                    const errorText = await response.text(); // Get error details from Worker response
                    console.error('Worker API Error:', response.status, errorText);
                    // Try to provide a more specific error if possible
                    throw new Error(errorText || `Worker request failed with status ${response.status}`);
                }

                // Get the response text (which should be the AI's answer) from the Worker
                const botResponse = await response.text();
                return botResponse;

            } catch (error) {
                console.error('Error calling Worker API:', error);
                // Re-throw the error to be caught by handleSendMessage
                // The error message might come from the fetch failure or the Worker's explicit error response
                throw error;
            }
        }

        // --- Helper function to add messages to the chat body ---
        function appendMessage(text, type) {
            const messageDiv = document.createElement('div');
            messageDiv.classList.add('chat-message', type);
            // Basic text sanitization (replace with a robust library if needed for security)
            messageDiv.textContent = text;
            if (chatBody) { // Check if chatBody exists
                 chatBody.appendChild(messageDiv);
                 // Scroll to the bottom to show the latest message
                 chatBody.scrollTop = chatBody.scrollHeight;
            } else {
                console.error("Chat body element not found, cannot append message.");
            }
            return messageDiv; // Return the element for potential removal (like loading message)
        }

        // --- Close chat if clicking outside of it (Optional Enhancement) ---
        document.addEventListener('click', function(event) {
          // Check if the click target is outside the chat window and not the chat button
          if (chatWindow && chatButton) { // Check if elements exist
              const isClickInsideChat = chatWindow.contains(event.target);
              const isClickOnButton = chatButton.contains(event.target);

              // If chat is open and click is outside
              if (!isClickInsideChat && !isClickOnButton && chatWindow.style.display === 'flex') {
                chatWindow.style.display = 'none'; // Hide chat window
                chatButton.style.display = 'flex';  // Show chat button
              }
          }
        });

        // --- Initial Setup ---
        // Site default language is Chinese on first entry.
        setLanguage('zh');

        // 页面初始如存在 hash（例如从后台返回后或外部深链），执行平滑滚动并清理URL
        if (window.location.hash) {
            const initialId = window.location.hash.slice(1);
            const initialEl = document.getElementById(initialId);
            if (initialEl) {
                initialEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
            const cleanUrl = `${window.location.pathname}${window.location.search}`;
            history.replaceState(null, document.title, cleanUrl);
        }

        // --- 管理员功能 ---
        let adminToken = localStorage.getItem('adminToken');
        let currentUser = null;

        // 显示管理员登录模态框
        function showAdminLogin() {
            const token = localStorage.getItem('admin_token') || localStorage.getItem('adminToken');
            if (token) {
                window.location.href = '/admin/dashboard.html';
                return;
            }
            document.getElementById('admin-modal').classList.remove('hidden');
        }

        // 隐藏管理员登录模态框
        function hideAdminLogin() {
            document.getElementById('admin-modal').classList.add('hidden');
            document.getElementById('login-error').classList.add('hidden');
        }

        // 处理管理员登录
        async function handleAdminLogin(event) {
            event.preventDefault();
            
            const username = document.getElementById('admin-username').value;
            const password = document.getElementById('admin-password').value;
            const submitBtn = document.getElementById('login-submit');
            const loginText = document.getElementById('login-text');
            const loginLoading = document.getElementById('login-loading');
            const errorDiv = document.getElementById('login-error');
            
            // 显示加载状态
            submitBtn.disabled = true;
            loginText.classList.add('hidden');
            loginLoading.classList.remove('hidden');
            errorDiv.classList.add('hidden');
            
            try {
                const response = await fetch('/api/admin/auth/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ username, password })
                });
                
                const contentType = response.headers.get("content-type");
                let data;
                if (contentType && contentType.indexOf("application/json") !== -1) {
                    data = await response.json();
                } else {
                    const text = await response.text();
                    throw new Error(`返回非JSON格式 (${response.status}): ${text.substring(0, 100)}`);
                }
                
                if (response.ok) {
                    // 登录成功
                    adminToken = data.token;
                    currentUser = data.user;
                    // 同步两个键名，兼容后台页面
                    localStorage.setItem('adminToken', adminToken);
                    localStorage.setItem('admin_token', adminToken);
                    hideAdminLogin();
                    // 直接跳转到后台仪表板，避免二次登录与双侧边栏
                    window.location.href = '/admin/dashboard.html';
                } else {
                    // 登录失败
                    errorDiv.textContent = data.error || '登录失败';
                    errorDiv.classList.remove('hidden');
                }
            } catch (error) {
                console.error('登录错误:', error);
                errorDiv.textContent = '网络错误或异常: ' + error.message;
                errorDiv.classList.remove('hidden');
            } finally {
                // 恢复按钮状态
                submitBtn.disabled = false;
                loginText.classList.remove('hidden');
                loginLoading.classList.add('hidden');
            }
        }

        // 显示管理面板
        function showAdminPanel() {
            // 保留函数以兼容旧代码，但改为跳转（不再显示内嵌面板，避免与后台页面重复侧栏）
            window.location.href = '/admin/dashboard.html';
        }

        // 显示公共网站
        function showPublicSite() {
            document.getElementById('admin-panel').classList.add('hidden');
            // 直接跳转回首页，强制移除 hash
            window.location.href = '/index.html';
        }

        // 管理员退出登录
        function adminLogout() {
            adminToken = null;
            currentUser = null;
            localStorage.removeItem('adminToken');
            showPublicSite();
        }

        // 显示管理面板的不同部分
        function showAdminSection(section, sourceEl = null) {
            const iframe = document.getElementById('admin-content');
            const navButtons = document.querySelectorAll('.admin-nav-btn');
            
            // 移除所有导航按钮的高亮状态
            navButtons.forEach(btn => btn.classList.remove('bg-tsinghua-purple', 'text-white'));
            
            // 高亮当前导航按钮（如果传入了来源元素）
            if (sourceEl instanceof HTMLElement) {
                sourceEl.classList.add('bg-tsinghua-purple', 'text-white');
            }
            
            switch(section) {
                case 'dashboard':
                    iframe.src = '/admin/dashboard.html';
                    break;
                case 'publications':
                    iframe.src = '/admin/publications.html';
                    break;
                case 'news':
                    iframe.src = '/admin/news.html';
                    break;
                case 'team':
                    iframe.src = '/admin/team.html';
                    break;
            }
        }

        // 检查是否已登录
        async function checkAdminAuth() {
            if (adminToken) {
                try {
                    const response = await fetch('/api/admin/stats', {
                        headers: {
                            'Authorization': `Bearer ${adminToken}`
                        }
                    });
                    
                    if (response.ok) {
                        // Token有效，可以直接显示管理面板
                        // 这里可以添加自动显示管理面板的逻辑
                    } else {
                        // Token无效，清除
                        localStorage.removeItem('adminToken');
                        adminToken = null;
                    }
                } catch (error) {
                    console.error('检查认证状态失败:', error);
                }
            }
        }

        // 页面加载时检查登录状态
        checkAdminAuth();

        // 将函数暴露到全局作用域
        window.showAdminLogin = showAdminLogin;
        window.hideAdminLogin = hideAdminLogin;
        window.handleAdminLogin = handleAdminLogin;
        window.showPublicSite = showPublicSite;
        window.adminLogout = adminLogout;
        window.showAdminSection = showAdminSection;
