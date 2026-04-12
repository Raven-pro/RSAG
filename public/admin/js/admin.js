// 管理后台工具库
class AdminUtils {
    static baseURL = '/api/admin';
    static loginPath = '/admin/login.html';
    static dashboardPath = '/admin/dashboard.html';
    static memberHomePath = '/admin/news.html';
    static flashStyleInjected = false;

    static ensureFlashStyle() {
        if (this.flashStyleInjected) {
            return;
        }
        const styleId = 'admin-flash-highlight-style';
        if (document.getElementById(styleId)) {
            this.flashStyleInjected = true;
            return;
        }

        const style = document.createElement('style');
        style.id = styleId;
        style.textContent = `
            @keyframes adminFlashPulse {
                0% { background-color: rgba(14, 165, 233, 0.18); box-shadow: 0 0 0 0 rgba(14, 165, 233, 0.3); }
                40% { background-color: rgba(14, 165, 233, 0.26); box-shadow: 0 0 0 6px rgba(14, 165, 233, 0.12); }
                100% { background-color: transparent; box-shadow: 0 0 0 0 rgba(14, 165, 233, 0); }
            }

            .admin-flash-highlight {
                animation: adminFlashPulse 820ms ease-out;
            }
        `;
        document.head.appendChild(style);
        this.flashStyleInjected = true;
    }

    static flashElement(target, duration = 900) {
        if (!target) {
            return;
        }

        this.ensureFlashStyle();

        target.classList.remove('admin-flash-highlight');
        // 强制回流，确保连续触发也会重新播放动画
        void target.offsetWidth;
        target.classList.add('admin-flash-highlight');

        window.setTimeout(() => {
            target.classList.remove('admin-flash-highlight');
        }, Math.max(200, duration));
    }

    static normalizeRole(role) {
        const value = String(role || '').trim().toLowerCase();
        if (value === 'admin') return 'admin';
        if (value === 'editor') return 'member';
        return 'member';
    }

    static parseTokenPayload(token = this.getToken()) {
        if (!token) return null;
        try {
            const rawPayload = String(token.split('.')[1] || '');
            const base64 = rawPayload.replace(/-/g, '+').replace(/_/g, '/');
            const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
            const payload = JSON.parse(atob(padded));
            payload.role = this.normalizeRole(payload.role);
            return payload;
        } catch (e) {
            return null;
        }
    }

    static getCurrentUser() {
        const payload = this.parseTokenPayload();
        if (!payload) return null;
        return {
            id: payload.userId,
            username: payload.username,
            role: payload.role
        };
    }

    static getCurrentRole() {
        const user = this.getCurrentUser();
        return user?.role || 'member';
    }

    static isAdmin() {
        return this.getCurrentRole() === 'admin';
    }

    static getDefaultLandingPath() {
        return this.isAdmin() ? this.dashboardPath : this.memberHomePath;
    }

    static isMemberAllowedPath(pathname = window.location.pathname) {
        return [
            '/admin/news',
            '/admin/news.html',
            '/admin/publications',
            '/admin/publications.html',
            '/admin/login',
            '/admin/login.html'
        ].includes(pathname);
    }

    static isLoginRoute(pathname = window.location.pathname) {
        return pathname === '/admin/login' || pathname === '/admin/login.html' || pathname.endsWith('/admin/login');
    }
    
    // 获取存储的认证令牌（兼容旧键名）
    static getToken() {
        return localStorage.getItem('admin_token') || localStorage.getItem('adminToken');
    }
    
    // 设置认证令牌（同时写入两个键，避免跨页面不一致）
    static setToken(token) {
        localStorage.setItem('admin_token', token);
        localStorage.setItem('adminToken', token);
    }
    
    // 清除认证令牌（两个键都移除）
    static clearToken() {
        localStorage.removeItem('admin_token');
        localStorage.removeItem('adminToken');
    }
    
    // 检查是否已登录
    static isAuthenticated() {
        const token = this.getToken();
        if (!token) return false;
        
        try {
            const payload = this.parseTokenPayload(token);
            if (!payload) return false;
            return payload.exp > Date.now() / 1000;
        } catch (e) {
            return false;
        }
    }
    
