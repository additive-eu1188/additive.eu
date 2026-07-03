// ============================================================
// 全局状态
// ============================================================
var notifCurrentType = 'notification';
var notifCurrentAudience = 'all';
var notifList = [];
var notifSearchKeyword = '';
var notifSelectedUser = null;

// ============================================================
// 工具函数
// ============================================================
function notifEscapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/[&<>]/g, function(m) {
        return m === '&' ? '&amp;' : m === '<' ? '&lt;' : m === '>' ? '&gt;' : m;
    });
}

function notifFormatDate(iso) {
    if (!iso) return '-';
    try {
        var d = new Date(iso);
        return d.toLocaleString();
    } catch (e) {
        return iso;
    }
}

function notifGetDefaultSentTime() {
    var now = new Date();
    var day = String(now.getDate()).padStart(2, '0');
    var month = String(now.getMonth() + 1).padStart(2, '0');
    var year = now.getFullYear();
    var hours = String(now.getHours()).padStart(2, '0');
    var minutes = String(now.getMinutes()).padStart(2, '0');
    return { day: day, month: month, year: year, time: hours + ':' + minutes };
}

function notifGetStatusBadge(record) {
    var isSeen = record.status === 'seen';
    return isSeen ?
        '<span class="status-badge-seen">✅ Seen</span>' :
        '<span class="status-badge-unread">⏳ Unread</span>';
}

function notifGetTargetBadge(record) {
    if (record.target_type === 'specific') {
        return '<span class="target-badge-specific"><i class="fas fa-user"></i> Specific</span>';
    }
    return '<span class="target-badge-all"><i class="fas fa-globe"></i> All</span>';
}

// ============================================================
// 🔥 获取用户信息（用于显示在 UID 下方）
// ============================================================
async function notifFetchUserInfo(uid) {
    if (!uid) return null;
    try {
        var { data, error } = await sb
            .from('users')
            .select('username, balance, vip_level, last_online, phone')
            .eq('uid', uid)
            .single();
        
        if (error) throw error;
        return data;
    } catch (e) {
        console.error('获取用户信息失败:', e);
        return null;
    }
}

// ============================================================
// 🔥 获取 VIP 等级名称
// ============================================================
function notifGetVipName(level) {
    var map = {
        1: 'Normal',
        2: 'VIP',
        3: 'SVIP'
    };
    return map[level] || 'Normal';
}

// ============================================================
// 🔥 格式化最后在线时间
// ============================================================
function notifFormatLastOnline(dateStr) {
    if (!dateStr) return '-';
    try {
        var date = new Date(dateStr);
        var now = new Date();
        var diffMins = Math.floor((now - date) / 60000);
        var diffHours = Math.floor(diffMins / 60);
        var diffDays = Math.floor(diffHours / 24);
        
        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return diffMins + 'm ago';
        if (diffHours < 24) return diffHours + 'h ago';
        if (diffDays < 7) return diffDays + 'd ago';
        return date.toLocaleDateString();
    } catch (e) {
        return '-';
    }
}

// ============================================================
// CRUD 操作
// ============================================================

async function notifLoadNotifications() {
    var tbody = document.getElementById('notifTableBody');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding:30px; color:#6a7a9a;">Loading...</td></tr>';

    try {
        if (!sb) {
            throw new Error('Supabase client not available');
        }

        var query = sb.from('user_notifications')
            .select('*')
            .order('created_at', { ascending: false });

        if (notifSearchKeyword) {
            query = query.ilike('target_uid', '%' + notifSearchKeyword + '%');
        }

        if (notifCurrentType === 'popup') {
            query = query.eq('type', 'popup');
        } else {
            query = query.eq('type', 'notification');
        }

        var result = await query;
        if (result.error) throw result.error;

        notifList = result.data || [];
        notifRenderTable(notifList);
        notifUpdateStats(notifList);

    } catch (e) {
        console.error('加载通知失败:', e);
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding:30px; color:#ff8888;">加载失败: ' +
            notifEscapeHtml(e.message) + '</td></tr>';
    }
}

