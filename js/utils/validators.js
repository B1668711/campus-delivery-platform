// 验证工具
class Validators {
    // 验证邮箱格式
    static validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
    
    // 验证手机号格式
    static validatePhone(phone) {
        const phoneRegex = /^1[3-9]\d{9}$/;
        return phoneRegex.test(phone);
    }
    
    // 验证密码强度
    static validatePassword(password) {
        // 密码至少8位，包含字母和数字
        const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$/;
        return passwordRegex.test(password);
    }
    
    // 验证用户名
    static validateUsername(username) {
        // 用户名长度为3-20位，只能包含字母、数字、下划线
        const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
        return usernameRegex.test(username);
    }
    
    // 验证表单数据
    static validateForm(formData, rules) {
        const errors = {};
        
        for (const field in rules) {
            const value = formData[field];
            const fieldRules = rules[field];
            
            for (const rule of fieldRules) {
                if (rule.required && (!value || value.trim() === '')) {
                    errors[field] = errors[field] || [];
                    errors[field].push(rule.message || `${field} 是必填项`);
                    break;
                }
                
                if (value && rule.pattern && !rule.pattern.test(value)) {
                    errors[field] = errors[field] || [];
                    errors[field].push(rule.message || `${field} 格式不正确`);
                    break;
                }
                
                if (value && rule.validator && typeof rule.validator === 'function') {
                    const validationResult = rule.validator(value);
                    if (validationResult !== true) {
                        errors[field] = errors[field] || [];
                        errors[field].push(validationResult || `${field} 格式不正确`);
                        break;
                    }
                }
            }
        }
        
        return Object.keys(errors).length > 0 ? errors : null;
    }
}

// 导出 Validators
window.Validators = Validators;