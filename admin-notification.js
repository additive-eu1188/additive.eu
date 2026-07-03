// admin-notification.js - User Notification 管理页面（与 withdrawal 页面风格一致）
// 依赖：admin-common.js, toast.js, user-data.js

// ============================================================
// Supabase 配置（使用全局 sb 对象）
// ============================================================
const SUPABASE_URL = 'https://qgmbzdfnwsdosdqphlxk.supabase.co';
const SUPABASE_KEY = 'sb_publishable_zsJFjfNUO7NKp8ZH5KrXFQ_WZ8Q2Kym';
// 如果全局 sb 不存在，创建本地实例
if (typeof sb === 'undefined') {
    var sb = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
}

// ============================================================
// 全局状态
// ============================================================
var currentNotifType = 'notification'; // 'popup' or 'notification'
var currentAudience = 'all';
var notifList = [];
var searchKeyword = '';

// ============================================================
// 工具函数
// ============================================================
function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/[&<>]/g, function(m) {
        return m === '&' ? '&amp;' : m === '<' ? '&lt;' : m === '>' ? '&gt;' : m;
    });
}

function formatDate(iso) {
    if (!iso) return '-';
    try {
        var d = new Date(iso);
        return d.toLocaleString();
    } catch (e) {
        return iso;
    }
}

function getDefaultSentTime() {
    var now = new Date();
    var offset = now.getTimezoneOffset();
    var local = new Date(now.getTime() - offset * 60000);
    return local.toISOString().slice(0, 16);
}

function getStatusBadge(record) {
    var isSeen = record.status === 'seen';
    return isSeen ?
        '<span class="status-badge-seen">✅ Seen</span>' :
        '<span class="status-badge-unread">⏳ Unread</span>';
}

function getTargetBadge(record) {
    if (record.target_type === 'specific') {
        return '<span class="target-badge-specific"><i class="fas fa-user"></i> Specific</span>';
    }
    return '<span class="target-badge-all"><i class="fas fa-globe"></i> All</span>';
}

// ============================================================
// CRUD 操作
// ============================================================

// 加载通知列表
async function loadNotifications() {
    var tbody = document.getElementById('notifTableBody');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding:30px; color:#6a7a9a;">Loading...</td></tr>';

    try {
        var query = sb.from('user_notifications')
            .select('*')
            .order('created_at', { ascending: false });

        if (searchKeyword) {
            query = query.ilike('target_uid', '%' + searchKeyword + '%');
        }

        if (currentNotifType === 'popup') {
            query = query.eq('type', 'popup');
        } else {
            query = query.eq('type', 'notification');
        }

        var result = await query;
        if (result.error) throw result.error;

        notifList = result.data || [];
        renderTable(notifList);
        updateStats(notifList);

    } catch (e) {
        console.error('加载通知失败:', e);
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding:30px; color:#ff8888;">加载失败: ' +
            escapeHtml(e.message) + '</td></tr>';
    }
}

function renderTable(list) {
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
        row.insertCell(0).innerHTML = '<span style="font-weight:600; color:#c8d2e8; font-size:12px;">' + escapeHtml(uidDisplay) + '</span>';
        row.insertCell(1).innerHTML = '<span style="font-weight:600; color:#d8e0f0;">' + escapeHtml(item.title || '-') + '</span>';
        row.insertCell(2).innerHTML = '<span style="font-size:12px; color:#8892a8;">' + escapeHtml(item.description || '-') + '</span>';
        row.insertCell(3).innerHTML = getTargetBadge(item);

        var sentTime = item.sent_time || item.created_at;
        row.insertCell(4).innerHTML = '<span style="font-size:12px; color:#8892a8;">' + formatDate(sentTime) + '</span>';
        row.insertCell(5).innerHTML = getStatusBadge(item);

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

    // 绑定事件
    document.querySelectorAll('.btn-edit-time').forEach(function(btn) {
        btn.addEventListener('click', function() {
            var id = this.dataset.id;
            var sent = this.dataset.sent || '';
            openEditTimeModal(id, sent);
        });
    });

    document.querySelectorAll('.btn-delete-notif').forEach(function(btn) {
        btn.addEventListener('click', function() {
            var id = this.dataset.id;
            deleteNotification(id);
        });
    });
}

