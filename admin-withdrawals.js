// admin-withdrawals.js - 完整版（标签切换 + 搜索功能）
let currentWithdrawTab = 'pending';
let withdrawSearchKeyword = '';

async function loadWithdrawalsPage() {
    const container = document.getElementById('page_withdrawals');
    if (!container) return;
    container.innerHTML = `
        <div class="card">
            <div class="search-bar" style="justify-content: space-between; flex-wrap: wrap; gap: 12px;">
                <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                    <button id="tabPending" class="tab-withdraw-btn active" data-tab="pending"><i class="fas fa-clock"></i> 待处理</button>
                    <button id="tabHistory" class="tab-withdraw-btn" data-tab="history"><i class="fas fa-history"></i> 提现记录</button>
                </div>
                <div style="display: flex; gap: 10px; flex-wrap: wrap; align-items: center;">
                    <button id="refreshWithdrawBtn" class="btn-primary"><i class="fas fa-sync-alt"></i> 刷新</button>
                </div>
            </div>
            
            <!-- 待处理面板 -->
            <div id="pendingPanel" class="withdraw-panel">
                <div class="table-container" style="max-height: 500px; overflow-y: auto;">
                    <table class="data-table">
                        <thead><tr><th>UID</th><th>Username</th><th>Amount</th><th>Remaining Balance</th><th>Crypto Type</th><th>Wallet Address</th><th>Submitted Time</th><th>Actions</th></tr></thead>
                        <tbody id="withdrawalsTableBody"><tr><td colspan="7" style="text-align:center; padding:30px; color:#6a7a9a;">Loading...</td></tr></tbody>
                    </table>
                </div>
            </div>
            
            <!-- 历史记录面板 -->
            <div id="historyPanel" class="withdraw-panel" style="display: none;">
                <div class="search-bar" style="margin-bottom: 16px;">
                    <input type="text" id="historySearchInput" class="search-input" placeholder="🔍 搜索 UID 或用户名..." style="max-width: 300px;">
                    <button id="historySearchBtn" class="btn-primary"><i class="fas fa-search"></i> 搜索</button>
                    <button id="historyClearBtn" class="btn-primary"><i class="fas fa-times"></i> 清除</button>
                    <button id="clearHistoryBtn" class="danger" style="background:#7a2f2f; border:none; padding:8px 16px; border-radius:20px; color:#fff; cursor:pointer; margin-left: auto;"><i class="fas fa-trash"></i> 清空记录</button>
                </div>
                <div class="table-container" style="max-height: 500px; overflow-y: auto;">
                    <table class="data-table">
                        <thead><tr><th>UID</th><th>用户名</th><th>金额</th><th>币种</th><th>钱包地址</th><th>状态</th><th>申请时间</th><th>处理时间</th></tr></thead>
                        <tbody id="withdrawalHistoryBody"><tr><td colspan="8" style="text-align:center; padding:30px; color:#6a7a9a;">加载中...</td></tr></tbody>
                    </table>
                </div>
            </div>
        </div>
    `;
    
    // 添加样式
    const style = document.createElement('style');
    style.textContent = `
        .tab-withdraw-btn {
            background: rgba(74,124,255,0.1);
            border: 1px solid rgba(74,124,255,0.2);
            border-radius: 30px;
            padding: 8px 20px;
            color: #8a9abb;
            cursor: pointer;
            transition: all 0.2s;
            font-size: 14px;
        }
        .tab-withdraw-btn:hover {
            background: rgba(74,124,255,0.2);
        }
        .tab-withdraw-btn.active {
            background: #4a7cff;
            color: #fff;
            border-color: #4a7cff;
        }
        .wallet-address-cell {
            max-width: 200px;
            word-break: break-all;
        }
        .wallet-address-wrapper {
            display: flex;
            align-items: center;
            gap: 6px;
        }
        .wallet-address-text {
            font-size: 11px;
            font-family: 'Courier New', monospace;
            color: #c0c8e0;
            word-break: break-all;
            line-height: 1.4;
        }
        .copy-address-btn {
            background: rgba(74,124,255,0.15);
            border: none;
            padding: 2px 8px;
            border-radius: 4px;
            color: #4a7cff;
            cursor: pointer;
            font-size: 11px;
            transition: 0.2s;
            flex-shrink: 0;
        }
        .copy-address-btn:hover {
            background: rgba(74,124,255,0.3);
        }
        .currency-badge {
            display: inline-block;
            padding: 2px 10px;
            border-radius: 12px;
            font-size: 11px;
            font-weight: 600;
            background: rgba(74,124,255,0.15);
            color: #4a7cff;
        }
        .currency-badge.usdt { background: rgba(38, 161, 123, 0.2); color: #26a17b; }
        .currency-badge.eth { background: rgba(98, 126, 234, 0.2); color: #627eea; }
        .currency-badge.btc { background: rgba(247, 147, 26, 0.2); color: #f7931a; }
        .currency-badge.usdc { background: rgba(38, 161, 123, 0.15); color: #2775ca; }
        .status-badge-approved { background: rgba(46,209,90,0.15); color: #2ed15a; padding: 2px 10px; border-radius: 12px; font-size: 11px; display: inline-block; }
        .status-badge-rejected { background: rgba(255,90,90,0.15); color: #ff5a5a; padding: 2px 10px; border-radius: 12px; font-size: 11px; display: inline-block; }
        .status-badge-pending { background: rgba(255,184,77,0.15); color: #ffb84d; padding: 2px 10px; border-radius: 12px; font-size: 11px; display: inline-block; }
        .btn-sm-action {
            padding: 4px 10px;
            font-size: 11px;
            border: none;
            border-radius: 4px;
            color: #fff;
            cursor: pointer;
            transition: 0.2s;
            margin-right: 4px;
        }
        .btn-sm-action:hover {
            opacity: 0.85;
        }
        .btn-approve { background: #2f6b3a; }
        .btn-reject { background: #7a2f2f; }
        .withdraw-panel {
            animation: fadeIn 0.3s ease;
        }
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(8px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .history-search-bar {
            display: flex;
            gap: 10px;
            flex-wrap: wrap;
            align-items: center;
            margin-bottom: 16px;
        }
        .history-search-bar .search-input {
            flex: 1;
            min-width: 200px;
            max-width: 300px;
        }
        @media (max-width: 768px) {
            .wallet-address-cell {
                max-width: 120px;
            }
            .wallet-address-text {
                font-size: 10px;
            }
            .history-search-bar .search-input {
                max-width: 100%;
                min-width: 150px;
            }
            .tab-withdraw-btn {
                font-size: 12px;
                padding: 6px 14px;
            }
        }
    `;
    document.head.appendChild(style);
    
    // 绑定标签切换
    document.getElementById('tabPending')?.addEventListener('click', () => switchWithdrawTab('pending'));
    document.getElementById('tabHistory')?.addEventListener('click', () => switchWithdrawTab('history'));
    
    // 绑定刷新按钮
    document.getElementById('refreshWithdrawBtn')?.addEventListener('click', refreshWithdrawData);
    
    // 绑定历史搜索
    document.getElementById('historySearchBtn')?.addEventListener('click', () => {
        withdrawSearchKeyword = document.getElementById('historySearchInput').value.trim();
        loadWithdrawalHistory();
    });
    document.getElementById('historyClearBtn')?.addEventListener('click', () => {
        document.getElementById('historySearchInput').value = '';
        withdrawSearchKeyword = '';
        loadWithdrawalHistory();
    });
    
    // 绑定清空记录
    document.getElementById('clearHistoryBtn')?.addEventListener('click', clearWithdrawalHistory);
    
    // 回车搜索
    document.getElementById('historySearchInput')?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            withdrawSearchKeyword = document.getElementById('historySearchInput').value.trim();
            loadWithdrawalHistory();
        }
    });
    
    // 加载数据
    await loadWithdrawals();
    await loadWithdrawalHistory();
}

