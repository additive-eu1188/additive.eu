// admin-signin.js - 签到奖励页面（与 Withdrawal 页面风格一致）
async function loadSigninPage() {
    const container = document.getElementById('page_signin');
    if (!container) return;
    
    container.innerHTML = `
        <div class="card">
            <!-- 顶部：左侧标题 + 右侧按钮 -->
            <div class="withdraw-header" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; margin-bottom: 24px;">
                <h2 style="font-size: 18px; font-weight: 600; color: #d8e0f0; margin: 0;">
                    <i class="fas fa-calendar-check" style="color: #8892a8; margin-right: 10px;"></i>
                    Check In Bonus Setting
                </h2>
                <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                    <button id="addSigninDayBtn" class="success" style="background: rgba(74,222,128,0.06); border: 1px solid rgba(74,222,128,0.08); padding: 8px 20px; border-radius: 40px; color: #7ad0b0; font-weight: 600; font-size: 13px; cursor: pointer; transition: all 0.3s; font-family: 'Inter', sans-serif; display: inline-flex; align-items: center; gap: 6px;">
                        <i class="fas fa-plus"></i> Add Check In Days
                    </button>
                    <button id="refreshSigninBtn" class="btn-primary"><i class="fas fa-sync-alt"></i> Refresh</button>
                </div>
            </div>
            
            <!-- 奖励设置行 -->
            <div style="background: rgba(12, 16, 28, 0.6); border-radius: 16px; padding: 16px 20px; margin-bottom: 24px; border: 1px solid rgba(255,255,255,0.04);">
                <div style="display: flex; align-items: center; gap: 12px; flex-wrap: wrap;" id="signinRewardsRow">
                    <div style="font-size: 12px; color: #8892a8; margin-right: 8px; font-weight: 500;">Rewards:</div>
                    <div id="rewardsListContainer" style="display: flex; gap: 10px; flex-wrap: wrap; align-items: center;"></div>
                </div>
                <div style="margin-top: 14px; padding-top: 14px; border-top: 1px solid rgba(255,255,255,0.04); display: flex; gap: 12px; flex-wrap: wrap;">
                    <button id="saveAllRewardsBtn" class="btn-primary" style="background: rgba(74,222,128,0.06); border: 1px solid rgba(74,222,128,0.08); color: #7ad0b0; padding: 8px 28px; border-radius: 40px; font-weight: 600; font-size: 13px; cursor: pointer; transition: all 0.3s; font-family: 'Inter', sans-serif;">
                        <i class="fas fa-save"></i> Save Changes
                    </button>
                </div>
            </div>
            
            <!-- 搜索栏 -->
            <div class="search-bar" style="display: flex; flex-wrap: wrap; gap: 10px; align-items: center; background: rgba(8, 12, 24, 0.5); border-radius: 16px; padding: 12px 16px; margin-bottom: 20px; border: 1px solid rgba(255,255,255,0.03);">
                <input type="text" id="signinSearchInput" class="search-input" placeholder="Search UID..." style="flex: 1; min-width: 160px; background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.10); border-radius: 40px; padding: 8px 16px; color: #e6edf5; font-size: 13px; outline: none;">
                <button id="signinSearchBtn" class="btn-primary" style="padding: 8px 20px; border-radius: 40px; border: none; background: #2a3a5a; color: #e6edf5; font-weight: 600; cursor: pointer; font-size: 13px; white-space: nowrap;">
                    <i class="fas fa-search"></i> Search
                </button>
                <button id="signinClearBtn" class="btn-primary" style="padding: 8px 18px; border-radius: 40px; border: none; background: rgba(255,255,255,0.06); color: #b8c4de; font-weight: 500; cursor: pointer; font-size: 13px; white-space: nowrap;">
                    <i class="fas fa-times"></i> Clear
                </button>
            </div>
            
            <!-- 表格 -->
            <div class="table-container" style="max-height: 500px; overflow-y: auto; border-radius: 16px; border: 1px solid rgba(255,255,255,0.03);">
                <table class="data-table" style="width: 100%; border-collapse: collapse; font-size: 13px; min-width: 700px;">
                    <thead>
                        <tr>
                            <th style="padding: 14px 16px; color: #a8b4d0; font-weight: 600; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid rgba(255,255,255,0.04); background: rgba(10,14,28,0.3); text-align: left; min-width: 120px;">User ID</th>
                            <th style="padding: 14px 16px; color: #a8b4d0; font-weight: 600; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid rgba(255,255,255,0.04); background: rgba(10,14,28,0.3); text-align: left; min-width: 140px;">Claimed Streak</th>
                            <th style="padding: 14px 16px; color: #a8b4d0; font-weight: 600; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid rgba(255,255,255,0.04); background: rgba(10,14,28,0.3); text-align: left; min-width: 140px;">Reward Amount</th>
                            <th style="padding: 14px 16px; color: #a8b4d0; font-weight: 600; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid rgba(255,255,255,0.04); background: rgba(10,14,28,0.3); text-align: left; min-width: 180px;">Claim Date</th>
                        </tr>
                    </thead>
                    <tbody id="signinRecordsTableBody"><tr><td colspan="4" style="text-align:center; padding:30px; color:#6a7a9a;">Loading...</td></tr></tbody>
                </table>
            </div>
            
            <!-- 分页 -->
            <div class="pagination" id="signinPagination"></div>
        </div>
    `;
    
    // 添加样式
    const style = document.createElement('style');
    style.textContent = `
        .reward-item {
            display: flex;
            align-items: center;
            gap: 6px;
            background: rgba(255,255,255,0.03);
            border: 1px solid rgba(255,255,255,0.04);
            border-radius: 40px;
            padding: 4px 12px 4px 16px;
            transition: all 0.2s;
        }
        .reward-item:hover {
            border-color: rgba(200,176,144,0.15);
            background: rgba(255,255,255,0.05);
        }
        .reward-item .day-label {
            font-size: 11px;
            font-weight: 600;
            color: #8892a8;
        }
        .reward-item .reward-input {
            width: 80px;
            background: rgba(255,255,255,0.06);
            border: 1px solid rgba(255,255,255,0.06);
            border-radius: 20px;
            padding: 4px 10px;
            color: #e6edf5;
            font-size: 13px;
            text-align: center;
            outline: none;
            transition: 0.2s;
        }
        .reward-item .reward-input:focus {
            border-color: rgba(200,176,144,0.25);
            background: rgba(255,255,255,0.08);
        }
        .reward-item .reward-input::placeholder {
            color: rgba(255,255,255,0.15);
        }
        .reward-item .reward-currency {
            font-size: 12px;
            color: #8892a8;
        }
        .reward-item .delete-reward-btn {
            background: rgba(232,128,128,0.08);
            border: none;
            border-radius: 50%;
            width: 22px;
            height: 22px;
            color: #e88080;
            cursor: pointer;
            font-size: 11px;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: 0.2s;
            padding: 0;
        }
        .reward-item .delete-reward-btn:hover {
            background: rgba(232,128,128,0.2);
        }
        .status-badge-claimed {
            background: rgba(74,222,128,0.10);
            color: #7ad0b0;
            padding: 2px 12px;
            border-radius: 40px;
            font-size: 11px;
            display: inline-block;
        }
        .record-row {
            transition: 0.2s;
        }
        .record-row:hover td {
            background: rgba(255,255,255,0.02);
        }
        @media (max-width: 768px) {
            #signinRewardsRow {
                flex-direction: column;
                align-items: stretch;
            }
            .reward-item {
                flex-wrap: wrap;
                justify-content: center;
                padding: 6px 12px;
            }
        }
    `;
    document.head.appendChild(style);
    
    // 加载数据
    await loadSigninRewards();
    await loadSigninRecords();
    
    // 绑定事件
    document.getElementById('addSigninDayBtn')?.addEventListener('click', addSigninDay);
    document.getElementById('saveAllRewardsBtn')?.addEventListener('click', saveAllRewards);
    document.getElementById('refreshSigninBtn')?.addEventListener('click', () => {
        loadSigninRewards();
        loadSigninRecords();
    });
    document.getElementById('signinSearchBtn')?.addEventListener('click', () => {
        const keyword = document.getElementById('signinSearchInput').value.trim();
        loadSigninRecords(keyword);
    });
    document.getElementById('signinClearBtn')?.addEventListener('click', () => {
        document.getElementById('signinSearchInput').value = '';
        loadSigninRecords();
    });
    document.getElementById('signinSearchInput')?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            const keyword = document.getElementById('signinSearchInput').value.trim();
            loadSigninRecords(keyword);
        }
    });
}

