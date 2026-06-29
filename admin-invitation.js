// admin-invitation.js - Invitation Codes 管理页面（与 Withdrawal 页面风格一致）
let invitationSearchKeyword = '';
let invitationCurrentPage = 1;
const INVITATION_PAGE_SIZE = 30;
let invitationTotalCount = 0;

async function loadInvitationPage() {
    const container = document.getElementById('page_invitation');
    if (!container) return;
    
    container.innerHTML = `
        <div class="card">
            <!-- 顶部：左侧标题 + 右侧按钮 -->
            <div class="withdraw-header" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; margin-bottom: 24px;">
                <h2 style="font-size: 18px; font-weight: 600; color: #d8e0f0; margin: 0;">
                    <i class="fas fa-qrcode" style="color: #8892a8; margin-right: 10px;"></i>
                    Users Invitation Codes
                </h2>
                <div style="display: flex; gap: 10px; flex-wrap: wrap; align-items: center;">
                    <input type="text" id="invitationSearchInput" class="search-input" placeholder="Search UID / Username / Phone" style="min-width: 180px; width: auto; background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.10); border-radius: 40px; padding: 8px 16px; color: #e6edf5; font-size: 13px; outline: none;">
                    <button id="invitationSearchBtn" class="btn-primary" style="padding: 8px 20px; border-radius: 40px; border: none; background: #2a3a5a; color: #e6edf5; font-weight: 600; cursor: pointer; font-size: 13px; white-space: nowrap;">
                        <i class="fas fa-search"></i> Search
                    </button>
                    <button id="invitationRefreshBtn" class="btn-primary" style="padding: 8px 20px; border-radius: 40px; border: none; background: #2a3a5a; color: #e6edf5; font-weight: 600; cursor: pointer; font-size: 13px; white-space: nowrap;">
                        <i class="fas fa-sync-alt"></i> Refresh
                    </button>
                </div>
            </div>
            
            <!-- 统计卡片 -->
            <div class="stats-grid" style="display: grid; grid-template-columns: repeat(1, 1fr); gap: 16px; margin-bottom: 24px;">
                <div class="stat-item" style="background: rgba(12, 16, 28, 0.6); border-radius: 16px; padding: 16px 20px; text-align: center; border: 1px solid rgba(255,255,255,0.04);">
                    <div class="label" style="font-size: 11px; color: #8892a8; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">TOTAL USERS</div>
                    <div class="value" id="invitationStatTotal" style="font-size: 28px; font-weight: 700; color: #ffffff;">0</div>
                </div>
            </div>
            
            <!-- 表格 -->
            <div class="table-container" style="max-height: 500px; overflow-y: auto; border-radius: 16px; border: 1px solid rgba(255,255,255,0.03);">
                <table class="data-table" style="width: 100%; border-collapse: collapse; font-size: 13px; min-width: 850px;">
                    <thead>
                        <tr>
                            <th style="padding: 14px 14px; color: #a8b4d0; font-weight: 600; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid rgba(255,255,255,0.04); background: rgba(10,14,28,0.3); text-align: left; min-width: 100px;">Phone</th>
                            <th style="padding: 14px 14px; color: #a8b4d0; font-weight: 600; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid rgba(255,255,255,0.04); background: rgba(10,14,28,0.3); text-align: left; min-width: 100px;">Username</th>
                            <th style="padding: 14px 14px; color: #a8b4d0; font-weight: 600; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid rgba(255,255,255,0.04); background: rgba(10,14,28,0.3); text-align: left; min-width: 100px;">User ID</th>
                            <th style="padding: 14px 14px; color: #a8b4d0; font-weight: 600; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid rgba(255,255,255,0.04); background: rgba(10,14,28,0.3); text-align: left; min-width: 100px;">Referrer</th>
                            <th style="padding: 14px 14px; color: #a8b4d0; font-weight: 600; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid rgba(255,255,255,0.04); background: rgba(10,14,28,0.3); text-align: left; min-width: 120px;">Invitation Code</th>
                            <th style="padding: 14px 14px; color: #a8b4d0; font-weight: 600; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid rgba(255,255,255,0.04); background: rgba(10,14,28,0.3); text-align: center; min-width: 100px;">Referral Count</th>
                            <th style="padding: 14px 14px; color: #a8b4d0; font-weight: 600; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid rgba(255,255,255,0.04); background: rgba(10,14,28,0.3); text-align: left; min-width: 120px;">Register Date</th>
                            <th style="padding: 14px 14px; color: #a8b4d0; font-weight: 600; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid rgba(255,255,255,0.04); background: rgba(10,14,28,0.3); text-align: left; min-width: 100px;">Last Online</th>
                        </tr>
                    </thead>
                    <tbody id="invitationTableBody"><tr><td colspan="8" style="text-align:center; padding:30px; color:#6a7a9a;">Loading...</td></tr></tbody>
                </table>
            </div>
            
            <!-- 分页 -->
            <div class="pagination" id="invitationPagination"></div>
        </div>
    `;
    
    // 添加样式
    const style = document.createElement('style');
    style.textContent = `
        .invitation-panel { animation: fadeIn 0.3s ease; }
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(8px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .invitation-copy-btn {
            background: rgba(74,124,255,0.12);
            border: none;
            padding: 2px 10px;
            border-radius: 20px;
            color: #4a7cff;
            cursor: pointer;
            font-size: 10px;
            font-weight: 500;
            transition: 0.2s;
            font-family: 'Inter', sans-serif;
            margin-left: 4px;
        }
        .invitation-copy-btn:hover {
            background: rgba(74,124,255,0.25);
        }
        .invitation-code-text {
            font-family: 'Courier New', monospace;
            font-size: 13px;
            font-weight: 600;
            color: #c8b090;
            letter-spacing: 1px;
        }
        .country-flag-sm {
            width: 16px;
            height: 12px;
            border-radius: 2px;
            object-fit: cover;
            vertical-align: middle;
            border: 1px solid rgba(255,255,255,0.04);
            margin-right: 3px;
            flex-shrink: 0;
        }
        .country-name-text {
            font-size: 11px;
            font-weight: 500;
            color: rgba(255,255,255,0.65);
            letter-spacing: 0.3px;
            vertical-align: middle;
        }
        @media (max-width: 768px) {
            .stats-grid { grid-template-columns: 1fr !important; }
            .search-bar { flex-direction: column; align-items: stretch; }
            .search-bar input { width: 100% !important; min-width: unset; flex: 1 1 auto !important; }
        }
    `;
    document.head.appendChild(style);
    
    // 绑定搜索事件
    document.getElementById('invitationSearchBtn')?.addEventListener('click', function() {
        invitationSearchKeyword = document.getElementById('invitationSearchInput').value.trim();
        invitationCurrentPage = 1;
        loadInvitationUsers();
    });
    
    document.getElementById('invitationSearchInput')?.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            invitationSearchKeyword = document.getElementById('invitationSearchInput').value.trim();
            invitationCurrentPage = 1;
            loadInvitationUsers();
        }
    });
    
    document.getElementById('invitationRefreshBtn')?.addEventListener('click', function() {
        document.getElementById('invitationSearchInput').value = '';
        invitationSearchKeyword = '';
        invitationCurrentPage = 1;
        loadInvitationUsers();
    });
    
    // 加载数据
    await loadInvitationUsers();
}

