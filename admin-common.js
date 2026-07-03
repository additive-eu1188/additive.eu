// admin-common.js - 完整版（金属质感侧边栏 + 通知声音 + Tab 拖拽排序 + 持久化）
const SUPABASE_URL = 'https://qgmbzdfnwsdosdqphlxk.supabase.co';
const SUPABASE_KEY = 'sb_publishable_zsJFjfNUO7NKp8ZH5KrXFQ_WZ8Q2Kym';
const sb = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// ============================================================
// 🔔 通知声音配置
// ============================================================

const NOTIFICATION_SOUNDS = {
    kyc: 'https://qgmbzdfnwsdosdqphlxk.supabase.co/storage/v1/object/public/notification-sounds/kycverification.mp3',
    withdrawal: 'https://qgmbzdfnwsdosdqphlxk.supabase.co/storage/v1/object/public/notification-sounds/withdrawal.mp3',
    email: 'https://qgmbzdfnwsdosdqphlxk.supabase.co/storage/v1/object/public/notification-sounds/emailverification.mp3'
};

// ============================================================
// 🔔 通知声音 - 彻底修复版
// ============================================================

let audioCache = {};
let audioContextUnlocked = false;
let audioContext = null;
let soundInitAttempts = 0;

// 预加载所有声音（页面加载时执行）
function preloadAllSounds() {
    Object.keys(NOTIFICATION_SOUNDS).forEach(function(type) {
        try {
            var url = NOTIFICATION_SOUNDS[type];
            if (!url) return;
            var audio = new Audio(url);
            audio.preload = 'auto';
            audio.load();
            audioCache[type] = audio;
            console.log('🔊 预加载声音:', type);
        } catch (e) {
            console.log('⚠️ 预加载声音失败:', type, e.message);
        }
    });
}

// 获取或创建 AudioContext
function getAudioContext() {
    if (!audioContext) {
        try {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.log('⚠️ 无法创建 AudioContext:', e.message);
            return null;
        }
    }
    return audioContext;
}

// 解锁音频（在用户交互时调用）
function unlockAudioContext() {
    if (audioContextUnlocked) return;
    
    try {
        var ctx = getAudioContext();
        if (!ctx) return;
        
        if (ctx.state === 'suspended') {
            ctx.resume().then(function() {
                audioContextUnlocked = true;
                console.log('🔊 音频上下文已解锁 (state:', ctx.state, ')');
            }).catch(function(e) {
                console.log('⚠️ 音频解锁失败:', e.message);
            });
        } else if (ctx.state === 'running') {
            audioContextUnlocked = true;
            console.log('🔊 音频上下文已运行');
        }
    } catch (e) {
        console.log('⚠️ 音频解锁异常:', e.message);
    }
}

// 用户交互时解锁（一次性，多个事件触发）
function setupAudioUnlock() {
    var events = ['click', 'touchstart', 'keydown', 'mousemove', 'scroll'];
    var unlockHandler = function() {
        unlockAudioContext();
        // 移除所有监听，只执行一次
        events.forEach(function(evt) {
            document.removeEventListener(evt, unlockHandler);
        });
        console.log('🔊 音频解锁事件已触发并移除');
    };
    
    events.forEach(function(evt) {
        document.addEventListener(evt, unlockHandler, { once: true, passive: true });
    });
    
    // 额外：如果 3 秒后还没有解锁，尝试强制解锁
    setTimeout(function() {
        if (!audioContextUnlocked) {
            try {
                var ctx = getAudioContext();
                if (ctx && ctx.state === 'suspended') {
                    ctx.resume().catch(function() {});
                }
            } catch (e) {}
        }
    }, 3000);
}

// 🎯 核心播放函数
function playNotificationSound(type) {
    try {
        var url = NOTIFICATION_SOUNDS[type];
        if (!url) {
            console.log('⚠️ 没有找到通知声音:', type);
            return;
        }

        // 1. 尝试解锁音频
        unlockAudioContext();

        // 2. 从缓存获取 audio
        var audio = audioCache[type];
        
        // 3. 如果缓存不存在或已损坏，重新创建
        if (!audio) {
            audio = new Audio(url);
            audio.preload = 'auto';
            audioCache[type] = audio;
        }

        // 4. 重置到开头
        audio.currentTime = 0;
        
        // 5. 设置音量
        audio.volume = 0.9;

        // 6. 尝试播放
        var playPromise = audio.play();
        
        if (playPromise !== undefined) {
            playPromise.then(function() {
                console.log('🔊 声音播放成功:', type);
            }).catch(function(error) {
                console.log('🔇 播放失败:', error.message);
                
                // 降级方案：创建新的 Audio 元素
                try {
                    var fallbackAudio = new Audio(url);
                    fallbackAudio.volume = 0.9;
                    fallbackAudio.play().then(function() {
                        console.log('🔊 降级播放成功:', type);
                    }).catch(function(e) {
                        console.log('🔇 降级播放也失败:', e.message);
                    });
                } catch (e2) {
                    console.log('⚠️ 降级播放异常:', e2.message);
                }
            });
        }
    } catch (e) {
        console.log('⚠️ 播放声音异常:', e.message);
    }
}

// 🔥 强制播放（用于测试，在控制台输入 playNotificationSound('kyc')）
window.playNotificationSound = playNotificationSound;

// 隐藏音频激活器（强制唤醒 AudioContext）
function addHiddenAudioActivator() {
    try {
        // 创建一个不可见的音频元素
        var activator = document.createElement('div');
        activator.id = 'audioActivator';
        activator.style.cssText = 'position:fixed;bottom:0;left:0;width:1px;height:1px;opacity:0;pointer-events:none;z-index:999999;';
        activator.setAttribute('aria-hidden', 'true');
        document.body.appendChild(activator);
        
        // 使用无声振荡器激活 AudioContext
        setTimeout(function() {
            try {
                var ctx = getAudioContext();
                if (ctx && ctx.state === 'suspended') {
                    // 创建无声振荡器（0.001 秒，几乎听不到）
                    var oscillator = ctx.createOscillator();
                    var gain = ctx.createGain();
                    gain.gain.value = 0.001;
                    oscillator.connect(gain);
                    gain.connect(ctx.destination);
                    oscillator.start(0);
                    oscillator.stop(0.001);
                    ctx.resume().then(function() {
                        audioContextUnlocked = true;
                        console.log('🔊 音频通过无声振荡器激活');
                    }).catch(function() {
                        console.log('⚠️ 无声振荡器激活失败');
                    });
                }
            } catch (e) {
                // 静默处理
            }
        }, 1000);
    } catch (e) {
        console.log('⚠️ 添加音频激活器失败:', e.message);
    }
}

// 页面加载时预加载所有声音
function initSoundSystem() {
    console.log('🔊 初始化声音系统...');
    preloadAllSounds();
    setupAudioUnlock();
    addHiddenAudioActivator();  // 👈 添加这一行
    
    // 如果页面已经加载完成，尝试立即解锁
    if (document.readyState === 'complete') {
        setTimeout(unlockAudioContext, 500);
    }
}

// 页面加载时初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSoundSystem);
} else {
    initSoundSystem();
}

// 页面可见时重新尝试解锁
document.addEventListener('visibilitychange', function() {
    if (document.visibilityState === 'visible') {
        setTimeout(unlockAudioContext, 300);
    }
});

// ============================================================
// 通知数据
// ============================================================
var notificationCounts = {
    dashboard: 0,
    kyc: 0,
    email: 0,
    withdrawal: 0,
    invitation: 0,
    users: 0,
    trial: 0,
    vip: 0,
    setorders: 0,
    orders: 0,
    orderpool: 0,
    animated: 0,
    signin: 0,
    content: 0
};

var readNotifications = {
    dashboard: false,
    kyc: false,
    email: false,
    withdrawal: false,
    invitation: false,
    users: false,
    trial: false,
    vip: false,
    setorders: false,
    orders: false,
    orderpool: false,
    animated: false,
    signin: false,
    content: false
};

var currentActivePage = 'dashboard';

// ============================================================
// 🔥 全局 Tab 标签栏状态
// ============================================================
var tabs = [];
var activeTabId = null;
var tabIdCounter = 0;

var PAGE_DEFS = {
    dashboard: { id: 'dashboard', label: 'Dashboard', icon: 'fa-chart-pie', pageId: 'dashboard' },
    users: { id: 'users', label: 'Users', icon: 'fa-users', pageId: 'users' },
    invitation: { id: 'invitation', label: 'Invitation Codes', icon: 'fa-qrcode', pageId: 'invitation' },
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
    content: { id: 'content', label: 'Content', icon: 'fa-file-alt', pageId: 'content' },
    notification: { id: 'notification', label: 'Notification', icon: 'fa-bell', pageId: 'notification' }
};

// ============================================================
// 🔥 全局通知数组
// ============================================================
if (typeof window.notifications === 'undefined') {
    window.notifications = [];
}

