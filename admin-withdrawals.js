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
            <div class="table-container">
                <table class="data-table">
                    <thead><tr><th>UID</th><th>用户名</th><th>金额</th><th>钱包地址</th><th>申请时间</th><th>操作</th></tr></thead>
                    <tbody id="withdrawalsTableBody"></tbody>
                </table>
            </div>
        </div>
    `;
    await loadWithdrawals();
    document.getElementById('refreshWithdrawalsBtn')?.addEventListener('click', () => { loadWithdrawals(); if (window.loadDashboardPage) window.loadDashboardPage(currentDays); });
}

async function loadWithdrawals() {
    const { data: wd } = await sb.from('withdrawals').select('*').eq('status', 'pending');
    const tbody = document.getElementById('withdrawalsTableBody');
    if (tbody) {
        tbody.innerHTML = '';
        for (let w of wd || []) {
            const row = tbody.insertRow();
            row.insertCell(0).innerHTML = `<span class="badge">${w.uid}</span>`;
            row.insertCell(1).innerText = w.username;
            row.insertCell(2).innerHTML = `<span class="text-gold">€${(w.amount || 0).toFixed(2)}</span>`;
            row.insertCell(3).innerText = w.wallet_address || '-';
            row.insertCell(4).innerText = new Date(w.request_date).toLocaleString();
            row.insertCell(5).innerHTML = `<button class="approve-withdraw" data-id="${w.id}" data-uid="${w.uid}" data-amt="${w.amount}" style="background:#2f6b3a; padding:4px 10px; font-size:11px; margin-right:4px;">批准</button><button class="reject-withdraw" data-id="${w.id}" data-uid="${w.uid}" data-amt="${w.amount}" style="background:#7a2f2f; padding:4px 10px; font-size:11px;">拒绝</button>`;
        }
        document.querySelectorAll('.approve-withdraw').forEach(btn => btn.addEventListener('click', async () => {
            showConfirm('批准提现', `批准 €${parseFloat(btn.dataset.amt)} 提现？`, async () => {
                await sb.from('withdrawals').update({ status: 'approved' }).eq('id', parseInt(btn.dataset.id));
                loadWithdrawals();
                if (window.loadDashboardPage) window.loadDashboardPage(currentDays);
                showToast('已批准', 'success');
            });
        }));
        document.querySelectorAll('.reject-withdraw').forEach(btn => btn.addEventListener('click', async () => {
            showConfirm('拒绝提现', '拒绝该提现？金额将退回用户账户', async () => {
                const { data: user } = await sb.from('users').select('balance').eq('uid', btn.dataset.uid).single();
                await sb.from('users').update({ balance: (user.balance || 0) + parseFloat(btn.dataset.amt) }).eq('uid', btn.dataset.uid);
                await sb.from('withdrawals').update({ status: 'rejected' }).eq('id', parseInt(btn.dataset.id));
                loadWithdrawals();
                if (window.loadDashboardPage) window.loadDashboardPage(currentDays);
                showToast('已拒绝，金额已退回', 'success');
            });
        }));
    }
}

window.loadWithdrawalsPage = loadWithdrawalsPage;