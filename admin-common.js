// admin-common.js - 完整版（包含自定义弹窗和通知 + 所有页面实时刷新）
const SUPABASE_URL = 'https://qgmbzdfnwsdosdqphlxk.supabase.co';
const SUPABASE_KEY = 'sb_publishable_zsJFjfNUO7NKp8ZH5KrXFQ_WZ8Q2Kym';
const sb = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// ============================================================
// 🔥 全局通知数组 - 必须在这里初始化，确保所有地方都能访问
// ============================================================
if (typeof window.notifications === 'undefined') {
    window.notifications = [];
    console.log('✅ window.notifications 已初始化');
}

// ============================================================
// 🔥 通知持久化存储 - localStorage
// ============================================================

// 加载通知
function loadNotifications() {
    try {
        const saved = localStorage.getItem('admin_notifications');
        if (saved) {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed) && parsed.length > 0) {
                window.notifications = parsed;
                console.log('📋 从 localStorage 加载了', window.notifications.length, '条通知');
                return;
            }
        }
    } catch (e) {}
    window.notifications = window.notifications || [];
}

// 保存通知
function saveNotifications() {
    try {
        localStorage.setItem('admin_notifications', JSON.stringify(window.notifications));
    } catch (e) {}
}

// 添加通知（带持久化）
function addNotification(notification) {
    if (typeof window.notifications === 'undefined') {
        window.notifications = [];
    }
    // 检查是否已存在相同 ID（避免重复）
    const exists = window.notifications.some(n => n.id === notification.id);
    if (!exists) {
        window.notifications.unshift(notification);
        // 限制最大数量 500 条
        if (window.notifications.length > 500) {
            window.notifications = window.notifications.slice(0, 500);
        }
        saveNotifications();
        if (typeof updateNotificationUI === 'function') {
            updateNotificationUI();
        }
        console.log('📢 通知已添加并保存，当前总数:', window.notifications.length);
    }
}

// ============================================================
// 🔥 通知 UI 更新函数（独立实现，不依赖 dashboard）
// ============================================================

function updateNotificationUI() {
    var badge = document.getElementById('notificationBadge');
    var countEl = document.getElementById('notificationCount');
    var listEl = document.getElementById('notificationList');

    if (!badge || !countEl || !listEl) {
        // 如果 DOM 元素还没加载，稍后重试
        setTimeout(function() {
            if (document.getElementById('notificationBadge')) {
                updateNotificationUI();
            }
        }, 500);
        return;
    }

    // 确保使用最新的数据
    if (typeof window.notifications === 'undefined') {
        loadNotifications();
    }

    var unreadCount = 0;
    for (var i = 0; i < window.notifications.length; i++) {
        if (!window.notifications[i].read) unreadCount++;
    }

    if (unreadCount > 0) {
        badge.style.display = 'flex';
        badge.textContent = unreadCount > 99 ? '99+' : unreadCount;
    } else {
        badge.style.display = 'none';
    }

    countEl.textContent = window.notifications.length + ' notifications';

    if (window.notifications.length === 0) {
        listEl.innerHTML = `
            <div style="text-align: center; padding: 40px 20px; color: #6a7a92; font-size: 13px;">
                <i class="fas fa-inbox" style="display: block; font-size: 28px; color: #4a5a72; margin-bottom: 10px;"></i>
                No notifications
            </div>
        `;
        return;
    }

    var html = '';
    for (var j = 0; j < window.notifications.length; j++) {
        var notif = window.notifications[j];
        var timeStr = formatTime(notif.timestamp);
        var isRead = notif.read;
        var bgColor = isRead ? 'rgba(255,255,255,0.02)' : 'rgba(200,176,144,0.06)';
        var borderColor = isRead ? 'rgba(255,255,255,0.03)' : 'rgba(200,176,144,0.12)';

        var typeColor = '#8892a8';
        if (notif.type === 'withdrawal') typeColor = '#7ad0b0';
        else if (notif.type === 'kyc') typeColor = '#ffb84d';
        else if (notif.type === 'email') typeColor = '#4a7cff';
        else if (notif.type === 'ip') typeColor = '#c084fc';
        else if (notif.type === 'ip_withdrawal') typeColor = '#ff6b6b';

        html += `
            <div class="notification-item" data-id="${notif.id}" style="padding: 12px 16px; margin: 0 8px 4px 8px; border-radius: 10px; background: ${bgColor}; border-left: 3px solid ${typeColor}; cursor: pointer; transition: all 0.2s; display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; border: 1px solid ${borderColor};" onclick="markNotificationRead('${notif.id}')">
                <div style="flex: 1; min-width: 0;">
                    <div style="font-size: 13px; font-weight: 500; color: #d8e0f0;">${escapeHtml(notif.title)}</div>
                    <div style="font-size: 12px; color: #8892a8; margin-top: 2px; word-break: break-word;">${escapeHtml(notif.message)}</div>
                </div>
                <div style="display: flex; flex-direction: column; align-items: flex-end; flex-shrink: 0; min-width: 60px;">
                    <div style="font-size: 10px; color: #5a6a82; white-space: nowrap;">${timeStr}</div>
                    ${!isRead ? '<div style="margin-top: 4px; width: 6px; height: 6px; border-radius: 50%; background: #4a7cff;"></div>' : ''}
                </div>
            </div>
        `;
    }

    listEl.innerHTML = html;
}

