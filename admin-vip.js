// admin-vip.js - VIP配置页面 + Trial Bonus 独立配置（与 Withdrawal 页面风格一致）
let vipSearchKeyword = '';
let selectedVipLevel = '';

async function loadVipPage() {
    const container = document.getElementById('page_vip');
    if (!container) return;
    
    container.innerHTML = `
        <div class="card">
            <!-- 顶部：左侧标题 + 右侧按钮 -->
            <div class="withdraw-header" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; margin-bottom: 24px;">
                <h2 style="font-size: 18px; font-weight: 600; color: #d8e0f0; margin: 0;">
                    <i class="fas fa-crown" style="color: #8892a8; margin-right: 10px;"></i>
                    VIP RANKING SETTINGS
                </h2>
                <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                    <button id="refreshVipBtn" class="btn-primary"><i class="fas fa-sync-alt"></i> Refresh</button>
                </div>
            </div>
            
            <!-- VIP 等级配置卡片（4个：Trial + Normal + VIP + SVIP） -->
            <div id="vipConfigContainer" style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 28px;"></div>
            
            <!-- 用户VIP管理 -->
            <div style="background: rgba(12, 16, 28, 0.6); border-radius: 16px; padding: 20px; border: 1px solid rgba(255,255,255,0.04);">
                <h3 style="font-size: 14px; font-weight: 600; color: #d8e0f0; margin-bottom: 16px;">
                    <i class="fas fa-users-cog" style="color: #8892a8; margin-right: 8px;"></i>
                    User VIP Management
                </h3>
                
                <!-- 搜索栏 -->
                <div class="search-bar" style="display: flex; flex-wrap: wrap; gap: 10px; align-items: center; background: rgba(8, 12, 24, 0.5); border-radius: 16px; padding: 12px 16px; margin-bottom: 16px; border: 1px solid rgba(255,255,255,0.03);">
                    <input type="text" id="vipUserSearchInput" class="search-input" placeholder="Search UID / username" style="flex: 1; min-width: 160px; background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.10); border-radius: 40px; padding: 8px 16px; color: #e6edf5; font-size: 13px; outline: none;">
                    
                    <!-- 自定义下拉 -->
                    <div style="min-width: 160px; flex-shrink: 0;">
                        <div class="custom-select-wrapper" id="vipRankSelect">
                            <div class="custom-select-display">
                                <span>All Rankings</span>
                                <i class="fas fa-chevron-down" style="color: #5a6a82; font-size: 11px; margin-left: 6px;"></i>
                            </div>
                            <div class="custom-select-dropdown">
                                <div class="custom-select-options">
                                    <div class="custom-select-option selected" data-value="">All Rankings</div>
                                    <div class="custom-select-option" data-value="0">Trial Lv.0</div>
                                    <div class="custom-select-option" data-value="1">Normal Lv.1</div>
                                    <div class="custom-select-option" data-value="2">VIP Lv.2</div>
                                    <div class="custom-select-option" data-value="3">SVIP Lv.3</div>
                                </div>
                            </div>
                            <input type="hidden" class="custom-select-hidden" value="">
                        </div>
                    </div>
                    
                    <button id="vipUserSearchBtn" class="btn-primary" style="padding: 8px 20px; border-radius: 40px; border: none; background: #2a3a5a; color: #e6edf5; font-weight: 600; cursor: pointer; font-size: 13px; white-space: nowrap;">
                        <i class="fas fa-search"></i> Search
                    </button>
                    <button id="vipUserClearBtn" class="btn-primary" style="padding: 8px 18px; border-radius: 40px; border: none; background: rgba(255,255,255,0.06); color: #b8c4de; font-weight: 500; cursor: pointer; font-size: 13px; white-space: nowrap;">
                        <i class="fas fa-times"></i> Clear
                    </button>
                </div>
                
                <!-- 用户表格 -->
                <div class="table-container" style="max-height: 400px; overflow-y: auto; border-radius: 16px; border: 1px solid rgba(255,255,255,0.03);">
                    <table class="data-table" style="width: 100%; border-collapse: collapse; font-size: 13px; min-width: 700px;">
                        <thead>
                            <tr>
                                <th style="padding: 14px 16px; color: #a8b4d0; font-weight: 600; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid rgba(255,255,255,0.04); background: rgba(10,14,28,0.3); text-align: left; min-width: 120px;">User ID</th>
                                <th style="padding: 14px 16px; color: #a8b4d0; font-weight: 600; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid rgba(255,255,255,0.04); background: rgba(10,14,28,0.3); text-align: left; min-width: 120px;">Username</th>
                                <th style="padding: 14px 16px; color: #a8b4d0; font-weight: 600; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid rgba(255,255,255,0.04); background: rgba(10,14,28,0.3); text-align: left; min-width: 140px;">Deposited Amount</th>
                                <th style="padding: 14px 16px; color: #a8b4d0; font-weight: 600; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid rgba(255,255,255,0.04); background: rgba(10,14,28,0.3); text-align: left; min-width: 140px;">Ranking</th>
                                <th style="padding: 14px 16px; color: #a8b4d0; font-weight: 600; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid rgba(255,255,255,0.04); background: rgba(10,14,28,0.3); text-align: left; min-width: 160px;">Last Deposited Date</th>
                            </tr>
                        </thead>
                        <tbody id="vipUserTableBody"><tr><td colspan="5" style="text-align:center; padding:30px; color:#6a7a9a;">Loading...</td></tr></tbody>
                    </table>
                </div>
            </div>
        </div>
    `;
    
    // 添加样式
    const style = document.createElement('style');
    style.textContent = `
        /* VIP 等级卡片 */
        .vip-tier-card {
            background: rgba(12, 16, 28, 0.6);
            border-radius: 16px;
            padding: 18px 16px;
            border: 1px solid rgba(255,255,255,0.04);
            transition: all 0.3s ease;
        }
        .vip-tier-card:hover {
            border-color: rgba(200,176,144,0.15);
            transform: translateY(-2px);
            box-shadow: 0 8px 24px rgba(0,0,0,0.15);
        }
        .vip-tier-card .tier-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 12px;
            padding-bottom: 8px;
            border-bottom: 1px solid rgba(255,255,255,0.04);
        }
        .vip-tier-card .tier-name {
            font-size: 15px;
            font-weight: 700;
            color: #d8e0f0;
        }
        .vip-tier-card .tier-badge {
            font-size: 10px;
            padding: 2px 12px;
            border-radius: 20px;
            background: rgba(200,176,144,0.12);
            color: #c8b090;
        }
        .vip-tier-card .tier-field {
            margin-bottom: 10px;
        }
        .vip-tier-card .tier-field:last-child {
            margin-bottom: 0;
        }
        .vip-tier-card .tier-field label {
            display: block;
            font-size: 10px;
            color: #6a7a92;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 2px;
        }
        .vip-tier-card .tier-field input {
            width: 100%;
            background: rgba(255,255,255,0.04);
            border: 1px solid rgba(255,255,255,0.06);
            border-radius: 8px;
            padding: 6px 12px;
            color: #e6edf5;
            font-size: 13px;
            outline: none;
            transition: 0.2s;
            box-sizing: border-box;
        }
        .vip-tier-card .tier-field input:focus {
            border-color: rgba(200,176,144,0.2);
            background: rgba(255,255,255,0.06);
        }
        .vip-tier-card .save-tier-btn {
            width: 100%;
            margin-top: 10px;
            background: rgba(200,176,144,0.06);
            border: 1px solid rgba(200,176,144,0.08);
            border-radius: 40px;
            padding: 6px 0;
            color: #c8b090;
            font-weight: 600;
            font-size: 12px;
            cursor: pointer;
            transition: all 0.3s;
            font-family: 'Inter', sans-serif;
        }
        .vip-tier-card .save-tier-btn:hover {
            background: rgba(200,176,144,0.12);
        }
        
        /* 自定义下拉 - 与 withdrawal 页面一致 */
        #page_vip .custom-select-wrapper {
            position: relative;
            width: 100%;
            min-width: 160px;
        }
        #page_vip .custom-select-display {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 8px 14px 8px 16px;
            background: rgba(255,255,255,0.08);
            border: 1px solid rgba(255,255,255,0.10);
            border-radius: 40px;
            cursor: pointer;
            color: #e6edf5;
            font-size: 13px;
            font-weight: 500;
            transition: 0.25s ease;
            min-height: 38px;
            user-select: none;
        }
        #page_vip .custom-select-display:hover {
            border-color: rgba(255,255,255,0.18);
            background: rgba(255,255,255,0.10);
        }
        #page_vip .custom-select-display i {
            color: #5a6a82;
            font-size: 11px;
            transition: 0.25s ease;
            margin-left: 6px;
            flex-shrink: 0;
        }
        #page_vip .custom-select-dropdown {
            position: absolute;
            top: calc(100% + 6px);
            left: 0;
            right: 0;
            background: rgba(14, 18, 30, 0.98);
            backdrop-filter: blur(16px);
            border: 1px solid rgba(255,255,255,0.06);
            border-radius: 12px;
            padding: 6px 0;
            opacity: 0;
            visibility: hidden;
            transform: translateY(-6px) scale(0.98);
            transition: all 0.2s ease;
            z-index: 100;
            box-shadow: 0 20px 60px rgba(0,0,0,0.5);
            overflow: hidden;
            max-height: 0;
            overflow-y: auto;
        }
        #page_vip .custom-select-dropdown.open {
            opacity: 1;
            visibility: visible;
            transform: translateY(0) scale(1);
            max-height: 240px;
        }
        #page_vip .custom-select-dropdown::-webkit-scrollbar { width: 3px; }
        #page_vip .custom-select-dropdown::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 4px; }
        #page_vip .custom-select-options { padding: 4px 0; }
        #page_vip .custom-select-option {
            padding: 10px 18px;
            cursor: pointer;
            transition: 0.15s ease;
            color: #b8c4de;
            font-size: 13px;
            font-weight: 500;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        #page_vip .custom-select-option:hover {
            background: rgba(255,255,255,0.04);
            color: #e6edf5;
        }
        #page_vip .custom-select-option.selected {
            background: rgba(255,255,255,0.02);
            color: #e6edf5;
        }
        #page_vip .custom-select-option.selected::after {
            content: ' ✓';
            color: #6a8af0;
        }
        
        /* 徽章颜色 */
        .rank-badge-trial { background: rgba(255,184,77,0.12); color: #ffb84d; }
        .rank-badge-normal { background: rgba(200,176,144,0.12); color: #c8b090; }
        .rank-badge-vip { background: rgba(74,124,255,0.12); color: #4a7cff; }
        .rank-badge-svip { background: rgba(255,184,77,0.12); color: #ffb84d; }
        
        @media (max-width: 1200px) {
            #vipConfigContainer {
                grid-template-columns: repeat(2, 1fr) !important;
            }
        }
        @media (max-width: 768px) {
            #vipConfigContainer {
                grid-template-columns: 1fr !important;
            }
            .search-bar {
                flex-direction: column;
                align-items: stretch;
            }
            .search-bar input, .search-bar .custom-select-wrapper {
                width: 100% !important;
                min-width: unset;
                flex: 1 1 auto !important;
            }
            #page_vip .custom-select-wrapper {
                min-width: unset !important;
            }
        }
    `;
    document.head.appendChild(style);
    
    // ========== 初始化自定义下拉 ==========
    initVipCustomSelect();
    
    // ========== 加载数据 ==========
    await loadVipConfig();
    await loadVipUsers();
    
    // ========== 绑定事件 ==========
    document.getElementById('refreshVipBtn')?.addEventListener('click', function() {
        loadVipConfig();
        loadVipUsers();
    });
    
    document.getElementById('vipUserSearchBtn')?.addEventListener('click', function() {
        vipSearchKeyword = document.getElementById('vipUserSearchInput').value.trim();
        loadVipUsers();
    });
    
    document.getElementById('vipUserClearBtn')?.addEventListener('click', function() {
        document.getElementById('vipUserSearchInput').value = '';
        vipSearchKeyword = '';
        // 重置下拉
        const selectWrapper = document.getElementById('vipRankSelect');
        if (selectWrapper) {
            const hidden = selectWrapper.querySelector('.custom-select-hidden');
            const display = selectWrapper.querySelector('.custom-select-display');
            if (hidden) hidden.value = '';
            if (display) display.innerHTML = '<span>All Rankings</span><i class="fas fa-chevron-down" style="color: #5a6a82; font-size: 11px; margin-left: 6px;"></i>';
            selectedVipLevel = '';
        }
        loadVipUsers();
    });
    
    document.getElementById('vipUserSearchInput')?.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            vipSearchKeyword = document.getElementById('vipUserSearchInput').value.trim();
            loadVipUsers();
        }
    });
}

