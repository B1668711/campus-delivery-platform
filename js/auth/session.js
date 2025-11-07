// 会话管理
class SessionManager {
    constructor() {
        this.session = null;
    }
    
    // 创建会话
    createSession(userData) {
        this.session = {
            user: userData,
            createdAt: new Date(),
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24小时后过期
        };
        this.saveSession();
        return this.session;
    }
    
    // 保存会话到本地存储
    saveSession() {
        if (typeof localStorage !== 'undefined') {
            localStorage.setItem('app_session', JSON.stringify(this.session));
        }
    }
    
    // 从本地存储加载会话
    loadSession() {
        if (typeof localStorage !== 'undefined') {
            const sessionData = localStorage.getItem('app_session');
            if (sessionData) {
                this.session = JSON.parse(sessionData);
            }
        }
        return this.session;
    }
    
    // 清除会话
    clearSession() {
        this.session = null;
        if (typeof localStorage !== 'undefined') {
            localStorage.removeItem('app_session');
        }
    }
    
    // 检查会话是否有效
    isSessionValid() {
        if (!this.session) return false;
        return new Date() < new Date(this.session.expiresAt);
    }
}

// 导出 SessionManager
window.SessionManager = SessionManager;