// 加载已保存的通知
loadNotifications();

// ============================================================
// 🔥 重写标记已读和清除功能
// ============================================================

window.markNotificationRead = function(id) {
    for (var i = 0; i < window.notifications.length; i++) {
        if (window.notifications[i].id === id) {
            window.notifications[i].read = true;
            break;
        }
    }
    saveNotifications();
    if (typeof updateNotificationUI === 'function') {
        updateNotificationUI();
    }
};

window.clearAllNotifications = function() {
    window.notifications = [];
    saveNotifications();
    if (typeof updateNotificationUI === 'function') {
        updateNotificationUI();
    }
    if (typeof showToast === 'function') {
        showToast('All notifications cleared', 'success');
    }
};

let currentDays = 1;

function toggleSidebar() { document.getElementById('sidebar')?.classList.toggle('open'); }
window.toggleSidebar = toggleSidebar;

function escapeHtml(str) { if(!str) return ''; return str.replace(/[&<>]/g, m => m === '&' ? '&amp;' : m === '<' ? '&lt;' : m === '>' ? '&gt;' : m); }

function formatTime(dateStr) {
    if (!dateStr) return '刚刚';
    const date = new Date(dateStr);
    const now = new Date();
    const diff = Math.floor((now - date) / 1000 / 60);
    if (diff < 1) return '刚刚';
    if (diff < 60) return `${diff}分钟前`;
    if (diff < 1440) return `${Math.floor(diff / 60)}小时前`;
    return `${Math.floor(diff / 1440)}天前`;
}

function animateNumber(element, target, prefix = '', suffix = '') {
    if (!element) return;
    let current = 0;
    const duration = 1500;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
        current += step;
        if (current >= target) {
            element.innerText = prefix + target.toLocaleString() + suffix;
            clearInterval(timer);
        } else {
            element.innerText = prefix + Math.floor(current).toLocaleString() + suffix;
        }
    }, 16);
}

function getTrendHtml(current, previous) {
    if (previous === 0) return current > 0 ? '<span class="trend-up">↑ +100%</span>' : '<span class="trend-up">→ 0%</span>';
    const percent = ((current - previous) / previous * 100).toFixed(1);
    if (percent > 0) return `<span class="trend-up">↑ +${percent}%</span>`;
    if (percent < 0) return `<span class="trend-down">↓ ${percent}%</span>`;
    return '<span>→ 0%</span>';
}