// ============================================================
// 加载签到奖励设置
// ============================================================
let signinRewardsData = [];

async function loadSigninRewards() {
    const { data: rewards, error } = await sb
        .from('signin_rewards')
        .select('*')
        .order('day', { ascending: true });
    
    if (error) {
        console.error('加载签到奖励失败:', error);
        signinRewardsData = [];
    } else {
        signinRewardsData = rewards || [];
    }
    
    renderRewardsList();
}

function renderRewardsList() {
    const container = document.getElementById('rewardsListContainer');
    if (!container) return;
    
    container.innerHTML = '';
    
    if (signinRewardsData.length === 0) {
        container.innerHTML = '<span style="font-size: 12px; color: #6a7a9a;">No rewards set. Click "Add Check In Days" to add.</span>';
        return;
    }
    
    signinRewardsData.forEach((reward) => {
        const div = document.createElement('div');
        div.className = 'reward-item';
        div.innerHTML = `
            <span class="day-label">Day${reward.day}</span>
            <input type="number" class="reward-input" data-day="${reward.day}" value="${reward.amount}" step="0.01" min="0">
            <span class="reward-currency">€</span>
            <button class="delete-reward-btn" data-day="${reward.day}" title="Delete Day ${reward.day}">
                <i class="fas fa-times"></i>
            </button>
        `;
        container.appendChild(div);
    });
    
    // 绑定删除事件
    document.querySelectorAll('.delete-reward-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
            const day = parseInt(btn.dataset.day);
            showConfirm('Confirm Delete', `Delete Day ${day} reward?`, async () => {
                await sb.from('signin_rewards').delete().eq('day', day);
                await loadSigninRewards();
                showToast(`Day ${day} deleted`, 'success');
            });
        });
    });
}

