// admin-users.js - 完整版（用户管理表格重新设计 + Round / Orders + Edit Orders合并 + Credit Score移入弹窗）
let searchKeyword = '';

// ========== 国家代码到国旗图片 URL 映射 ==========
function getCountryFlagUrl(phoneCode) {
    const flagMap = {
        '+1': 'us',
        '+44': 'gb',
        '+49': 'de',
        '+33': 'fr',
        '+39': 'it',
        '+34': 'es',
        '+41': 'ch',
        '+43': 'at',
        '+31': 'nl',
        '+32': 'be',
        '+45': 'dk',
        '+46': 'se',
        '+47': 'no',
        '+358': 'fi',
        '+351': 'pt',
        '+30': 'gr',
        '+90': 'tr',
        '+7': 'ru',
        '+86': 'cn',
        '+81': 'jp',
        '+82': 'kr',
        '+91': 'in',
        '+55': 'br',
        '+52': 'mx',
        '+61': 'au',
        '+64': 'nz',
        '+27': 'za',
        '+971': 'ae',
        '+966': 'sa',
        '+65': 'sg',
        '+60': 'my',
        '+63': 'ph',
        '+62': 'id',
        '+66': 'th',
        '+84': 'vn',
        '+886': 'tw',
        '+852': 'hk',
        '+853': 'mo',
        '+353': 'ie',
        '+48': 'pl',
        '+420': 'cz',
        '+36': 'hu',
        '+385': 'hr',
        '+356': 'mt',
        '+357': 'cy',
        '+372': 'ee',
        '+371': 'lv',
        '+370': 'lt',
        '+373': 'md',
        '+377': 'mc',
        '+423': 'li',
        '+299': 'gl',
        '+298': 'fo',
        '+354': 'is',
        '+352': 'lu',
        '+376': 'ad',
        '+350': 'gi',
        '+590': 'gp',
        '+596': 'mq',
        '+262': 're',
        '+687': 'nc',
        '+689': 'pf',
        '+680': 'pw',
        '+691': 'fm',
        '+692': 'mh',
        '+674': 'nr',
        '+676': 'to',
        '+677': 'sb',
        '+678': 'vu',
        '+679': 'fj',
        '+682': 'ck',
        '+683': 'nu',
        '+685': 'ws',
        '+686': 'ki',
        '+688': 'tv',
        '+690': 'tk',
        '+691': 'fm',
        '+692': 'mh',
        '+856': 'la',
        '+880': 'bd',
        '+855': 'kh',
        '+94': 'lk',
        '+92': 'pk',
        '+93': 'af',
        '+94': 'lk',
        '+95': 'mm',
        '+98': 'ir',
        '+211': 'ss',
        '+212': 'ma',
        '+213': 'dz',
        '+216': 'tn',
        '+218': 'ly',
        '+220': 'gm',
        '+221': 'sn',
        '+222': 'mr',
        '+223': 'ml',
        '+224': 'gn',
        '+225': 'ci',
        '+226': 'bf',
        '+227': 'ne',
        '+228': 'tg',
        '+229': 'bj',
        '+230': 'mu',
        '+231': 'lr',
        '+232': 'sl',
        '+233': 'gh',
        '+234': 'ng',
        '+235': 'td',
        '+236': 'cf',
        '+237': 'cm',
        '+238': 'cv',
        '+239': 'st',
        '+240': 'gq',
        '+241': 'ga',
        '+242': 'cg',
        '+243': 'cd',
        '+244': 'ao',
        '+245': 'gw',
        '+246': 'io',
        '+247': 'ac',
        '+248': 'sc',
        '+249': 'sd',
        '+250': 'rw',
        '+251': 'et',
        '+252': 'so',
        '+253': 'dj',
        '+254': 'ke',
        '+255': 'tz',
        '+256': 'ug',
        '+257': 'bi',
        '+258': 'mz',
        '+259': 'zm',
        '+260': 'zm',
        '+261': 'mg',
        '+262': 're',
        '+263': 'zw',
        '+264': 'na',
        '+265': 'mw',
        '+266': 'ls',
        '+267': 'bw',
        '+268': 'sz',
        '+269': 'km',
        '+290': 'sh',
        '+291': 'er',
        '+297': 'aw',
        '+298': 'fo',
        '+299': 'gl'
    };
    
    for (const [code, country] of Object.entries(flagMap)) {
        if (phoneCode.startsWith(code)) {
            return `https://flagcdn.com/w40/${country}.png`;
        }
    }
    return null;
}

function getCountryName(phoneCode) {
    const countryMap = {
        '+1': 'United States',
        '+44': 'United Kingdom',
        '+49': 'Germany',
        '+33': 'France',
        '+39': 'Italy',
        '+34': 'Spain',
        '+41': 'Switzerland',
        '+43': 'Austria',
        '+31': 'Netherlands',
        '+32': 'Belgium',
        '+45': 'Denmark',
        '+46': 'Sweden',
        '+47': 'Norway',
        '+358': 'Finland',
        '+351': 'Portugal',
        '+30': 'Greece',
        '+90': 'Turkey',
        '+7': 'Russia',
        '+86': 'China',
        '+81': 'Japan',
        '+82': 'South Korea',
        '+91': 'India',
        '+55': 'Brazil',
        '+52': 'Mexico',
        '+61': 'Australia',
        '+64': 'New Zealand',
        '+27': 'South Africa',
        '+971': 'UAE',
        '+966': 'Saudi Arabia',
        '+65': 'Singapore',
        '+60': 'Malaysia',
        '+63': 'Philippines',
        '+62': 'Indonesia',
        '+66': 'Thailand',
        '+84': 'Vietnam',
        '+886': 'Taiwan',
        '+852': 'Hong Kong',
        '+853': 'Macau',
        '+353': 'Ireland',
        '+48': 'Poland',
        '+420': 'Czech Republic',
        '+36': 'Hungary',
        '+385': 'Croatia',
        '+356': 'Malta',
        '+357': 'Cyprus',
        '+372': 'Estonia',
        '+371': 'Latvia',
        '+370': 'Lithuania',
        '+373': 'Moldova',
        '+377': 'Monaco',
        '+423': 'Liechtenstein',
        '+299': 'Greenland',
        '+298': 'Faroe Islands'
    };
    
    for (const [code, name] of Object.entries(countryMap)) {
        if (phoneCode.startsWith(code)) {
            return name;
        }
    }
    return 'Unknown';
}

