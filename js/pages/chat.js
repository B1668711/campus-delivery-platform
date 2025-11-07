// 聊天页面
class ChatPage {
    constructor() {
        this.pageName = '聊天页面';
    }
    
    // 渲染聊天页面
    render() {
        const content = document.getElementById('content');
        if (content) {
            content.innerHTML = `
                <h2>消息聊天</h2>
                <div style="display: flex; gap: 1rem;">
                    <div style="flex: 1; max-width: 300px;">
                        <div class="card">
                            <h3>会话列表</h3>
                            <div id="conversationsList">
                                <p>暂无会话</p>
                            </div>
                        </div>
                    </div>
                    <div style="flex: 2;">
                        <div class="card">
                            <div id="chatHeader">
                                <h3>请选择一个会话</h3>
                            </div>
                            <div id="messagesContainer" style="min-height: 300px; margin: 1rem 0;">
                                <p>请选择或创建一个会话开始聊天</p>
                            </div>
                            <div id="messageInputArea" style="display: none;">
                                <div class="form-group">
                                    <textarea id="messageInput" placeholder="输入消息..." rows="3"></textarea>
                                </div>
                                <button class="btn" id="sendMessageBtn">发送</button>
                            </div>
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
        const sendMessageBtn = document.getElementById('sendMessageBtn');
        const messageInput = document.getElementById('messageInput');
        
        if (sendMessageBtn) {
            sendMessageBtn.addEventListener('click', () => {
                console.log('发送消息');
                // 这里应该处理发送消息
                if (window.app && typeof window.app.chatService === 'object' && messageInput) {
                    const message = messageInput.value.trim();
                    if (message) {
                        window.app.chatService.sendMessage(null, message)
                            .then(response => {
                                if (response.success) {
                                    console.log('消息发送成功');
                                    messageInput.value = '';
                                } else {
                                    console.error('消息发送失败');
                                }
                            })
                            .catch(error => {
                                console.error('消息发送错误:', error);
                            });
                    }
                }
            });
        }
        
        if (messageInput) {
            messageInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    console.log('发送消息');
                    // 这里应该处理发送消息
                    if (window.app && typeof window.app.chatService === 'object') {
                        const message = messageInput.value.trim();
                        if (message) {
                            window.app.chatService.sendMessage(null, message)
                                .then(response => {
                                    if (response.success) {
                                        console.log('消息发送成功');
                                        messageInput.value = '';
                                    } else {
                                        console.error('消息发送失败');
                                    }
                                })
                                .catch(error => {
                                    console.error('消息发送错误:', error);
                                });
                        }
                    }
                }
            });
        }
    }
}

// 导出 ChatPage
window.ChatPage = ChatPage;