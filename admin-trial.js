// admin-trial.js - Trial Bonus 管理页面（与 Withdrawal/KYC 风格一致）
let activeTrialTab = 'unactivated';
let trialSearchKeyword = '';
let trialConfigData = null;

async function loadTrialPage() {
    const container = document.getElementById('page_trial');
    if (!container) return;
    
    // 先加载 Trial Bonus 配置
    await loadTrialConfig();
    
    container.innerHTML = `
        <div class="card">
            <!-- 顶部：左侧标题 + 右侧按钮 -->
            <div class="withdraw-header" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; margin-bottom: 24px;">
                <h2 style="font-size: 18px; font-weight: 600; color: #d8e0f0; margin: 0;">
                    <i class="fas fa-gift" style="color: #8892a8; margin-right: 10px;"></i>
                    TRIAL BONUS MANAGEMENT
                </h2>
                <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                    <button id="trialTabUnactivated" class="tab-trial-btn active" data-tab="unactivated"><i class="fas fa-user-plus"></i> Unactivated Trial Users</button>
                    <button id="trialTabActivated" class="tab-trial-btn" data-tab="activated"><i class="fas fa-user-check"></i> Activated Trial User Records</button>
                    <button id="refreshTrialBtn" class="btn-primary"><i class="fas fa-sync-alt"></i> Refresh</button>
                </div>
            </div>
            
            <!-- 未激活面板 -->
            <div id="trialUnactivatedPanel" class="trial-panel">
                <!-- 统计卡片 -->
                <div class="stats-grid" style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 24px;">
                    <div class="stat-item" style="background: rgba(12, 16, 28, 0.6); border-radius: 16px; padding: 16px 20px; text-align: center; border: 1px solid rgba(255,255,255,0.04);">
                        <div class="label" style="font-size: 11px; color: #8892a8; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">UNACTIVATED TRIAL USERS</div>
                        <div class="value" id="trialStatUnactivated" style="font-size: 28px; font-weight: 700; color: #ffffff;">0</div>
                    </div>
                    <div class="stat-item" style="background: rgba(12, 16, 28, 0.6); border-radius: 16px; padding: 16px 20px; text-align: center; border: 1px solid rgba(255,255,255,0.04);">
                        <div class="label" style="font-size: 11px; color: #8892a8; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">ACTIVATED TRIAL USERS</div>
                        <div class="value" id="trialStatActivated" style="font-size: 28px; font-weight: 700; color: #ffffff;">0</div>
                    </div>
                    <div class="stat-item" style="background: rgba(12, 16, 28, 0.6); border-radius: 16px; padding: 16px 20px; text-align: center; border: 1px solid rgba(255,255,255,0.04);">
                        <div class="label" style="font-size: 11px; color: #8892a8; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">TRIAL COMMISSIONS RATE</div>
                        <div class="value" id="trialStatRate" style="font-size: 28px; font-weight: 700; color: #ffb84d;">0%</div>
                    </div>
                    <div class="stat-item" style="background: rgba(12, 16, 28, 0.6); border-radius: 16px; padding: 16px 20px; text-align: center; border: 1px solid rgba(255,255,255,0.04);">
                        <div class="label" style="font-size: 11px; color: #8892a8; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">TOTAL TRIAL BONUS PROVIDED</div>
                        <div class="value" id="trialStatTotalProvided" style="font-size: 28px; font-weight: 700; color: #4ade80;">€0</div>
                    </div>
                </div>
                
                <!-- 搜索栏 -->
                <div class="search-bar" style="display: flex; flex-wrap: wrap; gap: 10px; align-items: center; background: rgba(8, 12, 24, 0.5); border-radius: 16px; padding: 12px 16px; margin-bottom: 20px; border: 1px solid rgba(255,255,255,0.03);">
                    <input type="text" id="trialSearchInput" class="search-input" placeholder="Search UID / username / phone" style="flex: 1; min-width: 160px; background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.10); border-radius: 40px; padding: 8px 16px; color: #e6edf5; font-size: 13px; outline: none;">
                    <button id="trialSearchBtn" class="btn-primary" style="padding: 8px 20px; border-radius: 40px; border: none; background: #2a3a5a; color: #e6edf5; font-weight: 600; cursor: pointer; font-size: 13px; white-space: nowrap;"><i class="fas fa-search"></i> Search</button>
                </div>
                
                <div class="table-container" style="max-height: 500px; overflow-y: auto; border-radius: 16px; border: 1px solid rgba(255,255,255,0.03);">
                    <table class="data-table" style="width: 100%; border-collapse: collapse; font-size: 13px; min-width: 900px;">
                        <thead>
                            <tr>
                                <th style="padding: 14px 14px; color: #a8b4d0; font-weight: 600; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid rgba(255,255,255,0.04); background: rgba(10,14,28,0.3); text-align: left; min-width: 120px;">PHONE NUMBER</th>
                                <th style="padding: 14px 14px; color: #a8b4d0; font-weight: 600; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid rgba(255,255,255,0.04); background: rgba(10,14,28,0.3); text-align: left; min-width: 120px;">USER NAME</th>
                                <th style="padding: 14px 14px; color: #a8b4d0; font-weight: 600; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid rgba(255,255,255,0.04); background: rgba(10,14,28,0.3); text-align: left; min-width: 100px;">USER ID</th>
                                <th style="padding: 14px 14px; color: #a8b4d0; font-weight: 600; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid rgba(255,255,255,0.04); background: rgba(10,14,28,0.3); text-align: left; min-width: 150px;">CURRENT TRIAL AMOUNT (€)</th>
                                <th style="padding: 14px 14px; color: #a8b4d0; font-weight: 600; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid rgba(255,255,255,0.04); background: rgba(10,14,28,0.3); text-align: left; min-width: 150px;">ADD TRIAL BONUS (€)</th>
                                <th style="padding: 14px 14px; color: #a8b4d0; font-weight: 600; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid rgba(255,255,255,0.04); background: rgba(10,14,28,0.3); text-align: left; min-width: 180px;">ACTIONS</th>
                            </tr>
                        </thead>
                        <tbody id="trialTableBody"><tr><td colspan="6" style="text-align:center; padding:30px; color:#6a7a9a;">Loading...</td></tr></tbody>
                    </table>
                </div>
            </div>
            
            <!-- 已激活面板 -->
            <div id="trialActivatedPanel" class="trial-panel" style="display: none;">
                <!-- 统计卡片 -->
                <div class="stats-grid" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 24px;">
                    <div class="stat-item" style="background: rgba(12, 16, 28, 0.6); border-radius: 16px; padding: 16px 20px; text-align: center; border: 1px solid rgba(255,255,255,0.04);">
                        <div class="label" style="font-size: 11px; color: #8892a8; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">ACTIVATED TRIAL USERS</div>
                        <div class="value" id="trialActivatedStatUsers" style="font-size: 28px; font-weight: 700; color: #ffffff;">0</div>
                    </div>
                    <div class="stat-item" style="background: rgba(12, 16, 28, 0.6); border-radius: 16px; padding: 16px 20px; text-align: center; border: 1px solid rgba(255,255,255,0.04);">
                        <div class="label" style="font-size: 11px; color: #8892a8; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">TRIAL COMMISSIONS RATE</div>
                        <div class="value" id="trialActivatedStatRate" style="font-size: 28px; font-weight: 700; color: #ffb84d;">0%</div>
                    </div>
                    <div class="stat-item" style="background: rgba(12, 16, 28, 0.6); border-radius: 16px; padding: 16px 20px; text-align: center; border: 1px solid rgba(255,255,255,0.04);">
                        <div class="label" style="font-size: 11px; color: #8892a8; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">TOTAL TRIAL BONUS PROVIDED</div>
                        <div class="value" id="trialActivatedStatTotalProvided" style="font-size: 28px; font-weight: 700; color: #4ade80;">€0</div>
                    </div>
                </div>
                
                <!-- 搜索栏 -->
                <div class="search-bar" style="display: flex; flex-wrap: wrap; gap: 10px; align-items: center; background: rgba(8, 12, 24, 0.5); border-radius: 16px; padding: 12px 16px; margin-bottom: 20px; border: 1px solid rgba(255,255,255,0.03);">
                    <input type="text" id="trialActivatedSearchInput" class="search-input" placeholder="Search UID / username / phone" style="flex: 1; min-width: 160px; background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.10); border-radius: 40px; padding: 8px 16px; color: #e6edf5; font-size: 13px; outline: none;">
                    <button id="trialActivatedSearchBtn" class="btn-primary" style="padding: 8px 20px; border-radius: 40px; border: none; background: #2a3a5a; color: #e6edf5; font-weight: 600; cursor: pointer; font-size: 13px; white-space: nowrap;"><i class="fas fa-search"></i> Search</button>
                    <button id="trialActivatedClearBtn" class="btn-primary" style="padding: 8px 18px; border-radius: 40px; border: none; background: rgba(255,255,255,0.06); color: #b8c4de; font-weight: 500; cursor: pointer; font-size: 13px; white-space: nowrap;"><i class="fas fa-times"></i> Clear</button>
                </div>
                
                <div class="table-container" style="max-height: 500px; overflow-y: auto; border-radius: 16px; border: 1px solid rgba(255,255,255,0.03);">
                    <table class="data-table" style="width: 100%; border-collapse: collapse; font-size: 13px; min-width: 900px;">
                        <thead>
                            <tr>
                                <th style="padding: 14px 14px; color: #a8b4d0; font-weight: 600; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid rgba(255,255,255,0.04); background: rgba(10,14,28,0.3); text-align: left; min-width: 120px;">PHONE NUMBER</th>
                                <th style="padding: 14px 14px; color: #a8b4d0; font-weight: 600; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid rgba(255,255,255,0.04); background: rgba(10,14,28,0.3); text-align: left; min-width: 120px;">USER NAME</th>
                                <th style="padding: 14px 14px; color: #a8b4d0; font-weight: 600; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid rgba(255,255,255,0.04); background: rgba(10,14,28,0.3); text-align: left; min-width: 100px;">USER ID</th>
                                <th style="padding: 14px 14px; color: #a8b4d0; font-weight: 600; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid rgba(255,255,255,0.04); background: rgba(10,14,28,0.3); text-align: left; min-width: 150px;">ACTIVATED TRIAL AMOUNT (€)</th>
                                <th style="padding: 14px 14px; color: #a8b4d0; font-weight: 600; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid rgba(255,255,255,0.04); background: rgba(10,14,28,0.3); text-align: left; min-width: 160px;">ACTIVATED DATE</th>
                            </tr>
                        </thead>
                        <tbody id="trialActivatedTableBody"><tr><td colspan="5" style="text-align:center; padding:30px; color:#6a7a9a;">Loading...</td></tr></tbody>
                    </table>
                </div>
            </div>
        </div>
    `;
    
    // 添加样式
    const style = document.createElement('style');
    style.textContent = `
        .tab-trial-btn {
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
        .tab-trial-btn:hover {
            background: rgba(255,255,255,0.08);
            color: #e6edf5;
        }
        .tab-trial-btn.active {
            background: #2a3a5a;
            color: #e6edf5;
            border-color: #3a5a7a;
        }
        .trial-panel { animation: fadeIn 0.3s ease; }
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
        .btn-trial-add { background: rgba(74, 222, 128, 0.15); color: #4ade80; }
        .btn-trial-add:hover { background: rgba(74, 222, 128, 0.25); }
        .btn-trial-deduct { background: rgba(232, 128, 128, 0.15); color: #e88080; }
        .btn-trial-deduct:hover { background: rgba(232, 128, 128, 0.25); }
        .trial-amount-input {
            width: 100px;
            background: rgba(255,255,255,0.06);
            border: 1px solid rgba(255,255,255,0.10);
            border-radius: 8px;
            padding: 6px 10px;
            color: #e6edf5;
            font-size: 13px;
            text-align: center;
            outline: none;
            transition: 0.2s;
        }
        .trial-amount-input:focus {
            border-color: #4a7cff;
            background: rgba(255,255,255,0.08);
        }
        .trial-amount-input::placeholder {
            color: rgba(255,255,255,0.15);
        }
        .status-badge-activated {
            background: rgba(74, 222, 128, 0.10);
            color: #4ade80;
            padding: 2px 12px;
            border-radius: 40px;
            font-size: 11px;
            display: inline-block;
        }
        .status-badge-unactivated {
            background: rgba(212, 192, 154, 0.10);
            color: #d4c09a;
            padding: 2px 12px;
            border-radius: 40px;
            font-size: 11px;
            display: inline-block;
        }
        @media (max-width: 768px) {
            .stats-grid { grid-template-columns: repeat(2, 1fr) !important; }
            .tab-trial-btn { font-size: 12px; padding: 6px 14px; }
            .search-bar { flex-direction: column; align-items: stretch; }
            .search-bar input { width: 100% !important; min-width: unset; flex: 1 1 auto !important; }
            .trial-amount-input { width: 100%; }
        }
    `;
    document.head.appendChild(style);
    
    // 绑定标签切换
    document.getElementById('trialTabUnactivated')?.addEventListener('click', function() { switchTrialTab('unactivated'); });
    document.getElementById('trialTabActivated')?.addEventListener('click', function() { switchTrialTab('activated'); });
    document.getElementById('refreshTrialBtn')?.addEventListener('click', function() {
        loadTrialUnactivated();
        loadTrialActivated();
        updateTrialStats();
    });
    
    // 绑定待处理搜索
    document.getElementById('trialSearchBtn')?.addEventListener('click', function() {
        trialSearchKeyword = document.getElementById('trialSearchInput').value.trim();
        loadTrialUnactivated();
    });
    document.getElementById('trialSearchInput')?.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            trialSearchKeyword = document.getElementById('trialSearchInput').value.trim();
            loadTrialUnactivated();
        }
    });
    
    // 绑定已激活搜索
    document.getElementById('trialActivatedSearchBtn')?.addEventListener('click', function() {
        trialSearchKeyword = document.getElementById('trialActivatedSearchInput').value.trim();
        loadTrialActivated();
    });
    document.getElementById('trialActivatedClearBtn')?.addEventListener('click', function() {
        document.getElementById('trialActivatedSearchInput').value = '';
        trialSearchKeyword = '';
        loadTrialActivated();
    });
    document.getElementById('trialActivatedSearchInput')?.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            trialSearchKeyword = document.getElementById('trialActivatedSearchInput').value.trim();
            loadTrialActivated();
        }
    });
    
    // 加载数据
    await loadTrialUnactivated();
    await loadTrialActivated();
    await updateTrialStats();
}

