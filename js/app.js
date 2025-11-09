// Supabase 配置
        const SUPABASE_URL = 'https://mdkvoofsjmwxwsfoudbz.supabase.co';
        const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1ka3Zvb2Zzam13eHdzZm91ZGJ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA4ODE2NTgsImV4cCI6MjA3NjQ1NzY1OH0.KXwS4CWYM5RIJ9RzQAVwAn9f1qvDBHykbil0CVykFP8';

        // 初始化 Supabase 客户端
        let supabase;

        // ==================== 增强版全局错误处理器 ====================
        
        // 应用状态监控
        const appState = {
            isOnline: navigator.onLine,
            lastError: null,
            errorCount: 0,
            supabaseConnected: false
        };

        // 错误分类
        const ErrorTypes = {
            NETWORK: 'network',
            DATABASE: 'database',
            UI: 'ui',
            BUSINESS: 'business',
            UNKNOWN: 'unknown'
        };

        // 错误上报函数（可以集成到您的监控系统）
        function reportError(error, type = ErrorTypes.UNKNOWN, context = {}) {
            const errorInfo = {
                type,
                message: error.message,
                stack: error.stack,
                timestamp: new Date().toISOString(),
                userAgent: navigator.userAgent,
                url: window.location.href,
                context,
                appState
            };
            
            console.error(`📊 错误上报 [${type}]:`, errorInfo);
            
            // 这里可以发送错误信息到您的监控服务
            // sendToErrorMonitoringService(errorInfo);
        }

        // 全局错误处理
        window.addEventListener('error', function(e) {
            const errorDetails = {
                message: e.message,
                filename: e.filename,
                lineno: e.lineno,
                colno: e.colno,
                error: e.error
            };
            
            console.error('🚨 全局错误捕获:', errorDetails);
            
            // 错误分类
            let errorType = ErrorTypes.UNKNOWN;
            if (e.message.includes('Network') || e.message.includes('fetch')) {
                errorType = ErrorTypes.NETWORK;
            } else if (e.message.includes('Supabase') || e.message.includes('database')) {
                errorType = ErrorTypes.DATABASE;
            }
            
            appState.lastError = errorDetails;
            appState.errorCount++;
            
            reportError(e.error || new Error(e.message), errorType, errorDetails);
        });

        // 未处理的 Promise rejection
        window.addEventListener('unhandledrejection', function(e) {
            console.error('🚨 未处理的 Promise rejection:', e.reason);
            
            // 错误分类
            let errorType = ErrorTypes.UNKNOWN;
            const reason = e.reason;
            
            if (reason && reason.message) {
                if (reason.message.includes('Network') || reason.message.includes('fetch')) {
                    errorType = ErrorTypes.NETWORK;
                } else if (reason.message.includes('Supabase') || reason.message.includes('database')) {
                    errorType = ErrorTypes.DATABASE;
                }
            }
            
            appState.lastError = reason;
            appState.errorCount++;
            
            reportError(reason, errorType, { event: 'unhandledrejection' });
            
            // 阻止浏览器默认的错误提示
            e.preventDefault();
        });

        // 网络状态监听
        window.addEventListener('online', function() {
            console.log('🌐 网络连接恢复');
            appState.isOnline = true;
            
            // 隐藏离线提示
            const banner = document.getElementById('offline-banner');
            if (banner) {
                banner.style.display = 'none';
            }
            
            // 显示网络恢复提示
            showNetworkRestored();
            
            // 尝试重新连接数据库
            if (supabase) {
                console.log('尝试重新连接数据库...');
                testSupabaseConnection().then(connected => {
                    appState.supabaseConnected = connected;
                    if (connected) {
                        console.log('✅ 数据库重新连接成功');
                        // 重新同步数据
                        refreshAllPages().catch(console.error);
                    }
                });
            }
        });

        window.addEventListener('offline', function() {
            console.log('🌐 网络连接断开');
            appState.isOnline = false;
            
            // 显示离线提示
            showOfflineMode();
        });

        // 页面可见性变化监听
        document.addEventListener('visibilitychange', function() {
            if (document.visibilityState === 'visible') {
                console.log('📱 页面变为可见状态');
                // 页面重新获得焦点时，可以刷新数据
                if (supabase && currentUser && appState.isOnline) {
                    setTimeout(() => {
                        refreshAllPages().catch(console.error);
                    }, 1000);
                }
            } else {
                console.log('📱 页面变为隐藏状态');
            }
        });

        // 内存警告监听（移动端）
        window.addEventListener('memorywarning', function() {
            console.warn('📱 内存警告：清理缓存数据');
            // 可以在这里清理不必要的缓存数据
        });

        // 测试 Supabase 连接
        async function testSupabaseConnection() {
            try {
                const { data, error } = await supabase
                    .from('users')
                    .select('count')
                    .limit(1);
                return !error;
            } catch (error) {
                console.error('数据库连接测试失败:', error);
                return false;
            }
        }

        // 显示网络恢复提示
        function showNetworkRestored() {
            const existingBanner = document.getElementById('network-restored-banner');
            if (!existingBanner) {
                const banner = document.createElement('div');
                banner.id = 'network-restored-banner';
                banner.style.cssText = `
                    position: fixed;
                    top: 50px;
                    left: 0;
                    right: 0;
                    background: #07c160;
                    color: white;
                    padding: 8px;
                    text-align: center;
                    font-size: 14px;
                    z-index: 1001;
                    animation: slideDown 0.3s ease-out;
                `;
                banner.textContent = '✅ 网络连接已恢复';
                document.body.appendChild(banner);
                
                // 3秒后自动隐藏
                setTimeout(() => {
                    banner.style.animation = 'slideUp 0.3s ease-in';
                    setTimeout(() => {
                        banner.remove();
                    }, 300);
                }, 3000);
            }
        }

        // 添加 CSS 动画
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideDown {
                from { transform: translateY(-100%); }
                to { transform: translateY(0); }
            }
            @keyframes slideUp {
                from { transform: translateY(0); }
                to { transform: translateY(-100%); }
            }
        `;
        document.head.appendChild(style);

        // ==================== 错误处理器结束 ====================

        // 用户状态管理
        let currentUser = null;
        let currentChatOrder = null;
        let chatInterval = null;
        let unreadUpdateInterval = null;
        let notificationPermission = false;
        let currentTakeOrderPage = null; // 当前领取订单页面类型：'delivery' 或 'errand'

        // ==================== 联系信息验证函数 ====================
function validateContactInfo(contactType, contactInfo) {
    // 移除空格
    contactInfo = contactInfo.trim();
    
    if (contactType === 'wechat') {
        // 微信：6位字符及以上（字母、数字，可以组合）
        const wechatRegex = /^[a-zA-Z0-9]{6,}$/;
        if (!wechatRegex.test(contactInfo)) {
            showToast('微信账号格式不正确！请填写6位及以上字符的微信账号.', 'error');
            return false;
        }
    } else if (contactType === 'phone') {
        // 手机号：11位数字，覆盖所有运营商号段
        const phoneRegex = /^1(3[0-9]|4[0-9]|5[0-9]|6[0-9]|7[0-9]|8[0-9]|9[0-9])[0-9]{8}$/;
        if (!phoneRegex.test(contactInfo)) {
            showToast('手机号格式不正确！请填写11位有效的手机号码.', 'error');
            return false;
        }
    } else if (contactType === 'qq') {
        // QQ：6-10位数字
        const qqRegex = /^[0-9]{6,10}$/;
        if (!qqRegex.test(contactInfo)) {
            showToast('QQ号格式不正确！请填写6-10位纯数字的QQ账号', 'error');
            return false;
        }
    }
    
    return true;
}
// ==================== 联系信息验证函数结束 ====================

        // 生成设备唯一标识
        function generateDeviceId() {
            let deviceId = localStorage.getItem('deviceId');
            if (!deviceId) {
                deviceId = 'device_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
                localStorage.setItem('deviceId', deviceId);
            }
            return deviceId;
        }

        // ==================== 用户ID虚拟掩码处理 ====================

// 用户ID虚拟掩码处理：将UUID转换为8位阿拉伯数字
function formatUserId(userId) {
    if (!userId) return '00000000';
    
    // 提取UUID中的所有数字
    const numbers = userId.replace(/\D/g, '');
    
    let virtualId;
    if (numbers.length >= 8) {
        // 取最后8位数字
        virtualId = numbers.slice(-8);
    } else {
        // 如果数字不足8位，使用哈希补全
        let hash = 0;
        for (let i = 0; i < userId.length; i++) {
            hash = ((hash << 5) - hash) + userId.charCodeAt(i);
            hash = hash & hash;
        }
        virtualId = Math.abs(hash).toString().slice(-8).padStart(8, '0');
    }
    
    // 确保是8位数字
    return virtualId.padStart(8, '0').slice(0, 8);
}

// 缓存已生成的虚拟ID，确保一致性
const userIdCache = new Map();

function getVirtualUserId(userId) {
    if (!userId) return '00000000';
    
    if (userIdCache.has(userId)) {
        return userIdCache.get(userId);
    }
    
    const virtualId = formatUserId(userId);
    userIdCache.set(userId, virtualId);
    return virtualId;
}

// ==================== 虚拟ID处理结束 ====================

        // 清理无效的用户数据
        function clearInvalidUserData() {
            try {
                const userData = localStorage.getItem('currentUser');
                console.log('检查 localStorage 中的用户数据:', userData);
                
                if (userData && userData === 'superadmin') {
                    console.log('检测到无效的用户数据 "superadmin"，正在清理...');
                    localStorage.removeItem('currentUser');
                    console.log('无效数据已清理完成');
                    return true;
                }
                
                // 检查是否是有效的 JSON
                if (userData && userData !== 'superadmin') {
                    try {
                        JSON.parse(userData);
                        console.log('用户数据是有效的 JSON');
                    } catch (e) {
                        console.log('用户数据不是有效的 JSON，正在清理...');
                        localStorage.removeItem('currentUser');
                        return true;
                    }
                }
                
                console.log('用户数据正常，无需清理');
                return false;
                
            } catch (error) {
                console.error('清理用户数据时出错:', error);
                return false;
            }
        }

        // 初始化用户
async function initUser() {
    // 使用新的用户初始化方法，支持跨设备同步
    await initUserWithMasterAccount();
    return currentUser;
}

// 修复后的 syncUserFromDatabase 函数
async function syncUserFromDatabase(deviceId) {
    try {
        console.log('正在从数据库同步用户数据，deviceId:', deviceId);
        
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('device_id', deviceId);
        
        if (error) {
            console.error('从数据库获取用户数据失败:', error);
            
            // 处理各种可能的错误
            if (error.code === '42703' || error.code === '42P01' || error.code === 'PGRST204' || error.code === 'PGRST116') {
                console.warn('数据库表结构不完整或查询失败，使用本地模式');
                return; // 不创建新用户，保持本地模式
            }
            
            return;
        }
        
        // 检查是否有数据
        if (data && data.length > 0) {
            const userData = data[0];
            console.log('找到用户数据:', userData);
            
            // 检查是否有主账户ID，如果有，则获取主账户的数据
            let finalUserData = userData;
            if (userData.master_user_id) {
                console.log('用户有关联的主账户，获取主账户数据');
                const { data: masterUserData, error: masterError } = await supabase
                    .from('users')
                    .select('*')
                    .eq('id', userData.master_user_id)
                    .single();
                
                if (!masterError && masterUserData) {
                    // 使用主账户的数据，但保留设备ID
                    finalUserData = {
                        ...masterUserData,
                        device_id: userData.device_id, // 保留当前设备ID
                        id: userData.id // 保留当前用户ID
                    };
                    console.log('使用主账户数据');
                }
            }
            
            // 更新本地用户数据
            currentUser = {
                id: finalUserData.id,
                deviceId: finalUserData.device_id,
                name: finalUserData.name,
                contactMethod: finalUserData.contact_method,
                contactInfo: finalUserData.contact_info,
                isTaker: false,
                autoFillContact: finalUserData.auto_fill_contact,
                defaultContactType: finalUserData.default_contact_type,
                defaultContactInfo: finalUserData.default_contact_info,
                defaultContactName: finalUserData.default_contact_name || '', // 添加默认联系人姓名
                defaultAddress: finalUserData.default_address,
                createdAt: finalUserData.created_at,
                master_user_id: finalUserData.master_user_id // 保存主账户ID
            };
            
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            console.log('已从数据库同步用户数据');
        } else {
            console.log('数据库中未找到用户数据，将创建新用户');
            await createNewUserInDatabase(deviceId);
        }
    } catch (error) {
        console.error('同步用户数据失败:', error);
    }
}

// 修复后的 createNewUserInDatabase 函数
async function createNewUserInDatabase(deviceId) {
    try {
        console.log('正在在数据库中创建新用户，deviceId:', deviceId);
        
        // 先检查设备ID是否已存在
        const { data: existingDevice, error: checkError } = await supabase
            .from('users')
            .select('id')
            .eq('device_id', deviceId)
            .limit(1);
            
        if (checkError) {
            console.error('检查设备ID失败:', checkError);
            throw checkError;
        }
        
        // 如果设备ID已存在，直接使用该用户
        if (existingDevice && existingDevice.length > 0) {
            console.log('设备ID已存在，使用现有用户');
            const { data: existingUser, error: fetchError } = await supabase
                .from('users')
                .select('*')
                .eq('id', existingDevice[0].id)
                .single();
                
            if (fetchError) {
                console.error('获取现有用户失败:', fetchError);
                throw fetchError;
            }
            
            if (existingUser) {
                currentUser = {
                    id: existingUser.id,
                    deviceId: existingUser.device_id,
                    name: existingUser.name,
                    contactMethod: existingUser.contact_method || 'wechat',
                    contactInfo: existingUser.contact_info || '',
                    isTaker: false,
                    autoFillContact: existingUser.auto_fill_contact !== undefined ? existingUser.auto_fill_contact : true,
                    defaultContactType: existingUser.default_contact_type || 'wechat',
                    defaultContactInfo: existingUser.default_contact_info || '',
                    defaultContactName: existingUser.default_contact_name || '',
                    defaultAddress: existingUser.default_address || '',
                    createdAt: existingUser.created_at
                };
                
                localStorage.setItem('currentUser', JSON.stringify(currentUser));
                console.log('使用现有用户:', currentUser);
                return;
            }
        }
        
        // 如果设备ID不存在，创建新用户
        const userId = 'user_' + Date.now();
        const userData = {
            device_id: deviceId,
            name: '用户' + userId.slice(-6)
        };
        
        // 只插入最基本的字段，避免列不存在的问题
        const { data, error } = await supabase
            .from('users')
            .insert([userData])
            .select();
        
        if (error) {
            // 如果是表结构错误，降级到本地模式
            if (error.code === '42703' || error.code === '42P01' || error.code === 'PGRST204') {
                console.warn('数据库表结构不完整，无法创建用户，使用本地模式');
                // 降级到本地存储
                createNewUserLocal(deviceId);
                return;
            }
            throw error;
        }
        
        if (data && data.length > 0) {
            const newUser = data[0];
            currentUser = {
                id: newUser.id,
                deviceId: newUser.device_id,
                name: newUser.name,
                contactMethod: newUser.contact_method || 'wechat',
                contactInfo: newUser.contact_info || '',
                isTaker: false,
                autoFillContact: newUser.auto_fill_contact !== undefined ? newUser.auto_fill_contact : true,
                defaultContactType: newUser.default_contact_type || 'wechat',
                defaultContactInfo: newUser.default_contact_info || '',
                defaultContactName: newUser.default_contact_name || '', // 添加默认联系人姓名
                defaultAddress: newUser.default_address || '',
                createdAt: newUser.created_at
            };
            
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            console.log('新用户创建成功:', currentUser);
        }
        
    } catch (error) {
        console.error('创建新用户失败:', error);
        // 如果数据库操作失败，回退到本地存储
        console.log('降级到本地存储模式');
        createNewUserLocal(deviceId);
    }
}

// 本地创建用户的辅助函数
function createNewUserLocal(deviceId) {
    const userId = 'user_' + Date.now();
    currentUser = {
        id: userId,
        deviceId: deviceId,
        name: '用户' + userId.slice(-6),
        contactMethod: 'wechat',
        contactInfo: '',
        isTaker: false,
        autoFillContact: true,
        defaultContactType: 'wechat',
        defaultContactInfo: '',
        defaultContactName: '', // 添加默认联系人姓名
        defaultAddress: '',
        createdAt: new Date().toISOString(),
        virtualId: getVirtualUserId(userId) // 添加虚拟ID
    };
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    console.log('本地用户创建成功:', currentUser);
}
// 保留原有的本地创建函数作为后备
function createNewUser(deviceId) {
    const userId = 'user_' + Date.now();
    currentUser = {
        id: userId,
        deviceId: deviceId,
        name: '用户' + userId.slice(-6),
        contactMethod: 'wechat',
        contactInfo: '',
        isTaker: false,
        autoFillContact: true,
        defaultContactType: 'wechat',
        defaultContactInfo: '',
        defaultContactName: '', // 添加默认联系人姓名
        defaultAddress: '',
        createdAt: new Date().toISOString()
    };
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
}


        // 保存用户信息 - 更新版本
async function saveUser(user) {
    currentUser = { ...currentUser, ...user };
    
    // 保存到本地存储
    try {
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        console.log('用户数据已保存到本地存储:', currentUser);
    } catch (error) {
        console.error('保存用户数据到本地存储失败:', error);
    }
    
    // 保存到数据库
    await saveUserToDatabase(currentUser);
    
    updateUserDisplay();
}

// 保存用户数据到数据库
// 修改 saveUserToDatabase 函数
async function saveUserToDatabase(user) {
    try {
        // 构建基础用户数据（只包含必填字段）
        const userData = {
            device_id: user.deviceId,
            name: user.name,
            contact_method: user.contactMethod,
            contact_info: user.contactInfo,
            auto_fill_contact: user.autoFillContact,
            default_contact_type: user.defaultContactType,
            default_contact_info: user.defaultContactInfo,
            default_address: user.defaultAddress,
            updated_at: new Date().toISOString()
        };

        // 尝试添加可选字段（如果表中有这些列）
        // 使用 try-catch 包装每个可选字段的添加
        try {
            if (user.defaultContactName !== undefined) {
                userData.default_contact_name = user.defaultContactName;
            }
        } catch (e) {
            console.warn('default_contact_name 列不存在，跳过该字段');
        }

        try {
            if (user.wechatBound !== undefined) {
                userData.wechat_bound = user.wechatBound === true;
            }
        } catch (e) {
            console.warn('wechat_bound 列不存在，跳过该字段');
        }

        try {
            if (user.wechatAccount) {
                userData.wechat_account = user.wechatAccount;
            }
        } catch (e) {
            console.warn('wechat_account 列不存在，跳过该字段');
        }

        try {
            if (user.alipayBound !== undefined) {
                userData.alipay_bound = user.alipayBound === true;
            }
        } catch (e) {
            console.warn('alipay_bound 列不存在，跳过该字段');
        }

        try {
            if (user.alipayAccount) {
                userData.alipay_account = user.alipayAccount;
            }
        } catch (e) {
            console.warn('alipay_account 列不存在，跳过该字段');
        }

        const { data, error } = await supabase
            .from('users')
            .upsert(userData, { 
                onConflict: 'device_id',
                ignoreDuplicates: false 
            })
            .select();
        
        if (error) {
            // 如果是列不存在的错误，降级到基本字段保存
            if (error.code === '42703' || error.message.includes('column')) {
                console.warn('数据库表结构不完整，使用基本字段保存');
                
                // 只保存基本字段
                const basicUserData = {
                    device_id: user.deviceId,
                    name: user.name,
                    contact_method: user.contactMethod,
                    contact_info: user.contactInfo,
                    updated_at: new Date().toISOString()
                };
                
                const { data: basicData, error: basicError } = await supabase
                    .from('users')
                    .upsert(basicUserData, { 
                        onConflict: 'device_id',
                        ignoreDuplicates: false 
                    })
                    .select();
                
                if (basicError) {
                    console.error('基本用户数据保存失败:', basicError);
                } else {
                    console.log('基本用户数据已保存到数据库');
                }
                return;
            }
            
            console.error('保存用户数据到数据库失败:', error);
            return;
        }
        
        console.log('用户数据已保存到数据库:', data);
        
    } catch (error) {
        console.error('保存用户数据到数据库时发生错误:', error);
    }
}

        // 更新用户显示
function updateUserDisplay() {
    if (!currentUser) return;
    
    // 生成虚拟用户ID
    const virtualUserId = getVirtualUserId(currentUser.id);
    
    // 更新首页用户信息
    const userDisplayName = document.getElementById('user-display-name');
    const userDisplayId = document.getElementById('user-display-id');
    const userAvatar = document.getElementById('user-avatar');
    
    if (userDisplayName) userDisplayName.textContent = currentUser.name;
    if (userDisplayId) userDisplayId.textContent = 'ID: ' + virtualUserId;
    if (userAvatar) userAvatar.textContent = currentUser.name.charAt(0);
    
    // 更新设置页面用户信息
    const settingsUserName = document.getElementById('settings-user-name');
    const settingsUserId = document.getElementById('settings-user-id');
    const settingsUserAvatar = document.getElementById('settings-user-avatar');
    
    if (settingsUserName) settingsUserName.textContent = currentUser.name;
    if (settingsUserId) settingsUserId.textContent = 'ID: ' + virtualUserId;
    if (settingsUserAvatar) settingsUserAvatar.textContent = currentUser.name.charAt(0);
    
    // 更新设置页面详细信息
    const displayName = document.getElementById('display-user-name');
    const displayId = document.getElementById('display-user-id');
    
    if (displayName) displayName.textContent = currentUser.name;
    if (displayId) displayId.textContent = virtualUserId; // 使用虚拟ID
    
    // 更新登录/注册/合并按钮显示
    const masterUserId = localStorage.getItem('master_user_id');
    const savedUsername = localStorage.getItem('username');
    
    const loginSection = document.getElementById('login-section');
    const registerSection = document.getElementById('register-section');
    const mergeSection = document.getElementById('merge-section');
    
    if (masterUserId && savedUsername) {
        // 已登录
        if (loginSection) loginSection.style.display = 'none';
        if (registerSection) registerSection.style.display = 'none';
        if (mergeSection) mergeSection.style.display = 'flex';
        if (displayName) displayName.textContent = savedUsername;
    } else {
        // 未登录
        if (loginSection) loginSection.style.display = 'flex';
        if (registerSection) registerSection.style.display = 'flex';
        if (mergeSection) mergeSection.style.display = 'none';
        if (displayName && currentUser) displayName.textContent = currentUser.name || '未设置';
    }
    
    // 更新默认信息设置
    document.getElementById('auto-fill-toggle').checked = currentUser.autoFillContact;
    document.getElementById('default-contact-name').value = currentUser.defaultContactName || '';
    document.getElementById('default-contact-info').value = currentUser.defaultContactInfo || '';
    document.getElementById('default-address').value = currentUser.defaultAddress || '';
    
    // 更新设置页面的默认联系方式类型
    const settingsContactBtns = document.querySelectorAll('#settings-page .contact-type-btn');
    settingsContactBtns.forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.type === currentUser.defaultContactType) {
            btn.classList.add('active');
        }
    });

    // 更新微信绑定显示
    updateWeChatBindDisplay();
    // 更新支付宝绑定显示
    updateAlipayBindDisplay();
}

// 微信绑定显示刷新
function updateWeChatBindDisplay() {
    const statusEl = document.getElementById('wechat-bind-status');
    const accountEl = document.getElementById('wechat-account-display');
    const bindBtn = document.getElementById('wechat-bind-btn');
    const unbindBtn = document.getElementById('wechat-unbind-btn');
    if (!statusEl || !accountEl || !bindBtn || !unbindBtn) return;

    const isBound = !!(currentUser && currentUser.wechatBound);
    const account = currentUser && currentUser.wechatAccount ? currentUser.wechatAccount : '';

    statusEl.textContent = isBound ? '已绑定' : '未绑定';
    accountEl.textContent = isBound ? account : '-';
    bindBtn.style.display = isBound ? 'none' : '';
    unbindBtn.style.display = isBound ? '' : 'none';
}

// 绑定微信账号（手动输入微信号；如需自动授权，后续可接入微信OAuth）
async function bindWeChatAccount() {
    try {
        const input = prompt('请输入要绑定的微信账号（至少6位，字母或数字）：');
        if (input === null) return; // 用户取消
        const wechat = String(input).trim();

        // 复用页面内的校验规则
        const wechatRegex = /^[a-zA-Z0-9]{6,}$/;
        if (!wechatRegex.test(wechat)) {
            showToast('微信账号格式不正确！请填写6位及以上的字母或数字组合。', 'error');
            return;
        }

        if (!currentUser) {
            showToast('用户未初始化，请稍后重试', 'error');
            return;
        }

        currentUser.wechatBound = true;
        currentUser.wechatAccount = wechat;
        // 若默认联系方式类型为微信且未设置默认联系方式，则自动写入
        if (currentUser.defaultContactType === 'wechat' && !currentUser.defaultContactInfo) {
            currentUser.defaultContactInfo = wechat;
        }

        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        updateWeChatBindDisplay();

        if (typeof saveUserToDatabase === 'function' && window.supabase) {
            await saveUserToDatabase(currentUser);
        }

        showToast('微信账号绑定成功', 'success');
    } catch (e) {
        console.error('绑定微信账号失败:', e);
        alert('绑定失败，请稍后重试');
    }
}

// 微信绑定显示刷新
function updateWeChatBindDisplay() {
    // 检查所有需要的元素是否存在
    const statusEl = document.getElementById('wechat-bind-status');
    const accountEl = document.getElementById('wechat-account-display');
    const bindBtn = document.getElementById('wechat-bind-btn');
    const unbindBtn = document.getElementById('wechat-unbind-btn');
    
    // 如果任何一个元素不存在，直接返回
    if (!statusEl || !accountEl || !bindBtn || !unbindBtn) return;

    const isBound = !!(currentUser && currentUser.wechatBound);
    const account = currentUser && currentUser.wechatAccount ? currentUser.wechatAccount : '';

    statusEl.textContent = isBound ? '已绑定' : '未绑定';
    accountEl.textContent = isBound ? account : '-';
    bindBtn.style.display = isBound ? 'none' : '';
    unbindBtn.style.display = isBound ? '' : 'none';
}

// 解除绑定
async function unbindWeChatAccount() {
    try {
        if (!currentUser || !currentUser.wechatBound) {
            showToast('当前未绑定微信', 'error');
            return;
        }
        showConfirmModal('确认解除绑定', '确认解除绑定当前微信账号吗？', () => {
            // 确认回调
            unbindWeChatConfirmed();
        });
        return;
    } catch (e) {
        console.error('解除微信绑定失败:', e);
        showToast('操作失败，请稍后重试', 'error');
    }
}

// 确认解除微信绑定
async function unbindWeChatConfirmed() {
    try {
        currentUser.wechatBound = false;
        currentUser.wechatAccount = '';

        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        updateWeChatBindDisplay();

        if (typeof saveUserToDatabase === 'function' && window.supabase) {
            await saveUserToDatabase(currentUser);
        }

        showToast('已解除微信绑定', 'success');
    } catch (e) {
        console.error('解除微信绑定失败:', e);
        showToast('操作失败，请稍后重试', 'error');
    }
}

// 支付宝绑定显示刷新
function updateAlipayBindDisplay() {
    // 检查所有需要的元素是否存在
    const statusEl = document.getElementById('alipay-bind-status');
    const accountEl = document.getElementById('alipay-account-display');
    const bindBtn = document.getElementById('alipay-bind-btn');
    const unbindBtn = document.getElementById('alipay-unbind-btn');
    
    // 如果任何一个元素不存在，直接返回
    if (!statusEl || !accountEl || !bindBtn || !unbindBtn) return;

    const isBound = !!(currentUser && currentUser.alipayBound);
    const account = currentUser && currentUser.alipayAccount ? currentUser.alipayAccount : '';

    statusEl.textContent = isBound ? '已绑定' : '未绑定';
    accountEl.textContent = isBound ? account : '-';
    bindBtn.style.display = isBound ? 'none' : '';
    unbindBtn.style.display = isBound ? '' : 'none';
}

// 绑定支付宝账号（手动输入）
async function bindAlipayAccount() {
    try {
        const input = prompt('请输入要绑定的支付宝账号（手机号/邮箱/支付宝UID）：');
        if (input === null) return;
        const alipay = String(input).trim();
        if (!alipay) { showToast('请输入有效的支付宝账号', 'error'); return; }
        if (!currentUser) { showToast('用户未初始化，请稍后重试', 'error'); return; }

        currentUser.alipayBound = true;
        currentUser.alipayAccount = alipay;

        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        updateAlipayBindDisplay();

        if (typeof saveUserToDatabase === 'function' && window.supabase) {
            await saveUserToDatabase(currentUser);
        }

        showToast('支付宝账号绑定成功', 'success');
    } catch (e) {
        console.error('绑定支付宝账号失败:', e);
        showToast('绑定失败，请稍后重试', 'error');
    }
}

// 解除支付宝绑定
async function unbindAlipayAccount() {
    try {
        if (!currentUser || !currentUser.alipayBound) {
            showToast('当前未绑定支付宝', 'error');
            return;
        }
        showConfirmModal('确认解除绑定', '确认解除绑定当前支付宝账号吗？', () => {
            // 确认回调
            unbindAlipayConfirmed();
        });
        return;
    } catch (e) {
        console.error('解除支付宝绑定失败:', e);
        showToast('操作失败，请稍后重试', 'error');
    }
}

// 确认解除支付宝绑定
async function unbindAlipayConfirmed() {
    try {
        currentUser.alipayBound = false;
        currentUser.alipayAccount = '';

        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        updateAlipayBindDisplay();

        if (typeof saveUserToDatabase === 'function' && window.supabase) {
            await saveUserToDatabase(currentUser);
        }

        showToast('已解除支付宝绑定', 'success');
    } catch (e) {
        console.error('解除支付宝绑定失败:', e);
        showToast('操作失败，请稍后重试', 'error');
    }
}

        // 保存默认信息 - 更新版本
async function saveDefaultInfo() {
    const autoFill = document.getElementById('auto-fill-toggle').checked;
    const contactName = document.getElementById('default-contact-name').value.trim();
    const contactInfo = document.getElementById('default-contact-info').value.trim();
    const address = document.getElementById('default-address').value;
    
    // 获取默认联系方式类型
    const activeContactBtn = document.querySelector('#settings-page .contact-type-btn.active');
    const defaultContactType = activeContactBtn ? activeContactBtn.dataset.type : 'wechat';
    
    // 验证默认联系信息
    if (contactInfo) {
        if (!validateContactInfo(defaultContactType, contactInfo)) {
            // 询问用户是否仍然保存（即使格式不正确）
            const stillSave = confirm('您填写的联系信息格式不正确，这可能会导致自动填充功能无法正常工作。\n\n您确定要继续保存吗？');
            if (!stillSave) {
                return; // 用户选择不保存
            }
        }
    }
    
    await saveUser({
        // 用户名和默认联系人姓名分开保存
        defaultContactName: contactName, // 仅保存为默认联系人姓名
        autoFillContact: autoFill,
        defaultContactType: defaultContactType,
        defaultContactInfo: contactInfo,
        defaultAddress: address
    });
    
    // 重置警告状态，让用户下次可以再次看到警告（如果需要）
    sessionStorage.removeItem('defaultContactWarningShown');

        // ========== 新增：保存成功后的视觉反馈 ==========
    const saveBtn = document.querySelector('#settings-page .settings-edit-btn');
    const originalText = saveBtn.textContent;
    saveBtn.textContent = '✓ 已保存';
    saveBtn.style.background = '#07c160';
    
    setTimeout(() => {
        saveBtn.textContent = originalText;
        saveBtn.style.background = '';
    }, 2000);
    // ========== 新增结束 ==========
    
    // ========== 新增：显示成功提示弹窗 ==========
    showSuccessModal('默认联系信息已修改', '您的默认联系信息已成功更新，将在下次发布订单时自动填充。');
    // ========== 新增结束 ==========
    
    // 不再需要弹窗提示，因为有视觉反馈了
    // alert('默认信息已保存！');
}

// 更新用户显示
function updateUserDisplay() {
    if (!currentUser) return;
    
    // 生成虚拟用户ID
    const virtualUserId = getVirtualUserId(currentUser.id);
    
    // 安全地更新元素，检查元素是否存在
    const userDisplayName = document.getElementById('user-display-name');
    if (userDisplayName) userDisplayName.textContent = currentUser.name;
    
    const userDisplayId = document.getElementById('user-display-id');
    if (userDisplayId) userDisplayId.textContent = 'ID: ' + virtualUserId;
    
    const userAvatar = document.getElementById('user-avatar');
    if (userAvatar) userAvatar.textContent = currentUser.name.charAt(0);
    
    // 更新设置页面用户信息
    const settingsUserName = document.getElementById('settings-user-name');
    if (settingsUserName) settingsUserName.textContent = currentUser.name;
    
    const settingsUserId = document.getElementById('settings-user-id');
    if (settingsUserId) settingsUserId.textContent = 'ID: ' + virtualUserId;
    
    const settingsUserAvatar = document.getElementById('settings-user-avatar');
    if (settingsUserAvatar) settingsUserAvatar.textContent = currentUser.name.charAt(0);
    
    // 更新设置页面详细信息
    const displayUserName = document.getElementById('display-user-name');
    if (displayUserName) displayUserName.textContent = currentUser.name;
    
    const displayUserId = document.getElementById('display-user-id');
    if (displayUserId) displayUserId.textContent = virtualUserId; // 使用虚拟ID
    
    // 更新默认信息设置
    const autoFillToggle = document.getElementById('auto-fill-toggle');
    if (autoFillToggle) autoFillToggle.checked = currentUser.autoFillContact;
    
    const defaultContactName = document.getElementById('default-contact-name');
    if (defaultContactName) defaultContactName.value = currentUser.defaultContactName || '';
    
    const defaultContactInfo = document.getElementById('default-contact-info');
    if (defaultContactInfo) defaultContactInfo.value = currentUser.defaultContactInfo || '';
    
    const defaultAddress = document.getElementById('default-address');
    if (defaultAddress) defaultAddress.value = currentUser.defaultAddress || '';
    
    // 更新设置页面的默认联系方式类型
    const settingsContactBtns = document.querySelectorAll('#settings-page .contact-type-btn');
    settingsContactBtns.forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.type === currentUser.defaultContactType) {
            btn.classList.add('active');
        }
    });

    // 更新微信绑定显示
    updateWeChatBindDisplay();
    // 更新支付宝绑定显示
    updateAlipayBindDisplay();
}

        // 自动填充联系信息
function autoFillContactInfo() {
    console.log('=== 自动填充调试信息 ===');
    console.log('currentUser:', currentUser);
    console.log('autoFillContact:', currentUser?.autoFillContact);
    console.log('defaultContactInfo:', currentUser?.defaultContactInfo);
    console.log('defaultContactType:', currentUser?.defaultContactType);
    
    if (!currentUser) {
        console.log('❌ 自动填充失败：用户未登录');
        return false;
    }
    
    if (!currentUser.autoFillContact) {
        console.log('❌ 自动填充失败：自动填充功能未开启');
        return false;
    }
    
    if (!currentUser.defaultContactInfo) {
        console.log('❌ 自动填充失败：默认联系信息为空');
        return false;
    }
    
    console.log('尝试自动填充联系信息', currentUser);
    
    try {
        let filledCount = 0;
        
        // 检查默认联系信息是否有效
        const isDefaultContactValid = validateDefaultContactInfo();
        if (!isDefaultContactValid) {
            console.log('默认联系信息不符合规范，跳过自动填充');
            // 不再显示警告，而是直接尝试填充
            // showDefaultContactWarning();
            // return false;
        }
        
        // 填充代取快递发布页
        if (currentUser.defaultContactInfo) {
            const contactInfoInput = document.getElementById('contact-info');
            const errandContactInfoInput = document.getElementById('errand-contact-info');
            
            if (contactInfoInput) {
                contactInfoInput.value = currentUser.defaultContactInfo;
                console.log('已填充代取快递联系信息');
                filledCount++;
            }
            
            if (errandContactInfoInput) {
                errandContactInfoInput.value = currentUser.defaultContactInfo;
                console.log('已填充跑腿任务联系信息');
                filledCount++;
            }
        }
        
        // 填充代取快递领取页
        const takerContactInfoInput = document.getElementById('taker-contact-info');
        if (takerContactInfoInput) {
            takerContactInfoInput.value = currentUser.defaultContactInfo || '';
            console.log('已填充代取快递领取页联系信息');
            filledCount++;
        }
        
        // 填充跑腿领取页
        const errandTakerContactInfoInput = document.getElementById('errand-taker-contact-info');
        if (errandTakerContactInfoInput) {
            errandTakerContactInfoInput.value = currentUser.defaultContactInfo || '';
            console.log('已填充跑腿领取页联系信息');
            filledCount++;
        }
        
        // 填充姓名
        if (currentUser.defaultContactName) {
            // 如果有默认联系人姓名，优先使用
            const contactName = document.getElementById('contact-name');
            const errandContactName = document.getElementById('errand-contact-name');
            const takerName = document.getElementById('taker-name');
            const errandTakerName = document.getElementById('errand-taker-name');
            
            if (contactName) {
                contactName.value = currentUser.defaultContactName;
                filledCount++;
                console.log('已使用默认联系人姓名填充 contact-name');
            }
            
            if (errandContactName) {
                errandContactName.value = currentUser.defaultContactName;
                filledCount++;
                console.log('已使用默认联系人姓名填充 errand-contact-name');
            }
            
            if (takerName) {
                takerName.value = currentUser.defaultContactName;
                filledCount++;
                console.log('已使用默认联系人姓名填充 taker-name');
            }
            
            if (errandTakerName) {
                errandTakerName.value = currentUser.defaultContactName;
                filledCount++;
                console.log('已使用默认联系人姓名填充 errand-taker-name');
            }
            console.log('已使用默认联系人姓名填充');
        } else if (currentUser.name) {
            // 否则使用用户名
            const contactName = document.getElementById('contact-name');
            const errandContactName = document.getElementById('errand-contact-name');
            const takerName = document.getElementById('taker-name');
            const errandTakerName = document.getElementById('errand-taker-name');
            
            if (contactName) {
                contactName.value = currentUser.name;
                filledCount++;
                console.log('已使用用户名填充 contact-name');
            }
            
            if (errandContactName) {
                errandContactName.value = currentUser.name;
                filledCount++;
                console.log('已使用用户名填充 errand-contact-name');
            }
            
            if (takerName) {
                takerName.value = currentUser.name;
                filledCount++;
                console.log('已使用用户名填充 taker-name');
            }
            
            if (errandTakerName) {
                errandTakerName.value = currentUser.name;
                filledCount++;
                console.log('已使用用户名填充 errand-taker-name');
            }
            console.log('已使用用户名填充');
        }
        
        // 填充地址
        if (currentUser.defaultAddress) {
            const deliveryAddress = document.getElementById('delivery-address');
            const errandDelivery = document.getElementById('errand-delivery');
            
            if (deliveryAddress) {
                deliveryAddress.value = currentUser.defaultAddress;
                filledCount++;
                console.log('已填充默认地址到 delivery-address');
            }
            
            if (errandDelivery) {
                errandDelivery.value = currentUser.defaultAddress;
                filledCount++;
                console.log('已填充默认地址到 errand-delivery');
            }
            console.log('已填充默认地址');
        }
        
        // 填充联系方式类型
        const contactTypeBtns = document.querySelectorAll('.contact-type-btn');
        contactTypeBtns.forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.type === currentUser.defaultContactType) {
                btn.classList.add('active');
            }
        });
        console.log('自动填充联系信息完成，共填充了', filledCount, '个字段');
        return filledCount > 0;
        
    } catch (error) {
        console.error('自动填充过程中发生错误:', error);
        return false;
    }
}

// 显示默认联系信息不符合规范的警告
function showDefaultContactWarning() {
    // 检查是否已经在当前会话中显示过警告
    const warningShown = sessionStorage.getItem('defaultContactWarningShown');
    if (warningShown) {
        return; // 已经显示过，不再重复显示
    }
    
    const userChoice = confirm(
        '⚠️ 默认联系信息不符合规范\n\n' +
        '您的默认联系信息格式不正确，自动填充功能已禁用。\n\n' +
        '点击"确定"跳转到设置页面修改默认信息\n' +
        '点击"取消"继续手动填写当前表单'
    );
    
    if (userChoice) {
        // 用户选择跳转到设置页面
        sessionStorage.setItem('defaultContactWarningShown', 'true');
        showPage('settings-page');
        
        // 延迟聚焦到默认联系信息输入框
        setTimeout(() => {
            const contactInput = document.getElementById('default-contact-info');
            if (contactInput) {
                contactInput.focus();
                contactInput.select(); // 选中文本，方便用户修改
            }
        }, 500);
    } else {
        // 用户选择暂时不修改，标记已显示过警告
        sessionStorage.setItem('defaultContactWarningShown', 'true');
    }
}
// 验证默认联系信息是否有效
function validateDefaultContactInfo() {
    if (!currentUser.defaultContactInfo || !currentUser.defaultContactType) {
        return false;
    }
    
    const contactType = currentUser.defaultContactType;
    const contactInfo = currentUser.defaultContactInfo.trim();
    
    if (contactType === 'wechat') {
        // 微信：6位字符及以上（字母、数字，可以组合）
        const wechatRegex = /^[a-zA-Z0-9]{6,}$/;
        return wechatRegex.test(contactInfo);
    } else if (contactType === 'phone') {
        // 手机号：11位数字，覆盖所有运营商号段
        const phoneRegex = /^1(3[0-9]|4[0-9]|5[0-9]|6[0-9]|7[0-9]|8[0-9]|9[0-9])[0-9]{8}$/;
        return phoneRegex.test(contactInfo);
    } else if (contactType === 'qq') {
        // QQ：6-10位数字
        const qqRegex = /^[0-9]{6,10}$/;
        return qqRegex.test(contactInfo);
    }
    
    return false;
}
        // 联系方式类型选择
function initContactTypeSelectors() {
    document.querySelectorAll('.contact-type-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            // 移除同组其他按钮的active类
            const parent = this.closest('.contact-type-selector');
            parent.querySelectorAll('.contact-type-btn').forEach(b => {
                b.classList.remove('active');
            });
            // 为当前按钮添加active类
            this.classList.add('active');
            
            // ========== 新增：在设置页面切换类型时更新验证状态 ==========
            if (parent.closest('#settings-page')) {
                updateDefaultContactValidity();
            }
            // ========== 新增结束 ==========
        });
    });
}

        // 获取当前选中的联系方式类型
        function getSelectedContactType(containerId) {
            const selector = document.querySelector(`#${containerId} .contact-type-btn.active`);
            return selector ? selector.dataset.type : 'wechat';
        }

        // 处理物品类型变化
        function handleItemTypeChange() {
            const itemTypeSelect = document.getElementById('item-type');
            const otherContainer = document.getElementById('other-item-container');
            
            if (itemTypeSelect.value === '其它') {
                // 如果已经存在输入框，就不重复添加
                if (!otherContainer.querySelector('input')) {
                    const input = document.createElement('input');
                    input.type = 'text';
                    input.id = 'other-item-name';
                    input.className = 'form-input';
                    input.placeholder = '请输入具体物品名称';
                    input.required = true;
                    otherContainer.appendChild(input);
                }
                otherContainer.style.display = 'block';
            } else {
                otherContainer.style.display = 'none';
                // 移除输入框，避免提交时获取到值
                const input = otherContainer.querySelector('input');
                if (input) {
                    input.remove();
                }
            }
        }

        // 进入代取快递服务
        function enterDeliveryService() {
            document.getElementById('navbar-title').textContent = '代取快递服务';
            showPage('delivery-home-page');
            renderDeliveryOrders();
        }

        // 进入跑腿服务
        function enterErrandService() {
            document.getElementById('navbar-title').textContent = '校园跑腿服务';
            showPage('errand-home-page');
            renderErrandOrders();
        }

        // 获取所有订单（代取快递）
        async function getDeliveryOrders() {
            console.log('=== getDeliveryOrders 开始执行 ===');
            
            // 检查 supabase 客户端是否已初始化
            if (!supabase) {
                console.error('Supabase 客户端未初始化');
                return [];
            }
            
            try {
                console.log('开始从数据库查询代取订单...');
                const { data, error } = await supabase
                    .from('delivery_orders')
                    .select('*')
                    .order('created_at', { ascending: false });
                
                if (error) {
                    console.error('Supabase 查询错误:', error);
                    throw error;
                }
                
                const result = data || [];
                console.log('从数据库获取到代取订单数量:', result.length);
                
                // 检查订单数据的有效性
                if (result.length > 0) {
                    console.log('第一个订单样本:', result[0]);
                }
                
                console.log('=== getDeliveryOrders 执行完成 ===');
                return result;
            } catch (error) {
                console.error('获取代取订单失败:', error);
                console.error('错误详情:', error.message);
                console.error('=== getDeliveryOrders 执行失败 ===');
                // 返回空数组而不是抛出错误，以避免整个渲染流程中断
                return [];
            }
        }

        // 获取所有跑腿任务
        async function getErrandOrders() {
            try {
                const { data, error } = await supabase
                    .from('errand_orders')
                    .select('*')
                    .order('created_at', { ascending: false });
                
                if (error) throw error;
                return data || [];
            } catch (error) {
                console.error('获取跑腿任务失败:', error);
                throw error;
            }
        }

        // 保存订单
        async function saveOrder(order) {
            try {
                console.log('正在保存订单到数据库...', order);
                
                const orderData = {
                    delivery_time: new Date(order.deliveryTime).toISOString(),
                    pickup_address: order.pickupAddress,
                    delivery_address: order.deliveryAddress,
                    pickup_code: order.pickupCode,
                    contact_name: order.contactName,
                    contact_info: order.contactInfo,
                    contact_type: order.contactType,
                    reward: parseFloat(order.reward),
                    notes: order.notes,
                    status: 'pending',
                    created_by: order.createdBy
                };
                
                console.log('转换后的订单数据:', orderData);
                
                const { data, error } = await supabase
                    .from('delivery_orders')
                    .insert([orderData])
                    .select();
                
                if (error) {
                    console.error('数据库插入错误:', error);
                    console.error('错误详情:', error.details);
                    console.error('错误提示:', error.message);
                    console.error('错误代码:', error.code);
                    throw error;
                }
                
                console.log('订单保存成功，返回数据:', data);
                return data[0];
                
            } catch (error) {
                console.error('保存订单完整错误:', error);
                throw error;
            }
        }

        // 保存跑腿任务
        async function saveErrandOrder(order) {
            try {
                console.log('正在保存跑腿任务到数据库...', order);
                
                const orderData = {
                    title: order.title,
                    description: order.description,
                    pickup_location: order.pickupLocation,
                    delivery_location: order.deliveryLocation,
                    deadline: new Date(order.deadline).toISOString(),
                    reward: parseFloat(order.reward),
                    contact_name: order.contactName,
                    contact_info: order.contactInfo,
                    contact_type: order.contactType,
                    notes: order.notes,
                    status: 'pending',
                    created_by: order.createdBy
                };
                
                console.log('转换后的跑腿任务数据:', orderData);
                
                const { data, error } = await supabase
                    .from('errand_orders')
                    .insert([orderData])
                    .select();
                
                if (error) {
                    console.error('数据库插入错误:', error);
                    console.error('错误详情:', error.details);
                    console.error('错误提示:', error.message);
                    console.error('错误代码:', error.code);
                    throw error;
                }
                
                console.log('跑腿任务保存成功，返回数据:', data);
                return data[0];
            } catch (error) {
                console.error('保存跑腿任务完整错误:', error);
                throw error;
            }
        }

        // 更新订单
        async function updateOrder(orderId, updates) {
            try {
                const updateData = {
                    ...updates,
                    updated_at: new Date().toISOString()
                };
                
                const { data, error } = await supabase
                    .from('delivery_orders')
                    .update(updateData)
                    .eq('id', orderId)
                    .select();
                
                if (error) throw error;
                return data[0];
            } catch (error) {
                console.error('更新订单失败:', error);
                throw error;
            }
        }

        // 更新跑腿任务
        async function updateErrandOrder(orderId, updates) {
            try {
                const updateData = {
                    ...updates,
                    updated_at: new Date().toISOString()
                };
                
                const { data, error } = await supabase
                    .from('errand_orders')
                    .update(updateData)
                    .eq('id', orderId)
                    .select();
                
                if (error) throw error;
                return data[0];
            } catch (error) {
                console.error('更新跑腿任务失败:', error);
                throw error;
            }
        }

