// 常量定义
const Constants = {
    // 用户角色
    USER_ROLES: {
        USER: 'user',
        DELIVERY_PERSON: 'delivery_person',
        ADMIN: 'admin'
    },
    
    // 订单状态
    ORDER_STATUS: {
        PENDING: 'pending',           // 待接单
        ACCEPTED: 'accepted',         // 已接单
        IN_PROGRESS: 'in_progress',   // 进行中
        COMPLETED: 'completed',       // 已完成
        CANCELLED: 'cancelled'        // 已取消
    },
    
    // 跑腿类型
    ERRAND_TYPES: {
        SHOPPING: 'shopping',
        DELIVERY: 'delivery',
        QUEUE: 'queue',
        OTHER: 'other'
    },
    
    // 消息类型
    MESSAGE_TYPES: {
        TEXT: 'text',
        IMAGE: 'image',
        FILE: 'file'
    },
    
    // 应用主题
    THEMES: {
        LIGHT: 'light',
        DARK: 'dark'
    }
};

// 导出 Constants
window.Constants = Constants;