// admin-kyc.js - 完整版（与 Withdrawal 页面风格一致）
let activeTab = 'pending';
let kycSearchKeyword = '';

async function loadKycPage() {
    const container = document.getElementById('page_kyc');
    if (!container) return;
    container.innerHTML = `
        <div class="card">
            <!-- 顶部：左侧标题 + 右侧按钮 -->
            <div class="withdraw-header" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; margin-bottom: 24px;">
                <h2 style="font-size: 18px; font-weight: 600; color: #d8e0f0; margin: 0;">
                    <i class="fas fa-id-card" style="color: #8892a8; margin-right: 10px;"></i>
                    KYC Verification Management
                </h2>
                <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                    <button id="tabPending" class="tab-kyc-btn active" data-tab="pending"><i class="fas fa-list-ul"></i> Pending</button>
                    <button id="tabVerified" class="tab-kyc-btn" data-tab="verified"><i class="fas fa-history"></i> Verification History</button>
                    <button id="refreshKycBtn" class="btn-primary"><i class="fas fa-sync-alt"></i> Refresh</button>
                </div>
            </div>
            
            <!-- 待处理面板 -->
            <div id="pendingPanel" class="kyc-panel">
                <!-- 四张统计卡片 -->
                <div class="stats-grid" style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; margin-bottom: 24px;">
    <div class="stat-item" style="background: rgba(12, 16, 28, 0.6); border-radius: 16px; padding: 16px 20px; text-align: center; border: 1px solid rgba(255,255,255,0.04);">
        <div class="label" style="font-size: 11px; color: #8892a8; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">Total KYC</div>
        <div class="value" id="kycStatTotal" style="font-size: 28px; font-weight: 700; color: #ffffff;">0</div>
    </div>
    <div class="stat-item" style="background: rgba(12, 16, 28, 0.6); border-radius: 16px; padding: 16px 20px; text-align: center; border: 1px solid rgba(255,255,255,0.04);">
        <div class="label" style="font-size: 11px; color: #8892a8; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">Pending KYC</div>
        <div class="value" id="kycStatPending" style="font-size: 28px; font-weight: 700; color: #ffffff;">0</div>
    </div>
</div>
                
                <!-- 搜索栏 -->
                <div class="search-bar" style="display: flex; flex-wrap: wrap; gap: 10px; align-items: center; background: rgba(8, 12, 24, 0.5); border-radius: 16px; padding: 12px 16px; margin-bottom: 20px; border: 1px solid rgba(255,255,255,0.03);">
                    <input type="text" id="kycSearchInput" class="search-input" placeholder="Search UID / username" style="flex: 1; min-width: 160px; background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.10); border-radius: 40px; padding: 8px 16px; color: #e6edf5; font-size: 13px; outline: none;">
                    
                    <select id="kycDocTypeFilter" style="min-width: 160px; flex-shrink: 0; background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.10); border-radius: 40px; padding: 8px 16px; color: #e6edf5; font-size: 13px; outline: none; cursor: pointer;">
                        <option value="">All Document Types</option>
                        <option value="passport">Passport</option>
                        <option value="resident_permit">Resident Permit</option>
                        <option value="national_id_front">National ID (Front)</option>
                        <option value="national_id_back">National ID (Back)</option>
                    </select>
                    
                    <button id="kycSearchBtn" class="btn-primary" style="padding: 8px 20px; border-radius: 40px; border: none; background: #2a3a5a; color: #e6edf5; font-weight: 600; cursor: pointer; font-size: 13px; white-space: nowrap;"><i class="fas fa-search"></i> Search</button>
                </div>
                
                <div class="table-container" style="max-height: 500px; overflow-y: auto; border-radius: 16px; border: 1px solid rgba(255,255,255,0.03);">
                    <table class="data-table" style="width: 100%; border-collapse: collapse; font-size: 13px; min-width: 900px;">
                        <thead>
                            <tr>
                                <th style="padding: 14px 14px; color: #a8b4d0; font-weight: 600; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid rgba(255,255,255,0.04); background: rgba(10,14,28,0.3); text-align: left; min-width: 80px;">User ID</th>
                                <th style="padding: 14px 14px; color: #a8b4d0; font-weight: 600; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid rgba(255,255,255,0.04); background: rgba(10,14,28,0.3); text-align: left; min-width: 100px;">Username</th>
                                <th style="padding: 14px 14px; color: #a8b4d0; font-weight: 600; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid rgba(255,255,255,0.04); background: rgba(10,14,28,0.3); text-align: left; min-width: 130px;">Document Type</th>
                                <th style="padding: 14px 14px; color: #a8b4d0; font-weight: 600; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid rgba(255,255,255,0.04); background: rgba(10,14,28,0.3); text-align: left; min-width: 150px;">Front</th>
                                <th style="padding: 14px 14px; color: #a8b4d0; font-weight: 600; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid rgba(255,255,255,0.04); background: rgba(10,14,28,0.3); text-align: left; min-width: 150px;">Back</th>
                                <th style="padding: 14px 14px; color: #a8b4d0; font-weight: 600; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid rgba(255,255,255,0.04); background: rgba(10,14,28,0.3); text-align: left; min-width: 160px;">Actions</th>
                            </tr>
                        </thead>
                        <tbody id="kycTableBody"><tr><td colspan="6" style="text-align:center; padding:30px; color:#6a7a9a;">Loading...</td></tr></tbody>
                    </table>
                </div>
            </div>
            
            <!-- 已验证面板 -->
            <div id="verifiedPanel" class="kyc-panel" style="display: none;">
                <!-- 四张统计卡片（与待处理相同） -->
                <div class="stats-grid" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 24px;">
    <div class="stat-item" style="background: rgba(12, 16, 28, 0.6); border-radius: 16px; padding: 16px 20px; text-align: center; border: 1px solid rgba(255,255,255,0.04);">
        <div class="label" style="font-size: 11px; color: #8892a8; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">Total KYC</div>
        <div class="value" id="kycVerifiedStatTotal" style="font-size: 28px; font-weight: 700; color: #ffffff;">0</div>
    </div>
    <div class="stat-item" style="background: rgba(12, 16, 28, 0.6); border-radius: 16px; padding: 16px 20px; text-align: center; border: 1px solid rgba(255,255,255,0.04);">
        <div class="label" style="font-size: 11px; color: #8892a8; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">KYC Approved</div>
        <div class="value" id="kycVerifiedStatApproved" style="font-size: 28px; font-weight: 700; color: #ffffff;">0</div>
    </div>
    <div class="stat-item" style="background: rgba(12, 16, 28, 0.6); border-radius: 16px; padding: 16px 20px; text-align: center; border: 1px solid rgba(255,255,255,0.04);">
        <div class="label" style="font-size: 11px; color: #8892a8; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">KYC Rejected</div>
        <div class="value" id="kycVerifiedStatRejected" style="font-size: 28px; font-weight: 700; color: #ffffff;">0</div>
    </div>
</div>
                
                <!-- 搜索栏 -->
                <div class="search-bar" style="display: flex; flex-wrap: wrap; gap: 10px; align-items: center; background: rgba(8, 12, 24, 0.5); border-radius: 16px; padding: 12px 16px; margin-bottom: 20px; border: 1px solid rgba(255,255,255,0.03);">
                    <input type="text" id="kycVerifiedSearchInput" class="search-input" placeholder="Search UID / username" style="flex: 1; min-width: 160px; background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.10); border-radius: 40px; padding: 8px 16px; color: #e6edf5; font-size: 13px; outline: none;">
                    
                    <select id="kycVerifiedDocTypeFilter" style="min-width: 160px; flex-shrink: 0; background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.10); border-radius: 40px; padding: 8px 16px; color: #e6edf5; font-size: 13px; outline: none; cursor: pointer;">
                        <option value="">All Document Types</option>
                        <option value="passport">Passport</option>
                        <option value="resident_permit">Resident Permit</option>
                        <option value="national_id_front">National ID (Front)</option>
                        <option value="national_id_back">National ID (Back)</option>
                    </select>
                    
                    <button id="kycVerifiedSearchBtn" class="btn-primary" style="padding: 8px 20px; border-radius: 40px; border: none; background: #2a3a5a; color: #e6edf5; font-weight: 600; cursor: pointer; font-size: 13px; white-space: nowrap;"><i class="fas fa-search"></i> Search</button>
                    <button id="kycVerifiedClearBtn" class="btn-primary" style="padding: 8px 18px; border-radius: 40px; border: none; background: rgba(255,255,255,0.06); color: #b8c4de; font-weight: 500; cursor: pointer; font-size: 13px; white-space: nowrap;"><i class="fas fa-times"></i> Clear</button>
                </div>
                
                <div class="table-container" style="max-height: 500px; overflow-y: auto; border-radius: 16px; border: 1px solid rgba(255,255,255,0.03);">
                    <table class="data-table" style="width: 100%; border-collapse: collapse; font-size: 13px; min-width: 900px;">
                        <thead>
                            <tr>
                                <th style="padding: 14px 14px; color: #a8b4d0; font-weight: 600; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid rgba(255,255,255,0.04); background: rgba(10,14,28,0.3); text-align: left; min-width: 80px;">User ID</th>
                                <th style="padding: 14px 14px; color: #a8b4d0; font-weight: 600; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid rgba(255,255,255,0.04); background: rgba(10,14,28,0.3); text-align: left; min-width: 100px;">Username</th>
                                <th style="padding: 14px 14px; color: #a8b4d0; font-weight: 600; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid rgba(255,255,255,0.04); background: rgba(10,14,28,0.3); text-align: left; min-width: 130px;">Document Type</th>
                                <th style="padding: 14px 14px; color: #a8b4d0; font-weight: 600; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid rgba(255,255,255,0.04); background: rgba(10,14,28,0.3); text-align: left; min-width: 150px;">Front</th>
                                <th style="padding: 14px 14px; color: #a8b4d0; font-weight: 600; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid rgba(255,255,255,0.04); background: rgba(10,14,28,0.3); text-align: left; min-width: 150px;">Back</th>
                                <th style="padding: 14px 14px; color: #a8b4d0; font-weight: 600; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid rgba(255,255,255,0.04); background: rgba(10,14,28,0.3); text-align: left; min-width: 160px;">Status</th>
                            </tr>
                        </thead>
                        <tbody id="kycVerifiedTableBody"><tr><td colspan="6" style="text-align:center; padding:30px; color:#6a7a9a;">Loading...</td></tr></tbody>
                    </table>
                </div>
            </div>
        </div>
    `;
    
    // 添加样式
    const style = document.createElement('style');
    style.textContent = `
        .tab-kyc-btn {
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
        .tab-kyc-btn:hover {
            background: rgba(255,255,255,0.08);
            color: #e6edf5;
        }
        .tab-kyc-btn.active {
            background: #2a3a5a;
            color: #e6edf5;
            border-color: #3a5a7a;
        }
        .kyc-panel { animation: fadeIn 0.3s ease; }
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(8px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .kyc-doc-image {
            width: 80px;
            height: 60px;
            object-fit: cover;
            border-radius: 8px;
            cursor: pointer;
            border: 1px solid rgba(255,255,255,0.06);
            transition: 0.2s;
        }
        .kyc-doc-image:hover {
            transform: scale(1.02);
            border-color: rgba(200,176,144,0.3);
        }
        .kyc-doc-placeholder {
            width: 80px;
            height: 60px;
            border-radius: 8px;
            background: rgba(255,255,255,0.03);
            border: 1px dashed rgba(255,255,255,0.06);
            display: flex;
            align-items: center;
            justify-content: center;
            color: #4a5a72;
            font-size: 10px;
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
        .btn-approve { background: rgba(122, 208, 176, 0.15); color: #7ad0b0; }
        .btn-approve:hover { background: rgba(122, 208, 176, 0.25); }
        .btn-reject { background: rgba(232, 128, 128, 0.15); color: #e88080; }
        .btn-reject:hover { background: rgba(232, 128, 128, 0.25); }
        .status-badge-approved { background: rgba(122, 208, 176, 0.10); color: #7ad0b0; padding: 2px 12px; border-radius: 40px; font-size: 11px; display: inline-block; }
        .status-badge-rejected { background: rgba(232, 128, 128, 0.10); color: #e88080; padding: 2px 12px; border-radius: 40px; font-size: 11px; display: inline-block; }
        .status-badge-pending { background: rgba(212, 192, 154, 0.10); color: #d4c09a; padding: 2px 12px; border-radius: 40px; font-size: 11px; display: inline-block; }
        @media (max-width: 768px) {
            .stats-grid { grid-template-columns: repeat(2, 1fr) !important; }
            .tab-kyc-btn { font-size: 12px; padding: 6px 14px; }
            .search-bar { flex-direction: column; align-items: stretch; }
            .search-bar input, .search-bar select { width: 100% !important; min-width: unset; flex: 1 1 auto !important; }
        }
    `;
    document.head.appendChild(style);
    
    // 绑定标签切换
    document.getElementById('tabPending')?.addEventListener('click', function() { switchKycTab('pending'); });
    document.getElementById('tabVerified')?.addEventListener('click', function() { switchKycTab('verified'); });
    document.getElementById('refreshKycBtn')?.addEventListener('click', function() { 
        loadKycPending(); 
        loadKycVerified(); 
        updateKycStats();
    });
    
    // 绑定待处理搜索
    document.getElementById('kycSearchBtn')?.addEventListener('click', function() {
        kycSearchKeyword = document.getElementById('kycSearchInput').value.trim();
        loadKycPending();
    });
    document.getElementById('kycSearchInput')?.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            kycSearchKeyword = document.getElementById('kycSearchInput').value.trim();
            loadKycPending();
        }
    });
    
    // 绑定已验证搜索
    document.getElementById('kycVerifiedSearchBtn')?.addEventListener('click', function() {
        kycSearchKeyword = document.getElementById('kycVerifiedSearchInput').value.trim();
        loadKycVerified();
    });
    document.getElementById('kycVerifiedClearBtn')?.addEventListener('click', function() {
        document.getElementById('kycVerifiedSearchInput').value = '';
        document.getElementById('kycVerifiedDocTypeFilter').value = '';
        kycSearchKeyword = '';
        loadKycVerified();
    });
    document.getElementById('kycVerifiedSearchInput')?.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            kycSearchKeyword = document.getElementById('kycVerifiedSearchInput').value.trim();
            loadKycVerified();
        }
    });
    
    // 加载数据
    await loadKycPending();
    await loadKycVerified();
    await updateKycStats();
}

