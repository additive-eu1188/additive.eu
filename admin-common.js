// admin-common.js - 完整版（包含自定义弹窗和通知 + 所有页面实时刷新）
const SUPABASE_URL = 'https://ygeawapbjcfytjoxpttk.supabase.co';
const SUPABASE_KEY = 'sb_publishable_3X4gUSBt2i7OXB1IsajBiQ__NM-OIGn';
const sb = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

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

// ========== 全局实时订阅（监控所有表） ==========
let realtimeChannel = null;

function initGlobalRealtime() {
    console.log('🚀 正在启动全局实时订阅...');
    
    if (realtimeChannel) {
        sb.removeChannel(realtimeChannel);
    }
    
    realtimeChannel = sb
        .channel('global-realtime')
        // 监听 KYC 新申请
        .on(
            'postgres_changes',
            { event: 'INSERT', schema: 'public', table: 'kyc_verifications' },
            (payload) => {
                console.log('🔔 检测到新KYC申请:', payload.new);
                handleNewKyc(payload.new);
            }
        )
        // 监听提现新申请
        .on(
            'postgres_changes',
            { event: 'INSERT', schema: 'public', table: 'withdrawals' },
            (payload) => {
                console.log('🔔 检测到新提现申请:', payload.new);
                handleNewWithdrawal(payload.new);
            }
        )
        // 监听邮箱验证新请求
        .on(
            'postgres_changes',
            { event: 'INSERT', schema: 'public', table: 'email_verification_requests' },
            (payload) => {
                console.log('🔔 检测到新邮箱验证请求:', payload.new);
                console.log('📧 邮箱:', payload.new.email);
                handleNewEmailRequest(payload.new);
            }
        )
        .subscribe((status) => {
            console.log('📡 全局实时订阅状态:', status);
            if (status === 'SUBSCRIBED') {
                console.log('✅ 全局实时订阅已成功连接！');
                console.log('✅ 正在监听: kyc_verifications, withdrawals, email_verification_requests');
            } else if (status === 'CHANNEL_ERROR') {
                console.error('❌ 实时订阅连接失败，5秒后重试...');
                setTimeout(() => initGlobalRealtime(), 5000);
            }
        });
}

// 处理新KYC申请
function handleNewKyc(data) {
    console.log('📋 处理新KYC申请:', data);
    
    if (window.refreshDashboardData) {
        window.refreshDashboardData(currentDays);
    }
    
    if (window.loadKycPage && document.getElementById('page_kyc')?.classList.contains('active')) {
        console.log('刷新KYC页面');
        window.loadKycPage();
    }
    
    if (window.showAmberNotification) {
        window.showAmberNotification(
            '📋 新KYC申请',
            `用户 ${data.username || data.uid} 提交了身份验证申请`,
            'kyc'
        );
    }
}

// 处理新提现申请
function handleNewWithdrawal(data) {
    console.log('💰 处理新提现申请:', data);
    
    if (window.refreshDashboardData) {
        window.refreshDashboardData(currentDays);
    }
    
    if (window.loadWithdrawalsPage && document.getElementById('page_withdrawals')?.classList.contains('active')) {
        console.log('刷新提现页面');
        window.loadWithdrawalsPage();
    }
    
    if (window.showAmberNotification) {
        window.showAmberNotification(
            '💰 新提现申请',
            `用户 ${data.username} 申请提现 €${data.amount}`,
            'withdrawal'
        );
    }
}

// 处理新邮箱验证请求
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
    
    if (window.showAmberNotification) {
        window.showAmberNotification(
            '📧 新邮箱验证请求',
            `用户 ${data.email} 请求邮箱验证，请设置验证码`,
            'email'
        );
    } else {
        console.log('琥珀通知函数不存在，使用 alert 代替');
        alert(`新邮箱验证请求: ${data.email}`);
    }
}

// 启动全局实时订阅
setTimeout(() => {
    initGlobalRealtime();
}, 1000);

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
    
    // 每次切换页面都重新加载，确保数据最新
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

// 登录检查
if (localStorage.getItem('admin_logged_in') !== 'true') {
    window.location.href = 'admin-login.html';
}

console.log('✅ admin-common.js 加载完成');