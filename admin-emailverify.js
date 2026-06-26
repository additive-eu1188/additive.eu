// admin-emailverify.js - 邮箱验证管理页面（与 Withdrawal/KYC 风格一致）
let activeEmailTab = 'pending';
let emailSearchKeyword = '';

async function loadEmailVerifyPage() {
    const container = document.getElementById('page_emailverify');
    if (!container) return;
    
    container.innerHTML = `
        <div class="card">
            <!-- 顶部：左侧标题 + 右侧按钮 -->
            <div class="withdraw-header" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; margin-bottom: 24px;">
                <h2 style="font-size: 18px; font-weight: 600; color: #d8e0f0; margin: 0;">
                    <i class="fas fa-envelope" style="color: #8892a8; margin-right: 10px;"></i>
                    REGISTRATION EMAIL VERIFICATION
                </h2>
                <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                    <button id="emailTabPending" class="tab-email-btn active" data-tab="pending"><i class="fas fa-list-ul"></i> Pending</button>
                    <button id="emailTabHistory" class="tab-email-btn" data-tab="history"><i class="fas fa-history"></i> Email Verification History</button>
                    <button id="refreshEmailBtn" class="btn-primary"><i class="fas fa-sync-alt"></i> Refresh</button>
                </div>
            </div>
            
            <!-- 待处理面板 -->
            <div id="emailPendingPanel" class="email-panel">
                <!-- 统计卡片 -->
                <div class="stats-grid" style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; margin-bottom: 24px;">
                    <div class="stat-item" style="background: rgba(12, 16, 28, 0.6); border-radius: 16px; padding: 16px 20px; text-align: center; border: 1px solid rgba(255,255,255,0.04);">
                        <div class="label" style="font-size: 11px; color: #8892a8; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">TOTAL EMAIL VERIFICATION</div>
                        <div class="value" id="emailStatTotal" style="font-size: 28px; font-weight: 700; color: #ffffff;">0</div>
                    </div>
                    <div class="stat-item" style="background: rgba(12, 16, 28, 0.6); border-radius: 16px; padding: 16px 20px; text-align: center; border: 1px solid rgba(255,255,255,0.04);">
                        <div class="label" style="font-size: 11px; color: #8892a8; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">PENDING EMAIL VERIFICATION</div>
                        <div class="value" id="emailStatPending" style="font-size: 28px; font-weight: 700; color: #ffffff;">0</div>
                    </div>
                </div>
                
                <!-- 搜索栏 -->
                <div class="search-bar" style="display: flex; flex-wrap: wrap; gap: 10px; align-items: center; background: rgba(8, 12, 24, 0.5); border-radius: 16px; padding: 12px 16px; margin-bottom: 20px; border: 1px solid rgba(255,255,255,0.03);">
                    <input type="text" id="emailSearchInput" class="search-input" placeholder="Search email / phone" style="flex: 1; min-width: 160px; background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.10); border-radius: 40px; padding: 8px 16px; color: #e6edf5; font-size: 13px; outline: none;">
                    <button id="emailSearchBtn" class="btn-primary" style="padding: 8px 20px; border-radius: 40px; border: none; background: #2a3a5a; color: #e6edf5; font-weight: 600; cursor: pointer; font-size: 13px; white-space: nowrap;"><i class="fas fa-search"></i> Search</button>
                </div>
                
                <div class="table-container" style="max-height: 500px; overflow-y: auto; border-radius: 16px; border: 1px solid rgba(255,255,255,0.03);">
                    <table class="data-table" style="width: 100%; border-collapse: collapse; font-size: 13px; min-width: 1020px;">
                        <thead>
                            <tr>
                                <th style="padding: 14px 14px; color: #a8b4d0; font-weight: 600; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid rgba(255,255,255,0.04); background: rgba(10,14,28,0.3); text-align: left; min-width: 120px;">PHONE NUMBER</th>
                                <th style="padding: 14px 14px; color: #a8b4d0; font-weight: 600; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid rgba(255,255,255,0.04); background: rgba(10,14,28,0.3); text-align: left; min-width: 200px;">EMAIL ADDRESS</th>
                                <th style="padding: 14px 14px; color: #a8b4d0; font-weight: 600; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid rgba(255,255,255,0.04); background: rgba(10,14,28,0.3); text-align: left; min-width: 160px;">REQUEST TIME</th>
                                <th style="padding: 14px 14px; color: #a8b4d0; font-weight: 600; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid rgba(255,255,255,0.04); background: rgba(10,14,28,0.3); text-align: left; min-width: 160px;">EXPIRED TIME</th>
                                <th style="padding: 14px 14px; color: #a8b4d0; font-weight: 600; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid rgba(255,255,255,0.04); background: rgba(10,14,28,0.3); text-align: left; min-width: 150px;">SET TAC</th>
                                <th style="padding: 14px 14px; color: #a8b4d0; font-weight: 600; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid rgba(255,255,255,0.04); background: rgba(10,14,28,0.3); text-align: left; min-width: 120px;">ACTIONS</th>
                            </tr>
                        </thead>
                        <tbody id="emailTableBody"><tr><td colspan="6" style="text-align:center; padding:30px; color:#6a7a9a;">Loading...</td></tr></tbody>
                    </table>
                </div>
            </div>
            
            <!-- 历史记录面板 -->
            <div id="emailHistoryPanel" class="email-panel" style="display: none;">
                <!-- 统计卡片 -->
                <div class="stats-grid" style="display: grid; grid-template-columns: repeat(1, 1fr); gap: 16px; margin-bottom: 24px;">
                    <div class="stat-item" style="background: rgba(12, 16, 28, 0.6); border-radius: 16px; padding: 16px 20px; text-align: center; border: 1px solid rgba(255,255,255,0.04);">
                        <div class="label" style="font-size: 11px; color: #8892a8; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">TOTAL EMAIL VERIFICATION</div>
                        <div class="value" id="emailHistoryStatTotal" style="font-size: 28px; font-weight: 700; color: #ffffff;">0</div>
                    </div>
                </div>
                
                <!-- 搜索栏 -->
                <div class="search-bar" style="display: flex; flex-wrap: wrap; gap: 10px; align-items: center; background: rgba(8, 12, 24, 0.5); border-radius: 16px; padding: 12px 16px; margin-bottom: 20px; border: 1px solid rgba(255,255,255,0.03);">
                    <input type="text" id="emailHistorySearchInput" class="search-input" placeholder="Search email / phone" style="flex: 1; min-width: 160px; background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.10); border-radius: 40px; padding: 8px 16px; color: #e6edf5; font-size: 13px; outline: none;">
                    <button id="emailHistorySearchBtn" class="btn-primary" style="padding: 8px 20px; border-radius: 40px; border: none; background: #2a3a5a; color: #e6edf5; font-weight: 600; cursor: pointer; font-size: 13px; white-space: nowrap;"><i class="fas fa-search"></i> Search</button>
                    <button id="emailHistoryClearBtn" class="btn-primary" style="padding: 8px 18px; border-radius: 40px; border: none; background: rgba(255,255,255,0.06); color: #b8c4de; font-weight: 500; cursor: pointer; font-size: 13px; white-space: nowrap;"><i class="fas fa-times"></i> Clear</button>
                </div>
                
                <div class="table-container" style="max-height: 500px; overflow-y: auto; border-radius: 16px; border: 1px solid rgba(255,255,255,0.03);">
                    <table class="data-table" style="width: 100%; border-collapse: collapse; font-size: 13px; min-width: 1020px;">
                        <thead>
                            <tr>
                                <th style="padding: 14px 14px; color: #a8b4d0; font-weight: 600; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid rgba(255,255,255,0.04); background: rgba(10,14,28,0.3); text-align: left; min-width: 120px;">PHONE NUMBER</th>
                                <th style="padding: 14px 14px; color: #a8b4d0; font-weight: 600; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid rgba(255,255,255,0.04); background: rgba(10,14,28,0.3); text-align: left; min-width: 200px;">EMAIL ADDRESS</th>
                                <th style="padding: 14px 14px; color: #a8b4d0; font-weight: 600; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid rgba(255,255,255,0.04); background: rgba(10,14,28,0.3); text-align: left; min-width: 100px;">USER ID</th>
                                <th style="padding: 14px 14px; color: #a8b4d0; font-weight: 600; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid rgba(255,255,255,0.04); background: rgba(10,14,28,0.3); text-align: left; min-width: 120px;">TAC</th>
                                <th style="padding: 14px 14px; color: #a8b4d0; font-weight: 600; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid rgba(255,255,255,0.04); background: rgba(10,14,28,0.3); text-align: left; min-width: 160px;">REQUEST TIME</th>
                                <th style="padding: 14px 14px; color: #a8b4d0; font-weight: 600; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid rgba(255,255,255,0.04); background: rgba(10,14,28,0.3); text-align: left; min-width: 160px;">LOGGED IN TIME</th>
                            </tr>
                        </thead>
                        <tbody id="emailHistoryTableBody"><tr><td colspan="6" style="text-align:center; padding:30px; color:#6a7a9a;">Loading...</td></tr></tbody>
                    </table>
                </div>
            </div>
        </div>
    `;
    
    // 添加样式
    const style = document.createElement('style');
    style.textContent = `
        .tab-email-btn {
            background: rgba(255,255,255,0.04);
            border: 1px solid rgba(255,255,255,0.06);
            border-radius: 30px;
            padding: 8px 20px;
            color: #8892a8;
            cursor: pointer;
            transition: all 0.2s;
            font-size: 14px;
            font-weight: 500;
            font-family: 'Inter', sans-serif;
        }
        .tab-email-btn:hover {
            background: rgba(255,255,255,0.08);
            color: #e6edf5;
        }
        .tab-email-btn.active {
            background: #2a3a5a;
            color: #e6edf5;
            border-color: #3a5a7a;
        }
        .email-panel { animation: fadeIn 0.3s ease; }
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(8px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .btn-sm-action {
            padding: 4px 12px;
            font-size: 11px;
            border: none;
            border-radius: 40px;
            color: #fff;
            cursor: pointer;
            transition: 0.2s;
            margin-right: 4px;
            font-weight: 600;
        }
        .btn-sm-action:hover { opacity: 0.85; }
        .btn-set-tac { background: rgba(74, 124, 255, 0.15); color: #4a7cff; }
        .btn-set-tac:hover { background: rgba(74, 124, 255, 0.25); }
        .tac-input {
            width: 120px;
            background: rgba(255,255,255,0.06);
            border: 1px solid rgba(255,255,255,0.10);
            border-radius: 8px;
            padding: 6px 10px;
            color: #e6edf5;
            font-size: 14px;
            text-align: center;
            letter-spacing: 2px;
            font-family: 'Courier New', monospace;
            outline: none;
            transition: 0.2s;
        }
        .tac-input:focus {
            border-color: #4a7cff;
            background: rgba(255,255,255,0.08);
        }
        .tac-input::placeholder {
            color: rgba(255,255,255,0.15);
            letter-spacing: 0px;
            font-family: 'Inter', sans-serif;
        }
        .status-badge-verified {
            background: rgba(122, 208, 176, 0.10);
            color: #7ad0b0;
            padding: 2px 12px;
            border-radius: 40px;
            font-size: 11px;
            display: inline-block;
        }
        .status-badge-pending {
            background: rgba(212, 192, 154, 0.10);
            color: #d4c09a;
            padding: 2px 12px;
            border-radius: 40px;
            font-size: 11px;
            display: inline-block;
        }
        .status-badge-expired {
            background: rgba(232, 128, 128, 0.10);
            color: #e88080;
            padding: 2px 12px;
            border-radius: 40px;
            font-size: 11px;
            display: inline-block;
        }
        @media (max-width: 768px) {
            .stats-grid { grid-template-columns: repeat(2, 1fr) !important; }
            .tab-email-btn { font-size: 12px; padding: 6px 14px; }
            .search-bar { flex-direction: column; align-items: stretch; }
            .search-bar input, .search-bar select { width: 100% !important; min-width: unset; flex: 1 1 auto !important; }
            .tac-input { width: 100%; }
        }
    `;
    document.head.appendChild(style);
    
    // 绑定标签切换
    document.getElementById('emailTabPending')?.addEventListener('click', function() { switchEmailTab('pending'); });
    document.getElementById('emailTabHistory')?.addEventListener('click', function() { switchEmailTab('history'); });
    document.getElementById('refreshEmailBtn')?.addEventListener('click', function() {
        loadEmailPending();
        loadEmailHistory();
        updateEmailStats();
    });
    
    // 绑定待处理搜索
    document.getElementById('emailSearchBtn')?.addEventListener('click', function() {
        emailSearchKeyword = document.getElementById('emailSearchInput').value.trim();
        loadEmailPending();
    });
    document.getElementById('emailSearchInput')?.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            emailSearchKeyword = document.getElementById('emailSearchInput').value.trim();
            loadEmailPending();
        }
    });
    
    // 绑定历史搜索
    document.getElementById('emailHistorySearchBtn')?.addEventListener('click', function() {
        emailSearchKeyword = document.getElementById('emailHistorySearchInput').value.trim();
        loadEmailHistory();
    });
    document.getElementById('emailHistoryClearBtn')?.addEventListener('click', function() {
        document.getElementById('emailHistorySearchInput').value = '';
        emailSearchKeyword = '';
        loadEmailHistory();
    });
    document.getElementById('emailHistorySearchInput')?.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            emailSearchKeyword = document.getElementById('emailHistorySearchInput').value.trim();
            loadEmailHistory();
        }
    });
    
    // 加载数据
    await loadEmailPending();
    await loadEmailHistory();
    await updateEmailStats();
}