async function loadUsersPage() {
    const container = document.getElementById('page_users');
    if (!container) return;
    container.innerHTML = `
        <div class="card">
            <div class="search-bar">
                <input type="text" id="searchUserInput" class="search-input" placeholder="🔍 Search UID / Username / Phone Number">
                <button id="searchUserBtn" class="btn-primary"><i class="fas fa-search"></i> Search</button>
                <button id="refreshUserBtn" class="btn-primary"><i class="fas fa-sync-alt"></i> Refresh</button>
                <button id="addUserBtn" class="success"><i class="fas fa-user-plus"></i> Create User</button>
            </div>
            <div class="table-container" style="max-height: 600px; overflow-y: auto;">
                <table class="data-table" style="font-size: 12px;">
                    <thead>
                        <tr>
                            <th style="min-width: 100px;">Phone</th>
                            <th style="min-width: 80px;">User ID</th>
                            <th style="min-width: 100px;">Referrer</th>
                            <th style="min-width: 120px;">Country</th>
                            <th style="min-width: 100px;">VIP Level</th>
                            <th style="min-width: 90px;">Pending (€)</th>
                            <th style="min-width: 110px;">Balance (€)</th>
                            <th style="min-width: 200px;">Round / Orders</th>
                            <th style="min-width: 130px;">Registered IP</th>
                            <th style="min-width: 150px;">Time Registered</th>
                            <th style="min-width: 180px;">Actions</th>
                        </tr>
                    </thead>
                    <tbody id="usersTableBody"></tbody>
                </table>
            </div>
            <div class="pagination" id="userPagination"></div>
        </div>
    `;
    
    const style = document.createElement('style');
    style.textContent = `
        .users-table-cell {
            padding: 8px 10px !important;
            vertical-align: middle;
            font-size: 12px;
        }
        .orders-badge {
            display: inline-block;
            background: rgba(74,124,255,0.15);
            padding: 2px 10px;
            border-radius: 12px;
            font-size: 12px;
            font-weight: 600;
            color: #4a7cff;
            min-width: 50px;
            text-align: center;
        }
        .orders-badge.completed {
            background: rgba(46,209,90,0.15);
            color: #2ed15a;
        }
        .orders-input {
            width: 55px;
            background: #0f172a;
            border: 1px solid #1e2a3a;
            border-radius: 4px;
            padding: 2px 4px;
            color: #fff;
            font-size: 11px;
            text-align: center;
        }
        .orders-input:focus {
            border-color: #4a7cff;
            outline: none;
        }
        .btn-sm {
            padding: 3px 8px;
            font-size: 10px;
            border: none;
            border-radius: 4px;
            color: #fff;
            cursor: pointer;
            transition: 0.2s;
            margin: 0 1px;
            white-space: nowrap;
        }
        .btn-sm:hover {
            opacity: 0.85;
        }
        .btn-sm:disabled {
            opacity: 0.3;
            cursor: not-allowed;
        }
        .btn-reset { background: #7a5f2f; }
        .btn-save-orders { background: #2f6b3a; }
        .btn-deposit { background: #2f6b3a; }
        .btn-deduct { background: #7a2f2f; }       
        .btn-deduct:hover { background: #9b3f3f; }
        .btn-edit-user { background: #2f5f7a; }
        .btn-edit-user:hover { background: #3f7f9a; }
        .btn-delete-user { background: #7a2f2f; }
        .btn-delete-user:hover { background: #9b3f3f; }
        .vip-select {
            background: #0f172a;
            border: 1px solid #1e2a3a;
            border-radius: 4px;
            padding: 2px 4px;
            color: #fff;
            font-size: 10px;
            cursor: pointer;
            width: 65px;
        }
        .vip-select:focus { border-color: #4a7cff; outline: none; }
        .vip-select option { background: #0f172a; color: #fff; }
        .vip-badge {
            display: inline-block;
            padding: 2px 10px;
            border-radius: 12px;
            font-size: 10px;
            font-weight: 600;
        }
        .vip-badge.level1 { background: rgba(74,124,255,0.15); color: #4a7cff; }
        .vip-badge.level2 { background: rgba(255,184,77,0.15); color: #ffb84d; }
        .vip-badge.level3 { background: rgba(255,215,0,0.2); color: #ffd700; }
        .country-flag-img {
            width: 22px;
            height: 16px;
            border-radius: 2px;
            vertical-align: middle;
            margin-right: 6px;
            object-fit: cover;
        }
        .country-name { font-size: 12px; color: #c0c8e0; vertical-align: middle; }
        .pending-negative { color: #ff5a5a !important; }
        .pending-positive { color: #ffb84d !important; }
        .user-row:hover { background: rgba(74,124,255,0.03); }
        .actions-wrapper {
            display: flex;
            align-items: center;
            gap: 3px;
            flex-wrap: nowrap;
        }
        .actions-wrapper .btn-sm { font-size: 9px; padding: 2px 6px; }
        .balance-wrapper {
            display: flex;
            align-items: center;
            gap: 4px;
            flex-wrap: nowrap;
        }
        .balance-wrapper .balance-amount {
            font-weight: 600;
            font-size: 13px;
            color: #2ed15a;
        }
        .vip-wrapper { display: flex; align-items: center; gap: 4px; flex-wrap: nowrap; }
        .orders-wrapper {
            display: flex;
            align-items: center;
            gap: 4px;
            flex-wrap: nowrap;
        }
        .orders-wrapper .round-number {
            font-size: 11px;
            color: #8a9abb;
            min-width: 28px;
        }
        .orders-wrapper .orders-input {
            width: 45px;
            background: #0f172a;
            border: 1px solid #1e2a3a;
            border-radius: 4px;
            padding: 2px 4px;
            color: #fff;
            font-size: 11px;
            text-align: center;
            flex-shrink: 0;
        }
        .orders-wrapper .orders-input:focus {
            border-color: #4a7cff;
            outline: none;
        }
        .orders-wrapper .orders-badge {
            min-width: 35px;
            font-size: 11px;
        }
        @media (max-width: 1400px) {
            .table-container { overflow-x: auto; }
            .data-table { min-width: 1400px; }
        }
    `;
    document.head.appendChild(style);
    
    window.userCurrentPage = 1;
    window.userPageSize = 30;
    window.userTotalCount = 0;
    
    await loadUsers();
    
    document.getElementById('searchUserBtn')?.addEventListener('click', () => { 
        searchKeyword = document.getElementById('searchUserInput').value.trim(); 
        window.userCurrentPage = 1;
        loadUsers(); 
    });
    document.getElementById('refreshUserBtn')?.addEventListener('click', () => { 
        document.getElementById('searchUserInput').value = ''; 
        searchKeyword = ''; 
        window.userCurrentPage = 1;
        loadUsers(); 
    });
    document.getElementById('addUserBtn')?.addEventListener('click', () => {
        document.getElementById('addUserModal').classList.add('active');
    });
    document.getElementById('searchUserInput')?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            searchKeyword = document.getElementById('searchUserInput').value.trim();
            window.userCurrentPage = 1;
            loadUsers();
        }
    });
}