// ========== 自定义 Toast 提示 ==========
function showToast(message, type = 'success') {
    const existingToast = document.querySelector('.custom-toast');
    if (existingToast) existingToast.remove();
    
    const toast = document.createElement('div');
    toast.className = `custom-toast custom-toast-${type}`;
    
    let icon = 'fa-check-circle';
    let bgColor = '#ffb84d';
    if (type === 'success') { icon = 'fa-check-circle'; bgColor = '#2ed15a'; }
    else if (type === 'error') { icon = 'fa-exclamation-circle'; bgColor = '#ff5a5a'; }
    else if (type === 'warning') { icon = 'fa-exclamation-triangle'; bgColor = '#ffb84d'; }
    else { icon = 'fa-info-circle'; bgColor = '#4a7cff'; }
    
    toast.style.cssText = `
        position: fixed;
        bottom: 30px;
        left: 50%;
        transform: translateX(-50%) translateY(100px);
        background: rgba(15, 20, 35, 0.95);
        backdrop-filter: blur(20px);
        border-radius: 50px;
        padding: 12px 24px;
        display: flex;
        align-items: center;
        gap: 12px;
        z-index: 10001;
        opacity: 0;
        transition: all 0.3s ease;
        box-shadow: 0 10px 30px rgba(0,0,0,0.3);
        border-left: 3px solid ${bgColor};
        font-family: 'Inter', sans-serif;
        color: #fff;
    `;
    
    toast.innerHTML = `
        <div><i class="fas ${icon}" style="color: ${bgColor}; font-size: 18px;"></i></div>
        <div style="font-size: 14px;">${message}</div>
        <div style="position: absolute; bottom: 0; left: 0; height: 3px; background: ${bgColor}; width: 100%; border-radius: 0 0 50px 50px; animation: toastProgress 3s linear forwards;"></div>
    `;
    
    document.body.appendChild(toast);
    setTimeout(() => { toast.style.transform = 'translateX(-50%) translateY(0)'; toast.style.opacity = '1'; }, 10);
    setTimeout(() => {
        toast.style.transform = 'translateX(-50%) translateY(100px)';
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// ========== 自定义确认弹窗 ==========
function showConfirm(title, message, onConfirm, onCancel) {
    const existingModal = document.querySelector('.custom-confirm');
    if (existingModal) existingModal.remove();
    
    const modal = document.createElement('div');
    modal.className = 'custom-confirm';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        z-index: 10002;
        display: flex;
        align-items: center;
        justify-content: center;
        visibility: hidden;
        opacity: 0;
        transition: all 0.2s ease;
    `;
    
    modal.innerHTML = `
        <div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.7); backdrop-filter: blur(5px);"></div>
        <div style="position: relative; background: linear-gradient(145deg, #1a1508, #0f0c06); border-radius: 24px; padding: 24px; width: 340px; max-width: 90%; text-align: center; border: 1px solid rgba(255,184,77,0.3); box-shadow: 0 20px 40px rgba(0,0,0,0.4); transform: scale(0.9); transition: transform 0.2s ease;">
            <div style="font-size: 18px; font-weight: 600; color: #ffb84d; margin-bottom: 12px;">${title}</div>
            <div style="font-size: 14px; color: #d4c8a0; margin-bottom: 24px; line-height: 1.5;">${message}</div>
            <div style="display: flex; gap: 12px; justify-content: center;">
                <button id="confirm-cancel" style="background: rgba(255,255,255,0.1); border: none; padding: 10px 24px; border-radius: 40px; color: #fff; cursor: pointer;">取消</button>
                <button id="confirm-ok" style="background: linear-gradient(135deg, #ffb84d, #cc8822); border: none; padding: 10px 24px; border-radius: 40px; color: #0a0806; font-weight: 600; cursor: pointer;">确认</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    setTimeout(() => {
        modal.style.visibility = 'visible';
        modal.style.opacity = '1';
        modal.querySelector('div:last-child').style.transform = 'scale(1)';
    }, 10);
    
    modal.querySelector('#confirm-cancel').onclick = () => {
        modal.style.visibility = 'hidden';
        modal.style.opacity = '0';
        setTimeout(() => modal.remove(), 300);
        if (onCancel) onCancel();
    };
    
    modal.querySelector('#confirm-ok').onclick = () => {
        modal.style.visibility = 'hidden';
        modal.style.opacity = '0';
        setTimeout(() => modal.remove(), 300);
        if (onConfirm) onConfirm();
    };
    
    modal.querySelector('div:first-child').onclick = () => {
        modal.style.visibility = 'hidden';
        modal.style.opacity = '0';
        setTimeout(() => modal.remove(), 300);
        if (onCancel) onCancel();
    };
}

// ========== 自定义输入弹窗 ==========
function showPrompt(title, placeholder, callback) {
    const existingModal = document.querySelector('.custom-prompt');
    if (existingModal) existingModal.remove();
    
    const modal = document.createElement('div');
    modal.className = 'custom-prompt';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        z-index: 10002;
        display: flex;
        align-items: center;
        justify-content: center;
        visibility: hidden;
        opacity: 0;
        transition: all 0.2s ease;
    `;
    
    modal.innerHTML = `
        <div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.7); backdrop-filter: blur(5px);"></div>
        <div style="position: relative; background: linear-gradient(145deg, #1a1508, #0f0c06); border-radius: 24px; padding: 24px; width: 340px; max-width: 90%; text-align: center; border: 1px solid rgba(255,184,77,0.3); box-shadow: 0 20px 40px rgba(0,0,0,0.4); transform: scale(0.9); transition: transform 0.2s ease;">
            <div style="font-size: 18px; font-weight: 600; color: #ffb84d; margin-bottom: 20px;">${title}</div>
            <input type="text" id="prompt-input" placeholder="${placeholder}" style="width: 100%; padding: 12px 16px; background: #0a0806; border: 1px solid rgba(255,184,77,0.3); border-radius: 12px; color: #fff; font-size: 14px; outline: none; margin-bottom: 20px;">
            <div style="display: flex; gap: 12px; justify-content: center;">
                <button id="prompt-cancel" style="background: rgba(255,255,255,0.1); border: none; padding: 10px 24px; border-radius: 40px; color: #fff; cursor: pointer;">取消</button>
                <button id="prompt-ok" style="background: linear-gradient(135deg, #ffb84d, #cc8822); border: none; padding: 10px 24px; border-radius: 40px; color: #0a0806; font-weight: 600; cursor: pointer;">确认</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    setTimeout(() => {
        modal.style.visibility = 'visible';
        modal.style.opacity = '1';
        modal.querySelector('div:last-child').style.transform = 'scale(1)';
        const input = document.getElementById('prompt-input');
        input.focus();
    }, 10);
    
    modal.querySelector('#prompt-cancel').onclick = () => {
        modal.style.visibility = 'hidden';
        modal.style.opacity = '0';
        setTimeout(() => modal.remove(), 300);
        if (callback) callback(null);
    };
    
    modal.querySelector('#prompt-ok').onclick = () => {
        const value = document.getElementById('prompt-input').value.trim();
        modal.style.visibility = 'hidden';
        modal.style.opacity = '0';
        setTimeout(() => modal.remove(), 300);
        if (callback) callback(value);
    };
    
    modal.querySelector('div:first-child').onclick = () => {
        modal.style.visibility = 'hidden';
        modal.style.opacity = '0';
        setTimeout(() => modal.remove(), 300);
        if (callback) callback(null);
    };
    
    document.getElementById('prompt-input').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            modal.querySelector('#prompt-ok').click();
        }
    });
}

