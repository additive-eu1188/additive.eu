// admin-withdrawals.js - 完整版（使用自定义弹窗）
async function loadWithdrawalsPage() {
    const container = document.getElementById('page_withdrawals');
    if (!container) return;
    container.innerHTML = `
        <div class="card">
            <div class="search-bar" style="justify-content: space-between;">
                <h3 style="margin:0;"><i class="fas fa-spinner fa-pulse"></i> 待处理提现</h3>
                <button id="refreshWithdrawalsBtn" class="btn-primary"><i class="fas fa-sync-alt"></i> 刷新</button>
            </div>
            <div class="table-container" style="max-height: 400px; overflow-y: auto;">
                <table class="data-table">
                    <thead><tr><th>UID</th><th>用户名</th><th>金额</th><th>币种</th><th>钱包地址</th><th>申请时间</th><th>操作</th></tr></thead>
                    <tbody id="withdrawalsTableBody"></tbody>
                </table>
            </div>
        </div>
        <div class="card" style="margin-top: 24px;">
            <div class="search-bar" style="justify-content: space-between;">
                <h3 style="margin:0;"><i class="fas fa-history"></i> 提现记录</h3>
                <div style="display: flex; gap: 10px;">
                    <button id="refreshHistoryBtn" class="btn-primary"><i class="fas fa-sync-alt"></i> 刷新</button>
                    <button id="clearHistoryBtn" class="danger" style="background:#7a2f2f; border:none; padding:8px 16px; border-radius:20px; color:#fff; cursor:pointer;"><i class="fas fa-trash"></i> 清空记录</button>
                </div>
            </div>
            <div class="table-container" style="max-height: 400px; overflow-y: auto;">
                <table class="data-table">
                    <thead><tr><th>UID</th><th>用户名</th><th>金额</th><th>币种</th><th>钱包地址</th><th>状态</th><th>申请时间</th><th>处理时间</th></tr></thead>
                    <tbody id="withdrawalHistoryBody"></tbody>
                </table>
            </div>
        </div>
    `;
    
    // 添加样式
    const style = document.createElement('style');
    style.textContent = `
        .wallet-address-cell {
            max-width: 180px;
            word-break: break-all;
            font-size: 11px;
            font-family: 'Courier New', monospace;
            color: #c0c8e0;
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
        .status-badge-approved { background: rgba(46,209,90,0.15); color: #2ed15a; padding: 2px 10px; border-radius: 12px; font-size: 11px; }
        .status-badge-rejected { background: rgba(255,90,90,0.15); color: #ff5a5a; padding: 2px 10px; border-radius: 12px; font-size: 11px; }
        .status-badge-pending { background: rgba(255,184,77,0.15); color: #ffb84d; padding: 2px 10px; border-radius: 12px; font-size: 11px; }
    `;
    document.head.appendChild(style);
    
    await loadWithdrawals();
    await loadWithdrawalHistory();
    
    document.getElementById('refreshWithdrawalsBtn')?.addEventListener('click', () => { 
        loadWithdrawals(); 
        if (window.loadDashboardPage) window.loadDashboardPage(currentDays); 
    });
    document.getElementById('refreshHistoryBtn')?.addEventListener('click', loadWithdrawalHistory);
    document.getElementById('clearHistoryBtn')?.addEventListener('click', clearWithdrawalHistory);
}