var notifiedIds = new Set();

function loadNotifications() {
    try {
        var saved = localStorage.getItem('admin_notifications');
        if (saved) {
            var parsed = JSON.parse(saved);
            if (Array.isArray(parsed) && parsed.length > 0) {
                window.notifications = parsed;
                notifiedIds = new Set();
                parsed.forEach(function(n) {
                    notifiedIds.add(n.id);
                });
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
    
    if (notifiedIds.has(notification.id)) {
        console.log('⏭️ 通知已存在，跳过:', notification.id);
        return;
    }
    
    var similarExists = window.notifications.some(function(n) {
        if (n.type !== notification.type) return false;
        if (notification.type === 'kyc' && n.data && notification.data) {
            return n.data.uid === notification.data.uid;
        }
        if (notification.type === 'withdrawal' && n.data && notification.data) {
            return n.data.uid === notification.data.uid && n.data.amount === notification.data.amount;
        }
        if (notification.type === 'email' && n.data && notification.data) {
            return n.data.email === notification.data.email;
        }
        if (notification.type === 'ip' && n.data && notification.data) {
            return n.data.ip === notification.data.ip;
        }
        if (notification.type === 'ip_withdrawal' && n.data && notification.data) {
            return n.data.ip === notification.data.ip;
        }
        return false;
    });
    
    if (similarExists) {
        console.log('⏭️ 相似通知已存在，跳过:', notification.id);
        return;
    }
    
    window.notifications.unshift(notification);
    notifiedIds.add(notification.id);
    
    if (window.notifications.length > 500) {
        window.notifications = window.notifications.slice(0, 500);
    }
    saveNotifications();
    
    if (notification.type && NOTIFICATION_SOUNDS[notification.type]) {
        playNotificationSound(notification.type);
        console.log('🔊 播放通知声音:', notification.type);
    }
    
    loadNotificationCounts();
    
    if (typeof updateNotificationUI === 'function') {
        updateNotificationUI();
    }
    updateSidebarBadges();
    updateGlobalNotificationBadge();
}

loadNotifications();

function updateNotificationUI() {
    var badge = document.getElementById('notificationBadge');
    var countEl = document.getElementById('notificationCount');
    var listEl = document.getElementById('notificationList');

    if (badge && countEl && listEl) {
        updateSingleNotificationList(listEl, badge, countEl);
    }

    var globalBadge = document.getElementById('globalNotificationBadge');
    var globalCountEl = document.getElementById('globalNotificationCount');
    var globalListEl = document.getElementById('globalNotificationList');

    if (!globalListEl) {
        var dropdown = document.getElementById('globalNotificationDropdown');
        if (dropdown) {
            var existingList = dropdown.querySelector('#globalNotificationList');
            if (!existingList) {
                var listContainer = dropdown.querySelector('#notificationList') || dropdown.querySelector('div[id*="notificationList"]');
                if (listContainer) {
                    listContainer.id = 'globalNotificationList';
                    globalListEl = listContainer;
                } else {
                    var contentDiv = dropdown.querySelector('div[style*="max-height: 350px"]');
                    if (contentDiv) {
                        contentDiv.id = 'globalNotificationList';
                        globalListEl = contentDiv;
                    }
                }
            } else {
                globalListEl = existingList;
            }
        }
    }

    if (globalBadge && globalCountEl && globalListEl) {
        updateSingleNotificationList(globalListEl, globalBadge, globalCountEl);
    } else {
        setTimeout(function() {
            updateNotificationUI();
        }, 300);
    }

    updateSidebarBadges();
}

function updateSingleNotificationList(listEl, badgeEl, countEl) {
    if (typeof window.notifications === 'undefined') {
        loadNotifications();
    }

    var unreadCount = 0;
    for (var i = 0; i < window.notifications.length; i++) {
        if (!window.notifications[i].read) unreadCount++;
    }

    if (unreadCount > 0) {
        badgeEl.style.display = 'flex';
        badgeEl.textContent = unreadCount > 99 ? '99+' : unreadCount;
    } else {
        badgeEl.style.display = 'none';
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

    var renderedIds = new Set();
    var html = '';
    
    for (var j = 0; j < window.notifications.length; j++) {
        var notif = window.notifications[j];
        
        if (renderedIds.has(notif.id)) continue;
        renderedIds.add(notif.id);
        
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

function updateGlobalNotificationBadge() {
    var badge = document.getElementById('globalNotificationBadge');
    if (!badge) return;
    
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
}

window.markAllNotificationsRead = function() {
    if (!window.notifications || window.notifications.length === 0) {
        showToast('No notifications to mark', 'info');
        return;
    }
    
    var markedCount = 0;
    for (var i = 0; i < window.notifications.length; i++) {
        if (!window.notifications[i].read) {
            window.notifications[i].read = true;
            markedCount++;
        }
    }
    
    saveNotifications();
    updateNotificationUI();
    updateSidebarBadges();
    updateGlobalNotificationBadge();
    
    if (markedCount > 0) {
        showToast('✅ ' + markedCount + ' notifications marked as read', 'success');
    } else {
        showToast('All notifications already read', 'info');
    }
};

function toggleNotificationDropdown() {
    var dropdown = document.getElementById('globalNotificationDropdown');
    if (!dropdown) return;
    
    if (dropdown.style.display === 'block') {
        dropdown.style.display = 'none';
        isNotificationDropdownOpen = false;
    } else {
        dropdown.style.display = 'block';
        isNotificationDropdownOpen = true;
        if (typeof updateNotificationUI === 'function') {
            updateNotificationUI();
        }
    }
}

function closeNotificationDropdown() {
    var dropdown = document.getElementById('globalNotificationDropdown');
    if (dropdown) {
        dropdown.style.display = 'none';
        isNotificationDropdownOpen = false;
    }
}

document.addEventListener('click', function(e) {
    var container = document.getElementById('globalNotificationContainer');
    if (container && !container.contains(e.target)) {
        closeNotificationDropdown();
    }
});

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
    updateGlobalNotificationBadge();
};

window.clearAllNotifications = function() {
    window.notifications = [];
    notifiedIds = new Set();
    saveNotifications();
    updateNotificationUI();
    updateSidebarBadges();
    updateGlobalNotificationBadge();
    closeNotificationDropdown();
    if (typeof showToast === 'function') {
        showToast('All notifications cleared', 'success');
    }
};

function getModuleNotificationCount(pageId) {
    var countKeyMap = {
        'emailverify': 'email',
        'withdrawals': 'withdrawal',
        'invitation': 'invitation',
        'kyc': 'kyc',
        'dashboard': 'dashboard',
        'users': 'users',
        'trial': 'trial',
        'vip': 'vip',
        'setorders': 'setorders',
        'orders': 'orders',
        'orderpool': 'orderpool',
        'animated': 'animated',
        'signin': 'signin',
        'content': 'content'
    };
    
    var key = countKeyMap[pageId] || pageId;
    return notificationCounts[key] || 0;
}

function isModuleRead(pageId) {
    var readKeyMap = {
        'emailverify': 'email',
        'withdrawals': 'withdrawal',
        'invitation': 'invitation',
        'kyc': 'kyc',
        'dashboard': 'dashboard',
        'users': 'users',
        'trial': 'trial',
        'vip': 'vip',
        'setorders': 'setorders',
        'orders': 'orders',
        'orderpool': 'orderpool',
        'animated': 'animated',
        'signin': 'signin',
        'content': 'content'
    };
    
    var key = readKeyMap[pageId] || pageId;
    return readNotifications[key] !== false;
}

function markModuleRead(pageId) {
    var readKeyMap = {
        'emailverify': 'email',
        'withdrawals': 'withdrawal',
        'invitation': 'invitation',
        'kyc': 'kyc',
        'dashboard': 'dashboard',
        'users': 'users',
        'trial': 'trial',
        'vip': 'vip',
        'setorders': 'setorders',
        'orders': 'orders',
        'orderpool': 'orderpool',
        'animated': 'animated',
        'signin': 'signin',
        'content': 'content'
    };
    
    var key = readKeyMap[pageId] || pageId;
    readNotifications[key] = true;
}

function renderSidebarNav() {
    var navList = document.querySelector('.nav-list');
    if (!navList) return;

    navList.innerHTML = '';

    var navItems = [
        { id: 'dashboard', icon: 'fa-chart-pie', label: 'Dashboard' },
        { id: 'users', icon: 'fa-users', label: 'Users Management' },
        { id: 'invitation', icon: 'fa-qrcode', label: 'Invitation Codes' },
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
        { id: 'content', icon: 'fa-file-alt', label: 'Content Management' },
        { id: 'notification', icon: 'fa-bell', label: 'User Notification' }
    ];

    navItems.forEach(function(item) {
        var div = document.createElement('div');
        div.className = 'nav-item';
        div.setAttribute('data-page', item.id);

        var isActive = currentActivePage === item.id;
        var count = getModuleNotificationCount(item.id);
        var isRead = isModuleRead(item.id);
        var hasUnread = count > 0 && !isRead;

        if (isActive) div.classList.add('active');
        if (hasUnread) div.classList.add('has-notification');

        div.innerHTML = `
            <i class="fas ${item.icon}"></i>
            <span class="nav-label">${item.label}</span>
            ${hasUnread ? '<span class="badge-notify" id="badge-' + item.id + '">' + count + '</span>' : ''}
        `;

        div.addEventListener('click', function(e) {
            e.stopPropagation();
            var pageId = this.dataset.page;

            markModuleRead(pageId);
            
            var badge = this.querySelector('.badge-notify');
            if (badge) badge.remove();
            this.classList.remove('has-notification');

            document.querySelectorAll('.nav-item').forEach(function(n) { n.classList.remove('active'); });
            this.classList.add('active');
            currentActivePage = pageId;

            openTab(pageId);
        });

        navList.appendChild(div);
    });
}

function updateSidebarBadges() {
    renderSidebarNav();
    document.querySelectorAll('.nav-item').forEach(function(el) {
        if (el.dataset.page === currentActivePage) {
            el.classList.add('active');
        }
    });
    renderTabBar();
}

function updateNotificationCount(moduleId, count) {
    notificationCounts[moduleId] = count;
    readNotifications[moduleId] = false;
    updateSidebarBadges();
    updateGlobalNotificationBadge();

    if (count > 0) {
        var moduleNames = {
            dashboard: 'Dashboard',
            kyc: 'KYC Verification',
            email: 'Email Verification',
            withdrawal: 'Withdrawal',
            invitation: 'Invitation Codes'
        };
        if (typeof showAmberNotification === 'function') {
            showAmberNotification(
                '📬 新通知 (' + (moduleNames[moduleId] || moduleId) + ')',
                '您有 ' + count + ' 条待处理通知',
                'info'
            );
        }
    }
}

async function loadNotificationCounts() {
    try {
        var kycRes = await sb.from('kyc_verifications').select('id', { count: 'exact', head: true }).eq('status', 'pending');
        var kycCount = kycRes.count || 0;

        var withdrawalRes = await sb.from('withdrawals').select('id', { count: 'exact', head: true }).eq('status', 'pending');
        var withdrawalCount = withdrawalRes.count || 0;

        var emailRes = await sb.from('email_verification_requests').select('id', { count: 'exact', head: true }).eq('is_verified', false).is('code', null);
        var emailCount = emailRes.count || 0;

        var ipNotifications = window.notifications?.filter(function(n) {
            return n.type === 'ip' || n.type === 'ip_withdrawal';
        }) || [];
        var ipCount = ipNotifications.filter(function(n) {
            return !n.read;
        }).length;

        var dashboardCount = kycCount + withdrawalCount + emailCount + ipCount;

        notificationCounts.dashboard = dashboardCount;
        notificationCounts.kyc = kycCount;
        notificationCounts.email = emailCount;
        notificationCounts.withdrawal = withdrawalCount;

        console.log('📊 通知数量已更新:', notificationCounts);

        updateSidebarBadges();
        updateGlobalNotificationBadge();
        renderTabBar();

    } catch (e) {
        console.error('加载通知数量失败:', e);
    }
}

// ============================================================
// 工具函数
// ============================================================
var currentDays = 1;

function toggleSidebar() { document.getElementById('sidebar')?.classList.toggle('open'); }
window.toggleSidebar = toggleSidebar;

function escapeHtml(str) { if(!str) return ''; return str.replace(/[&<>]/g, function(m) { return m === '&' ? '&amp;' : m === '<' ? '&lt;' : m === '>' ? '&gt;' : m; }); }

function formatTime(dateStr) {
    if (!dateStr) return '刚刚';
    var date = new Date(dateStr);
    var now = new Date();
    var diff = Math.floor((now - date) / 1000 / 60);
    if (diff < 1) return '刚刚';
    if (diff < 60) return diff + '分钟前';
    if (diff < 1440) return Math.floor(diff / 60) + '小时前';
    return Math.floor(diff / 1440) + '天前';
}

function animateNumber(element, target, prefix, suffix) {
    if (!element) return;
    prefix = prefix || '';
    suffix = suffix || '';
    var current = 0;
    var duration = 1500;
    var step = target / (duration / 16);
    var timer = setInterval(function() {
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
    var percent = ((current - previous) / previous * 100).toFixed(1);
    if (percent > 0) return '<span class="trend-up">↑ +' + percent + '%</span>';
    if (percent < 0) return '<span class="trend-down">↓ ' + percent + '%</span>';
    return '<span>→ 0%</span>';
}

// ========== Toast 提示 ==========
function showToast(message, type) {
    type = type || 'success';
    var existingToast = document.querySelector('.custom-toast');
    if (existingToast) existingToast.remove();
    
    var toast = document.createElement('div');
    toast.className = 'custom-toast custom-toast-' + type;
    
    var icon = 'fa-check-circle';
    var bgColor = '#ffb84d';
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
    setTimeout(function() { toast.style.transform = 'translateX(-50%) translateY(0)'; toast.style.opacity = '1'; }, 10);
    setTimeout(function() {
        toast.style.transform = 'translateX(-50%) translateY(100px)';
        toast.style.opacity = '0';
        setTimeout(function() { toast.remove(); }, 300);
    }, 3000);
}

// ========== 确认弹窗 ==========
function showConfirm(title, message, onConfirm, onCancel) {
    var existingModal = document.querySelector('.custom-confirm');
    if (existingModal) existingModal.remove();
    
    var modal = document.createElement('div');
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
    setTimeout(function() {
        modal.style.visibility = 'visible';
        modal.style.opacity = '1';
        modal.querySelector('div:last-child').style.transform = 'scale(1)';
    }, 10);
    
    modal.querySelector('#confirm-cancel').onclick = function() {
        modal.style.visibility = 'hidden';
        modal.style.opacity = '0';
        setTimeout(function() { modal.remove(); }, 300);
        if (onCancel) onCancel();
    };
    
    modal.querySelector('#confirm-ok').onclick = function() {
        modal.style.visibility = 'hidden';
        modal.style.opacity = '0';
        setTimeout(function() { modal.remove(); }, 300);
        if (onConfirm) onConfirm();
    };
    
    modal.querySelector('div:first-child').onclick = function() {
        modal.style.visibility = 'hidden';
        modal.style.opacity = '0';
        setTimeout(function() { modal.remove(); }, 300);
        if (onCancel) onCancel();
    };
}

// ========== 输入弹窗 ==========
function showPrompt(title, placeholder, callback) {
    var existingModal = document.querySelector('.custom-prompt');
    if (existingModal) existingModal.remove();
    
    var modal = document.createElement('div');
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
    setTimeout(function() {
        modal.style.visibility = 'visible';
        modal.style.opacity = '1';
        modal.querySelector('div:last-child').style.transform = 'scale(1)';
        var input = document.getElementById('prompt-input');
        input.focus();
    }, 10);
    
    modal.querySelector('#prompt-cancel').onclick = function() {
        modal.style.visibility = 'hidden';
        modal.style.opacity = '0';
        setTimeout(function() { modal.remove(); }, 300);
        if (callback) callback(null);
    };
    
    modal.querySelector('#prompt-ok').onclick = function() {
        var value = document.getElementById('prompt-input').value.trim();
        modal.style.visibility = 'hidden';
        modal.style.opacity = '0';
        setTimeout(function() { modal.remove(); }, 300);
        if (callback) callback(value);
    };
    
    modal.querySelector('div:first-child').onclick = function() {
        modal.style.visibility = 'hidden';
        modal.style.opacity = '0';
        setTimeout(function() { modal.remove(); }, 300);
        if (callback) callback(null);
    };
    
    document.getElementById('prompt-input').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            modal.querySelector('#prompt-ok').click();
        }
    });
}

window.originalAlert = window.alert;
window.alert = function(message) {
    showToast(message, 'info');
};

// ========== 琥珀金风格通知 ==========
window.showAmberNotification = function(title, message, type) {
    console.log('🔔 显示琥珀通知:', { title: title, message: message, type: type });
    
    var existingNotification = document.querySelector('.notification-amber');
    if (existingNotification) existingNotification.remove();
    
    var icon = 'fa-info-circle';
    var iconColor = '#ffb84d';
    
    if (type === 'withdrawal') {
        icon = 'fa-money-bill-wave';
    } else if (type === 'kyc') {
        icon = 'fa-id-card';
    } else if (type === 'email') {
        icon = 'fa-envelope';
    }
    
    var notification = document.createElement('div');
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
    
    var closeBtn = notification.querySelector('.notification-close');
    if (closeBtn) {
        closeBtn.onclick = function(e) {
            e.stopPropagation();
            notification.style.animation = 'slideOutRight 0.3s ease forwards';
            setTimeout(function() { notification.remove(); }, 300);
        };
    }
    
    notification.onclick = function(e) {
        if (e.target !== closeBtn && !closeBtn?.contains(e.target)) {
            notification.style.animation = 'slideOutRight 0.3s ease forwards';
            setTimeout(function() { notification.remove(); }, 300);
        }
    };
    
    setTimeout(function() {
        if (notification.parentNode) {
            notification.style.animation = 'slideOutRight 0.3s ease forwards';
            setTimeout(function() { notification.remove(); }, 300);
        }
    }, 5000);
};

// ============================================================
// 🔔 显示音频激活提示（每台设备只需点击一次）
// ============================================================
function showAudioActivationHint() {
    var adminName = localStorage.getItem('admin_username') || 'admin';
    var key = 'audio_activated_' + adminName;
    if (localStorage.getItem(key) === 'true') return;
    
    // 检查是否已经在页面上
    if (document.getElementById('audioHint')) return;
    
    var hint = document.createElement('div');
    hint.id = 'audioHint';
    hint.style.cssText = `
        position: fixed;
        bottom: 80px;
        right: 20px;
        z-index: 999999;
        background: rgba(20, 24, 40, 0.95);
        backdrop-filter: blur(12px);
        border: 1px solid rgba(201, 176, 149, 0.3);
        border-radius: 16px;
        padding: 16px 20px;
        max-width: 280px;
        font-family: 'Inter', sans-serif;
        box-shadow: 0 8px 32px rgba(0,0,0,0.5);
        animation: slideInRight 0.4s ease;
        cursor: pointer;
        transition: opacity 0.5s ease;
    `;
    hint.innerHTML = `
        <div style="display: flex; align-items: center; gap: 12px;">
            <span style="font-size: 28px;">🔊</span>
            <div>
                <div style="color: #d8e0f0; font-size: 13px; font-weight: 600;">Enable Sound</div>
                <div style="color: #6a7a92; font-size: 11px;">Click to enable notification sound</div>
            </div>
        </div>
    `;
    
    hint.onclick = function() {
        unlockAudioContext();
        playNotificationSound('kyc');
        localStorage.setItem(key, 'true');
        this.style.opacity = '0';
        setTimeout(function() {
            if (hint.parentNode) hint.remove();
        }, 400);
    };
    
    document.body.appendChild(hint);
    
    // 5秒后淡出但保留在页面上
    setTimeout(function() {
        if (document.getElementById('audioHint')) {
            hint.style.opacity = '0.5';
        }
    }, 5000);
}

function ensureAnimationStyles() {
    if (document.getElementById('notification-animation-styles')) return;
    
    var style = document.createElement('style');
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
// 🔥 通知处理函数（带声音播放）
// ============================================================
function handleNewKyc(data) {
    console.log('📋 处理新KYC申请:', data);
    
    playNotificationSound('kyc');
    
    if (window.refreshDashboardData) {
        window.refreshDashboardData(currentDays);
    }
    if (window.loadKycPage && document.getElementById('page_kyc')?.classList.contains('active')) {
        window.loadKycPage();
    }
    
    var notification = {
        id: 'kyc_' + data.id + '_' + Date.now(),
        type: 'kyc',
        title: '🪪 New KYC Application',
        message: 'User ' + (data.username || data.uid) + ' submitted KYC verification',
        timestamp: new Date().toISOString(),
        read: false,
        data: data
    };
    addNotification(notification);
    
    loadNotificationCounts();
    
    if (window.showAmberNotification) {
        window.showAmberNotification(
            '📋 新KYC申请',
            '用户 ' + (data.username || data.uid) + ' 提交了身份验证申请',
            'kyc'
        );
    }
}

function handleNewWithdrawal(data) {
    console.log('💰 处理新提现申请:', data);
    
    playNotificationSound('withdrawal');
    
    if (window.refreshDashboardData) {
        window.refreshDashboardData(currentDays);
    }
    if (window.loadWithdrawalsPage && document.getElementById('page_withdrawals')?.classList.contains('active')) {
        window.loadWithdrawalsPage();
    }
    
    var notification = {
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
            '用户 ' + data.username + ' 申请提现 €' + data.amount,
            'withdrawal'
        );
    }
}

function handleNewEmailRequest(data) {
    console.log('📧 处理新邮箱验证请求:', data.email);
    
    playNotificationSound('email');
    
    if (window.refreshDashboardData) {
        window.refreshDashboardData(currentDays);
    }
    var emailPage = document.getElementById('page_emailverify');
    if (emailPage && emailPage.classList.contains('active')) {
        if (window.loadEmailVerifyPage) {
            window.loadEmailVerifyPage();
        }
    }
    
    var notification = {
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
            '用户 ' + data.email + ' 请求邮箱验证，请设置验证码',
            'email'
        );
    }
}

// ============================================================
// 🔥 全局实时订阅
// ============================================================
var realtimeChannel = null;
var pollingInterval = null;
var lastNotified = {
    kyc: null,
    withdrawal: null,
    email: null
};
var realtimeConnected = false;

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
            // ✅ 已有：KYC 新申请
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'kyc_verifications' },
                function(payload) {
                    console.log('🔔 [Realtime] 检测到新KYC申请:', payload.new);
                    realtimeConnected = true;
                    handleNewKyc(payload.new);
                }
            )
            // ✅ 已有：Withdrawal 新申请
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'withdrawals' },
                function(payload) {
                    console.log('🔔 [Realtime] 检测到新提现申请:', payload.new);
                    realtimeConnected = true;
                    handleNewWithdrawal(payload.new);
                }
            )
            // ✅ 已有：Email 新请求
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'email_verification_requests' },
                function(payload) {
                    console.log('🔔 [Realtime] 检测到新邮箱验证请求:', payload.new);
                    realtimeConnected = true;
                    handleNewEmailRequest(payload.new);
                }
            )
            // 🔥 新增：新用户注册
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'users' },
                function(payload) {
                    console.log('👤 [Realtime] 检测到新用户注册:', payload.new);
                    realtimeConnected = true;
                    handleNewUser(payload.new);
                }
            )
            // 🔥 新增：新存款
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'deposits' },
                function(payload) {
                    console.log('💳 [Realtime] 检测到新存款:', payload.new);
                    realtimeConnected = true;
                    handleNewDeposit(payload.new);
                }
            )
            // 🔥 新增：提款状态变更
            .on(
                'postgres_changes',
                { event: 'UPDATE', schema: 'public', table: 'withdrawals' },
                function(payload) {
                    console.log('📊 [Realtime] 检测到提款状态变更:', payload.new);
                    realtimeConnected = true;
                    handleWithdrawalUpdate(payload.new);
                }
            )
            .subscribe(function(status) {
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
        var kycs = await sb
            .from('kyc_verifications')
            .select('*')
            .eq('status', 'pending')
            .order('uploaded_at', { ascending: false })
            .limit(1);
        
        if (kycs.data && kycs.data.length > 0 && kycs.data[0].id !== lastNotified.kyc) {
            console.log('🔔 [轮询] 检测到新KYC申请:', kycs.data[0].id);
            lastNotified.kyc = kycs.data[0].id;
            handleNewKyc(kycs.data[0]);
        }
        
        var withdrawals = await sb
            .from('withdrawals')
            .select('*')
            .eq('status', 'pending')
            .order('request_date', { ascending: false })
            .limit(1);
        
        if (withdrawals.data && withdrawals.data.length > 0 && withdrawals.data[0].id !== lastNotified.withdrawal) {
            console.log('🔔 [轮询] 检测到新提现申请:', withdrawals.data[0].id);
            lastNotified.withdrawal = withdrawals.data[0].id;
            handleNewWithdrawal(withdrawals.data[0]);
        }
        
        var emails = await sb
            .from('email_verification_requests')
            .select('*')
            .is('code', null)
            .eq('is_verified', false)
            .order('requested_at', { ascending: false })
            .limit(1);
        
        if (emails.data && emails.data.length > 0 && emails.data[0].id !== lastNotified.email) {
            console.log('🔔 [轮询] 检测到新邮箱验证请求:', emails.data[0].id);
            lastNotified.email = emails.data[0].id;
            handleNewEmailRequest(emails.data[0]);
        }
        
        loadNotificationCounts();
        
    } catch (e) {
        // 静默失败
    }
}