// 替换原生 alert
window.originalAlert = window.alert;
window.alert = function(message) {
    showToast(message, 'info');
};

// ========== 琥珀金风格通知（增强版） ==========
window.showAmberNotification = function(title, message, type) {
    console.log('🔔 显示琥珀通知:', { title, message, type });
    
    const existingNotification = document.querySelector('.notification-amber');
    if (existingNotification) existingNotification.remove();
    
    let icon = 'fa-info-circle';
    let iconColor = '#ffb84d';
    
    if (type === 'withdrawal') {
        icon = 'fa-money-bill-wave';
    } else if (type === 'kyc') {
        icon = 'fa-id-card';
    } else if (type === 'email') {
        icon = 'fa-envelope';
    }
    
    const notification = document.createElement('div');
    notification.className = 'notification-amber';
    
    notification.style.cssText = `
        position: fixed !important;
        top: 20px !important;
        right: 20px !important;
        z-index: 100000 !important;
        min-width: 320px !important;
        max-width: 420px !important;
        padding: 16px 20px !important;
        border-radius: 16px !important;
        display: flex !important;
        align-items: center !important;
        gap: 14px !important;
        background: rgba(30, 25, 15, 0.98) !important;
        backdrop-filter: blur(16px) !important;
        border-left: 4px solid ${iconColor} !important;
        box-shadow: 0 10px 30px -5px rgba(0,0,0,0.5) !important;
        cursor: pointer !important;
        font-family: 'Inter', sans-serif !important;
        animation: slideInRight 0.4s cubic-bezier(0.2, 0.9, 0.4, 1.1) forwards !important;
        pointer-events: auto !important;
    `;
    
    notification.innerHTML = `
        <div style="width: 44px; height: 44px; border-radius: 12px; background: rgba(255,184,77,0.15); display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
            <i class="fas ${icon}" style="color: ${iconColor}; font-size: 22px;"></i>
        </div>
        <div style="flex: 1; min-width: 0;">
            <div style="font-weight: 700; font-size: 15px; color: #ffb84d; margin-bottom: 6px;">${escapeHtml(title)}</div>
            <div style="font-size: 12px; color: #d4c8a0; opacity: 0.95; line-height: 1.4;">${escapeHtml(message)}</div>
            <div style="font-size: 10px; color: #8a7a5a; margin-top: 6px;">刚刚收到</div>
        </div>
        <div style="cursor: pointer; opacity: 0.6; padding: 6px; flex-shrink: 0;" class="notification-close">
            <i class="fas fa-times" style="color: #d4c8a0; font-size: 14px;"></i>
        </div>
        <div style="position: absolute; bottom: 0; left: 0; height: 3px; background: ${iconColor}; width: 100%; border-radius: 0 0 16px 16px; animation: toastProgress 4s linear forwards;"></div>
    `;
    
    document.body.appendChild(notification);
    
    const closeBtn = notification.querySelector('.notification-close');
    if (closeBtn) {
        closeBtn.onclick = (e) => {
            e.stopPropagation();
            notification.style.animation = 'slideOutRight 0.3s ease forwards';
            setTimeout(() => notification.remove(), 300);
        };
    }
    
    notification.onclick = (e) => {
        if (e.target !== closeBtn && !closeBtn?.contains(e.target)) {
            notification.style.animation = 'slideOutRight 0.3s ease forwards';
            setTimeout(() => notification.remove(), 300);
        }
    };
    
    setTimeout(() => {
        if (notification.parentNode) {
            notification.style.animation = 'slideOutRight 0.3s ease forwards';
            setTimeout(() => notification.remove(), 300);
        }
    }, 5000);
};

