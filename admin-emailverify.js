// admin-emailverify.js - 邮箱验证管理页面（一键发送邮件）
let activeEmailTab = 'pending';
let emailSearchKeyword = '';

// ============================================================
// 🔥 邮件模板配置（完全按您的要求设置）
// ============================================================
const EMAIL_TEMPLATE = {
    subject: 'Verification Code For Your Additive\'s Account',
    body: `Dear User,

We have received a request to verify your identity for access to your account.
Please use the verification code below to complete the process:

[VERIFICATION_CODE]

For your security, this code will expire in 10 minutes and can only be used once.
If you did not request this verification, please ignore this email or contact our support team immediately.

Sincerely,
Additive Digital Marketing Account Security Team
SecureAccess Services`
};

// ============================================================
// 🔥 生成6位数随机TAC
// ============================================================
function generateTAC() {
    const num = Math.floor(Math.random() * 1000000);
    return String(num).padStart(6, '0');
}

// ============================================================
// 🔥 一键发送邮件 - 自动生成TAC + 跳转Gmail
// ============================================================
function sendVerificationEmail(email, requestId) {
    if (!email) {
        showToast('❌ No email address provided', 'error');
        return;
    }

    // 1. 生成6位数TAC
    const tacCode = generateTAC();
    console.log('📧 生成TAC:', tacCode, 'for:', email);

    // 2. 替换邮件模板中的 [VERIFICATION_CODE]
    let subject = EMAIL_TEMPLATE.subject;
    let body = EMAIL_TEMPLATE.body;
    body = body.replace(/\[VERIFICATION_CODE\]/g, tacCode);

    // 3. 构建 Gmail 链接
    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(email)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    
    // 4. 打开 Gmail（新窗口）
    window.open(gmailUrl, '_blank');

    // 5. 将TAC保存到数据库
    saveTACToDatabase(requestId, tacCode, email);

    showToast(`✅ TAC: ${tacCode} | Gmail opened for ${email}`, 'success');
}

// ============================================================
// 🔥 将TAC保存到数据库
// ============================================================
async function saveTACToDatabase(requestId, code, email) {
    try {
        const { error } = await sb
            .from('email_verification_requests')
            .update({ 
                code: code,
                updated_at: new Date().toISOString()
            })
            .eq('id', parseInt(requestId));

        if (error) {
            console.error('❌ 保存TAC失败:', error);
            showToast('⚠️ TAC generated but failed to save', 'warning');
            return;
        }

        console.log('✅ TAC saved to database:', code);
        
        // 刷新列表
        await loadEmailPending();
        await loadEmailHistory();
        await updateEmailStats();

    } catch (e) {
        console.error('❌ 保存TAC异常:', e);
    }
}