async function loadWithdrawals() {
    const { data: wd } = await sb.from('withdrawals').select('*').eq('status', 'pending');
    const tbody = document.getElementById('withdrawalsTableBody');
    if (tbody) {
        tbody.innerHTML = '';
        for (let w of wd || []) {
            const row = tbody.insertRow();
            const currency = w.currency || w.withdrawal_address_type || 'USDT';
            const currencyClass = currency.toLowerCase();
            
            row.insertCell(0).innerHTML = `<span class="badge">${w.uid}</span>`;
            row.insertCell(1).innerText = w.username || w.uid;
            row.insertCell(2).innerHTML = `<span class="text-gold">€${(w.amount || 0).toFixed(2)}</span>`;
            row.insertCell(3).innerHTML = `<span class="currency-badge ${currencyClass}">${currency}</span>`;
            
            // 钱包地址 - 完整显示 + 复制按钮
            const address = w.wallet_address || '-';
            const addressCell = row.insertCell(4);
            addressCell.className = 'wallet-address-cell';
            addressCell.innerHTML = `
                <div class="wallet-address-wrapper">
                    <span class="wallet-address-text">${escapeHtml(address)}</span>
                    ${address !== '-' ? `<button class="copy-address-btn" data-address="${escapeHtml(address)}"><i class="fas fa-copy"></i></button>` : ''}
                </div>
            `;
            
            row.insertCell(5).innerText = new Date(w.request_date).toLocaleString();
            row.insertCell(6).innerHTML = `
                <button class="approve-withdraw" data-id="${w.id}" data-uid="${w.uid}" data-amt="${w.amount}" style="background:#2f6b3a; padding:4px 10px; font-size:11px; margin-right:4px; border:none; border-radius:4px; color:#fff; cursor:pointer;">批准</button>
                <button class="reject-withdraw" data-id="${w.id}" data-uid="${w.uid}" data-amt="${w.amount}" style="background:#7a2f2f; padding:4px 10px; font-size:11px; border:none; border-radius:4px; color:#fff; cursor:pointer;">拒绝</button>
            `;
        }
        
        // 绑定复制按钮事件
        document.querySelectorAll('.copy-address-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const address = btn.dataset.address;
                navigator.clipboard.writeText(address).then(() => {
                    showToast('地址已复制！', 'success');
                }).catch(() => {
                    // 降级方案
                    const textarea = document.createElement('textarea');
                    textarea.value = address;
                    document.body.appendChild(textarea);
                    textarea.select();
                    document.execCommand('copy');
                    textarea.remove();
                    showToast('地址已复制！', 'success');
                });
            });
        });
        
        document.querySelectorAll('.approve-withdraw').forEach(btn => btn.addEventListener('click', async () => {
            showConfirm('批准提现', `批准 €${parseFloat(btn.dataset.amt).toFixed(2)} 提现？`, async () => {
                await sb.from('withdrawals').update({ 
                    status: 'approved',
                    processed_at: new Date().toISOString()
                }).eq('id', parseInt(btn.dataset.id));
                loadWithdrawals();
                loadWithdrawalHistory();
                if (window.loadDashboardPage) window.loadDashboardPage(currentDays);
                showToast('已批准', 'success');
            });
        }));
        
        document.querySelectorAll('.reject-withdraw').forEach(btn => btn.addEventListener('click', async () => {
            showConfirm('拒绝提现', '拒绝该提现？金额将退回用户账户', async () => {
                const { data: user } = await sb.from('users').select('balance').eq('uid', btn.dataset.uid).single();
                await sb.from('users').update({ balance: (user.balance || 0) + parseFloat(btn.dataset.amt) }).eq('uid', btn.dataset.uid);
                await sb.from('withdrawals').update({ 
                    status: 'rejected',
                    processed_at: new Date().toISOString()
                }).eq('id', parseInt(btn.dataset.id));
                loadWithdrawals();
                loadWithdrawalHistory();
                if (window.loadDashboardPage) window.loadDashboardPage(currentDays);
                showToast('已拒绝，金额已退回', 'success');
            });
        }));
    }
}

async function loadWithdrawalHistory() {
    const { data: history } = await sb
        .from('withdrawals')
        .select('*')
        .in('status', ['approved', 'rejected'])
        .order('processed_at', { ascending: false })
        .limit(100);
    
    const tbody = document.getElementById('withdrawalHistoryBody');
    if (tbody) {
        tbody.innerHTML = '';
        if (!history || history.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" style="text-align:center; padding:30px; color:#6a7a9a;">暂无提现记录</td></tr>';
            return;
        }
        for (let w of history) {
            const row = tbody.insertRow();
            const currency = w.currency || w.withdrawal_address_type || 'USDT';
            const currencyClass = currency.toLowerCase();
            
            row.insertCell(0).innerHTML = `<span class="badge">${w.uid}</span>`;
            row.insertCell(1).innerText = w.username || w.uid;
            row.insertCell(2).innerHTML = `<span class="${w.status === 'approved' ? 'text-green' : 'text-red'}">€${(w.amount || 0).toFixed(2)}</span>`;
            row.insertCell(3).innerHTML = `<span class="currency-badge ${currencyClass}">${currency}</span>`;
            
            // 钱包地址 - 完整显示 + 复制按钮
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
        
        // 绑定复制按钮事件
        document.querySelectorAll('#withdrawalHistoryBody .copy-address-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const address = btn.dataset.address;
                navigator.clipboard.writeText(address).then(() => {
                    showToast('地址已复制！', 'success');
                }).catch(() => {
                    const textarea = document.createElement('textarea');
                    textarea.value = address;
                    document.body.appendChild(textarea);
                    textarea.select();
                    document.execCommand('copy');
                    textarea.remove();
                    showToast('地址已复制！', 'success');
                });
            });
        });
    }
}

async function clearWithdrawalHistory() {
    showConfirm('清空记录', '确定要清空所有提现记录吗？此操作不可恢复！', async () => {
        const { error } = await sb
            .from('withdrawals')
            .delete()
            .in('status', ['approved', 'rejected']);
        
        if (error) {
            showToast('清空失败: ' + error.message, 'error');
        } else {
            showToast('已清空所有提现记录', 'success');
            loadWithdrawalHistory();
        }
    });
}

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

window.loadWithdrawalsPage = loadWithdrawalsPage;