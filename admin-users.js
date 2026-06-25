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
                            <th style="min-width: 80px;">Position</th>
                            <th style="min-width: 100px;">Referrer</th>
                            <th style="min-width: 120px;">Country</th>
                            <th style="min-width: 100px;">VIP Level</th>
                            <th style="min-width: 90px;">Pending (€)</th>
                            <th style="min-width: 110px;">Balance (€)</th>
                            <th style="min-width: 200px;">Round / Orders</th>
                            <th style="min-width: 130px;">Registered IP</th>
                            <th style="min-width: 130px;">Last Online</th>
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

/* 性能优化：弹窗动画使用GPU加速 */
.modal-overlay {
    will-change: opacity, visibility;
}
.modal-card {
    will-change: transform, opacity;
}
#creditScoreFill {
    will-change: width, background;
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
    
    tbody.innerHTML = '<tr><td colspan="13" style="text-align:center; padding:40px;"><i class="fas fa-spinner fa-spin"></i> Loading...</td></tr>';
    
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
            tbody.innerHTML = '<tr><td colspan="13" style="text-align:center; padding:40px; color:#6a7a9a;">No users</td></tr>';
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
        
                // ========== IP 重复检测（新增） ==========
        const ipMap = {};
        const duplicateIps = [];
        for (const u of users) {
            if (u.registered_ip && u.registered_ip !== '') {
                if (ipMap[u.registered_ip]) {
                    if (!duplicateIps.includes(u.registered_ip)) {
                        duplicateIps.push(u.registered_ip);
                    }
                } else {
                    ipMap[u.registered_ip] = u.uid;
                }
            }
        }
        
        // 如果有重复 IP，检查是否需要通知
        if (duplicateIps.length > 0) {
            const sortedIps = [...duplicateIps].sort();
            const currentKey = sortedIps.join('|');
            const ignoredKey = localStorage.getItem('duplicate_ip_ignored');
            
            if (ignoredKey !== currentKey) {
                // 构建显示消息（用 HTML 换行）
                let htmlMessage = '';
                for (const ip of duplicateIps) {
                    const usersWithIp = users.filter(u => u.registered_ip === ip);
                    const userList = usersWithIp.map(u => `${u.username} (UID: ${u.uid})`).join('<br>');
                    const displayIp = ip || 'Unknown';
                    htmlMessage += `📌 IP: ${displayIp}<br>${userList}<br><br>`;
                }
                htmlMessage += 'Please check abnormal users registration activity.';
                
                // 存储当前重复 IP 标识到全局变量
                window._duplicateIpKey = currentKey;
                
                // 延迟显示通知
                setTimeout(() => {
                    // 先显示纯文本通知（用 \n 作为占位）
                    const plainText = htmlMessage.replace(/<br>/g, '\n');
                    showAmberNotification(
                        '⚠️ Multiple Registered IP Detected',
                        plainText,
                        'warning'
                    );
                    
                    // 等待通知出现后，用 HTML 替换内容
                    setTimeout(() => {
                        const notifications = document.querySelectorAll('.notification-amber');
                        if (notifications.length > 0) {
                            const latestNotification = notifications[notifications.length - 1];
                            // 找到消息区域
                            const messageDiv = latestNotification.querySelector('div[style*="flex: 1"]');
                            if (messageDiv) {
                                // 找到消息文本所在的元素
                                const messageTextEl = messageDiv.querySelector('div[style*="font-size: 12px"]');
                                if (messageTextEl) {
                                    // 用 innerHTML 替换，显示 HTML 格式
                                    messageTextEl.innerHTML = htmlMessage;
                                } else {
                                    // 如果找不到精确的元素，直接替换整个消息区域的内容
                                    const allDivs = messageDiv.querySelectorAll('div');
                                    if (allDivs.length >= 2) {
                                        // 第二个 div 通常是消息内容
                                        allDivs[1].innerHTML = htmlMessage;
                                    }
                                }
                                
                                // 创建 "Don't show again" 按钮
                                const btn = document.createElement('button');
                                btn.textContent = 'Don\'t show again';
                                btn.style.cssText = `
                                    background: rgba(255,255,255,0.1);
                                    border: 1px solid rgba(255,255,255,0.2);
                                    padding: 4px 14px;
                                    border-radius: 20px;
                                    color: #d4c8a0;
                                    cursor: pointer;
                                    font-size: 11px;
                                    margin-top: 8px;
                                    font-family: 'Inter', sans-serif;
                                    transition: 0.2s;
                                    display: block;
                                `;
                                btn.onmouseover = function() {
                                    this.style.background = 'rgba(255,255,255,0.2)';
                                };
                                btn.onmouseout = function() {
                                    this.style.background = 'rgba(255,255,255,0.1)';
                                };
                                btn.onclick = function(e) {
                                    e.stopPropagation();
                                    dismissDuplicateIpAlert();
                                };
                                messageDiv.appendChild(btn);
                            }
                        }
                    }, 300);
                }, 500);
            }
        }
        
        for (let u of users) {
    const row = tbody.insertRow();
    row.className = 'user-row';
    
    const orderCount = orderCountMap[u.uid] || 0;
    const ordersLimit = vipLimitMap[u.vip_level] || 30;
    const vipName = vipNameMap[u.vip_level] || (u.vip_level === 1 ? 'Normal' : u.vip_level === 2 ? 'VIP' : 'SVIP');
    const pendingAmount = pendingMap[u.uid] || 0;
    const creditScore = u.credit_score !== undefined && u.credit_score !== null ? u.credit_score : 100;
    
    // 1. Phone (索引 0)
    row.insertCell(0).innerHTML = `<span style="font-size: 12px;">${escapeHtml(u.phone || '-')}</span>`;
    
    // 2. User ID (UID) (索引 1)
    row.insertCell(1).innerHTML = `<span class="badge" style="font-size: 11px;">${escapeHtml(u.uid)}</span>`;

    // 3. Position (索引 2)
    const roleCell = row.insertCell(2);
    const userRole = u.user_role || 'User';
    const roleBadgeColor = userRole === 'Agent' ? '#ffb84d' : '#6a7a9a';
    roleCell.innerHTML = `<span style="font-size: 11px; color: ${roleBadgeColor}; font-weight: 600;">${userRole}</span>`;
    
    // 4. Referrer (索引 3)
    row.insertCell(3).innerHTML = `<span style="font-size: 12px; color: #8a9abb;">${escapeHtml(u.invited_by_username || '-')}</span>`;
    
    // 5. Country（索引 4）
    const countryName = u.country || 'Unknown';
    const flagMap = {
        'Germany': 'de', 'United States': 'us', 'United Kingdom': 'gb',
        'Italy': 'it', 'China': 'cn', 'France': 'fr', 'Spain': 'es',
        'Switzerland': 'ch', 'Austria': 'at', 'Netherlands': 'nl',
        'Belgium': 'be', 'Denmark': 'dk', 'Sweden': 'se', 'Norway': 'no',
        'Finland': 'fi', 'Portugal': 'pt', 'Greece': 'gr', 'Turkey': 'tr',
        'Russia': 'ru', 'Japan': 'jp', 'South Korea': 'kr', 'India': 'in',
        'Brazil': 'br', 'Mexico': 'mx', 'Australia': 'au', 'New Zealand': 'nz',
        'South Africa': 'za', 'UAE': 'ae', 'Saudi Arabia': 'sa', 'Singapore': 'sg',
        'Malaysia': 'my', 'Philippines': 'ph', 'Indonesia': 'id', 'Thailand': 'th',
        'Vietnam': 'vn', 'Taiwan': 'tw', 'Hong Kong': 'hk', 'Macau': 'mo',
        'Ireland': 'ie', 'Poland': 'pl', 'Czech Republic': 'cz', 'Hungary': 'hu',
        'Croatia': 'hr', 'Malta': 'mt', 'Cyprus': 'cy', 'Estonia': 'ee',
        'Latvia': 'lv', 'Lithuania': 'lt', 'Moldova': 'md', 'Monaco': 'mc',
        'Liechtenstein': 'li', 'Greenland': 'gl', 'Faroe Islands': 'fo',
        'Iceland': 'is', 'Luxembourg': 'lu', 'Andorra': 'ad', 'Gibraltar': 'gi',
        'Canada': 'ca', 'Argentina': 'ar', 'Chile': 'cl', 'Colombia': 'co',
        'Peru': 'pe', 'Venezuela': 've', 'Egypt': 'eg', 'Nigeria': 'ng',
        'Kenya': 'ke', 'Israel': 'il', 'Pakistan': 'pk', 'Bangladesh': 'bd',
        'Sri Lanka': 'lk', 'Nepal': 'np', 'Afghanistan': 'af', 'Iraq': 'iq',
        'Iran': 'ir', 'Saudi Arabia': 'sa', 'Kuwait': 'kw', 'Qatar': 'qa',
        'Oman': 'om', 'Bahrain': 'bh', 'Lebanon': 'lb', 'Jordan': 'jo'
    };
    const countryCode = flagMap[countryName] || 'unknown';
    const flagUrl = countryCode !== 'unknown' ? `https://flagcdn.com/w40/${countryCode}.png` : null;
    let countryHtml = '';
    if (flagUrl && countryName !== 'Unknown') {
        countryHtml = `<img src="${flagUrl}" class="country-flag-img" onerror="this.style.display='none'" alt=""> <span class="country-name">${countryName}</span>`;
    } else {
        countryHtml = `<span style="font-size: 12px; color: #8a9abb;">${countryName}</span>`;
    }
    row.insertCell(4).innerHTML = countryHtml;
    
    // 6. VIP Level (索引 5) - 只显示下拉，移除标签
    const vipCell = row.insertCell(5);
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
        <select class="vip-select vip-change-select" data-uid="${u.uid}" data-username="${escapeHtml(u.username)}" style="width:80px; background:#0f172a; border:1px solid #1e2a3a; border-radius:6px; padding:4px 6px; color:#fff; font-size:12px; cursor:pointer;">
            ${optionsHtml}
        </select>
    `;
    
    // 7. Pending (索引 6)
    const pendingWithdrawAmount = pendingMap[u.uid] || 0;
    const amountDue = parseFloat(u.amount_due) || 0;
    const amountDueRound = parseFloat(u.amount_due_round) || 0;
    const amountDueOrdersCount = parseFloat(u.amount_due_orders_count) || 0;
    let totalAmountDue = amountDue + amountDueRound + amountDueOrdersCount;
    let displayPending = pendingWithdrawAmount;
    if (totalAmountDue > 0) {
        displayPending = -totalAmountDue;
    }
    const pendingCell = row.insertCell(6);
    const isNegative = displayPending < 0;
    pendingCell.innerHTML = `
        <span style="font-weight: 700; ${isNegative ? 'color: #ff5a5a;' : 'color: #ffb84d;'}">
            ${isNegative ? '-' : ''}€${Math.abs(displayPending).toFixed(2)}
        </span>
        ${isNegative ? '<div style="font-size: 9px; color: #ff5a5a; opacity: 0.7;">Amount Due</div>' : ''}
    `;
    
    // 8. Balance + Deposit + Deduct (索引 7)
    const balanceCell = row.insertCell(7);
    balanceCell.innerHTML = `
        <div class="balance-wrapper">
            <span class="balance-amount">€${(u.balance || 0).toFixed(2)}</span>
            <button class="btn-sm btn-deposit deposit-btn" data-uid="${u.uid}" data-username="${escapeHtml(u.username)}" title="Deposit"><i class="fas fa-plus-circle"></i></button>
            <button class="btn-sm btn-deduct deduct-btn" data-uid="${u.uid}" data-username="${escapeHtml(u.username)}" title="Deduct"><i class="fas fa-minus-circle"></i></button>
        </div>
    `;
    
    // 9. Round / Orders (索引 8)
    const ordersCell = row.insertCell(8);
    const isPremium = u.is_premium || false;
    const currentRound = u.current_round || 0;
    const roundOrdersCount = u.round_orders_count || 0;
    let roundDisplay = 0;
    let displayCount = 0;
    if (!isPremium) {
        roundDisplay = 0;
        displayCount = orderCount;
    } else {
        roundDisplay = currentRound;
        displayCount = roundOrdersCount;
    }
    ordersCell.innerHTML = `
        <div class="orders-wrapper">
            <span class="round-number">(${roundDisplay})</span>
            <input type="number" class="orders-input round-edit-input" data-uid="${u.uid}" value="${displayCount}" min="0" step="1" title="Edit orders in current round">
            <span style="color: #6a7a9a; font-size: 10px;">/30</span>
            <button class="btn-sm btn-reset reset-orders-btn" data-uid="${u.uid}" data-username="${escapeHtml(u.username)}" title="Reset Orders" ${!isPremium ? 'disabled' : ''}><i class="fas fa-undo-alt"></i></button>
            <button class="btn-sm btn-save-orders save-round-orders-btn" data-uid="${u.uid}" data-username="${escapeHtml(u.username)}" title="Save Orders"><i class="fas fa-save"></i></button>
        </div>
    `;
    
    // 10. Registered IP (索引 9)
    row.insertCell(9).innerHTML = `<span style="font-size: 11px; color: #8a9abb; font-family: monospace;">${escapeHtml(u.registered_ip || '-')}</span>`;
    
    // 11. Last Online (索引 10) - 全部灰色细字体
const lastOnline = u.last_online || u.updated_at || u.created_at;
let lastOnlineDisplay = '-';
if (lastOnline) {
    const lastDate = new Date(lastOnline);
    const now = new Date();
    const diffMins = Math.floor((now - lastDate) / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffMins < 1) {
        lastOnlineDisplay = 'Just now';
    } else if (diffMins < 60) {
        lastOnlineDisplay = `${diffMins}m ago`;
    } else if (diffHours < 24) {
        lastOnlineDisplay = `${diffHours}h ago`;
    } else if (diffDays < 7) {
        lastOnlineDisplay = `${diffDays}d ago`;
    } else {
        lastOnlineDisplay = lastDate.toLocaleDateString();
    }
}
// 全部灰色，细字体
row.insertCell(10).innerHTML = `<span style="font-size: 11px; color: #8a9abb; font-weight: 300;">${lastOnlineDisplay}</span>`;
    
    // 12. Time Registered (索引 11) - 只显示日期
    const registerTime = u.created_at ? new Date(u.created_at) : null;
    row.insertCell(11).innerHTML = `<span style="font-size: 11px; color: #8a9abb;">${registerTime ? registerTime.toLocaleDateString() : '-'}</span>`;
    
    // 13. Actions (索引 12)
    const actionsCell = row.insertCell(12);
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
                data-user-role="${escapeHtml(u.user_role || 'User')}"
                data-withdrawal-frozen="${u.withdrawal_frozen || false}"
                data-is-banned="${u.is_banned || false}"
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
        
        // ========== 绑定事件 - Edit Users ==========
document.querySelectorAll('.edit-user-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const uid = btn.dataset.uid;
        const username = btn.dataset.username;
        const phone = btn.dataset.phone;
        const pin = btn.dataset.pin;
        const currency = btn.dataset.currency;
        const address = btn.dataset.address;
        const creditScore = btn.dataset.creditScore || 100;
        const userRole = btn.dataset.userRole || 'User';
        const withdrawalFrozen = btn.dataset.withdrawalFrozen === 'true';
        const isBanned = btn.dataset.isBanned === 'true';
        openEditUserModal(uid, username, phone, pin, currency, address, creditScore, userRole, withdrawalFrozen, isBanned);
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
        tbody.innerHTML = `<tr><td colspan="13" style="text-align:center; padding:40px; color:#ff8888;">加载失败: ${escapeHtml(e.message)}</td></tr>`;
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
        
        if (!user.is_premium && depositAmount > 0) {
            isFirstDeposit = true;
            await sb.from('users').update({ 
                is_premium: true
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
        
        // 刷新后台数据
        loadUsers();
        if (window.loadDashboardPage) window.loadDashboardPage(currentDays);
        
        // 🔥 触发 start.html 刷新（通过 localStorage 事件）
        localStorage.setItem('refresh_start_page', Date.now().toString());
        console.log('✅ 已触发 start.html 刷新');
        
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
    
    // ✅ 删除 Round 2 提前返回的逻辑
    
    showConfirm('⚠️ Confirm Reset', `确定要重置用户 ${username} (UID: ${uid}) 到下一轮吗？\n\n当前 Round: ${currentRound}\n当前轮订单数: ${roundOrdersCount}/30`, async () => {
        try {
            // 🔥 Round 2 → Round 1（循环）
            let nextRound;
            if (currentRound === 2) {
                nextRound = 1;
            } else {
                nextRound = currentRound + 1;
            }
            
            await sb.from('users').update({
                current_round: nextRound,
                round_orders_count: 0,
                last_round_reset_date: new Date().toISOString().split('T')[0]
            }).eq('uid', uid);
            
            showToast(`✅ ${username} 已进入 Round ${nextRound}，当前 0/30`, 'success');
            
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

// ========== 打开编辑用户弹窗（深空金属 - 完整功能版） ==========
function openEditUserModal(uid, username, phone, pin, currency, address, creditScore, userRole, withdrawalFrozen, isBanned) {
    // 防止多次快速点击
    if (document.getElementById('editUserModal')) {
        return;
    }
    
    document.body.style.overflow = 'hidden';
    const existingModal = document.getElementById('editUserModal');
    if (existingModal) existingModal.remove();

    const initialScore = creditScore || 100;
    const roleDisplay = userRole || 'User';
    const statusText = withdrawalFrozen ? 'Freeze' : 'Active';
    const statusColor = withdrawalFrozen ? '#ff5a5a' : '#4ade80';
    const banButtonText = isBanned ? 'Release Ban User' : 'Ban User';
    const banButtonColor = isBanned ? '#4ade80' : '#ff6b6b';

    const modalHtml = `
        <div id="editUserModal" class="modal-overlay" style="visibility: visible; opacity: 1; display: flex; align-items: center; justify-content: center; z-index: 9999;">
            <div class="modal-card" style="
                width: 520px; 
                max-width: 94%; 
                max-height: 80vh; 
                overflow-y: auto; 
                background: linear-gradient(145deg, #0a0a0f, #1a1a2e);
                border: 1px solid rgba(180, 180, 200, 0.08);
                border-radius: 16px; 
                padding: 18px 22px; 
                box-shadow: 0 30px 80px rgba(0, 0, 0, 0.7), inset 0 0 60px rgba(180, 180, 200, 0.02);
                position: relative;
                overflow: hidden;
            ">
                <div style="position: absolute; top: 0; left: -50%; width: 200%; height: 100%; background: linear-gradient(90deg, transparent, rgba(180, 180, 200, 0.015), transparent); transform: skewX(-25deg); pointer-events: none;"></div>
                <div style="position: absolute; bottom: 0; right: -50%; width: 200%; height: 50%; background: linear-gradient(90deg, transparent, rgba(180, 180, 200, 0.008), transparent); transform: skewX(20deg); pointer-events: none;"></div>
                <div style="position: absolute; top: -100px; right: -100px; width: 300px; height: 300px; background: radial-gradient(circle, rgba(180, 180, 200, 0.03), transparent 70%); pointer-events: none; border-radius: 50%;"></div>
                <div style="position: absolute; bottom: -80px; left: -80px; width: 200px; height: 200px; background: radial-gradient(circle, rgba(180, 180, 200, 0.02), transparent 70%); pointer-events: none; border-radius: 50%;"></div>
                
                <!-- 头部 -->
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px; position: relative; z-index: 1;">
                    <div>
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <span style="display: inline-block; width: 3px; height: 16px; background: linear-gradient(180deg, #8a8aa0, #4a4a5a); border-radius: 2px;"></span>
                            <h2 style="color: #e8e8f0; font-size: 16px; font-weight: 600; margin: 0; letter-spacing: 0.3px;">Edit User</h2>
                        </div>
                        <div style="display: flex; gap: 16px; margin-top: 4px; font-size: 11px; flex-wrap: wrap;">
                            <span style="color: #6a6a80;"><i class="fas fa-phone" style="color: #6a6a80; width: 14px; font-size: 11px;"></i> ${escapeHtml(phone || 'Not Set')}</span>
                            <span style="color: #6a6a80;"><i class="fas fa-shield-alt" style="color: #6a6a80; width: 14px; font-size: 11px;"></i> Credit: <strong style="color: #e8e8f0;" id="creditScoreDisplayHeader">${initialScore}</strong></span>
                            <span style="color: #6a6a80;"><i class="fas fa-user-tag" style="color: #6a6a80; width: 14px; font-size: 11px;"></i> Position: <strong style="color: ${roleDisplay === 'Agent' ? '#ffb84d' : '#6a6a80'};">${roleDisplay}</strong></span>
                        </div>
                    </div>
                    <button onclick="closeEditUserModal()" style="background: rgba(255,255,255,0.03); border: 1px solid rgba(180,180,200,0.06); color: #5a5a6a; font-size: 16px; cursor: pointer; padding: 2px 8px; border-radius: 6px;">&times;</button>
                </div>

                <hr style="border: none; border-top: 1px solid rgba(180, 180, 200, 0.06); margin: 0 0 12px 0;">

                <!-- 四张卡片 -->
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 14px; position: relative; z-index: 1;">
                    <div style="background: rgba(255, 255, 255, 0.02); border: 1px solid rgba(180, 180, 200, 0.06); border-radius: 10px; padding: 10px 14px;">
                        <div style="font-size: 9px; font-weight: 600; color: #6a6a80; text-transform: uppercase; letter-spacing: 0.6px; margin-bottom: 1px;">User ID</div>
                        <div style="font-size: 14px; font-weight: 600; color: #e8e8f0; font-family: monospace;">${escapeHtml(uid)}</div>
                    </div>
                    <div style="background: rgba(255, 255, 255, 0.02); border: 1px solid rgba(180, 180, 200, 0.06); border-radius: 10px; padding: 10px 14px;">
                        <div style="font-size: 9px; font-weight: 600; color: #6a6a80; text-transform: uppercase; letter-spacing: 0.6px; margin-bottom: 1px;">Withdrawal Status</div>
                        <div style="font-size: 14px; font-weight: 600; color: ${statusColor};">${statusText}</div>
                    </div>
                    <div style="background: rgba(255, 255, 255, 0.02); border: 1px solid rgba(180, 180, 200, 0.06); border-radius: 10px; padding: 10px 14px;">
                        <div style="font-size: 9px; font-weight: 600; color: #6a6a80; text-transform: uppercase; letter-spacing: 0.6px; margin-bottom: 1px;">Total Deposit</div>
                        <div style="font-size: 14px; font-weight: 600; color: #ffffff;" id="totalDepositDisplay">€0.00</div>
                    </div>
                    <div style="background: rgba(255, 255, 255, 0.02); border: 1px solid rgba(180, 180, 200, 0.06); border-radius: 10px; padding: 10px 14px;">
                        <div style="font-size: 9px; font-weight: 600; color: #6a6a80; text-transform: uppercase; letter-spacing: 0.6px; margin-bottom: 1px;">Total Withdrawal</div>
                        <div style="font-size: 14px; font-weight: 600; color: #ffffff;" id="totalWithdrawalDisplay">€0.00</div>
                    </div>
                </div>

                <!-- Account Actions -->
                <div style="margin-bottom: 14px; position: relative; z-index: 1;">
                    <div style="font-size: 9px; font-weight: 600; color: #5a5a6a; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px;">Account Actions</div>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px;">
                        <div onclick="resetWithdrawalPin('${uid}')" style="background: rgba(255, 255, 255, 0.02); border: 1px solid rgba(180, 180, 200, 0.05); border-radius: 8px; padding: 8px 12px; cursor: pointer; transition: 0.2s;">
                            <div style="font-weight: 500; color: #e8e8f0; font-size: 12px;">Reset Withdrawal PIN</div>
                            <div style="font-size: 9px; color: #5a5a6a;">Reset user's withdrawal pin</div>
                        </div>
                        <div onclick="resetUserPassword('${uid}')" style="background: rgba(255, 255, 255, 0.02); border: 1px solid rgba(180, 180, 200, 0.05); border-radius: 8px; padding: 8px 12px; cursor: pointer; transition: 0.2s;">
                            <div style="font-weight: 500; color: #e8e8f0; font-size: 12px;">Reset Password</div>
                            <div style="font-size: 9px; color: #5a5a6a;">Reset user's account password</div>
                        </div>
                        <div onclick="resetUserPhone('${uid}')" style="background: rgba(255, 255, 255, 0.02); border: 1px solid rgba(180, 180, 200, 0.05); border-radius: 8px; padding: 8px 12px; cursor: pointer; transition: 0.2s;">
                            <div style="font-weight: 500; color: #e8e8f0; font-size: 12px;">Reset Phone Number</div>
                            <div style="font-size: 9px; color: #5a5a6a;">Reset user's phone number</div>
                        </div>
                        <div onclick="promoteToAdmin('${uid}')" style="background: rgba(255, 255, 255, 0.02); border: 1px solid rgba(180, 180, 200, 0.05); border-radius: 8px; padding: 8px 12px; cursor: pointer; transition: 0.2s;">
                            <div style="font-weight: 500; color: #ffb84d; font-size: 12px;">${roleDisplay === 'Agent' ? 'Demote to User' : 'Promote Admin'}</div>
                            <div style="font-size: 9px; color: #5a5a6a;">${roleDisplay === 'Agent' ? 'Remove admin privileges' : 'Allow user to view downline data'}</div>
                        </div>
                        <div onclick="freezeUserWithdrawal('${uid}')" style="background: rgba(255, 255, 255, 0.02); border: 1px solid rgba(180, 180, 200, 0.05); border-radius: 8px; padding: 8px 12px; cursor: pointer; transition: 0.2s;">
                            <div style="font-weight: 500; color: ${withdrawalFrozen ? '#4ade80' : '#e8e8f0'}; font-size: 12px;">${withdrawalFrozen ? 'Unfreeze Withdrawal' : 'Freeze Withdrawal'}</div>
                            <div style="font-size: 9px; color: #5a5a6a;">${withdrawalFrozen ? 'Restore withdrawal access' : 'Block this user from withdrawing'}</div>
                        </div>
                        <div onclick="toggleBanUser('${uid}')" style="background: rgba(255, 255, 255, 0.02); border: 1px solid rgba(180, 180, 200, 0.05); border-radius: 8px; padding: 8px 12px; cursor: pointer; transition: 0.2s;">
                            <div style="font-weight: 500; color: ${banButtonColor}; font-size: 12px;">${banButtonText}</div>
                            <div style="font-size: 9px; color: #5a5a6a;">${isBanned ? 'Restore user access' : 'Disable user account'}</div>
                        </div>
                    </div>
                </div>

                <!-- Credit Scores -->
                <div style="margin-bottom: 14px; background: rgba(255,255,255,0.02); border-radius: 8px; padding: 10px 14px; border: 1px solid rgba(180,180,200,0.05); position:relative; z-index:1;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
                        <span style="font-weight:500; color:#6a6a80; font-size:11px;">Credit Scores</span>
                        <span style="font-size:16px; font-weight:700; color:#e8e8f0;" id="creditScoreValue">${initialScore}</span>
                    </div>
                    <div style="width:100%; height:4px; border-radius:3px; background:rgba(255,255,255,0.06); overflow:hidden;">
                        <div id="creditScoreFill" style="width:${initialScore}%; height:100%; border-radius:3px; background:${initialScore >= 95 ? '#4ade80' : '#ff5a5a'};"></div>
                    </div>
                    <input type="range" min="0" max="100" value="${initialScore}" 
                           style="position:absolute; top:0; left:0; width:100%; height:100%; opacity:0; cursor:pointer; z-index:2;"
                           id="creditScoreSlider" oninput="updateCreditScore(this.value)">
                    <div style="display:flex; justify-content:space-between; font-size:7px; color:#4a4a5a; margin-top:2px;">
                        <span>0</span><span>100</span>
                    </div>
                    <div style="display:flex; gap:10px; margin-top:2px; font-size:8px;">
                        <span style="color:#4ade80;">● ≥95</span>
                        <span style="color:#ff5a5a;">● &lt;95</span>
                    </div>
                </div>

                <!-- 底部按钮 -->
                <div style="display: flex; gap: 10px; justify-content: flex-end; border-top: 1px solid rgba(180, 180, 200, 0.06); padding-top: 12px; position: relative; z-index: 1;">
                    <button onclick="closeEditUserModal()" style="background: rgba(255,255,255,0.03); border: 1px solid rgba(180,180,200,0.06); padding: 6px 22px; border-radius: 40px; color: #6a6a80; font-weight: 500; cursor: pointer; font-size: 12px; transition: 0.2s;">Close</button>
                    <button onclick="saveEditUser('${uid}')" style="background: linear-gradient(145deg, #3a3a5a, #2a2a4a); border: none; padding: 6px 22px; border-radius: 40px; color: #e8e8f0; font-weight: 600; cursor: pointer; font-size: 12px; transition: 0.2s;">Save Changes</button>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHtml);
    fetchUserFinancialStats(uid);
}