function notifRenderTable(list) {
    var tbody = document.getElementById('notifTableBody');
    if (!tbody) return;

    if (!list || list.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding:30px; color:#6a7a9a;">No notifications</td></tr>';
        return;
    }

    tbody.innerHTML = '';
    list.forEach(function(item) {
        var row = tbody.insertRow();

        var uidDisplay = item.target_type === 'all' ? 'All' : (item.target_uid || '-');
        row.insertCell(0).innerHTML = '<span style="font-weight:600; color:#c8d2e8; font-size:12px;">' + notifEscapeHtml(uidDisplay) + '</span>';
        row.insertCell(1).innerHTML = '<span style="font-weight:600; color:#d8e0f0;">' + notifEscapeHtml(item.title || '-') + '</span>';
        row.insertCell(2).innerHTML = '<span style="font-size:12px; color:#8892a8;">' + notifEscapeHtml(item.description || '-') + '</span>';
        row.insertCell(3).innerHTML = notifGetTargetBadge(item);

        var sentTime = item.sent_time || item.created_at;
        row.insertCell(4).innerHTML = '<span style="font-size:12px; color:#8892a8;">' + notifFormatDate(sentTime) + '</span>';
        row.insertCell(5).innerHTML = notifGetStatusBadge(item);

        var actionsCell = row.insertCell(6);
        actionsCell.innerHTML = `
            <button class="btn-sm-action btn-edit-time" data-id="${item.id}" data-sent="${item.sent_time || ''}">
                <i class="fas fa-clock"></i> Edit time
            </button>
            <button class="btn-sm-action btn-delete-notif" data-id="${item.id}">
                <i class="fas fa-trash"></i> Delete
            </button>
        `;
    });

    document.querySelectorAll('.btn-edit-time').forEach(function(btn) {
        btn.addEventListener('click', function() {
            var id = this.dataset.id;
            var sent = this.dataset.sent || '';
            notifOpenEditTimeModal(id, sent);
        });
    });

    document.querySelectorAll('.btn-delete-notif').forEach(function(btn) {
        btn.addEventListener('click', function() {
            var id = this.dataset.id;
            notifDeleteNotification(id);
        });
    });
}

function notifUpdateStats(list) {
    var total = list.length;
    var unread = list.filter(function(n) { return n.status !== 'seen'; }).length;
    var seen = list.filter(function(n) { return n.status === 'seen'; }).length;
    document.getElementById('totalNotifCount').textContent = total;
    document.getElementById('unreadNotifCount').textContent = unread;
    document.getElementById('seenNotifCount').textContent = seen;
}

async function notifCreateNotification() {
    var title = document.getElementById('notifTitleInput').value.trim();
    var description = document.getElementById('notifDescInput').value.trim();
    var day = document.getElementById('notifDay').value.trim();
    var month = document.getElementById('notifMonth').value.trim();
    var year = document.getElementById('notifYear').value.trim();
    var time = document.getElementById('notifTime').value;
    var targetType = notifCurrentAudience;
    var targetUid = document.getElementById('notifSpecificUid').value.trim();

    if (!title) {
        showToast('Please enter a title', 'error');
        return;
    }
    if (!description) {
        showToast('Please enter a description', 'error');
        return;
    }
    if (!day || !month || !year || !time) {
        showToast('Please enter full date and time (DD/MM/YYYY HH:mm)', 'error');
        return;
    }
    
    var dayNum = parseInt(day);
    var monthNum = parseInt(month);
    var yearNum = parseInt(year);
    
    if (isNaN(dayNum) || dayNum < 1 || dayNum > 31) {
        showToast('Please enter a valid day (1-31)', 'error');
        return;
    }
    if (isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
        showToast('Please enter a valid month (1-12)', 'error');
        return;
    }
    if (isNaN(yearNum) || yearNum < 2020 || yearNum > 2099) {
        showToast('Please enter a valid year (2020-2099)', 'error');
        return;
    }
    
    if (targetType === 'specific' && !targetUid) {
        showToast('Please enter a UID for specific user', 'error');
        return;
    }

    var paddedDay = String(dayNum).padStart(2, '0');
    var paddedMonth = String(monthNum).padStart(2, '0');
    var dateTimeStr = year + '-' + paddedMonth + '-' + paddedDay + 'T' + time + ':00';

    var payload = {
        type: notifCurrentType,
        title: title,
        description: description,
        sent_time: new Date(dateTimeStr).toISOString(),
        target_type: targetType,
        target_uid: targetType === 'specific' ? targetUid : null,
        status: 'unread',
        created_at: new Date().toISOString()
    };

    try {
        if (!sb) throw new Error('Supabase client not available');
        var result = await sb.from('user_notifications').insert([payload]);
        if (result.error) throw result.error;

        showToast('✅ Notification created successfully', 'success');
        notifCloseCreateModal();
        notifLoadNotifications();

    } catch (e) {
        console.error('创建通知失败:', e);
        showToast('创建失败: ' + e.message, 'error');
    }
}

async function notifDeleteNotification(id) {
    showConfirm('Delete Notification', 'Are you sure you want to delete this notification?', async function() {
        try {
            if (!sb) throw new Error('Supabase client not available');
            var result = await sb.from('user_notifications').delete().eq('id', parseInt(id));
            if (result.error) throw result.error;
            showToast('✅ Notification deleted', 'success');
            notifLoadNotifications();
        } catch (e) {
            showToast('删除失败: ' + e.message, 'error');
        }
    });
}

