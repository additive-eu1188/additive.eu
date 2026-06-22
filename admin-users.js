// admin-users.js - 完整版（用户管理表格重新设计 + Credit Score + Round / Orders）
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
                            <th style="min-width: 140px;">Round / Orders</th>
                            <th style="min-width: 180px;">Edit Orders</th>
                            <th style="min-width: 130px;">Registered IP</th>
                            <th style="min-width: 150px;">Time Registered</th>
                            <th style="min-width: 220px;">Actions</th>
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
        .credit-score-input {
            width: 50px;
            background: #0f172a;
            border: 1px solid #1e2a3a;
            border-radius: 4px;
            padding: 2px 4px;
            color: #fff;
            font-size: 11px;
            text-align: center;
            flex-shrink: 0;
        }
        .credit-score-input:focus {
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
        .btn-save { background: #2f6b3a; }
        .btn-save-score { background: #2f6b3a; padding: 2px 6px; font-size: 9px; }
        .btn-deposit { background: #2f6b3a; }
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
        .score-label { font-size: 9px; color: #6a7a9a; white-space: nowrap; }
        .edit-orders-wrapper {
            display: flex;
            align-items: center;
            gap: 4px;
            flex-wrap: nowrap;
        }
        .edit-orders-wrapper .orders-input { width: 50px; flex-shrink: 0; }
        .edit-orders-wrapper .btn-sm { flex-shrink: 0; }
        .edit-orders-wrapper .current-orders-display {
            font-size: 12px;
            color: #8a9abb;
            margin-right: 2px;
            white-space: nowrap;
        }
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
            gap: 6px;
            flex-wrap: nowrap;
        }
        .orders-wrapper .round-number {
            font-size: 11px;
            color: #8a9abb;
            min-width: 28px;
        }
        @media (max-width: 1400px) {
            .table-container { overflow-x: auto; }
            .data-table { min-width: 1600px; }
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
    
    tbody.innerHTML = '<tr><td colspan="12" style="text-align:center; padding:40px;"><i class="fas fa-spinner fa-spin"></i> 加载中...</td></tr>';
    
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
            tbody.innerHTML = '<tr><td colspan="12" style="text-align:center; padding:40px; color:#6a7a9a;">暂无用户</td></tr>';
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
            
            // 7. Balance + Deposit
            const balanceCell = row.insertCell(6);
            balanceCell.innerHTML = `
                <div class="balance-wrapper">
                    <span class="balance-amount">€${(u.balance || 0).toFixed(2)}</span>
                    <button class="btn-sm btn-deposit deposit-btn" data-uid="${u.uid}" data-username="${escapeHtml(u.username)}" title="Deposit"><i class="fas fa-plus-circle"></i></button>
                </div>
            `;
            
            // 8. Round / Orders
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
            let ordersDisplay = '0/30';
            let isRoundComplete = false;
            let isRound2Complete = false;
            
            if (!isPremium) {
                // Trial 用户：显示 Round 0
                roundDisplay = 0;
                ordersDisplay = `${orderCount}/30`;
                isRoundComplete = orderCount >= 30;
            } else if (hasAmountDue) {
                // 有 amount due：显示 amount due 的 round 和订单数
                roundDisplay = amountDueRound > 0 ? amountDueRound : currentRound;
                const displayCount = amountDueOrdersCount > 0 ? amountDueOrdersCount : roundOrdersCount;
                ordersDisplay = `${displayCount}/30`;
                isRoundComplete = displayCount >= 30;
                isRound2Complete = (roundDisplay === 2 && displayCount >= 30);
            } else {
                // 正常正式用户
                roundDisplay = currentRound > 0 ? currentRound : 1;
                ordersDisplay = `${roundOrdersCount}/30`;
                isRoundComplete = roundOrdersCount >= 30;
                isRound2Complete = (currentRound === 2 && roundOrdersCount >= 30);
            }
            
            // 如果是正式用户且已完成 Round 2，显示绿色完成状态
            const isCompleted = isPremium && isRound2Complete;
            
            ordersCell.innerHTML = `
                <div class="orders-wrapper">
                    <span class="round-number">(${roundDisplay})</span>
                    <span class="orders-badge ${isCompleted ? 'completed' : ''}" style="${isCompleted ? 'background:rgba(46,209,90,0.15);color:#2ed15a;' : ''}">${ordersDisplay}</span>
                    <button class="btn-sm btn-reset reset-orders-btn" data-uid="${u.uid}" data-username="${escapeHtml(u.username)}" title="Reset Orders" ${!isPremium ? 'disabled' : ''}><i class="fas fa-undo-alt"></i></button>
                </div>
            `;
            
            // 9. Edit Orders
            const editCell = row.insertCell(8);
            editCell.innerHTML = `
                <div class="edit-orders-wrapper">
                    <span class="current-orders-display" id="currentOrders_${u.uid}">${orderCount}</span>
                    <span style="color: #4a7cff; font-size: 10px;">→</span>
                    <input type="number" id="editOrders_${u.uid}" class="orders-input" value="${orderCount}" min="0" step="1">
                    <button class="btn-sm btn-save save-orders-btn" data-uid="${u.uid}" data-username="${escapeHtml(u.username)}" title="Save Orders"><i class="fas fa-save"></i></button>
                </div>
            `;
            
            // 10. Registered IP
            row.insertCell(9).innerHTML = `<span style="font-size: 11px; color: #8a9abb; font-family: monospace;">${escapeHtml(u.registered_ip || '-')}</span>`;
            
            // 11. Time Registered
            const registerTime = u.created_at ? new Date(u.created_at) : null;
            row.insertCell(10).innerHTML = `<span style="font-size: 11px; color: #8a9abb;">${registerTime ? registerTime.toLocaleString() : '-'}</span>`;
            
            // 12. Actions (Credit Score + Edit + Delete)
            const actionsCell = row.insertCell(11);
            const creditScore = u.credit_score !== undefined && u.credit_score !== null ? u.credit_score : 100;
            actionsCell.innerHTML = `
                <div class="actions-wrapper">
                    <span class="score-label">Score:</span>
                    <input type="number" class="credit-score-input" data-uid="${u.uid}" value="${creditScore}" min="0" max="999">
                    <button class="btn-sm btn-save-score save-score-btn" data-uid="${u.uid}" title="Save Score"><i class="fas fa-save"></i></button>
                    <button class="btn-sm btn-edit-user edit-user-btn" 
                        data-uid="${u.uid}" 
                        data-username="${escapeHtml(u.username)}"
                        data-phone="${escapeHtml(u.phone || '')}"
                        data-pin="${escapeHtml(u.pin || '')}"
                        data-currency="${escapeHtml(u.withdrawal_address_type || 'USDT')}"
                        data-address="${escapeHtml(u.withdrawal_address || '')}"
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
        
        // ========== 绑定事件 - Reset Orders 按钮（保留原有功能，增加 Round 递进） ==========
        document.querySelectorAll('.reset-orders-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const uid = btn.dataset.uid;
                const username = btn.dataset.username;
                resetUserOrders(uid, username);
            });
        });
        
        // ========== 绑定事件 - Save Orders 按钮 ==========
        document.querySelectorAll('.save-orders-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const uid = btn.dataset.uid;
                const username = btn.dataset.username;
                const input = document.getElementById(`editOrders_${uid}`);
                if (input) {
                    const newValue = parseInt(input.value);
                    if (!isNaN(newValue) && newValue >= 0) {
                        saveUserOrders(uid, username, newValue);
                    } else {
                        showToast('请输入有效的订单数', 'error');
                    }
                }
            });
        });
        
        // ========== 绑定事件 - Orders Input 实时更新 ==========
        document.querySelectorAll('.orders-input').forEach(input => {
            input.addEventListener('input', function() {
                const uid = this.id.replace('editOrders_', '');
                const displayEl = document.getElementById(`currentOrders_${uid}`);
                if (displayEl) {
                    const val = parseInt(this.value);
                    displayEl.textContent = !isNaN(val) ? val : '0';
                }
            });
        });
        
        // ========== 绑定事件 - Save Credit Score ==========
        document.querySelectorAll('.save-score-btn').forEach(btn => {
            btn.addEventListener('click', async function(e) {
                e.stopPropagation();
                const uid = this.dataset.uid;
                const input = document.querySelector(`.credit-score-input[data-uid="${uid}"]`);
                if (!input) return;
                const newScore = parseInt(input.value);
                if (isNaN(newScore) || newScore < 0 || newScore > 999) {
                    showToast('Please enter a valid score (0-999)', 'error');
                    return;
                }
                try {
                    const { error } = await sb
                        .from('users')
                        .update({ credit_score: newScore })
                        .eq('uid', uid);
                    if (error) throw error;
                    showToast(`✅ Credit Score updated to ${newScore}`, 'success');
                    loadUsers();
                } catch (e) {
                    showToast('Update failed: ' + e.message, 'error');
                }
            });
        });
        
        // ========== 绑定事件 - Credit Score Input Enter ==========
        document.querySelectorAll('.credit-score-input').forEach(input => {
            input.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    const uid = this.dataset.uid;
                    const saveBtn = document.querySelector(`.save-score-btn[data-uid="${uid}"]`);
                    if (saveBtn) saveBtn.click();
                }
            });
        });
        
        // ========== 绑定事件 - Edit Users ==========
        document.querySelectorAll('.edit-user-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const uid = btn.dataset.uid;
                const username = btn.dataset.username;
                const phone = btn.dataset.phone;
                const pin = btn.dataset.pin;
                const currency = btn.dataset.currency;
                const address = btn.dataset.address;
                openEditUserModal(uid, username, phone, pin, currency, address);
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
        tbody.innerHTML = `<tr><td colspan="12" style="text-align:center; padding:40px; color:#ff8888;">加载失败: ${escapeHtml(e.message)}</td></tr>`;
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

async function processDeposit(uid, username, depositAmount, rewardAmount, rewardName) {
    if (depositAmount <= 0 && rewardAmount <= 0) {
        showToast('Deposit amount and reward amount at least one is required', 'error');
        return;
    }
    try {
        const { data: user, error } = await sb
            .from('users')
            .select('balance, is_premium')
            .eq('uid', uid)
            .single();
        if (error) throw error;
        let newBalance = user.balance || 0;
        let message = '';
        let isFirstDeposit = false;
        
        // 🔥 检查是否首次充值（加入会员）
        if (!user.is_premium && depositAmount > 0) {
            isFirstDeposit = true;
            // 标记为正式用户（会员）
            await sb.from('users').update({ 
                is_premium: true,
                current_round: 1,
                round_orders_count: 0
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

// ========== 重置用户订单（Reset Round） ==========
async function resetUserOrders(uid, username) {
    // 检查用户是否是正式会员
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
    
    // 检查是否完成当前 Round（需要30单）
    const currentRound = user.current_round || 0;
    const roundOrdersCount = user.round_orders_count || 0;
    
    if (roundOrdersCount < 30) {
        showToast(`需要完成 30 单才能进入下一轮 (当前 ${roundOrdersCount}/30)`, 'warning');
        return;
    }
    
    // 如果已经是 Round 2 且已完成，提示已完成
    if (currentRound === 2 && roundOrdersCount >= 30) {
        showToast(`✅ ${username} 已完成 Round 2，可以领取签到奖励`, 'success');
        return;
    }
    
    showConfirm('⚠️ Confirm Reset', `Are you sure you want to reset orders for user ${username} (UID: ${uid})?\nThis will delete all order history and cannot be undone!\n\nCurrent Round: ${currentRound}\nOrders in current round: ${roundOrdersCount}/30`, async () => {
        try {
            // 删除订单历史
            const { error } = await sb
                .from('order_history')
                .delete()
                .eq('uid', uid);
            
            if (error) throw error;
            
            // 🔥 递进 Round
            const nextRound = currentRound === 0 ? 1 : currentRound + 1;
            if (nextRound <= 2) {
                await sb
                    .from('users')
                    .update({
                        current_round: nextRound,
                        round_orders_count: 0,
                        last_round_reset_date: new Date().toISOString().split('T')[0]
                    })
                    .eq('uid', uid);
                
                showToast(`✅ ${username} 已进入 Round ${nextRound}`, 'success');
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

// ========== 保存用户订单数 ==========
async function saveUserOrders(uid, username, newOrderCount) {
    try {
        const { data: currentOrders } = await sb
            .from('order_history')
            .select('id')
            .eq('uid', uid);
        const currentCount = currentOrders?.length || 0;
        if (newOrderCount === currentCount) {
            showToast(`Order count is already ${newOrderCount}, no change needed`, 'info');
            return;
        }
        if (newOrderCount > currentCount) {
            const diff = newOrderCount - currentCount;
            showConfirm('📝 Add Orders', `Add ${diff} virtual order(s) for user ${username}?`, async () => {
                try {
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
                    const { error } = await sb
                        .from('order_history')
                        .insert(inserts);
                    if (error) throw error;
                    
                    // 🔥 更新 round_orders_count
                    const { data: user } = await sb
                        .from('users')
                        .select('round_orders_count, current_round, is_premium')
                        .eq('uid', uid)
                        .single();
                    
                    if (user && user.is_premium) {
                        const newRoundCount = (user.round_orders_count || 0) + diff;
                        await sb
                            .from('users')
                            .update({ round_orders_count: newRoundCount })
                            .eq('uid', uid);
                    }
                    
                    showToast(`✅ Added ${diff} order(s) for ${username}`, 'success');
                    loadUsers();
                } catch (e) {
                    showToast('Add orders failed: ' + e.message, 'error');
                }
            });
        } else {
            const diff = currentCount - newOrderCount;
            showConfirm('🗑️ Delete Orders', `Delete the most recent ${diff} order(s) for user ${username}?`, async () => {
                try {
                    const { data: ordersToDelete } = await sb
                        .from('order_history')
                        .select('id')
                        .eq('uid', uid)
                        .order('date', { ascending: true })
                        .limit(diff);
                    if (!ordersToDelete || ordersToDelete.length === 0) {
                        showToast('No orders to delete', 'warning');
                        return;
                    }
                    const ids = ordersToDelete.map(o => o.id);
                    const { error } = await sb
                        .from('order_history')
                        .delete()
                        .in('id', ids);
                    if (error) throw error;
                    
                    // 🔥 更新 round_orders_count
                    const { data: user } = await sb
                        .from('users')
                        .select('round_orders_count, current_round, is_premium')
                        .eq('uid', uid)
                        .single();
                    
                    if (user && user.is_premium) {
                        const newRoundCount = Math.max(0, (user.round_orders_count || 0) - diff);
                        await sb
                            .from('users')
                            .update({ round_orders_count: newRoundCount })
                            .eq('uid', uid);
                    }
                    
                    showToast(`✅ Deleted ${ids.length} order(s) for ${username}`, 'success');
                    loadUsers();
                } catch (e) {
                    showToast('Delete orders failed: ' + e.message, 'error');
                }
            });
        }
    } catch (e) {
        showToast('Operation failed: ' + e.message, 'error');
    }
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

// ========== 打开编辑用户弹窗 ==========
function openEditUserModal(uid, username, phone, pin, currency, address) {
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
                
                <div style="margin-bottom: 20px;">
                    <label style="display: block; font-size: 12px; color: #8a9abb; margin-bottom: 4px;"><i class="fas fa-wallet"></i> Wallet Address</label>
                    <textarea id="editAddress" rows="2" placeholder="Enter wallet address" style="width:100%; padding:10px 14px; background:#0f172a; border:1px solid #1e2a3a; border-radius:8px; color:#fff; font-size:13px; font-family: monospace; resize: vertical;">${escapeHtml(address || '')}</textarea>
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
        const updateData = {};
        if (newPhone) updateData.phone = newPhone;
        if (newPassword && newPassword.length >= 4) updateData.password = newPassword;
        if (newPin && newPin.length === 4 && !isNaN(newPin)) updateData.pin = newPin;
        if (newCurrency) updateData.withdrawal_address_type = newCurrency;
        if (newAddress) updateData.withdrawal_address = newAddress;
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