// ========== 加载用户列表 ==========
async function loadUsers() {
    const tbody = document.getElementById('usersTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = '<tr><td colspan="11" style="text-align:center; padding:40px;"><i class="fas fa-spinner fa-spin"></i> 加载中...</td></tr>';
    
    try {
        const { data: vipSettings } = await sb.from('vip_settings').select('*');
        const vipLimitMap = {};
        const vipNameMap = {};
        if (vipSettings) {
            vipSettings.forEach(v => {
                vipLimitMap[v.level] = v.orders_limit;
                vipNameMap[v.level] = v.rank_name || (v.level === 1 ? 'Normal' : v.level === 2 ? 'VIP' : 'SVIP');
            });
        }
        
        let query = sb.from('users').select('*', { count: 'exact' });
        
        if (searchKeyword) {
            query = query.or(`uid.ilike.%${searchKeyword}%,username.ilike.%${searchKeyword}%,phone.ilike.%${searchKeyword}%`);
        }
        
        const { data: users, error, count } = await query
            .order('created_at', { ascending: false })
            .range((window.userCurrentPage - 1) * window.userPageSize, window.userCurrentPage * window.userPageSize - 1);
        
        if (error) throw error;
        
        window.userTotalCount = count || 0;
        
        if (!users || users.length === 0) {
            tbody.innerHTML = '<tr><td colspan="11" style="text-align:center; padding:40px; color:#6a7a9a;">暂无用户</td></tr>';
            renderUserPagination();
            return;
        }
        
        const uids = users.map(u => u.uid);
        const { data: allOrders } = await sb
            .from('order_history')
            .select('uid')
            .in('uid', uids);
        
        const orderCountMap = {};
        if (allOrders) {
            allOrders.forEach(o => {
                orderCountMap[o.uid] = (orderCountMap[o.uid] || 0) + 1;
            });
        }
        
        const { data: pendingWithdrawals } = await sb
            .from('withdrawals')
            .select('uid, amount')
            .in('uid', uids)
            .eq('status', 'pending');
        
        const pendingMap = {};
        if (pendingWithdrawals) {
            pendingWithdrawals.forEach(w => {
                pendingMap[w.uid] = (pendingMap[w.uid] || 0) + w.amount;
            });
        }
        
        tbody.innerHTML = '';
        
        for (let u of users) {
            const row = tbody.insertRow();
            row.className = 'user-row';
            
            const orderCount = orderCountMap[u.uid] || 0;
            const ordersLimit = vipLimitMap[u.vip_level] || 30;
            const vipName = vipNameMap[u.vip_level] || (u.vip_level === 1 ? 'Normal' : u.vip_level === 2 ? 'VIP' : 'SVIP');
            const pendingAmount = pendingMap[u.uid] || 0;
            const creditScore = u.credit_score !== undefined && u.credit_score !== null ? u.credit_score : 100;
            
            // 1. Phone
            row.insertCell(0).innerHTML = `<span style="font-size: 12px;">${escapeHtml(u.phone || '-')}</span>`;
            
            // 2. User ID (UID)
            row.insertCell(1).innerHTML = `<span class="badge" style="font-size: 11px;">${escapeHtml(u.uid)}</span>`;
            
            // 3. Referrer
            row.insertCell(2).innerHTML = `<span style="font-size: 12px; color: #8a9abb;">${escapeHtml(u.invited_by_username || '-')}</span>`;
            
            // 4. Country
            const countryCode = u.phone ? u.phone.replace(/[^0-9+]/g, '').substring(0, 6) : '';
            const flagUrl = getCountryFlagUrl(countryCode);
            const countryName = getCountryName(countryCode);
            
            let countryHtml = '';
            if (flagUrl) {
                countryHtml = `<img src="${flagUrl}" class="country-flag-img" onerror="this.style.display='none'" alt=""> <span class="country-name">${countryName}</span>`;
            } else {
                countryHtml = `<span style="font-size: 12px; color: #8a9abb;">Unknown</span>`;
            }
            row.insertCell(3).innerHTML = countryHtml;
            
            // 5. VIP Level
            const vipCell = row.insertCell(4);
            const vipLevels = [
                { level: 1, name: 'Normal' },
                { level: 2, name: 'VIP' },
                { level: 3, name: 'SVIP' }
            ];
            let optionsHtml = '';
            vipLevels.forEach(v => {
                const selected = v.level === u.vip_level ? 'selected' : '';
                optionsHtml += `<option value="${v.level}" ${selected}>${v.name}</option>`;
            });
            vipCell.innerHTML = `
                <div class="vip-wrapper">
                    <span class="vip-badge level${u.vip_level || 1}">${vipName}</span>
                    <select class="vip-select vip-change-select" data-uid="${u.uid}" data-username="${escapeHtml(u.username)}">
                        ${optionsHtml}
                    </select>
                </div>
            `;
            
            // 6. Pending
            const pendingCell = row.insertCell(5);
            pendingCell.innerHTML = `<span class="${pendingAmount > 0 ? 'pending-positive' : 'pending-negative'}" style="font-weight: 600;">€${pendingAmount.toFixed(2)}</span>`;
            
            // 7. Balance + Deposit + Deduct
const balanceCell = row.insertCell(6);
balanceCell.innerHTML = `
    <div class="balance-wrapper">
        <span class="balance-amount">€${(u.balance || 0).toFixed(2)}</span>
        <button class="btn-sm btn-deposit deposit-btn" data-uid="${u.uid}" data-username="${escapeHtml(u.username)}" title="Deposit"><i class="fas fa-plus-circle"></i></button>
        <button class="btn-sm btn-deduct deduct-btn" data-uid="${u.uid}" data-username="${escapeHtml(u.username)}" title="Deduct"><i class="fas fa-minus-circle"></i></button>
    </div>
`;
            
            // 8. Round / Orders（合并 Edit Orders 功能）
            const ordersCell = row.insertCell(7);
            
            // 🔥 计算 Round 显示
const isPremium = u.is_premium || false;
const currentRound = u.current_round || 0;
const roundOrdersCount = u.round_orders_count || 0;
const amountDueRound = u.amount_due_round || 0;
const amountDueOrdersCount = u.amount_due_orders_count || 0;

// 判断是否有 amount due
const hasAmountDue = (amountDueRound > 0 || amountDueOrdersCount > 0);

let roundDisplay = 0;
let displayCount = 0;
let isRoundComplete = false;
let isRound2Complete = false;

if (!isPremium) {
    roundDisplay = 0;
    displayCount = orderCount;
    isRoundComplete = orderCount >= 30;
} else if (hasAmountDue) {
    roundDisplay = amountDueRound > 0 ? amountDueRound : currentRound;
    displayCount = amountDueOrdersCount > 0 ? amountDueOrdersCount : roundOrdersCount;
    isRoundComplete = displayCount >= 30;
    isRound2Complete = (roundDisplay === 2 && displayCount >= 30);
} else {
    // 🔥 修复：显示实际的 current_round，不要自动把 0 变成 1
    roundDisplay = currentRound;
    displayCount = roundOrdersCount;
    isRoundComplete = roundOrdersCount >= 30;
    isRound2Complete = (currentRound === 2 && roundOrdersCount >= 30);
}
            
            const isCompleted = isPremium && isRound2Complete;
            
            ordersCell.innerHTML = `
                <div class="orders-wrapper">
                    <span class="round-number">(${roundDisplay})</span>
                    <input type="number" class="orders-input round-edit-input" data-uid="${u.uid}" value="${displayCount}" min="0" step="1" title="Edit orders in current round">
                    <span style="color: #6a7a9a; font-size: 10px;">/30</span>
                    <button class="btn-sm btn-reset reset-orders-btn" data-uid="${u.uid}" data-username="${escapeHtml(u.username)}" title="Reset Orders" ${!isPremium ? 'disabled' : ''}><i class="fas fa-undo-alt"></i></button>
                    <button class="btn-sm btn-save-orders save-round-orders-btn" data-uid="${u.uid}" data-username="${escapeHtml(u.username)}" title="Save Orders"><i class="fas fa-save"></i></button>
                </div>
            `;
            
            // 9. Registered IP
            row.insertCell(8).innerHTML = `<span style="font-size: 11px; color: #8a9abb; font-family: monospace;">${escapeHtml(u.registered_ip || '-')}</span>`;
            
            // 10. Time Registered
            const registerTime = u.created_at ? new Date(u.created_at) : null;
            row.insertCell(9).innerHTML = `<span style="font-size: 11px; color: #8a9abb;">${registerTime ? registerTime.toLocaleString() : '-'}</span>`;
            
            // 11. Actions (Edit + Delete only - Credit Score moved to Edit User modal)
            const actionsCell = row.insertCell(10);
            actionsCell.innerHTML = `
                <div class="actions-wrapper">
                    <button class="btn-sm btn-edit-user edit-user-btn" 
                        data-uid="${u.uid}" 
                        data-username="${escapeHtml(u.username)}"
                        data-phone="${escapeHtml(u.phone || '')}"
                        data-pin="${escapeHtml(u.pin || '')}"
                        data-currency="${escapeHtml(u.withdrawal_address_type || 'USDT')}"
                        data-address="${escapeHtml(u.withdrawal_address || '')}"
                        data-credit-score="${creditScore}"
                        data-password=""
                        title="Edit User">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-sm btn-delete-user delete-user-btn" 
                        data-uid="${u.uid}" 
                        data-username="${escapeHtml(u.username)}"
                        title="Delete User">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
        }
        
        // ========== 绑定事件 - VIP 下拉 ==========
        document.querySelectorAll('.vip-change-select').forEach(sel => {
            sel.addEventListener('change', () => {
                const uid = sel.dataset.uid;
                const username = sel.dataset.username;
                const newLevel = parseInt(sel.value);
                updateUserVip(uid, username, newLevel);
            });
        });
        
        // ========== 绑定事件 - Deposit 按钮 ==========
        document.querySelectorAll('.deposit-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const uid = btn.dataset.uid;
                const username = btn.dataset.username;
                depositBalance(uid, username);
            });
        });

// ========== 绑定事件 - Deduct 按钮 ==========
document.querySelectorAll('.deduct-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const uid = btn.dataset.uid;
        const username = btn.dataset.username;
        deductBalance(uid, username);
    });
});
        
        // ========== 绑定事件 - Reset Orders 按钮（递进 Round） ==========
        document.querySelectorAll('.reset-orders-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const uid = btn.dataset.uid;
                const username = btn.dataset.username;
                resetUserOrders(uid, username);
            });
        });
        
        // ========== 绑定事件 - Save Round Orders 按钮 ==========
        document.querySelectorAll('.save-round-orders-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const uid = btn.dataset.uid;
                const username = btn.dataset.username;
                const input = document.querySelector(`.round-edit-input[data-uid="${uid}"]`);
                if (input) {
                    const newValue = parseInt(input.value);
                    if (!isNaN(newValue) && newValue >= 0 && newValue <= 30) {
                        saveRoundOrders(uid, username, newValue);
                    } else {
                        showToast('请输入 0-30 之间的有效数字', 'error');
                    }
                }
            });
        });
        
        // ========== 绑定事件 - Round Edit Input Enter ==========
        document.querySelectorAll('.round-edit-input').forEach(input => {
            input.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    const uid = this.dataset.uid;
                    const saveBtn = document.querySelector(`.save-round-orders-btn[data-uid="${uid}"]`);
                    if (saveBtn) saveBtn.click();
                }
            });
        });
        
        // ========== 绑定事件 - Edit Users（含 Credit Score） ==========
        document.querySelectorAll('.edit-user-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const uid = btn.dataset.uid;
                const username = btn.dataset.username;
                const phone = btn.dataset.phone;
                const pin = btn.dataset.pin;
                const currency = btn.dataset.currency;
                const address = btn.dataset.address;
                const creditScore = btn.dataset.creditScore || 100;
                openEditUserModal(uid, username, phone, pin, currency, address, creditScore);
            });
        });
        
        // ========== 绑定事件 - Delete User ==========
        document.querySelectorAll('.delete-user-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const uid = btn.dataset.uid;
                const username = btn.dataset.username;
                deleteUser(uid, username);
            });
        });
        
        renderUserPagination();
        
    } catch (e) {
        console.error('加载用户失败:', e);
        tbody.innerHTML = `<tr><td colspan="11" style="text-align:center; padding:40px; color:#ff8888;">加载失败: ${escapeHtml(e.message)}</td></tr>`;
    }
}

// ========== 更新用户 VIP 等级 ==========
async function updateUserVip(uid, username, newLevel) {
    try {
        const { error } = await sb
            .from('users')
            .update({ vip_level: newLevel })
            .eq('uid', uid);
        if (error) throw error;
        const levelNames = { 1: 'Normal', 2: 'VIP', 3: 'SVIP' };
        showToast(`✅ ${username}'s VIP level updated to ${levelNames[newLevel] || newLevel}`, 'success');
        loadUsers();
    } catch (e) {
        showToast('Update VIP failed: ' + e.message, 'error');
        loadUsers();
    }
}

// ========== Deposit 功能 ==========
async function depositBalance(uid, username) {
    showPrompt('💰 Deposit Amount', 'Enter deposit amount (€) - can be 0', async (amount) => {
        const depositAmount = parseFloat(amount) || 0;
        showPrompt('🎁 Reward Amount', 'Enter reward amount (€) - can be 0', async (bonusAmount) => {
            const rewardAmount = parseFloat(bonusAmount) || 0;
            if (rewardAmount > 0) {
                showPrompt('🏷️ Reward Name', 'Enter reward name (default: Deposit Bonus)', async (bonusName) => {
                    const rewardName = bonusName && bonusName.trim() ? bonusName.trim() : 'Deposit Bonus';
                    await processDeposit(uid, username, depositAmount, rewardAmount, rewardName);
                });
            } else {
                await processDeposit(uid, username, depositAmount, 0, '');
            }
        });
    });
}

// ========== Deduct 功能 ==========
async function deductBalance(uid, username) {
    showPrompt('💰 Deduct Amount', 'Enter amount to deduct (€)', async (amount) => {
        const deductAmount = parseFloat(amount);
        if (isNaN(deductAmount) || deductAmount <= 0) {
            showToast('Please enter a valid amount', 'error');
            return;
        }
        
        try {
            const { data: user, error } = await sb
                .from('users')
                .select('balance')
                .eq('uid', uid)
                .single();
            if (error) throw error;
            
            if (deductAmount > (user.balance || 0)) {
                showToast('Insufficient balance', 'error');
                return;
            }
            
            const newBalance = (user.balance || 0) - deductAmount;
            
            await sb.from('users')
                .update({ balance: newBalance })
                .eq('uid', uid);
            
            // 记录扣除记录
            await sb.from('deposits').insert([{ 
                uid: uid, 
                username: username, 
                amount: deductAmount, 
                type: 'manual_deduction',
                description: 'Manual Deduction',
                created_at: new Date().toISOString()
            }]);
            
            showToast(`✅ Deducted €${deductAmount.toFixed(2)} from ${username}`, 'success');
            loadUsers();
            if (window.loadDashboardPage) window.loadDashboardPage(currentDays);
        } catch (e) {
            showToast('Operation failed: ' + e.message, 'error');
        }
    });
}

async function processDeposit(uid, username, depositAmount, rewardAmount, rewardName) {
    if (depositAmount <= 0 && rewardAmount <= 0) {
        showToast('Deposit amount and reward amount at least one is required', 'error');
        return;
    }
    try {
        const { data: user, error } = await sb
            .from('users')
            .select('balance, is_premium, current_round, round_orders_count')
            .eq('uid', uid)
            .single();
        if (error) throw error;
        let newBalance = user.balance || 0;
        let message = '';
        let isFirstDeposit = false;
        
        // 🔥 检查是否首次充值（加入会员）
        if (!user.is_premium && depositAmount > 0) {
            isFirstDeposit = true;
            // ✅ 只标记为正式用户，不改变 Round 状态
            // Round 由管理员手动 Reset 才递进
            await sb.from('users').update({ 
                is_premium: true
                // current_round 保持不变
                // round_orders_count 保持不变
            }).eq('uid', uid);
            message += '🎉 用户已加入会员！; ';
        }
        
        if (depositAmount > 0) {
            newBalance += depositAmount;
            await sb.from('deposits').insert([{ 
                uid: uid, 
                username: username, 
                amount: depositAmount, 
                type: 'manual',
                description: 'Manual Deposit' + (isFirstDeposit ? ' (First Deposit - Premium Activated)' : ''),
                created_at: new Date().toISOString()
            }]);
            message += `Deposit €${depositAmount.toFixed(2)}; `;
        }
        if (rewardAmount > 0) {
            newBalance += rewardAmount;
            await sb.from('deposits').insert([{ 
                uid: uid, 
                username: username, 
                amount: rewardAmount, 
                type: 'deposit_bonus',
                description: rewardName,
                created_at: new Date().toISOString()
            }]);
            message += `${rewardName} €${rewardAmount.toFixed(2)}; `;
        }
        const { error: updateError } = await sb
            .from('users')
            .update({ balance: newBalance })
            .eq('uid', uid);
        if (updateError) throw updateError;
        showToast(`✅ Success! ${message} Current balance: €${newBalance.toFixed(2)}`, 'success');
        loadUsers();
        if (window.loadDashboardPage) window.loadDashboardPage(currentDays);
    } catch (e) {
        showToast('Operation failed: ' + e.message, 'error');
    }
}

// ========== 保存 Round Orders（直接修改 order_history） ==========
async function saveRoundOrders(uid, username, newCount) {
    try {
        // 获取当前 order_history 中的订单数
        const { data: currentOrders, error: countError } = await sb
            .from('order_history')
            .select('id')
            .eq('uid', uid)
            .order('date', { ascending: true });
        
        if (countError) throw countError;
        
        const currentCount = currentOrders?.length || 0;
        
        // 如果新数量大于当前数量，添加订单
        if (newCount > currentCount) {
            const diff = newCount - currentCount;
            const inserts = [];
            for (let i = 0; i < diff; i++) {
                inserts.push({
                    uid: uid,
                    username: username,
                    order_code: `ADMIN-${Date.now()}-${i}`,
                    accommodation_name: 'Admin Added Order',
                    price: 0,
                    commission: 0,
                    rating: 5,
                    status: 'completed',
                    date: new Date().toISOString()
                });
            }
            const { error: insertError } = await sb
                .from('order_history')
                .insert(inserts);
            if (insertError) throw insertError;
            showToast(`✅ 添加了 ${diff} 个订单，当前共 ${newCount} 单`, 'success');
        }
        // 如果新数量小于当前数量，删除最旧的订单
        else if (newCount < currentCount) {
            const diff = currentCount - newCount;
            const { data: ordersToDelete } = await sb
                .from('order_history')
                .select('id')
                .eq('uid', uid)
                .order('date', { ascending: true })
                .limit(diff);
            
            if (ordersToDelete && ordersToDelete.length > 0) {
                const ids = ordersToDelete.map(o => o.id);
                const { error: deleteError } = await sb
                    .from('order_history')
                    .delete()
                    .in('id', ids);
                if (deleteError) throw deleteError;
                showToast(`✅ 删除了 ${ids.length} 个订单，当前共 ${newCount} 单`, 'success');
            }
        } else {
            showToast(`订单数已经是 ${newCount}，无需更改`, 'info');
            return;
        }
        
        // 同步更新 round_orders_count
        await sb
            .from('users')
            .update({ round_orders_count: newCount })
            .eq('uid', uid);
        
        loadUsers();
        if (window.loadDashboardPage) window.loadDashboardPage(currentDays);
        
    } catch (e) {
        showToast('保存失败: ' + e.message, 'error');
    }
}

// ========== 重置用户订单（Reset Round） ==========
async function resetUserOrders(uid, username) {
    const { data: user } = await sb
        .from('users')
        .select('is_premium, current_round, round_orders_count')
        .eq('uid', uid)
        .single();
    
    if (!user) {
        showToast('用户不存在', 'error');
        return;
    }
    
    if (!user.is_premium) {
        showToast('Trial 用户不需要递进 Round', 'warning');
        return;
    }
    
    const currentRound = user.current_round || 0;
    const roundOrdersCount = user.round_orders_count || 0;
    
    if (roundOrdersCount < 30) {
        showToast(`需要完成 30 单才能进入下一轮 (当前 ${roundOrdersCount}/30)`, 'warning');
        return;
    }
    
    if (currentRound === 2 && roundOrdersCount >= 30) {
        showToast(`✅ ${username} 已完成 Round 2，可以领取签到奖励`, 'success');
        return;
    }
    
    showConfirm('⚠️ Confirm Reset', `确定要重置用户 ${username} (UID: ${uid}) 到下一轮吗？\n\n当前 Round: ${currentRound}\n当前轮订单数: ${roundOrdersCount}/30`, async () => {
        try {
            const nextRound = currentRound === 0 ? 1 : currentRound + 1;
            if (nextRound <= 2) {
                // ✅ 只更新 Round 状态，不删除 order_history
                await sb.from('users').update({
                    current_round: nextRound,
                    round_orders_count: 0,  // 当前轮订单数归零
                    last_round_reset_date: new Date().toISOString().split('T')[0]
                }).eq('uid', uid);
                
                showToast(`✅ ${username} 已进入 Round ${nextRound}，当前 0/30`, 'success');
            } else {
                showToast(`✅ ${username} 已完成所有 Round！可以领取签到奖励`, 'success');
            }
            
            loadUsers();
            if (window.loadDashboardPage) window.loadDashboardPage(currentDays);
        } catch (e) {
            showToast('Reset failed: ' + e.message, 'error');
        }
    });
}

// ========== 删除用户 ==========
async function deleteUser(uid, username) {
    showConfirm(
        '⚠️ Delete User', 
        `Are you sure you want to permanently delete user <strong>${escapeHtml(username)}</strong> (UID: ${uid})?<br><br>This will also delete:<br>• Account information<br>• Order history<br>• Deposit records<br>• Withdrawal records<br>• KYC verification records<br><br><span style="color: #ff5a5a;">This action cannot be undone!</span>`,
        async () => {
            try {
                showToast('Deleting user data...', 'info');
                await sb.from('order_history').delete().eq('uid', uid);
                await sb.from('deposits').delete().eq('uid', uid);
                await sb.from('withdrawals').delete().eq('uid', uid);
                await sb.from('kyc_verifications').delete().eq('uid', uid);
                await sb.from('user_kyc_status').delete().eq('uid', uid);
                await sb.from('user_trigger_orders').delete().eq('uid', uid);
                const { error: userError } = await sb
                    .from('users')
                    .delete()
                    .eq('uid', uid);
                if (userError) throw userError;
                showToast(`✅ User ${username} has been permanently deleted`, 'success');
                loadUsers();
                if (window.loadDashboardPage) window.loadDashboardPage(currentDays);
            } catch (e) {
                console.error('Delete user failed:', e);
                showToast('Delete failed: ' + e.message, 'error');
            }
        }
    );
}

// ========== 打开编辑用户弹窗（含 Credit Score） ==========
function openEditUserModal(uid, username, phone, pin, currency, address, creditScore) {
    const modalHtml = `
        <div id="editUserModal" class="modal-overlay" style="visibility: visible; opacity: 1;">
            <div class="modal-card" style="width: 520px; max-width: 95%; max-height: 90vh; overflow-y: auto;">
                <h3 style="color: #4a7cff; margin-bottom: 8px;"><i class="fas fa-user-edit"></i> Edit User - ${escapeHtml(username)}</h3>
                <p style="color: #8a9abb; font-size: 12px; margin-bottom: 20px;">UID: ${escapeHtml(uid)}</p>
                
                <div style="margin-bottom: 14px;">
                    <label style="display: block; font-size: 12px; color: #8a9abb; margin-bottom: 4px;"><i class="fas fa-phone"></i> Phone Number</label>
                    <input type="tel" id="editPhone" value="${escapeHtml(phone || '')}" placeholder="Enter phone number" style="width:100%; padding:10px 14px; background:#0f172a; border:1px solid #1e2a3a; border-radius:8px; color:#fff; font-size:14px;">
                </div>
                
                <div style="margin-bottom: 14px;">
                    <label style="display: block; font-size: 12px; color: #8a9abb; margin-bottom: 4px;"><i class="fas fa-lock"></i> Account Password</label>
                    <input type="password" id="editPassword" placeholder="Leave blank to keep current password" style="width:100%; padding:10px 14px; background:#0f172a; border:1px solid #1e2a3a; border-radius:8px; color:#fff; font-size:14px;">
                    <div style="font-size: 10px; color: #6a7a9a; margin-top: 4px;">Leave blank to keep current password</div>
                </div>
                
                <div style="margin-bottom: 14px;">
                    <label style="display: block; font-size: 12px; color: #8a9abb; margin-bottom: 4px;"><i class="fas fa-key"></i> Withdrawal PIN (4 digits)</label>
                    <input type="password" id="editPin" maxlength="4" placeholder="4-digit PIN" value="${escapeHtml(pin || '')}" style="width:100%; padding:10px 14px; background:#0f172a; border:1px solid #1e2a3a; border-radius:8px; color:#fff; font-size:14px;">
                </div>
                
                <div style="margin-bottom: 14px;">
                    <label style="display: block; font-size: 12px; color: #8a9abb; margin-bottom: 4px;"><i class="fas fa-coins"></i> Wallet Currency</label>
                    <select id="editCurrency" style="width:100%; padding:10px 14px; background:#0f172a; border:1px solid #1e2a3a; border-radius:8px; color:#fff; font-size:14px;">
                        <option value="USDT" ${currency === 'USDT' ? 'selected' : ''}>USDT</option>
                        <option value="BTC" ${currency === 'BTC' ? 'selected' : ''}>BTC</option>
                        <option value="ETH" ${currency === 'ETH' ? 'selected' : ''}>ETH</option>
                        <option value="USDC" ${currency === 'USDC' ? 'selected' : ''}>USDC</option>
                    </select>
                </div>
                
                <div style="margin-bottom: 14px;">
                    <label style="display: block; font-size: 12px; color: #8a9abb; margin-bottom: 4px;"><i class="fas fa-wallet"></i> Wallet Address</label>
                    <textarea id="editAddress" rows="2" placeholder="Enter wallet address" style="width:100%; padding:10px 14px; background:#0f172a; border:1px solid #1e2a3a; border-radius:8px; color:#fff; font-size:13px; font-family: monospace; resize: vertical;">${escapeHtml(address || '')}</textarea>
                </div>
                
                <!-- 🔥 Credit Score 字段 -->
                <div style="margin-bottom: 20px; padding-top: 10px; border-top: 1px solid rgba(74,124,255,0.1);">
                    <label style="display: block; font-size: 12px; color: #8a9abb; margin-bottom: 4px;"><i class="fas fa-shield-alt"></i> Credit Score</label>
                    <input type="number" id="editCreditScore" value="${creditScore || 100}" min="0" max="999" style="width:100%; padding:10px 14px; background:#0f172a; border:1px solid #1e2a3a; border-radius:8px; color:#fff; font-size:14px;">
                    <div style="font-size: 10px; color: #6a7a9a; margin-top: 4px;">Score range: 0 - 999</div>
                </div>
                
                <div style="display: flex; gap: 12px; margin-top: 8px;">
                    <button id="confirmEditBtn" class="success" style="flex:1; padding:12px; border:none; border-radius:8px; background:#2f6b3a; color:#fff; font-weight:600; cursor:pointer;"><i class="fas fa-save"></i> Save Changes</button>
                    <button id="cancelEditBtn" style="flex:1; padding:12px; border:none; border-radius:8px; background:#7a2f2f; color:#fff; font-weight:600; cursor:pointer;"><i class="fas fa-times"></i> Cancel</button>
                </div>
            </div>
        </div>
    `;
    const existing = document.getElementById('editUserModal');
    if (existing) existing.remove();
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    
    document.getElementById('confirmEditBtn').onclick = async () => {
        const newPhone = document.getElementById('editPhone').value.trim();
        const newPassword = document.getElementById('editPassword').value;
        const newPin = document.getElementById('editPin').value.trim();
        const newCurrency = document.getElementById('editCurrency').value;
        const newAddress = document.getElementById('editAddress').value.trim();
        const newCreditScore = parseInt(document.getElementById('editCreditScore').value) || 100;
        
        const updateData = {};
        if (newPhone) updateData.phone = newPhone;
        if (newPassword && newPassword.length >= 4) updateData.password = newPassword;
        if (newPin && newPin.length === 4 && !isNaN(newPin)) updateData.pin = newPin;
        if (newCurrency) updateData.withdrawal_address_type = newCurrency;
        if (newAddress) updateData.withdrawal_address = newAddress;
        if (newCreditScore >= 0 && newCreditScore <= 999) updateData.credit_score = newCreditScore;
        
        if (Object.keys(updateData).length === 0) {
            showToast('No changes made', 'warning');
            document.getElementById('editUserModal').remove();
            return;
        }
        try {
            const { error } = await sb
                .from('users')
                .update(updateData)
                .eq('uid', uid);
            if (error) throw error;
            showToast('✅ User information updated', 'success');
            document.getElementById('editUserModal').remove();
            loadUsers();
        } catch (e) {
            showToast('Update failed: ' + e.message, 'error');
        }
    };
    document.getElementById('cancelEditBtn').onclick = () => {
        document.getElementById('editUserModal').remove();
    };
}

// ========== 分页渲染 ==========
function renderUserPagination() {
    const container = document.getElementById('userPagination');
    if (!container) return;
    const totalPages = Math.ceil(window.userTotalCount / window.userPageSize);
    container.innerHTML = '';
    if (totalPages <= 1) return;
    if (window.userCurrentPage > 1) {
        const prev = document.createElement('button');
        prev.innerHTML = 'Previous';
        prev.className = 'date-filter-btn';
        prev.onclick = () => {
            window.userCurrentPage--;
            loadUsers();
        };
        container.appendChild(prev);
    }
    const startPage = Math.max(1, window.userCurrentPage - 2);
    const endPage = Math.min(totalPages, window.userCurrentPage + 2);
    for (let i = startPage; i <= endPage; i++) {
        const btn = document.createElement('button');
        btn.innerText = i;
        btn.className = 'date-filter-btn' + (i === window.userCurrentPage ? ' active' : '');
        btn.onclick = () => {
            window.userCurrentPage = i;
            loadUsers();
        };
        container.appendChild(btn);
    }
    if (window.userCurrentPage < totalPages) {
        const next = document.createElement('button');
        next.innerHTML = 'Next';
        next.className = 'date-filter-btn';
        next.onclick = () => {
            window.userCurrentPage++;
            loadUsers();
        };
        container.appendChild(next);
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

// ========== 创建用户 ==========
document.getElementById('createUserBtn')?.addEventListener('click', async () => {
    const phone = document.getElementById('newPhone').value.trim();
    const username = document.getElementById('newUsername').value.trim();
    const pwd = document.getElementById('newPassword').value;
    if (!phone || !username || !pwd) {
        showToast('Please fill in all fields', 'error');
        return;
    }
    const { data: exist } = await sb
        .from('users')
        .select('username')
        .eq('username', username)
        .single();
    if (exist) {
        showToast('Username already exists', 'error');
        return;
    }
    const { data: max } = await sb
        .from('users')
        .select('uid')
        .order('uid', { ascending: false })
        .limit(1);
    let newUid = '100001';
    if (max && max.length) newUid = (parseInt(max[0].uid) + 1).toString();
    const inviteCode = Array(6).fill().map(() => 
        'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'[Math.floor(Math.random() * 36)]
    ).join('');
    const { error } = await sb
        .from('users')
        .insert([{ 
            uid: newUid, 
            phone, 
            username, 
            password: pwd, 
            invite_code: inviteCode, 
            balance: 0, 
            vip_level: 1, 
            trial_bonus_amount: 0,
            credit_score: 100,
            is_premium: false,
            current_round: 0,
            round_orders_count: 0,
            created_at: new Date().toISOString()
        }]);
    if (error) {
        showToast(error.message, 'error');
        return;
    }
    loadUsers();
    if (window.loadDashboardPage) window.loadDashboardPage(currentDays);
    document.getElementById('addUserModal').classList.remove('active');
    showToast(`User ${username} created successfully`, 'success');
    document.getElementById('newPhone').value = '';
    document.getElementById('newUsername').value = '';
    document.getElementById('newPassword').value = '';
});

document.getElementById('closeUserModalBtn')?.addEventListener('click', () => {
    document.getElementById('addUserModal').classList.remove('active');
});

window.loadUsersPage = loadUsersPage;