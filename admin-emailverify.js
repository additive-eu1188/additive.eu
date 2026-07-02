// admin-emailverify.js - 邮箱验证管理页面（完整版）
let activeEmailTab = 'pending';
let emailSearchKeyword = '';

// ============================================================
// 🔥 邮件模板配置
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
// 🔥 判断记录状态 - 修正版
// ============================================================
function getRecordStatus(record) {
    // 1️⃣ 已验证 → History
    if (record.is_verified === true) {
        return { label: 'Verified', class: 'status-badge-verified', icon: '✅' };
    }
    
    // 2️⃣ code 为空 → New Request (用户刚提交，后台还没处理)
    if (!record.code || record.code === '' || record.code === null) {
        return { label: 'New Request', class: 'status-badge-new', icon: '🆕' };
    }
    
    // 3️⃣ code 有值 → 已发送
    const sendCount = record.send_count || 0;
    if (sendCount === 1) {
        // 第一次发送 → Pending
        return { label: 'Pending', class: 'status-badge-pending', icon: '⏳' };
    } else {
        // 第二次及以上 → Clicked N times
        return { label: `Clicked ${sendCount} times`, class: 'status-badge-pending', icon: '📤' };
    }
}

// ============================================================
// 🔥 一键发送邮件 - 自动生成TAC + 跳转Gmail + 计数+1
// ============================================================
function sendVerificationEmail(email, requestId) {
    if (!email) {
        showToast('❌ No email address provided', 'error');
        return;
    }

    const tacCode = generateTAC();
    console.log('📧 生成TAC:', tacCode, 'for:', email);

    let subject = EMAIL_TEMPLATE.subject;
    let body = EMAIL_TEMPLATE.body;
    body = body.replace(/\[VERIFICATION_CODE\]/g, tacCode);

    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(email)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    
    window.open(gmailUrl, '_blank');

    // 🔥 保存TAC到数据库，同时 send_count + 1
    saveTACToDatabase(requestId, tacCode, email);

    showToast(`✅ TAC: ${tacCode} | Gmail opened for ${email}`, 'success');
}

// ============================================================
// 🔥 将TAC保存到数据库（同时增加发送次数）
// ============================================================
async function saveTACToDatabase(requestId, code, email) {
    try {
        // 先获取当前的 send_count
        const { data: current } = await sb
            .from('email_verification_requests')
            .select('send_count')
            .eq('id', parseInt(requestId))
            .single();
        
        const newCount = (current?.send_count || 0) + 1;
        
        const { error } = await sb
            .from('email_verification_requests')
            .update({ 
                code: code,
                send_count: newCount,
                updated_at: new Date().toISOString()
            })
            .eq('id', parseInt(requestId));

        if (error) {
            console.error('❌ 保存TAC失败:', error);
            showToast('⚠️ TAC generated but failed to save', 'warning');
            return;
        }

        console.log(`✅ TAC saved to database (发送次数: ${newCount})`);
        
        await loadEmailPending();
        await loadEmailHistory();
        await updateEmailStats();

    } catch (e) {
        console.error('❌ 保存TAC异常:', e);
    }
}