// 修复后的渲染代取快递订单函数
async function renderDeliveryOrders() {
    const ordersList = document.getElementById('delivery-orders-list');
    
    try {
        // 1. 显示加载动画
        ordersList.innerHTML = `<div class="loading"><i class="fas fa-spinner fa-spin"></i> 加载中...</div>`;
        
        const timerName = 'renderDeliveryOrders_' + Date.now();
        console.time(timerName);
        
        // 2. 获取所有快递订单
        const orders = await getCachedDeliveryOrders();
        
        // 3. 筛选出与当前用户相关的订单
        const myOrders = orders.filter(order => 
            order.created_by === currentUser.id || order.taken_by === currentUser.id
        );
        
        // 更新首页统计数据
        updateMainPageStats();
        
        // 4. 如果没有订单，显示空状态
        if (myOrders.length === 0) {
            ordersList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-inbox"></i>
                    <p>您还没有发布或接取任何代取订单</p>
                </div>
            `;
            return;
        }
        
        // 5. 使用简单的并行查询获取未读消息数
        const unreadCounts = await getAllUnreadMessageCountsSimple('delivery');
        
        console.timeEnd(timerName);
        
        // 6. 清空列表，准备渲染最终结果
        ordersList.innerHTML = '';
        
        // 7. 循环处理好的订单数据，生成HTML并添加到页面
        myOrders.forEach(order => {
            const unreadCount = unreadCounts[order.id] || 0;
            const orderItemHTML = createDeliveryOrderItemHTML(order, unreadCount);
            ordersList.insertAdjacentHTML('beforeend', orderItemHTML);
        });
        
    } catch (error) {
        console.error('渲染代取订单失败:', error);
        ordersList.innerHTML = `
            <div class="error-message">
                <i class="fas fa-exclamation-triangle"></i>
                <p>加载代取订单失败: ${error.message}</p>
            </div>
        `;
    }
}

// 修复后的批量获取未读消息函数
async function getAllUnreadMessageCounts(orderType) {
    try {
        // 获取当前用户相关的所有订单
        const [deliveryOrders, errandOrders] = await Promise.all([
            getCachedDeliveryOrders(),
            getCachedErrandOrders()
        ]);
        
        const myDeliveryOrders = deliveryOrders.filter(order => 
            order.created_by === currentUser.id || order.taken_by === currentUser.id
        );
        
        const myErrandOrders = errandOrders.filter(order => 
            order.created_by === currentUser.id || order.taken_by === currentUser.id
        );
        
        const allOrders = [...myDeliveryOrders, ...myErrandOrders];
        const targetOrders = allOrders.filter(order => 
            (orderType === 'delivery' && !order.title) || 
            (orderType === 'errand' && order.title)
        );
        
        if (targetOrders.length === 0) {
            return {};
        }
        
        const unreadCounts = {};
        
        // 方法1：使用并行查询（推荐）
        const unreadPromises = targetOrders.map(async (order) => {
            try {
                const count = await getUnreadMessageCount(order.id, orderType);
                return { orderId: order.id, count };
            } catch (error) {
                console.error(`获取订单 ${order.id} 未读消息失败:`, error);
                return { orderId: order.id, count: 0 };
            }
        });
        
        const results = await Promise.all(unreadPromises);
        
        // 转换为 { orderId: count } 格式
        results.forEach(result => {
            unreadCounts[result.orderId] = result.count;
        });
        
        return unreadCounts;
        
    } catch (error) {
        console.error('批量获取未读消息异常:', error);
        return {};
    }
}

// 或者使用更简单的修复方法 - 直接使用现有的 getUnreadMessageCount 函数
async function getAllUnreadMessageCountsSimple(orderType) {
    try {
        const orders = orderType === 'delivery' ? 
            await getCachedDeliveryOrders() : 
            await getCachedErrandOrders();
        
        const myOrders = orders.filter(order => 
            order.created_by === currentUser.id || order.taken_by === currentUser.id
        );
        
        const unreadCounts = {};
        
        // 使用现有的 getUnreadMessageCount 函数，但并行执行
        const promises = myOrders.map(async (order) => {
            const count = await getUnreadMessageCount(order.id, orderType);
            return { orderId: order.id, count };
        });
        
        const results = await Promise.all(promises);
        
        results.forEach(result => {
            unreadCounts[result.orderId] = result.count;
        });
        
        return unreadCounts;
        
    } catch (error) {
        console.error('批量获取未读消息失败:', error);
        return {};
    }
}

// 修改 createDeliveryOrderItemHTML 函数，接受 unreadCount 参数
function createDeliveryOrderItemHTML(order, unreadCount = 0) {
    // 保持原有逻辑，但使用传入的 unreadCount
    let statusClass = '';
    let statusText = '';

    switch(order.status) {
        case 'pending': statusClass = 'status-pending'; statusText = '待接单'; break;
        case 'taken': statusClass = 'status-taken'; statusText = '已接单'; break;
        case 'processing': statusClass = 'status-processing'; statusText = '配送中'; break;
        case 'delivered': statusClass = 'status-delivered'; statusText = '已送达'; break;
        case 'completed': statusClass = 'status-completed'; statusText = '已完成'; break;
        case 'cancelled': statusClass = 'status-cancelled'; statusText = '已取消'; break;
    }

    const isMyOrder = order.created_by === currentUser.id;
    const orderType = isMyOrder ? '我发布的' : '我接取的';

    const orderIdClass = unreadCount > 0 ? 'order-id has-unread' : 'order-id';

    let orderHTML = `
        <div class="order-item ${unreadCount > 0 ? 'chat-order-unread' : ''}" onclick="viewOrderDetails('${order.id}', 'delivery')">
            <div class="order-header">
                <div class="${orderIdClass}">
                    ${order.id.slice(-8)}
                    <span class="order-type-tag">${orderType}</span>
                    ${unreadCount > 0 ? `<span class="unread-badge" title="${unreadCount}条未读消息">${unreadCount > 99 ? '99+' : unreadCount}</span>` : ''}
                </div>
                <div class="order-status ${statusClass}">${statusText}</div>
            </div>
            <div class="order-details">
                <div class="order-detail"><strong>取件地址:</strong> ${order.pickup_address}</div>
                <div class="order-detail"><strong>送达地址:</strong> ${order.delivery_address}</div>
                <div class="order-detail"><strong>酬劳:</strong> ${order.reward}元</div>
            </div>
            <div class="order-actions" onclick="event.stopPropagation();">
    `;

    // 添加操作按钮
    if (order.status === 'taken' || order.status === 'processing' || order.status === 'delivered') {
        if (order.created_by === currentUser.id || order.taken_by === currentUser.id) {
            const badgeHTML = unreadCount > 0 ? `<span class="chat-btn-badge">${unreadCount > 99 ? '99+' : unreadCount}</span>` : '';
            orderHTML += `<button class="action-btn btn-chat" onclick="openChat('${order.id}', 'delivery')">联系对方 ${badgeHTML}</button>`;
        }
    }
    if (order.status === 'taken' && order.taken_by === currentUser.id) {
        orderHTML += `<button class="action-btn btn-processing" onclick="startDelivery('${order.id}', 'delivery')">开始配送</button>`;
    }
    if (order.status === 'processing' && order.taken_by === currentUser.id) {
        orderHTML += `<button class="action-btn btn-delivered" onclick="markAsDelivered('${order.id}', 'delivery')">已送达</button>`;
    }
    if (order.status === 'delivered' && order.created_by === currentUser.id) {
        orderHTML += `<button class="action-btn btn-confirm" onclick="confirmCompletion('${order.id}', 'delivery')">确认完成</button>`;
    }
    if ((order.status === 'taken' || order.status === 'pending') && order.created_by === currentUser.id) {
        orderHTML += `<button class="action-btn btn-cancel" onclick="cancelOrder('${order.id}', 'delivery')">取消订单</button>`;
    }

    // ====================== 核心修改部分 ======================

    // 【解决问题一】为已完成或已取消的订单添加"删除"按钮
    if ((order.status === 'completed' || order.status === 'cancelled') && order.created_by === currentUser.id) {
        orderHTML += `<button class="action-btn btn-delete" onclick="deleteOrder('${order.id}', 'delivery')">删除订单</button>`;
    }

    // 【解决问题二】统一添加"查看详情"按钮，使其在所有状态下都可见
    orderHTML += `<button class="action-btn btn-secondary" onclick="viewOrderDetails('${order.id}', 'delivery')">查看详情</button>`;

    // ========================================================

    orderHTML += `
            </div>
        </div>
    `;

    return orderHTML;
}



// 渲染跑腿任务 - 添加加载动画
async function renderErrandOrders() {
    const ordersList = document.getElementById('errand-orders-list');
    
    try {
        ordersList.innerHTML = `<div class="loading"><i class="fas fa-spinner fa-spin"></i> 加载中...</div>`;
        
        const timerName = 'renderErrandOrders_' + Date.now();
        console.time(timerName);
        
        // 使用批量查询
        const [orders, unreadCounts] = await Promise.all([
            getCachedErrandOrders(),
            getAllUnreadMessageCounts('errand')
        ]);
        
        console.timeEnd(timerName);
        
        // 筛选当前用户的订单
        const myOrders = orders.filter(order => 
            order.created_by === currentUser.id || order.taken_by === currentUser.id
        );
        
        // 更新首页统计数据
        updateMainPageStats();
        
        if (myOrders.length === 0) {
            ordersList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-tasks"></i>
                    <p>您还没有发布或接取任何跑腿任务</p>
                </div>
            `;
            return;
        }
        
        for (const order of myOrders) {
            const unreadCount = await getUnreadMessageCount(order.id, 'errand');
            const orderItem = document.createElement('div');
            orderItem.className = 'order-item errand-item';
            if (unreadCount > 0) {
                orderItem.classList.add('chat-order-unread');
            }
            
            let statusClass = '';
            let statusText = '';
            
            switch(order.status) {
                case 'pending':
                    statusClass = 'status-pending';
                    statusText = '待接单';
                    break;
                case 'taken':
                    statusClass = 'status-taken';
                    statusText = '已接单';
                    break;
                case 'processing':
                    statusClass = 'status-processing';
                    statusText = '配送中';
                    break;
                case 'delivered':
                    statusClass = 'status-delivered';
                    statusText = '已送达';
                    break;
                case 'completed':
                    statusClass = 'status-completed';
                    statusText = '已完成';
                    break;
                case 'cancelled':
                    statusClass = 'status-cancelled';
                    statusText = '已取消';
                    break;
            }
            
            // 判断任务类型
            const isMyOrder = order.created_by === currentUser.id;
            const orderType = isMyOrder ? '我发布的' : '我接取的';
            
            let hasRated = false;
                if (order.status === 'completed') {
                hasRated = await checkIfRated(order.id, 'errand');
            }
            
            orderItem.innerHTML = `
                <div class="order-header">
                    <div class="order-id errand-id">
                        ${order.id.slice(-8)}
                        <span class="order-type-tag">${orderType}</span>
                        ${unreadCount > 0 ? `<span class="unread-badge">${unreadCount}</span>` : ''}
                    </div>
                    <div class="order-status ${statusClass}">${statusText}</div>
                </div>
                <div class="order-details">
    <div class="order-detail"><strong>任务:</strong> ${order.title}</div>
    <div class="order-detail"><strong>描述:</strong> ${order.description}</div>
    <div class="order-detail"><strong>取物地点:</strong> ${order.pickup_location}</div>
    <div class="order-detail"><strong>送达地点:</strong> ${order.delivery_location}</div>
    <div class="order-detail"><strong>酬劳:</strong> ${order.reward}元</div>
    <div class="order-detail"><strong>状态:</strong> ${statusText}</div>
    
    ${order.taken_by ? `
        <div class="order-detail"><strong>接单人:</strong> ${order.taker_name || '未知用户'}</div>
        <div class="order-detail"><strong>联系人:</strong> ${order.contact_name}</div>
        <div class="order-detail"><strong>联系方式:</strong> ${order.contact_info}</div>
    ` : `
        <div class="order-detail"><strong>联系人:</strong> ${order.contact_name}</div>
        <div class="order-detail"><strong>联系方式:</strong> <span style="color: #999;">接单后显示</span></div>
    `}
</div>
                <div class="order-actions">
                    ${order.status === 'taken' && (order.created_by === currentUser.id || order.taken_by === currentUser.id) ? 
                        `<button class="action-btn btn-chat" onclick="openChat('${order.id}', 'errand')" style="position: relative;">
                            联系对方${unreadCount > 0 ? `<span class="chat-btn-badge">${unreadCount > 99 ? '99+' : unreadCount}</span>` : ''}
                         </button>` : ''}
                    ${(order.status === 'taken' || order.status === 'processing' || order.status === 'delivered') && order.created_by === currentUser.id ?
                        `<button class="action-btn btn-primary" onclick="openPaymentModal('${order.id}', 'errand', ${order.reward})">去支付</button>` : ''}
                    
                    ${order.status === 'taken' && order.taken_by === currentUser.id ? 
                        `<button class="action-btn btn-processing" onclick="startDelivery('${order.id}', 'errand')">开始任务</button>` : ''}
                    
                    ${order.status === 'processing' && order.taken_by === currentUser.id ? 
                        `<button class="action-btn btn-delivered" onclick="markAsDelivered('${order.id}', 'errand')">已送达</button>` : ''}
                    
                    ${order.status === 'delivered' && order.created_by === currentUser.id ? 
                        `<button class="action-btn btn-confirm" onclick="confirmCompletion('${order.id}', 'errand')">确认完成</button>` : ''}
                    
                    ${order.status === 'completed' ? 
                        `<button class="action-btn btn-rate" onclick="rateOrder('${order.id}', 'errand')">评价</button>` : ''}
                    
                    ${order.status === 'taken' && order.taken_by === currentUser.id ? 
                        `<button class="action-btn btn-cancel" onclick="cancelTakeOrder('${order.id}', 'errand')">取消接单</button>` : ''}
                    
                    ${(order.status === 'taken' || order.status === 'pending') && order.created_by === currentUser.id ? 
                        `<button class="action-btn btn-cancel" onclick="cancelOrder('${order.id}', 'errand')">取消订单</button>` : ''}
                    ${order.status === 'cancelled' && order.created_by === currentUser.id ? 
                        `<button class=\"action-btn btn-cancel\" onclick=\"deleteOrder('${order.id}', 'errand')\">删除订单</button>` : ''}
                    
                    <button class="action-btn btn-secondary" onclick="viewOrderDetails('${order.id}', 'errand')">查看详情</button>
                </div>
            `;
            
            orderItem.onclick = function(e) {
                if (!e.target.classList.contains('action-btn')) {
                    viewOrderDetails(order.id, 'errand');
                }
            };
            ordersList.appendChild(orderItem);
        }
        
    } catch (error) {
        ordersList.innerHTML = `
            <div class="error-message">
                <i class="fas fa-exclamation-triangle"></i>
                <p>加载跑腿任务失败: ${error.message}</p>
            </div>
        `;
    }
}

        // 更新首页统计数据
        async function updateMainPageStats() {
            try {
                // 使用带缓存的函数获取订单数据
                const [deliveryOrders, errandOrders] = await Promise.all([
                    getCachedDeliveryOrders(),
                    getCachedErrandOrders()
                ]);
                
                const myDeliveryOrders = deliveryOrders.filter(order => 
                    order.created_by === currentUser.id || order.taken_by === currentUser.id
                );
                
                const myErrandOrders = errandOrders.filter(order => 
                    order.created_by === currentUser.id || order.taken_by === currentUser.id
                );
                
                const totalOrders = myDeliveryOrders.length + myErrandOrders.length;
                const completedDelivery = myDeliveryOrders.filter(order => order.status === 'completed').length;
                const completedErrand = myErrandOrders.filter(order => order.status === 'completed').length;
                const totalCompleted = completedDelivery + completedErrand;
                
                document.getElementById('my-orders-count').textContent = totalOrders;
                document.getElementById('completed-orders-count').textContent = totalCompleted;
            } catch (error) {
                console.error('更新首页统计失败:', error);
            }
        }

        // 渲染可接取的代取订单
        async function renderAvailableOrders() {
            console.log('=== renderAvailableOrders 开始执行 ===');
            
            // === 新增代码开始 ===
            // 添加用户状态检查
            if (!currentUser) {
                console.log('用户未初始化，等待初始化...');
                const ordersList = document.getElementById('available-orders-list');
                if (ordersList) {
                    ordersList.innerHTML = `
                        <div class="loading">
                            <i class="fas fa-spinner fa-spin"></i> 初始化用户信息...
                        </div>
                    `;
                }
                
                // 等待用户初始化
                await new Promise(resolve => {
                    const checkUser = setInterval(() => {
                        if (currentUser) {
                            clearInterval(checkUser);
                            resolve();
                        }
                    }, 100);
                    
                    // 10秒超时
                    setTimeout(() => {
                        clearInterval(checkUser);
                        resolve();
                    }, 10000);
                });
            }
            // === 新增代码结束 ===
            
            // 原有的函数逻辑继续执行...
            console.log('当前用户:', currentUser ? `${currentUser.name} (ID: ${currentUser.id})` : '未登录');
            
            // 添加刷新按钮动画
            const refreshBtn = document.querySelector('.btn-icon');
            if (refreshBtn) {
                refreshBtn.classList.add('spinning');
                setTimeout(() => {
                    refreshBtn.classList.remove('spinning');
                }, 1000);
            }
            
            const ordersList = document.getElementById('available-orders-list');
            
            if (!ordersList) {
                console.error('找不到 available-orders-list 元素');
                return;
            }
            
            console.log('找到订单列表元素，当前内容:', ordersList.innerHTML);
            
            // 确保用户已登录
            console.log('检查用户登录状态:', !!currentUser);
            if (currentUser) {
                console.log('已登录用户信息:', {
                    id: currentUser.id,
                    name: currentUser.name,
                    deviceId: currentUser.deviceId
                });
            }
            
            if (!currentUser) {
                console.error('用户未登录，无法加载订单');
                console.log('等待用户初始化完成...');
                
                // 尝试等待用户初始化完成
                setTimeout(() => {
                    console.log('延迟后检查用户状态:', !!currentUser);
                    if (currentUser) {
                        console.log('用户已初始化，重新加载数据');
                        renderAvailableOrders();
                    } else {
                        ordersList.innerHTML = `
                            <div class="error-message">
                                <i class="fas fa-exclamation-triangle"></i>
                                <p>请先登录后再查看订单</p>
                            </div>
                        `;
                    }
                }, 1000);
                return;
            }
            
            try {
                // 显示加载状态
                console.log('显示加载状态...');
                ordersList.innerHTML = `
                    <div class="loading">
                        <i class="fas fa-spinner fa-spin"></i> 加载订单中...
                    </div>
                `;
                
                // 使用带缓存的函数获取订单数据
                console.log('开始获取订单数据...');
                console.log('调用 getCachedDeliveryOrders()...');
                const orders = await getCachedDeliveryOrders();
                console.log('获取到代取订单数量:', orders.length);
                console.log('订单数据类型:', typeof orders);
                console.log('是否为数组:', Array.isArray(orders));
                
                // 清空容器
                ordersList.innerHTML = '';
                console.log('已清空订单列表容器');
                
                // 过滤出状态为 pending 且不是当前用户发布的订单
                const availableOrders = orders.filter(order => {
                    const isPending = order.status === 'pending';
                    const notMyOrder = order.created_by !== currentUser.id;
                    console.log(`订单 ${order.id} 检查: 状态=${order.status}, pending=${isPending}, 我的订单=${!notMyOrder}`);
                    return isPending && notMyOrder;
                });
                
                console.log('可接取的代取订单数量:', availableOrders.length);
                console.log('可接取订单详情:', availableOrders);
                
                if (availableOrders.length === 0) {
                    console.log('没有可接取的订单，显示空状态');
                    ordersList.innerHTML = `
                        <div class="empty-state">
                            <i class="fas fa-box-open"></i>
                            <p>暂无可接取的订单</p>
                        </div>
                    `;
                    return;
                }
                
                // 渲染订单列表
                console.log('开始渲染订单列表...');
                let orderCount = 0;
                
                availableOrders.forEach(order => {
                    console.log(`正在渲染订单: ${order.id}`);
                    const orderItem = document.createElement('div');
                    orderItem.className = 'order-item';
                    
                    orderItem.innerHTML = `
                        <div class="order-header">
                            <div class="order-id">${order.id.slice(-8)}</div>
                            <div class="order-status status-pending">待接单</div>
                        </div>
                        <div class="order-details">
                            <div class="order-detail"><strong>取件地址:</strong> ${order.pickup_address}</div>
                            <div class="order-detail"><strong>送达地址:</strong> ${order.delivery_address}</div>
                            <div class="order-detail"><strong>期望时间:</strong> ${new Date(order.delivery_time).toLocaleString()}</div>
                            <div class="order-detail"><strong>酬劳:</strong> ${order.reward}元</div>
                        </div>
                        <div class="order-actions">
                            <button class="action-btn btn-take" data-id="${order.id}">接单</button>
                            <button class="action-btn btn-secondary" onclick="viewOrderDetails('${order.id}', 'delivery')">查看详情</button>
                        </div>
                    `;
                    
                    orderItem.onclick = function(e) {
                        if (!e.target.classList.contains('action-btn')) {
                            viewOrderDetails(order.id, 'delivery');
                        }
                    };
                    
                    ordersList.appendChild(orderItem);
                    orderCount++;
                    console.log(`已渲染 ${orderCount}/${availableOrders.length} 个订单`);
                });
                
                console.log('订单列表渲染完成，共', orderCount, '个订单');
                
                // 添加接单按钮事件
                const takeButtons = document.querySelectorAll('.btn-take');
                console.log('为', takeButtons.length, '个接单按钮添加事件监听');
                
                takeButtons.forEach(btn => {
                    btn.addEventListener('click', function() {
                        const orderId = this.dataset.id;
                        console.log('用户点击接单，订单ID:', orderId);
                        takeOrder(orderId);
                    });
                });
                
                console.log('=== renderAvailableOrders 执行完成 ===');
                
            } catch (error) {
                console.error('加载代取订单失败:', error);
                console.error('错误堆栈:', error.stack);
                
                const ordersList = document.getElementById('available-orders-list');
                if (ordersList) {
                    ordersList.innerHTML = `
                        <div class="error-message">
                            <i class="fas fa-exclamation-triangle"></i>
                            <p>加载订单失败: ${error.message}</p>
                            <div style="margin-top: 10px;">
                                <button class="btn btn-primary" onclick="forceRefreshOrders()" style="margin-right: 10px;">
                                    <i class="fas fa-redo"></i> 重新加载
                                </button>
                                <button class="btn btn-secondary" onclick="showPage('main-page')">
                                    <i class="fas fa-home"></i> 返回首页
                                </button>
                            </div>
                        </div>
                    `;
                }
            }
        }

        // 渲染可接取的跑腿任务
        async function renderAvailableErrands() {
            console.log('=== renderAvailableErrands 开始执行 ===');
            
            // === 新增代码开始 ===
            // 添加用户状态检查
            if (!currentUser) {
                console.log('用户未初始化，等待初始化...');
                const errandsList = document.getElementById('available-errands-list');
                if (errandsList) {
                    errandsList.innerHTML = `
                        <div class="loading">
                            <i class="fas fa-spinner fa-spin"></i> 初始化用户信息...
                        </div>
                    `;
                }
                
                // 等待用户初始化
                await new Promise(resolve => {
                    const checkUser = setInterval(() => {
                        if (currentUser) {
                            clearInterval(checkUser);
                            resolve();
                        }
                    }, 100);
                    
                    // 10秒超时
                    setTimeout(() => {
                        clearInterval(checkUser);
                        resolve();
                    }, 10000);
                });
            }
            // === 新增代码结束 ===
            
            // 原有的函数逻辑继续执行...
            console.log('当前用户:', currentUser ? `${currentUser.name} (ID: ${currentUser.id})` : '未登录');
            
            // 添加刷新按钮动画
            const refreshBtn = document.querySelector('#available-errands .btn-icon');
            if (refreshBtn) {
                refreshBtn.classList.add('spinning');
                setTimeout(() => {
                    refreshBtn.classList.remove('spinning');
                }, 1000);
            }
            
            const errandsList = document.getElementById('available-errands-list');
            
            if (!errandsList) {
                console.error('找不到 available-errands-list 元素');
                return;
            }
            
            // 确保用户已登录
            if (!currentUser) {
                console.error('用户未登录，无法加载跑腿任务');
                errandsList.innerHTML = `
                    <div class="error-message">
                        <i class="fas fa-exclamation-triangle"></i>
                        <p>请先登录后再查看任务</p>
                    </div>
                `;
                return;
            }
            
            try {
                // 显示加载状态
                errandsList.innerHTML = `
                    <div class="loading">
                        <i class="fas fa-spinner fa-spin"></i> 加载任务中...
                    </div>
                `;
                
                // 使用带缓存的函数获取订单数据
                const orders = await getCachedErrandOrders();
                console.log('获取到跑腿任务数量:', orders.length);
                
                errandsList.innerHTML = '';
                
                // 过滤出状态为 pending 且不是当前用户发布的订单
                const availableErrands = orders.filter(order => {
                    return order.status === 'pending' && order.created_by !== currentUser.id;
                });
                
                console.log('可接取的跑腿任务数量:', availableErrands.length);
                
                if (availableErrands.length === 0) {
                    errandsList.innerHTML = `
                        <div class="empty-state">
                            <i class="fas fa-tasks"></i>
                            <p>暂无可接取的跑腿任务</p>
                        </div>
                    `;
                    return;
                }
                
                availableErrands.forEach(order => {
                    const orderItem = document.createElement('div');
                    orderItem.className = 'order-item errand-item';
                    
                    orderItem.innerHTML = `
                        <div class="order-header">
                            <div class="order-id errand-id">${order.id.slice(-8)}</div>
                            <div class="order-status status-pending">待接单</div>
                        </div>
                        <div class="order-details">
                            <div class="order-detail"><strong>任务:</strong> ${order.title}</div>
                            <div class="order-detail"><strong>描述:</strong> ${order.description}</div>
                            <div class="order-detail"><strong>取物地点:</strong> ${order.pickup_location}</div>
                            <div class="order-detail"><strong>送达地点:</strong> ${order.delivery_location}</div>
                            <div class="order-detail"><strong>截止时间:</strong> ${new Date(order.deadline).toLocaleString()}</div>
                            <div class="order-detail"><strong>酬劳:</strong> ${order.reward}元</div>
                        </div>
                        <div class="order-actions">
                            <button class="action-btn btn-take-errand" data-id="${order.id}">接单</button>
                            <button class="action-btn btn-secondary" onclick="viewOrderDetails('${order.id}', 'errand')">查看详情</button>
                        </div>
                    `;
                    
                    orderItem.onclick = function(e) {
                        if (!e.target.classList.contains('action-btn')) {
                            viewOrderDetails(order.id, 'errand');
                        }
                    };
                    
                    errandsList.appendChild(orderItem);
                });
                
                // 添加接单按钮事件
                document.querySelectorAll('.btn-take-errand').forEach(btn => {
                    btn.addEventListener('click', function() {
                        const orderId = this.dataset.id;
                        takeErrandOrder(orderId);
                    });
                });
                
            } catch (error) {
                console.error('加载跑腿任务失败:', error);
                errandsList.innerHTML = `
                    <div class="error-message">
                        <i class="fas fa-exclamation-triangle"></i>
                        <p>加载跑腿任务失败: ${error.message}</p>
                        <button class="btn btn-secondary" onclick="renderAvailableErrands()">重试</button>
                    </div>
                `;
            }
        }

        // 开始配送/开始任务 - 新增函数
async function startDelivery(orderId, orderType) {
    if (!confirm('确定开始配送/执行任务吗？')) return;
    
    // 获取触发事件的按钮
    const startButton = event && event.target ? event.target : null;
    if (startButton) setButtonLoading(startButton, '处理中...');
    
    try {
        if (orderType === 'delivery') {
            await updateOrder(orderId, {
                status: 'processing',
                updated_at: new Date().toISOString()
            });
        } else {
            await updateErrandOrder(orderId, {
                status: 'processing', 
                updated_at: new Date().toISOString()
            });
        }
        
        alert('已开始配送/执行任务！');
        
        // 刷新相关页面
        if (orderType === 'delivery') {
            await renderDeliveryOrders();
        } else {
            await renderErrandOrders();
        }
        
        await refreshAllPages();

    } catch (error) {
        console.error('开始配送失败:', error);
        alert('操作失败，请重试！');
    } finally {
        // 恢复按钮状态
        if (startButton) resetButton(startButton);
    }
}

// 打开支付弹窗
async function openPaymentModal(orderId, orderType, rewardAmount) {
    try {
        // 获取订单信息与接单人ID
        let order = null;
        if (orderType === 'delivery') {
            const list = await getDeliveryOrders();
            order = list.find(o => o.id === orderId);
        } else {
            const list = await getErrandOrders();
            order = list.find(o => o.id === orderId);
        }
        if (!order || !order.taken_by) {
            alert('暂无接单人，无法发起支付');
            return;
        }

        const taker = await fetchUserById(order.taken_by);
        const takerWeChat = taker && taker.wechat_account ? taker.wechat_account : '';
        const takerAlipay = taker && taker.alipay_account ? taker.alipay_account : '';
        const amount = Number(rewardAmount || order.reward || 0) || 0;

        // 创建简单弹窗
        const overlay = document.createElement('div');
        overlay.style.position = 'fixed';
        overlay.style.left = '0';
        overlay.style.top = '0';
        overlay.style.right = '0';
        overlay.style.bottom = '0';
        overlay.style.background = 'rgba(0,0,0,0.5)';
        overlay.style.display = 'flex';
        overlay.style.alignItems = 'center';
        overlay.style.justifyContent = 'center';
        overlay.style.zIndex = '9999';

        const modal = document.createElement('div');
        modal.style.background = '#fff';
        modal.style.borderRadius = '12px';
        modal.style.width = '92%';
        modal.style.maxWidth = '420px';
        modal.style.padding = '18px';
        modal.style.boxShadow = '0 8px 30px rgba(0,0,0,0.15)';

        modal.innerHTML = `
            <div style="font-size: 18px; font-weight: 600; margin-bottom: 10px;">支付给接单人</div>
            <div style="margin-bottom: 8px; color: #666;">订单ID：${order.id.slice(-8)}</div>
            <div style="margin-bottom: 12px; font-size: 16px;">金额：<strong style="color:#ff6b6b">${amount}</strong> 元</div>
            <div style="display:flex; flex-direction: column; gap: 10px;">
                <button class="action-btn btn-primary" id="btn-alipay-pay" ${takerAlipay ? '' : 'disabled style="opacity:.5; cursor:not-allowed;"'}>唤起支付宝并转账</button>
                <button class="action-btn btn-secondary" id="btn-wechat-pay" ${takerWeChat ? '' : 'disabled style="opacity:.5; cursor:not-allowed;"'}>唤起微信并转账</button>
                <div style="font-size: 12px; color:#999;">若唤起失败，请复制对方账号与金额，进入App完成转账。</div>
                <div style="display:flex; gap:8px; flex-wrap:wrap;">
                    <button class="action-btn" id="btn-copy-amount">复制金额</button>
                    ${takerAlipay ? `<button class="action-btn" id="btn-copy-alipay">复制支付宝账号</button>` : ''}
                    ${takerWeChat ? `<button class="action-btn" id="btn-copy-wechat">复制微信账号</button>` : ''}
                </div>
                <button class="action-btn btn-cancel" id="btn-close-pay">关闭</button>
            </div>
        `;

        overlay.appendChild(modal);
        document.body.appendChild(overlay);

        const close = () => document.body.removeChild(overlay);
        modal.querySelector('#btn-close-pay').addEventListener('click', close);
        modal.addEventListener('click', (e) => { e.stopPropagation(); });
        overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });

        // 复制
        const safeCopy = async (text, button) => {
            try { 
                setButtonLoading(button, '复制中...');
                await navigator.clipboard.writeText(String(text)); 
                alert('已复制到剪贴板'); 
            } catch(_) { 
                alert('复制失败，请手动选择复制'); 
            } finally {
                resetButton(button);
            }
        };
        modal.querySelector('#btn-copy-amount').addEventListener('click', function() { safeCopy(amount, this); });
        if (takerAlipay) modal.querySelector('#btn-copy-alipay').addEventListener('click', function() { safeCopy(takerAlipay, this); });
        if (takerWeChat) modal.querySelector('#btn-copy-wechat').addEventListener('click', function() { safeCopy(takerWeChat, this); });

        // 尝试唤起支付宝（toAccount 转账）
        if (takerAlipay) {
            modal.querySelector('#btn-alipay-pay').addEventListener('click', function() {
                const button = this;
                setButtonLoading(button, '跳转中...');
                const memo = encodeURIComponent(`订单${order.id.slice(-8)}`);
                const url = `alipays://platformapi/startapp?appId=20000123&actionType=toAccount&account=${encodeURIComponent(takerAlipay)}&amount=${encodeURIComponent(String(amount))}&memo=${memo}`;
                window.location.href = url;
                setTimeout(() => {
                    alert('如果没有自动跳转，请手动打开支付宝完成转账');
                    resetButton(button);
                }, 1200);
            });
        }

        // 尝试唤起微信（受环境限制，无法预填收款方；提供唤起和复制信息）
        if (takerWeChat) {
            modal.querySelector('#btn-wechat-pay').addEventListener('click', function() {
                const button = this;
                setButtonLoading(button, '跳转中...');
                // 常见scheme：weixin:// 及 weixin://dl/scan （打开微信/扫一扫）
                try { window.location.href = 'weixin://'; } catch(_) {}
                setTimeout(() => {
                    alert('若未能自动打开微信，请手动进入微信，搜索对方微信号进行转账');
                    resetButton(button);
                }, 1200);
            });
        }

    } catch (e) {
        console.error('打开支付弹窗失败:', e);
        alert('暂时无法发起支付，请稍后重试');
    }
}

