// 管理后台工具库
class AdminUtils {
    static baseURL = '/api/admin';
    static loginPath = '/admin/login.html';
    static dashboardPath = '/admin/dashboard.html';
    static memberHomePath = '/admin/news.html';
    static flashStyleInjected = false;
    static pdfLibLoaderPromise = null;
    static uploadLimits = {
        avatar: 512 * 1024,
        image: 2 * 1024 * 1024,
        news: 2 * 1024 * 1024,
        pdf: 12 * 1024 * 1024,
        document: 50 * 1024 * 1024,
        general: 50 * 1024 * 1024,
        fallback: 50 * 1024 * 1024
    };

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

    static formatBytes(bytes = 0) {
        const value = Number(bytes) || 0;
        if (value < 1024) return `${value} B`;
        if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
        return `${(value / (1024 * 1024)).toFixed(2)} MB`;
    }

    static resolveUploadSizeLimit(type = 'general', mimeType = '') {
        const normalizedType = String(type || '').toLowerCase();
        const normalizedMime = String(mimeType || '').toLowerCase();

        if (normalizedType === 'avatar') return this.uploadLimits.avatar;
        if (normalizedType === 'news' || normalizedType === 'image') return this.uploadLimits.image;
        if (normalizedType === 'pdf' || normalizedMime === 'application/pdf') return this.uploadLimits.pdf;
        if (normalizedMime.startsWith('image/')) return this.uploadLimits.image;
        if (normalizedType === 'document') return this.uploadLimits.document;

        return this.uploadLimits.fallback;
    }

    static replaceFileExtension(filename = '', extension = '') {
        const safeName = String(filename || 'upload');
        const ext = String(extension || '').trim();
        if (!ext) return safeName;
        if (!safeName.includes('.')) return `${safeName}${ext}`;
        return safeName.replace(/\.[^.]+$/, ext);
    }

    static loadImageFromFile(file) {
        return new Promise((resolve, reject) => {
            const objectUrl = URL.createObjectURL(file);
            const image = new Image();
            image.onload = () => {
                URL.revokeObjectURL(objectUrl);
                resolve(image);
            };
            image.onerror = () => {
                URL.revokeObjectURL(objectUrl);
                reject(new Error('图片读取失败'));
            };
            image.src = objectUrl;
        });
    }

    static canvasToBlob(canvas, mimeType, quality) {
        return new Promise((resolve) => {
            canvas.toBlob((blob) => resolve(blob), mimeType, quality);
        });
    }

    static async compressImageFile(file, { targetBytes, uploadType = 'image' } = {}) {
        const mimeType = String(file?.type || '').toLowerCase();
        if (!mimeType.startsWith('image/') || mimeType === 'image/gif') {
            return file;
        }

        const limit = Number(targetBytes) || this.resolveUploadSizeLimit(uploadType, mimeType);
        if (file.size <= limit) {
            return file;
        }

        const sourceImage = await this.loadImageFromFile(file);
        const maxSide = uploadType === 'avatar' ? 768 : 1920;
        const baseScale = Math.min(1, maxSide / Math.max(sourceImage.width || 1, sourceImage.height || 1));
        const scaleCandidates = [baseScale, baseScale * 0.85, baseScale * 0.7].filter((value, index, arr) => value > 0 && arr.indexOf(value) === index);
        const qualityCandidates = [0.9, 0.82, 0.74, 0.66, 0.58, 0.5, 0.42];
        const outputMime = mimeType === 'image/png' ? 'image/webp' : 'image/jpeg';

        let bestBlob = null;
        for (const scale of scaleCandidates) {
            const width = Math.max(1, Math.round(sourceImage.width * scale));
            const height = Math.max(1, Math.round(sourceImage.height * scale));
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (!ctx) continue;
            ctx.drawImage(sourceImage, 0, 0, width, height);

            for (const quality of qualityCandidates) {
                const blob = await this.canvasToBlob(canvas, outputMime, quality);
                if (!blob) continue;
                if (!bestBlob || blob.size < bestBlob.size) {
                    bestBlob = blob;
                }
                if (blob.size <= limit) {
                    bestBlob = blob;
                    break;
                }
            }

            if (bestBlob && bestBlob.size <= limit) {
                break;
            }
        }

        if (!bestBlob || bestBlob.size >= file.size) {
            return file;
        }

        const ext = bestBlob.type === 'image/webp' ? '.webp' : '.jpg';
        return new File([bestBlob], this.replaceFileExtension(file.name, ext), {
            type: bestBlob.type,
            lastModified: Date.now()
        });
    }

