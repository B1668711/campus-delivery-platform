// 跑腿页面
class ErrandPage {
    constructor() {
        this.pageName = '跑腿页面';
    }
    
    // 渲染跑腿页面
    render() {
        const content = document.getElementById('content');
        if (content) {
            content.innerHTML = `
                <h2>跑腿服务</h2>
                <div class="card">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <h3>发布跑腿需求</h3>
                        <button id="fillContactInfo" class="btn btn-secondary" style="font-size: 0.8rem; padding: 0.2rem 0.5rem;">填充默认联系人</button>
                    </div>
                    <form id="errandForm">
                        <div class="form-group">
                            <label for="errandType">跑腿类型</label>
                            <select id="errandType" name="errandType" required>
                                <option value="">请选择跑腿类型</option>
                                <option value="shopping">代购</option>
                                <option value="delivery">代送</option>
                                <option value="queue">代排队</option>
                                <option value="other">其他</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="errandDescription">需求描述</label>
                            <textarea id="errandDescription" name="errandDescription" placeholder="请详细描述您的跑腿需求" required></textarea>
                        </div>
                        <div class="form-group">
                            <label for="errandLocation">地点</label>
                            <input type="text" id="errandLocation" name="errandLocation" placeholder="请输入地点信息" required>
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
                            <label for="errandReward">酬劳（元）</label>
                            <input type="number" id="errandReward" name="errandReward" min="0" step="0.1" placeholder="请输入酬劳金额" required>
                        </div>
                        <div class="form-group">
                            <label for="errandTime">期望时间</label>
                            <input type="datetime-local" id="errandTime" name="errandTime" required>
                        </div>
                        <button type="submit" class="btn">发布需求</button>
                    </form>
                </div>
                <div class="card">
                    <h3>待接取的跑腿任务</h3>
                    <div id="errandList">
                        <p>加载中...</p>
                    </div>
                </div>
            `;
            
            // 添加事件监听器
            this.addEventListeners();
            
            // 页面加载完成后尝试填充默认联系人信息
            this.fillDefaultContactInfo();
            
            // 加载待接取的跑腿任务列表
            this.loadErrandList();
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
        const errandForm = document.getElementById('errandForm');
        const fillContactBtn = document.getElementById('fillContactInfo');
        
        if (fillContactBtn) {
            fillContactBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.fillDefaultContactInfo();
            });
        }
        
        if (errandForm) {
            errandForm.addEventListener('submit', (e) => {
                e.preventDefault();
                console.log('提交跑腿服务表单');
                // 这里应该处理表单提交
                if (window.app && typeof window.app.errandService === 'object') {
                    const formData = new FormData(errandForm);
                    const errandData = {
                        type: formData.get('errandType'),
                        description: formData.get('errandDescription'),
                        location: formData.get('errandLocation'),
                        contactName: formData.get('contactName'),
                        contactPhone: formData.get('contactPhone'),
                        reward: parseFloat(formData.get('errandReward')),
                        time: formData.get('errandTime')
                    };
                    
                    window.app.errandService.createErrand(errandData)
                        .then(response => {
                            if (response.success) {
                                console.log('跑腿需求发布成功');
                                errandForm.reset();
                                // 重新填充默认联系人信息
                                this.fillDefaultContactInfo();
                                // 重新加载待接取列表
                                this.loadErrandList();
                            } else {
                                console.error('跑腿需求发布失败');
                            }
                        })
                        .catch(error => {
                            console.error('跑腿需求发布错误:', error);
                        });
                }
            });
        }
    }
    
    // 加载待接取的跑腿任务列表
    async loadErrandList() {
        const errandList = document.getElementById('errandList');
        if (!errandList) return;
        
        try {
            // 显示加载状态
            errandList.innerHTML = '<p>加载中...</p>';
            
            // 从服务获取数据
            if (window.app && typeof window.app.errandService === 'object') {
                const errands = await window.app.errandService.getErrands({ status: 'pending' });
                
                if (!errands || errands.length === 0) {
                    errandList.innerHTML = '<p>暂无待接取的跑腿任务</p>';
                    return;
                }
                
                // 构建列表HTML
                let listHTML = '<div class="errand-items">';
                errands.forEach(errand => {
                    listHTML += `
                        <div class="errand-item">
                            <h4>${errand.type === 'shopping' ? '代购' : errand.type === 'delivery' ? '代送' : errand.type === 'queue' ? '代排队' : '其他'}: ${errand.description || '未填写描述'}</h4>
                            <p><strong>地点:</strong> ${errand.location || '未填写'}</p>
                            <p><strong>联系人:</strong> ${errand.contactName || '未填写'} (${errand.contactPhone || '未填写'})</p>
                            <p><strong>酬劳:</strong> ${errand.reward || 0} 元</p>
                            ${errand.time ? `<p><strong>期望时间:</strong> ${new Date(errand.time).toLocaleString()}</p>` : ''}
                        </div>
                    `;
                });
                listHTML += '</div>';
                
                errandList.innerHTML = listHTML;
            } else {
                errandList.innerHTML = '<p>服务暂不可用</p>';
            }
        } catch (error) {
            console.error('加载待接取跑腿任务列表失败:', error);
            errandList.innerHTML = '<p>加载失败，请稍后重试</p>';
        }
    }
}

// 导出 ErrandPage
window.ErrandPage = ErrandPage;