function showPage(pageId) {
    console.log('切换页面:', pageId);
    
    // 隐藏所有页面
    document.querySelectorAll('.page').forEach(function(p) {
        p.classList.remove('active');
    });
    
    // 显示目标页面
    var targetPage = document.getElementById('page_' + pageId);
    if (targetPage) targetPage.classList.add('active');
    
    // 侧边栏高亮
    document.querySelectorAll('.nav-item').forEach(function(n) {
        n.classList.remove('active');
    });
    var activeNav = document.querySelector('.nav-item[data-page="' + pageId + '"]');
    if (activeNav) activeNav.classList.add('active');
    
    // 加载对应页面内容
    if (pageId === 'dashboard' && window.loadDashboardPage) {
        window.loadDashboardPage(currentDays);
    } else if (pageId === 'users' && window.loadUsersPage) {
        window.loadUsersPage();
    } else if (pageId === 'invitation' && window.loadInvitationPage) {
        window.loadInvitationPage();
    } else if (pageId === 'kyc' && window.loadKycPage) {
        window.loadKycPage();
    } else if (pageId === 'emailverify' && window.loadEmailVerifyPage) {
        window.loadEmailVerifyPage();
    } else if (pageId === 'trial' && window.loadTrialPage) {
        window.loadTrialPage();
    } else if (pageId === 'withdrawals' && window.loadWithdrawalsPage) {
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
    } else if (pageId === 'notification' && window.loadNotificationPage) {
        window.loadNotificationPage();
    }
}