async function loadEmailVerifyPage() {
    const container = document.getElementById('page_emailverify');
    if (!container) return;
    
    container.innerHTML = `
        <div class="card">
            <!-- 顶部 -->
            <div class="withdraw-header" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; margin-bottom: 24px;">
                <h2 style="font-size: 18px; font-weight: 600; color: #d8e0f0; margin: 0;">
                    <i class="fas fa-envelope" style="color: #8892a8; margin-right: 10px;"></i>
                    REGISTRATION EMAIL VERIFICATION
                </h2>
                <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                    <button id="emailTabPending" class="tab-email-btn active" data-tab="pending"><i class="fas fa-list-ul"></i> Pending</button>
                    <button id="emailTabHistory" class="tab-email-btn" data-tab="history"><i class="fas fa-history"></i> History</button>
                    <button id="refreshEmailBtn" class="btn-primary"><i class="fas fa-sync-alt"></i> Refresh</button>
                </div>
            </div>
            
            <!-- 待处理面板 -->
            <div id="emailPendingPanel" class="email-panel">
                <!-- 统计卡片 -->
                <div class="stats-grid" style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; margin-bottom: 24px;">
                    <div class="stat-item" style="background: rgba(12, 16, 28, 0.6); border-radius: 16px; padding: 16px 20px; text-align: center; border: 1px solid rgba(255,255,255,0.04);">
                        <div class="label" style="font-size: 11px; color: #8892a8; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">TOTAL REQUESTS</div>
                        <div class="value" id="emailStatTotal" style="font-size: 28px; font-weight: 700; color: #ffffff;">0</div>
                    </div>
                    <div class="stat-item" style="background: rgba(12, 16, 28, 0.6); border-radius: 16px; padding: 16px 20px; text-align: center; border: 1px solid rgba(255,255,255,0.04);">
                        <div class="label" style="font-size: 11px; color: #8892a8; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">PENDING</div>
                        <div class="value" id="emailStatPending" style="font-size: 28px; font-weight: 700; color: #ffffff;">0</div>
                    </div>
                </div>
                
                <!-- 搜索栏 -->
                <div class="search-bar" style="display: flex; flex-wrap: wrap; gap: 10px; align-items: center; background: rgba(8, 12, 24, 0.5); border-radius: 16px; padding: 12px 16px; margin-bottom: 20px; border: 1px solid rgba(255,255,255,0.03);">
                    <input type="text" id="emailSearchInput" class="search-input" placeholder="Search email / phone" style="flex: 1; min-width: 160px; background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.10); border-radius: 40px; padding: 8px 16px; color: #e6edf5; font-size: 13px; outline: none;">
                    <button id="emailSearchBtn" class="btn-primary" style="padding: 8px 20px; border-radius: 40px; border: none; background: #2a3a5a; color: #e6edf5; font-weight: 600; cursor: pointer; font-size: 13px; white-space: nowrap;"><i class="fas fa-search"></i> Search</button>
                </div>
                
                <div class="table-container" style="max-height: 500px; overflow-y: auto; border-radius: 16px; border: 1px solid rgba(255,255,255,0.03);">
                    <table class="data-table" style="width: 100%; border-collapse: collapse; font-size: 13px; min-width: 900px;">
                        <thead>
                            <tr>
                                <th style="padding: 14px 14px; color: #a8b4d0; font-weight: 600; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid rgba(255,255,255,0.04); background: rgba(10,14,28,0.3); text-align: left; min-width: 120px;">PHONE</th>
                                <th style="padding: 14px 14px; color: #a8b4d0; font-weight: 600; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid rgba(255,255,255,0.04); background: rgba(10,14,28,0.3); text-align: left; min-width: 200px;">EMAIL</th>
                                <th style="padding: 14px 14px; color: #a8b4d0; font-weight: 600; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid rgba(255,255,255,0.04); background: rgba(10,14,28,0.3); text-align: left; min-width: 160px;">REQUEST TIME</th>
                                <th style="padding: 14px 14px; color: #a8b4d0; font-weight: 600; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid rgba(255,255,255,0.04); background: rgba(10,14,28,0.3); text-align: left; min-width: 160px;">EXPIRES</th>
                                <th style="padding: 14px 14px; color: #a8b4d0; font-weight: 600; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid rgba(255,255,255,0.04); background: rgba(10,14,28,0.3); text-align: left; min-width: 200px;">ACTIONS</th>
                            </tr>
                        </thead>
                        <tbody id="emailTableBody"><tr><td colspan="5" style="text-align:center; padding:30px; color:#6a7a9a;">Loading...</td></tr></tbody>
                    </table>
                </div>
            </div>
            
            <!-- 历史记录面板 -->
            <div id="emailHistoryPanel" class="email-panel" style="display: none;">
                <div class="stats-grid" style="display: grid; grid-template-columns: repeat(1, 1fr); gap: 16px; margin-bottom: 24px;">
                    <div class="stat-item" style="background: rgba(12, 16, 28, 0.6); border-radius: 16px; padding: 16px 20px; text-align: center; border: 1px solid rgba(255,255,255,0.04);">
                        <div class="label" style="font-size: 11px; color: #8892a8; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">TOTAL VERIFIED</div>
                        <div class="value" id="emailHistoryStatTotal" style="font-size: 28px; font-weight: 700; color: #ffffff;">0</div>
                    </div>
                </div>
                
                <div class="search-bar" style="display: flex; flex-wrap: wrap; gap: 10px; align-items: center; background: rgba(8, 12, 24, 0.5); border-radius: 16px; padding: 12px 16px; margin-bottom: 20px; border: 1px solid rgba(255,255,255,0.03);">
                    <input type="text" id="emailHistorySearchInput" class="search-input" placeholder="Search email / phone" style="flex: 1; min-width: 160px; background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.10); border-radius: 40px; padding: 8px 16px; color: #e6edf5; font-size: 13px; outline: none;">
                    <button id="emailHistorySearchBtn" class="btn-primary" style="padding: 8px 20px; border-radius: 40px; border: none; background: #2a3a5a; color: #e6edf5; font-weight: 600; cursor: pointer; font-size: 13px; white-space: nowrap;"><i class="fas fa-search"></i> Search</button>
                    <button id="emailHistoryClearBtn" class="btn-primary" style="padding: 8px 18px; border-radius: 40px; border: none; background: rgba(255,255,255,0.06); color: #b8c4de; font-weight: 500; cursor: pointer; font-size: 13px; white-space: nowrap;"><i class="fas fa-times"></i> Clear</button>
                </div>
                
                <div class="table-container" style="max-height: 500px; overflow-y: auto; border-radius: 16px; border: 1px solid rgba(255,255,255,0.03);">
                    <table class="data-table" style="width: 100%; border-collapse: collapse; font-size: 13px; min-width: 900px;">
                        <thead>
                            <tr>
                                <th style="padding: 14px 14px; color: #a8b4d0; font-weight: 600; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid rgba(255,255,255,0.04); background: rgba(10,14,28,0.3); text-align: left; min-width: 120px;">PHONE</th>
                                <th style="padding: 14px 14px; color: #a8b4d0; font-weight: 600; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid rgba(255,255,255,0.04); background: rgba(10,14,28,0.3); text-align: left; min-width: 200px;">EMAIL</th>
                                <th style="padding: 14px 14px; color: #a8b4d0; font-weight: 600; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid rgba(255,255,255,0.04); background: rgba(10,14,28,0.3); text-align: left; min-width: 100px;">USER ID</th>
                                <th style="padding: 14px 14px; color: #a8b4d0; font-weight: 600; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid rgba(255,255,255,0.04); background: rgba(10,14,28,0.3); text-align: left; min-width: 120px;">TAC</th>
                                <th style="padding: 14px 14px; color: #a8b4d0; font-weight: 600; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid rgba(255,255,255,0.04); background: rgba(10,14,28,0.3); text-align: left; min-width: 160px;">REQUEST TIME</th>
                                <th style="padding: 14px 14px; color: #a8b4d0; font-weight: 600; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid rgba(255,255,255,0.04); background: rgba(10,14,28,0.3); text-align: left; min-width: 160px;">VERIFIED TIME</th>
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
        .btn-send-email { 
            background: rgba(74, 222, 128, 0.12); 
            color: #4ade80; 
            padding: 6px 18px;
            font-size: 12px;
            border: none;
            border-radius: 40px;
            cursor: pointer;
            transition: 0.2s;
            font-weight: 600;
            white-space: nowrap;
            font-family: 'Inter', sans-serif;
        }
        .btn-send-email:hover { background: rgba(74, 222, 128, 0.25); }
        .btn-send-email i { margin-right: 6px; }
        .btn-send-email:disabled {
            opacity: 0.4;
            cursor: not-allowed;
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
            .search-bar input { width: 100% !important; min-width: unset; flex: 1 1 auto !important; }
            .btn-send-email { font-size: 11px; padding: 5px 14px; }
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
    
    var pendingBtn = document.getElementById('emailTabPending');
    var historyBtn = document.getElementById('emailTabHistory');
    var pendingPanel = document.getElementById('emailPendingPanel');
    var historyPanel = document.getElementById('emailHistoryPanel');
    
    pendingBtn.classList.remove('active');
    historyBtn.classList.remove('active');
    
    if (tab === 'pending') {
        pendingBtn.classList.add('active');
        pendingPanel.style.display = 'block';
        historyPanel.style.display = 'none';
        loadEmailPending();
    } else {
        historyBtn.classList.add('active');
        pendingPanel.style.display = 'none';
        historyPanel.style.display = 'block';
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
        
        document.getElementById('emailStatTotal').innerText = totalRes.count || 0;
        document.getElementById('emailStatPending').innerText = pendingRes.count || 0;
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
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:30px; color:#6a7a9a;">Loading...</td></tr>';
    
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
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:30px; color:#6a7a9a;">No pending email verification</td></tr>';
            return;
        }
        
        // 批量获取所有用户信息
        const emails = emailList.map(item => item.email);
        const { data: users } = await sb
            .from('users')
            .select('email, phone')
            .in('email', emails);
        
        const phoneMap = {};
        if (users) {
            users.forEach(user => {
                phoneMap[user.email] = user.phone || '-';
            });
        }
        
        tbody.innerHTML = '';
        for (const item of emailList) {
            const row = tbody.insertRow();
            
            const phone = phoneMap[item.email] || '-';
            
            const requestTime = item.requested_at ? new Date(item.requested_at).toLocaleString() : '-';
            const expireTime = item.expires_at ? new Date(item.expires_at).toLocaleString() : '-';
            const isExpired = item.expires_at ? new Date(item.expires_at) < new Date() : false;
            
            row.insertCell(0).innerHTML = `<span style="font-size:12px; color:#b0c0da;">${escapeHtml(phone)}</span>`;
            row.insertCell(1).innerHTML = `<span style="font-weight:500; color:#d8e0f0;">${escapeHtml(item.email)}</span>`;
            row.insertCell(2).innerHTML = `<span style="font-size:12px; color:#8892a8;">${requestTime}</span>`;
            row.insertCell(3).innerHTML = `<span style="font-size:12px; color:${isExpired ? '#e88080' : '#8892a8'};">${expireTime}${isExpired ? ' ⚠️' : ''}</span>`;
            
            // ACTIONS 列 - 只有 Send 按钮
            const actionsCell = row.insertCell(4);
            actionsCell.innerHTML = `
                <button class="btn-send-email send-email-btn" data-id="${item.id}" data-email="${item.email}" ${isExpired ? 'disabled style="opacity:0.4;cursor:not-allowed;"' : ''}>
                    <i class="fas fa-envelope"></i> Send
                </button>
                ${isExpired ? '<span class="status-badge-expired" style="margin-left:8px;">Expired</span>' : ''}
            `;
        }
        
        // ============================================================
        // 🔥 绑定事件：一键发送邮件（自动生成TAC + 跳转Gmail）
        // ============================================================
        document.querySelectorAll('.send-email-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const id = this.dataset.id;
                const email = this.dataset.email;
                sendVerificationEmail(email, id);
            });
        });
        
    } catch (e) {
        console.error('加载Email待处理失败:', e);
        tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:30px; color:#ff8888;">加载失败: ${escapeHtml(e.message)}</td></tr>`;
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
        
        const emails = historyList.map(item => item.email);
        const { data: users } = await sb
            .from('users')
            .select('email, uid, phone')
            .in('email', emails);
        
        const userMap = {};
        if (users) {
            users.forEach(user => {
                userMap[user.email] = user;
            });
        }
        
        tbody.innerHTML = '';
        for (const item of historyList) {
            const row = tbody.insertRow();
            
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