// ========== 标签切换 ==========
function switchWithdrawTab(tab) {
    currentWithdrawTab = tab;
    document.getElementById('tabPending').classList.toggle('active', tab === 'pending');
    document.getElementById('tabHistory').classList.toggle('active', tab === 'history');
    document.getElementById('pendingPanel').style.display = tab === 'pending' ? 'block' : 'none';
    document.getElementById('historyPanel').style.display = tab === 'history' ? 'block' : 'none';
    
    if (tab === 'pending') {
        loadWithdrawals();
    } else {
        loadWithdrawalHistory();
    }
}

// ========== 刷新所有数据 ==========
async function refreshWithdrawData() {
    const btn = document.getElementById('refreshWithdrawBtn');
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 刷新中...';
    }
    
    try {
        await Promise.all([
            loadWithdrawals(),
            loadWithdrawalHistory()
        ]);
        if (window.loadDashboardPage) window.loadDashboardPage(currentDays);
        showToast('数据已刷新', 'success');
    } catch (e) {
        console.error('刷新失败:', e);
        showToast('刷新失败: ' + e.message, 'error');
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-sync-alt"></i> 刷新';
        }
    }
}

// ========== 加载待处理提现 ==========
async function loadWithdrawals() {
    const tbody = document.getElementById('withdrawalsTableBody');
    if (!tbody) return;
    
    try {
        const { data: wd, error } = await sb
            .from('withdrawals')
            .select('*')
            .eq('status', 'pending')
            .order('request_date', { ascending: false });
        
        if (error) throw error;
        
        if (!wd || wd.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" style="text-align:center; padding:30px; color:#6a7a9a;">暂无待处理提现</td></tr>';
            return;
        }
        
        tbody.innerHTML = '';
        for (let w of wd) {
            const row = tbody.insertRow();
            const currency = w.currency || w.withdrawal_address_type || 'USDT';
            const currencyClass = currency.toLowerCase();
            
            // 获取用户余额并计算提现后余额
            let remainingBalance = 0;
            try {
                const { data: userData } = await sb
                    .from('users')
                    .select('balance')
                    .eq('uid', w.uid)
                    .single();
                if (userData) {
                    remainingBalance = (userData.balance || 0) - (w.amount || 0);
                }
            } catch (e) {
                console.error('获取用户余额失败:', e);
            }
            
            // 1. UID
            row.insertCell(0).innerHTML = `<span class="badge">${escapeHtml(w.uid)}</span>`;
            
            // 2. Username
            row.insertCell(1).innerText = w.username || w.uid;
            
            // 3. Amount
            row.insertCell(2).innerHTML = `<span class="text-gold">€${(w.amount || 0).toFixed(2)}</span>`;
            
            // 4. Remaining Balance (灰色)
            row.insertCell(3).innerHTML = `<span style="color: #8a9abb; font-weight: 500;">€${remainingBalance.toFixed(2)}</span>`;
            
            // 5. Crypto Type (原币种列)
            row.insertCell(4).innerHTML = `<span class="currency-badge ${currencyClass}">${escapeHtml(currency)}</span>`;
            
            // 6. Wallet Address
            const address = w.wallet_address || '-';
            const addressCell = row.insertCell(5);
            addressCell.className = 'wallet-address-cell';
            addressCell.innerHTML = `
                <div class="wallet-address-wrapper">
                    <span class="wallet-address-text">${escapeHtml(address)}</span>
                    ${address !== '-' ? `<button class="copy-address-btn" data-address="${escapeHtml(address)}"><i class="fas fa-copy"></i></button>` : ''}
                </div>
            `;
            
            // 7. Submitted Time
            row.insertCell(6).innerText = new Date(w.request_date).toLocaleString();
            
            // 8. Actions
            row.insertCell(7).innerHTML = `
                <button class="btn-sm-action btn-approve approve-withdraw" data-id="${w.id}" data-uid="${w.uid}" data-amt="${w.amount}"><i class="fas fa-check"></i> 批准</button>
                <button class="btn-sm-action btn-reject reject-withdraw" data-id="${w.id}" data-uid="${w.uid}" data-amt="${w.amount}"><i class="fas fa-times"></i> 拒绝</button>
            `;
        }
        
        // 绑定复制按钮
        document.querySelectorAll('#withdrawalsTableBody .copy-address-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                copyToClipboard(btn.dataset.address);
            });
        });
        
        // 绑定批准/拒绝
        document.querySelectorAll('.approve-withdraw').forEach(btn => {
            btn.addEventListener('click', () => handleApproveWithdraw(btn.dataset.id, btn.dataset.uid, btn.dataset.amt));
        });
        document.querySelectorAll('.reject-withdraw').forEach(btn => {
            btn.addEventListener('click', () => handleRejectWithdraw(btn.dataset.id, btn.dataset.uid, btn.dataset.amt));
        });
        
    } catch (e) {
        console.error('加载提现失败:', e);
        tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; padding:30px; color:#ff8888;">加载失败: ${escapeHtml(e.message)}</td></tr>`;
    }
}