// ============================================================
// 🔥 初始化
// ============================================================
document.addEventListener('DOMContentLoaded', function() {
    renderSidebarNav();
    initTabBar();
    
    document.querySelectorAll('.nav-item').forEach(function(el) {
        if (el.dataset.page === currentActivePage) {
            el.classList.add('active');
        }
    });
    
    loadNotificationCounts();
    
    // ===== 🔥 添加：显示音频激活提示 =====
    setTimeout(function() {
        showAudioActivationHint();
    }, 3000);
    
    setTimeout(function() {
        loadNotifications();
        if (typeof updateNotificationUI === 'function') {
            updateNotificationUI();
        }
        updateGlobalNotificationBadge();
        console.log('🔔 通知 UI 已刷新，当前:', window.notifications.length, '条');
    }, 500);
});

setTimeout(function() {
    initGlobalRealtime();
}, 2000);

if (localStorage.getItem('admin_logged_in') !== 'true') {
    window.location.href = 'admin-login.html';
}

// ============================================================
// 🔥 Tab 排序持久化函数
// ============================================================

function loadTabOrderFromStorage() {
    try {
        var saved = localStorage.getItem('admin_tab_order');
        if (saved) {
            var order = JSON.parse(saved);
            if (Array.isArray(order) && order.length > 0) {
                var validOrder = order.filter(function(pageId) {
                    return PAGE_DEFS[pageId] !== undefined;
                });
                if (validOrder.length > 0) {
                    console.log('📂 从 localStorage 加载 Tab 顺序:', validOrder);
                    return validOrder;
                }
            }
        }
    } catch (e) {
        console.warn('加载 Tab 顺序失败:', e);
    }
    return null;
}

