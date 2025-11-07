// 加载状态管理工具

/**
 * 设置按钮为加载状态
 * @param {HTMLElement} button - 要设置加载状态的按钮
 * @param {string} loadingText - 加载时显示的文本
 */
function setButtonLoading(button, loadingText = '处理中...') {
    if (!button) return;
    
    // 保存原始状态
    button._originalHtml = button.innerHTML;
    button._originalDisabled = button.disabled;
    
    // 设置加载状态
    button.disabled = true;
    button.innerHTML = `<i class="fas fa-spinner fa-spin"></i> ${loadingText}`;
}

/**
 * 恢复按钮的原始状态
 * @param {HTMLElement} button - 要恢复的按钮
 */
function resetButton(button) {
    if (!button || !button._originalHtml) return;
    
    // 恢复原始状态
    button.innerHTML = button._originalHtml;
    button.disabled = button._originalDisabled || false;
    
    // 清理临时属性
    delete button._originalHtml;
    delete button._originalDisabled;
}

// 导出函数
window.setButtonLoading = setButtonLoading;
window.resetButton = resetButton;