// 获取用户信息（从 users 表）
async function fetchUserById(userId) {
    if (!window.supabase) return null;
    try {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', userId)
            .limit(1);
        if (error) { console.warn('查询用户失败:', error); return null; }
        return data && data.length ? data[0] : null;
    } catch (e) {
        console.warn('查询用户异常:', e);
        return null;
    }
}

// 接取代取订单 - 【优化后的完整版本】
async function takeOrder(orderId) {
    // 1. 从页面上的表单获取接单信息
    const takerName = document.getElementById('taker-name').value.trim();
    const takerContactInfo = document.getElementById('taker-contact-info').value.trim();
    const contactType = getSelectedContactType('take-order-page');

    // 2. 检查信息是否填写完整
    if (!takerName || !takerContactInfo) {
        alert('接单前，请先在上方的表单中填写您的姓名和联系方式！');
        document.getElementById('taker-name').focus(); // 自动聚焦到姓名输入框，提示用户
        return; // 终止函数
    }

    // 3. 验证联系信息格式
    if (!validateContactInfo(contactType, takerContactInfo)) {
        return; // 验证失败，终止函数
    }

    // 4. 保存（更新）用户的联系信息
    await saveUser({
        name: takerName,
        contactInfo: takerContactInfo,
        defaultContactType: contactType,
        isTaker: true
    });

    // 获取所有接单按钮并设置加载状态
    const takeButtons = document.querySelectorAll('.take-order-btn');
    takeButtons.forEach(btn => setButtonLoading(btn, '接单中...'));

    // 5. 调用后端的原子函数来处理接单逻辑
    try {
        console.log('接单参数:', {
            order_id_in: orderId,
            taker_id_in: currentUser.id,
            taker_name_in: takerName,
            taker_contact_in: takerContactInfo,
            taker_contact_type_in: contactType,
            order_type_in: 'delivery'
        });
        
        const { data, error } = await supabase.rpc('take_order_atomic', {
            order_id_in: orderId,
            taker_id_in: currentUser.id,
            taker_name_in: takerName,
            taker_contact_in: takerContactInfo,
            taker_contact_type_in: contactType,
            order_type_in: 'delivery'
        });

        if (error) throw error;

        // 6. 根据后端返回的结果给用户明确的反馈
        if (data === 'SUCCESS') {
            showSuccessModal('接单成功！', '请尽快联系下单人确认细节，订单已移至"我的订单"。');
            
            // 清除缓存以确保获取最新数据
            memoryCache.cache.delete('delivery_orders');
            
            // 并行执行所有必要的刷新操作
            await Promise.all([
                refreshAllPages(),
                renderAvailableOrders() // 专门刷新可接取订单列表
            ]);
            
            showMyOrders(); // 接单成功后跳转到"我的订单"页
        } else if (data === 'ALREADY_TAKEN') {
            alert('手慢了，订单已被别人抢走啦！');
            memoryCache.cache.delete('delivery_orders');
            renderAvailableOrders(); // 只刷新当前列表，让用户看到订单消失
        } else {
            alert('发生未知错误，请重试。');
        }
    } catch (error) {
        alert('接单失败，请检查网络后重试！');
        console.error('接单 RPC 调用失败:', error);
        console.error('错误详情:', JSON.stringify(error, null, 2));
    } finally {
        // 恢复所有接单按钮状态
        takeButtons.forEach(btn => resetButton(btn));
    }
}

// 接取跑腿任务 - 【优化后的完整版本】
async function takeErrandOrder(orderId) {
    // 1. 从页面上的表单获取接单信息
    const takerName = document.getElementById('errand-taker-name').value.trim();
    const takerContactInfo = document.getElementById('errand-taker-contact-info').value.trim();
    const contactType = getSelectedContactType('take-errand-page');

    // 2. 检查信息是否填写完整
    if (!takerName || !takerContactInfo) {
        alert('接单前，请先在上方的表单中填写您的姓名和联系方式！');
        document.getElementById('errand-taker-name').focus(); // 自动聚焦，提示用户
        return; // 终止函数
    }

    // 3. 验证联系信息格式
    if (!validateContactInfo(contactType, takerContactInfo)) {
        return; // 验证失败，终止函数
    }

    // 4. 保存（更新）用户的联系信息
    await saveUser({
        name: takerName,
        contactInfo: takerContactInfo,
        defaultContactType: contactType,
        isTaker: true
    });

    // 获取所有接单按钮并设置加载状态
    const takeButtons = document.querySelectorAll('.take-errand-btn');
    takeButtons.forEach(btn => setButtonLoading(btn, '接单中...'));

    // 5. 调用后端的原子函数来处理接单逻辑
    try {
        console.log('跑腿接单参数:', {
            order_id_in: orderId,
            taker_id_in: currentUser.id,
            taker_name_in: takerName,
            taker_contact_in: takerContactInfo,
            taker_contact_type_in: contactType,
            order_type_in: 'errand'
        });
        
        const { data, error } = await supabase.rpc('take_order_atomic', {
            order_id_in: orderId,
            taker_id_in: currentUser.id,
            taker_name_in: takerName,
            taker_contact_in: takerContactInfo,
            taker_contact_type_in: contactType,
            order_type_in: 'errand'
        });

        if (error) throw error;

        // 6. 根据后端返回的结果给用户明确的反馈
        if (data === 'SUCCESS') {
            showSuccessModal('接单成功！', '请尽快联系发布人确认细节，任务已移至"我的订单"。');
            
            // 清除缓存以确保获取最新数据
            memoryCache.cache.delete('errand_orders');
            
            // 并行执行所有必要的刷新操作
            await Promise.all([
                refreshAllPages(),
                renderAvailableErrands() // 专门刷新可接取跑腿任务列表
            ]);
            
            showMyOrders(); // 接单成功后跳转到"我的订单"页
        } else if (data === 'ALREADY_TAKEN') {
            alert('手慢了，任务已被别人抢走啦！');
            memoryCache.cache.delete('errand_orders');
            renderAvailableErrands(); // 只刷新当前列表
        } else {
            alert('发生未知错误，请重试。');
        }

    } catch (error) {
        alert('接单失败，请检查网络后重试！');
        console.error('接单 RPC 调用失败:', error);
        console.error('错误详情:', JSON.stringify(error, null, 2));
    } finally {
        // 恢复所有接单按钮状态
        takeButtons.forEach(btn => resetButton(btn));
    }
}

