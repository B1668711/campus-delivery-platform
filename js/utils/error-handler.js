// 错误处理
class ErrorHandler {
    // 处理一般错误
    static handleError(error, context = '') {
        console.error(`错误${context ? `(${context})` : ''}:`, error);
        // 在实际应用中，这里可能会显示错误消息给用户
        // 如果有 UI 组件，可以显示错误提示
        if (window.app && window.app.uiComponents) {
            // 可以在这里添加错误提示的显示逻辑
        }
    }
    
    // 处理网络错误
    static handleNetworkError(error) {
        console.error('网络错误:', error);
        // 在实际应用中，这里可能会显示网络错误提示
        // 可以根据错误类型显示不同的提示信息
        const errorMessage = error.message || '网络连接异常，请检查网络设置';
        this.handleError(new Error(errorMessage), '网络错误');
    }
    
    // 处理验证错误
    static handleValidationError(errors) {
        console.error('验证错误:', errors);
        // 在实际应用中，这里可能会显示验证错误给用户
        if (window.app && window.app.uiComponents) {
            // 可以在这里添加表单验证错误的显示逻辑
        }
    }
    
    // 记录错误日志
    static logError(error, context) {
        // 在实际应用中，这里可能会将错误发送到日志服务
        console.log('记录错误:', { error, context, timestamp: new Date() });
        
        // 如果有日志服务，可以发送错误日志
        if (window.app && window.app.logService) {
            window.app.logService.logError(error, context);
        }
    }
}

// 导出 ErrorHandler
window.ErrorHandler = ErrorHandler;