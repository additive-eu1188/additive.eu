// admin-orderpool.js - 订单池页面（使用自定义弹窗）
let poolSearchKeyword = '';
let allOrders = [];
let currentPage = 1;
const pageSize = 50;

async function loadOrderPoolPage() {
    const container = document.getElementById('page_orderpool');
    if (!container) return;
    container.innerHTML = `
        <div class="card">
            <div class="search-bar">
                <input type="text" id="poolSearchInput" class="search-input" placeholder="🔍 搜索订单号或酒店名...">
                <button id="poolSearchBtn" class="btn-primary"><i class="fas fa-search"></i> 搜索</button>
                <button id="poolRefreshBtn" class="btn-primary"><i class="fas fa-sync-alt"></i> 刷新</button>
                <button id="addOrderBtn" class="success"><i class="fas fa-plus"></i> 添加订单</button>
            </div>
            <div class="table-container">
                <table class="data-table">
                    <thead><tr><th>ID</th><th>订单号</th><th>酒店名称</th><th>价格</th><th>图片</th><th>状态</th><th>操作</th></tr></thead>
                    <tbody id="orderPoolTableBody"><tr><td colspan="7" class="loading">加载中... <i class="fas fa-spinner fa-spin"></i></td></tr></tbody>
                </table>
            </div>
            <div class="pagination" id="pagination"></div>
        </div>
    `;
    await loadAllOrdersFromDB();
    document.getElementById('poolSearchBtn')?.addEventListener('click', () => { poolSearchKeyword = document.getElementById('poolSearchInput').value; currentPage = 1; renderOrderPoolPage(); });
    document.getElementById('poolRefreshBtn')?.addEventListener('click', () => { document.getElementById('poolSearchInput').value = ''; poolSearchKeyword = ''; currentPage = 1; loadAllOrdersFromDB(); });
    document.getElementById('addOrderBtn')?.addEventListener('click', () => {
        document.getElementById('orderModalTitle').innerHTML = '添加订单';
        document.getElementById('orderCode').value = '';
        document.getElementById('hotelName').value = '';
        document.getElementById('price').value = '';
        document.getElementById('imageUrl').value = '';
        document.getElementById('status').value = 'available';
        document.getElementById('editId').value = '';
        document.getElementById('orderModal').classList.add('active');
    });
    document.getElementById('saveOrderBtn')?.addEventListener('click', saveOrder);
    document.getElementById('cancelOrderBtn')?.addEventListener('click', () => document.getElementById('orderModal').classList.remove('active'));
}

async function loadAllOrdersFromDB() {
    const tbody = document.getElementById('orderPoolTableBody');
    if (tbody) tbody.innerHTML = '<tr><td colspan="7" class="loading">加载中...</td></tr>';
    try {
        let allData = [];
        let from = 0;
        const batchSize = 1000;
        let hasMore = true;
        while (hasMore) {
            const { data, error } = await sb.from('orders_pool').select('*').order('id', { ascending: false }).range(from, from + batchSize - 1);
            if (error) throw error;
            if (data && data.length > 0) {
                allData = allData.concat(data);
                from += batchSize;
            }
            if (!data || data.length < batchSize) hasMore = false;
        }
        allOrders = allData;
        renderOrderPoolPage();
    } catch (e) {
        console.error(e);
        if (tbody) tbody.innerHTML = `<tr><td colspan="7">错误: ${e.message}</td></tr>`;
    }
}