function switchKycTab(tab) {
    activeTab = tab;
    document.getElementById('tabPending').classList.toggle('active', tab === 'pending');
    document.getElementById('tabVerified').classList.toggle('active', tab === 'verified');
    document.getElementById('pendingPanel').style.display = tab === 'pending' ? 'block' : 'none';
    document.getElementById('verifiedPanel').style.display = tab === 'verified' ? 'block' : 'none';
    
    if (tab === 'pending') {
        loadKycPending();
    } else {
        loadKycVerified();
    }
}

async function updateKycStats() {
    try {
        const totalRes = await sb.from('kyc_verifications').select('id', { count: 'exact', head: true });
        const pendingRes = await sb.from('kyc_verifications').select('id', { count: 'exact', head: true }).eq('status', 'pending');
        const approvedRes = await sb.from('kyc_verifications').select('id', { count: 'exact', head: true }).eq('status', 'approved');
        const rejectedRes = await sb.from('kyc_verifications').select('id', { count: 'exact', head: true }).eq('status', 'rejected');
        
        document.getElementById('kycStatTotal').innerText = totalRes.count || 0;
        document.getElementById('kycStatPending').innerText = pendingRes.count || 0;
        document.getElementById('kycStatApproved').innerText = approvedRes.count || 0;
        document.getElementById('kycStatRejected').innerText = rejectedRes.count || 0;
        
        // 已验证面板的统计（显示同样的数据，或者只显示已批准的）
        document.getElementById('kycVerifiedStatTotal').innerText = totalRes.count || 0;
document.getElementById('kycVerifiedStatApproved').innerText = approvedRes.count || 0;
document.getElementById('kycVerifiedStatRejected').innerText = rejectedRes.count || 0;
    } catch (e) {
        console.error('更新KYC统计失败:', e);
    }
}

