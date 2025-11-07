// 配置和常量
const CONFIG = {
    // API 配置
    API_BASE_URL: 'https://your-supabase-url.supabase.co',
    API_KEY: 'your-api-key',
    
    // 应用配置
    APP_NAME: '校园快递代取平台',
    VERSION: '1.0.0',
    
    // 存储配置
    STORAGE_KEYS: {
        SESSION: 'app_session',
        USER_PREFERENCES: 'user_preferences'
    },
    
    // 网络配置
    NETWORK: {
        TIMEOUT: 10000, // 10秒超时
        RETRY_ATTEMPTS: 3
    }
};

// 导出配置
window.CONFIG = CONFIG;