function switchTrialTab(tab) {
    activeTrialTab = tab;
    
    var unactivatedBtn = document.getElementById('trialTabUnactivated');
    var activatedBtn = document.getElementById('trialTabActivated');
    var unactivatedPanel = document.getElementById('trialUnactivatedPanel');
    var activatedPanel = document.getElementById('trialActivatedPanel');
    
    unactivatedBtn.classList.remove('active');
    activatedBtn.classList.remove('active');
    
    if (tab === 'unactivated') {
        unactivatedBtn.classList.add('active');
        unactivatedPanel.style.display = 'block';
        activatedPanel.style.display = 'none';
        loadTrialUnactivated();
    } else {
        activatedBtn.classList.add('active');
        unactivatedPanel.style.display = 'none';
        activatedPanel.style.display = 'block';
        loadTrialActivated();
    }
}

async function loadTrialConfig() {
    try {
        const { data, error } = await sb
            .from('trial_bonus_config')
            .select('*')
            .eq('id', 1)
            .single();
        
        if (error) {
            console.error('加载Trial配置失败:', error);
            trialConfigData = { commission_rate: 0.35, trial_amount: 250 };
        } else {
            trialConfigData = data;
        }
    } catch (e) {
        console.error('加载Trial配置失败:', e);
        trialConfigData = { commission_rate: 0.35, trial_amount: 250 };
    }
}