// ========== 自定义下拉初始化 ==========
function initVipCustomSelect() {
    const wrapper = document.getElementById('vipRankSelect');
    if (!wrapper) return;
    if (wrapper.dataset.initialized === 'true') return;
    wrapper.dataset.initialized = 'true';
    
    const display = wrapper.querySelector('.custom-select-display');
    const dropdown = wrapper.querySelector('.custom-select-dropdown');
    const options = wrapper.querySelectorAll('.custom-select-option');
    const hidden = wrapper.querySelector('.custom-select-hidden');
    
    display.addEventListener('click', function(e) {
        e.stopPropagation();
        const isOpen = dropdown.classList.contains('open');
        document.querySelectorAll('#page_vip .custom-select-dropdown.open').forEach(function(el) {
            if (el !== dropdown) el.classList.remove('open');
        });
        dropdown.classList.toggle('open');
    });
    
    options.forEach(function(option) {
        option.addEventListener('click', function(e) {
            e.stopPropagation();
            const value = this.dataset.value;
            const label = this.textContent.trim();
            
            options.forEach(function(opt) { opt.classList.remove('selected'); });
            this.classList.add('selected');
            
            hidden.value = value;
            display.innerHTML = '<span>' + label + '</span><i class="fas fa-chevron-down" style="color: #5a6a82; font-size: 11px; margin-left: 6px;"></i>';
            dropdown.classList.remove('open');
            
            selectedVipLevel = value;
            loadVipUsers();
        });
    });
    
    document.addEventListener('click', function() {
        dropdown.classList.remove('open');
    });
}

