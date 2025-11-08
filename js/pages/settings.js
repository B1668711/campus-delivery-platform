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
                    <h3>自动填充联系信息</h3>
                    <form id="contactForm">
                        <div class="form-group">
                            <label for="defaultContactName">默认联系人姓名</label>
                            <input type="text" id="defaultContactName" name="defaultContactName" placeholder="请输入默认联系人姓名">
                        </div>
                        <div class="form-group">
                            <label for="defaultContactPhone">默认联系人电话</label>
                            <input type="tel" id="defaultContactPhone" name="defaultContactPhone" placeholder="请输入默认联系人电话">
                        </div>
                        <div class="form-group">
                            <label for="defaultContactAddress">默认联系地址</label>
                            <input type="text" id="defaultContactAddress" name="defaultContactAddress" placeholder="请输入默认联系地址">
                        </div>
                        <button type="submit" class="btn">保存默认联系人</button>
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
            
            // 页面加载完成后填充已保存的默认联系人信息
            this.fillSavedContactInfo();
        }
    }
    
    // 填充已保存的默认联系人信息
    fillSavedContactInfo() {
        // 使用 app.js 中的 currentUser 对象来填充信息
        if (window.currentUser) {
            const currentUser = window.currentUser;
            
            const defaultContactNameInput = document.getElementById('defaultContactName');
            const defaultContactPhoneInput = document.getElementById('defaultContactPhone');
            const defaultContactAddressInput = document.getElementById('defaultContactAddress');
            
            if (defaultContactNameInput && currentUser.defaultContactName) {
                defaultContactNameInput.value = currentUser.defaultContactName;
            }
            
            if (defaultContactPhoneInput && currentUser.defaultContactInfo) {
                defaultContactPhoneInput.value = currentUser.defaultContactInfo;
            }
            
            if (defaultContactAddressInput && currentUser.defaultAddress) {
                defaultContactAddressInput.value = currentUser.defaultAddress;
            }
        } else {
            // 降级到 localStorage 方式
            const contactInfo = localStorage.getItem('defaultContactInfo');
            if (contactInfo) {
                const contactData = JSON.parse(contactInfo);
                
                const defaultContactNameInput = document.getElementById('defaultContactName');
                const defaultContactPhoneInput = document.getElementById('defaultContactPhone');
                const defaultContactAddressInput = document.getElementById('defaultContactAddress');
                
                if (defaultContactNameInput && contactData.defaultContactName) {
                    defaultContactNameInput.value = contactData.defaultContactName;
                }
                
                if (defaultContactPhoneInput && contactData.defaultContactPhone) {
                    defaultContactPhoneInput.value = contactData.defaultContactPhone;
                }
                
                if (defaultContactAddressInput && contactData.defaultContactAddress) {
                    defaultContactAddressInput.value = contactData.defaultContactAddress;
                }
            }
        }
    }
    
    // 添加事件监听器
    addEventListeners() {
        const profileForm = document.getElementById('profileForm');
        const contactForm = document.getElementById('contactForm');
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
        
        if (contactForm) {
            contactForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                console.log('保存默认联系人信息');
                // 处理保存默认联系人信息到 currentUser 对象
                const formData = new FormData(contactForm);
                const contactData = {
                    defaultContactName: formData.get('defaultContactName'),
                    defaultContactPhone: formData.get('defaultContactPhone'),
                    defaultContactAddress: formData.get('defaultContactAddress')
                };
                
                // 如果存在 window.saveUser 函数，则使用它来保存
                if (window.saveUser && typeof window.saveUser === 'function') {
                    try {
                        await window.saveUser({
                            defaultContactName: contactData.defaultContactName,
                            defaultContactInfo: contactData.defaultContactPhone,
                            defaultAddress: contactData.defaultContactAddress
                        });
                        console.log('默认联系人信息已保存到 currentUser');
                        alert('默认联系人信息已保存');
                    } catch (error) {
                        console.error('保存默认联系人信息失败:', error);
                        alert('保存失败，请重试');
                    }
                } else {
                    // 降级到 localStorage 方式
                    localStorage.setItem('defaultContactInfo', JSON.stringify(contactData));
                    console.log('保存默认联系人信息到 localStorage:', contactData);
                    alert('默认联系人信息已保存');
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