function updateStats(list) {
    var total = list.length;
    var unread = list.filter(function(n) { return n.status !== 'seen'; }).length;
    var seen = list.filter(function(n) { return n.status === 'seen'; }).length;
    document.getElementById('totalNotifCount').textContent = total;
    document.getElementById('unreadNotifCount').textContent = unread;
    document.getElementById('seenNotifCount').textContent = seen;
}

// 创建通知
async function createNotification() {
    var title = document.getElementById('notifTitleInput').value.trim();
    var description = document.getElementById('notifDescInput').value.trim();
    var sentTime = document.getElementById('notifSentTimeInput').value;
    var targetType = currentAudience;
    var targetUid = document.getElementById('notifSpecificUid').value.trim();

    if (!title) {
        showToast('Please enter a title', 'error');
        return;
    }
    if (!description) {
        showToast('Please enter a description', 'error');
        return;
    }
    if (!sentTime) {
        showToast('Please select a sent time', 'error');
        return;
    }
    if (targetType === 'specific' && !targetUid) {
        showToast('Please enter a UID for specific user', 'error');
        return;
    }

    var payload = {
        type: currentNotifType,
        title: title,
        description: description,
        sent_time: new Date(sentTime).toISOString(),
        target_type: targetType,
        target_uid: targetType === 'specific' ? targetUid : null,
        status: 'unread',
        created_at: new Date().toISOString()
    };

    try {
        var result = await sb.from('user_notifications').insert([payload]);
        if (result.error) throw result.error;

        showToast('✅ Notification created successfully', 'success');
        closeCreateModal();
        loadNotifications();

    } catch (e) {
        console.error('创建通知失败:', e);
        showToast('创建失败: ' + e.message, 'error');
    }
}

// 删除通知
async function deleteNotification(id) {
    showConfirm('Delete Notification', 'Are you sure you want to delete this notification?', async function() {
        try {
            var result = await sb.from('user_notifications').delete().eq('id', parseInt(id));
            if (result.error) throw result.error;
            showToast('✅ Notification deleted', 'success');
            loadNotifications();
        } catch (e) {
            showToast('删除失败: ' + e.message, 'error');
        }
    });
}

// 编辑时间
async function saveEditTime() {
    var id = document.getElementById('editNotifId').value;
    var sentTime = document.getElementById('editSentTimeInput').value;

    if (!sentTime) {
        showToast('Please select a sent time', 'error');
        return;
    }

    try {
        var result = await sb.from('user_notifications')
            .update({ sent_time: new Date(sentTime).toISOString() })
            .eq('id', parseInt(id));

        if (result.error) throw result.error;

        showToast('✅ Sent time updated', 'success');
        closeEditTimeModal();
        loadNotifications();

    } catch (e) {
        console.error('更新失败:', e);
        showToast('更新失败: ' + e.message, 'error');
    }
}

// ============================================================
// UI 控制
// ============================================================

function switchNotifType(type) {
    currentNotifType = type;
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
    loadNotifications();
}

function selectAudience(type) {
    currentAudience = type;
    document.querySelectorAll('.audience-option').forEach(function(el) {
        el.classList.remove('active');
    });
    var target = document.querySelector('.audience-option[data-target="' + type + '"]');
    if (target) target.classList.add('active');

    var container = document.getElementById('specificUidContainer');
    if (type === 'specific') {
        container.style.display = 'block';
    } else {
        container.style.display = 'none';
        document.getElementById('notifSpecificUid').value = '';
    }
}

function openCreateModal() {
    document.getElementById('createNotifModal').classList.add('active');
    var defaultTime = getDefaultSentTime();
    document.getElementById('notifSentTimeInput').value = defaultTime;
    document.getElementById('notifTitleInput').value = '';
    document.getElementById('notifDescInput').value = '';
    document.getElementById('notifSpecificUid').value = '';
    selectAudience('all');
}

function closeCreateModal() {
    document.getElementById('createNotifModal').classList.remove('active');
}

function openEditTimeModal(id, sentTime) {
    document.getElementById('editNotifId').value = id;
    var dt = '';
    if (sentTime) {
        try {
            var d = new Date(sentTime);
            var offset = d.getTimezoneOffset();
            var local = new Date(d.getTime() - offset * 60000);
            dt = local.toISOString().slice(0, 16);
        } catch (e) {
            dt = getDefaultSentTime();
        }
    } else {
        dt = getDefaultSentTime();
    }
    document.getElementById('editSentTimeInput').value = dt;
    document.getElementById('editTimeModal').classList.add('active');
}