// ========== 加载 VIP 配置 ==========
async function loadVipConfig() {
    const container = document.getElementById('vipConfigContainer');
    if (!container) return;
    
    try {
        // 获取 VIP 设置
        const { data: vips, error } = await sb.from('vip_settings').select('*').order('level', { ascending: true });
        if (error) throw error;
        
        // 获取 Trial Bonus 配置
        const { data: trialData } = await sb
            .from('trial_bonus_config')
            .select('*')
            .eq('id', 1)
            .single();
        
        const trialConfig = trialData || { trial_amount: 250, orders_limit: 30, commission_rate: 0.35 };
        
        const tierColors = {
            1: '#c8b090',
            2: '#4a7cff',
            3: '#ffb84d'
        };
        
        const tierBadges = {
            1: 'Lv.1',
            2: 'Lv.2',
            3: 'Lv.3'
        };
        
        const tierNames = {
            1: 'Normal',
            2: 'VIP',
            3: 'SVIP'
        };
        
        container.innerHTML = '';
        
        // ========== 1. Trial 卡片（独立，放到 Normal 左侧） ==========
        const trialCard = document.createElement('div');
        trialCard.className = 'vip-tier-card';
        trialCard.style.borderColor = 'rgba(255,184,77,0.15)';
        trialCard.innerHTML = `
            <div class="tier-header">
                <span class="tier-name" style="color: #ffb84d;">Trial Bonus</span>
                <span class="tier-badge" style="background: rgba(255,184,77,0.12); color: #ffb84d;">Lv.0</span>
            </div>
            <div class="tier-field">
                <label>Trial Amount (€)</label>
                <input type="number" id="trialAmount" value="${trialConfig.trial_amount || 250}" step="0.01" min="0">
            </div>
            <div class="tier-field">
                <label>Orders Limit</label>
                <input type="number" id="trialOrdersLimit" value="${trialConfig.orders_limit || 30}" step="1" min="1">
            </div>
            <div class="tier-field">
                <label>Commissions Rate (%)</label>
                <input type="number" id="trialRate" value="${trialConfig.commission_rate || 0.35}" step="0.01" min="0">
            </div>
            <button class="save-tier-btn" id="saveTrialBonusBtn" style="border-color: rgba(255,184,77,0.15); color: #ffb84d;">Save Changes</button>
        `;
        container.appendChild(trialCard);
        
        // ========== 2. Normal / VIP / SVIP 卡片 ==========
        // 只处理 level 1, 2, 3
        const vipLevels = vips.filter(function(v) { return v.level >= 1 && v.level <= 3; });
        
        for (const vip of vipLevels) {
            const level = vip.level;
            const color = tierColors[level] || '#c8b090';
            
            const card = document.createElement('div');
            card.className = 'vip-tier-card';
            card.innerHTML = `
                <div class="tier-header">
                    <span class="tier-name" style="color: ${color};">${tierNames[level] || 'Level ' + level}</span>
                    <span class="tier-badge">${tierBadges[level] || 'Lv.' + level}</span>
                </div>
                <div class="tier-field">
                    <label>Require Amount (€)</label>
                    <input type="number" id="deposit_${level}" value="${vip.required_deposit || 0}" step="0.01" min="0">
                </div>
                <div class="tier-field">
                    <label>Orders Limit</label>
                    <input type="number" id="limit_${level}" value="${vip.orders_limit || 30}" step="1" min="1">
                </div>
                <div class="tier-field">
                    <label>Commissions Rate (%)</label>
                    <input type="number" id="rate_${level}" value="${vip.commission_rate || 0.51}" step="0.01" min="0">
                </div>
                <button class="save-tier-btn save-vip-btn" data-level="${level}">Save Changes</button>
            `;
            container.appendChild(card);
        }
        
        // ========== 绑定事件 ==========
        document.querySelectorAll('.save-vip-btn').forEach(function(btn) {
            btn.addEventListener('click', function() {
                saveVipConfig(parseInt(this.dataset.level));
            });
        });
        
        document.getElementById('saveTrialBonusBtn')?.addEventListener('click', saveTrialBonusConfig);
        
    } catch (e) {
        console.error('加载VIP配置失败:', e);
        container.innerHTML = '<div style="text-align:center; padding:20px; color:#e88080;">加载失败: ' + e.message + '</div>';
    }
}