async function getUsername(uid) {
    try {
        const { data } = await sb.from('users').select('username').eq('uid', uid).single();
        return data?.username || uid;
    } catch (e) {
        return uid;
    }
}

async function loadKycPending() {
    const tbody = document.getElementById('kycTableBody');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:30px; color:#6a7a9a;">Loading...</td></tr>';
    
    try {
        let query = sb.from('kyc_verifications').select('*').in('status', ['pending', 'rejected']).order('uploaded_at', { ascending: false });
        
        const keyword = document.getElementById('kycSearchInput')?.value.trim() || '';
        const docType = document.getElementById('kycDocTypeFilter')?.value || '';
        
        if (keyword) {
            // 先获取匹配的用户
            const { data: matchedUsers } = await sb.from('users').select('uid').or(`uid.ilike.%${keyword}%,username.ilike.%${keyword}%`).limit(50);
            if (matchedUsers && matchedUsers.length > 0) {
                const uids = matchedUsers.map(u => u.uid);
                query = query.in('uid', uids);
            } else {
                query = query.ilike('uid', `%${keyword}%`);
            }
        }
        if (docType) {
            query = query.eq('document_type', docType);
        }
        
        const { data: kycList } = await query;
        
        if (!kycList || kycList.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:30px; color:#6a7a9a;">No pending KYC records</td></tr>';
            return;
        }
        
        // 按用户分组
        const userGroups = {};
        for (const item of kycList) {
            if (!userGroups[item.uid]) userGroups[item.uid] = [];
            userGroups[item.uid].push(item);
        }
        
        // 获取用户名
        const userMap = {};
        for (const uid of Object.keys(userGroups)) {
            userMap[uid] = await getUsername(uid);
        }
        
        tbody.innerHTML = '';
        for (const [uid, items] of Object.entries(userGroups)) {
            const row = tbody.insertRow();
            const username = userMap[uid] || uid;
            
            // 查找不同类型的文档
            const nationalIdFront = items.find(i => i.document_type === 'national_id_front');
            const nationalIdBack = items.find(i => i.document_type === 'national_id_back');
            const passport = items.find(i => i.document_type === 'passport');
            const residentPermit = items.find(i => i.document_type === 'resident_permit');
            
            // 确定主要文档类型
            let docTypeDisplay = '-';
            if (passport) docTypeDisplay = 'Passport';
            else if (residentPermit) docTypeDisplay = 'Resident Permit';
            else if (nationalIdFront) docTypeDisplay = 'National ID';
            
            // 检查是否有待处理的
            const hasPending = items.some(i => i.status === 'pending');
            const statusText = hasPending ? 'Pending' : 'Rejected';
            
            // Front 图片
            let frontHtml = '';
            const frontImg = nationalIdFront || passport || residentPermit;
            if (frontImg && frontImg.image_url) {
                frontHtml = `<img src="${frontImg.image_url}" class="kyc-doc-image" onclick="window.open('${frontImg.image_url}','_blank')" onerror="this.outerHTML='<div class=\\'kyc-doc-placeholder\\'>No Image</div>'">`;
            } else {
                frontHtml = '<div class="kyc-doc-placeholder">No Image</div>';
            }
            
            // Back 图片
            let backHtml = '';
            if (nationalIdBack && nationalIdBack.image_url) {
                backHtml = `<img src="${nationalIdBack.image_url}" class="kyc-doc-image" onclick="window.open('${nationalIdBack.image_url}','_blank')" onerror="this.outerHTML='<div class=\\'kyc-doc-placeholder\\'>No Image</div>'">`;
            } else {
                backHtml = '<div class="kyc-doc-placeholder">No Back</div>';
            }
            
            // 如果是 Passport 或 Resident Permit，Back 列显示 "-"
            if (passport || residentPermit) {
                backHtml = '<div class="kyc-doc-placeholder" style="border-color:transparent;">—</div>';
            }
            
            // Actions
            let actionsHtml = '';
            if (hasPending) {
                actionsHtml = `
                    <button class="btn-sm-action btn-approve approve-kyc" data-uid="${uid}"><i class="fas fa-check"></i> Approve</button>
                    <button class="btn-sm-action btn-reject reject-kyc" data-uid="${uid}"><i class="fas fa-times"></i> Reject</button>
                `;
            } else {
                actionsHtml = `<span class="status-badge-rejected">Rejected</span>`;
            }
            
            row.insertCell(0).innerHTML = `<span class="badge" style="background: rgba(255,255,255,0.08); padding: 2px 12px; border-radius: 20px; font-size: 11px; color: #c8d2e8; border: 1px solid rgba(255,255,255,0.06);">${escapeHtml(uid)}</span>`;
            row.insertCell(1).innerText = username;
            row.insertCell(2).innerHTML = `<span style="font-size:12px; color:#b0c0da;">${docTypeDisplay}</span>`;
            row.insertCell(3).innerHTML = frontHtml;
            row.insertCell(4).innerHTML = backHtml;
            row.insertCell(5).innerHTML = actionsHtml;
        }
        
        // 绑定事件
        document.querySelectorAll('.approve-kyc').forEach(btn => btn.addEventListener('click', async () => {
    const uid = btn.dataset.uid;
    showConfirm('Approve KYC', `Confirm to approve KYC for user ${uid}?`, async () => {
        await sb.from('kyc_verifications').update({ status: 'approved', approved_at: new Date().toISOString() }).eq('uid', uid).eq('status', 'pending');
        await sb.from('user_kyc_status').upsert({ uid: uid, is_verified: true });
        await loadKycPending();
        await loadKycVerified();
        await updateKycStats();
        if (window.loadDashboardPage) window.loadDashboardPage(currentDays);
        showToast(`✅ KYC approved for ${uid}`, 'success');
    });
}));

document.querySelectorAll('.reject-kyc').forEach(btn => btn.addEventListener('click', async () => {
    const uid = btn.dataset.uid;
    showConfirm('Reject KYC', `Confirm to reject KYC for user ${uid}?`, async () => {
        await sb.from('kyc_verifications').update({ status: 'rejected' }).eq('uid', uid).eq('status', 'pending');
        await loadKycPending();
        await loadKycVerified();
        await updateKycStats();
        showToast(`❌ KYC rejected for ${uid}`, 'info');
    });
}));
        
    } catch (e) {
        console.error('加载KYC待处理失败:', e);
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:30px; color:#ff8888;">加载失败: ${escapeHtml(e.message)}</td></tr>`;
    }
}