// ============================================================
// 加载邀请码用户列表
// ============================================================
async function loadInvitationUsers() {
    const tbody = document.getElementById('invitationTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = '<tr><td colspan="8" style="text-align:center; padding:30px; color:#6a7a9a;">Loading...</td></tr>';
    
    try {
        // 获取所有用户（包含受邀人信息）
        let query = sb.from('users')
            .select('*', { count: 'exact' })
            .order('created_at', { ascending: false });
        
        if (invitationSearchKeyword) {
            query = query.or(`uid.ilike.%${invitationSearchKeyword}%,username.ilike.%${invitationSearchKeyword}%,phone.ilike.%${invitationSearchKeyword}%`);
        }
        
        const { data: users, error, count } = await query
            .range(
                (invitationCurrentPage - 1) * INVITATION_PAGE_SIZE,
                invitationCurrentPage * INVITATION_PAGE_SIZE - 1
            );
        
        if (error) throw error;
        
        invitationTotalCount = count || 0;
        document.getElementById('invitationStatTotal').innerText = invitationTotalCount;
        
        if (!users || users.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" style="text-align:center; padding:30px; color:#6a7a9a;">No users found</td></tr>';
            renderInvitationPagination();
            return;
        }
        
        // ============================================================
        // 批量获取所有用户的推荐人数（一次查询）
        // ============================================================
        const uids = users.map(function(u) { return u.uid; });
        const { data: refCounts } = await sb
            .from('users')
            .select('invited_by')
            .in('invited_by', uids);
        
        const refCountMap = {};
        if (refCounts) {
            refCounts.forEach(function(u) {
                refCountMap[u.invited_by] = (refCountMap[u.invited_by] || 0) + 1;
            });
        }
        
        // ============================================================
        // 批量获取邀请人的用户名（一次查询）
        // ============================================================
        const invitedByUids = users
            .map(function(u) { return u.invited_by; })
            .filter(function(id) { return id && id !== ''; });
        
        const { data: inviterUsers } = await sb
            .from('users')
            .select('uid, username')
            .in('uid', invitedByUids);
        
        const inviterMap = {};
        if (inviterUsers) {
            inviterUsers.forEach(function(u) {
                inviterMap[u.uid] = u.username;
            });
        }
        
        tbody.innerHTML = '';
        
        for (const user of users) {
            const row = tbody.insertRow();
            
            const referralCount = refCountMap[user.uid] || 0;
            const referrerName = user.invited_by ? (inviterMap[user.invited_by] || user.invited_by_username || '-') : '-';
            
            // 注册日期
            const registerDate = user.created_at ? new Date(user.created_at).toLocaleDateString() : '-';
            
            // Last Online
            const lastOnline = user.last_online || user.updated_at || user.created_at;
            let lastOnlineDisplay = '-';
            if (lastOnline) {
                const lastDate = new Date(lastOnline);
                const now = new Date();
                const diffMins = Math.floor((now - lastDate) / 60000);
                if (diffMins < 1) lastOnlineDisplay = 'Just now';
                else if (diffMins < 60) lastOnlineDisplay = diffMins + 'm ago';
                else if (diffMins < 1440) lastOnlineDisplay = Math.floor(diffMins / 60) + 'h ago';
                else if (diffMins < 10080) lastOnlineDisplay = Math.floor(diffMins / 1440) + 'd ago';
                else lastOnlineDisplay = lastDate.toLocaleDateString();
            }
            
            // Phone
            row.insertCell(0).innerHTML = `<span style="font-size:12px; color:#b0c0da;">${escapeHtml(user.phone || '-')}</span>`;
            
            // Username
            row.insertCell(1).innerHTML = `<span style="font-weight:500; color:#d8e0f0;">${escapeHtml(user.username)}</span>`;
            
            // User ID
            row.insertCell(2).innerHTML = `<span class="badge" style="background: rgba(255,255,255,0.08); padding: 2px 12px; border-radius: 20px; font-size: 11px; color: #c8d2e8; border: 1px solid rgba(255,255,255,0.06);">${escapeHtml(user.uid)}</span>`;
            
            // Referrer
            row.insertCell(3).innerHTML = `<span style="font-size:12px; color:rgba(255,255,255,0.5);">${escapeHtml(referrerName)}</span>`;
            
            // Invitation Code (带复制按钮)
            const inviteCode = user.invite_code || '-';
            row.insertCell(4).innerHTML = `
                <span style="display: flex; align-items: center; gap: 6px;">
                    <span class="invitation-code-text">${escapeHtml(inviteCode)}</span>
                    ${inviteCode !== '-' ? `<button class="invitation-copy-btn" onclick="copyInvitationCode('${escapeHtml(inviteCode)}')"><i class="fas fa-copy"></i></button>` : ''}
                </span>
            `;
            
            // Referral Count
            row.insertCell(5).innerHTML = `<span style="font-weight:600; color:#c8b090; text-align:center; display:block;">${referralCount}</span>`;
            
            // Register Date
            row.insertCell(6).innerHTML = `<span style="font-size:12px; color:rgba(255,255,255,0.4);">${registerDate}</span>`;
            
            // Last Online
            row.insertCell(7).innerHTML = `<span style="font-size:11px; color:rgba(255,255,255,0.4);">${lastOnlineDisplay}</span>`;
        }
        
        renderInvitationPagination();
        
    } catch (e) {
        console.error('加载邀请码用户列表失败:', e);
        tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; padding:30px; color:#ff8888;">加载失败: ${escapeHtml(e.message)}</td></tr>`;
    }
}

// ============================================================
// 复制邀请码
// ============================================================
window.copyInvitationCode = function(code) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(code).then(function() {
            showToast('Invitation code copied!', 'success');
        }).catch(function() {
            fallbackCopy(code);
        });
    } else {
        fallbackCopy(code);
    }
};

