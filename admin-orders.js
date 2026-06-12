// admin-orders.js - 订单记录页面（使用自定义弹窗）
let orderSearchKeyword = '';
let currentQueryUid = null;

async function loadOrdersPage() {
    const container = document.getElementById('page_orders');
    if (!container) return;
    container.innerHTML = `
        <div class="card">
            <div class="search-bar" style="justify-content: space-between;">
                <h3 style="margin:0;"><i class="fas fa-history"></i> 用户订单历史</h3>
                <div style="display: flex; gap: 10px;">
                    <input type="text" id="searchOrderUid" placeholder="🔍 搜索 UID 或用户名" class="search-input" style="width: 200px;">
                    <button id="searchOrderBtn" class="btn-primary"><i class="fas fa-search"></i> 搜索</button>
                    <button id="clearOrderSearchBtn" class="btn-primary"><i class="fas fa-times"></i> 清除</button>
                    <button id="refreshOrdersListBtn" class="btn-primary"><i class="fas fa-sync-alt"></i> 刷新</button>
                </div>
            </div>
            <div class="table-container" style="max-height: 300px;">
                <table class="data-table">
                    <thead><tr><th>UID</th><th>用户名</th><th>操作</th></tr></thead>
                    <tbody id="userListForOrders"></tbody>
                </table>
            </div>
            <div style="margin-top: 20px;">
                <h4>订单记录详情</h4>
                <div class="table-container" style="max-height: 300px;">
                    <table class="data-table">
                        <thead><tr><th>订单号</th><th>酒店名</th><th>价格</th><th>佣金</th><th>日期</th></tr></thead>
                        <tbody id="ordersDetailTableBody"><tr><td colspan="5" style="text-align:center;">点击查询查看详情</td></tr>
                    </table>
                </div>
            </div>
        </div>
    `;
    await loadUserListForOrders();
    document.getElementById('searchOrderBtn')?.addEventListener('click', () => { orderSearchKeyword = document.getElementById('searchOrderUid').value.trim(); loadUserListForOrders(); });
    document.getElementById('clearOrderSearchBtn')?.addEventListener('click', () => { document.getElementById('searchOrderUid').value = ''; orderSearchKeyword = ''; loadUserListForOrders(); });
    document.getElementById('refreshOrdersListBtn')?.addEventListener('click', () => { loadUserListForOrders(); if (currentQueryUid) queryUserOrders(currentQueryUid, ''); });
}

async function loadUserListForOrders() {
    let query = sb.from('users').select('uid, username').order('created_at', { ascending: false });
    if (orderSearchKeyword) query = query.or(`uid.ilike.%${orderSearchKeyword}%,username.ilike.%${orderSearchKeyword}%`);
    const { data: users } = await query;
    const tbody = document.getElementById('userListForOrders');
    if (tbody && users) {
        tbody.innerHTML = '';
        for (let u of users) {
            const row = tbody.insertRow();
            row.insertCell(0).innerHTML = `<span class="badge">${u.uid}</span>`;
            row.insertCell(1).innerText = u.username;
            row.insertCell(2).innerHTML = `<button class="query-orders-btn" data-uid="${u.uid}" data-name="${u.username}" class="btn-primary" style="padding:4px 12px; font-size:12px;"><i class="fas fa-search"></i> 查询订单记录</button>`;
        }
        document.querySelectorAll('.query-orders-btn').forEach(btn => btn.addEventListener('click', () => queryUserOrders(btn.dataset.uid, btn.dataset.name)));
    }
}

async function queryUserOrders(uid, username) {
    currentQueryUid = uid;
    const { data: orders } = await sb.from('order_history').select('*').eq('uid', uid).order('date', { ascending: false });
    const tbody = document.getElementById('ordersDetailTableBody');
    if (tbody) {
        if (!orders || orders.length === 0) {
            tbody.innerHTML = `<td><td colspan="5" style="text-align:center;">用户 ${username} 暂无订单记录</td></tr>`;
            return;
        }
        tbody.innerHTML = '';
        for (let o of orders) {
            const row = tbody.insertRow();
            row.insertCell(0).innerText = o.order_code || '-';
            row.insertCell(1).innerText = o.accommodation_name || '-';
            row.insertCell(2).innerHTML = `<span class="text-gold">€${(o.price || 0).toFixed(2)}</span>`;
            row.insertCell(3).innerHTML = `<span class="text-green">€${(o.commission || 0).toFixed(2)}</span>`;
            row.insertCell(4).innerText = new Date(o.date).toLocaleString();
        }
    }
}

window.loadOrdersPage = loadOrdersPage;