function switchEmailTab(tab) {
    activeEmailTab = tab;
    document.getElementById('emailTabPending').classList.toggle('active', tab === 'pending');
    document.getElementById('emailTabHistory').classList.toggle('active', tab === 'history');
    document.getElementById('emailPendingPanel').style.display = tab === 'pending' ? 'block' : 'none';
    document.getElementById('emailHistoryPanel').style.display = tab === 'history' ? 'block' : 'none';
    
    if (tab === 'pending') {
        loadEmailPending();
    } else {
        loadEmailHistory();
    }
}

async function updateEmailStats() {
    try {
        const totalRes = await sb.from('email_verification_requests').select('id', { count: 'exact', head: true });
        const pendingRes = await sb.from('email_verification_requests').select('id', { count: 'exact', head: true })
            .eq('is_verified', false)
            .is('code', null);
        const historyRes = await sb.from('email_verification_requests').select('id', { count: 'exact', head: true })
            .eq('is_verified', true);
        
        // Pending 页面 - 2 个卡片
        document.getElementById('emailStatTotal').innerText = totalRes.count || 0;
        document.getElementById('emailStatPending').innerText = pendingRes.count || 0;
        
        // History 页面 - 1 个卡片
        document.getElementById('emailHistoryStatTotal').innerText = historyRes.count || 0;
    } catch (e) {
        console.error('更新Email统计失败:', e);
    }
}