// ==================== 新增：验证接单信息函数 ====================
// 验证接单信息并保存
async function validateTakerInfo(orderType) {
    let takerName, takerContactInfo, contactType;
    
    if (orderType === 'delivery') {
        takerName = document.getElementById('taker-name').value.trim();
        takerContactInfo = document.getElementById('taker-contact-info').value.trim();
        contactType = getSelectedContactType('take-order-page');
    } else {
        takerName = document.getElementById('errand-taker-name').value.trim();
        takerContactInfo = document.getElementById('errand-taker-contact-info').value.trim();
        contactType = getSelectedContactType('take-errand-page');
    }
    
    // 检查信息是否填写完整
    if (!takerName || !takerContactInfo) {
        alert('请填写完整的接单信息！包括您的姓名和联系方式。');
        
        // 自动聚焦到第一个未填写的输入框
        if (orderType === 'delivery') {
            if (!takerName) {
                document.getElementById('taker-name').focus();
            } else {
                document.getElementById('taker-contact-info').focus();
            }
        } else {
            if (!takerName) {
                document.getElementById('errand-taker-name').focus();
            } else {
                document.getElementById('errand-taker-contact-info').focus();
            }
        }
        return;
    }
    
    // 验证联系信息格式
    if (!validateContactInfo(contactType, takerContactInfo)) {
        if (orderType === 'delivery') {
            document.getElementById('taker-contact-info').focus();
        } else {
            document.getElementById('errand-taker-contact-info').focus();
        }
        return;
    }
    
    // 获取触发事件的按钮
    const validateButton = event && event.target ? event.target : null;
    if (validateButton) setButtonLoading(validateButton, '保存中...');
    
    try {
        // 保存用户信息
        await saveUser({
            name: takerName,
            contactInfo: takerContactInfo,
            defaultContactType: contactType,
            isTaker: true
        });
    
        // 显示成功提示
        showSuccessModal('接单信息已保存！', '您的联系信息已保存，现在可以开始接单了。');
        
        console.log('接单信息验证通过并保存:', {
            name: takerName,
            contactInfo: takerContactInfo,
            contactType: contactType,
            orderType: orderType
        });
    } catch (error) {
        console.error('保存接单信息失败:', error);
        alert('保存失败，请重试！');
    } finally {
        // 恢复按钮状态
        if (validateButton) resetButton(validateButton);
    }
}
// ==================== 新增结束 ====================



        // 取消接单
        async function cancelTakeOrder(orderId, orderType) {
            if (!confirm('确定要取消接单吗？取消后订单将重新变为待接单状态。')) return;
            
            // 获取触发事件的按钮
            const cancelButton = event && event.target ? event.target : null;
            if (cancelButton) setButtonLoading(cancelButton, '取消中...');
            
            try {
                // 调用数据库函数取消接单
                const { data, error } = await supabase.rpc('cancel_take_order', {
                    order_id_in: orderId,
                    user_id_in: currentUser.id,
                    order_type_in: orderType
                });
                
                if (error) throw error;
                
                // 根据返回结果处理
                switch(data) {
                    case 'SUCCESS':
                        showSuccessModal('取消接单成功', '订单已恢复为待接单状态。');
                        break;
                    case 'ORDER_NOT_FOUND':
                        alert('订单不存在！');
                        break;
                    case 'NO_PERMISSION':
                        alert('您没有权限取消此接单！');
                        break;
                    case 'WRONG_STATUS':
                        alert('当前订单状态不能取消接单！');
                        break;
                    default:
                        alert('操作失败，请重试！');
                }
                
                // 刷新页面数据
                await refreshAllPages();
                closeOrderDetail(); // 关闭详情模态框
                if (currentFilters.status === 'all') {
                    showMyOrders();
                }

            } catch (error) {
                alert('取消接单失败，请重试！');
                console.error('取消接单错误:', error);
            } finally {
                // 恢复按钮状态
                if (cancelButton) resetButton(cancelButton);
            }
        }

// 取消订单 - 修复版本
async function cancelOrder(orderId, orderType) {
    if (!confirm('确定要取消订单吗？')) return;
    
    // 获取触发事件的按钮
    const cancelButton = event && event.target ? event.target : null;
    if (cancelButton) setButtonLoading(cancelButton, '取消中...');
    
    try {
        if (orderType === 'delivery') {
            await updateOrder(orderId, {
                status: 'cancelled'
            });
        } else {
            await updateErrandOrder(orderId, {
                status: 'cancelled'
            });
        }
        
        // ========== 新增：立即清除缓存 ==========
        clearOrderCache();
        
        // ========== 新增：强制刷新所有相关页面 ==========
        await forceRefreshAllPages();
        
        alert('订单已取消！');
        
        // ========== 修改：使用更可靠的渲染方式 ==========
        if (orderType === 'delivery') {
            await renderDeliveryOrders();
        } else {
            await renderErrandOrders();
        }

    } catch (error) {
        console.error('取消订单失败:', error);
        alert('取消订单失败，请重试！');
    } finally {
        // 恢复按钮状态
        if (cancelButton) resetButton(cancelButton);
    }
}



        // 删除订单（仅限已完成或已取消的订单）
        async function deleteOrder(orderId, orderType) {
            // 弹出确认框，防止用户误删
            if (!confirm('确认要永久删除该订单吗？此操作不可恢复！')) {
                return; // 如果用户点击"取消"，则不执行任何操作
            }

            // 获取触发事件的按钮
            const deleteButton = event && event.target ? event.target : null;
            if (deleteButton) setButtonLoading(deleteButton, '删除中...');

            try {
                // 根据订单类型（'delivery' 或 'errand'），从对应的数据库表中删除记录
                if (orderType === 'delivery') {
                    const { error } = await supabase
                        .from('delivery_orders') // 从代取快递订单表中删除
                        .delete()
                        .eq('id', orderId); // 匹配订单ID
                    if (error) throw error; // 如果出错，抛出异常
                } else {
                    const { error } = await supabase
                        .from('errand_orders') // 从跑腿任务订单表中删除
                        .delete()
                        .eq('id', orderId); // 匹配订单ID
                    if (error) throw error; // 如果出错，抛出异常
                }

                alert('订单已成功删除！'); // 提示用户删除成功

                // 刷新所有页面的数据，让删除结果立刻显示出来
                await refreshAllPages();

            } catch (error) {
                console.error('删除订单失败:', error);
                alert('删除失败，请稍后重试。');
            } finally {
                // 恢复按钮状态
                if (deleteButton) resetButton(deleteButton);
            }
        }

        // 标记为已送达
        async function markAsDelivered(orderId, orderType) {
            if (!confirm('确定已送达吗？')) return;
            
            // 获取触发事件的按钮
            const deliveredButton = event && event.target ? event.target : null;
            if (deliveredButton) setButtonLoading(deliveredButton, '处理中...');
            
            try {
                if (orderType === 'delivery') {
                    await updateOrder(orderId, {
                        status: 'delivered'
                    });
                } else {
                    await updateErrandOrder(orderId, {
                        status: 'delivered'
                    });
                }
                
                alert('已标记为送达！等待发布者确认完成。');
                if (orderType === 'delivery') {
                    renderDeliveryOrders();
                } else {
                    renderErrandOrders();
                }
                
                // 发送通知给发布者
                let order;
                if (orderType === 'delivery') {
                    order = (await getDeliveryOrders()).find(o => o.id === orderId);
                } else {
                    order = (await getErrandOrders()).find(o => o.id === orderId);
                }
                if (order) {
                    sendNotification('订单已送达', `订单 ${orderId.slice(-8)} 已送达，请确认完成`);
                }

                await refreshAllPages();

            } catch (error) {
                alert('操作失败，请重试！');
                console.error(error);
            } finally {
                // 恢复按钮状态
                if (deliveredButton) resetButton(deliveredButton);
            }
        }

        // 确认完成
        async function confirmCompletion(orderId, orderType) {
            if (!confirm('确认订单已完成吗？')) return;
            
            // 获取触发事件的按钮
            const confirmButton = event && event.target ? event.target : null;
            if (confirmButton) setButtonLoading(confirmButton, '处理中...');
            
            try {
                if (orderType === 'delivery') {
                    await updateOrder(orderId, {
                        status: 'completed'
                    });
                } else {
                    await updateErrandOrder(orderId, {
                        status: 'completed'
                    });
                }
                
                alert('订单已完成！');
                if (orderType === 'delivery') {
                    renderDeliveryOrders();
                } else {
                    renderErrandOrders();
                }
                
                // 发送通知给接单人
                let order;
                if (orderType === 'delivery') {
                    order = (await getDeliveryOrders()).find(o => o.id === orderId);
                } else {
                    order = (await getErrandOrders()).find(o => o.id === orderId);
                }
                if (order && order.taken_by) {
                    sendNotification('订单已完成', `订单 ${orderId.slice(-8)} 已被发布者确认完成`);
                }

                await refreshAllPages();

            } catch (error) {
                alert('操作失败，请重试！');
                console.error(error);
            } finally {
                // 恢复按钮状态
                if (confirmButton) resetButton(confirmButton);
            }
        }

        // 发布代取订单
        async function submitOrder() {
            const deliveryTime = document.getElementById('delivery-time').value;
            const pickupAddress = document.getElementById('pickup-address').value;
            const deliveryAddress = document.getElementById('delivery-address').value;
            const itemType = document.getElementById('item-type').value;
            const pickupCode = document.getElementById('pickup-code').value;
            const contactName = document.getElementById('contact-name').value;
            const contactInfo = document.getElementById('contact-info').value;
            const contactType = getSelectedContactType('order-page');
            const reward = document.getElementById('reward').value || 5;
            const notes = document.getElementById('notes').value;
            
            console.log('开始提交订单，表单数据:', {
                deliveryTime, pickupAddress, deliveryAddress, itemType, pickupCode,
                contactName, contactInfo, contactType, reward, notes
            });
            
            if (!deliveryTime || !pickupAddress || !deliveryAddress || 
                !itemType || !pickupCode || !contactName || !contactInfo) {
                alert('请填写所有必填字段！');
                return;
            }

            // 时间校验：不得早于当前时间
            const now = new Date();
            const dt = new Date(deliveryTime);
            if (isNaN(dt.getTime()) || dt.getTime() < now.getTime()) {
                alert('期望送达时间不能早于当前时间！');
                return;
            }

                // ========== 新增：验证联系信息 ==========
    if (!validateContactInfo(contactType, contactInfo)) {
        return;
    }
    // ========== 新增结束 ==========
            
            // 验证物品类型
            let finalItemType = itemType;
            if (itemType === '其它') {
                const otherItemInput = document.getElementById('other-item-name');
                if (!otherItemInput || !otherItemInput.value.trim()) {
                    alert('请填写具体物品名称！');
                    return;
                }
                finalItemType = otherItemInput.value.trim();
            }
            
            // 设置按钮加载状态
            const submitButton = document.getElementById('submit-order');
            setButtonLoading(submitButton, '提交中...');
            
            try {
                const newOrder = {
                    deliveryTime: deliveryTime,
                    pickupAddress: pickupAddress,
                    deliveryAddress: deliveryAddress,
                    itemType: finalItemType,
                    pickupCode: pickupCode,
                    contactName: contactName,
                    contactInfo: contactInfo,
                    contactType: contactType,
                    reward: reward,
                    notes: notes,
                    status: 'pending',
                    createdBy: currentUser.id
                };
                
                console.log('准备提交订单:', newOrder);
                
                const result = await saveOrder(newOrder);
                console.log('订单提交成功:', result);
                
                // 重置表单
                document.getElementById('pickup-address').value = '';
                document.getElementById('delivery-address').value = '';
                document.getElementById('item-type').value = '';
                document.getElementById('pickup-code').value = '';
                document.getElementById('contact-name').value = '';
                document.getElementById('contact-info').value = '';
                document.getElementById('reward').value = '5';
                document.getElementById('notes').value = '';
                
                // 隐藏并清空其它物品名称输入框
                const otherContainer = document.getElementById('other-item-container');
                otherContainer.style.display = 'none';
                const otherInput = otherContainer.querySelector('input');
                if (otherInput) {
                    otherInput.remove();
                }
                
                alert('代取请求已提交成功！');
                showPage('delivery-home-page');
                
                // 刷新订单列表
                await renderDeliveryOrders();
                
                // 添加这行 - 自动刷新所有页面数据
                await refreshAllPages();
                
            } catch (error) {
                console.error('提交订单完整错误:', error);
                
                let errorMessage = '提交订单失败，请重试！';
                if (error.message) {
                    errorMessage += '\n错误信息: ' + error.message;
                }
                alert(errorMessage);
            } finally {
                // 恢复按钮状态
                resetButton(submitButton);
            }
        }

        // 发布跑腿任务
        async function submitErrandOrder() {
            const title = document.getElementById('errand-title').value;
            const description = document.getElementById('errand-description').value;
            const pickupLocation = document.getElementById('errand-pickup').value;
            const deliveryLocation = document.getElementById('errand-delivery').value;
            const deadline = document.getElementById('errand-deadline').value;
            const reward = document.getElementById('errand-reward').value;
            const contactName = document.getElementById('errand-contact-name').value;
            const contactInfo = document.getElementById('errand-contact-info').value;
            const contactType = getSelectedContactType('errand-order-page');
            const notes = document.getElementById('errand-notes').value;
            
            if (!title || !description || !pickupLocation || !deliveryLocation || 
                !deadline || !reward || !contactName || !contactInfo) {
                alert('请填写所有必填字段！');
                return;
            }

            // 时间校验：不得早于当前时间
            const now2 = new Date();
            const ddl = new Date(deadline);
            if (isNaN(ddl.getTime()) || ddl.getTime() < now2.getTime()) {
                alert('期望完成时间不能早于当前时间！');
                return;
            }

                // ========== 新增：验证联系信息 ==========
    if (!validateContactInfo(contactType, contactInfo)) {
        return;
    }
    // ========== 新增结束 ==========
            
            // 设置按钮加载状态
            const submitButton = document.getElementById('submit-errand-order');
            setButtonLoading(submitButton, '提交中...');
            
            try {
                const newOrder = {
                    title: title,
                    description: description,
                    pickupLocation: pickupLocation,
                    deliveryLocation: deliveryLocation,
                    deadline: deadline,
                    reward: reward,
                    contactName: contactName,
                    contactInfo: contactInfo,
                    contactType: contactType,
                    notes: notes,
                    status: 'pending',
                    createdBy: currentUser.id
                };
                
                await saveErrandOrder(newOrder);
                
                // 重置表单
                document.getElementById('errand-title').value = '';
                document.getElementById('errand-description').value = '';
                document.getElementById('errand-pickup').value = '';
                document.getElementById('errand-delivery').value = '';
                document.getElementById('errand-reward').value = '3';
                document.getElementById('errand-contact-name').value = '';
                document.getElementById('errand-contact-info').value = '';
                document.getElementById('errand-notes').value = '';
                
                alert('跑腿任务已提交！');
                showPage('errand-home-page');
                
                await renderErrandOrders();
                
                // 添加这行 - 自动刷新所有页面数据
                await refreshAllPages();
                
            } catch (error) {
                console.error('提交跑腿任务错误详情:', error);
                alert('提交任务失败，请检查网络连接！');
            } finally {
                // 恢复按钮状态
                resetButton(submitButton);
            }
        }

        // 获取未读消息数量 - 修复版本
        async function getUnreadMessageCount(orderId, orderType) {
    try {
        // 从本地存储获取最后阅读时间
        const lastReadKey = `last_read_${orderType}_${orderId}`;
        const lastReadTime = localStorage.getItem(lastReadKey) || '1970-01-01T00:00:00Z';

        console.log('查询未读消息:', {
            orderId,
            orderType,
            lastReadTime,
            currentUserId: currentUser.id
        });

        // 构建查询条件
        let query = supabase
            .from('chat_messages')
            .select('*')
            .eq('order_id', orderId)
            .eq('order_type', orderType)
            .gt('created_at', lastReadTime);

        // 只查询其他用户发送的消息
        if (currentUser && currentUser.id) {
            query = query.neq('sender_id', currentUser.id);
        }

        const { data, error } = await query;

        if (error) {
            console.error('Supabase查询错误详情:', error);
            throw error;
        }

        console.log(`找到 ${data ? data.length : 0} 条未读消息`);
        return data ? data.length : 0;
    } catch (error) {
        console.error('获取未读消息数量失败:', error);
        return 0;
    }
}

// 更新最后阅读时间
function updateLastReadTime(orderId, orderType) {
    const lastReadKey = `last_read_${orderType}_${orderId}`;
    localStorage.setItem(lastReadKey, new Date().toISOString());
    console.log('更新最后阅读时间:', lastReadKey, new Date().toISOString());
}

// 更新底部导航的未读消息徽章
async function updateTabUnreadBadge() {
    try {
        // 获取所有相关订单
        const [deliveryOrders, errandOrders] = await Promise.all([
            getDeliveryOrders(),
            getErrandOrders()
        ]);
        
        const myDeliveryOrders = deliveryOrders.filter(order => 
            order.created_by === currentUser.id || order.taken_by === currentUser.id
        );
        
        const myErrandOrders = errandOrders.filter(order => 
            order.created_by === currentUser.id || order.taken_by === currentUser.id
        );
        
        const allOrders = [...myDeliveryOrders, ...myErrandOrders];
        
        // 计算总未读消息数
        let totalUnread = 0;
        
        for (const order of allOrders) {
            const orderType = order.title ? 'errand' : 'delivery';
            const unreadCount = await getUnreadMessageCount(order.id, orderType);
            totalUnread += unreadCount;
        }
        
        const chatTab = document.querySelector('.tab-item:nth-child(4)'); // 聊天标签
        
        // 移除现有的徽章
        const existingBadge = chatTab.querySelector('.unread-badge');
        if (existingBadge) {
            existingBadge.remove();
        }
        
        // 如果有未读消息，添加徽章
        if (totalUnread > 0) {
            const badge = document.createElement('span');
            badge.className = 'unread-badge';
            badge.textContent = totalUnread > 99 ? '99+' : totalUnread.toString();
            chatTab.appendChild(badge);
        }
        
    } catch (error) {
        console.error('更新底部导航徽章失败:', error);
    }
}

        // 更新最后阅读时间
function updateLastReadTime(orderId, orderType) {
    const lastReadKey = `last_read_${orderType}_${orderId}`;
    localStorage.setItem(lastReadKey, new Date().toISOString());
    console.log('更新最后阅读时间:', lastReadKey, new Date().toISOString());
}
        // 更新底部导航的未读消息徽章
        async function updateTabUnreadBadge() {
            try {
                // 获取所有相关订单
                const [deliveryOrders, errandOrders] = await Promise.all([
                    getCachedDeliveryOrders(),
                    getCachedErrandOrders()
                ]);
                
                const myDeliveryOrders = deliveryOrders.filter(order => 
                    order.created_by === currentUser.id || order.taken_by === currentUser.id
                );
                
                const myErrandOrders = errandOrders.filter(order => 
                    order.created_by === currentUser.id || order.taken_by === currentUser.id
                );
                
                const allOrders = [...myDeliveryOrders, ...myErrandOrders];
                
                // 计算总未读消息数
                let totalUnread = 0;
                
                for (const order of allOrders) {
                    const orderType = order.title ? 'errand' : 'delivery';
                    const unreadCount = await getUnreadMessageCount(order.id, orderType);
                    totalUnread += unreadCount;
                }
                
                const chatTab = document.querySelector('.tab-item:nth-child(4)'); // 聊天标签
                
                // 移除现有的徽章
                const existingBadge = chatTab.querySelector('.unread-badge');
                if (existingBadge) {
                    existingBadge.remove();
                }
                
                // 如果有未读消息，添加徽章
                if (totalUnread > 0) {
                    const badge = document.createElement('span');
                    badge.className = 'unread-badge';
                    badge.textContent = totalUnread > 99 ? '99+' : totalUnread.toString();
                    chatTab.appendChild(badge);
                }
                
            } catch (error) {
                console.error('更新底部导航徽章失败:', error);
            }
        }

        // 聊天功能
        let isChatOpen = false; // 添加全局变量跟踪聊天状态

        async function openChat(orderId, orderType) {
    // 防止重复打开
    if (isChatOpen) {
        return;
    }
    
    isChatOpen = true;
    
    // 更新最后阅读时间
    updateLastReadTime(orderId, orderType);
    
    // 刷新未读消息显示
    await updateTabUnreadBadge();
    
    currentChatOrder = { id: orderId, type: orderType };
    
    // 创建聊天模态框
    const chatModal = document.createElement('div');
    chatModal.id = 'chat-modal';
    chatModal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
        animation: fadeIn 0.3s ease;
    `;
    
    chatModal.innerHTML = `
        <div style="background: white; width: 90%; max-width: 500px; height: 70%; border-radius: 15px; display: flex; flex-direction: column; box-shadow: 0 10px 40px rgba(0,0,0,0.2); overflow: hidden; animation: slideUp 0.3s ease;">
            <div style="padding: 15px 20px; border-bottom: 1px solid #eee; display: flex; justify-content: space-between; align-items: center; background: linear-gradient(135deg, #4da6ff, #3399ff); color: white;">
                <h3 style="margin: 0; font-size: 18px; font-weight: 600;">订单聊天</h3>
                <button onclick="closeChat()" style="background: none; border: none; font-size: 24px; cursor: pointer; color: white; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; border-radius: 50%; transition: all 0.3s ease;" onmouseover="this.style.background='rgba(255,255,255,0.2)'" onmouseout="this.style.background='none'">×</button>
            </div>
            <div id="chat-messages" style="flex: 1; padding: 15px 20px; overflow-y: auto; display: flex; flex-direction: column; background: #f5f5f5; scroll-behavior: smooth;"></div>
            <div style="padding: 15px 20px; border-top: 1px solid #eee; display: flex; align-items: center; gap: 8px; background: white;">
                <input type="file" id="chat-image-input" accept="image/*" style="display: none;">
                <input type="file" id="chat-camera-input" accept="image/*" capture="environment" style="display: none;">
                <div style="display: flex; gap: 4px;">
                    <button onclick="document.getElementById('chat-image-input').click()" style="padding: 10px 12px; background: #6c757d; color: white; border: none; border-radius: 8px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.3s ease; box-shadow: 0 2px 4px rgba(0,0,0,0.1);" title="从相册选择" onmousedown="this.style.transform='scale(0.95)'" onmouseup="this.style.transform='scale(1)'" onmouseleave="this.style.transform='scale(1)'">
                        <i class="fas fa-image"></i>
                    </button>
                    <button onclick="document.getElementById('chat-camera-input').click()" style="padding: 10px 12px; background: #28a745; color: white; border: none; border-radius: 8px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.3s ease; box-shadow: 0 2px 4px rgba(0,0,0,0.1);" title="拍照" onmousedown="this.style.transform='scale(0.95)'" onmouseup="this.style.transform='scale(1)'" onmouseleave="this.style.transform='scale(1)'">
                        <i class="fas fa-camera"></i>
                    </button>
                </div>
                <input type="text" id="chat-input" placeholder="输入消息..." style="flex: 1; padding: 12px 15px; border: 2px solid #e0e0e0; border-radius: 25px; outline: none; transition: all 0.3s ease; font-size: 14px;" onfocus="this.style.borderColor='#4da6ff'; this.style.boxShadow='0 0 0 3px rgba(77,166,255,0.1)'" onblur="this.style.borderColor='#e0e0e0'; this.style.boxShadow='none'">
                <button onclick="sendMessage()" style="padding: 12px 24px; background: linear-gradient(135deg, #4da6ff, #3399ff); color: white; border: none; border-radius: 25px; cursor: pointer; font-weight: 600; transition: all 0.3s ease; box-shadow: 0 4px 6px rgba(77, 166, 255, 0.3);" onmousedown="this.style.transform='scale(0.95)'" onmouseup="this.style.transform='scale(1)'" onmouseleave="this.style.transform='scale(1)'">发送</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(chatModal);
    
    // 加载聊天记录
    await loadChatMessages();
    
    // 开始轮询新消息 - 使用定时器管理器
    if (chatInterval) timerManager.clearInterval(chatInterval);
    chatInterval = timerManager.setInterval(loadChatMessages, 2000);
    
    // 回车发送消息
    document.getElementById('chat-input').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });
    
    // 图片选择监听
    document.getElementById('chat-image-input').addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            sendImageMessage(file);
        }
        // 清空input，允许选择同一文件
        e.target.value = '';
    });
    
    // 拍照选择监听
    document.getElementById('chat-camera-input').addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            sendImageMessageWithWatermark(file);
        }
        // 清空input，允许选择同一文件
        e.target.value = '';
    });
}