function saveTabOrder() {
    try {
        var tabOrder = tabs.map(function(tab) { return tab.pageId; });
        localStorage.setItem('admin_tab_order', JSON.stringify(tabOrder));
        console.log('💾 Tab order saved:', tabOrder);
    } catch (e) {
        console.warn('Failed to save tab order:', e);
    }
}

// ============================================================
// 🔥 Tab 拖拽排序核心逻辑
// ============================================================

var dragState = {
    isDragging: false,
    dragTabId: null,
    dragElement: null,
    dragPlaceholder: null,
    startX: 0,
    currentX: 0,
    originalIndex: -1,
    currentIndex: -1,
    ghostElement: null,
    tabsWrapper: null
};

function initDragSort() {
    var tabsWrapper = document.getElementById('tabsWrapper');
    if (!tabsWrapper) return;
    
    tabsWrapper.addEventListener('mousedown', onDragStart);
    tabsWrapper.addEventListener('touchstart', onDragStart, { passive: false });
    
    document.addEventListener('mousemove', onDragMove);
    document.addEventListener('touchmove', onDragMove, { passive: false });
    document.addEventListener('mouseup', onDragEnd);
    document.addEventListener('touchend', onDragEnd);
    document.addEventListener('touchcancel', onDragEnd);
}

function onDragStart(e) {
    var target = e.target.closest('.tab-item');
    if (!target) return;
    if (e.target.closest('.tab-close')) return;
    
    var tabId = parseInt(target.dataset.tabId);
    if (isNaN(tabId)) return;
    
    var tabIndex = tabs.findIndex(function(t) { return t.id === tabId; });
    if (tabIndex === -1) return;
    if (tabs.length <= 1) return;
    
    e.preventDefault();
    
    var clientX = e.clientX || (e.touches && e.touches[0].clientX) || 0;
    
    dragState.isDragging = true;
    dragState.dragTabId = tabId;
    dragState.dragElement = target;
    dragState.startX = clientX;
    dragState.currentX = clientX;
    dragState.originalIndex = tabIndex;
    dragState.currentIndex = tabIndex;
    dragState.tabsWrapper = document.getElementById('tabsWrapper');
    
    var placeholder = document.createElement('div');
    placeholder.className = 'tab-placeholder';
    placeholder.style.cssText = `
        display: inline-block;
        width: ${target.offsetWidth}px;
        height: ${target.offsetHeight}px;
        border-radius: 8px 8px 0 0;
        background: rgba(214, 178, 94, 0.06);
        border: 1px dashed rgba(214, 178, 94, 0.2);
        flex-shrink: 0;
        margin: 0 2px;
        transition: all 0.15s ease;
        pointer-events: none;
    `;
    dragState.dragPlaceholder = placeholder;
    
    var ghost = target.cloneNode(true);
    ghost.className = 'tab-item ghost';
    ghost.style.cssText = `
        position: fixed;
        pointer-events: none;
        z-index: 99999;
        opacity: 0.85;
        transform: scale(1.05) rotate(-1deg);
        background: rgba(20, 24, 40, 0.95);
        border: 1px solid rgba(214, 178, 94, 0.3);
        box-shadow: 0 12px 40px rgba(0,0,0,0.5), 0 0 30px rgba(214, 178, 94, 0.05);
        border-radius: 8px 8px 0 0;
        padding: 6px 14px;
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 12px;
        font-weight: 500;
        color: #F3D38B;
        white-space: nowrap;
        flex-shrink: 0;
        height: 42px;
        font-family: 'Inter', sans-serif;
        transition: none;
        width: auto;
    `;
    ghost.innerHTML = target.innerHTML;
    dragState.ghostElement = ghost;
    document.body.appendChild(ghost);
    
    updateGhostPosition(clientX);
    
    target.style.opacity = '0';
    target.style.transition = 'opacity 0.2s';
    target.parentNode.insertBefore(placeholder, target.nextSibling);
    
    dragState.tabsWrapper.style.cursor = 'grabbing';
    document.body.style.userSelect = 'none';
    
    console.log('🔄 开始拖拽 Tab:', tabId);
}

function onDragMove(e) {
    if (!dragState.isDragging) return;
    e.preventDefault();
    
    var clientX = e.clientX || (e.touches && e.touches[0].clientX) || 0;
    dragState.currentX = clientX;
    
    updateGhostPosition(clientX);
    
    var tabsWrapper = dragState.tabsWrapper;
    if (!tabsWrapper) return;
    
    var tabItems = Array.from(tabsWrapper.querySelectorAll('.tab-item:not(.ghost)'));
    var placeholder = dragState.dragPlaceholder;
    if (!placeholder) return;
    
    var placeholderIndex = Array.from(tabsWrapper.children).indexOf(placeholder);
    
    var wrapperRect = tabsWrapper.getBoundingClientRect();
    var mouseX = clientX - wrapperRect.left;
    
    var targetIndex = -1;
    for (var i = 0; i < tabItems.length; i++) {
        var item = tabItems[i];
        var itemRect = item.getBoundingClientRect();
        var itemCenter = itemRect.left + itemRect.width / 2 - wrapperRect.left;
        if (mouseX < itemCenter) {
            targetIndex = i;
            break;
        }
    }
    if (targetIndex === -1) {
        targetIndex = tabItems.length;
    }
    
    if (targetIndex !== placeholderIndex) {
        var parent = tabsWrapper;
        var children = Array.from(parent.children);
        var placeholderEl = placeholder;
        
        parent.removeChild(placeholderEl);
        
        var targetNode = null;
        var currentIdx = 0;
        for (var j = 0; j < children.length; j++) {
            var child = children[j];
            if (child === placeholderEl) continue;
            if (child.classList && child.classList.contains('ghost')) continue;
            if (child === dragState.dragElement) continue;
            
            if (currentIdx === targetIndex) {
                targetNode = child;
                break;
            }
            currentIdx++;
        }
        
        if (targetNode) {
            parent.insertBefore(placeholderEl, targetNode);
        } else {
            parent.appendChild(placeholderEl);
        }
        
        dragState.currentIndex = targetIndex;
    }
}

