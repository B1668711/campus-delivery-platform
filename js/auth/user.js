// 用户管理
class UserManager {
    constructor() {
        this.currentUser = null;
    }
    
    // 用户登录
    async login(username, password) {
        // 登录逻辑
        console.log(`用户 ${username} 登录`);
        return { success: true };
    }
    
    // 用户注册
    async register(userData) {
        // 注册逻辑
        console.log('新用户注册', userData);
        return { success: true };
    }
    
    // 用户登出
    async logout() {
        // 登出逻辑
        console.log('用户登出');
        this.currentUser = null;
    }
}

// 导出 UserManager
window.UserManager = UserManager;