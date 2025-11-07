// UI组件
class UIComponents {
    constructor() {
        this.components = {};
    }
    
    // 创建按钮
    createButton(text, className = 'btn', onClick = null) {
        const button = document.createElement('button');
        button.textContent = text;
        button.className = className;
        if (onClick) {
            button.addEventListener('click', onClick);
        }
        return button;
    }
    
    // 创建卡片
    createCard(title, content, className = 'card') {
        const card = document.createElement('div');
        card.className = className;
        
        if (title) {
            const titleElement = document.createElement('h3');
            titleElement.textContent = title;
            card.appendChild(titleElement);
        }
        
        const contentElement = document.createElement('div');
        if (typeof content === 'string') {
            contentElement.innerHTML = content;
        } else if (content instanceof HTMLElement) {
            contentElement.appendChild(content);
        }
        card.appendChild(contentElement);
        
        return card;
    }
}

// 导出 UIComponents
window.UIComponents = UIComponents;