function onDragEnd(e) {
    if (!dragState.isDragging) return;
    
    var clientX = e.clientX || (e.changedTouches && e.changedTouches[0].clientX) || 0;
    
    if (dragState.ghostElement && dragState.ghostElement.parentNode) {
        dragState.ghostElement.parentNode.removeChild(dragState.ghostElement);
    }
    
    if (dragState.dragElement) {
        dragState.dragElement.style.opacity = '1';
        dragState.dragElement.style.transition = '';
    }
    
    if (dragState.dragPlaceholder && dragState.dragPlaceholder.parentNode) {
        dragState.dragPlaceholder.parentNode.removeChild(dragState.dragPlaceholder);
    }
    
    if (dragState.tabsWrapper) {
        dragState.tabsWrapper.style.cursor = '';
    }
    document.body.style.userSelect = '';
    
    var originalIndex = dragState.originalIndex;
    var newIndex = dragState.currentIndex;
    
    if (originalIndex !== -1 && newIndex !== -1 && originalIndex !== newIndex) {
        var tab = tabs.splice(originalIndex, 1)[0];
        var insertIndex = newIndex > originalIndex ? newIndex - 1 : newIndex;
        tabs.splice(insertIndex, 0, tab);
        
        saveTabOrder();
        
        console.log('📌 Tab 已移动:', originalIndex, '->', insertIndex);
        
        var activeTabIdBefore = activeTabId;
        renderTabBar();
        activeTabId = activeTabIdBefore;
        var activeTabEl = document.querySelector('.tab-item[data-tab-id="' + activeTabId + '"]');
        if (activeTabEl) {
            activeTabEl.classList.add('active');
        }
    }
    
    dragState.isDragging = false;
    dragState.dragTabId = null;
    dragState.dragElement = null;
    dragState.dragPlaceholder = null;
    dragState.ghostElement = null;
    dragState.tabsWrapper = null;
    dragState.originalIndex = -1;
    dragState.currentIndex = -1;
}

function updateGhostPosition(clientX) {
    if (!dragState.ghostElement) return;
    var ghost = dragState.ghostElement;
    var rect = ghost.getBoundingClientRect();
    var width = rect.width || 120;
    var offsetX = width / 2;
    ghost.style.left = (clientX - offsetX) + 'px';
    ghost.style.top = (window.scrollY + 10) + 'px';
}

// ============================================================
// 🔥 Tab Bar 渲染
// ============================================================

function renderTabBar() {
    var container = document.getElementById('tabBarContainer');
    if (!container) {
        initTabBar();
        return;
    }

    var rightWrapper = container.querySelector('#tabBarRightWrapper');
    if (!rightWrapper) {
        console.log('⚠️ 右侧容器丢失，重新初始化 Tab Bar');
        initTabBar();
        return;
    }

    var tabsWrapper = container.querySelector('#tabsWrapper');
    if (!tabsWrapper) {
        tabsWrapper = document.createElement('div');
        tabsWrapper.id = 'tabsWrapper';
        tabsWrapper.style.cssText = `
            display: flex;
            align-items: center;
            gap: 2px;
            flex: 1;
            overflow-x: auto;
            overflow-y: hidden;
            height: 100%;
            scrollbar-width: thin;
            min-width: 0;
        `;
        container.insertBefore(tabsWrapper, rightWrapper);
    }

    tabsWrapper.innerHTML = '';

    if (tabs.length === 0) {
        var empty = document.createElement('span');
        empty.className = 'empty-tab';
        empty.textContent = '点击侧边栏打开页面';
        empty.style.cssText = 'color:rgba(255,255,255,0.08);font-size:12px;padding:0 8px;';
        tabsWrapper.appendChild(empty);
        document.querySelectorAll('.page').forEach(function(p) { p.classList.remove('active'); });
        return;
    }

    tabs.forEach(function(tab) {
        var tabEl = document.createElement('button');
        tabEl.className = 'tab-item';
        tabEl.dataset.tabId = tab.id;
        tabEl.dataset.pageId = tab.pageId;
        tabEl.draggable = false;

        var isActive = tab.id === activeTabId;
        if (isActive) tabEl.classList.add('active');

        var count = getModuleNotificationCount(tab.pageId);
        var isRead = isModuleRead(tab.pageId);
        var hasUnread = count > 0 && !isRead;
        
        if (hasUnread) tabEl.classList.add('has-notification');

        var pageDef = PAGE_DEFS[tab.pageId];
        var icon = pageDef ? pageDef.icon : 'fa-file';

        tabEl.innerHTML = `
            <i class="fas ${icon}"></i>
            <span>${tab.label}</span>
            ${hasUnread ? '<span class="tab-badge">' + count + '</span>' : ''}
            <button class="tab-close" data-tab-id="${tab.id}" title="关闭标签">
                <i class="fas fa-times"></i>
            </button>
        `;

        tabEl.addEventListener('click', function(e) {
            if (e.target.closest('.tab-close')) return;
            
            var pageId = this.dataset.pageId;
            markModuleRead(pageId);
            
            var badge = this.querySelector('.tab-badge');
            if (badge) badge.remove();
            this.classList.remove('has-notification');
            
            switchTab(tab.id);
        });

        var closeBtn = tabEl.querySelector('.tab-close');
        closeBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            closeTab(tab.id);
        });

        tabsWrapper.appendChild(tabEl);
    });

    if (!container.dataset.dragInitialized) {
        container.dataset.dragInitialized = 'true';
        initDragSort();
        console.log('✅ Tab 拖拽排序已初始化');
    }

    updatePageVisibility();
}

function updatePageVisibility() {
    document.querySelectorAll('.page').forEach(function(p) { p.classList.remove('active'); });

    var activeTab = tabs.find(function(t) { return t.id === activeTabId; });
    if (activeTab) {
        var pageEl = document.getElementById('page_' + activeTab.pageId);
        if (pageEl) {
            pageEl.classList.add('active');
            loadPageContent(activeTab.pageId);
        }
    }
}

var loadedPages = {};

function loadPageContent(pageId) {
    if (loadedPages[pageId]) return;
    loadedPages[pageId] = true;

    var pageMap = {
        'dashboard': 'loadDashboardPage',
        'users': 'loadUsersPage',
        'invitation': 'loadInvitationPage',
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
        'content': 'loadContentPage',
        'notification': 'loadNotificationPage'
    };

    var fnName = pageMap[pageId];
    if (fnName && window[fnName]) {
        console.log('📄 加载页面:', pageId);
        if (pageId === 'dashboard') {
            window[fnName](currentDays || 1);
        } else {
            window[fnName]();
        }
    }
}

function openTab(pageId) {
    var existing = tabs.find(function(t) { return t.pageId === pageId; });
    if (existing) {
        switchTab(existing.id);
        return;
    }

    var pageDef = PAGE_DEFS[pageId];
    if (!pageDef) return;

    var newTab = {
        id: ++tabIdCounter,
        pageId: pageId,
        label: pageDef.label,
        notificationCount: notificationCounts[pageId] || 0
    };

    tabs.push(newTab);
    activeTabId = newTab.id;
    
    saveTabOrder();
    renderTabBar();

    var container = document.getElementById('tabBarContainer');
    var newTabEl = container.querySelector('.tab-item[data-tab-id="' + newTab.id + '"]');
    if (newTabEl) {
        newTabEl.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }
}

function switchTab(tabId) {
    var tab = tabs.find(function(t) { return t.id === tabId; });
    if (!tab) return;

    var pageId = tab.pageId;
    
    markModuleRead(pageId);

    if (activeTabId === tabId) return;
    activeTabId = tabId;
    renderTabBar();
}

function closeTab(tabId) {
    var index = tabs.findIndex(function(t) { return t.id === tabId; });
    if (index === -1) return;

    tabs.splice(index, 1);

    if (tabs.length === 0) {
        activeTabId = null;
    } else if (activeTabId === tabId) {
        var newIndex = Math.min(index, tabs.length - 1);
        activeTabId = tabs[newIndex].id;
    }
    
    saveTabOrder();
    renderTabBar();
}

// ============================================================
// 🔥 初始化 Tab Bar
// ============================================================