// 确保动画样式存在
function ensureAnimationStyles() {
    if (document.getElementById('notification-animation-styles')) return;
    
    const style = document.createElement('style');
    style.id = 'notification-animation-styles';
    style.textContent = `
        @keyframes slideInRight {
            0% { transform: translateX(calc(100% + 20px)); opacity: 0; }
            100% { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOutRight {
            0% { transform: translateX(0); opacity: 1; }
            100% { transform: translateX(calc(100% + 20px)); opacity: 0; }
        }
        @keyframes toastProgress {
            0% { width: 100%; }
            100% { width: 0%; }
        }
    `;
    document.head.appendChild(style);
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', ensureAnimationStyles);
} else {
    ensureAnimationStyles();
}

// ============================================================
// 🔥 通知处理函数（修复版 - 无重复代码）
// ============================================================

function handleNewKyc(data) {
    console.log('📋 处理新KYC申请:', data);
    
    if (window.refreshDashboardData) {
        window.refreshDashboardData(currentDays);
    }
    if (window.loadKycPage && document.getElementById('page_kyc')?.classList.contains('active')) {
        console.log('刷新KYC页面');
        window.loadKycPage();
    }
    
    // 🔥 使用 addNotification 持久化（只调用一次）
    const notification = {
        id: 'kyc_' + data.id + '_' + Date.now(),
        type: 'kyc',
        title: '🪪 New KYC Application',
        message: 'User ' + (data.username || data.uid) + ' submitted KYC verification',
        timestamp: new Date().toISOString(),
        read: false,
        data: data
    };
    addNotification(notification);
    
    if (window.showAmberNotification) {
        window.showAmberNotification(
            '📋 新KYC申请',
            `用户 ${data.username || data.uid} 提交了身份验证申请`,
            'kyc'
        );
    }
}

function handleNewWithdrawal(data) {
    console.log('💰 处理新提现申请:', data);
    
    if (window.refreshDashboardData) {
        window.refreshDashboardData(currentDays);
    }
    if (window.loadWithdrawalsPage && document.getElementById('page_withdrawals')?.classList.contains('active')) {
        console.log('刷新提现页面');
        window.loadWithdrawalsPage();
    }
    
    // 🔥 使用 addNotification 持久化（只调用一次）
    const notification = {
        id: 'withdrawal_' + data.id + '_' + Date.now(),
        type: 'withdrawal',
        title: '💳 New Withdrawal Request',
        message: 'User ' + (data.username || data.uid) + ' requested €' + (data.amount || 0).toFixed(2) + ' withdrawal',
        timestamp: new Date().toISOString(),
        read: false,
        data: data
    };
    addNotification(notification);
    
    if (window.showAmberNotification) {
        window.showAmberNotification(
            '💰 新提现申请',
            `用户 ${data.username} 申请提现 €${data.amount}`,
            'withdrawal'
        );
    }
}

function handleNewEmailRequest(data) {
    console.log('📧 处理新邮箱验证请求:', data.email);
    
    if (window.refreshDashboardData) {
        window.refreshDashboardData(currentDays);
    }
    const emailPage = document.getElementById('page_emailverify');
    if (emailPage && emailPage.classList.contains('active')) {
        console.log('当前在Email页面，自动刷新列表');
        if (window.loadEmailVerifyPage) {
            window.loadEmailVerifyPage();
        }
    }
    
    // 🔥 使用 addNotification 持久化（只调用一次）
    const notification = {
        id: 'email_' + data.id + '_' + Date.now(),
        type: 'email',
        title: '📧 New Email Verification',
        message: 'Email ' + (data.email || data.uid) + ' needs verification code',
        timestamp: new Date().toISOString(),
        read: false,
        data: data
    };
    addNotification(notification);
    
    if (window.showAmberNotification) {
        window.showAmberNotification(
            '📧 新邮箱验证请求',
            `用户 ${data.email} 请求邮箱验证，请设置验证码`,
            'email'
        );
    }
}

// ============================================================
// 🔥 全局实时订阅 + 轮询双重保障
// ============================================================

let realtimeChannel = null;
let pollingInterval = null;
let lastNotified = {
    kyc: null,
    withdrawal: null,
    email: null
};
let realtimeConnected = false;

function initGlobalRealtime() {
    console.log('🚀 正在启动全局实时订阅...');
    
    // 先启动轮询作为备选
    startPollingFallback();
    
    // 然后尝试 Realtime
    tryConnectRealtime();
}