// ========== 加载提现历史 ==========
async function loadWithdrawalHistory() {
    const tbody = document.getElementById('withdrawalHistoryBody');
    if (!tbody) return;
    
    try {
        let query = sb
            .from('withdrawals')
            .select('*')
            .in('status', ['approved', 'rejected'])
            .order('processed_at', { ascending: false })
            .limit(200);
        
        if (withdrawSearchKeyword) {
            query = query.or(`uid.ilike.%${withdrawSearchKeyword}%,username.ilike.%${withdrawSearchKeyword}%`);
        }
        
        const { data: history, error } = await query;
        
        if (error) throw error;
        
        if (!history || history.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" style="text-align:center; padding:30px; color:#6a7a9a;">暂无提现记录</td></tr>';
            return;
        }
        
        tbody.innerHTML = '';
        for (let w of history) {
            const row = tbody.insertRow();
            const currency = w.currency || w.withdrawal_address_type || 'USDT';
            const currencyClass = currency.toLowerCase();
            
            row.insertCell(0).innerHTML = `<span class="badge">${escapeHtml(w.uid)}</span>`;
            row.insertCell(1).innerText = w.username || w.uid;
            row.insertCell(2).innerHTML = `<span class="${w.status === 'approved' ? 'text-green' : 'text-red'}">€${(w.amount || 0).toFixed(2)}</span>`;
            row.insertCell(3).innerHTML = `<span class="currency-badge ${currencyClass}">${escapeHtml(currency)}</span>`;
            
            // 钱包地址
            const address = w.wallet_address || '-';
            const addressCell = row.insertCell(4);
            addressCell.className = 'wallet-address-cell';
            addressCell.innerHTML = `
                <div class="wallet-address-wrapper">
                    <span class="wallet-address-text">${escapeHtml(address)}</span>
                    ${address !== '-' ? `<button class="copy-address-btn" data-address="${escapeHtml(address)}"><i class="fas fa-copy"></i></button>` : ''}
                </div>
            `;
            
            row.insertCell(5).innerHTML = `<span class="status-badge-${w.status}">${w.status === 'approved' ? '✅ 已批准' : '❌ 已拒绝'}</span>`;
            row.insertCell(6).innerText = new Date(w.request_date).toLocaleString();
            row.insertCell(7).innerText = w.processed_at ? new Date(w.processed_at).toLocaleString() : '-';
        }
        
        // 绑定复制按钮
        document.querySelectorAll('#withdrawalHistoryBody .copy-address-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                copyToClipboard(btn.dataset.address);
            });
        });
        
    } catch (e) {
        console.error('加载历史记录失败:', e);
        tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; padding:30px; color:#ff8888;">加载失败: ${escapeHtml(e.message)}</td></tr>`;
    }
}