// ============================================================
// 保存所有奖励（一键保存）
// ============================================================
async function saveAllRewards() {
    const inputs = document.querySelectorAll('.reward-input');
    const updates = [];
    
    inputs.forEach(input => {
        const day = parseInt(input.dataset.day);
        const amount = parseFloat(input.value);
        if (!isNaN(amount) && amount >= 0) {
            updates.push({ day, amount });
        }
    });
    
    if (updates.length === 0) {
        showToast('No valid rewards to save', 'warning');
        return;
    }
    
    try {
        for (const update of updates) {
            await sb
                .from('signin_rewards')
                .update({ amount: update.amount })
                .eq('day', update.day);
        }
        showToast(`✅ ${updates.length} rewards saved successfully`, 'success');
        await loadSigninRewards();
    } catch (error) {
        showToast('Save failed: ' + error.message, 'error');
    }
}

// ============================================================
// 添加签到日
// ============================================================
async function addSigninDay() {
    const t = window.i18n?.t || function(key) { return key; };
    
    // 找到最大 day
    const maxDay = signinRewardsData.reduce((max, r) => Math.max(max, r.day), 0);
    const newDay = maxDay + 1;
    
    showPrompt('Add Check In Day', `Enter reward amount for Day ${newDay} (€):`, async (amount) => {
        if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
            showToast('Please enter a valid amount', 'error');
            return;
        }
        
        const { error } = await sb
            .from('signin_rewards')
            .insert([{ day: newDay, amount: parseFloat(amount) }]);
        
        if (error) {
            showToast('Add failed: ' + error.message, 'error');
        } else {
            showToast(`Day ${newDay} added successfully`, 'success');
            await loadSigninRewards();
        }
    });
}

// ============================================================
// 加载签到记录
// ============================================================
let signinRecordsData = [];
let signinRecordsPage = 1;
const SIGNIN_RECORDS_PAGE_SIZE = 30;