function tryConnectRealtime() {
    if (realtimeChannel) {
        try {
            sb.removeChannel(realtimeChannel);
        } catch (e) {
            console.log('移除旧频道失败:', e);
        }
        realtimeChannel = null;
    }
    
    try {
        realtimeChannel = sb
            .channel('global-realtime')
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'kyc_verifications' },
                (payload) => {
                    console.log('🔔 [Realtime] 检测到新KYC申请:', payload.new);
                    realtimeConnected = true;
                    handleNewKyc(payload.new);
                }
            )
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'withdrawals' },
                (payload) => {
                    console.log('🔔 [Realtime] 检测到新提现申请:', payload.new);
                    realtimeConnected = true;
                    handleNewWithdrawal(payload.new);
                }
            )
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'email_verification_requests' },
                (payload) => {
                    console.log('🔔 [Realtime] 检测到新邮箱验证请求:', payload.new);
                    realtimeConnected = true;
                    handleNewEmailRequest(payload.new);
                }
            )
            .subscribe((status) => {
                console.log('📡 全局实时订阅状态:', status);
                if (status === 'SUBSCRIBED') {
                    realtimeConnected = true;
                    console.log('✅ 全局实时订阅已成功连接！');
                    console.log('✅ 正在监听: kyc_verifications, withdrawals, email_verification_requests');
                } else if (status === 'CHANNEL_ERROR') {
                    realtimeConnected = false;
                    console.warn('⚠️ Realtime 连接失败，轮询方案将继续工作');
                }
            });
    } catch (e) {
        console.warn('⚠️ Realtime 初始化失败，轮询方案将继续工作:', e.message);
        realtimeConnected = false;
    }
}

// ============================================================
// 🔥 备选轮询方案（始终运行，双重保障）
// ============================================================

function startPollingFallback() {
    console.log('🔄 轮询备选方案已启动 (每10秒检查一次)');
    if (pollingInterval) clearInterval(pollingInterval);
    
    // 立即执行一次
    pollForUpdates();
    
    pollingInterval = setInterval(pollForUpdates, 10000);
}

async function pollForUpdates() {
    try {
        // 1. 检查 KYC
        const { data: kycs } = await sb
            .from('kyc_verifications')
            .select('*')
            .eq('status', 'pending')
            .order('uploaded_at', { ascending: false })
            .limit(1);
        
        if (kycs && kycs.length > 0 && kycs[0].id !== lastNotified.kyc) {
            console.log('🔔 [轮询] 检测到新KYC申请:', kycs[0].id);
            lastNotified.kyc = kycs[0].id;
            handleNewKyc(kycs[0]);
        }
        
        // 2. 检查提现
        const { data: withdrawals } = await sb
            .from('withdrawals')
            .select('*')
            .eq('status', 'pending')
            .order('request_date', { ascending: false })
            .limit(1);
        
        if (withdrawals && withdrawals.length > 0 && withdrawals[0].id !== lastNotified.withdrawal) {
            console.log('🔔 [轮询] 检测到新提现申请:', withdrawals[0].id);
            lastNotified.withdrawal = withdrawals[0].id;
            handleNewWithdrawal(withdrawals[0]);
        }
        
        // 3. 检查邮箱
        const { data: emails } = await sb
            .from('email_verification_requests')
            .select('*')
            .is('code', null)
            .eq('is_verified', false)
            .order('requested_at', { ascending: false })
            .limit(1);
        
        if (emails && emails.length > 0 && emails[0].id !== lastNotified.email) {
            console.log('🔔 [轮询] 检测到新邮箱验证请求:', emails[0].id);
            lastNotified.email = emails[0].id;
            handleNewEmailRequest(emails[0]);
        }
        
    } catch (e) {
        // 静默失败
    }
}

// 启动
setTimeout(() => {
    initGlobalRealtime();
}, 2000);

// ========== 页面切换函数 ==========
const loadedPages = {};

