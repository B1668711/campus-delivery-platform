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
                    <h3>发布跑腿需求</h3>
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
                        <p>暂无待接取的跑腿任务</p>
                    </div>
                </div>
            `;
            
            // 添加事件监听器
            this.addEventListeners();
        }
    }
    
    // 添加事件监听器
    addEventListeners() {
        const errandForm = document.getElementById('errandForm');
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
                        reward: parseFloat(formData.get('errandReward')),
                        time: formData.get('errandTime')
                    };
                    
                    window.app.errandService.createErrand(errandData)
                        .then(response => {
                            if (response.success) {
                                console.log('跑腿需求发布成功');
                                errandForm.reset();
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
}

// 导出 ErrandPage
window.ErrandPage = ErrandPage;