async function notifSaveEditTime() {
    var id = document.getElementById('editNotifId').value;
    var day = document.getElementById('editDay').value.trim();
    var month = document.getElementById('editMonth').value.trim();
    var year = document.getElementById('editYear').value.trim();
    var time = document.getElementById('editTime').value;

    if (!day || !month || !year || !time) {
        showToast('Please enter full date and time (DD/MM/YYYY HH:mm)', 'error');
        return;
    }
    
    var dayNum = parseInt(day);
    var monthNum = parseInt(month);
    var yearNum = parseInt(year);
    
    if (isNaN(dayNum) || dayNum < 1 || dayNum > 31) {
        showToast('Please enter a valid day (1-31)', 'error');
        return;
    }
    if (isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
        showToast('Please enter a valid month (1-12)', 'error');
        return;
    }
    if (isNaN(yearNum) || yearNum < 2020 || yearNum > 2099) {
        showToast('Please enter a valid year (2020-2099)', 'error');
        return;
    }

    var paddedDay = String(dayNum).padStart(2, '0');
    var paddedMonth = String(monthNum).padStart(2, '0');
    var dateTimeStr = year + '-' + paddedMonth + '-' + paddedDay + 'T' + time + ':00';

    try {
        if (!sb) throw new Error('Supabase client not available');
        var result = await sb.from('user_notifications')
            .update({ sent_time: new Date(dateTimeStr).toISOString() })
            .eq('id', parseInt(id));

        if (result.error) throw result.error;

        showToast('✅ Sent time updated', 'success');
        notifCloseEditTimeModal();
        notifLoadNotifications();

    } catch (e) {
        console.error('更新失败:', e);
        showToast('更新失败: ' + e.message, 'error');
    }
}

// ============================================================
// UI 控制
// ============================================================

function notifSwitchType(type) {
    notifCurrentType = type;
    var btns = document.querySelectorAll('.header-right .btn-primary');
    if (btns.length >= 2) {
        btns.forEach(function(btn) {
            btn.style.borderColor = 'rgba(201,176,149,0.2)';
            btn.style.background = 'rgba(201,176,149,0.06)';
            btn.style.color = '#C9B095';
        });
        if (type === 'popup') {
            btns[0].style.borderColor = 'rgba(201,176,149,0.5)';
            btns[0].style.background = 'rgba(201,176,149,0.15)';
            btns[0].style.color = '#ffffff';
        } else {
            btns[1].style.borderColor = 'rgba(201,176,149,0.5)';
            btns[1].style.background = 'rgba(201,176,149,0.15)';
            btns[1].style.color = '#ffffff';
        }
    }
    notifLoadNotifications();
}

function notifSelectAudience(type) {
    notifCurrentAudience = type;
    document.querySelectorAll('.audience-option').forEach(function(el) {
        el.classList.remove('active');
    });
    var target = document.querySelector('.audience-option[data-target="' + type + '"]');
    if (target) target.classList.add('active');

    var container = document.getElementById('specificUidContainer');
    if (type === 'specific') {
        container.style.display = 'block';
        notifSelectedUser = null;
        document.getElementById('userInfoDisplay').innerHTML = '';
    } else {
        container.style.display = 'none';
        document.getElementById('notifSpecificUid').value = '';
        notifSelectedUser = null;
        document.getElementById('userInfoDisplay').innerHTML = '';
    }
}

// ============================================================
// 🔥 监听 UID 输入 - 自动获取用户信息
// ============================================================
function notifSetupUidListener() {
    var uidInput = document.getElementById('notifSpecificUid');
    if (!uidInput) return;
    
    var debounceTimer = null;
    uidInput.addEventListener('input', function() {
        var uid = this.value.trim();
        var infoDisplay = document.getElementById('userInfoDisplay');
        
        if (!uid) {
            notifSelectedUser = null;
            infoDisplay.innerHTML = '';
            return;
        }
        
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(async function() {
            infoDisplay.innerHTML = '<div style="color:#6a7a92; font-size:12px; padding:8px 0;"><i class="fas fa-spinner fa-spin"></i> Loading user info...</div>';
            
            var user = await notifFetchUserInfo(uid);
            if (user) {
                notifSelectedUser = user;
                var vipName = notifGetVipName(user.vip_level);
                var lastOnline = notifFormatLastOnline(user.last_online);
                var balance = (user.balance || 0).toFixed(2);
                
                infoDisplay.innerHTML = `
                    <div style="background: rgba(12,16,28,0.6); border-radius: 12px; padding: 12px 16px; margin-top: 6px; border: 1px solid rgba(201,176,149,0.06);">
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px 16px; font-size: 13px;">
                            <div><span style="color:#6a7a92;">Username</span> <span style="color:#d8e0f0; font-weight:500;">${notifEscapeHtml(user.username)}</span></div>
                            <div><span style="color:#6a7a92;">Balance</span> <span style="color:#4ade80; font-weight:600;">€${balance}</span></div>
                            <div><span style="color:#6a7a92;">VIP RANK</span> <span style="color:#C9B095; font-weight:500;">${notifEscapeHtml(vipName)}</span></div>
                            <div><span style="color:#6a7a92;">Last Online</span> <span style="color:#8892a8;">${notifEscapeHtml(lastOnline)}</span></div>
                        </div>
                    </div>
                `;
            } else {
                infoDisplay.innerHTML = '<div style="color:#e88080; font-size:12px; padding:8px 0;"><i class="fas fa-exclamation-circle"></i> User not found</div>';
                notifSelectedUser = null;
            }
        }, 500);
    });
}