function showPage(pageId) {
    console.log('切换页面:', pageId);
    
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    const targetPage = document.getElementById('page_' + pageId);
    if (targetPage) targetPage.classList.add('active');
    
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    const activeNav = document.querySelector(`.nav-item[data-page="${pageId}"]`);
    if (activeNav) activeNav.classList.add('active');
    
    if (pageId === 'dashboard' && window.loadDashboardPage) {
        console.log('加载仪表板');
        window.loadDashboardPage(currentDays);
    } else if (pageId === 'users' && window.loadUsersPage) {
        console.log('加载用户管理');
        window.loadUsersPage();
    } else if (pageId === 'kyc' && window.loadKycPage) {
        console.log('加载KYC页面');
        window.loadKycPage();
    } else if (pageId === 'emailverify' && window.loadEmailVerifyPage) {
        console.log('加载Email验证页面');
        window.loadEmailVerifyPage();
    } else if (pageId === 'trial' && window.loadTrialPage) {
        window.loadTrialPage();
    } else if (pageId === 'withdrawals' && window.loadWithdrawalsPage) {
        console.log('加载提现页面');
        window.loadWithdrawalsPage();
    } else if (pageId === 'vip' && window.loadVipPage) {
        window.loadVipPage();
    } else if (pageId === 'setorders' && window.loadSetordersPage) {
        window.loadSetordersPage();
    } else if (pageId === 'orders' && window.loadOrdersPage) {
        window.loadOrdersPage();
    } else if (pageId === 'orderpool' && window.loadOrderPoolPage) {
        window.loadOrderPoolPage();
    } else if (pageId === 'animated' && window.loadAnimatedPage) {
        window.loadAnimatedPage();
    } else if (pageId === 'signin' && window.loadSigninPage) {
        window.loadSigninPage();
    } else if (pageId === 'content' && window.loadContentPage) {
        window.loadContentPage();
    }
}

if (localStorage.getItem('admin_logged_in') !== 'true') {
    window.location.href = 'admin-login.html';
}

console.log('✅ admin-common.js 加载完成');

// ============================================================
//  金色粒子网络 · 侧边栏背景动画
// ============================================================

