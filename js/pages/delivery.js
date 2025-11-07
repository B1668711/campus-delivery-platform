// 代取快递页面
class DeliveryPage {
    constructor() {
        this.pageName = '代取快递页面';
    }
    
    // 渲染代取快递页面
    render() {
        const content = document.getElementById('content');
        if (content) {
            content.innerHTML = `
                <h2>代取快递</h2>
                <div class="card">
                    <h3>发布代取快递需求</h3>
                    <form id="deliveryForm">
                        <div class="form-group">
                            <label for="packageInfo">快递信息</label>
                            <input type="text" id="packageInfo" name="packageInfo" placeholder="请输入快递信息（如快递公司、收件人等）" required>
                        </div>
                        <div class="form-group">
                            <label for="pickupLocation">取货地点</label>
                            <input type="text" id="pickupLocation" name="pickupLocation" placeholder="请输入取货地点" required>
                        </div>
                        <div class="form-group">
                            <label for="deliveryLocation">送货地点</label>
                            <input type="text" id="deliveryLocation" name="deliveryLocation" placeholder="请输入送货地点" required>
                        </div>
                        <div class="form-group">
                            <label for="reward">酬劳（元）</label>
                            <input type="number" id="reward" name="reward" min="0" step="0.1" placeholder="请输入酬劳金额" required>
                        </div>
                        <div class="form-group">
                            <label for="notes">备注</label>
                            <textarea id="notes" name="notes" placeholder="请输入其他需要说明的信息"></textarea>
                        </div>
                        <button type="submit" class="btn">发布需求</button>
                    </form>
                </div>
                <div class="card">
                    <h3>待接取的快递</h3>
                    <div id="deliveryList">
                        <p>暂无待接取的快递信息</p>
                    </div>
                </div>
            `;
            
            // 添加事件监听器
            this.addEventListeners();
        }
    }
    
    // 添加事件监听器
    addEventListeners() {
        const deliveryForm = document.getElementById('deliveryForm');
        if (deliveryForm) {
            deliveryForm.addEventListener('submit', (e) => {
                e.preventDefault();
                console.log('提交代取快递表单');
                // 这里应该处理表单提交
                if (window.app && typeof window.app.deliveryService === 'object') {
                    const formData = new FormData(deliveryForm);
                    const deliveryData = {
                        packageInfo: formData.get('packageInfo'),
                        pickupLocation: formData.get('pickupLocation'),
                        deliveryLocation: formData.get('deliveryLocation'),
                        reward: parseFloat(formData.get('reward')),
                        notes: formData.get('notes')
                    };
                    
                    window.app.deliveryService.createDelivery(deliveryData)
                        .then(response => {
                            if (response.success) {
                                console.log('快递需求发布成功');
                                deliveryForm.reset();
                            } else {
                                console.error('快递需求发布失败');
                            }
                        })
                        .catch(error => {
                            console.error('快递需求发布错误:', error);
                        });
                }
            });
        }
    }
}

// 导出 DeliveryPage
window.DeliveryPage = DeliveryPage;