async function loadSigninRecords(searchKeyword = '') {
    const tbody = document.getElementById('signinRecordsTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding:30px; color:#6a7a9a;">Loading...</td></tr>';
    
    try {
        let query = sb
            .from('user_checkin_records')
            .select('*', { count: 'exact' })
            .order('checkin_date', { ascending: false })
            .order('created_at', { ascending: false });
        
        if (searchKeyword) {
            // 先查找匹配的 uid
            const { data: matchedUsers } = await sb
                .from('users')
                .select('uid')
                .ilike('uid', `%${searchKeyword}%`)
                .limit(50);
            
            if (matchedUsers && matchedUsers.length > 0) {
                const uids = matchedUsers.map(u => u.uid);
                query = query.in('uid', uids);
            } else {
                query = query.ilike('uid', `%${searchKeyword}%`);
            }
        }
        
        const { data: records, error, count } = await query
            .range(
                (signinRecordsPage - 1) * SIGNIN_RECORDS_PAGE_SIZE,
                signinRecordsPage * SIGNIN_RECORDS_PAGE_SIZE - 1
            );
        
        if (error) throw error;
        
        signinRecordsData = records || [];
        const totalCount = count || 0;
        
        if (signinRecordsData.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding:30px; color:#6a7a9a;">No check-in records found</td></tr>';
            renderSigninPagination(totalCount);
            return;
        }
        
        tbody.innerHTML = '';
        
        for (const record of signinRecordsData) {
            const row = tbody.insertRow();
            row.className = 'record-row';
            
            // 获取用户名
            let username = record.uid;
            try {
                const { data: userData } = await sb
                    .from('users')
                    .select('username')
                    .eq('uid', record.uid)
                    .single();
                if (userData) username = userData.username;
            } catch (e) { /* ignore */ }
            
            const claimDate = record.checkin_date || record.created_at;
            const formattedDate = claimDate ? new Date(claimDate).toLocaleDateString() : '-';
            
            row.insertCell(0).innerHTML = `
                <span style="display: flex; flex-direction: column; gap: 2px;">
                    <span style="font-weight: 600; color: #d8e0f0; font-size: 13px;">${escapeHtml(record.uid)}</span>
                    <span style="font-size: 10px; color: #6a7a9a;">${escapeHtml(username)}</span>
                </span>
            `;
            
            row.insertCell(1).innerHTML = `
                <span class="status-badge-claimed">Day ${record.day_number || '?'}</span>
            `;
            
            row.insertCell(2).innerHTML = `
                <span style="font-weight: 600; color: #C9B095; font-size: 14px;">€${(record.amount || 0).toFixed(2)}</span>
            `;
            
            row.insertCell(3).innerHTML = `
                <span style="font-size: 12px; color: #8892a8;">${formattedDate}</span>
            `;
        }
        
        renderSigninPagination(totalCount);
        
    } catch (e) {
        console.error('加载签到记录失败:', e);
        tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; padding:30px; color:#ff8888;">加载失败: ${escapeHtml(e.message)}</td></tr>`;
    }
}

// ============================================================
// 分页渲染
// ============================================================
function renderSigninPagination(totalCount) {
    const container = document.getElementById('signinPagination');
    if (!container) return;
    
    container.innerHTML = '';
    
    const totalPages = Math.ceil(totalCount / SIGNIN_RECORDS_PAGE_SIZE);
    if (totalPages <= 1) return;
    
    if (signinRecordsPage > 1) {
        const prev = document.createElement('button');
        prev.innerHTML = 'Previous';
        prev.className = 'date-filter-btn';
        prev.onclick = () => {
            signinRecordsPage--;
            loadSigninRecords(document.getElementById('signinSearchInput')?.value || '');
        };
        container.appendChild(prev);
    }
    
    const startPage = Math.max(1, signinRecordsPage - 2);
    const endPage = Math.min(totalPages, signinRecordsPage + 2);
    
    for (let i = startPage; i <= endPage; i++) {
        const btn = document.createElement('button');
        btn.innerText = i;
        btn.className = 'date-filter-btn' + (i === signinRecordsPage ? ' active' : '');
        btn.onclick = () => {
            signinRecordsPage = i;
            loadSigninRecords(document.getElementById('signinSearchInput')?.value || '');
        };
        container.appendChild(btn);
    }
    
    if (signinRecordsPage < totalPages) {
        const next = document.createElement('button');
        next.innerHTML = 'Next';
        next.className = 'date-filter-btn';
        next.onclick = () => {
            signinRecordsPage++;
            loadSigninRecords(document.getElementById('signinSearchInput')?.value || '');
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

window.loadSigninPage = loadSigninPage;