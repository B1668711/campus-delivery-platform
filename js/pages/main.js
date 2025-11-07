// 主页面
class MainPage {
    constructor() {
        this.pageName = '主页面';
    }
    
    // 渲染主页面
    render() {
        const content = document.getElementById('content');
        if (content) {
            content.innerHTML = `
                <h2>欢迎使用校园快递代取平台</h2>
                <div class="card">
                    <h3>功能介绍</h3>
                    <p>这是一个专门为校园设计的快递代取服务平台，您可以：</p>
                    <ul>
                        <li>发布快递代取需求</li>
                        <li>接取他人的快递代取任务</li>
                        <li>使用跑腿服务</li>
                        <li>与他人在线沟通</li>
                    </ul>
                </div>
                <div>
                    <button class="btn" id="deliveryBtn">代取快递</button>
                    <button class="btn btn-secondary" id="errandBtn">跑腿服务</button>
                </div>
            `;
            
            // 添加事件监听器
            this.addEventListeners();
        }
    }
    
    // 添加事件监听器
    addEventListeners() {
        const deliveryBtn = document.getElementById('deliveryBtn');
        const errandBtn = document.getElementById('errandBtn');
        
        if (deliveryBtn) {
            deliveryBtn.addEventListener('click', () => {
                console.log('跳转到代取快递页面');
                // 这里应该导航到代取快递页面
                if (window.app && typeof window.app.navigate === 'function') {
                    window.app.navigate('delivery');
                }
            });
        }
        
        if (errandBtn) {
            errandBtn.addEventListener('click', () => {
                console.log('跳转到跑腿服务页面');
                // 这里应该导航到跑腿服务页面
                if (window.app && typeof window.app.navigate === 'function') {
                    window.app.navigate('errand');
                }
            });
        }
    }
}

// 当DOM加载完成后初始化主页面
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        const mainPage = new MainPage();
        mainPage.render();
    });
}

// 导出 MainPage
window.MainPage = MainPage;