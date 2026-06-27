// admin-common.js - 完整版（包含通知角标功能）
const SUPABASE_URL = 'https://qgmbzdfnwsdosdqphlxk.supabase.co';
const SUPABASE_KEY = 'sb_publishable_zsJFjfNUO7NKp8ZH5KrXFQ_WZ8Q2Kym';
const sb = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// ============================================================
// 🔥 性能检测 + 自动降级（解决低帧率问题）
// ============================================================

// 检测设备性能
function detectDevicePerformance() {
    // 检测是否为移动设备
    const isMobile = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);
    
    // 检测是否为低端设备（通过 CPU 核心数判断）
    const cores = navigator.hardwareConcurrency || 4;
    const isLowEnd = cores <= 4;
    
    // 检测内存（如果可用）
    const memory = navigator.deviceMemory || 4;
    const isLowMemory = memory <= 4;
    
    // 检测是否为触摸设备
    const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    
    // 综合判断
    const isLowPerformance = isMobile || isLowEnd || isLowMemory || isTouch;
    
    console.log('📱 设备检测:', {
        isMobile,
        cores,
        memory,
        isTouch,
        isLowPerformance,
        userAgent: navigator.userAgent
    });
    
    return {
        isLowPerformance,
        isMobile,
        isLowEnd,
        isLowMemory,
        isTouch,
        cores,
        memory
    };
}

// 存储性能状态
const deviceInfo = detectDevicePerformance();

// ============================================================
// 🔥 帧率监控 + 自动降级
// ============================================================
let fpsMonitorInterval = null;
let fpsCounter = 0;
let lastFpsCheck = performance.now();
let currentFps = 60;
let isPerformanceDegraded = false;

function startFpsMonitor() {
    let frameCount = 0;
    let lastTime = performance.now();
    
    function checkFps() {
        frameCount++;
        const now = performance.now();
        const delta = now - lastTime;
        
        if (delta >= 1000) {
            currentFps = Math.round(frameCount * 1000 / delta);
            frameCount = 0;
            lastTime = now;
            
            // 🔥 如果帧率持续低于 30，触发降级
            if (currentFps < 30) {
                if (!isPerformanceDegraded) {
                    isPerformanceDegraded = true;
                    applyPerformanceDowngrade();
                }
            } else if (currentFps > 40 && isPerformanceDegraded) {
                // 如果帧率恢复，逐步恢复（但不要立即恢复）
                setTimeout(function() {
                    if (currentFps > 45) {
                        isPerformanceDegraded = false;
                        restorePerformance();
                    }
                }, 5000);
            }
            
            // 控制台显示帧率（调试用）
            if (currentFps < 25) {
                console.warn('⚠️ 当前帧率过低:', currentFps, 'FPS，已触发降级');
            }
        }
        
        requestAnimationFrame(checkFps);
    }
    
    // 延迟启动，等页面加载完成
    setTimeout(checkFps, 1000);
}

// ============================================================
// 🔥 性能降级方案
// ============================================================
function applyPerformanceDowngrade() {
    console.log('🔧 应用性能降级方案...');
    
    // 1. 降低粒子数量或暂停
    const sidebarCanvas = document.querySelector('.sidebar-canvas canvas');
    if (sidebarCanvas) {
        // 标记粒子系统降级
        sidebarCanvas.dataset.degraded = 'true';
    }
    
    // 2. 停止不必要的动画
    document.querySelectorAll('.nav-item .shimmer').forEach(function(el) {
        el.style.animationPlayState = 'paused';
    });
    
    // 3. 减少阴影和模糊效果
    document.querySelectorAll('.card, .stat-card, .quick-card').forEach(function(el) {
        el.style.boxShadow = '0 2px 8px rgba(0,0,0,0.2)';
        el.style.backdropFilter = 'blur(4px)';
        el.style.transition = 'none';
    });
    
    // 4. 禁用 hover 动画
    document.querySelectorAll('.nav-item, .btn-primary, button').forEach(function(el) {
        el.style.transition = 'none';
    });
    
    // 5. 表格行 hover 效果降级
    document.querySelectorAll('.data-table tr').forEach(function(el) {
        el.style.transition = 'none';
    });
    
    // 6. 如果是移动端，进一步降级
    if (deviceInfo.isMobile) {
        document.querySelectorAll('.sidebar').forEach(function(el) {
            el.style.backdropFilter = 'blur(8px)';
        });
        
        // 减少 ECharts 动画
        if (window.trendChart) {
            window.trendChart.setOption({
                animation: false,
                animationDuration: 0
            });
        }
    }
    
    // 7. 显示降级提示（非侵入式）
    showPerformanceNotice();
}

