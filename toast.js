// toast.js - 自定义网页内提示弹窗 + 全局拦截 alert

// ========== Toast 提示消息 ==========
function showToast(message, type = 'success') {
    // 移除已存在的弹窗
    const existingToast = document.querySelector('.custom-toast');
    if (existingToast) existingToast.remove();
    
    // 创建弹窗元素
    const toast = document.createElement('div');
    toast.className = `custom-toast custom-toast-${type}`;
    
    // 图标
    const icon = type === 'success' ? 'fa-check-circle' : 
                 type === 'error' ? 'fa-exclamation-circle' : 
                 type === 'warning' ? 'fa-exclamation-triangle' : 'fa-info-circle';
    
    toast.innerHTML = `
        <div class="toast-icon"><i class="fas ${icon}"></i></div>
        <div class="toast-message">${message}</div>
        <div class="toast-progress"></div>
    `;
    
    document.body.appendChild(toast);
    
    // 显示动画
    setTimeout(() => toast.classList.add('show'), 10);
    
    // 3秒后自动消失
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// ========== 确认弹窗（保留供手动调用） ==========
function showConfirm(title, message, onConfirm, onCancel) {
    const existingModal = document.querySelector('.custom-confirm');
    if (existingModal) existingModal.remove();
    
    const modal = document.createElement('div');
    modal.className = 'custom-confirm';
    modal.innerHTML = `
        <div class="confirm-overlay"></div>
        <div class="confirm-content">
            <div class="confirm-title">${title}</div>
            <div class="confirm-message">${message}</div>
            <div class="confirm-buttons">
                <button class="confirm-btn confirm-cancel">取消</button>
                <button class="confirm-btn confirm-ok">确认</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    setTimeout(() => modal.classList.add('show'), 10);
    
    modal.querySelector('.confirm-cancel').onclick = () => {
        modal.classList.remove('show');
        setTimeout(() => modal.remove(), 300);
        if (onCancel) onCancel();
    };
    
    modal.querySelector('.confirm-ok').onclick = () => {
        modal.classList.remove('show');
        setTimeout(() => modal.remove(), 300);
        if (onConfirm) onConfirm();
    };
    
    modal.querySelector('.confirm-overlay').onclick = () => {
        modal.classList.remove('show');
        setTimeout(() => modal.remove(), 300);
        if (onCancel) onCancel();
    };
}

// ========== 输入弹窗（保留供手动调用） ==========
function showPrompt(title, placeholder, callback) {
    const existingModal = document.querySelector('.custom-prompt');
    if (existingModal) existingModal.remove();
    
    const modal = document.createElement('div');
    modal.className = 'custom-prompt';
    modal.innerHTML = `
        <div class="prompt-overlay"></div>
        <div class="prompt-content">
            <div class="prompt-title">${title}</div>
            <input type="text" class="prompt-input" placeholder="${placeholder}">
            <div class="prompt-buttons">
                <button class="prompt-btn prompt-cancel">取消</button>
                <button class="prompt-btn prompt-ok">确认</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    setTimeout(() => modal.classList.add('show'), 10);
    
    const input = modal.querySelector('.prompt-input');
    input.focus();
    
    modal.querySelector('.prompt-cancel').onclick = () => {
        modal.classList.remove('show');
        setTimeout(() => modal.remove(), 300);
        if (callback) callback(null);
    };
    
    modal.querySelector('.prompt-ok').onclick = () => {
        const value = input.value.trim();
        modal.classList.remove('show');
        setTimeout(() => modal.remove(), 300);
        if (callback) callback(value);
    };
    
    modal.querySelector('.prompt-overlay').onclick = () => {
        modal.classList.remove('show');
        setTimeout(() => modal.remove(), 300);
        if (callback) callback(null);
    };
    
    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            modal.querySelector('.prompt-ok').click();
        }
    });
}

// ========== 全局拦截 alert（替换为自定义 Toast） ==========
window.originalAlert = window.alert;
window.alert = function(message) {
    showToast(message, 'info');
};