function closeChat() {
    isChatOpen = false; // 重置状态
    
    // 使用定时器管理器清理定时器
    if (chatInterval) {
        timerManager.clearInterval(chatInterval);
        chatInterval = null;
    }
    
    const chatModal = document.getElementById('chat-modal');
    if (chatModal) {
        chatModal.remove();
    }
    currentChatOrder = null;
    
    // 关闭聊天后更新未读徽章
    updateTabUnreadBadge();
}

        async function loadChatMessages() {
            if (!currentChatOrder) return;
            
            try {
                const { data, error } = await supabase
                    .from('chat_messages')
                    .select('*')
                    .eq('order_id', currentChatOrder.id)
                    .eq('order_type', currentChatOrder.type)
                    .order('created_at', { ascending: true });
                
                if (error) throw error;
                
                const chatMessages = document.getElementById('chat-messages');
                chatMessages.innerHTML = '';
                
                data.forEach(msg => {
                    const messageDiv = document.createElement('div');
                    messageDiv.style.cssText = `
                        margin-bottom: 10px;
                        padding: 8px 12px;
                        border-radius: 10px;
                        max-width: 80%;
                        word-wrap: break-word;
                        ${msg.sender_id === currentUser.id ? 
                            'background: #4da6ff; color: white; align-self: flex-end;' : 
                            'background: #f0f0f0; color: #333; align-self: flex-start;'}
                    `;
                    
                    // 判断是否为图片消息
                    const isImage = msg.message_text && msg.message_text.startsWith('data:image/');
                    let contentHTML = '';
                    
                    if (isImage) {
                        // 渲染图片 - 使用懒加载
                        contentHTML = `<img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%23f0f0f0'/%3E%3C/svg%3E" data-src="${msg.message_text}" style="max-width: 250px; max-height: 300px; border-radius: 5px; display: block; margin-top: 5px; cursor: pointer;" onclick="this.style.maxWidth=this.style.maxWidth==='90vw'?'250px':'90vw'; this.style.maxHeight=this.style.maxHeight==='auto'?'300px':'auto';" class="lazy">`;
                    } else {
                        // 渲染文本
                        contentHTML = `<div>${msg.message_text}</div>`;
                    }
                    
                    messageDiv.innerHTML = `
                        <div style="font-size: 12px; opacity: 0.8;">${msg.sender_name}</div>
                        ${contentHTML}
                        <div style="font-size: 10px; opacity: 0.6; text-align: right;">${new Date(msg.created_at).toLocaleTimeString()}</div>
                    `;
                    
                    chatMessages.appendChild(messageDiv);
                });
                
                // 初始化图片懒加载
                const lazyImages = chatMessages.querySelectorAll('img.lazy');
                lazyImages.forEach(img => {
                    if (window.lazyImageLoader) {
                        window.lazyImageLoader.observe(img);
                    } else {
                        // 降级处理
                        img.src = img.dataset.src;
                        img.classList.remove('lazy');
                    }
                });
                
                // 滚动到底部
                chatMessages.scrollTop = chatMessages.scrollHeight;
            } catch (error) {
                console.error('加载聊天记录失败:', error);
            }
        }

        async function sendMessage() {
            if (!currentChatOrder) return;
            
            const input = document.getElementById('chat-input');
            const messageText = input.value.trim();
            
            if (!messageText) return;
            
            try {
                const { error } = await supabase
                    .from('chat_messages')
                    .insert([{
                        order_id: currentChatOrder.id,
                        order_type: currentChatOrder.type,
                        sender_id: currentUser.id,
                        sender_name: currentUser.name,
                        message_text: messageText
                    }]);
                
                if (error) throw error;
                
                input.value = '';
                await loadChatMessages();
            } catch (error) {
                console.error('发送消息失败:', error);
                alert('发送消息失败，请重试！');
            }
        }

        async function sendImageMessage(file) {
            if (!currentChatOrder) return;
            
            // 检查文件大小 (限制为5MB)
            if (file.size > 5 * 1024 * 1024) {
                alert('图片大小不能超过5MB！');
                return;
            }
            
            // 检查文件类型
            if (!file.type.startsWith('image/')) {
                alert('请选择图片文件！');
                return;
            }
            
            try {
                // 压缩图片
                const compressedFile = await compressImage(file, 0.7);
                
                // 将图片转换为base64
                const reader = new FileReader();
                reader.onload = async function(e) {
                    const fullDataURL = e.target.result;
                    
                    try {
                        const { error } = await supabase
                            .from('chat_messages')
                            .insert([{
                                order_id: currentChatOrder.id,
                                order_type: currentChatOrder.type,
                                sender_id: currentUser.id,
                                sender_name: currentUser.name,
                                message_text: fullDataURL
                            }]);
                        
                        if (error) throw error;
                        
                        await loadChatMessages();
                    } catch (error) {
                        console.error('发送图片失败:', error);
                        alert('发送图片失败，请重试！');
                    }
                };
                reader.readAsDataURL(compressedFile);
            } catch (error) {
                console.error('处理图片失败:', error);
                alert('处理图片失败，请重试！');
            }
        }

        async function sendImageMessageWithWatermark(file) {
            if (!currentChatOrder) return;
            
            // 检查文件大小 (限制为5MB)
            if (file.size > 5 * 1024 * 1024) {
                alert('图片大小不能超过5MB！');
                return;
            }
            
            // 检查文件类型
            if (!file.type.startsWith('image/')) {
                alert('请选择图片文件！');
                return;
            }
            
            try {
                // 压缩图片
                const compressedFile = await compressImage(file, 0.7);
                
                // 将图片转换为base64并添加水印
                const reader = new FileReader();
                reader.onload = async function(e) {
                    const img = new Image();
                    img.onload = function() {
                        // 创建canvas
                        const canvas = document.createElement('canvas');
                        const ctx = canvas.getContext('2d');
                        
                        // 设置canvas尺寸
                        canvas.width = img.width;
                        canvas.height = img.height;
                        
                        // 绘制原图
                        ctx.drawImage(img, 0, 0);
                        
                        // 添加水印文字
                        const now = new Date();
                        const dateStr = now.toLocaleDateString('zh-CN', { 
                            year: 'numeric', 
                            month: '2-digit', 
                            day: '2-digit' 
                        });
                        const timeStr = now.toLocaleTimeString('zh-CN', { 
                            hour: '2-digit', 
                            minute: '2-digit', 
                            second: '2-digit' 
                        });
                        const watermark = `${dateStr} ${timeStr}`;
                        
                        // 设置文字样式
                        const fontSize = Math.max(20, canvas.width / 20);
                        ctx.font = `bold ${fontSize}px Arial`;
                        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
                        ctx.strokeStyle = 'rgba(0, 0, 0, 0.8)';
                        ctx.lineWidth = 3;
                        ctx.textAlign = 'right';
                        ctx.textBaseline = 'bottom';
                        
                        // 获取文字宽度
                        const textMetrics = ctx.measureText(watermark);
                        const textWidth = textMetrics.width;
                        const textHeight = fontSize;
                        
                        // 添加背景矩形
                        const padding = 10;
                        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
                        ctx.fillRect(
                            canvas.width - textWidth - padding * 2,
                            canvas.height - textHeight - padding * 2,
                            textWidth + padding * 2,
                            textHeight + padding * 2
                        );
                        
                        // 添加白色文字
                        ctx.fillStyle = 'white';
                        ctx.fillText(
                            watermark,
                            canvas.width - padding,
                            canvas.height - padding
                        );
                        
                        // 将canvas转换为base64
                        const fullDataURL = canvas.toDataURL('image/jpeg', 0.9);
                        
                        // 发送带水印的图片
                        (async () => {
                            try {
                                const { error } = await supabase
                                    .from('chat_messages')
                                    .insert([{
                                        order_id: currentChatOrder.id,
                                        order_type: currentChatOrder.type,
                                        sender_id: currentUser.id,
                                        sender_name: currentUser.name,
                                        message_text: fullDataURL
                                    }]);
                                
                                if (error) throw error;
                                
                                await loadChatMessages();
                            } catch (error) {
                                console.error('发送图片失败:', error);
                                alert('发送图片失败，请重试！');
                            }
                        })();
                    };
                    img.src = e.target.result;
                };
                reader.readAsDataURL(compressedFile);
            } catch (error) {
                console.error('处理图片失败:', error);
                alert('处理图片失败，请重试！');
            }
        }

        // 页面切换函数 - 修复版本
function showPage(pageId) {
    console.log('=== showPage 切换到:', pageId, '===');
    console.log('切换前活动页面:', document.querySelector('.page.active')?.id);
    
    // 确保页面存在
    const targetPage = document.getElementById(pageId);
    if (!targetPage) {
        console.error('页面不存在:', pageId);
        return;
    }
    
    // 隐藏所有页面
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
        page.style.display = 'none'; // 确保隐藏
    });
    
    // 显示目标页面
    targetPage.classList.add('active');
    targetPage.style.display = 'block'; // 确保显示
    console.log('页面切换完成，当前活动页面:', pageId);
    
    // 更新底部导航激活状态
    document.querySelectorAll('.tab-item').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // 根据页面ID更新导航状态
    if (pageId === 'main-page') {
        const navbarTitle = document.getElementById('navbar-title');
        if (navbarTitle) navbarTitle.textContent = '校园服务平台';
        document.querySelectorAll('.tab-item')[0].classList.add('active');
        updateMainPageStats();
    } else if (pageId === 'delivery-home-page') {
        document.querySelectorAll('.tab-item')[1].classList.add('active');
    } else if (pageId === 'errand-home-page') {
        document.querySelectorAll('.tab-item')[2].classList.add('active');
    } else if (pageId === 'chat-home-page') {
        const navbarTitle = document.getElementById('navbar-title');
        if (navbarTitle) navbarTitle.textContent = '我的聊天';
        document.querySelectorAll('.tab-item')[3].classList.add('active');
        renderChatHome();
        
        // 添加延迟渲染，确保DOM已经准备好
        setTimeout(() => {
            if (currentUser) {
                console.log('延迟渲染聊天页面');
                renderChatHome();
            }
        }, 500);
    } else if (pageId === 'settings-page') {
        document.querySelectorAll('.tab-item')[4].classList.add('active');
        updateUserDisplay();
    } else if (pageId === 'my-orders-page') {
        const navbarTitle = document.getElementById('navbar-title');
        if (navbarTitle) navbarTitle.textContent = '我的订单';
        // 我的订单页面没有对应的底部导航项，保持当前激活状态
    } else if (pageId === 'completed-orders-page') {
        const navbarTitle = document.getElementById('navbar-title');
        if (navbarTitle) navbarTitle.textContent = '已完成订单';
        // 已完成订单页面没有对应的底部导航项，保持当前激活状态
    }
    
    // 如果切换到订单发布页面，设置默认时间
    if (pageId === 'order-page' || pageId === 'errand-order-page') {
        setDefaultTimeValues();
    }
    
    // 自动填充联系信息 - 统一处理
    if (pageId === 'order-page' || pageId === 'take-order-page' || 
        pageId === 'errand-order-page' || pageId === 'take-errand-page') {
        
        console.log('切换到表单页面，准备自动填充:', pageId);
        
        // 使用多种方法确保自动填充成功
        // 1. 立即尝试填充
        if (autoFillContactInfo()) {
            console.log('立即自动填充成功');
        } else {
            // 2. 延迟尝试填充
            setTimeout(() => {
                console.log('延迟100ms尝试自动填充');
                if (!autoFillContactInfo()) {
                    // 3. 再次延迟尝试填充
                    setTimeout(() => {
                        console.log('延迟500ms再次尝试自动填充');
                        autoFillContactInfo();
                    }, 400);
                }
            }, 100);
            
            // 4. 使用 MutationObserver 作为备用方案
            const observer = new MutationObserver((mutations, obs) => {
                // 检查关键元素是否存在
                let requiredElementsExist = false;
                
                if (pageId === 'order-page') {
                    requiredElementsExist = !!document.getElementById('contact-name') && 
                                           !!document.getElementById('contact-info');
                } else if (pageId === 'errand-order-page') {
                    requiredElementsExist = !!document.getElementById('errand-contact-name') && 
                                           !!document.getElementById('errand-contact-info');
                } else if (pageId === 'take-order-page') {
                    requiredElementsExist = !!document.getElementById('taker-name') && 
                                           !!document.getElementById('taker-contact-info');
                } else if (pageId === 'take-errand-page') {
                    requiredElementsExist = !!document.getElementById('errand-taker-name') && 
                                           !!document.getElementById('errand-taker-contact-info');
                }
                
                if (requiredElementsExist) {
                    console.log('检测到表单元素已加载，执行自动填充');
                    autoFillContactInfo();
                    obs.disconnect(); // 停止观察
                }
            });
            
            // 开始观察
            observer.observe(targetPage, {
                childList: true,
                subtree: true
            });
            
            // 设置超时，防止无限等待
            setTimeout(() => {
                console.log('MutationObserver超时，停止观察');
                observer.disconnect();
            }, 2000);
        }
    }

    // ==================== 新增：领取任务页面自动填充 ====================
    // 在领取任务页面自动填充已保存的接单信息
    if (pageId === 'take-order-page' || pageId === 'take-errand-page') {
        // 检查是否已经填写过接单信息
        if (currentUser && currentUser.name && currentUser.contactInfo) {
            // 给一点延迟确保页面已渲染
            setTimeout(() => {
                if (pageId === 'take-order-page') {
                    const nameInput = document.getElementById('taker-name');
                    const contactInput = document.getElementById('taker-contact-info');
                    if (nameInput && contactInput) {
                        nameInput.value = currentUser.name;
                        contactInput.value = currentUser.contactInfo;
                        
                        // 设置联系方式类型
                        const contactBtns = document.querySelectorAll('#take-order-page .contact-type-btn');
                        contactBtns.forEach(btn => {
                            btn.classList.remove('active');
                            if (btn.dataset.type === currentUser.defaultContactType) {
                                btn.classList.add('active');
                            }
                        });
                    }
                } else {
                    const nameInput = document.getElementById('errand-taker-name');
                    const contactInput = document.getElementById('errand-taker-contact-info');
                    if (nameInput && contactInput) {
                        nameInput.value = currentUser.name;
                        contactInput.value = currentUser.contactInfo;
                        
                        // 设置联系方式类型
                        const contactBtns = document.querySelectorAll('#take-errand-page .contact-type-btn');
                        contactBtns.forEach(btn => {
                            btn.classList.remove('active');
                            if (btn.dataset.type === currentUser.defaultContactType) {
                                btn.classList.add('active');
                            }
                        });
                    }
                }
            }, 100);
        }
    }
    // ==================== 新增结束 ====================

    // 在 showPage 函数中找到这部分代码（大约在第 2800 行左右）
    if (pageId === 'take-order-page') {
        console.log('切换到领取代取订单页面');
        // 清除缓存，确保获取最新数据
        console.log('清除代取订单缓存');
        memoryCache.cache.delete('delivery_orders');
        currentTakeOrderPage = 'delivery'; // 标记当前页面类型
        
        // 使用新的自动加载函数
        const loadOrders = async () => {
            // 确保用户已初始化
            if (!currentUser) {
                console.log('等待用户初始化...');
                setTimeout(loadOrders, 200);
                return;
            }
            
            console.log('开始加载代取订单数据');
            try {
                await renderAvailableOrders();
                console.log('代取订单加载完成');
            } catch (error) {
                console.error('加载订单失败:', error);
                // 失败后重试
                setTimeout(loadOrders, 1000);
            }
        };
        
        // 立即开始加载，不依赖刷新按钮
        setTimeout(loadOrders, 100);
        
    } else if (pageId === 'take-errand-page') {
        console.log('切换到领取跑腿任务页面');
        // 清除缓存，确保获取最新数据
        console.log('清除跑腿任务缓存');
        memoryCache.cache.delete('errand_orders');
        currentTakeOrderPage = 'errand'; // 标记当前页面类型
        
        const loadErrands = async () => {
            if (!currentUser) {
                console.log('等待用户初始化...');
                setTimeout(loadErrands, 200);
                return;
            }
            
            console.log('开始加载跑腿任务数据');
            try {
                await renderAvailableErrands();
                console.log('跑腿任务加载完成');
            } catch (error) {
                console.error('加载跑腿任务失败:', error);
                setTimeout(loadErrands, 1000);
            }
        };
        
        setTimeout(loadErrands, 100);
    } else {
        currentTakeOrderPage = null; // 清除标记
    }
    
    // 每次切换页面都更新未读徽章
    updateTabUnreadBadge();
    
    // 滚动到顶部
    window.scrollTo(0, 0);
}
            
        // 初始化事件监听器
        function initEventListeners() {
            // 发布代取订单
            document.getElementById('submit-order').addEventListener('click', submitOrder);
            
            // 发布跑腿任务
            document.getElementById('submit-errand-order').addEventListener('click', submitErrandOrder);
            
            // 物品类型变化监听
            const itemTypeSelect = document.getElementById('item-type');
            if (itemTypeSelect) {
                itemTypeSelect.addEventListener('change', handleItemTypeChange);
            }
        }

        // 编辑用户名
        function editUserName() {
            const newName = prompt('请输入新的用户名：', currentUser.name);
            if (newName && newName.trim() !== '') {
                saveUser({ name: newName.trim() });
            }
        }

        // 退出登录
        function logout() {
            if (confirm('确定要退出登录吗？这将重置您的账户信息。')) {
                localStorage.removeItem('currentUser');
                localStorage.removeItem('deviceId');
                location.reload();
            }
        }

// 渲染聊天主页
async function renderChatHome() {
    console.log('renderChatHome 开始执行');
    
    // 检查当前用户是否已初始化
    if (!currentUser) {
        console.error('currentUser 未定义，无法渲染聊天主页');
        return;
    }
    
    const activeChatOrders = document.getElementById('active-chat-orders');
    const completedChatOrders = document.getElementById('completed-chat-orders');
    
    if (!activeChatOrders || !completedChatOrders) {
        console.error('聊天页面元素未找到');
        return;
    }
    
    try {
        console.log('开始获取订单数据...');
        // 使用带缓存的函数获取订单数据
        const [deliveryOrders, errandOrders] = await Promise.all([
            getCachedDeliveryOrders(),
            getCachedErrandOrders()
        ]);
        
        console.log('获取到订单数据，deliveryOrders:', deliveryOrders.length, 'errandOrders:', errandOrders.length);
        
        // 获取当前用户相关的订单
        const myDeliveryOrders = deliveryOrders.filter(order => 
            order.created_by === currentUser.id || order.taken_by === currentUser.id
        );
        
        const myErrandOrders = errandOrders.filter(order => 
            order.created_by === currentUser.id || order.taken_by === currentUser.id
        );
        
        const allOrders = [...myDeliveryOrders, ...myErrandOrders];
        console.log('当前用户相关订单总数:', allOrders.length);
        
        // 分离配送中和已完成的订单
        const activeOrders = allOrders.filter(order => 
            order.status === 'taken' || order.status === 'processing' || order.status === 'delivered'
        );
        
        const completedOrders = allOrders.filter(order => 
            order.status === 'completed' || order.status === 'cancelled'
        );
        
        console.log('配送中订单数:', activeOrders.length, '已完成订单数:', completedOrders.length);
        
        // 直接渲染配送中的订单（不使用虚拟滚动）
        if (activeChatOrders) {
            // 先清空现有内容
            activeChatOrders.innerHTML = '';
            
            if (activeOrders.length === 0) {
                activeChatOrders.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-comments"></i>
                        <p>暂无配送中的订单</p>
                    </div>
                `;
            } else {
                for (const order of activeOrders) {
                    try {
                        const unreadCount = await getUnreadMessageCount(order.id, order.title ? 'errand' : 'delivery');
                        const orderHTML = createChatOrderItemHTML(order, unreadCount);
                        activeChatOrders.insertAdjacentHTML('beforeend', orderHTML);
                    } catch (error) {
                        console.error('渲染单个订单项失败:', order, error);
                        // 继续处理其他订单
                    }
                }
            }
        }
        
        // 直接渲染已完成的订单（不使用虚拟滚动）
        if (completedChatOrders) {
            // 先清空现有内容
            completedChatOrders.innerHTML = '';
            
            if (completedOrders.length === 0) {
                completedChatOrders.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-check-circle"></i>
                        <p>暂无已完成的订单</p>
                    </div>
                `;
            } else {
                for (const order of completedOrders) {
                    try {
                        const unreadCount = await getUnreadMessageCount(order.id, order.title ? 'errand' : 'delivery');
                        const orderHTML = createChatOrderItemHTML(order, unreadCount);
                        completedChatOrders.insertAdjacentHTML('beforeend', orderHTML);
                    } catch (error) {
                        console.error('渲染单个订单项失败:', order, error);
                        // 继续处理其他订单
                    }
                }
            }
        }
        
    } catch (error) {
        console.error('加载聊天主页失败:', error);
        if (activeChatOrders) {
            activeChatOrders.innerHTML = `
                <div class="error-message">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>加载失败: ${error.message}</p>
                </div>
            `;
        }
        if (completedChatOrders) {
            completedChatOrders.innerHTML = `
                <div class="error-message">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>加载失败: ${error.message}</p>
                </div>
            `;
        }
    }
}

        // 同步获取未读消息数量（用于虚拟滚动）
        function getUnreadMessageCountSync(orderId, orderType) {
            // 这里可以使用本地缓存的数据，避免异步操作
            // 简化实现，返回0
            return 0;
        }

// 创建聊天订单项HTML（用于聊天主页）
function createChatOrderItemHTML(order, unreadCount) {
    let statusClass = '';
    let statusText = '';
    
    switch(order.status) {
        case 'pending':
            statusClass = 'status-pending';
            statusText = '待接单';
            break;
        case 'taken':
            statusClass = 'status-taken';
            statusText = '已接单';
            break;
        case 'processing':
            statusClass = 'status-processing';
            statusText = '配送中';
            break;
        case 'delivered':
            statusClass = 'status-delivered';
            statusText = '已送达';
            break;
        case 'completed':
            statusClass = 'status-completed';
            statusText = '已完成';
            break;
        case 'cancelled':
            statusClass = 'status-cancelled';
            statusText = '已取消';
            break;
    }
    
    // 判断订单类型
    const isDelivery = !order.title;
    const orderType = isDelivery ? 'delivery' : 'errand';
    const orderTypeName = isDelivery ? '快递' : '跑腿';
    const orderTitle = isDelivery ? '代取快递' : order.title;
    
    // 判断用户角色
    const isMyOrder = order.created_by === currentUser.id;
    const userRole = isMyOrder ? '发布者' : '接单者';
    const otherUserName = isMyOrder ? (order.taker_name || '等待接单') : order.contact_name;
    
    return `
        <div class="order-item ${order.title ? 'errand-item' : ''} ${unreadCount > 0 ? 'chat-order-unread' : ''}">
            <div class="order-header">
                <div class="order-id">
                    ${order.id.slice(-8)}
                    <span class="order-type-tag">${orderTypeName}</span>
                    <span class="order-type-tag">${userRole}</span>
                    ${unreadCount > 0 ? `<span class="unread-badge">${unreadCount}</span>` : ''}
                </div>
                <div class="order-status ${statusClass}">${statusText}</div>
            </div>
            <div class="order-details">
                <div class="order-detail"><strong>${isDelivery ? '快递' : '任务'}:</strong> ${orderTitle}</div>
                <div class="order-detail"><strong>对方:</strong> ${otherUserName}</div>
                <div class="order-detail"><strong>酬劳:</strong> ${order.reward}元</div>
            </div>
            <div class="order-actions">
                ${(order.status === 'taken' || order.status === 'processing' || order.status === 'delivered') ? 
                `<button class="action-btn btn-chat" onclick="openChat('${order.id}', '${orderType}')" style="position: relative;">
                    进入聊天${unreadCount > 0 ? `<span class="chat-btn-badge">${unreadCount > 99 ? '99+' : unreadCount}</span>` : ''}
                 </button>` : ''}
            </div>
        </div>
    `;
}

        // 自动刷新页面数据
        async function refreshAllPages() {
            console.log('自动刷新页面数据...');
            
            try {
                // 清除订单缓存
                clearOrderCache();
                
                // 刷新首页统计
                await updateMainPageStats();
                
                // 如果当前在代取快递页面，刷新代取订单列表
                if (document.getElementById('delivery-home-page').classList.contains('active')) {
                    await renderDeliveryOrders();
                }
                
                // 如果当前在跑腿页面，刷新跑腿订单列表
                if (document.getElementById('errand-home-page').classList.contains('active')) {
                    await renderErrandOrders();
                }
                
                // 如果当前在聊天页面，刷新聊天列表
                if (document.getElementById('chat-home-page').classList.contains('active')) {
                    renderChatHome();
                }
                
                // 如果当前在接单页面，刷新可接订单列表
                if (document.getElementById('take-order-page').classList.contains('active')) {
                    await renderAvailableOrders();
                }
                
                // 如果当前在接跑腿页面，刷新可接跑腿列表
                if (document.getElementById('take-errand-page').classList.contains('active')) {
                    await renderAvailableErrands();
                }
                
                // 更新未读徽章
                await updateTabUnreadBadge();
                
            } catch (error) {
                console.error('自动刷新失败:', error);
            }
        }

        // 离线模式初始化（降级方案）
async function initUserLocalOnly() {
    console.log('使用本地模式初始化用户...');
    const deviceId = generateDeviceId();
    let user = localStorage.getItem('currentUser');
    
    if (user && user !== 'superadmin') {
        try {
            currentUser = JSON.parse(user);
            console.log('从本地存储加载用户数据');
        } catch (error) {
            console.error('解析本地用户数据失败，创建新用户:', error);
            createNewUser(deviceId);
        }
    } else {
        console.log('本地无用户数据，创建新用户');
        createNewUser(deviceId);
    }
    
    updateUserDisplay();
    
    // 显示离线模式提示
    showOfflineMode();
}

// 设置默认时间
function setupDefaultTimes() {
    const now = new Date();
    // 默认时间：当前时间的1小时后
    const defaultTime = new Date(now.getTime() + 60 * 60 * 1000);
    
    // 设置代取快递的默认期望送达时间
    const deliveryTimeInput = document.getElementById('delivery-time');
    if (deliveryTimeInput) {
        // 不允许选择当前时间之前
        deliveryTimeInput.min = new Date().toISOString().slice(0, 16);
        deliveryTimeInput.value = defaultTime.toISOString().slice(0, 16);
    }
    
    // 设置跑腿任务的默认截止时间
    const errandDeadlineInput = document.getElementById('errand-deadline');
    if (errandDeadlineInput) {
        // 不允许选择当前时间之前
        errandDeadlineInput.min = new Date().toISOString().slice(0, 16);
        errandDeadlineInput.value = defaultTime.toISOString().slice(0, 16);
    }
    
    console.log('默认时间设置完成');
}

// 显示离线模式提示
function showOfflineMode() {
    // 可以在这里添加离线模式的UI提示
    console.log('应用运行在离线模式，部分功能可能受限');
    
    // 可选：显示一个小的离线提示
    const existingBanner = document.getElementById('offline-banner');
    if (!existingBanner) {
        const banner = document.createElement('div');
        banner.id = 'offline-banner';
        banner.style.cssText = `
            position: fixed;
            top: 50px;
            left: 0;
            right: 0;
            background: #ff9800;
            color: white;
            padding: 8px;
            text-align: center;
            font-size: 14px;
            z-index: 1001;
        `;
        banner.textContent = '离线模式：数据将保存在本地';
        document.body.appendChild(banner);
        
        // 5秒后自动隐藏
        setTimeout(() => {
            banner.style.display = 'none';
        }, 5000);
    }
}

// 显示初始化完成
function showInitializationComplete() {
    console.log('🎉 应用初始化流程完成');
    
    // 只对非聊天页面的加载元素进行处理
    const loadingElements = document.querySelectorAll('.loading');
    loadingElements.forEach(element => {
        // 跳过聊天页面的加载元素
        if (element.closest('#chat-home-page')) {
            return;
        }
        
        // 对于领取页面的加载元素，不是直接替换为"加载完成"
        // 而是跳过，因为这些页面会在切换时自动加载内容
        if (element.closest('#take-order-page') || element.closest('#take-errand-page')) {
            console.log('跳过领取页面的加载元素:', element.id);
            return;
        }
        
        if (element.innerHTML.includes('fa-spinner')) {
            element.innerHTML = '<i class="fas fa-check-circle"></i> 加载完成';
            element.style.color = '#07c160';
        }
    });
    
    // 检查当前页面，如果在领取页面，则触发数据加载
    const takeOrderPage = document.getElementById('take-order-page');
    const takeErrandPage = document.getElementById('take-errand-page');
    
    if (takeOrderPage && takeOrderPage.classList.contains('active')) {
        console.log('初始化完成，当前在领取代取订单页面，触发数据加载');
        currentTakeOrderPage = 'delivery';
        
        // 立即执行，确保DOM完全加载
        if (currentUser) {
            console.log('用户已初始化，立即加载订单');
            renderAvailableOrders().catch(err => {
                console.error('初始化后执行 renderAvailableOrders 失败:', err);
            });
        } else {
            console.log('用户未初始化，等待用户初始化完成');
            // 监听用户初始化完成
            const checkUserInterval = setInterval(() => {
                if (currentUser) {
                    clearInterval(checkUserInterval);
                    console.log('用户已初始化，开始加载订单');
                    renderAvailableOrders();
                }
            }, 500);
            
            // 10秒后停止检查
            setTimeout(() => {
                clearInterval(checkUserInterval);
                console.log('用户初始化检查超时');
            }, 10000);
        }
    } else if (takeErrandPage && takeErrandPage.classList.contains('active')) {
        console.log('初始化完成，当前在领取跑腿任务页面，触发数据加载');
        currentTakeOrderPage = 'errand';
        
        // 立即执行，确保DOM完全加载
        if (currentUser) {
            console.log('用户已初始化，立即加载跑腿任务');
            renderAvailableErrands().catch(err => {
                console.error('初始化后执行 renderAvailableErrands 失败:', err);
            });
        } else {
            console.log('用户未初始化，等待用户初始化完成');
            // 监听用户初始化完成
            const checkUserInterval = setInterval(() => {
                if (currentUser) {
                    clearInterval(checkUserInterval);
                    console.log('用户已初始化，开始加载跑腿任务');
                    renderAvailableErrands();
                }
            }, 500);
            
            // 10秒后停止检查
            setTimeout(() => {
                clearInterval(checkUserInterval);
                console.log('用户初始化检查超时');
            }, 10000);
        }
    } else {
        console.log('初始化完成，但不在领取页面');
    }
    
    // 立即渲染聊天页面，确保显示正确的空状态
    if (document.getElementById('chat-home-page').classList.contains('active')) {
        renderChatHome();
    }
    
    // 添加一个全局的事件监听器，确保页面切换时正确渲染
    document.addEventListener('click', function(event) {
        const target = event.target.closest('.tab-item[onclick*="chat-home-page"]');
        if (target) {
            // 延迟渲染，确保页面切换完成
            setTimeout(() => {
                if (currentUser) {
                    renderChatHome();
                }
            }, 100);
        }
    });
}

// 在 initApp 函数中添加表结构检查
async function checkTableStructure() {
    try {
        // 尝试查询一个包含所有字段的记录
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .limit(1);
            
        if (error) {
            console.warn('用户表结构不完整，某些功能可能受限:', error.message);
            return false;
        }
        
        console.log('用户表结构正常');
        return true;
    } catch (error) {
        console.error('检查表结构失败:', error);
        return false;
    }
}