async function loadKycVerified() {
    const tbody = document.getElementById('kycVerifiedTableBody');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:30px; color:#6a7a9a;">Loading...</td></tr>';
    
    try {
        let query = sb.from('kyc_verifications').select('*').in('status', ['approved', 'rejected']).order('uploaded_at', { ascending: false });
        
        const keyword = document.getElementById('kycVerifiedSearchInput')?.value.trim() || '';
        const docType = document.getElementById('kycVerifiedDocTypeFilter')?.value || '';
        
        if (keyword) {
            const { data: matchedUsers } = await sb.from('users').select('uid').or(`uid.ilike.%${keyword}%,username.ilike.%${keyword}%`).limit(50);
            if (matchedUsers && matchedUsers.length > 0) {
                const uids = matchedUsers.map(u => u.uid);
                query = query.in('uid', uids);
            } else {
                query = query.ilike('uid', `%${keyword}%`);
            }
        }
        if (docType) {
            query = query.eq('document_type', docType);
        }
        
        const { data: kycList } = await query;
        
        if (!kycList || kycList.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:30px; color:#6a7a9a;">No history records</td></tr>';
            return;
        }
        
        const userGroups = {};
        for (const item of kycList) {
            if (!userGroups[item.uid]) userGroups[item.uid] = [];
            userGroups[item.uid].push(item);
        }
        
        const userMap = {};
        for (const uid of Object.keys(userGroups)) {
            userMap[uid] = await getUsername(uid);
        }
        
        tbody.innerHTML = '';
        for (const [uid, items] of Object.entries(userGroups)) {
            const row = tbody.insertRow();
            const username = userMap[uid] || uid;
            
            const nationalIdFront = items.find(i => i.document_type === 'national_id_front');
            const nationalIdBack = items.find(i => i.document_type === 'national_id_back');
            const passport = items.find(i => i.document_type === 'passport');
            const residentPermit = items.find(i => i.document_type === 'resident_permit');
            
            // 确定主要文档类型
            let docTypeDisplay = '-';
            if (passport) docTypeDisplay = 'Passport';
            else if (residentPermit) docTypeDisplay = 'Resident Permit';
            else if (nationalIdFront) docTypeDisplay = 'National ID';
            
            // Front 图片
            let frontHtml = '';
            const frontImg = nationalIdFront || passport || residentPermit;
            if (frontImg && frontImg.image_url) {
                frontHtml = `<img src="${frontImg.image_url}" class="kyc-doc-image" onclick="window.open('${frontImg.image_url}','_blank')" onerror="this.outerHTML='<div class=\\'kyc-doc-placeholder\\'>No Image</div>'">`;
            } else {
                frontHtml = '<div class="kyc-doc-placeholder">No Image</div>';
            }
            
            // Back 图片
            let backHtml = '';
            if (nationalIdBack && nationalIdBack.image_url) {
                backHtml = `<img src="${nationalIdBack.image_url}" class="kyc-doc-image" onclick="window.open('${nationalIdBack.image_url}','_blank')" onerror="this.outerHTML='<div class=\\'kyc-doc-placeholder\\'>No Image</div>'">`;
            } else if (passport || residentPermit) {
                backHtml = '<div class="kyc-doc-placeholder" style="border-color:transparent;">—</div>';
            } else {
                backHtml = '<div class="kyc-doc-placeholder">No Back</div>';
            }
            
            // ✅ 根据实际状态显示
            const allApproved = items.every(i => i.status === 'approved');
            const allRejected = items.every(i => i.status === 'rejected');
            let statusHtml = '';
            if (allApproved) {
                statusHtml = '<span class="status-badge-approved">✅ Approved</span>';
            } else if (allRejected) {
                statusHtml = '<span class="status-badge-rejected">❌ Rejected</span>';
            } else {
                // 混合状态，显示用逗号分隔
                const statuses = items.map(i => i.status).join(', ');
                statusHtml = `<span style="font-size: 11px; color: #b0c0da;">${statuses}</span>`;
            }
            
            row.insertCell(0).innerHTML = `<span class="badge" style="background: rgba(255,255,255,0.08); padding: 2px 12px; border-radius: 20px; font-size: 11px; color: #c8d2e8; border: 1px solid rgba(255,255,255,0.06);">${escapeHtml(uid)}</span>`;
            row.insertCell(1).innerText = username;
            row.insertCell(2).innerHTML = `<span style="font-size:12px; color:#b0c0da;">${docTypeDisplay}</span>`;
            row.insertCell(3).innerHTML = frontHtml;
            row.insertCell(4).innerHTML = backHtml;
            row.insertCell(5).innerHTML = statusHtml;
        }
        
    } catch (e) {
        console.error('加载KYC历史失败:', e);
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

window.loadKycPage = loadKycPage;