function closeEditTimeModal() {
    document.getElementById('editTimeModal').classList.remove('active');
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

    // 渲染 HTML 内容
    container.innerHTML = `
        <div class="card" style="background: rgba(12, 16, 28, 0.6); backdrop-filter: blur(16px); border-radius: 20px; border: 1px solid rgba(255,255,255,0.04); padding: 22px 24px;">
            
            <!-- 页面头部 -->
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

            <!-- 统计卡片 -->
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

            <!-- 搜索栏 -->
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

            <!-- 表格 -->
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

        <!-- ===== 创建通知弹窗 ===== -->
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
                    <label style="display: block; font-size: 11px; color: #6a7a92; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; font-weight: 600;">Sent Time <span style="color:#e88080;">*</span></label>
                    <input type="datetime-local" id="notifSentTimeInput" style="width: 100%; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.06); border-radius: 10px; padding: 10px 14px; color: #e6edf5; font-size: 14px; outline: none; transition: 0.2s; font-family: 'Inter', sans-serif; box-sizing: border-box; color-scheme: dark;" />
                </div>
                <div class="form-group" style="margin-bottom: 16px;">
                    <label style="display: block; font-size: 11px; color: #6a7a92; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; font-weight: 600;">Audience</label>
                    <div class="audience-group" style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 6px;">
                        <div class="audience-option active" data-target="all" onclick="selectAudience('all')" style="background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.06); border-radius: 10px; padding: 12px 14px; cursor: pointer; transition: 0.2s; text-align: center; color: #8892a8; font-weight: 500; font-size: 13px;">
                            <span class="icon" style="display: block; font-size: 20px; margin-bottom: 4px;"><i class="fas fa-users"></i></span>
                            All user
                        </div>
                        <div class="audience-option" data-target="specific" onclick="selectAudience('specific')" style="background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.06); border-radius: 10px; padding: 12px 14px; cursor: pointer; transition: 0.2s; text-align: center; color: #8892a8; font-weight: 500; font-size: 13px;">
                            <span class="icon" style="display: block; font-size: 20px; margin-bottom: 4px;"><i class="fas fa-user"></i></span>
                            Specific User
                        </div>
                    </div>
                    <div class="audience-specific-input" id="specificUidContainer" style="display: none; margin-top: 10px;">
                        <input type="text" id="notifSpecificUid" placeholder="Enter UID" style="width: 100%; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.06); border-radius: 10px; padding: 10px 14px; color: #e6edf5; font-size: 14px; outline: none; box-sizing: border-box;">
                    </div>
                </div>
                <div class="modal-actions" style="display: flex; gap: 10px; margin-top: 20px; border-top: 1px solid rgba(255,255,255,0.04); padding-top: 20px;">
                    <button class="btn-cancel" onclick="closeCreateModal()" style="flex: 1; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.06); border-radius: 40px; padding: 10px 0; color: #6a6a80; font-weight: 500; font-size: 14px; cursor: pointer; transition: 0.2s; font-family: 'Inter', sans-serif;">Cancel</button>
                    <button class="btn-confirm" id="createNotifBtn" style="flex: 1; background: rgba(201,176,149,0.06); border: 1px solid rgba(201,176,149,0.12); border-radius: 40px; padding: 10px 0; color: #C9B095; font-weight: 600; font-size: 14px; cursor: pointer; transition: 0.2s; font-family: 'Inter', sans-serif;">Create notification</button>
                </div>
            </div>
        </div>

        <!-- ===== 编辑时间弹窗 ===== -->
        <div id="editTimeModal" class="notif-modal-overlay edit-time-modal" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(7, 11, 26, 0.92); backdrop-filter: blur(14px); z-index: 30000; display: none; align-items: center; justify-content: center;">
            <div class="notif-modal-content" style="background: linear-gradient(160deg, #1a1428, #0e0a1a); border-radius: 24px; padding: 32px 36px 28px; max-width: 420px; width: 92%; border: 1px solid rgba(201,176,149,0.1); box-shadow: 0 24px 60px rgba(0,0,0,0.6); transform: scale(0.92); transition: transform 0.3s cubic-bezier(0.2,0.9,0.4,1.1); max-height: 90vh; overflow-y: auto;">
                <div class="modal-header" style="display: flex; align-items: center; gap: 10px; margin-bottom: 20px;">
                    <span style="display: inline-block; width: 3px; height: 18px; background: linear-gradient(180deg, #C9B095, #b8944a); border-radius: 2px;"></span>
                    <h3 style="font-size: 18px; font-weight: 600; color: #e8e8f0; margin: 0; letter-spacing: 0.3px;">Edit Sent Time</h3>
                </div>
                <div class="form-group" style="margin-bottom: 16px;">
                    <label style="display: block; font-size: 11px; color: #6a7a92; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; font-weight: 600;">Sent Time</label>
                    <input type="datetime-local" id="editSentTimeInput" style="width: 100%; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.06); border-radius: 10px; padding: 10px 14px; color: #e6edf5; font-size: 14px; outline: none; transition: 0.2s; font-family: 'Inter', sans-serif; box-sizing: border-box; color-scheme: dark;" />
                </div>
                <input type="hidden" id="editNotifId" />
                <div class="modal-actions" style="display: flex; gap: 10px; margin-top: 20px; border-top: 1px solid rgba(255,255,255,0.04); padding-top: 20px;">
                    <button class="btn-cancel" onclick="closeEditTimeModal()" style="flex: 1; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.06); border-radius: 40px; padding: 10px 0; color: #6a6a80; font-weight: 500; font-size: 14px; cursor: pointer; transition: 0.2s; font-family: 'Inter', sans-serif;">Cancel</button>
                    <button class="btn-confirm" id="saveEditTimeBtn" style="flex: 1; background: rgba(201,176,149,0.06); border: 1px solid rgba(201,176,149,0.12); border-radius: 40px; padding: 10px 0; color: #C9B095; font-weight: 600; font-size: 14px; cursor: pointer; transition: 0.2s; font-family: 'Inter', sans-serif;">Save</button>
                </div>
            </div>
        </div>
    `;

    // ============================================================
    // 绑定事件
    // ============================================================

    // 类型切换按钮
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
            switchNotifType(type);
        });
    });

    // 搜索
    document.getElementById('notifSearchBtn').addEventListener('click', function() {
        searchKeyword = document.getElementById('notifSearchInput').value.trim();
        loadNotifications();
    });
    document.getElementById('notifSearchInput').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            searchKeyword = document.getElementById('notifSearchInput').value.trim();
            loadNotifications();
        }
    });
    document.getElementById('notifRefreshBtn').addEventListener('click', function() {
        document.getElementById('notifSearchInput').value = '';
        searchKeyword = '';
        loadNotifications();
    });

    // 添加按钮
    document.getElementById('notifAddBtn').addEventListener('click', openCreateModal);

    // 创建确认
    document.getElementById('createNotifBtn').addEventListener('click', createNotification);

    // 编辑时间保存
    document.getElementById('saveEditTimeBtn').addEventListener('click', saveEditTime);

    // 弹窗外部点击关闭
    document.querySelectorAll('.notif-modal-overlay').forEach(function(overlay) {
        overlay.addEventListener('click', function(e) {
            if (e.target === this) {
                this.classList.remove('active');
                this.style.display = 'none';
            }
        });
    });

    // ESC 关闭
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeCreateModal();
            closeEditTimeModal();
        }
    });

    // 加载数据
    loadNotifications();

    console.log('✅ User Notification page loaded');
    console.log('   📌 Type: ' + currentNotifType);
}

// ============================================================
// 暴露全局函数
// ============================================================
window.loadNotificationPage = loadNotificationPage;
window.switchNotifType = switchNotifType;
window.selectAudience = selectAudience;
window.openCreateModal = openCreateModal;
window.closeCreateModal = closeCreateModal;
window.openEditTimeModal = openEditTimeModal;
window.closeEditTimeModal = closeEditTimeModal;
window.createNotification = createNotification;
window.deleteNotification = deleteNotification;
window.saveEditTime = saveEditTime;
window.loadNotifications = loadNotifications;

console.log('✅ admin-notification.js loaded');