// === 新增函数：强制刷新订单数据 ===
async function forceRefreshOrders() {
    console.log('强制刷新订单数据');
    memoryCache.cache.delete('delivery_orders');
    memoryCache.cache.delete('errand_orders');
    
    const currentPage = document.querySelector('.page.active');
    if (currentPage) {
        const pageId = currentPage.id;
        if (pageId === 'take-order-page') {
            await renderAvailableOrders();
        } else if (pageId === 'take-errand-page') {
            await renderAvailableErrands();
        }
    }
}

        // 显示登录模态框
    function showLoginModal() {
        document.getElementById('login-modal').style.display = 'flex';
    }
    
    // 关闭登录模态框
    function closeLoginModal() {
        document.getElementById('login-modal').style.display = 'none';
        document.getElementById('login-form').reset();
    }
    
    // 显示注册模态框
    function showRegisterModal() {
        document.getElementById('register-modal').style.display = 'flex';
    }
    
    // 关闭注册模态框
    function closeRegisterModal() {
        document.getElementById('register-modal').style.display = 'none';
        document.getElementById('register-form').reset();
    }
    
    // 显示账户合并模态框
    function showMergeModal() {
        document.getElementById('merge-modal').style.display = 'flex';
    }
    
    // 关闭账户合并模态框
    function closeMergeModal() {
        document.getElementById('merge-modal').style.display = 'none';
        document.getElementById('merge-form').reset();
    }
    
    // 处理登录
    async function handleLogin(event) {
        event.preventDefault();
        
        const username = document.getElementById('login-username').value.trim();
        const password = document.getElementById('login-password').value;
        
        if (!username || !password) {
            alert('请输入用户名和密码');
            return;
        }
        
        try {
            // 调用登录函数
            const { data, error } = await supabase.rpc('login_user', {
                username_in: username,
                password_in: password
            });
            
            if (error) {
                console.error('登录失败:', error);
                alert('登录失败: ' + error.message);
                return;
            }
            
            if (data && data.length > 0 && data[0].success) {
                // 登录成功，更新当前用户信息
                const userData = data[0];
                currentUser.master_user_id = userData.user_id;
                
                // 更新本地存储
                localStorage.setItem('master_user_id', userData.user_id);
                localStorage.setItem('username', username);
                
                // 刷新用户显示
                updateUserDisplay();
                
                // 关闭模态框
                closeLoginModal();
                
                // 刷新页面数据
                await refreshAllPages();
                
                alert('登录成功！');
            } else {
                alert(data && data[0] ? data[0].message : '登录失败，请检查用户名和密码');
            }
        } catch (error) {
            console.error('登录错误:', error);
            alert('登录过程中发生错误');
        }
    }
    
    // 处理注册
    async function handleRegister(event) {
        event.preventDefault();
        
        const username = document.getElementById('register-username').value.trim();
        const password = document.getElementById('register-password').value;
        const confirmPassword = document.getElementById('register-confirm-password').value;
        
        if (!username || !password) {
            alert('请输入用户名和密码');
            return;
        }
        
        if (password !== confirmPassword) {
            alert('两次输入的密码不一致');
            return;
        }
        
        if (password.length < 6) {
            alert('密码长度至少为6位');
            return;
        }
        
        try {
            // 检查用户名是否已存在
            const { data: existingUser, error: checkError } = await supabase
                .from('users')
                .select('username')
                .eq('username', username)
                .limit(1);
            
            if (checkError) {
                console.error('检查用户名失败:', checkError);
                alert('注册失败，请稍后再试');
                return;
            }
            
            if (existingUser && existingUser.length > 0) {
                alert('用户名已存在，请使用其他用户名');
                return;
            }
            
            // 创建新用户，将当前用户关联到该账户
            const { data, error } = await supabase
                .from('users')
                .update({
                    username: username,
                    password_hash: password, // 简化处理，实际应使用bcrypt
                    master_user_id: currentUser.id // 将当前用户ID设为主账户ID
                })
                .eq('id', currentUser.id)
                .select();
            
            if (error) {
                console.error('注册失败:', error);
                alert('注册失败: ' + error.message);
                return;
            }
            
            if (data && data.length > 0) {
                // 更新本地存储
                localStorage.setItem('master_user_id', currentUser.id);
                localStorage.setItem('username', username);
                
                // 更新当前用户信息
                currentUser.master_user_id = currentUser.id;
                currentUser.username = username;
                
                // 刷新用户显示
                updateUserDisplay();
                
                // 关闭模态框
                closeRegisterModal();
                
                alert('注册成功！');
            } else {
                alert('注册失败，请稍后再试');
            }
        } catch (error) {
            console.error('注册错误:', error);
            alert('注册过程中发生错误');
        }
    }
    
    // 处理账户合并
    async function handleMerge(event) {
        event.preventDefault();
        
        const username = document.getElementById('merge-username').value.trim();
        const password = document.getElementById('merge-password').value;
        const deviceId = currentUser.deviceId || generateDeviceId();
        
        if (!username || !password) {
            alert('请输入用户名和密码');
            return;
        }
        
        try {
            // 调用合并账户函数
            const { data, error } = await supabase.rpc('merge_user_accounts', {
                username_in: username,
                password_in: password,
                current_device_id_in: deviceId
            });
            
            if (error) {
                console.error('合并失败:', error);
                alert('合并失败: ' + error.message);
                return;
            }
            
            if (data && data.length > 0 && data[0].success) {
                // 合并成功，更新当前用户信息
                const mergeResult = data[0];
                
                // 更新本地存储
                localStorage.setItem('master_user_id', mergeResult.master_user_id);
                localStorage.setItem('username', username);
                
                // 更新当前用户信息
                currentUser.master_user_id = mergeResult.master_user_id;
                currentUser.username = username;
                
                // 刷新用户显示
                updateUserDisplay();
                
                // 关闭模态框
                closeMergeModal();
                
                // 刷新页面数据
                await refreshAllPages();
                
                alert('账户合并成功！');
            } else {
                alert(data && data[0] ? data[0].message : '合并失败，请检查用户名和密码');
            }
        } catch (error) {
            console.error('合并错误:', error);
            alert('合并过程中发生错误');
        }
    }
    
    // 修改用户初始化函数，检查是否有主账户
    async function initUserWithMasterAccount() {
        const masterUserId = localStorage.getItem('master_user_id');
        const savedUsername = localStorage.getItem('username');
        
        if (masterUserId && savedUsername) {
            // 如果存在主账户信息，则从数据库加载
            console.log('发现已保存的账户信息:', savedUsername);
            
            try {
                const { data, error } = await supabase
                    .from('users')
                    .select('*')
                    .eq('id', masterUserId)
                    .single();
                
                if (error) {
                    console.error('加载用户信息失败:', error);
                    // 如果加载失败，清除本地存储
                    localStorage.removeItem('master_user_id');
                    localStorage.removeItem('username');
                    await initUserWithDevice();
                    return;
                }
                
                if (data) {
                    // 用户已登录，直接使用该账户
                    currentUser = {
                        id: data.id,
                        deviceId: generateDeviceId(), // 生成新设备ID
                        name: data.name || savedUsername,
                        username: savedUsername,
                        master_user_id: data.id
                    };
                    
                    // 将当前设备关联到主账户
                    await updateDeviceAssociation(data.id);
                    
                    // 更新用户界面
                    updateUserDisplay();
                    console.log('使用已有账户:', currentUser);
                    return;
                }
            } catch (error) {
                console.error('初始化用户失败:', error);
                // 如果出错，清除本地存储
                localStorage.removeItem('master_user_id');
                localStorage.removeItem('username');
                await initUserWithDevice();
                return;
            }
        } else {
            // 没有主账户信息，使用设备ID初始化
            await initUserWithDevice();
        }
    }
    
    // 更新设备关联
    async function updateDeviceAssociation(masterUserId) {
        try {
            const { error } = await supabase
                .from('users')
                .update({ master_user_id: masterUserId })
                .eq('device_id', currentUser.deviceId);
            
            if (error) {
                console.error('更新设备关联失败:', error);
            }
        } catch (error) {
            console.error('更新设备关联异常:', error);
        }
    }
    
    // 修改原有的initUser函数
    async function initUserWithDevice() {
        // 原有的initUser代码，从数据库同步或创建新用户
        try {
            const deviceId = generateDeviceId();
            
            // 从数据库同步用户数据
            const syncResult = await syncUserFromDatabase(deviceId);
            if (syncResult) {
                // 同步成功，更新用户界面
                updateUserDisplay();
                return;
            }
            
            // 如果没有找到用户数据，创建新用户
            await createNewUserInDatabase(deviceId);
            updateUserDisplay();
            
        } catch (error) {
            console.error('初始化用户失败:', error);
            
            // 如果数据库操作失败，降级到本地模式
            const deviceId = generateDeviceId();
            createNewUserLocal(deviceId);
            updateUserDisplay();
        }
    }

    // 修改initUser函数
    async function initUser() {
        console.log('开始初始化用户...');
        
        // 首先尝试使用主账户信息初始化
        await initUserWithMasterAccount();
    }
    
    // 初始化应用 - 修改版本
    async function initApp() {
    // 清理可能存在的无效用户数据
    clearInvalidUserData();
    
    // 检查网络连接
    if (!navigator.onLine) {
        alert('网络连接不可用，请检查网络设置');
        showOfflineMode();
        return;
    }
    
    console.log('开始初始化应用...');
    
    try {
        // 第一步：初始化 Supabase 客户端
        console.log('正在初始化 Supabase 客户端...');
        supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        console.log('Supabase 客户端初始化完成');

        // 第二步：测试数据库连接
        console.log('正在测试数据库连接...');
        const { data, error } = await supabase
            .from('users')
            .select('count')
            .limit(1);
            
        if (error) {
            console.error('Supabase 连接测试失败:', error);
            
            // 检查是否是表不存在错误
            if (error.code === '42P01') { // 表不存在
                console.log('用户表不存在，将使用本地模式');
                await initUserLocalOnly();
            } else {
                alert('数据库连接失败: ' + error.message);
                await initUserLocalOnly();
                return;
            }
        } else {
            console.log('Supabase 连接成功，可以正常访问数据库');
            
            // 第三步：初始化用户（与数据库同步）
            console.log('正在初始化用户...');
            await initUser();
        }
        
    } catch (error) {
        console.error('初始化失败:', error);
        alert('应用初始化失败: ' + error.message);
        
        // 降级到本地模式
        await initUserLocalOnly();
        return;
    }
    
    // 第四步：初始化联系方式选择器
    console.log('正在初始化联系方式选择器...');
    initContactTypeSelectors();
    
    // 第五步：设置默认时间
    console.log('正在设置默认时间...');
    setupDefaultTimes();
    
    // 第六步：初始化事件监听器
    console.log('正在初始化事件监听器...');
    initEventListeners();
    
    // 第七步：请求通知权限
    console.log('正在请求通知权限...');
    requestNotificationPermission();
    
    // 第八步：初始加载首页统计
    try {
        console.log('正在加载首页统计...');
        await updateMainPageStats();
        console.log('应用初始化完成');
    } catch (error) {
        console.error('加载统计数据失败:', error);
    }
    
    // 第九步：启动定时器定期更新未读消息徽章
    if (unreadUpdateInterval) clearInterval(unreadUpdateInterval);
    unreadUpdateInterval = setInterval(updateTabUnreadBadge, 10000);
    
    // 新增：启动定时器定期刷新领取订单页面
    setInterval(() => {
        if (currentTakeOrderPage === 'delivery') {
            console.log('定时刷新代取订单列表');
            memoryCache.cache.delete('delivery_orders'); // 清除缓存
            renderAvailableOrders();
        } else if (currentTakeOrderPage === 'errand') {
            console.log('定时刷新跑腿任务列表');
            memoryCache.cache.delete('errand_orders'); // 清除缓存
            renderAvailableErrands();
        }
    }, 15000); // 每15秒刷新一次
    
    // 第十步：初始化未读徽章
    try {
        console.log('正在初始化未读徽章...');
        await updateTabUnreadBadge();
        console.log('未读徽章初始化完成');
    } catch (error) {
        console.error('初始化未读徽章失败:', error);
    }
    
    // 第十一步：预加载订单数据
    try {
        console.log('正在预加载订单数据...');
        await Promise.all([
            getCachedDeliveryOrders(),
            getCachedErrandOrders()
        ]);
        console.log('订单数据预加载完成');
        
        // 检查当前是否在领取订单页面，如果是则刷新列表
        const currentPage = document.querySelector('.page.active');
        if (currentPage) {
            const pageId = currentPage.id;
            if (pageId === 'take-order-page') {
                console.log('检测到当前在领取代取订单页面，自动刷新');
                currentTakeOrderPage = 'delivery';
                renderAvailableOrders();
            } else if (pageId === 'take-errand-page') {
                console.log('检测到当前在领取跑腿任务页面，自动刷新');
                currentTakeOrderPage = 'errand';
                renderAvailableErrands();
            }
        }
    } catch (error) {
        console.error('预加载订单数据失败:', error);
    }

    // ==================== 联系信息验证函数 ====================
function validateContactInfo(contactType, contactInfo) {
    // ... 您之前添加的验证函数代码
}
// ==================== 联系信息验证函数结束 ====================

// ==================== 实时验证功能 ====================
function initRealTimeValidation() {
    // 为所有联系方式输入框添加输入事件监听
    const contactInputs = [
        'contact-info', 'errand-contact-info', 
        'taker-contact-info', 'errand-taker-contact-info',
        'default-contact-info'  // 设置页面的默认联系信息输入框
    ];
    
    contactInputs.forEach(inputId => {
        const input = document.getElementById(inputId);
        if (input) {
            input.addEventListener('blur', function() {
                // 获取对应的联系方式类型
                let contactType = 'wechat'; // 默认值
                const container = this.closest('.page');
                if (container) {
                    const activeBtn = container.querySelector('.contact-type-btn.active');
                    if (activeBtn) {
                        contactType = activeBtn.dataset.type;
                    }
                }
                
                // 验证输入
                if (this.value.trim()) {
                    validateContactInfo(contactType, this.value.trim());
                }
            });
        }
    });
    
    console.log('实时验证初始化完成');
}
// ==================== 实时验证功能结束 ====================

// ==================== 新增：静默验证函数（无alert） ====================
// 此函数仅用于实时视觉反馈，不弹出警告框。
function validateContactFormatSilently(contactType, contactInfo) {
    // 移除前后空格
    contactInfo = contactInfo.trim();
    
    // 如果为空，不视为格式错误（但提交时会认为是未填写）
    if (!contactInfo) {
        return true; 
    }

    if (contactType === 'wechat') {
        // 微信：6位及以上字符（字母、数字，可以组合）
        const wechatRegex = /^[a-zA-Z0-9]{6,}$/;
        return wechatRegex.test(contactInfo);
    } else if (contactType === 'phone') {
        // 手机号：11位数字
        const phoneRegex = /^1(3[0-9]|4[0-9]|5[0-9]|6[0-9]|7[0-9]|8[0-9]|9[0-9])[0-9]{8}$/;
        return phoneRegex.test(contactInfo);
    } else if (contactType === 'qq') {
        // QQ：6-10位数字
        const qqRegex = /^[0-9]{6,10}$/;
        return qqRegex.test(contactInfo);
    }
    
    // 未知类型视为无效
    return false;
}

// 验证默认联系信息是否有效
function validateDefaultContactInfo() {
    if (!currentUser.defaultContactInfo || !currentUser.defaultContactType) {
        return false;
    }
    
    const contactType = currentUser.defaultContactType;
    const contactInfo = currentUser.defaultContactInfo.trim();
    
    // 如果联系信息为空，认为是有效的（允许用户清空默认信息）
    if (!contactInfo) {
        return true;
    }
    
    if (contactType === 'wechat') {
        // 微信：6位字符及以上（字母、数字，可以组合）
        const wechatRegex = /^[a-zA-Z0-9]{6,}$/;
        return wechatRegex.test(contactInfo);
    } else if (contactType === 'phone') {
        // 手机号：11位数字，覆盖所有运营商号段
        const phoneRegex = /^1(3[0-9]|4[0-9]|5[0-9]|6[0-9]|7[0-9]|8[0-9]|9[0-9])[0-9]{8}$/;
        return phoneRegex.test(contactInfo);
    } else if (contactType === 'qq') {
        // QQ：6-10位数字
        const qqRegex = /^[0-9]{6,10}$/;
        return qqRegex.test(contactInfo);
    }
    
    // 对于未知的联系方式类型，认为是有效的
    return true;
}

// ==================== 新增结束 ====================

// ==================== 设置页面视觉提示功能 ====================
// 专门用于验证特定联系信息的函数（不弹出提示，仅返回布尔值）
function validateDefaultContactInfoSpecific(contactType, contactInfo) {
    contactInfo = contactInfo.trim();
    
    if (contactType === 'wechat') {
        const wechatRegex = /^[a-zA-Z0-9]{6,}$/;
        return wechatRegex.test(contactInfo);
    } else if (contactType === 'phone') {
        const phoneRegex = /^1(3[0-9]|4[0-9]|5[0-9]|6[0-9]|7[0-9]|8[0-9]|9[0-9])[0-9]{8}$/;
        return phoneRegex.test(contactInfo);
    } else if (contactType === 'qq') {
        const qqRegex = /^[0-9]{6,10}$/;
        return qqRegex.test(contactInfo);
    }
    
    return false;
}

// 更新默认联系信息有效性提示
function updateDefaultContactValidity() {
    const contactInfo = document.getElementById('default-contact-info').value.trim();
    const activeContactBtn = document.querySelector('#settings-page .contact-type-btn.active');
    const contactType = activeContactBtn ? activeContactBtn.dataset.type : 'wechat';
    
    const isValid = contactInfo ? validateDefaultContactInfoSpecific(contactType, contactInfo) : false;
    
    const input = document.getElementById('default-contact-info');
    if (contactInfo) {
        if (isValid) {
            input.style.borderColor = '#07c160';
            input.style.boxShadow = '0 0 0 2px rgba(7, 193, 96, 0.2)';
        } else {
            input.style.borderColor = '#ff4757';
            input.style.boxShadow = '0 0 0 2px rgba(255, 71, 87, 0.2)';
        }
    } else {
        input.style.borderColor = '#e0e0e0';
        input.style.boxShadow = 'none';
    }
}
// ==================== 设置页面视觉提示功能结束 ====================

// ==================== 新增：处理输入框失焦事件的函数 ====================
function handleContactInputBlur(event) {
    const inputElement = event.target;
    const contactInfo = inputElement.value.trim();
    
    // 找到包含此输入框的容器，以确定当前的联系方式类型
    const container = inputElement.closest('.page, .card');
    if (!container) return;

    const activeBtn = container.querySelector('.contact-type-btn.active');
    const contactType = activeBtn ? activeBtn.dataset.type : 'wechat';

    // 如果输入框为空，恢复默认样式
    if (!contactInfo) {
        inputElement.style.borderColor = ''; // 恢复CSS默认
        inputElement.style.boxShadow = '';  // 恢复CSS默认
        return;
    }

    // 执行静默验证
    const isValid = validateContactFormatSilently(contactType, contactInfo);

    // 根据验证结果应用不同的视觉反馈
    if (isValid) {
        // 验证通过：绿色边框
        inputElement.style.borderColor = '#07c160';
        inputElement.style.boxShadow = '0 0 0 2px rgba(7, 193, 96, 0.2)';
    } else {
        // 验证失败：红色边框
        inputElement.style.borderColor = '#ff4757';
        inputElement.style.boxShadow = '0 0 0 2px rgba(255, 71, 87, 0.2)';
    }
}
// ==================== 新增结束 ====================

// ==================== 新增：初始化实时验证功能 ====================
function initRealTimeValidation() {
    // 列出所有需要验证的联系方式输入框的ID
    const contactInputIds = [
        'contact-info',         // 发布代取
        'errand-contact-info',  // 发布跑腿
        'taker-contact-info',   // 接取快递
        'errand-taker-contact-info', // 接取跑腿
        'default-contact-info'  // 设置页面的默认联系方式
    ];
    
    // 为每个输入框添加 blur 事件监听
    contactInputIds.forEach(id => {
        const input = document.getElementById(id);
        if (input) {
            input.addEventListener('blur', handleContactInputBlur);
        }
    });

    // 为所有"联系方式类型"按钮添加点击事件
    // 当用户切换类型时，也需要重新验证输入框中的内容
    document.querySelectorAll('.contact-type-btn').forEach(btn => {
        btn.addEventListener('click', (event) => {
            const container = event.target.closest('.page, .card');
            if (container) {
                // 查找当前表单内的联系方式输入框
                const input = container.querySelector('input[id*="contact-info"]');
                if (input && input.value.trim()) {
                   // 延迟一小会再触发，确保active class已经更新
                   setTimeout(() => {
                       // 手动创建一个事件对象并分派
                       const blurEvent = new Event('blur', { bubbles: true });
                       input.dispatchEvent(blurEvent);
                   }, 100);
                }
            }
        });
    });

    console.log('✅ 实时验证功能已初始化');
}
// ==================== 新增结束 ====================


// 启动 Supabase 实时订阅
function startRealtimeSubscriptions() {
    console.log('🚀 启动实时数据订阅...');

    const channel = supabase.channel('public-orders');

    channel
        .on('postgres_changes',
            { event: '*', schema: 'public', table: 'delivery_orders' },
            (payload) => {
                console.log('代取快递订单表发生变化:', payload);
                // 收到变化后，智能刷新数据
                // 防抖处理，避免短时间内多次刷新
                debouncedRefresh();
            }
        )
        .on('postgres_changes',
            { event: '*', schema: 'public', table: 'errand_orders' },
            (payload) => {
                console.log('跑腿任务表发生变化:', payload);
                debouncedRefresh();
            }
        )
        .subscribe((status) => {
            if (status === 'SUBSCRIBED') {
                console.log('✅ 成功订阅订单变化！');
            }
        });
}

// 创建一个防抖的刷新函数，防止过于频繁地刷新
const debouncedRefresh = debounce(async () => {
    console.log('正在执行防抖刷新...');
    await refreshAllPages();
    // 还可以主动给用户一个微小的提示
    // 例如：showToast('列表已更新');
}, 1000); // 1秒内发生的多次变化，只会触发一次刷新
    
    // 第十一步：初始化实时验证
    console.log('正在初始化实时验证...');
    initRealTimeValidation();

    // 显示初始化完成状态
    showInitializationComplete();

    // 在 initApp 的最后调用
    startRealtimeSubscriptions();
}

// ==================== 设置页面视觉提示功能 ====================
// 专门用于验证特定联系信息的函数（不弹出提示，仅返回布尔值）
function validateDefaultContactInfoSpecific(contactType, contactInfo) {
    contactInfo = contactInfo.trim();
    
    if (contactType === 'wechat') {
        const wechatRegex = /^[a-zA-Z0-9]{6,}$/;
        return wechatRegex.test(contactInfo);
    } else if (contactType === 'phone') {
        const phoneRegex = /^1(3[0-9]|4[0-9]|5[0-9]|6[0-9]|7[0-9]|8[0-9]|9[0-9])[0-9]{8}$/;
        return phoneRegex.test(contactInfo);
    } else if (contactType === 'qq') {
        const qqRegex = /^[0-9]{6,10}$/;
        return qqRegex.test(contactInfo);
    }
    
    return false;
}

// 更新默认联系信息有效性提示
function updateDefaultContactValidity() {
    const contactInfo = document.getElementById('default-contact-info');
    if (!contactInfo) return;
    
    const contactValue = contactInfo.value.trim();
    const activeContactBtn = document.querySelector('#settings-page .contact-type-btn.active');
    const contactType = activeContactBtn ? activeContactBtn.dataset.type : 'wechat';
    
    const isValid = contactValue ? validateDefaultContactInfoSpecific(contactType, contactValue) : false;
    
    if (contactValue) {
        if (isValid) {
            contactInfo.style.borderColor = '#07c160';
            contactInfo.style.boxShadow = '0 0 0 2px rgba(7, 193, 96, 0.2)';
        } else {
            contactInfo.style.borderColor = '#ff4757';
            contactInfo.style.boxShadow = '0 0 0 2px rgba(255, 71, 87, 0.2)';
        }
    } else {
        contactInfo.style.borderColor = '#e0e0e0';
        contactInfo.style.boxShadow = 'none';
    }
}

// ==================== 设置页面验证初始化 ====================
function initSettingsPageValidation() {
    const defaultContactInput = document.getElementById('default-contact-info');
    if (defaultContactInput) {
        // 输入时实时验证
        defaultContactInput.addEventListener('input', updateDefaultContactValidity);
        
        // 初始加载时验证一次
        updateDefaultContactValidity();
    }
    
    // 为设置页面的联系方式类型按钮添加点击事件
    const settingsContactBtns = document.querySelectorAll('#settings-page .contact-type-btn');
    settingsContactBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            // 延迟一点时间，确保类型已经切换
            setTimeout(updateDefaultContactValidity, 100);
        });
    });
}
// ==================== 设置页面验证初始化结束 ====================

        // 显示我的订单页面
        function showMyOrders() {
            document.getElementById('navbar-title').textContent = '我的订单';
            showPage('my-orders-page');
            renderMyOrders();
        }

        // 显示已完成订单页面
        function showCompletedOrders() {
            document.getElementById('navbar-title').textContent = '已完成订单';
            showPage('completed-orders-page');
            renderCompletedOrders('all');
        }

        // 切换已完成订单标签页
        function switchCompletedTab(tab) {
            // 更新按钮状态
            document.querySelectorAll('#completed-orders-page .order-tab-btn').forEach(btn => {
                btn.classList.remove('active');
            });
            event.target.classList.add('active');
    
            // 渲染对应类型的订单
                    renderCompletedOrders(tab);
        }

        // 订单筛选功能
let currentFilters = {
    status: 'all',
    type: 'all'
};

    // 状态筛选切换
function switchStatusFilter(status) {
    // 更新按钮状态
    document.querySelectorAll('#my-orders-page .status-filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');

    // 更新状态筛选
    currentFilters.status = status;
    
    // 重新渲染订单列表
    renderMyOrders();
}