async function updateTrialStats() {
    try {
        // 获取所有用户
        const { data: users } = await sb.from('users').select('trial_bonus_amount, trial_bonus_activated');
        
        // 统计未激活（trial_bonus_activated = false 或 null）
        const unactivated = users ? users.filter(u => !u.trial_bonus_activated).length : 0;
        // 统计已激活（trial_bonus_activated = true）
        const activated = users ? users.filter(u => u.trial_bonus_activated === true).length : 0;
        
        // 计算总 Trial Bonus 已提供（从 deposits 表中统计）
        let totalProvided = 0;
        const { data: deposits } = await sb
            .from('deposits')
            .select('amount')
            .eq('type', 'trial_bonus');
        
        if (deposits) {
            totalProvided = deposits.reduce((sum, d) => sum + (d.amount || 0), 0);
        }
        
        const rate = trialConfigData?.commission_rate || 0.35;
        
        // Unactivated 页面
        document.getElementById('trialStatUnactivated').innerText = unactivated;
        document.getElementById('trialStatActivated').innerText = activated;
        document.getElementById('trialStatRate').innerHTML = rate + '%';
        document.getElementById('trialStatTotalProvided').innerHTML = '€' + totalProvided.toFixed(2);
        
        // Activated 页面
        document.getElementById('trialActivatedStatUsers').innerText = activated;
        document.getElementById('trialActivatedStatRate').innerHTML = rate + '%';
        document.getElementById('trialActivatedStatTotalProvided').innerHTML = '€' + totalProvided.toFixed(2);
        
    } catch (e) {
        console.error('更新Trial统计失败:', e);
    }
}