    // API请求封装
    static async apiRequest(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const token = this.getToken();
        
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...(token && { 'Authorization': `Bearer ${token}` })
            },
            ...options
        };
        
        if (config.body && typeof config.body === 'object' && !(config.body instanceof FormData)) {
            config.body = JSON.stringify(config.body);
        }
        
        try {
            const response = await fetch(url, config);
            
            if (response.status === 401) {
                this.clearToken();
                window.location.href = this.loginPath;
                return;
            }
            
            const contentType = response.headers.get('Content-Type') || '';
            const data = contentType.includes('application/json') ? await response.json() : await response.text();
            
            if (!response.ok) {
                const errMsg = typeof data === 'string' ? data : (data.error || '请求失败');
                throw new Error(errMsg);
            }
            
            return data;
        } catch (error) {
            console.error('API请求错误:', error);
            throw error;
        }
    }
    
    // 显示通知
    static showNotification(message, type = 'success', duration = 3000) {
        // 移除已存在的通知
        const existing = document.querySelector('.notification');
        if (existing) {
            existing.remove();
        }
        
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        // 自动隐藏
        setTimeout(() => {
            notification.remove();
        }, duration);
    }
    
    // 显示确认对话框
    static async showConfirm(message, title = '确认操作') {
        return new Promise((resolve) => {
            const overlay = document.createElement('div');
            overlay.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.5);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 1000;
            `;
            
            const dialog = document.createElement('div');
            dialog.style.cssText = `
                background: white;
                padding: 2rem;
                border-radius: 8px;
                max-width: 400px;
                width: 90%;
                box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
            `;
            
            dialog.innerHTML = `
                <h3 style="margin: 0 0 1rem 0; color: #1e293b;">${title}</h3>
                <p style="margin: 0 0 2rem 0; color: #64748b;">${message}</p>
                <div style="display: flex; gap: 1rem; justify-content: flex-end;">
                    <button class="btn btn-secondary" id="cancel-btn">取消</button>
                    <button class="btn btn-danger" id="confirm-btn">确认</button>
                </div>
            `;
            
            overlay.appendChild(dialog);
            document.body.appendChild(overlay);
            
            const cancelBtn = dialog.querySelector('#cancel-btn');
            const confirmBtn = dialog.querySelector('#confirm-btn');
            
            cancelBtn.onclick = () => {
                overlay.remove();
                resolve(false);
            };
            
            confirmBtn.onclick = () => {
                overlay.remove();
                resolve(true);
            };
            
            overlay.onclick = (e) => {
                if (e.target === overlay) {
                    overlay.remove();
                    resolve(false);
                }
            };
        });
    }
    
    // 格式化日期
    static formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    }
    
    // 文件上传
    static async uploadFile(file, type = 'general') {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('type', type);
        
        const token = this.getToken();
        
        try {
            const response = await fetch(`${this.baseURL}/upload`, {
                method: 'POST',
                headers: {
                    ...(token && { 'Authorization': `Bearer ${token}` })
                },
                body: formData
            });
            
            if (response.status === 401) {
                this.clearToken();
                window.location.href = this.loginPath;
                return;
            }
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || '上传失败');
            }
            
            return data;
        } catch (error) {
            console.error('文件上传错误:', error);
            throw error;
        }
    }
    
    // 表单验证
    static validateForm(form, rules) {
        const errors = {};
        
        for (const [field, rule] of Object.entries(rules)) {
            const element = form.querySelector(`[name="${field}"]`);
            const value = element?.value?.trim();
            
            if (rule.required && !value) {
                errors[field] = rule.message || `${field}是必填项`;
                continue;
            }
            
            if (value && rule.pattern && !rule.pattern.test(value)) {
                errors[field] = rule.message || `${field}格式不正确`;
                continue;
            }
            
            if (value && rule.minLength && value.length < rule.minLength) {
                errors[field] = rule.message || `${field}至少需要${rule.minLength}个字符`;
                continue;
            }
            
            if (value && rule.maxLength && value.length > rule.maxLength) {
                errors[field] = rule.message || `${field}不能超过${rule.maxLength}个字符`;
                continue;
            }
        }
        
        // 显示错误信息
        form.querySelectorAll('.error-message').forEach(el => el.remove());
        
        for (const [field, message] of Object.entries(errors)) {
            const element = form.querySelector(`[name="${field}"]`);
            if (element) {
                const errorDiv = document.createElement('div');
                errorDiv.className = 'error-message';
                errorDiv.style.cssText = 'color: #ef4444; font-size: 0.75rem; margin-top: 0.25rem;';
                errorDiv.textContent = message;
                element.parentNode.appendChild(errorDiv);
            }
        }
        
        return Object.keys(errors).length === 0;
    }
    
    // 分页处理
    static createPagination(current, total, callback) {
        const container = document.createElement('div');
        container.className = 'pagination';
        container.style.cssText = `
            display: flex;
            justify-content: center;
            align-items: center;
            gap: 0.5rem;
            margin-top: 2rem;
        `;
        
        const maxVisible = 5;
        const start = Math.max(1, current - Math.floor(maxVisible / 2));
        const end = Math.min(total, start + maxVisible - 1);
        
        // 上一页
        if (current > 1) {
            const prevBtn = this.createPageButton('‹', current - 1, callback);
            container.appendChild(prevBtn);
        }
        
        // 页码
        for (let i = start; i <= end; i++) {
            const pageBtn = this.createPageButton(i, i, callback, i === current);
            container.appendChild(pageBtn);
        }
        
        // 下一页
        if (current < total) {
            const nextBtn = this.createPageButton('›', current + 1, callback);
            container.appendChild(nextBtn);
        }
        
        return container;
    }
    
    static createPageButton(text, page, callback, active = false) {
        const button = document.createElement('button');
        button.textContent = text;
        button.className = `btn btn-small ${active ? 'btn-primary' : 'btn-secondary'}`;
        button.onclick = () => callback(page);
        return button;
    }
    
    // 防抖函数
    static debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
    
    // 初始化侧边栏导航
    static initSidebar() {
        const currentPath = window.location.pathname;
        const currentRole = this.getCurrentRole();
        const navItems = document.querySelectorAll('.nav-item');

        this.applyRoleVisibility();
        
        navItems.forEach(item => {
            const requiredRole = item.getAttribute('data-role');
            if (requiredRole && this.normalizeRole(requiredRole) !== currentRole) {
                item.style.display = 'none';
                return;
            }

            const href = item.getAttribute('href');
            if (href && currentPath.includes(href.split('/').pop().split('.')[0])) {
                item.classList.add('active');
            }
            
            // 添加退出登录功能
            if (item.classList.contains('logout')) {
                item.onclick = async (e) => {
                    e.preventDefault();
                    const confirmed = await this.showConfirm('确定要退出登录吗？');
                    if (confirmed) {
                        this.clearToken();
                        window.location.href = this.loginPath;
                    }
                };
            }
        });
    }

    static applyRoleVisibility(root = document) {
        const role = this.getCurrentRole();

        root.querySelectorAll('[data-role]').forEach((el) => {
            const required = String(el.getAttribute('data-role') || '').trim();
            if (!required) return;
            const requiredRole = this.normalizeRole(required);
            if (requiredRole !== role) {
                el.style.display = 'none';
            }
        });

        root.querySelectorAll('[data-hide-for]').forEach((el) => {
            const roles = String(el.getAttribute('data-hide-for') || '')
                .split(',')
                .map((item) => this.normalizeRole(item))
                .filter(Boolean);
            if (roles.includes(role)) {
                el.style.display = 'none';
            }
        });
    }
    
    // 检查登录状态
    static checkAuth() {
        if (!this.isAuthenticated()) {
            window.location.href = this.loginPath;
            return false;
        }

        const role = this.getCurrentRole();
        if (role === 'member' && !this.isMemberAllowedPath(window.location.pathname)) {
            window.location.href = this.memberHomePath;
            return false;
        }

        return true;
    }
}

// 页面加载完成后的通用初始化
document.addEventListener('DOMContentLoaded', () => {
    // 如果不是登录页面，检查认证状态
    if (!AdminUtils.isLoginRoute()) {
        AdminUtils.checkAuth();
        AdminUtils.initSidebar();
    }
});

// 导出到全局
window.AdminUtils = AdminUtils;
