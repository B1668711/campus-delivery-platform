// Toast 和确认模态框组件

/**
 * 显示 Toast 提示
 * @param {string} message - 要显示的消息
 * @param {string} type - Toast 类型: 'success', 'error', 'info', 'warning'
 * @param {number} duration - 持续时间（毫秒），默认为3000ms
 */
function showToast(message, type = 'info', duration = 3000) {
    // 确保容器存在
    let container = document.querySelector('.toast-container');
    if (!container) {
        container = document.createElement('div');
        container.className = 'toast-container';
        document.body.appendChild(container);
    }

    // 创建 Toast 元素
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    // 添加图标
    const icon = document.createElement('span');
    icon.className = 'toast-icon';
    switch (type) {
        case 'success':
            icon.innerHTML = '&#10004;'; // ✔
            break;
        case 'error':
            icon.innerHTML = '&#10006;'; // ✖
            break;
        case 'warning':
            icon.innerHTML = '&#9888;'; // ⚠
            break;
        default: // info
            icon.innerHTML = '&#8505;'; // ℹ
    }
    
    // 添加消息文本
    const text = document.createElement('span');
    text.className = 'toast-text';
    text.textContent = message;
    
    // 添加关闭按钮
    const closeBtn = document.createElement('span');
    closeBtn.className = 'toast-close';
    closeBtn.innerHTML = '&times;';
    closeBtn.onclick = () => {
        toast.classList.remove('show');
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    };
    
    toast.appendChild(icon);
    toast.appendChild(text);
    toast.appendChild(closeBtn);
    
    // 添加到容器
    container.appendChild(toast);
    
    // 触发显示动画
    setTimeout(() => {
        toast.classList.add('show');
    }, 10);
    
    // 自动移除
    if (duration > 0) {
        setTimeout(() => {
            if (toast.parentNode) {
                toast.classList.remove('show');
                setTimeout(() => {
                    if (toast.parentNode) {
                        toast.parentNode.removeChild(toast);
                    }
                }, 300);
            }
        }, duration);
    }
}

/**
 * 显示确认模态框
 * @param {string} title - 模态框标题
 * @param {string} message - 确认消息
 * @param {function} onConfirm - 确认回调函数
 * @param {function} onCancel - 取消回调函数（可选）
 */
function showConfirmModal(title, message, onConfirm, onCancel) {
    // 检查是否已存在确认模态框
    let modal = document.getElementById('confirm-modal');
    
    if (!modal) {
        // 创建模态框元素
        modal = document.createElement('div');
        modal.id = 'confirm-modal';
        modal.className = 'confirm-modal';
        
        modal.innerHTML = `
            <div class="confirm-modal-content">
                <div class="confirm-modal-header">${title}</div>
                <div class="confirm-modal-body">${message}</div>
                <div class="confirm-modal-footer">
                    <button class="confirm-modal-btn confirm-modal-btn-cancel">取消</button>
                    <button class="confirm-modal-btn confirm-modal-btn-confirm">确认</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // 添加事件监听器
        const cancelBtn = modal.querySelector('.confirm-modal-btn-cancel');
        const confirmBtn = modal.querySelector('.confirm-modal-btn-confirm');
        
        cancelBtn.addEventListener('click', () => {
            closeModal();
            if (onCancel && typeof onCancel === 'function') {
                onCancel();
            }
        });
        
        confirmBtn.addEventListener('click', () => {
            closeModal();
            if (onConfirm && typeof onConfirm === 'function') {
                onConfirm();
            }
        });
    } else {
        // 更新内容
        modal.querySelector('.confirm-modal-header').textContent = title;
        modal.querySelector('.confirm-modal-body').textContent = message;
    }
    
    // 显示模态框
    modal.style.display = 'flex';
    
    function closeModal() {
        modal.style.display = 'none';
    }
}

// 导出函数供全局使用
window.showToast = showToast;
window.showConfirmModal = showConfirmModal;