async function loadTrialUnactivated() {
    const tbody = document.getElementById('trialTableBody');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:30px; color:#6a7a9a;">Loading...</td></tr>';
    
    try {
        // 🔥 关键修改：查询 trial_bonus_activated = false 的用户
        let query = sb.from('users')
            .select('uid, username, phone, trial_bonus_amount, trial_bonus_activated')
            .eq('trial_bonus_activated', false)
            .order('uid', { ascending: true });
        
        const keyword = document.getElementById('trialSearchInput')?.value.trim() || '';
        if (keyword) {
            query = query.or(`uid.ilike.%${keyword}%,username.ilike.%${keyword}%,phone.ilike.%${keyword}%`);
        }
        
        const { data: users } = await query;
        
        if (!users || users.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:30px; color:#6a7a9a;">No unactivated trial users</td></tr>';
            return;
        }
        
        tbody.innerHTML = '';
        for (const user of users) {
            const row = tbody.insertRow();
            
            row.insertCell(0).innerHTML = `<span style="font-size:12px; color:#b0c0da;">${escapeHtml(user.phone || '-')}</span>`;
            row.insertCell(1).innerHTML = `<span style="font-weight:500; color:#d8e0f0;">${escapeHtml(user.username)}</span>`;
            row.insertCell(2).innerHTML = `<span class="badge" style="background: rgba(255,255,255,0.08); padding: 2px 12px; border-radius: 20px; font-size: 11px; color: #c8d2e8; border: 1px solid rgba(255,255,255,0.06);">${escapeHtml(user.uid)}</span>`;
            row.insertCell(3).innerHTML = `<span style="font-weight:600; color:#8892a8;">€${(user.trial_bonus_amount || 0).toFixed(2)}</span>`;
            row.insertCell(4).innerHTML = `
                <input type="number" class="trial-amount-input" id="trial_amount_${user.uid}" placeholder="0.00" step="0.01" min="0" style="width:100px; background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.10); border-radius:8px; padding:6px 10px; color:#e6edf5; font-size:13px; text-align:center; outline:none; transition:0.2s;">
            `;
            row.insertCell(5).innerHTML = `
                <button class="btn-sm-action btn-trial-add trial-add-btn" data-uid="${user.uid}" data-username="${escapeHtml(user.username)}">
                    <i class="fas fa-plus"></i> Add Trial
                </button>
            `;
        }
        
        // 绑定 Add Trial 事件
        document.querySelectorAll('.trial-add-btn').forEach(btn => {
            btn.addEventListener('click', async function() {
                const uid = this.dataset.uid;
                const username = this.dataset.username;
                const input = document.getElementById(`trial_amount_${uid}`);
                const amount = parseFloat(input.value);
                
                if (isNaN(amount) || amount <= 0) {
                    showToast('Please enter a valid amount', 'error');
                    return;
                }
                
                await processTrialAdd(uid, username, amount);
            });
        });
        
        // Enter 键触发
        document.querySelectorAll('.trial-amount-input').forEach(input => {
            input.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    const row = this.closest('tr');
                    const addBtn = row.querySelector('.trial-add-btn');
                    if (addBtn) addBtn.click();
                }
            });
        });
        
    } catch (e) {
        console.error('加载未激活Trial用户失败:', e);
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:30px; color:#ff8888;">加载失败: ${escapeHtml(e.message)}</td></tr>`;
    }
}

