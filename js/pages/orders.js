// 订单页面
class OrdersPage {
    constructor() {
        this.pageName = '订单页面';
    }
    
    // 渲染订单页面
    render() {
        const content = document.getElementById('content');
        if (content) {
            content.innerHTML = `
                <h2>我的订单</h2>
                <div class="tabs">
                    <button class="btn" id="publishedOrdersTab">我发布的订单</button>
                    <button class="btn btn-secondary" id="acceptedOrdersTab">我接受的订单</button>
                </div>
                <div id="ordersContent">
                    <div class="card">
                        <h3>订单列表</h3>
                        <div id="ordersList">
                            <p>暂无订单信息</p>
                        </div>
                    </div>
                </div>
            `;
            
            // 添加事件监听器
            this.addEventListeners();
        }
    }
    
    // 添加事件监听器
    addEventListeners() {
        const publishedOrdersTab = document.getElementById('publishedOrdersTab');
        const acceptedOrdersTab = document.getElementById('acceptedOrdersTab');
        
        if (publishedOrdersTab) {
            publishedOrdersTab.addEventListener('click', () => {
                console.log('查看我发布的订单');
                // 这里应该加载用户发布的订单
                if (window.app && typeof window.app.deliveryService === 'object') {
                    // 加载用户发布的订单
                    console.log('加载用户发布的订单');
                }
            });
        }
        
        if (acceptedOrdersTab) {
            acceptedOrdersTab.addEventListener('click', () => {
                console.log('查看我接受的订单');
                // 这里应该加载用户接受的订单
                if (window.app && typeof window.app.deliveryService === 'object') {
                    // 加载用户接受的订单
                    console.log('加载用户接受的订单');
                }
            });
        }
    }
}

// 导出 OrdersPage
window.OrdersPage = OrdersPage;