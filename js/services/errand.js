// 跑腿服务
class ErrandService {
    constructor() {
        this.serviceName = '跑腿服务';
    }
    
    // 获取跑腿任务列表
    async getErrands(filters = {}) {
        console.log('获取跑腿任务列表', filters);
        // 实际实现中这里会调用Supabase服务获取数据
        try {
            // 如果有 Supabase 服务，就调用它
            if (window.app && window.app.supabaseService) {
                return await window.app.supabaseService.query('errands', filters);
            }
            // 否则返回模拟数据
            return [];
        } catch (error) {
            console.error('获取跑腿任务列表失败:', error);
            return [];
        }
    }
    
    // 创建跑腿任务
    async createErrand(errandData) {
        console.log('创建跑腿任务', errandData);
        // 实际实现中这里会调用Supabase服务保存数据
        try {
            // 如果有 Supabase 服务，就调用它
            if (window.app && window.app.supabaseService) {
                const result = await window.app.supabaseService.insert('errands', errandData);
                return result;
            }
            // 否则返回模拟数据
            return { success: true, id: Date.now() };
        } catch (error) {
            console.error('创建跑腿任务失败:', error);
            return { success: false, error: error.message };
        }
    }
    
    // 更新跑腿任务状态
    async updateErrandStatus(errandId, status) {
        console.log(`更新跑腿任务 ${errandId} 状态为 ${status}`);
        // 实际实现中这里会调用Supabase服务更新数据
        try {
            // 如果有 Supabase 服务，就调用它
            if (window.app && window.app.supabaseService) {
                const result = await window.app.supabaseService.update('errands', 
                    { status: status }, 
                    { id: errandId });
                return result;
            }
            // 否则返回模拟数据
            return { success: true };
        } catch (error) {
            console.error(`更新跑腿任务 ${errandId} 状态失败:`, error);
            return { success: false, error: error.message };
        }
    }
}

// 导出 ErrandService
window.ErrandService = ErrandService;