async function getPhoneByUid(uid) {
    try {
        const { data } = await sb.from('users').select('phone').eq('uid', uid).single();
        return data?.phone || '-';
    } catch (e) {
        return '-';
    }
}

async function getUserByEmail(email) {
    try {
        const { data } = await sb.from('users').select('uid, phone').eq('email', email).single();
        return data || null;
    } catch (e) {
        return null;
    }
}

async function loadEmailPending() {
    const tbody = document.getElementById('emailTableBody');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:30px; color:#6a7a9a;">Loading...</td></tr>';
    
    try {
        let query = sb.from('email_verification_requests')
            .select('*')
            .eq('is_verified', false)
            .is('code', null)
            .order('requested_at', { ascending: false });
        
        const keyword = document.getElementById('emailSearchInput')?.value.trim() || '';
        if (keyword) {
            query = query.ilike('email', `%${keyword}%`);
        }
        
        const { data: emailList } = await query;
        
        if (!emailList || emailList.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:30px; color:#6a7a9a;">No pending email verification</td></tr>';
            return;
        }
        
        // ✅ 优化：批量获取所有用户信息（一次查询）
        const emails = emailList.map(item => item.email);
        const { data: users } = await sb
            .from('users')
            .select('email, phone')
            .in('email', emails);
        
        // 创建 email -> phone 的映射表
        const phoneMap = {};
        if (users) {
            users.forEach(user => {
                phoneMap[user.email] = user.phone || '-';
            });
        }
        
        tbody.innerHTML = '';
        for (const item of emailList) {
            const row = tbody.insertRow();
            
            // ✅ 从内存中获取手机号，不再查询数据库
            const phone = phoneMap[item.email] || '-';
            
            const requestTime = item.requested_at ? new Date(item.requested_at).toLocaleString() : '-';
            const expireTime = item.expires_at ? new Date(item.expires_at).toLocaleString() : '-';
            const isExpired = item.expires_at ? new Date(item.expires_at) < new Date() : false;
            
            row.insertCell(0).innerHTML = `<span style="font-size:12px; color:#b0c0da;">${escapeHtml(phone)}</span>`;
            row.insertCell(1).innerHTML = `<span style="font-weight:500; color:#d8e0f0;">${escapeHtml(item.email)}</span>`;
            row.insertCell(2).innerHTML = `<span style="font-size:12px; color:#8892a8;">${requestTime}</span>`;
            row.insertCell(3).innerHTML = `<span style="font-size:12px; color:${isExpired ? '#e88080' : '#8892a8'};">${expireTime}${isExpired ? ' ⚠️' : ''}</span>`;
            row.insertCell(4).innerHTML = `
                <input type="text" class="tac-input" id="tac_${item.id}" placeholder="6 digits" maxlength="6" value="${item.code || ''}" 
                    style="width:120px; background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.10); border-radius:8px; padding:6px 10px; color:#e6edf5; font-size:14px; text-align:center; letter-spacing:2px; font-family:'Courier New', monospace; outline:none; transition:0.2s;">
            `;
            row.insertCell(5).innerHTML = `
                <button class="btn-sm-action btn-set-tac set-tac-btn" data-id="${item.id}" data-email="${item.email}" ${isExpired ? 'disabled style="opacity:0.4;cursor:not-allowed;"' : ''}>
                    <i class="fas fa-check"></i> SET TAC
                </button>
                ${isExpired ? '<span class="status-badge-expired">Expired</span>' : ''}
            `;
        }
        
        // 绑定 SET TAC 事件（保持不变）
        document.querySelectorAll('.set-tac-btn').forEach(btn => {
            btn.addEventListener('click', async function() {
                const id = this.dataset.id;
                const email = this.dataset.email;
                const tacInput = document.getElementById(`tac_${id}`);
                const code = tacInput.value.trim();
                
                if (!code) {
                    showToast('Please enter 6-digit TAC code', 'error');
                    return;
                }
                if (!/^\d{6}$/.test(code)) {
                    showToast('TAC must be exactly 6 digits', 'error');
                    return;
                }
                
                const { error: updateError } = await sb
                    .from('email_verification_requests')
                    .update({ 
                        code: code,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', parseInt(id));
                
                if (updateError) {
                    showToast('Failed to set TAC: ' + updateError.message, 'error');
                    return;
                }
                
                showToast(`✅ TAC set for ${email}`, 'success');
                await loadEmailPending();
                await loadEmailHistory();
                await updateEmailStats();
            });
        });
        
        // TAC 输入框 Enter 键触发
        document.querySelectorAll('.tac-input').forEach(input => {
            input.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    const btn = this.closest('tr').querySelector('.set-tac-btn');
                    if (btn) btn.click();
                }
            });
        });
        
    } catch (e) {
        console.error('加载Email待处理失败:', e);
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:30px; color:#ff8888;">加载失败: ${escapeHtml(e.message)}</td></tr>`;
    }
}