function notifOpenCreateModal() {
    document.getElementById('createNotifModal').classList.add('active');
    document.getElementById('createNotifModal').style.display = 'flex';
    
    var defaultTime = notifGetDefaultSentTime();
    document.getElementById('notifDay').value = defaultTime.day;
    document.getElementById('notifMonth').value = defaultTime.month;
    document.getElementById('notifYear').value = defaultTime.year;
    document.getElementById('notifTime').value = defaultTime.time;
    
    document.getElementById('notifTitleInput').value = '';
    document.getElementById('notifDescInput').value = '';
    document.getElementById('notifSpecificUid').value = '';
    notifSelectedUser = null;
    document.getElementById('userInfoDisplay').innerHTML = '';
    notifSelectAudience('all');
}

function notifCloseCreateModal() {
    document.getElementById('createNotifModal').classList.remove('active');
    document.getElementById('createNotifModal').style.display = 'none';
}

function notifOpenEditTimeModal(id, sentTime) {
    document.getElementById('editNotifId').value = id;
    var day = '', month = '', year = '', time = '';
    if (sentTime) {
        try {
            var d = new Date(sentTime);
            day = String(d.getDate()).padStart(2, '0');
            month = String(d.getMonth() + 1).padStart(2, '0');
            year = d.getFullYear();
            time = String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
        } catch (e) {
            var defaultTime = notifGetDefaultSentTime();
            day = defaultTime.day;
            month = defaultTime.month;
            year = defaultTime.year;
            time = defaultTime.time;
        }
    } else {
        var defaultTime = notifGetDefaultSentTime();
        day = defaultTime.day;
        month = defaultTime.month;
        year = defaultTime.year;
        time = defaultTime.time;
    }
    document.getElementById('editDay').value = day;
    document.getElementById('editMonth').value = month;
    document.getElementById('editYear').value = year;
    document.getElementById('editTime').value = time;
    document.getElementById('editTimeModal').classList.add('active');
    document.getElementById('editTimeModal').style.display = 'flex';
}

function notifCloseEditTimeModal() {
    document.getElementById('editTimeModal').classList.remove('active');
    document.getElementById('editTimeModal').style.display = 'none';
}

