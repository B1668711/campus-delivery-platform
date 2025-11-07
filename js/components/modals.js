// 模态框组件
class ModalComponents {
    constructor() {
        this.modals = {};
    }
    
    // 创建模态框
    createModal(title, content) {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.style.cssText = `
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0,0,0,0.5);
            z-index: 1000;
        `;
        
        const modalContent = document.createElement('div');
        modalContent.style.cssText = `
            background-color: white;
            margin: 10% auto;
            padding: 20px;
            border-radius: 8px;
            width: 80%;
            max-width: 500px;
            position: relative;
        `;
        
        const closeBtn = document.createElement('span');
        closeBtn.innerHTML = '&times;';
        closeBtn.style.cssText = `
            position: absolute;
            right: 10px;
            top: 10px;
            font-size: 24px;
            cursor: pointer;
        `;
        closeBtn.onclick = () => this.hideModal(modal);
        
        const titleElement = document.createElement('h2');
        titleElement.textContent = title;
        
        modalContent.appendChild(closeBtn);
        modalContent.appendChild(titleElement);
        if (typeof content === 'string') {
            modalContent.innerHTML += content;
        } else if (content instanceof HTMLElement) {
            modalContent.appendChild(content);
        }
        modal.appendChild(modalContent);
        
        // 添加到页面
        if (typeof document !== 'undefined') {
            document.body.appendChild(modal);
        }
        
        return modal;
    }
    
    // 显示模态框
    showModal(modal) {
        if (modal) {
            modal.style.display = 'block';
        }
    }
    
    // 隐藏模态框
    hideModal(modal) {
        if (modal) {
            modal.style.display = 'none';
        }
    }
}

// 导出 ModalComponents
window.ModalComponents = ModalComponents;