async function loadTrialActivated() {
    const tbody = document.getElementById('trialActivatedTableBody');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:30px; color:#6a7a9a;">Loading...</td></tr>';
    
    try {
        // 1. 一次查询获取所有已激活用户
        let query = sb.from('users')
            .select('uid, username, phone, trial_bonus_amount, trial_bonus_activated')
            .eq('trial_bonus_activated', true)
            .order('uid', { ascending: true });
        
        const keyword = document.getElementById('trialActivatedSearchInput')?.value.trim() || '';
        if (keyword) {
            query = query.or(`uid.ilike.%${keyword}%,username.ilike.%${keyword}%,phone.ilike.%${keyword}%`);
        }
        
        const { data: users } = await query;
        
        if (!users || users.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:30px; color:#6a7a9a;">No activated trial users</td></tr>';
            return;
        }
        
        // ============================================================
        // ✅ 优化：批量获取所有用户的激活日期（一次查询）
        // ============================================================
        const uids = users.map(user => user.uid);
        const { data: deposits } = await sb
            .from('deposits')
            .select('uid, amount, created_at')
            .in('uid', uids)
            .eq('type', 'trial_bonus')
            .order('created_at', { ascending: true });
        
        // 创建 uid -> 第一条 trial_bonus 记录的映射
        const depositMap = {};
        if (deposits) {
            deposits.forEach(deposit => {
                // 只保留每个 uid 的第一条记录（最早的）
                if (!depositMap[deposit.uid]) {
                    depositMap[deposit.uid] = {
                        amount: deposit.amount || 0,
                        created_at: deposit.created_at
                    };
                }
            });
        }
        
        tbody.innerHTML = '';
        for (const user of users) {
            const row = tbody.insertRow();
            
            // ✅ 从内存中获取激活日期和金额
            const depositInfo = depositMap[user.uid] || { amount: 0, created_at: null };
            const activatedDate = depositInfo.created_at ? new Date(depositInfo.created_at).toLocaleString() : '-';
            const activatedAmount = depositInfo.amount || 0;
            
            row.insertCell(0).innerHTML = `<span style="font-size:12px; color:#b0c0da;">${escapeHtml(user.phone || '-')}</span>`;
            row.insertCell(1).innerHTML = `<span style="font-weight:500; color:#d8e0f0;">${escapeHtml(user.username)}</span>`;
            row.insertCell(2).innerHTML = `<span class="badge" style="background: rgba(255,255,255,0.10); padding: 2px 12px; border-radius: 20px; font-size: 12px; color: #e8edf5; border: 1px solid rgba(255,255,255,0.12); font-weight: 600; letter-spacing: 0.3px;">${escapeHtml(user.uid)}</span>`;
            row.insertCell(3).innerHTML = `<span style="font-weight:600; color:#4ade80;">€${activatedAmount.toFixed(2)}</span>`;
            row.insertCell(4).innerHTML = `<span style="font-size:12px; color:#8892a8;">${activatedDate}</span>`;
        }
        
    } catch (e) {
        console.error('加载已激活Trial用户失败:', e);
        tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:30px; color:#ff8888;">加载失败: ${escapeHtml(e.message)}</td></tr>`;
    }
}