// 订单类型标签页切换
function switchOrderTab(tab) {
    // 更新按钮状态
    document.querySelectorAll('#my-orders-page .order-tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');

    // 更新类型筛选
    currentFilters.type = tab;
    
    // 重新渲染订单列表
    renderMyOrders();
    
}



        // 渲染我的订单
        async function renderMyOrders() {
            const ordersList = document.getElementById('my-orders-list');

            try {
                // 使用带缓存的函数获取订单数据
                const [deliveryOrders, errandOrders] = await Promise.all([
                    getCachedDeliveryOrders(),
                    getCachedErrandOrders()
                ]);

                ordersList.innerHTML = '';

                // 筛选当前用户的订单
                const myDeliveryOrders = deliveryOrders.filter(order => 
                    order.created_by === currentUser.id || order.taken_by === currentUser.id
                );

                const myErrandOrders = errandOrders.filter(order => 
                    order.created_by === currentUser.id || order.taken_by === currentUser.id
                );

                let ordersToShow = [];

                // 根据当前筛选条件筛选订单
                if (currentFilters.type === 'all') {
                    ordersToShow = [...myDeliveryOrders, ...myErrandOrders];
                } else if (currentFilters.type === 'delivery') {
                    ordersToShow = myDeliveryOrders;
                } else if (currentFilters.type === 'errand') {
                    ordersToShow = myErrandOrders;
                }

                if (currentFilters.status !== 'all') {
                    ordersToShow = ordersToShow.filter(order => {
                        if (currentFilters.status === 'completed') {
                            return order.status === 'completed' || order.status === 'cancelled';
                        }
                        if (currentFilters.status === 'pending') {
                            return order.status === 'pending';
                        }
                        if (currentFilters.status === 'taken' || currentFilters.status === 'processing') {
                            return order.status === 'taken' || order.status === 'processing' || order.status === 'delivered';
                        }
                        return true;
                    });
                }

                // 按创建时间排序
                ordersToShow.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

                if (ordersToShow.length === 0) {
                    ordersList.innerHTML = `
                        <div class="empty-state">
                            <i class="fas fa-inbox"></i>
                            <p>暂无符合条件的订单记录</p>
                        </div>
                    `;
                    return;
                }

                for (const order of ordersToShow) {
                    const unreadCount = await getUnreadMessageCount(order.id, order.title ? 'errand' : 'delivery');
                    const orderItem = document.createElement('div');
                    orderItem.className = 'order-item';
                    if (order.title) {
                        orderItem.classList.add('errand-item');
                    }
                    if (unreadCount > 0) {
                        orderItem.classList.add('chat-order-unread');
                    }
                    
                    let statusClass = '';
                    let statusText = '';
                    
                    switch(order.status) {
                        case 'pending': statusClass = 'status-pending'; statusText = '待接单'; break;
                        case 'taken': statusClass = 'status-taken'; statusText = '已接单'; break;
                        case 'processing': statusClass = 'status-processing'; statusText = '配送中'; break;
                        case 'delivered': statusClass = 'status-delivered'; statusText = '已送达'; break;
                        case 'completed': statusClass = 'status-completed'; statusText = '已完成'; break;
                        case 'cancelled': statusClass = 'status-cancelled'; statusText = '已取消'; break;
                    }
                    
                    const isDelivery = !order.title;
                    const orderType = isDelivery ? 'delivery' : 'errand';
                    const orderTypeName = isDelivery ? '代取快递' : '跑腿任务';
                    const orderTitle = isDelivery ? '代取快递' : order.title;
                    const orderTypeClass = isDelivery ? 'order-type-delivery' : 'order-type-errand';
                    const orderTypeBadge = `<span class="order-type-badge ${orderTypeClass}">${orderTypeName}</span>`;
                    
                    const isMyOrder = order.created_by === currentUser.id;
                    const userRole = isMyOrder ? '我发布的' : '我接取的';
                    
                    orderItem.innerHTML = `
                        <div class="order-header">
                            <div class="order-id">
                                ${order.id.slice(-8)}
                                ${orderTypeBadge}
                                <span class="order-type-tag">${userRole}</span>
                                ${unreadCount > 0 ? `<span class="unread-badge">${unreadCount > 99 ? '99+' : unreadCount}</span>` : ''}
                            </div>
                            <div class="order-status ${statusClass}">${statusText}</div>
                        </div>
                        <div class="order-details">
                            <div class="order-detail"><strong>${isDelivery ? '任务' : '标题'}:</strong> ${orderTitle}</div>
                            <div class="order-detail"><strong>酬劳:</strong> ${order.reward}元</div>
                        </div>
                        <div class="order-actions">
                            ${(order.status === 'taken' || order.status === 'processing' || order.status === 'delivered') ? 
                                `<button class="action-btn btn-chat" onclick="openChat('${order.id}', '${orderType}')">联系对方</button>` : ''}
                            
                            <!-- ▼▼▼ 这里是新增的逻辑 ▼▼▼ -->
                            ${(order.status === 'completed' || order.status === 'cancelled') ? 
                                `<button class="action-btn btn-delete" onclick="deleteOrder('${order.id}', '${orderType}')">删除订单</button>` : ''}
                            <!-- ▲▲▲ 新增逻辑结束 ▲▲▲ -->
                            
                            <button class="action-btn btn-secondary" onclick="viewOrderDetails('${order.id}', '${orderType}')">查看详情</button>
                        </div>
                    `;
                    
                    ordersList.appendChild(orderItem);
                }

            } catch (error) {
                console.error('加载代取订单失败:', error);
                ordersList.innerHTML = `
                    <div class="error-message">
                        <i class="fas fa-exclamation-triangle"></i>
                        <p>加载订单失败: ${error.message}</p>
                        <button class="btn btn-secondary" onclick="renderAvailableOrders()">重试</button>
                    </div>
                `;
            }
        }


        // 渲染已完成订单
        async function renderCompletedOrders(type = 'all') {
            const ordersList = document.getElementById('completed-orders-list');
    
            try {
                // 使用带缓存的函数获取订单数据
                const [deliveryOrders, errandOrders] = await Promise.all([
                    getCachedDeliveryOrders(),
                    getCachedErrandOrders()
                ]);
        
                ordersList.innerHTML = '';
        
                // 筛选已完成或已取消的订单
                const completedDeliveryOrders = deliveryOrders.filter(order => 
                    (order.created_by === currentUser.id || order.taken_by === currentUser.id) && 
                    (order.status === 'completed' || order.status === 'cancelled')
                );
        
                const completedErrandOrders = errandOrders.filter(order => 
                    (order.created_by === currentUser.id || order.taken_by === currentUser.id) && 
                    (order.status === 'completed' || order.status === 'cancelled')
                );
        
                let ordersToShow = [];
        
                // 根据类型筛选
                if (type === 'all') {
                    ordersToShow = [...completedDeliveryOrders, ...completedErrandOrders];
                } else if (type === 'delivery') {
                    ordersToShow = completedDeliveryOrders;
                } else if (type === 'errand') {
                    ordersToShow = completedErrandOrders;
                }
        
                // 按完成时间排序（假设完成时间就是更新时间）
                ordersToShow.sort((a, b) => new Date(b.updated_at || b.created_at) - new Date(a.updated_at || a.created_at));
        
                if (ordersToShow.length === 0) {
                    ordersList.innerHTML = `
                        <div class="empty-state">
                            <i class="fas fa-check-circle"></i>
                            <p>暂无已完成订单</p>
                        </div>
                    `;
                    return;
                }
        
                for (const order of ordersToShow) {
                    const orderItem = document.createElement('div');
                    orderItem.className = 'order-item';
                    if (order.title) {
                        orderItem.classList.add('errand-item');
                    }
            
                    let statusClass = '';
                    let statusText = '';
            
                    if (order.status === 'completed') {
                        statusClass = 'status-completed';
                        statusText = '已完成';
                    } else if (order.status === 'cancelled') {
                        statusClass = 'status-cancelled';
                        statusText = '已取消';
                    }
            
                    // 判断订单类型
                    const isDelivery = !order.title;
                    const orderType = isDelivery ? 'delivery' : 'errand';
                    const orderTypeName = isDelivery ? '代取快递' : '跑腿任务';
                    const orderTitle = isDelivery ? '代取快递' : order.title;
            
                    // 判断用户角色
                    const isMyOrder = order.created_by === currentUser.id;
                    const userRole = isMyOrder ? '我发布的' : '我接取的';
            
                    orderItem.innerHTML = `
                        <div class="order-header">
                            <div class="order-id">
                                ${order.id.slice(-8)}
                                <span class="order-type-tag">${orderTypeName}</span>
                                <span class="order-type-tag">${userRole}</span>
                            </div>
                            <div class="order-status ${statusClass}">${statusText}</div>
                        </div>
                        <div class="order-details">
                            <div class="order-detail"><strong>${isDelivery ? '任务' : '标题'}:</strong> ${orderTitle}</div>
                            <div class="order-detail"><strong>酬劳:</strong> ${order.reward}元</div>
                            <div class="order-detail"><strong>${order.status === 'completed' ? '完成时间' : '取消时间'}:</strong> ${new Date(order.updated_at || order.created_at).toLocaleString()}</div>
                        </div>
                        <div class="order-actions">
                             <!-- ▼▼▼ 这里是新增的代码 ▼▼▼ -->
                            <button class="action-btn btn-delete" onclick="deleteOrder('${order.id}', '${orderType}')">删除订单</button>
                             <!-- ▲▲▲ 新增代码结束 ▲▲▲ -->
                            <button class="action-btn btn-secondary" onclick="viewOrderDetails('${order.id}', '${orderType}')">查看详情</button>
                        </div>
                    `;
            
                    ordersList.appendChild(orderItem);
                }
        
            } catch (error) {
                ordersList.innerHTML = `
                    <div class="error-message">
                        <i class="fas fa-exclamation-triangle"></i>
                        <p>加载已完成订单失败: ${error.message}</p>
                    </div>
                `;
            }
        }


        async function rateOrder(orderId, orderType) {
    // 先检查是否已经评价过
    const hasRated = await checkIfRated(orderId, orderType);
    if (hasRated) {
        alert('您已经评价过此订单！');
        return;
    }
    // 创建评价模态框
    const ratingModal = document.createElement('div');
    ratingModal.id = 'rating-modal';
    ratingModal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
    `;
    
    ratingModal.innerHTML = `
        <div style="background: white; width: 90%; max-width: 400px; border-radius: 15px; padding: 25px; box-shadow: 0 10px 30px rgba(0,0,0,0.3);">
            <div style="margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center;">
                <h3 style="margin: 0; color: #333;">评价订单</h3>
                <button onclick="closeRatingModal()" style="background: none; border: none; font-size: 24px; cursor: pointer; color: #666; padding: 0; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center;">×</button>
            </div>
            
            <div style="margin-bottom: 20px; text-align: center;">
                <div style="margin-bottom: 10px; font-weight: 500; color: #555; font-size: 16px;">请选择评分：</div>
                <div class="rating-stars">
                    <span class="rating-star" data-rating="1" title="非常差">★</span>
                    <span class="rating-star" data-rating="2" title="差">★</span>
                    <span class="rating-star" data-rating="3" title="一般">★</span>
                    <span class="rating-star" data-rating="4" title="好">★</span>
                    <span class="rating-star" data-rating="5" title="非常好">★</span>
                </div>
                <div class="rating-display" id="rating-text">请点击星星进行评分</div>
            </div>
            
            <div style="margin-bottom: 20px;">
                <label style="display: block; margin-bottom: 8px; font-weight: 500; color: #555;">评价内容：</label>
                <textarea id="rating-comment" style="width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 8px; min-height: 80px; font-size: 14px; resize: vertical;" placeholder="请输入评价内容（可选）"></textarea>
            </div>
            
            <button onclick="submitRating('${orderId}', '${orderType}')" style="width: 100%; padding: 14px; background: linear-gradient(135deg, #4da6ff, #3399ff); color: white; border: none; border-radius: 8px; font-size: 16px; font-weight: 500; cursor: pointer; transition: all 0.3s;">
                提交评价
            </button>
        </div>
    `;
    
    document.body.appendChild(ratingModal);
    
    // 初始化星级评分
    const stars = ratingModal.querySelectorAll('.rating-star');
    const ratingText = ratingModal.querySelector('#rating-text');
    let selectedRating = 0;
    
    // 评分描述
    const ratingDescriptions = {
        1: "非常差 - 体验很差",
        2: "差 - 有待改进", 
        3: "一般 - 基本满意",
        4: "好 - 体验不错",
        5: "非常好 - 非常满意"
    };
    
    // 更新星星显示
    function updateStars() {
        stars.forEach(star => {
            const rating = parseInt(star.dataset.rating);
            star.classList.remove('active', 'selected');
            
            if (rating <= selectedRating) {
                star.classList.add('active');
                if (rating === selectedRating) {
                    star.classList.add('selected');
                }
            }
        });
        
        // 更新评分文字
        if (selectedRating > 0) {
            ratingText.textContent = `${selectedRating}星 - ${ratingDescriptions[selectedRating]}`;
            ratingText.style.color = '#4da6ff';
            ratingText.style.fontWeight = '500';
        } else {
            ratingText.textContent = '请点击星星进行评分';
            ratingText.style.color = '#666';
            ratingText.style.fontWeight = 'normal';
        }
    }
    
    // 星星点击事件
    stars.forEach(star => {
        star.addEventListener('click', function() {
            selectedRating = parseInt(this.dataset.rating);
            updateStars();
        });
        
        // 鼠标悬停效果
        star.addEventListener('mouseover', function() {
            const hoverRating = parseInt(this.dataset.rating);
            stars.forEach(s => {
                const sRating = parseInt(s.dataset.rating);
                s.classList.remove('active', 'selected');
                if (sRating <= hoverRating) {
                    s.classList.add('active');
                }
            });
        });
        
        // 鼠标移出效果
        star.addEventListener('mouseout', function() {
            updateStars();
        });
    });
    
    // 初始更新
    updateStars();
    
    // 添加按钮悬停效果
    const submitBtn = ratingModal.querySelector('button[onclick^="submitRating"]');
    submitBtn.addEventListener('mouseover', function() {
        this.style.transform = 'translateY(-2px)';
        this.style.boxShadow = '0 5px 15px rgba(77, 166, 255, 0.4)';
    });
    
    submitBtn.addEventListener('mouseout', function() {
        this.style.transform = 'translateY(0)';
        this.style.boxShadow = 'none';
    });
    
    // 回车键提交
    document.getElementById('rating-comment').addEventListener('keypress', function(e) {
        if (e.key === 'Enter' && e.ctrlKey) {
            submitRating(orderId, orderType);
        }
    });
}
        
        function closeRatingModal() {
            const ratingModal = document.getElementById('rating-modal');
            if (ratingModal) {
                ratingModal.remove();
            }
        }

        // ========== 新增：显示成功提示模态框函数 ==========
function showSuccessModal(title, message) {
    // 创建模态框
    const modal = document.createElement('div');
    modal.className = 'success-modal';
    modal.innerHTML = `
        <div class="success-modal-content">
            <div class="success-icon">
                <i class="fas fa-check"></i>
            </div>
            <div class="success-title">${title}</div>
            <div class="success-message">${message}</div>
            <button class="success-confirm-btn" onclick="closeSuccessModal()">确认</button>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // 添加点击背景关闭功能
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            closeSuccessModal();
        }
    });
    
    // 添加ESC键关闭功能
    const escHandler = function(e) {
        if (e.key === 'Escape') {
            closeSuccessModal();
        }
    };
    document.addEventListener('keydown', escHandler);
    
    // 存储事件处理器以便清理
    modal._escHandler = escHandler;
}

// 新增：关闭成功提示模态框
function closeSuccessModal() {
    const modal = document.querySelector('.success-modal');
    if (modal) {
        // 移除ESC事件监听
        document.removeEventListener('keydown', modal._escHandler);
        modal.remove();
    }
}
// ========== 新增结束 ==========
        
        async function submitRating(orderId, orderType) {
    const ratingModal = document.getElementById('rating-modal');
    const stars = ratingModal.querySelectorAll('.rating-star');
    const comment = document.getElementById('rating-comment').value;
    
    let selectedRating = 0;
    stars.forEach(star => {
        if (star.classList.contains('selected')) {
            selectedRating = parseInt(star.dataset.rating);
        }
    });
    
    if (selectedRating === 0) {
        // 添加震动效果提示用户
        const ratingText = document.querySelector('#rating-text');
        ratingText.style.color = '#ff4757';
        ratingText.textContent = '请先选择评分！';
        
        // 星星震动效果
        stars.forEach(star => {
            star.style.animation = 'shake 0.5s ease-in-out';
        });
        setTimeout(() => {
            stars.forEach(star => {
                star.style.animation = '';
            });
        }, 500);
        return;
    }
    
    try {
        // 获取订单信息
        let order;
        if (orderType === 'delivery') {
            order = (await getDeliveryOrders()).find(o => o.id === orderId);
        } else {
            order = (await getErrandOrders()).find(o => o.id === orderId);
        }
        
        if (!order) {
            throw new Error('订单不存在');
        }
        
        // 判断用户角色
        const isPublisher = order.created_by === currentUser.id;
        const ratedUserId = isPublisher ? order.taken_by : order.created_by;
        const ratedUserName = isPublisher ? order.taker_name : order.contact_name;
        
        // 显示提交中状态
        const submitBtn = ratingModal.querySelector('button[onclick^="submitRating"]');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = '提交中...';
        submitBtn.disabled = true;
        
        // 保存评价
        const { error } = await supabase
            .from('ratings')
            .insert([{
                order_id: orderId,
                order_type: orderType,
                rater_id: currentUser.id,
                rater_name: currentUser.name,
                rated_user_id: ratedUserId,
                rated_user_name: ratedUserName,
                rating: selectedRating,
                comment: comment,
                role: isPublisher ? 'publisher' : 'taker'
            }]);
        
        if (error) throw error;
        
        // 提交成功效果
        submitBtn.textContent = '✓ 评价成功！';
        submitBtn.style.background = 'linear-gradient(135deg, #07c160, #05a050)';
        
        setTimeout(() => {
            closeRatingModal();
            alert('评价提交成功！感谢您的反馈。');
            
            // 刷新页面
            if (document.getElementById('delivery-home-page').classList.contains('active')) {
                renderDeliveryOrders();
            } else if (document.getElementById('errand-home-page').classList.contains('active')) {
                renderErrandOrders();
            } else if (document.getElementById('my-orders-page').classList.contains('active')) {
                renderMyOrders('all');
            } else if (document.getElementById('completed-orders-page').classList.contains('active')) {
                renderCompletedOrders('all');
            }
            
        }, 1000);
        
    } catch (error) {
        console.error('提交评价失败:', error);
        
        // 恢复按钮状态
        const submitBtn = ratingModal.querySelector('button[onclick^="submitRating"]');
        submitBtn.textContent = '提交评价';
        submitBtn.disabled = false;
        
        alert('评价提交失败，请重试！错误：' + error.message);
    }
}
        
        async function checkIfRated(orderId, orderType) {
    try {
        console.log('检查评价状态:', { orderId, orderType, userId: currentUser.id });
        
        const { data, error } = await supabase
            .from('ratings')
            .select('id')
            .eq('order_id', orderId)
            .eq('order_type', orderType)
            .eq('rater_id', currentUser.id);
        
        if (error) {
            console.error('Supabase 查询错误:', error);
            return false;
        }
        
        // 如果找到至少一条记录，则表示已评价
        return data.length > 0;
        
    } catch (error) {
        console.error('检查评价状态失败:', error);
        return false;
    }
}

        // 新增功能：订单详情页
        async function viewOrderDetails(orderId, orderType) {
            try {
                let order;
                if (orderType === 'delivery') {
                    const orders = await getDeliveryOrders();
                    order = orders.find(o => o.id === orderId);
                } else {
                    const orders = await getErrandOrders();
                    order = orders.find(o => o.id === orderId);
                }
                
                if (!order) {
                    alert('订单不存在！');
                    return;
                }
                
                // 创建详情模态框
                const detailModal = document.createElement('div');
                detailModal.className = 'order-detail-modal';
                
                let statusClass = '';
                let statusText = '';
                
                switch(order.status) {
                    case 'pending':
                        statusClass = 'status-pending';
                        statusText = '待接单';
                        break;
                    case 'taken':
                        statusClass = 'status-taken';
                        statusText = '已接单';
                        break;
                    case 'processing':
                        statusClass = 'status-processing';
                        statusText = '配送中';
                        break;
                    case 'delivered':
                        statusClass = 'status-delivered';
                        statusText = '已送达';
                        break;
                    case 'completed':
                        statusClass = 'status-completed';
                        statusText = '已完成';
                        break;
                    case 'cancelled':
                        statusClass = 'status-cancelled';
                        statusText = '已取消';
                        break;
                }
                
                // 判断用户角色
                const isMyOrder = order.created_by === currentUser.id;
                const userRole = isMyOrder ? '发布者' : '接单者';
                
                detailModal.innerHTML = `
    <div class="order-detail-content">
        <div class="order-detail-header">
            <div class="order-detail-title" style="font-size: 18px; font-weight: 600;">订单详情</div>
            <button class="order-detail-close" onclick="closeOrderDetail()" style="
                background: none;
                border: none;
                font-size: 24px;
                cursor: pointer;
                color: #666;
                width: 30px;
                height: 30px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 50%;
                transition: all 0.2s;
            " onmouseover="this.style.backgroundColor='#f0f0f0'" onmouseout="this.style.backgroundColor='transparent'">×</button>
        </div>
        
        <div class="order-detail-body">
            <div class="order-detail-section">
                <h4>基本信息</h4>
                <div class="order-detail-info">
                    <div class="order-detail-item">
                        <span class="order-detail-label">订单ID：</span>
                        <span class="order-detail-value">${order.id.slice(-8)}</span>
                    </div>
                    <div class="order-detail-item">
                        <span class="order-detail-label">订单类型：</span>
                        <span class="order-detail-value">${orderType === 'delivery' ? '代取快递' : '跑腿任务'}</span>
                    </div>
                    <div class="order-detail-item">
                        <span class="order-detail-label">您的角色：</span>
                        <span class="order-detail-value">${userRole}</span>
                    </div>
                    <div class="order-detail-item">
                        <span class="order-detail-label">订单状态：</span>
                        <span class="order-detail-value ${statusClass}">${statusText}</span>
                    </div>
                    <div class="order-detail-item">
                        <span class="order-detail-label">酬劳：</span>
                        <span class="order-detail-value">${order.reward}元</span>
                    </div>
                    <div class="order-detail-item">
                        <span class="order-detail-label">创建时间：</span>
                        <span class="order-detail-value">${new Date(order.created_at).toLocaleString()}</span>
                    </div>
                </div>
            </div>
            
            ${orderType === 'delivery' ? `
                <div class="order-detail-section">
                    <h4>代取详情</h4>
                    <div class="order-detail-info">
                        <div class="order-detail-item">
                            <span class="order-detail-label">取件地址：</span>
                            <span class="order-detail-value">${order.pickup_address}</span>
                        </div>
                        <div class="order-detail-item">
                            <span class="order-detail-label">送达地址：</span>
                            <span class="order-detail-value">${order.delivery_address}</span>
                        </div>
                        <div class="order-detail-item">
                            <span class="order-detail-label">期望送达时间：</span>
                            <span class="order-detail-value">${new Date(order.delivery_time).toLocaleString()}</span>
                        </div>
                        <div class="order-detail-item">
                            <span class="order-detail-label">取件码：</span>
                            <span class="order-detail-value">${order.pickup_code}</span>
                        </div>
                    </div>
                </div>
            ` : `
                <div class="order-detail-section">
                    <h4>任务详情</h4>
                    <div class="order-detail-info">
                        <div class="order-detail-item">
                            <span class="order-detail-label">任务标题：</span>
                            <span class="order-detail-value">${order.title}</span>
                        </div>
                        <div class="order-detail-item">
                            <span class="order-detail-label">任务描述：</span>
                            <span class="order-detail-value">${order.description}</span>
                        </div>
                        <div class="order-detail-item">
                            <span class="order-detail-label">取物地点：</span>
                            <span class="order-detail-value">${order.pickup_location}</span>
                        </div>
                        <div class="order-detail-item">
                            <span class="order-detail-label">送达地点：</span>
                            <span class="order-detail-value">${order.delivery_location}</span>
                        </div>
                        <div class="order-detail-item">
                            <span class="order-detail-label">期望完成时间：</span>
                            <span class="order-detail-value">${new Date(order.deadline).toLocaleString()}</span>
                        </div>
                    </div>
                </div>
            `}
            
            <div class="order-detail-section">
                <h4>联系人信息</h4>
                <div class="order-detail-info">
                    <!-- 发布者信息 - 发布者任何状态下都显示，接单人只有在接单后才显示 -->
                    <div class="order-detail-item">
                        <span class="order-detail-label">发布者：</span>
                        <span class="order-detail-value">${order.contact_name}</span>
                    </div>
                    
                    ${isMyOrder ? `
                        <!-- 如果当前用户是发布者，总是显示联系方式 -->
                        <div class="order-detail-item">
                            <span class="order-detail-label">发布者联系方式：</span>
                            <span class="order-detail-value">${order.contact_info}</span>
                        </div>
                        <div class="order-detail-item">
                            <span class="order-detail-label">发布者联系方式类型：</span>
                            <span class="order-detail-value">${getContactTypeText(order.contact_type)}</span>
                        </div>
                    ` : (order.status !== 'pending' && order.taken_by === currentUser.id) ? `
                        <!-- 如果当前用户是接单人且已接单，显示发布者联系方式 -->
                        <div class="order-detail-item">
                            <span class="order-detail-label">发布者联系方式：</span>
                            <span class="order-detail-value">${order.contact_info}</span>
                        </div>
                        <div class="order-detail-item">
                            <span class="order-detail-label">发布者联系方式类型：</span>
                            <span class="order-detail-value">${getContactTypeText(order.contact_type)}</span>
                        </div>
                    ` : `
                        <!-- 其他情况不显示发布者联系方式 -->
                        <div class="order-detail-item">
                            <span class="order-detail-label">发布者联系方式：</span>
                            <span class="order-detail-value" style="color: #999; font-style: italic;">接单后可见</span>
                        </div>
                        <div class="order-detail-item">
                            <span class="order-detail-label">发布者联系方式类型：</span>
                            <span class="order-detail-value" style="color: #999; font-style: italic;">接单后可见</span>
                        </div>
                    `}
                    
                    ${order.taken_by ? `
                        <!-- 接单者信息 - 只在有人接单后显示 -->
                        <div class="order-detail-item">
                            <span class="order-detail-label">接单者：</span>
                            <span class="order-detail-value">${order.taker_name}</span>
                        </div>
                        <div class="order-detail-item">
                            <span class="order-detail-label">接单者联系方式：</span>
                            <span class="order-detail-value">${order.taker_contact}</span>
                        </div>
                        <div class="order-detail-item">
                            <span class="order-detail-label">接单者联系方式类型：</span>
                            <span class="order-detail-value">${getContactTypeText(order.taker_contact_type)}</span>
                        </div>
                    ` : ''}
                </div>
            </div>
            
            ${order.notes ? `
                <div class="order-detail-section">
                    <h4>备注</h4>
                    <div class="order-detail-info">
                        <div class="order-detail-item">
                            <span class="order-detail-label">备注信息：</span>
                            <span class="order-detail-value">${order.notes}</span>
                        </div>
                    </div>
                </div>
            ` : ''}
            
            <div class="order-actions" style="margin-top: 20px; display: flex; gap: 10px; flex-wrap: wrap;">
                ${(order.status === 'taken' || order.status === 'processing' || order.status === 'delivered') && (order.created_by === currentUser.id || order.taken_by === currentUser.id) ? 
                    `<button class="action-btn btn-chat" onclick="openChat('${order.id}', '${orderType}')" style="flex: 1;">联系对方</button>` : ''}
                    
                <!-- 取消接单按钮 - 仅在订单状态为taken且当前用户是接单者或发布者时显示 -->
                ${order.status === 'taken' && (order.taken_by === currentUser.id || order.created_by === currentUser.id) ? 
                    `<button class="action-btn btn-cancel" onclick="cancelTakeOrder('${order.id}', '${orderType}')" style="flex: 1;">取消接单</button>` : ''}
                    
                <!-- 修改订单按钮 - 仅在订单状态为pending或taken且当前用户是发布者时显示 -->
                ${(order.status === 'pending' || order.status === 'taken') && order.created_by === currentUser.id ? 
                    `<button class="action-btn btn-modify" onclick="openModifyOrderModal('${order.id}', '${orderType}')" style="flex: 1;">修改订单</button>` : ''}
                    
                ${order.status === 'processing' && order.taken_by === currentUser.id ? 
                    `<button class="action-btn btn-delivered" onclick="markAsDelivered('${order.id}', '${orderType}')" style="flex: 1;">已送达</button>` : ''}
                ${order.status === 'delivered' && order.created_by === currentUser.id ? 
                    `<button class="action-btn btn-confirm" onclick="confirmCompletion('${order.id}', '${orderType}')" style="flex: 1;">确认完成</button>` : ''}
                ${order.status === 'completed' ? 
                    `<button class="action-btn btn-rate" onclick="rateOrder('${order.id}', '${orderType}')" style="flex: 1;">评价</button>` : ''}
            </div>
        </div>
    </div>
`;
                
                document.body.appendChild(detailModal);
                
            } catch (error) {
                console.error('加载订单详情失败:', error);
                alert('加载订单详情失败！');
            }
        }
        
        function closeOrderDetail() {
            const detailModal = document.querySelector('.order-detail-modal');
            if (detailModal) {
                detailModal.remove();
            }
        }

        // 打开修改订单模态框
        async function openModifyOrderModal(orderId, orderType) {
            try {
                let order;
                if (orderType === 'delivery') {
                    // 直接从数据库获取指定订单的详细信息，使用try-catch处理可能的字段缺失错误
                    try {
                        const { data, error } = await supabase
                            .from('delivery_orders')
                            .select('*')
                            .eq('id', orderId)
                            .single();
                        
                        if (error) throw error;
                        order = data;
                    } catch (err) {
                        console.error('获取delivery_orders数据出错:', err);
                        // 如果字段不存在，尝试只获取基本字段
                        const { data, error: fetchError } = await supabase
                            .from('delivery_orders')
                            .select('id,created_by,status,pickup_address,delivery_address,delivery_time,pickup_code,contact_name,contact_info,contact_type,reward,taken_by,taker_name,taker_contact,taker_contact_type,created_at,updated_at')
                            .eq('id', orderId)
                            .single();
                        
                        if (fetchError) throw fetchError;
                        order = data;
                    }
                    
                    // 对于代取订单，需要映射字段名以确保表单正确填充
                    if (order) {
                        // 确保所有必需的字段都有值
                        order.title = order.title || '代取快递';
                        order.pickup_location = order.pickup_address || '';
                        order.delivery_location = order.delivery_address || '';
                        order.deadline = order.delivery_time || '';
                        order.description = order.description || '';
                        order.contact_name = order.contact_name || '';
                        order.contact_info = order.contact_info || '';
                        order.contact_type = order.contact_type || 'wechat';
                        order.reward = order.reward || '3';
                        order.notes = order.notes || '';
                    }
                } else {
                    // 直接从数据库获取指定跑腿订单的详细信息
                    const { data, error } = await supabase
                        .from('errand_orders')
                        .select('*')
                        .eq('id', orderId)
                        .single();
                    
                    if (error) throw error;
                    order = data;
                    
                    // 确保所有必需的字段都有值
                    if (order) {
                        order.title = order.title || '跑腿任务';
                        order.pickup_location = order.pickup_location || '';
                        order.delivery_location = order.delivery_location || '';
                        order.deadline = order.deadline || '';
                        order.description = order.description || '';
                        order.contact_name = order.contact_name || '';
                        order.contact_info = order.contact_info || '';
                        order.contact_type = order.contact_type || 'wechat';
                        order.reward = order.reward || '3';
                        order.notes = order.notes || '';
                    }
                }
                
                if (!order) {
                    alert('订单不存在！');
                    return;
                }
                
                // 关闭当前订单详情模态框
                closeOrderDetail();
                
                // 创建修改订单模态框
                const modifyModal = document.createElement('div');
                modifyModal.className = 'modify-order-modal';
                
                // 判断订单类型
                const isDelivery = orderType === 'delivery';
                const orderTitle = isDelivery ? '修改代取快递订单' : '修改跑腿任务订单';
                
                modifyModal.innerHTML = `
                    <div class="modify-order-content">
                        <div class="modify-order-header">
                            <div class="modify-order-title">${orderTitle}</div>
                            <button class="modify-order-close" onclick="closeModifyOrder()" style="
                                background: none;
                                border: none;
                                font-size: 24px;
                                cursor: pointer;
                                color: #666;
                                width: 30px;
                                height: 30px;
                                display: flex;
                                align-items: center;
                                justify-content: center;
                                border-radius: 50%;
                                transition: all 0.2s;
                            " onmouseover="this.style.backgroundColor='#f0f0f0'" onmouseout="this.style.backgroundColor='transparent'">×</button>
                        </div>
                        
                        <div class="modify-order-body">
                            <form id="modify-order-form" onsubmit="event.preventDefault(); saveModifiedOrder('${orderId}', '${orderType}');">
                                <!-- 通用表单字段，两个表结构相同 -->
                                <div class="form-group">
                                    <label>${isDelivery ? '订单标题' : '任务标题'} <span class="required">*</span></label>
                                    <input type="text" id="modify-title" name="title" value="${order.title || ''}" required>
                                </div>
                                <div class="form-group">
                                    <label>${isDelivery ? '订单描述' : '任务描述'} <span class="required">*</span></label>
                                    <textarea id="modify-description" name="description" rows="3" required>${order.description || ''}</textarea>
                                </div>
                                <div class="form-group">
                                    <label>取物地点 <span class="required">*</span></label>
                                    <input type="text" id="modify-pickup-location" name="pickup_location" value="${order.pickup_location || ''}" required>
                                </div>
                                <div class="form-group">
                                    <label>送达地点 <span class="required">*</span></label>
                                    <input type="text" id="modify-delivery-location" name="delivery_location" value="${order.delivery_location || ''}" required>
                                </div>
                                <div class="form-group">
                                    <label>期望${isDelivery ? '送达' : '完成'}时间 <span class="required">*</span></label>
                                    <input type="datetime-local" id="modify-deadline" name="deadline" value="${order.deadline ? new Date(order.deadline).toISOString().slice(0, 16) : ''}" required>
                                </div>
                                
                                <div class="form-group">
                                    <label>酬劳 (元) <span class="required">*</span></label>
                                    <input type="number" id="modify-reward" name="reward" value="${order.reward || ''}" min="0" step="0.01" required>
                                </div>
                                
                                <div class="form-group">
                                    <label>联系人姓名 <span class="required">*</span></label>
                                    <input type="text" id="modify-contact-name" name="contact_name" value="${order.contact_name || ''}" required>
                                </div>
                                
                                <div class="form-group">
                                    <label>联系方式 <span class="required">*</span></label>
                                    <input type="text" id="modify-contact-info" name="contact_info" value="${order.contact_info || ''}" required>
                                </div>
                                
                                <div class="form-group">
                                    <label>联系方式类型</label>
                                    <select id="modify-contact-type" name="contact_type">
                                        <option value="phone" ${order.contact_type === 'phone' ? 'selected' : ''}>电话</option>
                                        <option value="wechat" ${order.contact_type === 'wechat' ? 'selected' : ''}>微信</option>
                                        <option value="qq" ${order.contact_type === 'qq' ? 'selected' : ''}>QQ</option>
                                        <option value="other" ${order.contact_type === 'other' ? 'selected' : ''}>其他</option>
                                    </select>
                                </div>
                                
                                <div class="form-group">
                                    <label>备注信息</label>
                                    <textarea id="modify-notes" name="notes" rows="3">${order.notes || ''}</textarea>
                                </div>
                                
                                <div class="form-actions" style="margin-top: 20px; display: flex; gap: 10px;">
                                    <button type="button" class="btn btn-secondary" onclick="closeModifyOrder()">取消</button>
                                    <button type="submit" class="btn btn-primary">保存修改</button>
                                </div>
                            </form>
                        </div>
                    </div>
                `;
                
                // 添加到页面
                document.body.appendChild(modifyModal);
                
            } catch (error) {
                console.error('打开修改订单模态框失败:', error);
                alert('打开修改页面失败！');
            }
        }

        // 保存修改的订单
        async function saveModifiedOrder(orderId, orderType) {
            try {
                // 获取表单数据
                const form = document.getElementById('modify-order-form');
                const formData = new FormData(form);
                
                // 准备参数，处理不同订单类型的字段名差异
                if (orderType === 'delivery') {
                    // 对于代取订单，使用不同的函数直接更新数据库
                    const updateData = {
                        title: formData.get('title'),
                        description: formData.get('description'),
                        pickup_address: formData.get('pickup_location'), // 表单字段是 pickup_location
                        delivery_address: formData.get('delivery_location'), // 表单字段是 delivery_location
                        delivery_time: formData.get('deadline') ? new Date(formData.get('deadline')).toISOString() : null,
                        reward: formData.get('reward') ? parseFloat(formData.get('reward')) : null,
                        contact_name: formData.get('contact_name'),
                        contact_info: formData.get('contact_info'),
                        contact_type: formData.get('contact_type'),
                        notes: formData.get('notes'),
                        updated_at: new Date().toISOString()
                    };
                    
                    const { error } = await supabase
                        .from('delivery_orders')
                        .update(updateData)
                        .eq('id', orderId);
                    
                    if (error) throw error;
                    
                    showSuccessModal('修改成功', '代取订单信息已更新。');
                } else {
                    // 对于跑腿订单，使用现有的函数
                    const params = {
                        order_id_in: orderId,
                        user_id_in: currentUser.id,
                        order_type_in: orderType,
                        title_in: formData.get('title') || null,
                        description_in: formData.get('description') || null,
                        pickup_location_in: formData.get('pickup_location') || null,
                        delivery_location_in: formData.get('delivery_location') || null,
                        deadline_in: formData.get('deadline') ? new Date(formData.get('deadline')).toISOString() : null,
                        reward_in: formData.get('reward') ? parseFloat(formData.get('reward')) : null,
                        contact_name_in: formData.get('contact_name') || null,
                        contact_info_in: formData.get('contact_info') || null,
                        contact_type_in: formData.get('contact_type') || null,
                        notes_in: formData.get('notes') || null
                    };
                    
                    // 调用数据库函数修改订单
                    const { data, error } = await supabase.rpc('update_order_info', params);
                    
                    if (error) throw error;
                    
                    // 根据返回结果处理
                    switch(data) {
                        case 'SUCCESS':
                            showSuccessModal('修改成功', '订单信息已更新。');
                            break;
                        case 'SUCCESS_WITH_NOTIFICATION':
                            showSuccessModal('修改成功', '订单信息已更新，并已通知接单者。');
                            break;
                        case 'ORDER_NOT_FOUND':
                            alert('订单不存在！');
                            return;
                        case 'NO_PERMISSION':
                            alert('您没有权限修改此订单！');
                            return;
                        case 'WRONG_STATUS':
                            alert('当前订单状态不能修改！');
                            return;
                        default:
                            alert('修改失败，请重试！');
                            return;
                    }
                }
                
                // 刷新页面数据
                await refreshAllPages();
                closeModifyOrder(); // 关闭修改模态框
                viewOrderDetails(orderId, orderType); // 重新打开订单详情页
                
            } catch (error) {
                alert('修改订单失败，请重试！');
                console.error('修改订单错误:', error);
            }
        }

        // 关闭修改订单模态框
        function closeModifyOrder() {
            const modifyModal = document.querySelector('.modify-order-modal');
            if (modifyModal) {
                modifyModal.remove();
            }
        }
        
        // 获取联系方式类型文本
        function getContactTypeText(contactType) {
            switch(contactType) {
                case 'phone': return '电话';
                case 'wechat': return '微信';
                case 'qq': return 'QQ';
                case 'other': return '其他';
                default: return contactType || '未知';
            }
        }

        // 新增功能：消息推送
        function requestNotificationPermission() {
            if (!("Notification" in window)) {
                console.log("浏览器不支持通知");
                return;
            }
            
            if (Notification.permission === "default") {
                Notification.requestPermission().then(permission => {
                    notificationPermission = permission === "granted";
                    console.log("通知权限状态:", permission);
                });
            } else {
                notificationPermission = Notification.permission === "granted";
            }
        }
        
        function sendNotification(title, body) {
            if (!notificationPermission) return;
            
            if (Notification.permission === "granted") {
                new Notification(title, {
                    body: body,
                    icon: '/favicon.ico' // 可以替换为您的图标
                });
            }
        }

        // ==================== 性能优化工具函数 ====================
        // 防抖函数
        function debounce(func, wait) {
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

        // 节流函数
        function throttle(func, limit) {
            let inThrottle;
            return function() {
                const args = arguments;
                const context = this;
                if (!inThrottle) {
                    func.apply(context, args);
                    inThrottle = true;
                    setTimeout(() => inThrottle = false, limit);
                }
            };
        }

        // 简单的内存缓存实现
        const memoryCache = {
            cache: new Map(),
            get(key) {
                const item = this.cache.get(key);
                if (!item) return null;
                
                // 检查是否过期（5分钟）
                if (Date.now() - item.timestamp > 5 * 60 * 1000) {
                    this.cache.delete(key);
                    return null;
                }
                
                return item.value;
            },
            set(key, value) {
                this.cache.set(key, {
                    value: value,
                    timestamp: Date.now()
                });
            },
            clear() {
                this.cache.clear();
            }
        };

        // 图片压缩函数
        function compressImage(file, quality = 0.7) {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.readAsDataURL(file);
                reader.onload = function(event) {
                    const img = new Image();
                    img.src = event.target.result;
                    img.onload = function() {
                        const canvas = document.createElement('canvas');
                        const ctx = canvas.getContext('2d');
                        
                        // 计算新尺寸，最大宽度800px
                        const maxWidth = 800;
                        const scale = Math.min(maxWidth / img.width, 1);
                        canvas.width = img.width * scale;
                        canvas.height = img.height * scale;
                        
                        // 绘制图像
                        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                        
                        // 转换为Blob
                        canvas.toBlob(resolve, 'image/jpeg', quality);
                    };
                    img.onerror = reject;
                };
                reader.onerror = reject;
            });
        }

        // 图片懒加载实现
        class LazyImageLoader {
            constructor() {
                this.imageObserver = null;
                this.init();
            }
            
            init() {
                // 检查是否支持 Intersection Observer
                if ('IntersectionObserver' in window) {
                    this.imageObserver = new IntersectionObserver((entries, observer) => {
                        entries.forEach(entry => {
                            if (entry.isIntersecting) {
                                const img = entry.target;
                                img.src = img.dataset.src;
                                img.classList.remove('lazy');
                                this.imageObserver.unobserve(img);
                            }
                        });
                    }, {
                        rootMargin: '50px' // 提前50px加载
                    });
                }
            }
            
            observe(img) {
                if (this.imageObserver) {
                    this.imageObserver.observe(img);
                } else {
                    // 降级处理：直接加载图片
                    img.src = img.dataset.src;
                }
            }
            
            destroy() {
                if (this.imageObserver) {
                    this.imageObserver.disconnect();
                }
            }
        }

        // 虚拟滚动实现
        class VirtualScroll {
            constructor(container, itemHeight, renderFunction) {
                this.container = container;
                this.itemHeight = itemHeight;
                this.renderFunction = renderFunction;
                this.items = [];
                this.visibleStart = 0;
                this.visibleEnd = 0;
                this.scrollTop = 0;
                this.containerHeight = 0;
                
                this.init();
            }
            
            init() {
                this.container.addEventListener('scroll', throttle(() => {
                    this.handleScroll();
                }, 16)); // 约60fps
                
                this.resizeObserver = new ResizeObserver(entries => {
                    for (let entry of entries) {
                        this.containerHeight = entry.contentRect.height;
                        this.updateVisibleRange();
                    }
                });
                this.resizeObserver.observe(this.container);
            }
            
            setItems(items) {
                this.items = items;
                this.updateVisibleRange();
            }
            
            handleScroll() {
                this.scrollTop = this.container.scrollTop;
                this.updateVisibleRange();
            }
            
            updateVisibleRange() {
                if (!this.containerHeight) return;
                
                const start = Math.floor(this.scrollTop / this.itemHeight);
                const visibleCount = Math.ceil(this.containerHeight / this.itemHeight) + 1;
                const end = Math.min(start + visibleCount, this.items.length);
                
                if (start !== this.visibleStart || end !== this.visibleEnd) {
                    this.visibleStart = start;
                    this.visibleEnd = end;
                    this.render();
                }
            }
            
            render() {
                const totalHeight = this.items.length * this.itemHeight;
                const visibleItems = this.items.slice(this.visibleStart, this.visibleEnd);
                
                let html = `<div style="height: ${totalHeight}px; position: relative;">`;
                let offset = this.visibleStart * this.itemHeight;
                
                visibleItems.forEach((item, index) => {
                    const itemHtml = this.renderFunction(item);
                    html += `<div style="position: absolute; top: ${offset + index * this.itemHeight}px; width: 100%;">${itemHtml}</div>`;
                });
                
                html += '</div>';
                this.container.innerHTML = html;
            }
            
            destroy() {
                if (this.resizeObserver) {
                    this.resizeObserver.disconnect();
                }
            }
        }

        // 定时器管理器
        class TimerManager {
            constructor() {
                this.timers = new Set();
                this.intervals = new Set();
            }
            
            setTimeout(callback, delay, ...args) {
                const timerId = setTimeout(() => {
                    this.timers.delete(timerId);
                    callback(...args);
                }, delay);
                this.timers.add(timerId);
                return timerId;
            }
            
            setInterval(callback, delay, ...args) {
                const intervalId = setInterval(callback, delay, ...args);
                this.intervals.add(intervalId);
                return intervalId;
            }
            
            clearTimeout(timerId) {
                clearTimeout(timerId);
                this.timers.delete(timerId);
            }
            
            clearInterval(intervalId) {
                clearInterval(intervalId);
                this.intervals.delete(intervalId);
            }
            
            clearAll() {
                this.timers.forEach(timerId => clearTimeout(timerId));
                this.intervals.forEach(intervalId => clearInterval(intervalId));
                this.timers.clear();
                this.intervals.clear();
            }
        }

        // 创建全局定时器管理器实例
        const timerManager = new TimerManager();

        // 优化的订单获取函数，带缓存
        async function getCachedDeliveryOrders() {
            console.log('=== getCachedDeliveryOrders 开始执行 ===');
            const cacheKey = 'delivery_orders';
            const cached = memoryCache.get(cacheKey);
            if (cached) {
                console.log('从缓存获取代取订单数据，数量：', cached.length);
                // 检查缓存中的订单是否有状态为 pending 的
                const pendingCount = cached.filter(o => o.status === 'pending').length;
                console.log('缓存中待接单的代取订单数量：', pendingCount);
                console.log('=== getCachedDeliveryOrders 执行完成（从缓存） ===');
                return cached;
            }
            
            console.log('从数据库获取代取订单数据');
            try {
                const orders = await getDeliveryOrders();
                console.log('从数据库获取到代取订单数量：', orders.length);
                // 检查获取的订单是否有状态为 pending 的
                const pendingCount = orders.filter(o => o.status === 'pending').length;
                console.log('从数据库获取的待接单代取订单数量：', pendingCount);
                
                // 确保订单数据是有效的
                if (!Array.isArray(orders)) {
                    console.error('订单数据不是数组:', orders);
                    console.log('将订单数据设为空数组');
                    const emptyOrders = [];
                    memoryCache.set(cacheKey, emptyOrders);
                    return emptyOrders;
                }
                
                memoryCache.set(cacheKey, orders);
                console.log('=== getCachedDeliveryOrders 执行完成（从数据库） ===');
                return orders;
            } catch (error) {
                console.error('getCachedDeliveryOrders 获取订单数据失败:', error);
                // 返回空数组而不是抛出错误，避免渲染流程中断
                return [];
            }
        }

        async function getCachedErrandOrders() {
            console.log('=== getCachedErrandOrders 开始执行 ===');
            const cacheKey = 'errand_orders';
            const cached = memoryCache.get(cacheKey);
            if (cached) {
                console.log('从缓存获取跑腿订单数据，数量：', cached.length);
                // 检查缓存中的订单是否有状态为 pending 的
                const pendingCount = cached.filter(o => o.status === 'pending').length;
                console.log('缓存中待接单的跑腿任务数量：', pendingCount);
                return cached;
            }
            
            console.log('从数据库获取跑腿订单数据');
            try {
                const orders = await getErrandOrders();
                console.log('从数据库获取到跑腿任务数量：', orders.length);
                // 检查获取的订单是否有状态为 pending 的
                const pendingCount = orders.filter(o => o.status === 'pending').length;
                console.log('从数据库获取的待接单跑腿任务数量：', pendingCount);
                
                // 确保订单数据是有效的
                if (!Array.isArray(orders)) {
                    console.error('跑腿订单数据不是数组:', orders);
                    console.log('将跑腿订单数据设为空数组');
                    const emptyOrders = [];
                    memoryCache.set(cacheKey, emptyOrders);
                    return emptyOrders;
                }
                
                memoryCache.set(cacheKey, orders);
                console.log('=== getCachedErrandOrders 执行完成（从数据库） ===');
                return orders;
            } catch (error) {
                console.error('getCachedErrandOrders 获取订单数据失败:', error);
                // 返回空数组而不是抛出错误，避免渲染流程中断
                return [];
            }
        }

        // 清除订单缓存
        function clearOrderCache() {
            memoryCache.cache.delete('delivery_orders');
            memoryCache.cache.delete('errand_orders');
        }

