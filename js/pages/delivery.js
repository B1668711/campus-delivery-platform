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
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <h3>发布代取快递需求</h3>
                        <button id="fillContactInfo" class="btn btn-secondary" style="font-size: 0.8rem; padding: 0.2rem 0.5rem;">填充默认联系人</button>
                    </div>
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
                            <label for="contactName">联系人姓名</label>
                            <input type="text" id="contactName" name="contactName" placeholder="请输入联系人姓名" required>
                        </div>
                        <div class="form-group">
                            <label for="contactPhone">联系人电话</label>
                            <input type="tel" id="contactPhone" name="contactPhone" placeholder="请输入联系人电话" required>
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
                        <p>加载中...</p>
                    </div>
                </div>
            `;
            
            // 添加事件监听器
            this.addEventListeners();
            
            // 页面加载完成后尝试填充默认联系人信息
            this.fillDefaultContactInfo();
            
            // 加载待接取的快递列表
            this.loadDeliveryList();
        }
    }
    
    // 填充默认联系人信息
    fillDefaultContactInfo() {
        // 优先使用 app.js 中的 currentUser 对象
        if (window.currentUser) {
            const currentUser = window.currentUser;
            
            const contactNameInput = document.getElementById('contactName');
            const contactPhoneInput = document.getElementById('contactPhone');
            
            if (contactNameInput && currentUser.defaultContactName) {
                contactNameInput.value = currentUser.defaultContactName;
            } else if (contactNameInput && currentUser.name) {
                // 如果没有设置默认联系人姓名，则使用用户名
                contactNameInput.value = currentUser.name;
            }
            
            if (contactPhoneInput && currentUser.defaultContactInfo) {
                contactPhoneInput.value = currentUser.defaultContactInfo;
            }
        } else {
            // 降级到 localStorage 方式
            const contactInfo = localStorage.getItem('defaultContactInfo');
            if (contactInfo) {
                const contactData = JSON.parse(contactInfo);
                
                const contactNameInput = document.getElementById('contactName');
                const contactPhoneInput = document.getElementById('contactPhone');
                
                if (contactNameInput && contactData.defaultContactName) {
                    contactNameInput.value = contactData.defaultContactName;
                }
                
                if (contactPhoneInput && contactData.defaultContactPhone) {
                    contactPhoneInput.value = contactData.defaultContactPhone;
                }
            }
        }
    }
    
    // 添加事件监听器
    addEventListeners() {
        const deliveryForm = document.getElementById('deliveryForm');
        const fillContactBtn = document.getElementById('fillContactInfo');
        
        if (fillContactBtn) {
            fillContactBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.fillDefaultContactInfo();
            });
        }
        
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
                        contactName: formData.get('contactName'),
                        contactPhone: formData.get('contactPhone'),
                        reward: parseFloat(formData.get('reward')),
                        notes: formData.get('notes')
                    };
                    
                    window.app.deliveryService.createDelivery(deliveryData)
                        .then(response => {
                            if (response.success) {
                                console.log('快递需求发布成功');
                                deliveryForm.reset();
                                // 重新填充默认联系人信息
                                this.fillDefaultContactInfo();
                                // 重新加载待接取列表
                                this.loadDeliveryList();
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
    
    // 加载待接取的快递列表
    async loadDeliveryList() {
        const deliveryList = document.getElementById('deliveryList');
        if (!deliveryList) return;
        
        try {
            // 显示加载状态
            deliveryList.innerHTML = '<p>加载中...</p>';
            
            // 从服务获取数据
            if (window.app && typeof window.app.deliveryService === 'object') {
                const deliveries = await window.app.deliveryService.getDeliveries({ status: 'pending' });
                
                if (!deliveries || deliveries.length === 0) {
                    deliveryList.innerHTML = '<p>暂无待接取的快递信息</p>';
                    return;
                }
                
                // 构建列表HTML
                let listHTML = '<div class="delivery-items">';
                deliveries.forEach(delivery => {
                    listHTML += `
                        <div class="delivery-item">
                            <h4>${delivery.packageInfo || '未填写快递信息'}</h4>
                            <p><strong>取货地点:</strong> ${delivery.pickupLocation || '未填写'}</p>
                            <p><strong>送货地点:</strong> ${delivery.deliveryLocation || '未填写'}</p>
                            <p><strong>联系人:</strong> ${delivery.contactName || '未填写'} (${delivery.contactPhone || '未填写'})</p>
                            <p><strong>酬劳:</strong> ${delivery.reward || 0} 元</p>
                            ${delivery.notes ? `<p><strong>备注:</strong> ${delivery.notes}</p>` : ''}
                        </div>
                    `;
                });
                listHTML += '</div>';
                
                deliveryList.innerHTML = listHTML;
            } else {
                deliveryList.innerHTML = '<p>服务暂不可用</p>';
            }
        } catch (error) {
            console.error('加载待接取快递列表失败:', error);
            deliveryList.innerHTML = '<p>加载失败，请稍后重试</p>';
        }
    }
}

// 导出 DeliveryPage
window.DeliveryPage = DeliveryPage;