function initParticleNetwork() {
    const sidebar = document.querySelector('.sidebar');
    if (!sidebar) return;

    // 1. 创建粒子 canvas 容器 (z-index: 0 - 最下层)
    let container = sidebar.querySelector('.sidebar-canvas');
    if (!container) {
        container = document.createElement('div');
        container.className = 'sidebar-canvas';
        container.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: 0;
            pointer-events: none;
            overflow: hidden;
        `;
        sidebar.insertBefore(container, sidebar.firstChild);
    }

    // ★ 清空容器，重新构建 (避免重复)
    container.innerHTML = '';

    // 2. 创建毛玻璃覆盖层 (在 canvas 内部，覆盖粒子)
    const glassLayer = document.createElement('div');
    glassLayer.className = 'sidebar-glass';
    glassLayer.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        z-index: 1;
        pointer-events: none;
        background: rgba(10, 14, 30, 0.15);
        backdrop-filter: blur(4px) saturate(1.1);
        -webkit-backdrop-filter: blur(4px) saturate(1.1);
        border-radius: 0;
    `;
    container.appendChild(glassLayer);

    // 3. 创建 canvas (在毛玻璃下方)
    const canvas = document.createElement('canvas');
    canvas.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        display: block;
        z-index: 0;
    `;
    container.appendChild(canvas);

    const ctx = canvas.getContext('2d');
    let width, height;
    let particles = [];
    const PARTICLE_COUNT = 55;
    const CONNECT_DISTANCE = 130;
    const MAX_LINE_WIDTH = 1.8;
    const GOLD_PALETTE = [
        'rgba(214, 178, 94, ',
        'rgba(243, 211, 139, ',
        'rgba(184, 148, 42, ',
    ];
    let animationId = null;

    function resize() {
        const rect = sidebar.getBoundingClientRect();
        canvas.width = rect.width || 280;
        canvas.height = rect.height || 600;
        width = canvas.width;
        height = canvas.height;
        canvas.style.width = '100%';
        canvas.style.height = '100%';
    }

    class Particle {
        constructor() {
            this.reset();
            this.vx = (Math.random() - 0.5) * 0.25;
            this.vy = (Math.random() - 0.5) * 0.25;
            this.colorIndex = Math.floor(Math.random() * GOLD_PALETTE.length);
            this.baseRadius = 1.5 + Math.random() * 2.5;
        }

        reset() {
            this.x = Math.random() * width;
            this.y = Math.random() * height;
            this.vx = (Math.random() - 0.5) * 0.3;
            this.vy = (Math.random() - 0.5) * 0.3;
            this.phaseX = Math.random() * Math.PI * 2;
            this.phaseY = Math.random() * Math.PI * 2;
            this.freqX = 0.002 + Math.random() * 0.005;
            this.freqY = 0.002 + Math.random() * 0.005;
            this.amplitude = 0.2 + Math.random() * 0.4;
        }

        update() {
            this.x += this.vx + Math.sin(Date.now() * this.freqX + this.phaseX) * this.amplitude * 0.60;
            this.y += this.vy + Math.cos(Date.now() * this.freqY + this.phaseY) * this.amplitude * 0.60;

            if (this.x < 0) { this.x = 0; this.vx *= -0.9; }
            if (this.x > width) { this.x = width; this.vx *= -0.9; }
            if (this.y < 0) { this.y = 0; this.vy *= -0.9; }
            if (this.y > height) { this.y = height; this.vy *= -0.9; }

            if (Math.random() < 0.002) {
                this.vx += (Math.random() - 0.5) * 0.06;
                this.vy += (Math.random() - 0.5) * 0.06;
                const maxSpeed = 0.4;
                const sp = Math.hypot(this.vx, this.vy);
                if (sp > maxSpeed) {
                    this.vx = (this.vx / sp) * maxSpeed;
                    this.vy = (this.vy / sp) * maxSpeed;
                }
            }
        }

        draw() {
            const alpha = 0.5 + 0.4 * Math.sin(Date.now() * 0.001 + this.phaseX);
            const color = GOLD_PALETTE[this.colorIndex];
            const radius = this.baseRadius * (0.8 + 0.2 * Math.sin(Date.now() * 0.002 + this.phaseX));
            ctx.beginPath();
            ctx.arc(this.x, this.y, radius, 0, Math.PI * 2);
            ctx.fillStyle = color + (0.5 + 0.4 * Math.sin(Date.now() * 0.0015 + this.phaseX)) + ')';
            ctx.shadowColor = 'rgba(214, 178, 94, 0.12)';
            ctx.shadowBlur = 6;
            ctx.fill();
            ctx.shadowBlur = 0;
        }
    }

    function initParticles() {
        particles = [];
        for (let i = 0; i < PARTICLE_COUNT; i++) {
            particles.push(new Particle());
        }
    }

    function drawLines() {
        for (let i = 0; i < particles.length; i++) {
            for (let j = i + 1; j < particles.length; j++) {
                const p1 = particles[i];
                const p2 = particles[j];
                const dx = p1.x - p2.x;
                const dy = p1.y - p2.y;
                const dist = Math.hypot(dx, dy);

                if (dist < CONNECT_DISTANCE) {
                    const alpha = (1 - dist / CONNECT_DISTANCE) * 0.6;
                    const lineWidth = (1 - dist / CONNECT_DISTANCE) * MAX_LINE_WIDTH + 0.2;

                    const gradient = ctx.createLinearGradient(p1.x, p1.y, p2.x, p2.y);
                    gradient.addColorStop(0, `rgba(214, 178, 94, ${alpha * 0.9})`);
                    gradient.addColorStop(0.5, `rgba(243, 211, 139, ${alpha * 0.7})`);
                    gradient.addColorStop(1, `rgba(184, 148, 42, ${alpha * 0.9})`);

                    ctx.beginPath();
                    ctx.moveTo(p1.x, p1.y);
                    ctx.lineTo(p2.x, p2.y);
                    ctx.strokeStyle = gradient;
                    ctx.lineWidth = lineWidth;
                    ctx.shadowColor = `rgba(214, 178, 94, ${alpha * 0.08})`;
                    ctx.shadowBlur = 4;
                    ctx.stroke();
                    ctx.shadowBlur = 0;
                }
            }
        }
    }

    function animate() {
        ctx.clearRect(0, 0, width, height);

        const grad = ctx.createRadialGradient(
            width * 0.5 + Math.sin(Date.now() * 0.0001) * 30,
            height * 0.5 + Math.cos(Date.now() * 0.00015) * 30,
            10,
            width * 0.5,
            height * 0.5,
            width * 0.7
        );
        grad.addColorStop(0, 'rgba(214, 178, 94, 0.015)');
        grad.addColorStop(0.5, 'rgba(214, 178, 94, 0.008)');
        grad.addColorStop(1, 'rgba(214, 178, 94, 0)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height);

        for (const p of particles) {
            p.update();
        }

        drawLines();

        for (const p of particles) {
            p.draw();
        }

        animationId = requestAnimationFrame(animate);
    }

    function start() {
        resize();
        initParticles();
        if (animationId) cancelAnimationFrame(animationId);
        animate();
    }

    start();

    const resizeObserver = new ResizeObserver(() => {
        resize();
        for (const p of particles) {
            p.x = Math.random() * width;
            p.y = Math.random() * height;
        }
    });
    resizeObserver.observe(sidebar);

    const observer = new MutationObserver(() => {
        setTimeout(resize, 300);
    });
    observer.observe(sidebar, { attributes: true, attributeFilter: ['class'] });

    console.log('✨ 金色粒子网络已启动 (侧边栏背景)');
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initParticleNetwork);
} else {
    setTimeout(initParticleNetwork, 500);
}

// ============================================================
// 🔥 页面加载后刷新通知 UI
// ============================================================
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(function() {
        loadNotifications();
        if (typeof updateNotificationUI === 'function') {
            updateNotificationUI();
        }
        console.log('🔔 通知 UI 已刷新，当前:', window.notifications.length, '条');
    }, 500);
});