// ============================================================
// 加载页面内容（入口函数）
// ============================================================
function loadNotificationPage() {
    var container = document.getElementById('page_notification');
    if (!container) {
        console.warn('⚠️ page_notification 容器不存在，检查页面是否正确引入');
        return;
    }

    container.innerHTML = `
        <div class="card" style="background: rgba(12, 16, 28, 0.6); backdrop-filter: blur(16px); border-radius: 20px; border: 1px solid rgba(255,255,255,0.04); padding: 22px 24px;">
            
            <div class="page-header" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; margin-bottom: 24px;">
                <div>
                    <h2 style="font-size: 18px; font-weight: 600; color: #d8e0f0; margin: 0;">
                        <i class="fas fa-bell" style="color: #8892a8; margin-right: 10px;"></i>
                        User Notification
                    </h2>
                    <p style="color: #7a85a5; font-size: 13px; margin: 4px 0 0 0;">
                        Create user notification that appear inside the user front end notification area
                    </p>
                </div>
                <div class="header-right" style="display: flex; gap: 10px; flex-wrap: wrap; align-items: center;">
                    <button class="btn-primary notif-type-btn" data-type="popup" style="padding: 8px 20px; border-radius: 40px; border: 1px solid rgba(201,176,149,0.2); background: rgba(201,176,149,0.06); color: #C9B095; font-weight: 600; cursor: pointer; font-size: 13px; font-family: 'Inter', sans-serif;">
                        Pop Up
                    </button>
                    <button class="btn-primary notif-type-btn active" data-type="notification" style="padding: 8px 20px; border-radius: 40px; border: 1px solid rgba(201,176,149,0.2); background: rgba(201,176,149,0.15); color: #ffffff; font-weight: 600; cursor: pointer; font-size: 13px; font-family: 'Inter', sans-serif;">
                        Notification
                    </button>
                </div>
            </div>

            <div class="notif-stats" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 24px;">
                <div class="notif-stat-item" style="background: rgba(12, 16, 28, 0.6); border-radius: 16px; padding: 16px 20px; text-align: center; border: 1px solid rgba(255,255,255,0.04);">
                    <div class="label" style="font-size: 11px; color: #8892a8; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">All Notification</div>
                    <div class="value" id="totalNotifCount" style="font-size: 28px; font-weight: 700; color: #ffffff;">0</div>
                </div>
                <div class="notif-stat-item" style="background: rgba(12, 16, 28, 0.6); border-radius: 16px; padding: 16px 20px; text-align: center; border: 1px solid rgba(255,255,255,0.04);">
                    <div class="label" style="font-size: 11px; color: #8892a8; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">Unread</div>
                    <div class="value" id="unreadNotifCount" style="font-size: 28px; font-weight: 700; color: #4a7cff;">0</div>
                </div>
                <div class="notif-stat-item" style="background: rgba(12, 16, 28, 0.6); border-radius: 16px; padding: 16px 20px; text-align: center; border: 1px solid rgba(255,255,255,0.04);">
                    <div class="label" style="font-size: 11px; color: #8892a8; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">Seen</div>
                    <div class="value" id="seenNotifCount" style="font-size: 28px; font-weight: 700; color: #4ade80;">0</div>
                </div>
            </div>

            <div class="notif-search-bar" style="display: flex; flex-wrap: wrap; gap: 10px; align-items: center; background: rgba(8, 12, 24, 0.5); border-radius: 16px; padding: 12px 16px; margin-bottom: 20px; border: 1px solid rgba(255,255,255,0.03);">
                <input type="text" id="notifSearchInput" class="search-input" placeholder="Search UID..." style="flex: 1; min-width: 160px; background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.10); border-radius: 40px; padding: 8px 16px; color: #e6edf5; font-size: 13px; outline: none;">
                <button id="notifSearchBtn" class="btn-primary" style="padding: 8px 20px; border-radius: 40px; border: none; background: #2a3a5a; color: #e6edf5; font-weight: 600; cursor: pointer; font-size: 13px; white-space: nowrap; font-family: 'Inter', sans-serif;">
                    <i class="fas fa-search"></i> Search
                </button>
                <button id="notifRefreshBtn" class="btn-primary" style="padding: 8px 20px; border-radius: 40px; border: none; background: #2a3a5a; color: #e6edf5; font-weight: 600; cursor: pointer; font-size: 13px; white-space: nowrap; font-family: 'Inter', sans-serif;">
                    <i class="fas fa-sync-alt"></i> Refresh
                </button>
                <button id="notifAddBtn" class="btn-primary" style="padding: 8px 20px; border-radius: 40px; border: none; background: rgba(74,222,128,0.08); color: #4ade80; font-weight: 600; cursor: pointer; font-size: 13px; white-space: nowrap; font-family: 'Inter', sans-serif; border: 1px solid rgba(74,222,128,0.15);">
                    <i class="fas fa-plus"></i> +New notification
                </button>
            </div>

            <div class="table-container notif-table-wrap" style="max-height: 500px; overflow-y: auto; border-radius: 16px; border: 1px solid rgba(255,255,255,0.03);">
                <table class="data-table" style="width: 100%; border-collapse: collapse; font-size: 13px; min-width: 900px; table-layout: fixed;">
                    <thead>
                        <tr>
                            <th style="padding: 12px 14px; color: #a8b4d0; font-weight: 600; font-size: 11px; text-transform: uppercase; letter-spacing: 0.3px; border-bottom: 1px solid rgba(255,255,255,0.04); background: rgba(10,14,28,0.3); text-align: left; width: 90px;">UID</th>
                            <th style="padding: 12px 14px; color: #a8b4d0; font-weight: 600; font-size: 11px; text-transform: uppercase; letter-spacing: 0.3px; border-bottom: 1px solid rgba(255,255,255,0.04); background: rgba(10,14,28,0.3); text-align: left; width: 140px;">Title</th>
                            <th style="padding: 12px 14px; color: #a8b4d0; font-weight: 600; font-size: 11px; text-transform: uppercase; letter-spacing: 0.3px; border-bottom: 1px solid rgba(255,255,255,0.04); background: rgba(10,14,28,0.3); text-align: left; width: 200px;">Description</th>
                            <th style="padding: 12px 14px; color: #a8b4d0; font-weight: 600; font-size: 11px; text-transform: uppercase; letter-spacing: 0.3px; border-bottom: 1px solid rgba(255,255,255,0.04); background: rgba(10,14,28,0.3); text-align: left; width: 110px;">Target</th>
                            <th style="padding: 12px 14px; color: #a8b4d0; font-weight: 600; font-size: 11px; text-transform: uppercase; letter-spacing: 0.3px; border-bottom: 1px solid rgba(255,255,255,0.04); background: rgba(10,14,28,0.3); text-align: left; width: 150px;">Sent Time</th>
                            <th style="padding: 12px 14px; color: #a8b4d0; font-weight: 600; font-size: 11px; text-transform: uppercase; letter-spacing: 0.3px; border-bottom: 1px solid rgba(255,255,255,0.04); background: rgba(10,14,28,0.3); text-align: left; width: 100px;">Status</th>
                            <th style="padding: 12px 14px; color: #a8b4d0; font-weight: 600; font-size: 11px; text-transform: uppercase; letter-spacing: 0.3px; border-bottom: 1px solid rgba(255,255,255,0.04); background: rgba(10,14,28,0.3); text-align: left; width: 150px;">Actions</th>
                        </tr>
                    </thead>
                    <tbody id="notifTableBody">
                        <tr><td colspan="7" style="text-align:center; padding:30px; color:#6a7a9a;">Loading notifications...</td></tr>
                    </tbody>
                </table>
            </div>
        </div>

        <!-- 创建通知弹窗 -->
        <div id="createNotifModal" class="notif-modal-overlay" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(7, 11, 26, 0.92); backdrop-filter: blur(14px); z-index: 30000; display: none; align-items: center; justify-content: center;">
            <div class="notif-modal-content" style="background: linear-gradient(160deg, #1a1428, #0e0a1a); border-radius: 24px; padding: 32px 36px 28px; max-width: 560px; width: 92%; border: 1px solid rgba(201,176,149,0.1); box-shadow: 0 24px 60px rgba(0,0,0,0.6); transform: scale(0.92); transition: transform 0.3s cubic-bezier(0.2,0.9,0.4,1.1); max-height: 90vh; overflow-y: auto;">
                <div class="modal-header" style="display: flex; align-items: center; gap: 10px; margin-bottom: 20px;">
                    <span style="display: inline-block; width: 3px; height: 18px; background: linear-gradient(180deg, #C9B095, #b8944a); border-radius: 2px;"></span>
                    <h3 style="font-size: 18px; font-weight: 600; color: #e8e8f0; margin: 0; letter-spacing: 0.3px;">Create Notification</h3>
                </div>
                <div class="form-group" style="margin-bottom: 16px;">
                    <label style="display: block; font-size: 11px; color: #6a7a92; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; font-weight: 600;">Title <span style="color:#e88080;">*</span></label>
                    <input type="text" id="notifTitleInput" placeholder="Enter notification title" style="width: 100%; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.06); border-radius: 10px; padding: 10px 14px; color: #e6edf5; font-size: 14px; outline: none; transition: 0.2s; font-family: 'Inter', sans-serif; box-sizing: border-box;">
                </div>
                <div class="form-group" style="margin-bottom: 16px;">
                    <label style="display: block; font-size: 11px; color: #6a7a92; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; font-weight: 600;">Description <span style="color:#e88080;">*</span></label>
                    <textarea id="notifDescInput" placeholder="Write notification description..." style="width: 100%; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.06); border-radius: 10px; padding: 10px 14px; color: #e6edf5; font-size: 14px; outline: none; transition: 0.2s; font-family: 'Inter', sans-serif; box-sizing: border-box; resize: vertical; min-height: 80px;"></textarea>
                </div>
                <div class="form-group" style="margin-bottom: 16px;">
                    <label style="display: block; font-size: 11px; color: #6a7a92; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; font-weight: 600;">
                        Sent Time <span style="color:#e88080;">*</span>
                        <span style="color:#4a5a72; font-weight:400; text-transform:none; letter-spacing:0.3px; margin-left:6px; font-size:10px;">(DD / MM / YYYY HH:mm)</span>
                    </label>
                    <div style="display: flex; gap: 8px; align-items: center; flex-wrap: wrap;">
                        <input type="number" id="notifDay" placeholder="DD" min="1" max="31" style="width: 60px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.06); border-radius: 10px; padding: 10px 8px; color: #e6edf5; font-size: 14px; outline: none; transition: 0.2s; font-family: 'Inter', sans-serif; box-sizing: border-box; text-align: center;">
                        <span style="color: #4a5a72; font-size: 16px; font-weight: 600;">/</span>
                        <input type="number" id="notifMonth" placeholder="MM" min="1" max="12" style="width: 60px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.06); border-radius: 10px; padding: 10px 8px; color: #e6edf5; font-size: 14px; outline: none; transition: 0.2s; font-family: 'Inter', sans-serif; box-sizing: border-box; text-align: center;">
                        <span style="color: #4a5a72; font-size: 16px; font-weight: 600;">/</span>
                        <input type="number" id="notifYear" placeholder="YYYY" min="2020" max="2099" style="width: 80px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.06); border-radius: 10px; padding: 10px 8px; color: #e6edf5; font-size: 14px; outline: none; transition: 0.2s; font-family: 'Inter', sans-serif; box-sizing: border-box; text-align: center;">
                        <span style="color: #4a5a72; font-size: 16px; font-weight: 600; margin: 0 2px;">|</span>
                        <input type="time" id="notifTime" style="width: 120px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.06); border-radius: 10px; padding: 10px 8px; color: #e6edf5; font-size: 14px; outline: none; transition: 0.2s; font-family: 'Inter', sans-serif; box-sizing: border-box; text-align: center; color-scheme: dark;">
                    </div>
                </div>
                <div class="form-group" style="margin-bottom: 16px;">
                    <label style="display: block; font-size: 11px; color: #6a7a92; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; font-weight: 600;">Audience</label>
                    <div class="audience-group" style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 6px;">
                        <div class="audience-option active" data-target="all" onclick="notifSelectAudience('all')" style="background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.06); border-radius: 10px; padding: 12px 14px; cursor: pointer; transition: 0.3s ease; text-align: center; color: #8892a8; font-weight: 500; font-size: 13px; box-shadow: 0 0 0 rgba(201,176,149,0);">
                            <span class="icon" style="display: block; font-size: 20px; margin-bottom: 4px;"><i class="fas fa-users"></i></span>
                            All user
                        </div>
                        <div class="audience-option" data-target="specific" onclick="notifSelectAudience('specific')" style="background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.06); border-radius: 10px; padding: 12px 14px; cursor: pointer; transition: 0.3s ease; text-align: center; color: #8892a8; font-weight: 500; font-size: 13px; box-shadow: 0 0 0 rgba(201,176,149,0);">
                            <span class="icon" style="display: block; font-size: 20px; margin-bottom: 4px;"><i class="fas fa-user"></i></span>
                            Specific User
                        </div>
                    </div>
                    <div class="audience-specific-input" id="specificUidContainer" style="display: none; margin-top: 10px;">
                        <input type="text" id="notifSpecificUid" placeholder="Enter UID" style="width: 100%; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.06); border-radius: 10px; padding: 10px 14px; color: #e6edf5; font-size: 14px; outline: none; box-sizing: border-box;">
                        <div id="userInfoDisplay" style="margin-top: 6px;"></div>
                    </div>
                </div>
                <div class="modal-actions" style="display: flex; gap: 10px; margin-top: 20px; border-top: 1px solid rgba(255,255,255,0.04); padding-top: 20px;">
                    <button class="btn-cancel" onclick="notifCloseCreateModal()" style="flex: 1; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.06); border-radius: 40px; padding: 10px 0; color: #6a6a80; font-weight: 500; font-size: 14px; cursor: pointer; transition: 0.2s; font-family: 'Inter', sans-serif;">Cancel</button>
                    <button class="btn-confirm" id="createNotifBtn" style="flex: 1; background: rgba(201,176,149,0.06); border: 1px solid rgba(201,176,149,0.12); border-radius: 40px; padding: 10px 0; color: #C9B095; font-weight: 600; font-size: 14px; cursor: pointer; transition: 0.2s; font-family: 'Inter', sans-serif;">Create notification</button>
                </div>
            </div>
        </div>

        <!-- 编辑时间弹窗 -->
        <div id="editTimeModal" class="notif-modal-overlay edit-time-modal" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(7, 11, 26, 0.92); backdrop-filter: blur(14px); z-index: 30000; display: none; align-items: center; justify-content: center;">
            <div class="notif-modal-content" style="background: linear-gradient(160deg, #1a1428, #0e0a1a); border-radius: 24px; padding: 32px 36px 28px; max-width: 420px; width: 92%; border: 1px solid rgba(201,176,149,0.1); box-shadow: 0 24px 60px rgba(0,0,0,0.6); transform: scale(0.92); transition: transform 0.3s cubic-bezier(0.2,0.9,0.4,1.1); max-height: 90vh; overflow-y: auto;">
                <div class="modal-header" style="display: flex; align-items: center; gap: 10px; margin-bottom: 20px;">
                    <span style="display: inline-block; width: 3px; height: 18px; background: linear-gradient(180deg, #C9B095, #b8944a); border-radius: 2px;"></span>
                    <h3 style="font-size: 18px; font-weight: 600; color: #e8e8f0; margin: 0; letter-spacing: 0.3px;">Edit Sent Time</h3>
                </div>
                <div class="form-group" style="margin-bottom: 16px;">
                    <label style="display: block; font-size: 11px; color: #6a7a92; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; font-weight: 600;">
                        Sent Time
                        <span style="color:#4a5a72; font-weight:400; text-transform:none; letter-spacing:0.3px; margin-left:6px; font-size:10px;">(DD / MM / YYYY HH:mm)</span>
                    </label>
                    <div style="display: flex; gap: 8px; align-items: center; flex-wrap: wrap;">
                        <input type="number" id="editDay" placeholder="DD" min="1" max="31" style="width: 60px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.06); border-radius: 10px; padding: 10px 8px; color: #e6edf5; font-size: 14px; outline: none; transition: 0.2s; font-family: 'Inter', sans-serif; box-sizing: border-box; text-align: center;">
                        <span style="color: #4a5a72; font-size: 16px; font-weight: 600;">/</span>
                        <input type="number" id="editMonth" placeholder="MM" min="1" max="12" style="width: 60px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.06); border-radius: 10px; padding: 10px 8px; color: #e6edf5; font-size: 14px; outline: none; transition: 0.2s; font-family: 'Inter', sans-serif; box-sizing: border-box; text-align: center;">
                        <span style="color: #4a5a72; font-size: 16px; font-weight: 600;">/</span>
                        <input type="number" id="editYear" placeholder="YYYY" min="2020" max="2099" style="width: 80px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.06); border-radius: 10px; padding: 10px 8px; color: #e6edf5; font-size: 14px; outline: none; transition: 0.2s; font-family: 'Inter', sans-serif; box-sizing: border-box; text-align: center;">
                        <span style="color: #4a5a72; font-size: 16px; font-weight: 600; margin: 0 2px;">|</span>
                        <input type="time" id="editTime" style="width: 120px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.06); border-radius: 10px; padding: 10px 8px; color: #e6edf5; font-size: 14px; outline: none; transition: 0.2s; font-family: 'Inter', sans-serif; box-sizing: border-box; text-align: center; color-scheme: dark;">
                    </div>
                </div>
                <input type="hidden" id="editNotifId" />
                <div class="modal-actions" style="display: flex; gap: 10px; margin-top: 20px; border-top: 1px solid rgba(255,255,255,0.04); padding-top: 20px;">
                    <button class="btn-cancel" onclick="notifCloseEditTimeModal()" style="flex: 1; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.06); border-radius: 40px; padding: 10px 0; color: #6a6a80; font-weight: 500; font-size: 14px; cursor: pointer; transition: 0.2s; font-family: 'Inter', sans-serif;">Cancel</button>
                    <button class="btn-confirm" id="saveEditTimeBtn" style="flex: 1; background: rgba(201,176,149,0.06); border: 1px solid rgba(201,176,149,0.12); border-radius: 40px; padding: 10px 0; color: #C9B095; font-weight: 600; font-size: 14px; cursor: pointer; transition: 0.2s; font-family: 'Inter', sans-serif;">Save</button>
                </div>
            </div>
        </div>
    `;

    // 绑定事件
    document.querySelectorAll('.notif-type-btn').forEach(function(btn) {
        btn.addEventListener('click', function() {
            var type = this.dataset.type;
            document.querySelectorAll('.notif-type-btn').forEach(function(b) {
                b.style.borderColor = 'rgba(201,176,149,0.2)';
                b.style.background = 'rgba(201,176,149,0.06)';
                b.style.color = '#C9B095';
            });
            this.style.borderColor = 'rgba(201,176,149,0.5)';
            this.style.background = 'rgba(201,176,149,0.15)';
            this.style.color = '#ffffff';
            notifSwitchType(type);
        });
    });

    document.getElementById('notifSearchBtn').addEventListener('click', function() {
        notifSearchKeyword = document.getElementById('notifSearchInput').value.trim();
        notifLoadNotifications();
    });
    document.getElementById('notifSearchInput').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            notifSearchKeyword = document.getElementById('notifSearchInput').value.trim();
            notifLoadNotifications();
        }
    });
    document.getElementById('notifRefreshBtn').addEventListener('click', function() {
        document.getElementById('notifSearchInput').value = '';
        notifSearchKeyword = '';
        notifLoadNotifications();
    });

    document.getElementById('notifAddBtn').addEventListener('click', notifOpenCreateModal);
    document.getElementById('createNotifBtn').addEventListener('click', notifCreateNotification);
    document.getElementById('saveEditTimeBtn').addEventListener('click', notifSaveEditTime);

    // 🔥 设置 UID 输入监听
    notifSetupUidListener();

    document.querySelectorAll('.notif-modal-overlay').forEach(function(overlay) {
        overlay.addEventListener('click', function(e) {
            if (e.target === this) {
                this.classList.remove('active');
                this.style.display = 'none';
            }
        });
    });

    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            notifCloseCreateModal();
            notifCloseEditTimeModal();
        }
    });

    // 🔥 添加 Audience 卡片发光样式
    var style = document.createElement('style');
    style.textContent = `
        .audience-option.active {
            border-color: rgba(201,176,149,0.5) !important;
            background: rgba(201,176,149,0.12) !important;
            color: #C9B095 !important;
            box-shadow: 0 0 30px rgba(201,176,149,0.12), inset 0 0 20px rgba(201,176,149,0.04) !important;
        }
        .audience-option {
            transition: all 0.3s ease !important;
        }
        .audience-option:hover {
            border-color: rgba(201,176,149,0.2);
            background: rgba(255,255,255,0.04);
        }
    `;
    document.head.appendChild(style);

    notifLoadNotifications();

    console.log('✅ User Notification page loaded');
    console.log('   - Date picker: 4 separate inputs (DD / MM / YYYY HH:mm)');
    console.log('   - Audience cards: glow effect on active');
    console.log('   - UID input: auto fetch user info');
}

// ============================================================
// 暴露全局函数
// ============================================================
window.loadNotificationPage = loadNotificationPage;
window.notifSwitchType = notifSwitchType;
window.notifSelectAudience = notifSelectAudience;
window.notifOpenCreateModal = notifOpenCreateModal;
window.notifCloseCreateModal = notifCloseCreateModal;
window.notifOpenEditTimeModal = notifOpenEditTimeModal;
window.notifCloseEditTimeModal = notifCloseEditTimeModal;
window.notifCreateNotification = notifCreateNotification;
window.notifDeleteNotification = notifDeleteNotification;
window.notifSaveEditTime = notifSaveEditTime;
window.notifLoadNotifications = notifLoadNotifications;

console.log('✅ admin-notification.js loaded');