// ========== 保存 VIP 配置 ==========
async function saveVipConfig(level) {
    const deposit = parseFloat(document.getElementById('deposit_' + level).value) || 0;
    const limit = parseInt(document.getElementById('limit_' + level).value) || 30;
    const rate = parseFloat(document.getElementById('rate_' + level).value) || 0.51;
    
    try {
        const { error } = await sb.from('vip_settings').update({
            required_deposit: deposit,
            orders_limit: limit,
            commission_rate: rate
        }).eq('level', level);
        
        if (error) throw error;
        showToast('VIP Lv.' + level + ' 配置已保存', 'success');
        loadVipConfig();
    } catch (e) {
        showToast('保存失败: ' + e.message, 'error');
    }
}

// ========== 保存 Trial Bonus 配置 ==========
async function saveTrialBonusConfig() {
    const amount = parseFloat(document.getElementById('trialAmount').value) || 250;
    const limit = parseInt(document.getElementById('trialOrdersLimit').value) || 30;
    const rate = parseFloat(document.getElementById('trialRate').value) || 0.35;
    
    if (amount <= 0 || limit <= 0 || rate <= 0) {
        showToast('所有值必须大于0', 'error');
        return;
    }
    
    try {
        const { error } = await sb
            .from('trial_bonus_config')
            .upsert({
                id: 1,
                trial_amount: amount,
                orders_limit: limit,
                commission_rate: rate,
                updated_at: new Date().toISOString()
            });
        
        if (error) throw error;
        showToast('✅ Trial Bonus 配置已保存', 'success');
        loadVipConfig();
    } catch (e) {
        showToast('保存失败: ' + e.message, 'error');
    }
}