async function processTrialAdd(uid, username, amount) {
    try {
        // 🔥 获取当前用户数据
        const { data: user, error: fetchError } = await sb
            .from('users')
            .select('trial_bonus_amount, trial_bonus_activated')
            .eq('uid', uid)
            .single();
        
        if (fetchError) throw fetchError;
        
        const currentAmount = user?.trial_bonus_amount || 0;
        const newAmount = currentAmount + amount;
        
        // 🔥 更新用户 trial_bonus_amount 和 trial_bonus_activated
        const { error: updateError } = await sb
            .from('users')
            .update({ 
                trial_bonus_amount: newAmount,
                trial_bonus_activated: true   // 🔥 标记为已激活
            })
            .eq('uid', uid);
        
        if (updateError) throw updateError;
        
        // 记录到 deposits
        await sb.from('deposits').insert([{
            uid: uid,
            username: username,
            amount: amount,
            type: 'trial_bonus',
            description: 'Trial Bonus Added',
            created_at: new Date().toISOString()
        }]);
        
        showToast(`✅ Added €${amount.toFixed(2)} trial bonus to ${username}`, 'success');
        
        // 刷新所有列表
        await loadTrialUnactivated();
        await loadTrialActivated();
        await updateTrialStats();
        
    } catch (e) {
        console.error('Add Trial Bonus 失败:', e);
        showToast('Failed to add trial bonus: ' + e.message, 'error');
    }
}

// 🔥 注意：Deduct Trial 功能已移除，因为前端完成30单后会自动扣除
// 但保留此函数以防需要手动操作，但不显示在界面上

function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

window.loadTrialPage = loadTrialPage;