// ============================================================
// 🔥 手动验证 - 将记录标记为已验证
// ============================================================
async function verifyEmail(requestId, email) {
    try {
        const { error } = await sb
            .from('email_verification_requests')
            .update({ 
                is_verified: true,
                verified_at: new Date().toISOString()
            })
            .eq('id', parseInt(requestId));

        if (error) {
            console.error('❌ 验证失败:', error);
            showToast('❌ Verification failed', 'error');
            return;
        }

        showToast(`✅ ${email} verified successfully!`, 'success');
        
        await loadEmailPending();
        await loadEmailHistory();
        await updateEmailStats();

    } catch (e) {
        console.error('❌ 验证异常:', e);
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
                <div class="stats-grid" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 24px;">
                    <div class="stat-item" style="background: rgba(12, 16, 28, 0.6); border-radius: 16px; padding: 16px 20px; text-align: center; border: 1px solid rgba(255,255,255,0.04);">
                        <div class="label" style="font-size: 11px; color: #8892a8; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">🆕 New Requests</div>
                        <div class="value" id="emailStatNew" style="font-size: 28px; font-weight: 700; color: #4a7cff;">0</div>
                    </div>
                    <div class="stat-item" style="background: rgba(12, 16, 28, 0.6); border-radius: 16px; padding: 16px 20px; text-align: center; border: 1px solid rgba(255,255,255,0.04);">
                        <div class="label" style="font-size: 11px; color: #8892a8; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">⏳ Pending</div>
                        <div class="value" id="emailStatPending" style="font-size: 28px; font-weight: 700; color: #ffb84d;">0</div>
                    </div>
                    <div class="stat-item" style="background: rgba(12, 16, 28, 0.6); border-radius: 16px; padding: 16px 20px; text-align: center; border: 1px solid rgba(255,255,255,0.04);">
                        <div class="label" style="font-size: 11px; color: #8892a8; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">✅ Verified</div>
                        <div class="value" id="emailStatVerified" style="font-size: 28px; font-weight: 700; color: #4ade80;">0</div>
                    </div>
                </div>
                
                <!-- 搜索栏 -->
                <div class="search-bar" style="display: flex; flex-wrap: wrap; gap: 10px; align-items: center; background: rgba(8, 12, 24, 0.5); border-radius: 16px; padding: 12px 16px; margin-bottom: 20px; border: 1px solid rgba(255,255,255,0.03);">
                    <input type="text" id="emailSearchInput" class="search-input" placeholder="Search email / phone" style="flex: 1; min-width: 160px; background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.10); border-radius: 40px; padding: 8px 16px; color: #e6edf5; font-size: 13px; outline: none;">
                    <button id="emailSearchBtn" class="btn-primary" style="padding: 8px 20px; border-radius: 40px; border: none; background: #2a3a5a; color: #e6edf5; font-weight: 600; cursor: pointer; font-size: 13px; white-space: nowrap;"><i class="fas fa-search"></i> Search</button>
                </div>
                
                <div class="table-container" style="max-height: 500px; overflow-y: auto; border-radius: 16px; border: 1px solid rgba(255,255,255,0.03);">
                    <table class="data-table" style="width: 100%; border-collapse: collapse; font-size: 13px; min-width: 950px;">
                        <thead>
                            <tr>
                                <th style="padding: 14px 14px; color: #a8b4d0; font-weight: 600; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid rgba(255,255,255,0.04); background: rgba(10,14,28,0.3); text-align: left; min-width: 120px;">PHONE</th>
                                <th style="padding: 14px 14px; color: #a8b4d0; font-weight: 600; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid rgba(255,255,255,0.04); background: rgba(10,14,28,0.3); text-align: left; min-width: 200px;">EMAIL</th>
                                <th style="padding: 14px 14px; color: #a8b4d0; font-weight: 600; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid rgba(255,255,255,0.04); background: rgba(10,14,28,0.3); text-align: left; min-width: 160px;">REQUEST TIME</th>
                                <th style="padding: 14px 14px; color: #a8b4d0; font-weight: 600; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid rgba(255,255,255,0.04); background: rgba(10,14,28,0.3); text-align: left; min-width: 160px;">STATUS</th>
                                <th style="padding: 14px 14px; color: #a8b4d0; font-weight: 600; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid rgba(255,255,255,0.04); background: rgba(10,14,28,0.3); text-align: left; min-width: 230px;">ACTIONS</th>
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
                        <div class="value" id="emailHistoryStatTotal" style="font-size: 28px; font-weight: 700; color: #4ade80;">0</div>
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
    
    // 添加样式（与之前相同，省略以节省篇幅）
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
            font-family: 'Inter', sans-serif;
        }
        .btn-sm-action:hover { opacity: 0.85; }
        .btn-send-email { 
            background: rgba(74, 222, 128, 0.12); 
            color: #4ade80; 
            padding: 5px 14px;
            font-size: 11px;
            border: none;
            border-radius: 40px;
            cursor: pointer;
            transition: 0.2s;
            font-weight: 600;
            white-space: nowrap;
            font-family: 'Inter', sans-serif;
        }
        .btn-send-email:hover { background: rgba(74, 222, 128, 0.25); }
        .btn-send-email i { margin-right: 4px; }
        .btn-send-email:disabled {
            opacity: 0.4;
            cursor: not-allowed;
        }
        .btn-verify-email {
            background: rgba(74, 124, 255, 0.12);
            color: #4a7cff;
            padding: 5px 14px;
            font-size: 11px;
            border: none;
            border-radius: 40px;
            cursor: pointer;
            transition: 0.2s;
            font-weight: 600;
            white-space: nowrap;
            font-family: 'Inter', sans-serif;
        }
        .btn-verify-email:hover { background: rgba(74, 124, 255, 0.25); }
        .btn-verify-email i { margin-right: 4px; }
        .btn-resend-email {
            background: rgba(255, 184, 77, 0.12);
            color: #ffb84d;
            padding: 5px 14px;
            font-size: 11px;
            border: none;
            border-radius: 40px;
            cursor: pointer;
            transition: 0.2s;
            font-weight: 600;
            white-space: nowrap;
            font-family: 'Inter', sans-serif;
        }
        .btn-resend-email:hover { background: rgba(255, 184, 77, 0.25); }
        .btn-resend-email i { margin-right: 4px; }
        .status-badge-verified {
            background: rgba(74, 222, 128, 0.12);
            color: #4ade80;
            padding: 3px 14px;
            border-radius: 40px;
            font-size: 11px;
            font-weight: 600;
            display: inline-block;
        }
        .status-badge-pending {
            background: rgba(255, 184, 77, 0.12);
            color: #ffb84d;
            padding: 3px 14px;
            border-radius: 40px;
            font-size: 11px;
            font-weight: 600;
            display: inline-block;
        }
        .status-badge-new {
            background: rgba(74, 124, 255, 0.12);
            color: #4a7cff;
            padding: 3px 14px;
            border-radius: 40px;
            font-size: 11px;
            font-weight: 600;
            display: inline-block;
        }
        @media (max-width: 768px) {
            .stats-grid { grid-template-columns: repeat(2, 1fr) !important; }
            .tab-email-btn { font-size: 12px; padding: 6px 14px; }
            .search-bar { flex-direction: column; align-items: stretch; }
            .search-bar input { width: 100% !important; min-width: unset; flex: 1 1 auto !important; }
            .btn-send-email, .btn-verify-email, .btn-resend-email { font-size: 10px; padding: 4px 10px; }
        }
    `;
    document.head.appendChild(style);
    
    // 绑定事件（与之前相同）
    document.getElementById('emailTabPending')?.addEventListener('click', function() { switchEmailTab('pending'); });
    document.getElementById('emailTabHistory')?.addEventListener('click', function() { switchEmailTab('history'); });
    document.getElementById('refreshEmailBtn')?.addEventListener('click', function() {
        loadEmailPending();
        loadEmailHistory();
        updateEmailStats();
    });
    
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
        const { data: allUnverified } = await sb
            .from('email_verification_requests')
            .select('code, is_verified, send_count')
            .eq('is_verified', false);
        
        const newRequests = allUnverified?.filter(r => !r.code || r.code === '' || r.code === null) || [];
        const pendingRequests = allUnverified?.filter(r => r.code && r.code !== '' && r.code !== null) || [];
        
        const { count: verifiedCount } = await sb
            .from('email_verification_requests')
            .select('id', { count: 'exact', head: true })
            .eq('is_verified', true);
        
        document.getElementById('emailStatNew').innerText = newRequests.length;
        document.getElementById('emailStatPending').innerText = pendingRequests.length;
        document.getElementById('emailStatVerified').innerText = verifiedCount || 0;
        document.getElementById('emailHistoryStatTotal').innerText = verifiedCount || 0;
    } catch (e) {
        console.error('更新Email统计失败:', e);
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
            
            const status = getRecordStatus(item);
            
            const isNewRequest = !item.code || item.code === '' || item.code === null;
            const isPending = item.code && item.code !== '' && item.code !== null;
            
            row.insertCell(0).innerHTML = `<span style="font-size:12px; color:#b0c0da;">${escapeHtml(phone)}</span>`;
            row.insertCell(1).innerHTML = `<span style="font-weight:500; color:#d8e0f0;">${escapeHtml(item.email)}</span>`;
            row.insertCell(2).innerHTML = `<span style="font-size:12px; color:#8892a8;">${requestTime}</span>`;
            row.insertCell(3).innerHTML = `<span class="${status.class}">${status.icon} ${status.label}</span>`;
            
            const actionsCell = row.insertCell(4);
            let actionsHtml = '';
            
            if (isNewRequest) {
                actionsHtml = `
                    <button class="btn-send-email send-email-btn" data-id="${item.id}" data-email="${item.email}">
                        <i class="fas fa-envelope"></i> Send
                    </button>
                `;
            } else if (isPending) {
                actionsHtml = `
                    <button class="btn-resend-email resend-email-btn" data-id="${item.id}" data-email="${item.email}" title="Resend with new TAC">
                        <i class="fas fa-sync-alt"></i> Resend
                    </button>
                    <button class="btn-verify-email verify-email-btn" data-id="${item.id}" data-email="${item.email}" title="Mark as verified">
                        <i class="fas fa-check"></i> Verify
                    </button>
                `;
            }
            
            actionsCell.innerHTML = actionsHtml;
        }
        
        document.querySelectorAll('.send-email-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const id = this.dataset.id;
                const email = this.dataset.email;
                sendVerificationEmail(email, id);
            });
        });
        
        document.querySelectorAll('.resend-email-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const id = this.dataset.id;
                const email = this.dataset.email;
                sendVerificationEmail(email, id);
            });
        });
        
        document.querySelectorAll('.verify-email-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const id = this.dataset.id;
                const email = this.dataset.email;
                verifyEmail(id, email);
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
            row.insertCell(5).innerHTML = `<span style="font-size:12px; color:#4ade80;">${verifiedTime}</span>`;
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