function renderOrderPoolPage() {
    let filtered = allOrders;
    if (poolSearchKeyword) {
        const kw = poolSearchKeyword.toLowerCase();
        filtered = allOrders.filter(o => (o.order_code && o.order_code.toLowerCase().includes(kw)) || (o.accommodation_name && o.accommodation_name.toLowerCase().includes(kw)));
    }
    const totalPages = Math.ceil(filtered.length / pageSize);
    const start = (currentPage - 1) * pageSize;
    const pageOrders = filtered.slice(start, start + pageSize);
    const tbody = document.getElementById('orderPoolTableBody');
    if (tbody) {
        tbody.innerHTML = '';
        if (pageOrders.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7">暂无数据</td></tr>';
            return;
        }
        for (let o of pageOrders) {
            const row = tbody.insertRow();
            row.insertCell(0).innerText = o.id;
            row.insertCell(1).innerHTML = `<span class="badge">${o.order_code || '-'}</span>`;
            row.insertCell(2).innerText = o.accommodation_name || '-';
            row.insertCell(3).innerHTML = `<span class="text-gold">€${(o.price || 0).toFixed(2)}</span>`;
            row.insertCell(4).innerHTML = o.image_url ? `<img src="${o.image_url}" style="width:60px;height:45px;object-fit:cover;border-radius:8px;cursor:pointer;" onclick="window.open('${o.image_url}','_blank')">` : '-';
            row.insertCell(5).innerHTML = `<span class="${o.status === 'available' ? 'text-green' : 'text-red'}">${o.status || 'available'}</span>`;
            row.insertCell(6).innerHTML = `<button class="edit-order" data-id="${o.id}" style="background:#2f6b3a; padding:4px 8px; font-size:11px; margin-right:4px;">编辑</button><button class="delete-order" data-id="${o.id}" style="background:#7a2f2f; padding:4px 8px; font-size:11px;">删除</button>`;
        }
        document.querySelectorAll('.edit-order').forEach(btn => btn.addEventListener('click', () => {
            const order = allOrders.find(o => o.id == btn.dataset.id);
            if (order) {
                document.getElementById('orderCode').value = order.order_code || '';
                document.getElementById('hotelName').value = order.accommodation_name || '';
                document.getElementById('price').value = order.price || '';
                document.getElementById('imageUrl').value = order.image_url || '';
                document.getElementById('status').value = order.status || 'available';
                document.getElementById('editId').value = order.id;
                document.getElementById('orderModal').classList.add('active');
            }
        }));
        document.querySelectorAll('.delete-order').forEach(btn => btn.addEventListener('click', async () => {
            showConfirm('确认删除', '删除此订单？', async () => {
                await sb.from('orders_pool').delete().eq('id', parseInt(btn.dataset.id));
                loadAllOrdersFromDB();
                if (window.loadDashboardPage) window.loadDashboardPage(currentDays);
                showToast('已删除', 'success');
            });
        }));
    }
    const paginationDiv = document.getElementById('pagination');
    if (paginationDiv) {
        paginationDiv.innerHTML = '';
        if (totalPages > 1) {
            if (currentPage > 1) {
                const prev = document.createElement('button');
                prev.innerHTML = '上一页';
                prev.onclick = () => { currentPage--; renderOrderPoolPage(); };
                paginationDiv.appendChild(prev);
            }
            for (let i = Math.max(1, currentPage - 2); i <= Math.min(totalPages, currentPage + 2); i++) {
                const btn = document.createElement('button');
                btn.innerText = i;
                if (i === currentPage) btn.classList.add('current-page');
                btn.onclick = () => { currentPage = i; renderOrderPoolPage(); };
                paginationDiv.appendChild(btn);
            }
            if (currentPage < totalPages) {
                const next = document.createElement('button');
                next.innerHTML = '下一页';
                next.onclick = () => { currentPage++; renderOrderPoolPage(); };
                paginationDiv.appendChild(next);
            }
        }
    }
}

async function saveOrder() {
    const id = document.getElementById('editId').value;
    const orderCode = document.getElementById('orderCode').value.trim();
    const hotelName = document.getElementById('hotelName').value.trim();
    const price = parseFloat(document.getElementById('price').value);
    const imageUrl = document.getElementById('imageUrl').value.trim();
    const status = document.getElementById('status').value;
    if (!orderCode || !hotelName || isNaN(price) || price <= 0) {
        showToast('请填写完整的订单信息', 'error');
        return;
    }
    try {
        if (id) {
            await sb.from('orders_pool').update({ order_code: orderCode, accommodation_name: hotelName, price: price, image_url: imageUrl, status: status }).eq('id', parseInt(id));
            showToast('订单已更新', 'success');
        } else {
            await sb.from('orders_pool').insert([{ order_code: orderCode, accommodation_name: hotelName, price: price, image_url: imageUrl, status: status }]);
            showToast('订单已添加', 'success');
        }
        document.getElementById('orderModal').classList.remove('active');
        loadAllOrdersFromDB();
        if (window.loadDashboardPage) window.loadDashboardPage(currentDays);
    } catch (e) {
        showToast('保存失败: ' + e.message, 'error');
    }
}

window.loadOrderPoolPage = loadOrderPoolPage;