function fallbackCopy(text) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.left = '-9999px';
    textarea.style.top = '-9999px';
    document.body.appendChild(textarea);
    textarea.select();
    try {
        document.execCommand('copy');
        showToast('Invitation code copied!', 'success');
    } catch (e) {
        showToast('Copy failed, please copy manually', 'error');
    }
    textarea.remove();
}

// ============================================================
// 分页渲染
// ============================================================
function renderInvitationPagination() {
    const container = document.getElementById('invitationPagination');
    if (!container) return;
    
    container.innerHTML = '';
    const totalPages = Math.ceil(invitationTotalCount / INVITATION_PAGE_SIZE);
    
    if (totalPages <= 1) return;
    
    // Previous
    const prevBtn = document.createElement('button');
    prevBtn.textContent = 'Previous';
    prevBtn.className = 'date-filter-btn';
    prevBtn.disabled = invitationCurrentPage <= 1;
    prevBtn.onclick = function() {
        if (invitationCurrentPage > 1) {
            invitationCurrentPage--;
            loadInvitationUsers();
        }
    };
    container.appendChild(prevBtn);
    
    // Page numbers
    const startPage = Math.max(1, invitationCurrentPage - 2);
    const endPage = Math.min(totalPages, invitationCurrentPage + 2);
    
    for (let i = startPage; i <= endPage; i++) {
        const btn = document.createElement('button');
        btn.textContent = i;
        btn.className = 'date-filter-btn' + (i === invitationCurrentPage ? ' active' : '');
        btn.onclick = function() {
            invitationCurrentPage = i;
            loadInvitationUsers();
        };
        container.appendChild(btn);
    }
    
    // Next
    const nextBtn = document.createElement('button');
    nextBtn.textContent = 'Next';
    nextBtn.className = 'date-filter-btn';
    nextBtn.disabled = invitationCurrentPage >= totalPages;
    nextBtn.onclick = function() {
        if (invitationCurrentPage < totalPages) {
            invitationCurrentPage++;
            loadInvitationUsers();
        }
    };
    container.appendChild(nextBtn);
}

// ============================================================
// 工具函数
// ============================================================
function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

// 暴露全局
window.loadInvitationPage = loadInvitationPage;