async function loadEmailHistory() {
    const tbody = document.getElementById('emailHistoryTableBody');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:30px; color:#6a7a9a;">Loading...</td></tr>';
    
    try {
        let query = sb.from('email_verification_requests')
            .select('*')
            .eq('is_verified', true)
            .order('verified_at', { ascending: false })
            .limit(200);
        
        const keyword = document.getElementById('emailHistorySearchInput')?.value.trim() || '';
        if (keyword) {
            query = query.ilike('email', `%${keyword}%`);
        }
        
        const { data: historyList } = await query;
        
        if (!historyList || historyList.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:30px; color:#6a7a9a;">No verification history</td></tr>';
            return;
        }
        
        // ============================================================
        // ✅ 优化：批量获取所有用户信息（一次查询）
        // ============================================================
        const emails = historyList.map(item => item.email);
        const { data: users } = await sb
            .from('users')
            .select('email, uid, phone')
            .in('email', emails);
        
        // 创建 email -> user 的映射表
        const userMap = {};
        if (users) {
            users.forEach(user => {
                userMap[user.email] = user;
            });
        }
        
        tbody.innerHTML = '';
        for (const item of historyList) {
            const row = tbody.insertRow();
            
            // ✅ 从内存中获取用户信息，不再查询数据库
            const user = userMap[item.email] || null;
            const phone = user?.phone || '-';
            const uid = user?.uid || '-';
            
            const requestTime = item.requested_at ? new Date(item.requested_at).toLocaleString() : '-';
            const verifiedTime = item.verified_at ? new Date(item.verified_at).toLocaleString() : '-';
            
            row.insertCell(0).innerHTML = `<span style="font-size:12px; color:#b0c0da;">${escapeHtml(phone)}</span>`;
            row.insertCell(1).innerHTML = `<span style="font-weight:500; color:#d8e0f0;">${escapeHtml(item.email)}</span>`;
            row.insertCell(2).innerHTML = `<span class="badge" style="background: rgba(255,255,255,0.08); padding: 2px 12px; border-radius: 20px; font-size: 11px; color: #c8d2e8; border: 1px solid rgba(255,255,255,0.06);">${escapeHtml(uid)}</span>`;
            row.insertCell(3).innerHTML = `<span style="font-weight:600; font-size:14px; color:#4a7cff; font-family:'Courier New', monospace; letter-spacing:2px;">${escapeHtml(item.code || '-')}</span>`;
            row.insertCell(4).innerHTML = `<span style="font-size:12px; color:#8892a8;">${requestTime}</span>`;
            row.insertCell(5).innerHTML = `<span style="font-size:12px; color:#7ad0b0;">${verifiedTime}</span>`;
        }
        
    } catch (e) {
        console.error('加载Email历史失败:', e);
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:30px; color:#ff8888;">加载失败: ${escapeHtml(e.message)}</td></tr>`;
    }
}

function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

window.loadEmailVerifyPage = loadEmailVerifyPage;