    static async ensurePdfLibLoaded() {
        if (window.PDFLib) {
            return window.PDFLib;
        }

        if (!this.pdfLibLoaderPromise) {
            this.pdfLibLoaderPromise = new Promise((resolve, reject) => {
                const scriptId = 'pdf-lib-cdn-script';
                const existing = document.getElementById(scriptId);
                if (existing) {
                    existing.addEventListener('load', () => resolve(window.PDFLib));
                    existing.addEventListener('error', () => reject(new Error('加载 PDF 压缩组件失败')));
                    return;
                }

                const script = document.createElement('script');
                script.id = scriptId;
                script.src = 'https://cdn.jsdelivr.net/npm/pdf-lib/dist/pdf-lib.min.js';
                script.onload = () => resolve(window.PDFLib);
                script.onerror = () => reject(new Error('加载 PDF 压缩组件失败'));
                document.head.appendChild(script);
            });
        }

        return this.pdfLibLoaderPromise;
    }

    static async compressPdfFile(file, { targetBytes } = {}) {
        const mimeType = String(file?.type || '').toLowerCase();
        if (mimeType !== 'application/pdf') {
            return file;
        }

        const limit = Number(targetBytes) || this.resolveUploadSizeLimit('pdf', mimeType);
        if (file.size <= limit) {
            return file;
        }

        try {
            const PDFLib = await this.ensurePdfLibLoaded();
            if (!PDFLib?.PDFDocument) {
                return file;
            }

            const sourceBytes = await file.arrayBuffer();
            const pdfDoc = await PDFLib.PDFDocument.load(sourceBytes, { ignoreEncryption: true });
            const compressedBytes = await pdfDoc.save({ useObjectStreams: true });

            if (!compressedBytes || compressedBytes.byteLength >= file.size) {
                return file;
            }

            return new File([compressedBytes], file.name, {
                type: 'application/pdf',
                lastModified: Date.now()
            });
        } catch (error) {
            console.warn('PDF 自动压缩失败，回退原文件:', error);
            return file;
        }
    }

    static async prepareFileBeforeUpload(file, type = 'general') {
        const normalizedType = String(type || 'general').toLowerCase();
        const mimeType = String(file?.type || 'application/octet-stream').toLowerCase();
        const limit = this.resolveUploadSizeLimit(normalizedType, mimeType);

        let candidate = file;
        if (mimeType.startsWith('image/')) {
            candidate = await this.compressImageFile(candidate, { targetBytes: limit, uploadType: normalizedType });
        } else if (mimeType === 'application/pdf') {
            candidate = await this.compressPdfFile(candidate, { targetBytes: limit });
        }

        if (candidate !== file && candidate.size < file.size) {
            this.showNotification(`已自动压缩：${this.formatBytes(file.size)} -> ${this.formatBytes(candidate.size)}`, 'success', 2500);
        }

        if (candidate.size > limit) {
            const limitText = this.formatBytes(limit);
            throw new Error(`文件超过限制（${limitText}），已尝试在线压缩但仍超限`);
        }

        return candidate;
    }
    
    // 文件上传
    static async uploadFile(file, type = 'general') {
        const preparedFile = await this.prepareFileBeforeUpload(file, type);
        const formData = new FormData();
        formData.append('file', preparedFile);
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

    static async uploadPublicationPdf(publicationId, file) {
        const id = Number.parseInt(publicationId, 10);
        if (!Number.isInteger(id) || id <= 0) {
            throw new Error('无效的论文 ID');
        }

        const preparedFile = await this.prepareFileBeforeUpload(file, 'pdf');
        const formData = new FormData();
        formData.append('pdf', preparedFile);

        const token = this.getToken();

        const response = await fetch(`${this.baseURL}/publications/${id}/upload-pdf`, {
            method: 'POST',
            headers: {
                ...(token && { Authorization: `Bearer ${token}` })
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
            throw new Error(data.error || 'PDF 上传失败');
        }

        return data;
    }

    static async bindPublicationPdfFromUrl(publicationId, fileUrl) {
        const id = Number.parseInt(publicationId, 10);
        if (!Number.isInteger(id) || id <= 0) {
            throw new Error('无效的论文 ID');
        }

        const normalizedUrl = String(fileUrl || '').trim();
        if (!normalizedUrl) {
            throw new Error('无效的 PDF 链接');
        }

        return this.apiRequest(`/publications/${id}/bind-pdf`, {
            method: 'POST',
            body: {
                file_url: normalizedUrl
            }
        });
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