// ============================================================
// 更新信用分 - 进度条双色切换
// ============================================================
// ============================================================
// 更新信用分 - 双色切换（性能优化版）
// ============================================================
let creditScoreUpdatePending = false;
let pendingScoreValue = 0;

function updateCreditScore(value) {
    const score = parseInt(value);
    pendingScoreValue = score;
    
    // 立即更新显示的数字（轻量操作）
    const display = document.getElementById('creditScoreValue');
    const headerDisplay = document.getElementById('creditScoreDisplayHeader');
    if (display) display.textContent = score;
    if (headerDisplay) headerDisplay.textContent = score;
    
    // 使用 requestAnimationFrame 批量更新样式（避免布局抖动）
    if (!creditScoreUpdatePending) {
        creditScoreUpdatePending = true;
        requestAnimationFrame(function() {
            const fill = document.getElementById('creditScoreFill');
            if (fill) {
                const currentScore = pendingScoreValue;
                fill.style.width = currentScore + '%';
                fill.style.background = currentScore >= 95 ? '#4ade80' : '#ff5a5a';
            }
            creditScoreUpdatePending = false;
        });
    }
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

// ========== IP 重复检测 - Don't show again ==========
function dismissDuplicateIpAlert() {
    const key = window._duplicateIpKey;
    if (key) {
        localStorage.setItem('duplicate_ip_ignored', key);
        console.log('✅ IP 重复检测已忽略，当前标识:', key);
    }
    // 关闭所有琥珀通知
    document.querySelectorAll('.notification-amber').forEach(el => el.remove());
}

// ============================================================
// 获取用户的财务统计数据（带防抖）
// ============================================================
let financialStatsTimeout = null;

async function fetchUserFinancialStats(uid) {
    // 取消之前的请求
    if (financialStatsTimeout) {
        clearTimeout(financialStatsTimeout);
        financialStatsTimeout = null;
    }
    
    // 延迟200ms执行，避免快速切换用户时频繁请求
    financialStatsTimeout = setTimeout(async () => {
        try {
            // 使用 Promise.all 并行查询
            const [depositsResult, withdrawalsResult] = await Promise.all([
                sb.from('deposits').select('amount').eq('uid', uid),
                sb.from('withdrawals').select('amount').eq('uid', uid).eq('status', 'approved')
            ]);
            
            if (depositsResult.error) throw depositsResult.error;
            if (withdrawalsResult.error) throw withdrawalsResult.error;
            
            const totalDeposit = depositsResult.data.reduce((sum, d) => sum + (d.amount || 0), 0);
            const totalWithdrawal = withdrawalsResult.data.reduce((sum, w) => sum + (w.amount || 0), 0);
            
            const depositDisplay = document.getElementById('totalDepositDisplay');
            const withdrawalDisplay = document.getElementById('totalWithdrawalDisplay');
            if (depositDisplay) depositDisplay.textContent = `€${totalDeposit.toFixed(2)}`;
            if (withdrawalDisplay) withdrawalDisplay.textContent = `€${totalWithdrawal.toFixed(2)}`;
            
        } catch (error) {
            console.error('获取用户财务数据失败:', error);
        } finally {
            financialStatsTimeout = null;
        }
    }, 200);
}

// ============================================================
// 关闭弹窗
// ============================================================
function closeEditUserModal() {
    const modal = document.getElementById('editUserModal');
    if (modal) modal.remove();
    document.body.style.overflow = '';
}

// ============================================================
// 保存编辑 (更新 Credit Score)
// ============================================================
async function saveEditUser(uid) {
    const creditScore = document.getElementById('creditScoreSlider').value;
    
    try {
        const { error } = await sb
            .from('users')
            .update({ credit_score: parseInt(creditScore) })
            .eq('uid', uid);
        
        if (error) throw error;
        showToast(`用户 ${uid} 的信誉分已更新为 ${creditScore}`, 'success');
        closeEditUserModal();
        loadUsers();
    } catch (e) {
        showToast('保存失败: ' + e.message, 'error');
    }
}

// ============================================================
// Account Actions 函数
// ============================================================

async function resetWithdrawalPin(uid) {
    showConfirm('Reset Withdrawal PIN', `确定要重置用户 ${uid} 的提现PIN吗？`, async () => {
        try {
            const { error } = await sb
                .from('users')
                .update({ pin: '0000' })
                .eq('uid', uid);
            if (error) throw error;
            showToast('提现PIN已重置为 0000', 'success');
            closeEditUserModal();
            loadUsers();
        } catch (e) {
            showToast('重置失败: ' + e.message, 'error');
        }
    });
}

async function resetUserPassword(uid) {
    showPrompt('Reset Password', '请输入新密码 (至少4位):', async (newPassword) => {
        if (!newPassword) return;
        if (newPassword.length < 4) {
            showToast('密码至少需要4位', 'error');
            return;
        }
        try {
            const { error } = await sb
                .from('users')
                .update({ password: newPassword })
                .eq('uid', uid);
            if (error) throw error;
            showToast('密码已重置', 'success');
            closeEditUserModal();
            loadUsers();
        } catch (e) {
            showToast('重置失败: ' + e.message, 'error');
        }
    });
}

async function resetUserPhone(uid) {
    showPrompt('Reset Phone Number', '请输入新的手机号:', async (newPhone) => {
        if (!newPhone) return;
        try {
            const { error } = await sb
                .from('users')
                .update({ phone: newPhone })
                .eq('uid', uid);
            if (error) throw error;
            showToast('手机号已更新', 'success');
            closeEditUserModal();
            loadUsers();
        } catch (e) {
            showToast('更新失败: ' + e.message, 'error');
        }
    });
}

// ============================================================
// Promote Admin / Demote to User
// ============================================================
async function promoteToAdmin(uid) {
    // 先获取当前用户角色
    const { data: user } = await sb.from('users').select('user_role').eq('uid', uid).single();
    const currentRole = user?.user_role || 'User';
    const newRole = currentRole === 'Agent' ? 'User' : 'Agent';
    const actionText = newRole === 'Agent' ? 'Promote to Admin' : 'Downgrade to User';
    
    showConfirm('Promote Admin', `确定要${actionText}用户 ${uid} 吗？`, async () => {
        try {
            const { error } = await sb
                .from('users')
                .update({ user_role: newRole })
                .eq('uid', uid);
            if (error) throw error;
            showToast(`✅ 用户已${actionText}`, 'success');
            closeEditUserModal();
            loadUsers();
        } catch (e) {
            showToast('操作失败: ' + e.message, 'error');
        }
    });
}

// ============================================================
// Freeze / Unfreeze Withdrawal
// ============================================================
async function freezeUserWithdrawal(uid) {
    // 获取当前状态
    const { data: user } = await sb.from('users').select('withdrawal_frozen').eq('uid', uid).single();
    const currentStatus = user?.withdrawal_frozen || false;
    const actionText = currentStatus ? 'Unfreeze' : 'Freeze';
    
    showConfirm('Freeze Withdrawal', `确定要${actionText}用户 ${uid} 的提款权限吗？`, async () => {
        try {
            const { error } = await sb
                .from('users')
                .update({ withdrawal_frozen: !currentStatus })
                .eq('uid', uid);
            if (error) throw error;
            showToast(`✅ 提款权限已${actionText}`, 'success');
            closeEditUserModal();
            loadUsers();
        } catch (e) {
            showToast('操作失败: ' + e.message, 'error');
        }
    });
}

// ============================================================
// Toggle Ban User (Ban / Release Ban)
// ============================================================
async function toggleBanUser(uid) {
    const { data: user } = await sb.from('users').select('is_banned').eq('uid', uid).single();
    const isBanned = user?.is_banned || false;
    const actionText = isBanned ? 'Ban User' : 'Release User';
    
    showConfirm(isBanned ? 'Release Ban User' : 'Ban User', 
        isBanned ? `确定要解封用户 ${uid} 吗？` : `Are you sure to ban user ${uid} ？此操作将禁用该用户的登录。`, 
        async () => {
            try {
                const { error } = await sb
                    .from('users')
                    .update({ is_banned: !isBanned })
                    .eq('uid', uid);
                if (error) throw error;
                showToast(`✅ 用户已${actionText}`, 'success');
                closeEditUserModal();
                loadUsers();
            } catch (e) {
                showToast('操作失败: ' + e.message, 'error');
            }
        }
    );
}