// ========== 复制功能 ==========
function copyToClipboard(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(() => {
            showToast('地址已复制！', 'success');
        }).catch(() => {
            fallbackCopy(text);
        });
    } else {
        fallbackCopy(text);
    }
}

function fallbackCopy(text) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.left = '-9999px';
    textarea.style.top = '-9999px';
    document.body.appendChild(textarea);
    textarea.select();
    try {
        document.execCommand('copy');
        showToast('地址已复制！', 'success');
    } catch (e) {
        showToast('复制失败，请手动复制', 'error');
    }
    textarea.remove();
}

// ========== 批准提现 ==========
async function handleApproveWithdraw(id, uid, amount) {
    showConfirm('批准提现', `确认批准用户 ${uid} 的提现申请 €${parseFloat(amount).toFixed(2)}？`, async () => {
        try {
            const { error } = await sb
                .from('withdrawals')
                .update({ 
                    status: 'approved',
                    processed_at: new Date().toISOString()
                })
                .eq('id', parseInt(id));
            
            if (error) throw error;
            
            await refreshWithdrawData();
            if (window.loadDashboardPage) window.loadDashboardPage(currentDays);
            showToast('✅ 提现已批准', 'success');
        } catch (e) {
            showToast('批准失败: ' + e.message, 'error');
        }
    });
}

// ========== 拒绝提现 ==========
async function handleRejectWithdraw(id, uid, amount) {
    showConfirm('拒绝提现', `确认拒绝用户 ${uid} 的提现申请？金额 €${parseFloat(amount).toFixed(2)} 将退回用户账户。`, async () => {
        try {
            // 获取用户当前余额
            const { data: user, error: userError } = await sb
                .from('users')
                .select('balance')
                .eq('uid', uid)
                .single();
            
            if (userError) throw userError;
            
            // 退回金额
            const { error: balanceError } = await sb
                .from('users')
                .update({ balance: (user.balance || 0) + parseFloat(amount) })
                .eq('uid', uid);
            
            if (balanceError) throw balanceError;
            
            // 更新提现状态
            const { error } = await sb
                .from('withdrawals')
                .update({ 
                    status: 'rejected',
                    processed_at: new Date().toISOString()
                })
                .eq('id', parseInt(id));
            
            if (error) throw error;
            
            await refreshWithdrawData();
            if (window.loadDashboardPage) window.loadDashboardPage(currentDays);
            showToast('❌ 已拒绝，金额已退回', 'success');
        } catch (e) {
            showToast('拒绝失败: ' + e.message, 'error');
        }
    });
}

// ========== 清空历史记录 ==========
async function clearWithdrawalHistory() {
    showConfirm('⚠️ 清空记录', '确定要清空所有提现历史记录吗？此操作不可恢复！', async () => {
        try {
            const { error } = await sb
                .from('withdrawals')
                .delete()
                .in('status', ['approved', 'rejected']);
            
            if (error) throw error;
            
            showToast('已清空所有提现记录', 'success');
            loadWithdrawalHistory();
        } catch (e) {
            showToast('清空失败: ' + e.message, 'error');
        }
    });
}

// ========== 工具函数 ==========
function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

window.loadWithdrawalsPage = loadWithdrawalsPage;