// ============================================================
// 🔥 显示性能提示（轻量）
// ============================================================
function showPerformanceNotice() {
    // 检查是否已经显示过
    if (document.getElementById('perfNotice')) return;
    
    const notice = document.createElement('div');
    notice.id = 'perfNotice';
    notice.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        z-index: 9999;
        background: rgba(20, 24, 40, 0.92);
        backdrop-filter: blur(12px);
        border: 1px solid rgba(255, 184, 77, 0.15);
        border-radius: 12px;
        padding: 10px 16px;
        font-size: 12px;
        color: #d4c8a0;
        font-family: 'Inter', sans-serif;
        box-shadow: 0 8px 24px rgba(0,0,0,0.3);
        max-width: 280px;
        animation: slideInRight 0.4s cubic-bezier(0.2, 0.9, 0.4, 1.1) forwards;
        cursor: pointer;
    `;
    notice.innerHTML = `
        <div style="display:flex;align-items:center;gap:8px;">
            <span style="font-size:16px;">⚡</span>
            <div>
                <div style="font-weight:600;color:#ffb84d;">性能优化已启用</div>
                <div style="font-size:11px;color:#8892a8;">设备检测到低帧率，已自动优化</div>
            </div>
            <button onclick="this.parentElement.parentElement.remove()" style="background:none;border:none;color:#5a4a6a;cursor:pointer;font-size:14px;">×</button>
        </div>
    `;
    notice.onclick = function() {
        this.remove();
    };
    document.body.appendChild(notice);
    
    // 5秒后自动消失
    setTimeout(function() {
        if (notice.parentNode) notice.remove();
    }, 8000);
}

// ============================================================
// 🔥 恢复性能（当帧率恢复时）
// ============================================================
function restorePerformance() {
    console.log('🔄 恢复性能设置...');
    isPerformanceDegraded = false;
    
    // 恢复阴影
    document.querySelectorAll('.card, .stat-card, .quick-card').forEach(function(el) {
        el.style.boxShadow = '';
        el.style.backdropFilter = '';
        el.style.transition = '';
    });
    
    // 恢复 hover 动画
    document.querySelectorAll('.nav-item, .btn-primary, button').forEach(function(el) {
        el.style.transition = '';
    });
    
    document.querySelectorAll('.data-table tr').forEach(function(el) {
        el.style.transition = '';
    });
    
    // 恢复粒子系统
    const sidebarCanvas = document.querySelector('.sidebar-canvas canvas');
    if (sidebarCanvas) {
        sidebarCanvas.dataset.degraded = 'false';
    }
    
    // 移除提示
    const notice = document.getElementById('perfNotice');
    if (notice) notice.remove();
}

// ============================================================
// 🔥 启动帧率监控
// ============================================================
// 在页面加载完成后启动
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        setTimeout(startFpsMonitor, 1500);
    });
} else {
    setTimeout(startFpsMonitor, 1500);
}

console.log('✅ 性能监控已启动，当前设备:', deviceInfo.isLowPerformance ? '低性能模式' : '高性能模式');

// ============================================================
// 通知数据
// ============================================================
let notificationCounts = {
  dashboard: 0,
  kyc: 0,
  email: 0,
  withdrawal: 0
};

// 已读状态（点击后角标消失，但高亮取决于是否当前页面）
let readNotifications = {
  dashboard: false,
  kyc: false,
  email: false,
  withdrawal: false
};

// 当前激活的页面
let currentActivePage = 'dashboard';

// ============================================================
// 🔥 全局 Tab 标签栏状态
// ============================================================
let tabs = [];
let activeTabId = null;
let tabIdCounter = 0;

// 页面定义（所有可用页面）
const PAGE_DEFS = {
    dashboard: { id: 'dashboard', label: 'Dashboard', icon: 'fa-chart-pie', pageId: 'dashboard' },
    users: { id: 'users', label: 'Users', icon: 'fa-users', pageId: 'users' },
    kyc: { id: 'kyc', label: 'KYC', icon: 'fa-id-card', pageId: 'kyc' },
    emailverify: { id: 'emailverify', label: 'Email', icon: 'fa-envelope', pageId: 'emailverify' },
    trial: { id: 'trial', label: 'Trial', icon: 'fa-gift', pageId: 'trial' },
    withdrawals: { id: 'withdrawals', label: 'Withdrawal', icon: 'fa-money-bill-wave', pageId: 'withdrawals' },
    vip: { id: 'vip', label: 'VIP', icon: 'fa-crown', pageId: 'vip' },
    setorders: { id: 'setorders', label: 'Orders Trigger', icon: 'fa-cog', pageId: 'setorders' },
    orders: { id: 'orders', label: 'Orders History', icon: 'fa-clock', pageId: 'orders' },
    orderpool: { id: 'orderpool', label: 'Orders Pool', icon: 'fa-hotel', pageId: 'orderpool' },
    animated: { id: 'animated', label: 'Animated', icon: 'fa-play-circle', pageId: 'animated' },
    signin: { id: 'signin', label: 'Check In', icon: 'fa-calendar-check', pageId: 'signin' },
    content: { id: 'content', label: 'Content', icon: 'fa-file-alt', pageId: 'content' }
};

// ============================================================
// 🔥 全局通知数组
// ============================================================
if (typeof window.notifications === 'undefined') {
    window.notifications = [];
}

// ============================================================
// 🔥 通知持久化存储
// ============================================================
function loadNotifications() {
    try {
        const saved = localStorage.getItem('admin_notifications');
        if (saved) {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed) && parsed.length > 0) {
                window.notifications = parsed;
                return;
            }
        }
    } catch (e) {}
    window.notifications = window.notifications || [];
}

function saveNotifications() {
    try {
        localStorage.setItem('admin_notifications', JSON.stringify(window.notifications));
    } catch (e) {}
}

function addNotification(notification) {
    if (typeof window.notifications === 'undefined') {
        window.notifications = [];
    }
    const exists = window.notifications.some(n => n.id === notification.id);
    if (!exists) {
        window.notifications.unshift(notification);
        if (window.notifications.length > 500) {
            window.notifications = window.notifications.slice(0, 500);
        }
        saveNotifications();
        if (typeof updateNotificationUI === 'function') {
            updateNotificationUI();
        }
        // 更新侧边栏角标
        updateSidebarBadges();
    }
}

loadNotifications();

// ============================================================
// 🔥 通知 UI 更新
// ============================================================
function updateNotificationUI() {
    var badge = document.getElementById('notificationBadge');
    var countEl = document.getElementById('notificationCount');
    var listEl = document.getElementById('notificationList');

    if (!badge || !countEl || !listEl) {
        setTimeout(function() {
            if (document.getElementById('notificationBadge')) {
                updateNotificationUI();
            }
        }, 500);
        return;
    }

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

window.markNotificationRead = function(id) {
    for (var i = 0; i < window.notifications.length; i++) {
        if (window.notifications[i].id === id) {
            window.notifications[i].read = true;
            break;
        }
    }
    saveNotifications();
    updateNotificationUI();
    updateSidebarBadges();
};

window.clearAllNotifications = function() {
    window.notifications = [];
    saveNotifications();
    updateNotificationUI();
    updateSidebarBadges();
    if (typeof showToast === 'function') {
        showToast('All notifications cleared', 'success');
    }
};

// ============================================================
// 🔥 侧边栏渲染（带通知角标）
// ============================================================
function renderSidebarNav() {
  const navList = document.querySelector('.nav-list');
  if (!navList) return;

  navList.innerHTML = '';

  const navItems = [
    { id: 'dashboard', icon: 'fa-chart-pie', label: 'Dashboard' },
    { id: 'users', icon: 'fa-users', label: 'Users Management' },
    { id: 'kyc', icon: 'fa-id-card', label: 'KYC Verification' },
    { id: 'emailverify', icon: 'fa-envelope', label: 'Email Verification' },
    { id: 'trial', icon: 'fa-gift', label: 'Trial Bonus' },
    { id: 'withdrawals', icon: 'fa-money-bill-wave', label: 'Withdrawal' },
    { id: 'vip', icon: 'fa-crown', label: 'VIP Setting' },
    { id: 'setorders', icon: 'fa-cog', label: 'Orders Trigger' },
    { id: 'orders', icon: 'fa-clock', label: 'Orders History' },
    { id: 'orderpool', icon: 'fa-hotel', label: 'Orders Pool' },
    { id: 'animated', icon: 'fa-play-circle', label: 'Animated' },
    { id: 'signin', icon: 'fa-calendar-check', label: 'Check In Bonus' },
    { id: 'content', icon: 'fa-file-alt', label: 'Content Management' }
  ];

  navItems.forEach(item => {
    const div = document.createElement('div');
    div.className = 'nav-item';
    div.setAttribute('data-page', item.id);

    const isActive = currentActivePage === item.id;
    const hasUnread = notificationCounts[item.id] > 0 && !readNotifications[item.id];

    if (isActive) div.classList.add('active');
    if (hasUnread) div.classList.add('has-notification');

    div.innerHTML = `
      <i class="fas ${item.icon}"></i>
      <span class="nav-label">${item.label}</span>
      ${hasUnread ? `<span class="badge-notify" id="badge-${item.id}">${notificationCounts[item.id]}</span>` : ''}
    `;

    // ★ 修改点击事件：改为打开 Tab
    div.addEventListener('click', function(e) {
      e.stopPropagation();
      const pageId = this.dataset.page;

      // 标记通知为已读
      const badgeId = Object.keys(notificationCounts).find(key => key === pageId);
      if (badgeId && notificationCounts[badgeId] > 0 && !readNotifications[badgeId]) {
        readNotifications[badgeId] = true;
        const badge = this.querySelector('.badge-notify');
        if (badge) badge.remove();
        this.classList.remove('has-notification');
        console.log(`✅ 通知已读: ${item.label}`);
      }

      // 更新侧边栏激活状态
      document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
      this.classList.add('active');
      currentActivePage = pageId;

      // ★ 改为打开标签页（而不是直接 showPage）
      openTab(pageId);
    });

    navList.appendChild(div);
  });
}

// ============================================================
// 🔥 更新侧边栏角标（外部调用）
// ============================================================
function updateSidebarBadges() {
  // 重新渲染侧边栏
  renderSidebarNav();

  // 重新激活当前页面
  document.querySelectorAll('.nav-item').forEach(el => {
    if (el.dataset.page === currentActivePage) {
      el.classList.add('active');
    }
  });
}

// ============================================================
// 🔥 更新通知数量（有新消息时调用）
// ============================================================
function updateNotificationCount(moduleId, count) {
  notificationCounts[moduleId] = count;
  readNotifications[moduleId] = false; // 新通知到来，重置已读状态

  updateSidebarBadges();

  if (count > 0) {
    const moduleNames = {
      dashboard: 'Dashboard',
      kyc: 'KYC Verification',
      email: 'Email Verification',
      withdrawal: 'Withdrawal'
    };
    if (typeof showAmberNotification === 'function') {
      showAmberNotification(
        `📬 新通知 (${moduleNames[moduleId] || moduleId})`,
        `您有 ${count} 条待处理通知`,
        'info'
      );
    }
  }
}

// ============================================================
// 🔥 加载各模块通知数量
// ============================================================
async function loadNotificationCounts() {
  try {
    // KYC 待处理
    const kycRes = await sb.from('kyc_verifications').select('id', { count: 'exact', head: true }).eq('status', 'pending');
    const kycCount = kycRes.count || 0;

    // Withdrawal 待处理
    const withdrawalRes = await sb.from('withdrawals').select('id', { count: 'exact', head: true }).eq('status', 'pending');
    const withdrawalCount = withdrawalRes.count || 0;

    // Email 待处理
    const emailRes = await sb.from('email_verification_requests').select('id', { count: 'exact', head: true }).eq('is_verified', false).is('code', null);
    const emailCount = emailRes.count || 0;

    // Dashboard = 所有通知总和
    const dashboardCount = kycCount + withdrawalCount + emailCount;

    notificationCounts.dashboard = dashboardCount;
    notificationCounts.kyc = kycCount;
    notificationCounts.email = emailCount;
    notificationCounts.withdrawal = withdrawalCount;

    updateSidebarBadges();

    console.log('📊 通知数量已更新:', notificationCounts);
  } catch (e) {
    console.error('加载通知数量失败:', e);
  }
}

// ============================================================
// 工具函数
// ============================================================
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

// ========== 琥珀金风格通知 ==========
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
// 🔥 通知处理函数
// ============================================================
function handleNewKyc(data) {
    console.log('📋 处理新KYC申请:', data);
    
    if (window.refreshDashboardData) {
        window.refreshDashboardData(currentDays);
    }
    if (window.loadKycPage && document.getElementById('page_kyc')?.classList.contains('active')) {
        window.loadKycPage();
    }
    
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
    
    // 更新角标
    loadNotificationCounts();
    
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
        window.loadWithdrawalsPage();
    }
    
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
    
    loadNotificationCounts();
    
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
        if (window.loadEmailVerifyPage) {
            window.loadEmailVerifyPage();
        }
    }
    
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
    
    loadNotificationCounts();
    
    if (window.showAmberNotification) {
        window.showAmberNotification(
            '📧 新邮箱验证请求',
            `用户 ${data.email} 请求邮箱验证，请设置验证码`,
            'email'
        );
    }
}

// ============================================================
// 🔥 全局实时订阅
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
    startPollingFallback();
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

function startPollingFallback() {
    console.log('🔄 轮询备选方案已启动 (每10秒检查一次)');
    if (pollingInterval) clearInterval(pollingInterval);
    pollForUpdates();
    pollingInterval = setInterval(pollForUpdates, 10000);
}

async function pollForUpdates() {
    try {
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
        
        // 定期更新角标
        loadNotificationCounts();
        
    } catch (e) {
        // 静默失败
    }
}

// ============================================================
// 🔥 页面切换函数
// ============================================================
function showPage(pageId) {
    console.log('切换页面:', pageId);
    currentActivePage = pageId;
    
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    const targetPage = document.getElementById('page_' + pageId);
    if (targetPage) targetPage.classList.add('active');
    
    // 更新侧边栏激活状态
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    const activeNav = document.querySelector(`.nav-item[data-page="${pageId}"]`);
    if (activeNav) {
        activeNav.classList.add('active');
        // 如果有未读通知，has-notification 保留
        // 如果已读，has-notification 已经移除
    }
    
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

// ============================================================
// 🔥 金色粒子网络 · 侧边栏背景动画
// ============================================================
function initParticleNetwork() {
    const sidebar = document.querySelector('.sidebar');
    if (!sidebar) return;

// 🔥 如果设备性能低，减少粒子数量
    const isLowPerformance = deviceInfo.isLowPerformance || false;
    const PARTICLE_COUNT = isLowPerformance ? 18 : 55;  // 从 55 降到 18
    const CONNECT_DISTANCE = isLowPerformance ? 80 : 130;  // 从 130 降到 80

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

    container.innerHTML = '';

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

// ============================================================
// 🔥 初始化
// ============================================================
document.addEventListener('DOMContentLoaded', function() {
    // 渲染侧边栏
    renderSidebarNav();

// ★ 添加这一行：初始化 Tab 标签栏
    initTabBar();
    
    // 激活当前页面
    document.querySelectorAll('.nav-item').forEach(el => {
        if (el.dataset.page === currentActivePage) {
            el.classList.add('active');
        }
    });
    
    // 加载通知数量
    loadNotificationCounts();
    
    // 启动粒子网络
    setTimeout(initParticleNetwork, 500);
    
    // 刷新通知UI
    setTimeout(function() {
        loadNotifications();
        if (typeof updateNotificationUI === 'function') {
            updateNotificationUI();
        }
        console.log('🔔 通知 UI 已刷新，当前:', window.notifications.length, '条');
    }, 500);
});

// 启动实时订阅
setTimeout(() => {
    initGlobalRealtime();
}, 2000);

// 检查登录状态
if (localStorage.getItem('admin_logged_in') !== 'true') {
    window.location.href = 'admin-login.html';
}

// ============================================================
// 🔥 Tab 标签栏渲染
// ============================================================
function renderTabBar() {
    const container = document.getElementById('tabBarContainer');
    if (!container) {
        // 如果 tabBarContainer 还不存在，先创建
        initTabBar();
        return;
    }

    // 保留 + 按钮
    const addBtn = container.querySelector('#addTabBtn');
    while (container.firstChild) {
        if (container.firstChild.id === 'addTabBtn') break;
        container.removeChild(container.firstChild);
    }

    if (tabs.length === 0) {
        const empty = document.createElement('span');
        empty.className = 'empty-tab';
        empty.textContent = '点击侧边栏打开页面';
        empty.style.cssText = 'color:rgba(255,255,255,0.08);font-size:12px;padding:0 8px;';
        container.insertBefore(empty, addBtn);
        document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
        return;
    }

    tabs.forEach(tab => {
        const tabEl = document.createElement('button');
        tabEl.className = 'tab-item';
        tabEl.dataset.tabId = tab.id;
        tabEl.dataset.pageId = tab.pageId;

        const isActive = tab.id === activeTabId;
        if (isActive) tabEl.classList.add('active');

        const hasUnread = notificationCounts[tab.pageId] > 0 && !readNotifications[tab.pageId];
        if (hasUnread) tabEl.classList.add('has-notification');

        const pageDef = PAGE_DEFS[tab.pageId];
        const icon = pageDef ? pageDef.icon : 'fa-file';

        tabEl.innerHTML = `
            <i class="fas ${icon}"></i>
            <span>${tab.label}</span>
            ${hasUnread ? `<span class="tab-badge">${notificationCounts[tab.pageId]}</span>` : ''}
            <button class="tab-close" data-tab-id="${tab.id}" title="关闭标签">
                <i class="fas fa-times"></i>
            </button>
        `;

        tabEl.addEventListener('click', function(e) {
            if (e.target.closest('.tab-close')) return;
            switchTab(tab.id);
        });

        const closeBtn = tabEl.querySelector('.tab-close');
        closeBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            closeTab(tab.id);
        });

        container.insertBefore(tabEl, addBtn);
    });

    updatePageVisibility();
}

function updatePageVisibility() {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));

    const activeTab = tabs.find(t => t.id === activeTabId);
    if (activeTab) {
        const pageEl = document.getElementById('page_' + activeTab.pageId);
        if (pageEl) {
            pageEl.classList.add('active');
            loadPageContent(activeTab.pageId);
        }
    }
}

let loadedPages = {};

function loadPageContent(pageId) {
    if (loadedPages[pageId]) return;
    loadedPages[pageId] = true;

    const pageMap = {
        'dashboard': 'loadDashboardPage',
        'users': 'loadUsersPage',
        'kyc': 'loadKycPage',
        'emailverify': 'loadEmailVerifyPage',
        'trial': 'loadTrialPage',
        'withdrawals': 'loadWithdrawalsPage',
        'vip': 'loadVipPage',
        'setorders': 'loadSetordersPage',
        'orders': 'loadOrdersPage',
        'orderpool': 'loadOrderPoolPage',
        'animated': 'loadAnimatedPage',
        'signin': 'loadSigninPage',
        'content': 'loadContentPage'
    };

    const fnName = pageMap[pageId];
    if (fnName && window[fnName]) {
        console.log(`📄 加载页面: ${pageId}`);
        if (pageId === 'dashboard') {
            window[fnName](currentDays || 1);
        } else {
            window[fnName]();
        }
    }
}

function openTab(pageId) {
    const existing = tabs.find(t => t.pageId === pageId);
    if (existing) {
        switchTab(existing.id);
        return;
    }

    const pageDef = PAGE_DEFS[pageId];
    if (!pageDef) return;

    const newTab = {
        id: ++tabIdCounter,
        pageId: pageId,
        label: pageDef.label,
        notificationCount: notificationCounts[pageId] || 0
    };

    tabs.push(newTab);
    activeTabId = newTab.id;
    renderTabBar();

    const container = document.getElementById('tabBarContainer');
    const newTabEl = container.querySelector(`.tab-item[data-tab-id="${newTab.id}"]`);
    if (newTabEl) {
        newTabEl.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }
}

function switchTab(tabId) {
    const tab = tabs.find(t => t.id === tabId);
    if (!tab) return;

    const pageId = tab.pageId;
    if (notificationCounts[pageId] > 0 && !readNotifications[pageId]) {
        readNotifications[pageId] = true;
        renderTabBar();
        console.log(`✅ 通知已读: ${pageId}`);
    }

    if (activeTabId === tabId) return;
    activeTabId = tabId;
    renderTabBar();
}

function closeTab(tabId) {
    const index = tabs.findIndex(t => t.id === tabId);
    if (index === -1) return;

    tabs.splice(index, 1);

    if (tabs.length === 0) {
        activeTabId = null;
    } else if (activeTabId === tabId) {
        const newIndex = Math.min(index, tabs.length - 1);
        activeTabId = tabs[newIndex].id;
    }

    renderTabBar();
}

function initTabBar() {
    if (document.getElementById('tabBarContainer')) return;

    const main = document.querySelector('.main');
    if (!main) {
        setTimeout(initTabBar, 500);
        return;
    }

    const container = document.createElement('div');
    container.id = 'tabBarContainer';
    container.className = 'tab-bar-container';
    container.style.cssText = `
        display: flex;
        align-items: center;
        background: rgba(12, 16, 28, 0.92);
        border-bottom: 1px solid rgba(214, 178, 94, 0.08);
        padding: 0 12px;
        height: 50px;
        overflow-x: auto;
        overflow-y: hidden;
        flex-shrink: 0;
        gap: 2px;
        position: sticky;
        top: 0;
        z-index: 100;
        scrollbar-width: thin;
        box-shadow: 0 2px 20px rgba(0,0,0,0.3), inset 0 1px 0 rgba(214, 178, 94, 0.04);
        margin: -24px -32px 20px -32px;
        padding-left: 20px;
        padding-right: 16px;
    `;

    const addBtn = document.createElement('button');
    addBtn.id = 'addTabBtn';
    addBtn.className = 'tab-add-btn';
    addBtn.innerHTML = '<i class="fas fa-plus"></i>';
    addBtn.title = '打开新页面';
    addBtn.style.cssText = `
        display: flex;
        align-items: center;
        justify-content: center;
        width: 34px;
        height: 34px;
        border-radius: 6px;
        border: 1px solid rgba(255,255,255,0.06);
        background: rgba(255,255,255,0.02);
        color: rgba(255,255,255,0.2);
        cursor: pointer;
        font-size: 14px;
        transition: 0.25s;
        flex-shrink: 0;
        margin-left: 4px;
        font-family: 'Inter', sans-serif;
    `;
    addBtn.addEventListener('mouseenter', function() {
        this.style.borderColor = 'rgba(214,178,94,0.2)';
        this.style.color = '#D6B25E';
        this.style.background = 'rgba(214,178,94,0.04)';
    });
    addBtn.addEventListener('mouseleave', function() {
        this.style.borderColor = 'rgba(255,255,255,0.06)';
        this.style.color = 'rgba(255,255,255,0.2)';
        this.style.background = 'rgba(255,255,255,0.02)';
    });

    container.appendChild(addBtn);
    main.insertBefore(container, main.firstChild);

    // 添加 Tab 样式
    const style = document.getElementById('tab-bar-styles');
    if (!style) {
        const newStyle = document.createElement('style');
        newStyle.id = 'tab-bar-styles';
        newStyle.textContent = `
            .tab-item {
                display: flex;
                align-items: center;
                gap: 8px;
                padding: 6px 14px;
                border-radius: 8px 8px 0 0;
                background: rgba(255,255,255,0.02);
                color: rgba(255,255,255,0.45);
                font-size: 12px;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.25s ease;
                white-space: nowrap;
                flex-shrink: 0;
                height: 42px;
                border: none;
                font-family: 'Inter', sans-serif;
                position: relative;
                user-select: none;
                border-top: 1px solid transparent;
                border-left: 1px solid transparent;
                border-right: 1px solid transparent;
                text-shadow: 0 1px 2px rgba(0,0,0,0.3);
            }
            .tab-item i {
                font-size: 13px;
                color: rgba(255,255,255,0.2);
                transition: 0.25s;
            }
            .tab-item:hover {
                background: rgba(255,255,255,0.05);
                color: rgba(255,255,255,0.6);
                border-top-color: rgba(214,178,94,0.06);
                border-left-color: rgba(214,178,94,0.04);
                border-right-color: rgba(214,178,94,0.04);
            }
            .tab-item.active {
                background: linear-gradient(180deg, rgba(214,178,94,0.08) 0%, rgba(214,178,94,0.02) 100%);
                color: #F3D38B;
                border-top: 1px solid rgba(214,178,94,0.2);
                border-left: 1px solid rgba(214,178,94,0.06);
                border-right: 1px solid rgba(214,178,94,0.06);
                box-shadow: 0 -2px 16px rgba(214,178,94,0.04), inset 0 1px 0 rgba(214,178,94,0.06);
            }
            .tab-item.active i {
                color: #D6B25E;
                filter: drop-shadow(0 0 6px rgba(214,178,94,0.1));
            }
            .tab-item.active::after {
                content: '';
                position: absolute;
                bottom: 0;
                left: 15%;
                width: 70%;
                height: 2px;
                background: linear-gradient(90deg, transparent, #D6B25E, #F3D38B, #D6B25E, transparent);
                border-radius: 2px;
                box-shadow: 0 0 12px rgba(214,178,94,0.15);
            }
            .tab-close {
                display: flex;
                align-items: center;
                justify-content: center;
                width: 18px;
                height: 18px;
                border-radius: 4px;
                border: none;
                background: transparent;
                color: rgba(255,255,255,0.15);
                cursor: pointer;
                font-size: 10px;
                transition: 0.2s;
                padding: 0;
                margin-left: 2px;
            }
            .tab-close:hover {
                background: rgba(232,128,128,0.15);
                color: #e88080;
                box-shadow: 0 0 12px rgba(232,128,128,0.05);
            }
            .tab-badge {
                background: #4a7cff;
                color: #fff;
                font-size: 9px;
                font-weight: 700;
                min-width: 16px;
                height: 16px;
                padding: 0 5px;
                border-radius: 40px;
                display: flex;
                align-items: center;
                justify-content: center;
                line-height: 1;
                box-shadow: 0 0 12px rgba(74,124,255,0.3);
                margin-left: 2px;
                flex-shrink: 0;
                border: 1px solid rgba(255,255,255,0.06);
            }
            .tab-item.has-notification {
                color: #F3D38B;
            }
            .tab-item.has-notification i {
                color: #D6B25E;
                filter: drop-shadow(0 0 8px rgba(214,178,94,0.08));
            }
            .tab-add-btn:hover {
                border-color: rgba(214,178,94,0.2);
                color: #D6B25E;
                background: rgba(214,178,94,0.04);
            }
            .empty-tab {
                color: rgba(255,255,255,0.08);
                font-size: 12px;
                padding: 0 8px;
            }
            .tab-bar-container::-webkit-scrollbar {
                height: 2px;
            }
            .tab-bar-container::-webkit-scrollbar-thumb {
                background: rgba(214,178,94,0.15);
                border-radius: 4px;
            }
        `;
        document.head.appendChild(newStyle);
    }

    // + 按钮点击：打开未打开的页面
    addBtn.addEventListener('click', function() {
        const pageIds = Object.keys(PAGE_DEFS);
        const available = pageIds.filter(id => !tabs.some(t => t.pageId === id));
        if (available.length === 0) {
            showToast('所有页面都已打开！', 'info');
            return;
        }
        openTab(available[0]);
    });

    // 快捷键 Ctrl+W
    document.addEventListener('keydown', function(e) {
        if ((e.ctrlKey || e.metaKey) && e.key === 'w') {
            const activeTab = tabs.find(t => t.id === activeTabId);
            if (activeTab) {
                e.preventDefault();
                closeTab(activeTab.id);
            }
        }
    });

    // 默认打开 Dashboard
    openTab('dashboard');

    console.log('✅ 全局 Tab 标签栏已初始化');
    console.log('💡 快捷键: Ctrl+W 关闭当前标签');
}

// 暴露给全局
window.openTab = openTab;
window.closeTab = closeTab;
window.switchTab = switchTab;
window.renderTabBar = renderTabBar;
window.initTabBar = initTabBar;

console.log('✅ admin-common.js 加载完成（含通知角标功能）');