// ========== 加载 VIP 用户列表 ==========
async function loadVipUsers() {
    const tbody = document.getElementById('vipUserTableBody');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:30px; color:#6a7a9a;">Loading...</td></tr>';
    
    try {
        let query = sb.from('users').select('*').order('created_at', { ascending: false });
        
        if (vipSearchKeyword) {
            query = query.or('uid.ilike.%' + vipSearchKeyword + '%,username.ilike.%' + vipSearchKeyword + '%');
        }
        
        const { data: users, error } = await query;
        if (error) throw error;
        
        if (!users || users.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:30px; color:#6a7a9a;">No users found</td></tr>';
            return;
        }
        
        // 过滤 VIP 等级
        let filtered = users;
        if (selectedVipLevel !== '') {
            filtered = users.filter(function(u) { return (u.vip_level || 0) == parseInt(selectedVipLevel); });
        }
        
        if (filtered.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:30px; color:#6a7a9a;">No users with this ranking</td></tr>';
            return;
        }
        
        // 获取所有用户的存款总额
        const uids = filtered.map(function(u) { return u.uid; });
        const { data: deposits } = await sb.from('deposits').select('uid, amount').in('uid', uids);
        
        const depositMap = {};
        if (deposits) {
            deposits.forEach(function(d) {
                depositMap[d.uid] = (depositMap[d.uid] || 0) + (d.amount || 0);
            });
        }
        
        // 获取每个用户最后一次存款日期
        const { data: lastDeposits } = await sb
            .from('deposits')
            .select('uid, created_at')
            .in('uid', uids)
            .order('created_at', { ascending: false });
        
        const lastDepositMap = {};
        if (lastDeposits) {
            const seen = {};
            lastDeposits.forEach(function(d) {
                if (!seen[d.uid]) {
                    seen[d.uid] = true;
                    lastDepositMap[d.uid] = d.created_at;
                }
            });
        }
        
        const rankNames = {
            0: 'Trial Lv.0',
            1: 'Normal Lv.1',
            2: 'VIP Lv.2',
            3: 'SVIP Lv.3'
        };
        
        const rankBadges = {
            0: 'rank-badge-trial',
            1: 'rank-badge-normal',
            2: 'rank-badge-vip',
            3: 'rank-badge-svip'
        };
        
        tbody.innerHTML = '';
        
        for (const user of filtered) {
            const row = tbody.insertRow();
            const vipLevel = user.vip_level || 0;
            const totalDeposit = depositMap[user.uid] || 0;
            const lastDate = lastDepositMap[user.uid] || user.created_at;
            const formattedDate = lastDate ? new Date(lastDate).toLocaleDateString() : '-';
            
            row.insertCell(0).innerHTML = '<span class="badge" style="background: rgba(255,255,255,0.08); padding: 2px 12px; border-radius: 20px; font-size: 11px; color: #c8d2e8; border: 1px solid rgba(255,255,255,0.06);">' + escapeHtml(user.uid) + '</span>';
            row.insertCell(1).innerHTML = '<span style="font-weight:500; color:#d8e0f0;">' + escapeHtml(user.username) + '</span>';
            row.insertCell(2).innerHTML = '<span style="font-weight:600; color:#c8b090;">€' + totalDeposit.toFixed(2) + '</span>';
            row.insertCell(3).innerHTML = '<span class="' + rankBadges[vipLevel] + '" style="padding: 2px 12px; border-radius: 20px; font-size: 11px; display: inline-block;">' + (rankNames[vipLevel] || 'Normal Lv.1') + '</span>';
            row.insertCell(4).innerHTML = '<span style="font-size:12px; color:#8892a8;">' + formattedDate + '</span>';
        }
        
    } catch (e) {
        console.error('加载VIP用户失败:', e);
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:30px; color:#ff8888;">加载失败: ' + escapeHtml(e.message) + '</td></tr>';
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

window.loadVipPage = loadVipPage;