function initTabBar() {
    var existingContainer = document.getElementById('tabBarContainer');
    if (existingContainer) {
        existingContainer.remove();
        console.log('🔄 删除旧的 Tab Bar 容器，重新创建');
    }

    var main = document.querySelector('.main');
    if (!main) {
        setTimeout(initTabBar, 500);
        return;
    }

    // 🔥 先加载保存的 Tab 顺序
    var savedOrder = loadTabOrderFromStorage();
    
    // 重置 tabs
    tabs = [];
    tabIdCounter = 0;
    
    if (savedOrder && savedOrder.length > 0) {
        savedOrder.forEach(function(pageId) {
            var pageDef = PAGE_DEFS[pageId];
            if (pageDef) {
                tabs.push({
                    id: ++tabIdCounter,
                    pageId: pageId,
                    label: pageDef.label,
                    notificationCount: notificationCounts[pageId] || 0
                });
            }
        });
        var hasDashboard = tabs.some(function(t) { return t.pageId === 'dashboard'; });
        if (!hasDashboard) {
            tabs.unshift({
                id: ++tabIdCounter,
                pageId: 'dashboard',
                label: PAGE_DEFS.dashboard.label,
                notificationCount: notificationCounts.dashboard || 0
            });
        }
        activeTabId = tabs[0].id;
        console.log('📂 从保存的顺序恢复 Tabs:', tabs.map(function(t) { return t.pageId; }));
    } else {
        var defaultTab = {
            id: ++tabIdCounter,
            pageId: 'dashboard',
            label: PAGE_DEFS.dashboard.label,
            notificationCount: notificationCounts.dashboard || 0
        };
        tabs.push(defaultTab);
        activeTabId = defaultTab.id;
        console.log('📂 使用默认 Tabs');
    }

    // 创建容器
    var container = document.createElement('div');
    container.id = 'tabBarContainer';
    container.className = 'tab-bar-container';
    container.style.cssText = `
        display: flex !important;
        align-items: center !important;
        background: rgba(12, 16, 28, 0.92) !important;
        border-bottom: 1px solid rgba(214, 178, 94, 0.08) !important;
        padding: 0 16px !important;
        height: 50px !important;
        overflow-x: auto !important;
        overflow-y: hidden !important;
        flex-shrink: 0 !important;
        gap: 2px !important;
        position: sticky !important;
        top: 0 !important;
        z-index: 100 !important;
        scrollbar-width: thin !important;
        box-shadow: 0 2px 20px rgba(0,0,0,0.3), inset 0 1px 0 rgba(214, 178, 94, 0.04) !important;
        margin: 0 -32px 0 -32px !important;
        padding-left: 20px !important;
        padding-right: 16px !important;
        min-height: 50px !important;
    `;

    var tabsWrapper = document.createElement('div');
    tabsWrapper.id = 'tabsWrapper';
    tabsWrapper.style.cssText = `
        display: flex;
        align-items: center;
        gap: 2px;
        flex: 1;
        overflow-x: auto;
        overflow-y: hidden;
        height: 100%;
        scrollbar-width: thin;
        min-width: 0;
    `;
    container.appendChild(tabsWrapper);

    var rightWrapper = document.createElement('div');
    rightWrapper.id = 'tabBarRightWrapper';
    rightWrapper.style.cssText = `
        display: flex !important;
        align-items: center !important;
        gap: 6px !important;
        flex-shrink: 0 !important;
        margin-left: auto !important;
        padding-left: 12px !important;
        height: 100% !important;
        border-left: 1px solid rgba(255,255,255,0.04) !important;
    `;

    var notifContainer = document.createElement('div');
    notifContainer.id = 'globalNotificationContainer';
    notifContainer.style.cssText = `
        position: relative !important;
        display: flex !important;
        align-items: center !important;
        height: 100% !important;
    `;

    var notifBtn = document.createElement('button');
    notifBtn.id = 'globalNotificationBtn';
    notifBtn.innerHTML = '<i class="fas fa-bell"></i>';
    notifBtn.title = '通知';
    notifBtn.style.cssText = `
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        width: 34px !important;
        height: 34px !important;
        border-radius: 6px !important;
        border: 1px solid rgba(255,255,255,0.06) !important;
        background: rgba(255,255,255,0.02) !important;
        color: rgba(255,255,255,0.2) !important;
        cursor: pointer !important;
        font-size: 16px !important;
        transition: 0.25s !important;
        flex-shrink: 0 !important;
        font-family: 'Inter', sans-serif !important;
        position: relative !important;
    `;
    notifBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        toggleNotificationDropdown();
    });

    var badge = document.createElement('span');
    badge.id = 'globalNotificationBadge';
    badge.style.cssText = `
        position: absolute !important;
        top: -4px !important;
        right: -4px !important;
        background: #e88080 !important;
        color: #fff !important;
        border-radius: 50% !important;
        font-size: 9px !important;
        font-weight: 700 !important;
        min-width: 16px !important;
        height: 16px !important;
        display: none !important;
        align-items: center !important;
        justify-content: center !important;
        padding: 0 4px !important;
        border: 2px solid rgba(12, 16, 28, 0.8) !important;
        font-family: 'Inter', sans-serif !important;
        line-height: 1 !important;
        z-index: 2 !important;
    `;
    notifBtn.appendChild(badge);

    var dropdown = document.createElement('div');
    dropdown.id = 'globalNotificationDropdown';
    dropdown.style.cssText = `
        display: none !important;
        position: fixed !important;
        top: 70px !important;
        right: 20px !important;
        width: 400px !important;
        max-height: 500px !important;
        background: rgba(16, 20, 34, 0.98) !important;
        border-radius: 16px !important;
        border: 1px solid rgba(255,255,255,0.06) !important;
        box-shadow: 0 20px 60px rgba(0,0,0,0.8) !important;
        overflow: hidden !important;
        z-index: 99999 !important;
        backdrop-filter: blur(20px) !important;
        -webkit-backdrop-filter: blur(20px) !important;
        font-family: 'Inter', sans-serif !important;
    `;

    dropdown.innerHTML = `
        <div style="padding: 16px 20px; border-bottom: 1px solid rgba(255,255,255,0.04); display: flex; justify-content: space-between; align-items: center;">
            <h4 style="font-size: 14px; font-weight: 600; color: #d8e0f0; margin: 0;">
                <i class="fas fa-bell" style="color: #8892a8; margin-right: 8px;"></i>
                Notifications
            </h4>
            <span id="globalNotificationCount" style="font-size: 11px; color: #6a7a92;">0</span>
        </div>
        <div id="globalNotificationList" style="max-height: 350px; overflow-y: auto; padding: 8px 0;">
            <div style="text-align: center; padding: 40px 20px; color: #6a7a92; font-size: 13px;">
                <i class="fas fa-inbox" style="display: block; font-size: 28px; color: #4a5a72; margin-bottom: 10px;"></i>
                No notifications
            </div>
        </div>
        <div style="padding: 12px 20px; border-top: 1px solid rgba(255,255,255,0.04); display: flex; flex-direction: column; gap: 6px;">
            <button id="markAllReadBtn" style="width: 100%; background: rgba(74, 124, 255, 0.06); border: 1px solid rgba(74, 124, 255, 0.08); border-radius: 30px; padding: 8px 0; color: #4a7cff; font-weight: 500; font-size: 12px; cursor: pointer; font-family: 'Inter', sans-serif;">
                <i class="fas fa-check-double"></i> Mark All as Read
            </button>
            <button id="clearAllNotificationsBtn" style="width: 100%; background: rgba(232,128,128,0.06); border: 1px solid rgba(232,128,128,0.08); border-radius: 30px; padding: 8px 0; color: #e88080; font-weight: 500; font-size: 12px; cursor: pointer; font-family: 'Inter', sans-serif;">
                <i class="fas fa-trash"></i> Clear All
            </button>
        </div>
    `;

    document.body.appendChild(dropdown);
    window._globalNotificationDropdown = dropdown;

    notifContainer.appendChild(notifBtn);
    rightWrapper.appendChild(notifContainer);

    var addBtn = document.createElement('button');
    addBtn.id = 'addTabBtn';
    addBtn.innerHTML = '<i class="fas fa-plus"></i>';
    addBtn.title = '打开新页面';
    addBtn.style.cssText = `
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        width: 34px !important;
        height: 34px !important;
        border-radius: 6px !important;
        border: 1px solid rgba(255,255,255,0.06) !important;
        background: rgba(255,255,255,0.02) !important;
        color: rgba(255,255,255,0.2) !important;
        cursor: pointer !important;
        font-size: 14px !important;
        transition: 0.25s !important;
        flex-shrink: 0 !important;
        font-family: 'Inter', sans-serif !important;
    `;
    addBtn.addEventListener('click', function() {
        var pageIds = Object.keys(PAGE_DEFS);
        var available = pageIds.filter(function(id) { return !tabs.some(function(t) { return t.pageId === id; }); });
        if (available.length === 0) {
            showToast('所有页面都已打开！', 'info');
            return;
        }
        openTab(available[0]);
    });

    rightWrapper.appendChild(addBtn);
    container.appendChild(rightWrapper);

    main.insertBefore(container, main.firstChild);

    setTimeout(function() {
        var markAllBtn = dropdown.querySelector('#markAllReadBtn');
        if (markAllBtn) {
            markAllBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                if (typeof window.markAllNotificationsRead === 'function') {
                    window.markAllNotificationsRead();
                }
            });
        }
        var clearBtn = dropdown.querySelector('#clearAllNotificationsBtn');
        if (clearBtn) {
            clearBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                if (typeof showConfirm === 'function') {
                    showConfirm('Clear All Notifications', 'Are you sure you want to clear all notifications?', function() {
                        if (typeof window.clearAllNotifications === 'function') {
                            window.clearAllNotifications();
                        }
                    });
                }
            });
        }
    }, 100);

    if (!document.getElementById('tab-bar-styles')) {
        var newStyle = document.createElement('style');
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
            .tab-placeholder {
                display: inline-block;
                border-radius: 8px 8px 0 0;
                background: rgba(214, 178, 94, 0.06);
                border: 1px dashed rgba(214, 178, 94, 0.2);
                flex-shrink: 0;
                margin: 0 2px;
                transition: all 0.15s ease;
                pointer-events: none;
            }
            .tab-item.ghost {
                position: fixed;
                pointer-events: none;
                z-index: 99999;
                opacity: 0.85;
                transform: scale(1.05) rotate(-1deg);
                background: rgba(20, 24, 40, 0.95);
                border: 1px solid rgba(214, 178, 94, 0.3);
                box-shadow: 0 12px 40px rgba(0,0,0,0.5), 0 0 30px rgba(214, 178, 94, 0.05);
                border-radius: 8px 8px 0 0;
                padding: 6px 14px;
                display: flex;
                align-items: center;
                gap: 8px;
                font-size: 12px;
                font-weight: 500;
                color: #F3D38B;
                white-space: nowrap;
                flex-shrink: 0;
                height: 42px;
                font-family: 'Inter', sans-serif;
                transition: none;
                width: auto;
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
            .tab-add-btn:hover, .tab-notif-btn:hover {
                border-color: rgba(214,178,94,0.2);
                color: #D6B25E;
                background: rgba(214,178,94,0.04);
            }
            .tab-bar-container::-webkit-scrollbar {
                height: 2px;
            }
            .tab-bar-container::-webkit-scrollbar-thumb {
                background: rgba(214,178,94,0.15);
                border-radius: 4px;
            }
            #globalNotificationDropdown::-webkit-scrollbar {
                width: 4px;
            }
            #globalNotificationDropdown::-webkit-scrollbar-thumb {
                background: rgba(204,184,159,0.15);
                border-radius: 4px;
            }
            #globalNotificationDropdown::-webkit-scrollbar-track {
                background: transparent;
            }
            .notification-item:hover {
                background: rgba(255,255,255,0.06) !important;
                border-color: rgba(204,184,159,0.2) !important;
            }
            #notificationList::-webkit-scrollbar {
                width: 4px;
            }
            #notificationList::-webkit-scrollbar-thumb {
                background: rgba(204,184,159,0.15);
                border-radius: 4px;
            }
            #notificationList::-webkit-scrollbar-track {
                background: transparent;
            }
            #tabsWrapper:empty::after {
                content: '点击侧边栏打开页面';
                color: rgba(255,255,255,0.08);
                font-size: 12px;
                padding: 0 8px;
            }
            .tab-bar-container.dragging {
                cursor: grabbing;
            }
            .tab-bar-container.dragging .tab-item {
                cursor: grabbing;
            }
        `;
        document.head.appendChild(newStyle);
    }

    renderTabBar();

    if (tabs.length > 0) {
        var firstTab = tabs[0];
        var pageEl = document.getElementById('page_' + firstTab.pageId);
        if (pageEl) {
            pageEl.classList.add('active');
            loadPageContent(firstTab.pageId);
        }
    }

    console.log('✅ Tab Bar 已初始化（带持久化排序 + 拖拽）');
    console.log('📋 当前 Tabs:', tabs.map(function(t) { return t.pageId; }));
}

// 暴露给全局
window.openTab = openTab;
window.closeTab = closeTab;
window.switchTab = switchTab;
window.renderTabBar = renderTabBar;
window.initTabBar = initTabBar;
window.updateGlobalNotificationBadge = updateGlobalNotificationBadge;
window.toggleNotificationDropdown = toggleNotificationDropdown;
window.closeNotificationDropdown = closeNotificationDropdown;
window.getModuleNotificationCount = getModuleNotificationCount;
window.isModuleRead = isModuleRead;
window.markModuleRead = markModuleRead;
window.playNotificationSound = playNotificationSound;
window.saveTabOrder = saveTabOrder;
window.loadTabOrderFromStorage = loadTabOrderFromStorage;

console.log('✅ admin-common.js 加载完成');
console.log('   🔊 KYC → kycverification.mp3');
console.log('   🔊 Withdrawal → withdrawal.mp3');
console.log('   🔊 Email → emailverification.mp3');
console.log('   🔄 Tab 拖拽排序已启用');
console.log('   💾 Tab 顺序自动保存，刷新页面保持');

// ============================================================
// 🔥 新增：事件处理函数（轻量级刷新）
// ============================================================

// 新用户注册
function handleNewUser(data) {
    console.log('👤 处理新用户注册:', data);
    
    // 刷新 Recent 表格
    if (window.refreshRecentOnly && typeof window.refreshRecentOnly === 'function') {
        setTimeout(window.refreshRecentOnly, 500);
    }
    
    // 刷新转化率
    if (window.refreshConversionOnly && typeof window.refreshConversionOnly === 'function') {
        setTimeout(window.refreshConversionOnly, 600);
    }
    
    // 显示通知（如果用户有存款，不显示注册通知，避免干扰）
    // 只显示通知，不弹 Amber
}

// 新存款
function handleNewDeposit(data) {
    console.log('💳 处理新存款:', data);
    
    // 刷新转化率
    if (window.refreshConversionOnly && typeof window.refreshConversionOnly === 'function') {
        setTimeout(window.refreshConversionOnly, 500);
    }
    
    // 如果当前页面是 Dashboard，刷新统计卡片和图表
    if (document.getElementById('page_dashboard')?.classList.contains('active')) {
        if (window.loadDashboardPage && typeof window.loadDashboardPage === 'function') {
            // 只刷新统计数据，不刷新整个页面
            setTimeout(function() {
                refreshStatsAndChart();
            }, 700);
        }
    }
}

// 提款状态变更
function handleWithdrawalUpdate(data) {
    console.log('📊 处理提款状态变更:', data);
    
    if (data.status === 'approved') {
        // 刷新快捷卡片（pending 数量减少）
        if (window.refreshQuickCardsOnly && typeof window.refreshQuickCardsOnly === 'function') {
            setTimeout(window.refreshQuickCardsOnly, 500);
        }
        
        // 刷新统计和图表
        if (document.getElementById('page_dashboard')?.classList.contains('active')) {
            setTimeout(function() {
                refreshStatsAndChart();
            }, 700);
        }
        
        // 如果在 Withdrawal 页面，刷新列表
        if (document.getElementById('page_withdrawals')?.classList.contains('active')) {
            if (window.loadWithdrawalsPage && typeof window.loadWithdrawalsPage === 'function') {
                setTimeout(window.loadWithdrawalsPage, 800);
            }
        }
    } else if (data.status === 'rejected') {
        // 刷新快捷卡片（pending 数量减少）
        if (window.refreshQuickCardsOnly && typeof window.refreshQuickCardsOnly === 'function') {
            setTimeout(window.refreshQuickCardsOnly, 500);
        }
    }
}

// 刷新统计和图表（轻量级，只查必要数据）
async function refreshStatsAndChart() {
    try {
        var nowDate = getBerlinDate ? getBerlinDate() : new Date();
        var startDate = new Date(nowDate);
        startDate.setDate(startDate.getDate() - 7);
        var startStr = startDate.toISOString().split('T')[0];
        
        var [depositsRes, withdrawalsRes] = await Promise.all([
            sb.from('deposits').select('created_at, amount').eq('type', 'manual').gte('created_at', startStr),
            sb.from('withdrawals').select('request_date, amount, status').gte('request_date', startStr)
        ]);
        
        var deposits = depositsRes.data || [];
        var withdrawals = withdrawalsRes.data || [];
        
        // 计算总存款
        var totalDeposit = deposits.reduce(function(s, d) { return s + (d.amount || 0); }, 0);
        var totalWithdraw = withdrawals.filter(function(w) { return w.status === 'approved'; })
            .reduce(function(s, w) { return s + (w.amount || 0); }, 0);
        
        var totalDepositEl = document.getElementById('totalDepositCount');
        var totalWithdrawEl = document.getElementById('totalWithdrawCount');
        
        if (totalDepositEl) animateNumber(totalDepositEl, totalDeposit, '€', '');
        if (totalWithdrawEl) animateNumber(totalWithdrawEl, totalWithdraw, '€', '');
        
        // 更新图表
        if (window.loadChartData && typeof window.loadChartData === 'function') {
            window.loadChartData(true);
        }
        
    } catch (e) {
        console.error('刷新统计和图表失败:', e);
    }
}

// 暴露给全局
window.handleNewUser = handleNewUser;
window.handleNewDeposit = handleNewDeposit;
window.handleWithdrawalUpdate = handleWithdrawalUpdate;
window.refreshStatsAndChart = refreshStatsAndChart;