// 自动刷新页面数据
async function refreshAllPages() {
    console.log('刷新所有页面数据...');
    
    try {
        // 清除订单缓存
        clearOrderCache();
        
        // 并行刷新各个页面
        await Promise.all([
            updateMainPageStats().catch(console.error),
            refreshCurrentPage().catch(console.error),
            updateTabUnreadBadge().catch(console.error)
        ]);
        
        console.log('页面刷新完成');
        
    } catch (error) {
        console.error('刷新页面失败:', error);
    }
}

// ========== 新增：刷新当前页面的函数 ==========
async function refreshCurrentPage() {
    const activePage = document.querySelector('.page.active');
    if (!activePage) return;
    
    const pageId = activePage.id;
    
    switch(pageId) {
        case 'delivery-home-page':
            await renderDeliveryOrders();
            break;
        case 'errand-home-page':
            await renderErrandOrders();
            break;
        case 'chat-home-page':
            renderChatHome();
            break;
        case 'take-order-page':
            await renderAvailableOrders();
            break;
        case 'take-errand-page':
            await renderAvailableErrands();
            break;
        case 'my-orders-page':
            await renderMyOrders();
            break;
        case 'completed-orders-page':
            await renderCompletedOrders('all');
            break;
    }
}

        // ==================== 优化事件监听器 ====================
        // 优化的滚动事件处理
        const handleScroll = throttle(function() {
            // 可以在这里添加滚动相关的优化逻辑
        }, 100);

        // 优化的窗口大小变化处理
        const handleResize = debounce(function() {
            // 可以在这里添加响应式布局相关的优化逻辑
        }, 250);

        // ==================== 性能优化结束 ====================

        // 设置默认时间为当前时间1小时后
        function setDefaultTimeValues() {
            // 获取当前时间并添加1小时
            const now = new Date();
            now.setHours(now.getHours() + 1);
            
            // 格式化为datetime-local所需的格式 (YYYY-MM-DDTHH:MM)
            const year = now.getFullYear();
            const month = String(now.getMonth() + 1).padStart(2, '0');
            const day = String(now.getDate()).padStart(2, '0');
            const hours = String(now.getHours()).padStart(2, '0');
            const minutes = String(now.getMinutes()).padStart(2, '0');
            
            const formattedTime = `${year}-${month}-${day}T${hours}:${minutes}`;
            
            // 设置代取快递订单的期望送达时间
            const deliveryTimeInput = document.getElementById('delivery-time');
            if (deliveryTimeInput) {
                deliveryTimeInput.value = formattedTime;
            }
            
            // 设置跑腿任务的期望完成时间
            const errandDeadlineInput = document.getElementById('errand-deadline');
            if (errandDeadlineInput) {
                errandDeadlineInput.value = formattedTime;
            }
        }
        
        // 当页面切换到订单发布页面时设置默认时间
        function showPage(pageId) {
            // 隐藏所有页面
            document.querySelectorAll('.page').forEach(page => {
                page.style.display = 'none';
                page.classList.remove('active');
            });
            
            // 显示指定页面
            const targetPage = document.getElementById(pageId);
            if (targetPage) {
                targetPage.style.display = 'block';
                targetPage.classList.add('active');
                
                // 如果切换到订单发布页面，设置默认时间
                if (pageId === 'order-page' || pageId === 'errand-order-page') {
                    setDefaultTimeValues();
                }
            }

            // 为表单页面添加自动填充
            if (pageId === 'order-page' || pageId === 'take-order-page' || 
                pageId === 'errand-order-page' || pageId === 'take-errand-page') {
                
                // 直接尝试自动填充（添加小延迟确保DOM渲染完成）
                setTimeout(() => {
                    console.log('尝试自动填充表单页面:', pageId);
                    autoFillContactInfo();
                }, 100);
                
                // 使用 MutationObserver 作为备用方案
                const observer = new MutationObserver((mutations) => {
                    console.log('MutationObserver 检测到变化，尝试自动填充');
                    autoFillContactInfo();
                });
                
                // 开始观察
                if (targetPage) {
                    observer.observe(targetPage, {
                        childList: true,
                        subtree: true
                    });
                    
                    // 2秒后自动停止观察，避免内存泄漏
                    setTimeout(() => {
                        observer.disconnect();
                    }, 2000);
                }
            }

            
            // 更新底部导航栏的active状态
            updateTabBarActive(pageId);
        }
        
        // 更新底部导航栏的active状态
        function updateTabBarActive(pageId) {
            // 移除所有tab-item的active类
            document.querySelectorAll('.tab-item').forEach(item => {
                item.classList.remove('active');
            });
            
            // 根据页面ID设置对应的tab-item为active
            let tabItem;
            switch(pageId) {
                case 'main-page':
                    tabItem = document.querySelector('.tab-item[onclick="showPage(\'main-page\')"]');
                    break;
                case 'delivery-home-page':
                case 'order-page':
                case 'take-order-page':
                    tabItem = document.querySelector('.tab-item[onclick="enterDeliveryService()"]');
                    break;
                case 'errand-home-page':
                case 'errand-order-page':
                case 'take-errand-page':
                    tabItem = document.querySelector('.tab-item[onclick="enterErrandService()"]');
                    break;
                case 'chat-home-page':
                    tabItem = document.querySelector('.tab-item[onclick="showPage(\'chat-home-page\')"]');
                    break;
                case 'settings-page':
                    tabItem = document.querySelector('.tab-item[onclick="showPage(\'settings-page\')"]');
                    break;
                case 'my-orders-page':
                case 'completed-orders-page':
                    // 我的订单和已完成订单页面不对应特定的tab
                    break;
            }
            
            // 添加active类到对应的tab-item
            if (tabItem) {
                tabItem.classList.add('active');
            }
        }
        
        // 测试函数，用户可以在控制台中调用
        window.testOrderLoading = async function() {
            console.log('=== 手动测试订单加载 ===');
            console.log('当前用户:', currentUser);
            console.log('当前页面:', document.querySelector('.page.active')?.id);
            
            try {
                const orders = await getCachedDeliveryOrders();
                console.log('测试获取订单成功，数量:', orders.length);
                console.log('订单样本:', orders[0]);
            } catch (error) {
                console.error('测试获取订单失败:', error);
            }
        };
        
// 页面加载完成后初始化
        document.addEventListener('DOMContentLoaded', function() {
            console.log('=== DOM内容加载完成，开始初始化 ===');
            
            // 添加优化的事件监听器
            window.addEventListener('scroll', handleScroll);
            window.addEventListener('resize', handleResize);
            
            // 初始化图片懒加载器
            window.lazyImageLoader = new LazyImageLoader();
            
            // 打印当前页面状态
            console.log('当前活动页面:', document.querySelector('.page.active')?.id);
            console.log('领取页面元素状态:');
            console.log('  take-order-page存在:', !!document.getElementById('take-order-page'));
            console.log('  take-order-page active:', document.getElementById('take-order-page')?.classList.contains('active'));
            console.log('  take-errand-page存在:', !!document.getElementById('take-errand-page'));
            console.log('  take-errand-page active:', document.getElementById('take-errand-page')?.classList.contains('active'));
            
            // 初始化应用
            console.log('开始初始化应用...');
            initApp().then(() => {
                console.log('=== 应用初始化完成 ===');
                // 再次打印当前页面状态
                console.log('初始化后活动页面:', document.querySelector('.page.active')?.id);
                console.log('提示：您可以在控制台输入 testOrderLoading() 来测试订单加载');
            }).catch(error => {
                console.error('应用初始化失败:', error);
            });
        });
        
        // 在页面卸载前清理事件监听器和定时器
        window.addEventListener('beforeunload', function() {
            window.removeEventListener('scroll', handleScroll);
            window.removeEventListener('resize', handleResize);
            
            // 清理所有定时器
            timerManager.clearAll();
            
            // 销毁图片懒加载器
            if (window.lazyImageLoader) {
                window.lazyImageLoader.destroy();
            }
        });
        
        // 帮助与客服功能
function showHelp(title, content) {
    alert(title + '\n\n' + content);
}

function contactCustomerService() {
    const contactInfo = `
校园服务平台客服联系方式：

客服电话：400-123-4567
客服微信：campus_service
客服邮箱：service@campus.com
服务时间：周一至周日 9:00-22:00

如有任何问题，请随时联系我们！
    `;
    alert(contactInfo);
}

// 更新筛选器视觉状态
function updateFilterVisuals() {
    const statusFilter = document.getElementById('status-filter');
    const typeFilter = document.getElementById('type-filter');
    
    // 移除所有特殊样式
    document.querySelectorAll('.filter-select').forEach(select => {
        select.classList.remove('filter-active');
    });
    
    // 为已选择的筛选器添加样式
    if (statusFilter && statusFilter.value !== 'all') {
        statusFilter.classList.add('filter-active');
    }
    if (typeFilter && typeFilter.value !== 'all') {
        typeFilter.classList.add('filter-active');
    }
}


function applyFilters() {
    const statusFilter = document.getElementById('status-filter');
    const typeFilter = document.getElementById('type-filter');
    
    if (statusFilter) {
        currentFilters.status = statusFilter.value;
    }
    if (typeFilter) {
        currentFilters.type = typeFilter.value;
    }
    
    // 更新视觉状态
    updateFilterVisuals();
    
    // 重新渲染订单列表
    renderMyOrders();
}

// ==================== 新增：确认模态框函数 ====================
function showConfirmModal(title, message, confirmCallback) {
    // 创建模态框
    const modal = document.createElement('div');
    modal.className = 'confirm-modal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
    `;
    
    modal.innerHTML = `
        <div style="background: white; width: 80%; max-width: 300px; border-radius: 10px; padding: 20px; text-align: center;">
            <h3 style="margin-top: 0;">${title}</h3>
            <p>${message}</p>
            <div style="display: flex; gap: 10px; justify-content: center; margin-top: 20px;">
                <button onclick="this.closest('.confirm-modal').remove()" style="padding: 8px 16px; border: 1px solid #ccc; background: white; border-radius: 5px; cursor: pointer;">取消</button>
                <button id="confirm-ok" style="padding: 8px 16px; background: #ff4757; color: white; border: none; border-radius: 5px; cursor: pointer;">确认</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // 确认按钮事件
    document.getElementById('confirm-ok').addEventListener('click', function() {
        modal.remove();
        if (confirmCallback) confirmCallback();
    });
    
    // 点击背景关闭
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            modal.remove();
        }
    });
}
// ==================== 确认模态框函数结束 ====================

// ==================== 新增：Toast提示函数 ====================
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 12px 20px;
        background: ${type === 'error' ? '#ff4757' : type === 'success' ? '#07c160' : '#2f3542'};
        color: white;
        border-radius: 8px;
        z-index: 1000;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        transform: translateX(100%);
        transition: transform 0.3s ease;
        max-width: 300px;
        word-wrap: break-word;
    `;
    toast.textContent = message;
    
    document.body.appendChild(toast);
    
    // 显示动画
    setTimeout(() => {
        toast.style.transform = 'translateX(0)';
    }, 100);
    
    // 3秒后自动隐藏
    setTimeout(() => {
        toast.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }, 3000);
}

// ========== 新增：强制刷新所有页面的函数 ==========
async function forceRefreshAllPages() {
    console.log('强制刷新所有页面数据...');
    
    try {
        // 1. 清除所有缓存
        if (memoryCache && memoryCache.clear) {
            memoryCache.clear();
        }
        clearOrderCache();
        
        // 2. 重新获取所有订单数据
        const [deliveryOrders, errandOrders] = await Promise.all([
            getDeliveryOrders(),
            getErrandOrders()
        ]);
        
        // 3. 更新缓存
        if (memoryCache && memoryCache.set) {
            memoryCache.set('delivery_orders', deliveryOrders);
            memoryCache.set('errand_orders', errandOrders);
        }
        
        console.log('强制刷新完成');
        
    } catch (error) {
        console.error('强制刷新失败:', error);
    }
}

// ========== 新增：刷新当前页面的函数 ==========
async function refreshCurrentPage() {
    const activePage = document.querySelector('.page.active');
    if (!activePage) return;
    
    const pageId = activePage.id;
    
    switch(pageId) {
        case 'delivery-home-page':
            await renderDeliveryOrders();
            break;
        case 'errand-home-page':
            await renderErrandOrders();
            break;
        case 'chat-home-page':
            renderChatHome();
            break;
        case 'take-order-page':
            await renderAvailableOrders();
            break;
        case 'take-errand-page':
            await renderAvailableErrands();
            break;
        case 'my-orders-page':
            await renderMyOrders();
            break;
        case 'completed-orders-page':
            await renderCompletedOrders('all');
            break;
    }
}
// ==================== Toast提示函数结束 ====================
