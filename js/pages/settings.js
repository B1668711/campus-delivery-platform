// 设置页面
class SettingsPage {
    constructor() {
        this.pageName = '设置页面';
    }
    
    // 渲染设置页面
    render() {
        const content = document.getElementById('content');
        if (content) {
            content.innerHTML = `
                <h2>个人设置</h2>
                <div class="card">
                    <h3>个人信息</h3>
                    <form id="profileForm">
                        <div class="form-group">
                            <label for="username">用户名</label>
                            <input type="text" id="username" name="username" placeholder="请输入用户名">
                        </div>
                        <div class="form-group">
                            <label for="email">邮箱</label>
                            <input type="email" id="email" name="email" placeholder="请输入邮箱地址">
                        </div>
                        <div class="form-group">
                            <label for="phone">手机号</label>
                            <input type="tel" id="phone" name="phone" placeholder="请输入手机号">
                        </div>
                        <button type="submit" class="btn">保存信息</button>
                    </form>
                </div>
                <div class="card">
                    <h3>安全设置</h3>
                    <form id="securityForm">
                        <div class="form-group">
                            <label for="currentPassword">当前密码</label>
                            <input type="password" id="currentPassword" name="currentPassword" placeholder="请输入当前密码">
                        </div>
                        <div class="form-group">
                            <label for="newPassword">新密码</label>
                            <input type="password" id="newPassword" name="newPassword" placeholder="请输入新密码">
                        </div>
                        <div class="form-group">
                            <label for="confirmPassword">确认新密码</label>
                            <input type="password" id="confirmPassword" name="confirmPassword" placeholder="请再次输入新密码">
                        </div>
                        <button type="submit" class="btn">修改密码</button>
                    </form>
                </div>
            `;
            
            // 添加事件监听器
            this.addEventListeners();
        }
    }
    
    // 添加事件监听器
    addEventListeners() {
        const profileForm = document.getElementById('profileForm');
        const securityForm = document.getElementById('securityForm');
        
        if (profileForm) {
            profileForm.addEventListener('submit', (e) => {
                e.preventDefault();
                console.log('保存个人信息');
                // 这里应该处理保存个人信息
                if (window.app && typeof window.app.userManager === 'object') {
                    const formData = new FormData(profileForm);
                    const profileData = {
                        username: formData.get('username'),
                        email: formData.get('email'),
                        phone: formData.get('phone')
                    };
                    
                    console.log('保存个人信息:', profileData);
                }
            });
        }
        
        if (securityForm) {
            securityForm.addEventListener('submit', (e) => {
                e.preventDefault();
                console.log('修改密码');
                // 这里应该处理修改密码
                if (window.app && typeof window.app.userManager === 'object') {
                    const formData = new FormData(securityForm);
                    const passwordData = {
                        currentPassword: formData.get('currentPassword'),
                        newPassword: formData.get('newPassword'),
                        confirmPassword: formData.get('confirmPassword')
                    };
                    
                    // 检查密码是否匹配
                    if (passwordData.newPassword !== passwordData.confirmPassword) {
                        console.error('新密码和确认密码不匹配');
                        return;
                    }
                    
                    console.log('修改密码:', passwordData);
                }
            });
        }
    }
}

// 导出 SettingsPage
window.SettingsPage = SettingsPage;