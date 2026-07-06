// admin-orderpool.js
let poolSearchKeyword = '';
let allOrders = [];
let currentPage = 1;
const pageSize = 50;
let totalCount = 0;

async function loadOrderPoolPage() {
    const container = document.getElementById('page_orderpool');
    if (!container) return;
    container.innerHTML = `
        <div class="card">
            <div class="withdraw-header" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; margin-bottom: 24px;">
                <h2 style="font-size: 18px; font-weight: 600; color: #d8e0f0; margin: 0;">
                    <i class="fas fa-hotel" style="color: #8892a8; margin-right: 10px;"></i>
                    Orders Pool
                </h2>
                <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                    <button id="addOrderBtn" class="success"><i class="fas fa-plus"></i> Add Order</button>
                    <button id="poolRefreshBtn" class="btn-primary"><i class="fas fa-sync-alt"></i> Refresh</button>
                </div>
            </div>

            <div class="stats-grid" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 24px;">
                <div class="stat-item" style="background: rgba(12, 16, 28, 0.6); border-radius: 16px; padding: 16px 20px; text-align: center; border: 1px solid rgba(255,255,255,0.04);">
                    <div class="label" style="font-size: 11px; color: #8892a8; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">Total Orders</div>
                    <div class="value" id="poolStatTotal" style="font-size: 28px; font-weight: 700; color: #ffffff;">0</div>
                </div>
                <div class="stat-item" style="background: rgba(12, 16, 28, 0.6); border-radius: 16px; padding: 16px 20px; text-align: center; border: 1px solid rgba(255,255,255,0.04);">
                    <div class="label" style="font-size: 11px; color: #8892a8; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">Available</div>
                    <div class="value" id="poolStatAvailable" style="font-size: 28px; font-weight: 700; color: #4ade80;">0</div>
                </div>
                <div class="stat-item" style="background: rgba(12, 16, 28, 0.6); border-radius: 16px; padding: 16px 20px; text-align: center; border: 1px solid rgba(255,255,255,0.04);">
                    <div class="label" style="font-size: 11px; color: #8892a8; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">Unavailable</div>
                    <div class="value" id="poolStatUnavailable" style="font-size: 28px; font-weight: 700; color: #e88080;">0</div>
                </div>
            </div>

            <div class="search-bar" style="display: flex; flex-wrap: wrap; gap: 10px; align-items: center; background: rgba(8, 12, 24, 0.5); border-radius: 16px; padding: 12px 16px; margin-bottom: 20px; border: 1px solid rgba(255,255,255,0.03);">
                <input type="text" id="poolSearchInput" class="search-input" placeholder="Search order code / hotel name..." style="flex: 1; min-width: 160px; background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.10); border-radius: 40px; padding: 8px 16px; color: #e6edf5; font-size: 13px; outline: none;">
                <select id="poolStatusFilter" style="min-width: 140px; flex-shrink: 0; background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.10); border-radius: 40px; padding: 8px 16px; color: #e6edf5; font-size: 13px; outline: none; cursor: pointer; font-family: 'Inter', sans-serif;">
                    <option value="">All Status</option>
                    <option value="available">Available</option>
                    <option value="unavailable">Unavailable</option>
                </select>
                <input type="number" id="poolMinPrice" placeholder="Min Price" style="width: 130px; background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.10); border-radius: 40px; padding: 8px 16px; color: #e6edf5; font-size: 13px; outline: none;">
                <input type="number" id="poolMaxPrice" placeholder="Max Price" style="width: 130px; background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.10); border-radius: 40px; padding: 8px 16px; color: #e6edf5; font-size: 13px; outline: none;">
                <button id="poolSearchBtn" class="btn-primary"><i class="fas fa-search"></i> Search</button>
                <button id="poolClearBtn" class="btn-primary"><i class="fas fa-times"></i> Clear</button>
            </div>

            <div class="table-container" style="max-height: 500px; overflow-y: auto; border-radius: 16px; border: 1px solid rgba(255,255,255,0.03);">
                <table class="data-table" style="width: 100%; border-collapse: collapse; font-size: 13px; min-width: 900px; table-layout: fixed;">
                    <thead>
                        <tr>
                            <th style="padding: 14px 14px; color: #a8b4d0; font-weight: 600; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid rgba(255,255,255,0.04); background: rgba(10,14,28,0.3); text-align: left; width: 60px;">ID</th>
                            <th style="padding: 14px 14px; color: #a8b4d0; font-weight: 600; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid rgba(255,255,255,0.04); background: rgba(10,14,28,0.3); text-align: left; width: 140px;">Order Code</th>
                            <th style="padding: 14px 14px; color: #a8b4d0; font-weight: 600; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid rgba(255,255,255,0.04); background: rgba(10,14,28,0.3); text-align: left; width: 200px;">Hotel Name</th>
                            <th style="padding: 14px 14px; color: #a8b4d0; font-weight: 600; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid rgba(255,255,255,0.04); background: rgba(10,14,28,0.3); text-align: left; width: 100px;">Price</th>
                            <th style="padding: 14px 14px; color: #a8b4d0; font-weight: 600; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid rgba(255,255,255,0.04); background: rgba(10,14,28,0.3); text-align: left; width: 120px;">Image</th>
                            <th style="padding: 14px 14px; color: #a8b4d0; font-weight: 600; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid rgba(255,255,255,0.04); background: rgba(10,14,28,0.3); text-align: left; width: 100px;">Status</th>
                            <th style="padding: 14px 14px; color: #a8b4d0; font-weight: 600; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid rgba(255,255,255,0.04); background: rgba(10,14,28,0.3); text-align: left; width: 180px;">Actions</th>
                        </tr>
                    </thead>
                    <tbody id="orderPoolTableBody">
                        <tr><td colspan="7" style="text-align:center; padding:30px; color:#6a7a9a;">Loading...</td></tr>
                    </tbody>
                </table>
            </div>

            <div id="pagination" style="display: flex; gap: 8px; justify-content: center; margin-top: 20px; flex-wrap: wrap; align-items: center;"></div>
        </div>
    `;

    // 样式
    const style = document.createElement('style');
    style.textContent = `
        #page_orderpool .status-badge-available { background: rgba(74, 222, 128, 0.10); color: #4ade80; padding: 2px 12px; border-radius: 40px; font-size: 11px; display: inline-block; }
        #page_orderpool .status-badge-unavailable { background: rgba(232, 128, 128, 0.10); color: #e88080; padding: 2px 12px; border-radius: 40px; font-size: 11px; display: inline-block; }
        #page_orderpool .btn-sm-action { padding: 4px 12px; font-size: 11px; border: none; border-radius: 40px; color: #fff; cursor: pointer; transition: 0.2s; margin-right: 4px; font-weight: 600; font-family: 'Inter', sans-serif; }
        #page_orderpool .btn-sm-action:hover { opacity: 0.85; }
        #page_orderpool .btn-edit { background: rgba(200, 176, 144, 0.15); color: #c8b090; }
        #page_orderpool .btn-edit:hover { background: rgba(200, 176, 144, 0.25); }
        #page_orderpool .btn-delete { background: rgba(232, 128, 128, 0.15); color: #e88080; }
        #page_orderpool .btn-delete:hover { background: rgba(232, 128, 128, 0.25); }
        #page_orderpool .pool-thumb { width: 50px; height: 38px; object-fit: cover; border-radius: 6px; cursor: pointer; border: 1px solid rgba(255,255,255,0.06); transition: 0.2s; }
        #page_orderpool .pool-thumb:hover { transform: scale(1.05); border-color: rgba(200,176,144,0.3); }
        #page_orderpool .pool-thumb-placeholder { width: 50px; height: 38px; border-radius: 6px; background: rgba(255,255,255,0.03); border: 1px dashed rgba(255,255,255,0.06); display: flex; align-items: center; justify-content: center; color: #4a5a72; font-size: 10px; }
        #page_orderpool .data-table td { padding: 8px 12px !important; }
        #pagination .page-btn { padding: 6px 14px; border-radius: 30px; border: 1px solid rgba(255,255,255,0.04); background: rgba(255,255,255,0.02); color: rgba(255,255,255,0.15); font-size: 12px; font-weight: 500; cursor: pointer; transition: 0.3s; font-family: 'Inter', sans-serif; min-width: 36px; text-align: center; }
        #pagination .page-btn:hover { border-color: rgba(214,178,94,0.06); color: rgba(255,255,255,0.25); }
        #pagination .page-btn.active { background: rgba(214,178,94,0.06); color: #c8b090; border-color: rgba(214,178,94,0.06); }
        #pagination .page-btn:disabled { opacity: 0.2; cursor: not-allowed; }
        #pagination .page-info { font-size: 11px; color: rgba(255,255,255,0.12); padding: 0 8px; }
        @media (max-width: 768px) {
            #page_orderpool .stats-grid { grid-template-columns: repeat(2, 1fr) !important; }
            #page_orderpool .search-bar { flex-direction: column; align-items: stretch; }
            #page_orderpool .search-bar input,
            #page_orderpool .search-bar select { width: 100% !important; min-width: unset; flex: 1 1 auto !important; }
            #page_orderpool .data-table { min-width: 700px; }
        }
    `;
    document.head.appendChild(style);

    // 绑定事件
    document.getElementById('poolSearchBtn')?.addEventListener('click', function() {
        poolSearchKeyword = document.getElementById('poolSearchInput').value.trim();
        currentPage = 1;
        loadAllOrdersFromDB();
    });
    document.getElementById('poolClearBtn')?.addEventListener('click', function() {
        document.getElementById('poolSearchInput').value = '';
        document.getElementById('poolStatusFilter').value = '';
        document.getElementById('poolMinPrice').value = '';
        document.getElementById('poolMaxPrice').value = '';
        poolSearchKeyword = '';
        currentPage = 1;
        loadAllOrdersFromDB();
    });
    document.getElementById('poolRefreshBtn')?.addEventListener('click', function() {
        loadAllOrdersFromDB();
    });
    document.getElementById('poolSearchInput')?.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            poolSearchKeyword = document.getElementById('poolSearchInput').value.trim();
            currentPage = 1;
            loadAllOrdersFromDB();
        }
    });
    document.getElementById('addOrderBtn')?.addEventListener('click', openAddOrderModal);
    document.getElementById('saveOrderBtn')?.addEventListener('click', saveOrder);
    document.getElementById('cancelOrderBtn')?.addEventListener('click', function() {
        document.getElementById('orderModal').classList.remove('active');
    });

    await loadAllOrdersFromDB();
}

async function loadAllOrdersFromDB() {
    const tbody = document.getElementById('orderPoolTableBody');
    if (tbody) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding:30px; color:#6a7a9a;"><i class="fas fa-spinner fa-spin"></i> Loading...</td></tr>';
    }

    try {
        const keyword = document.getElementById('poolSearchInput')?.value.trim() || '';
        const statusFilter = document.getElementById('poolStatusFilter')?.value || '';
        const minPrice = parseFloat(document.getElementById('poolMinPrice')?.value) || 0;
        const maxPrice = parseFloat(document.getElementById('poolMaxPrice')?.value) || Infinity;

        // 统计
        let countQuery = sb.from('orders_pool').select('*', { count: 'exact', head: true });
        if (keyword) countQuery = countQuery.or(`order_code.ilike.%${keyword}%,accommodation_name.ilike.%${keyword}%`);
        if (statusFilter) countQuery = countQuery.eq('status', statusFilter);
        if (minPrice > 0) countQuery = countQuery.gte('price', minPrice);
        if (maxPrice < Infinity) countQuery = countQuery.lte('price', maxPrice);
        const { count: total } = await countQuery;
        totalCount = total || 0;

        let availQuery = sb.from('orders_pool').select('*', { count: 'exact', head: true }).eq('status', 'available');
        let unavailQuery = sb.from('orders_pool').select('*', { count: 'exact', head: true }).eq('status', 'unavailable');
        if (keyword) {
            availQuery = availQuery.or(`order_code.ilike.%${keyword}%,accommodation_name.ilike.%${keyword}%`);
            unavailQuery = unavailQuery.or(`order_code.ilike.%${keyword}%,accommodation_name.ilike.%${keyword}%`);
        }
        if (minPrice > 0) {
            availQuery = availQuery.gte('price', minPrice);
            unavailQuery = unavailQuery.gte('price', minPrice);
        }
        if (maxPrice < Infinity) {
            availQuery = availQuery.lte('price', maxPrice);
            unavailQuery = unavailQuery.lte('price', maxPrice);
        }
        const [availResult, unavailResult] = await Promise.all([availQuery, unavailQuery]);

        document.getElementById('poolStatTotal').innerText = totalCount;
        document.getElementById('poolStatAvailable').innerText = availResult.count || 0;
        document.getElementById('poolStatUnavailable').innerText = unavailResult.count || 0;

        // 分页数据
        let query = sb.from('orders_pool').select('*');
        if (keyword) query = query.or(`order_code.ilike.%${keyword}%,accommodation_name.ilike.%${keyword}%`);
        if (statusFilter) query = query.eq('status', statusFilter);
        if (minPrice > 0) query = query.gte('price', minPrice);
        if (maxPrice < Infinity) query = query.lte('price', maxPrice);

        const from = (currentPage - 1) * pageSize;
        const to = from + pageSize - 1;

        const { data, error } = await query
            .order('id', { ascending: false })
            .range(from, to);

        if (error) throw error;

        allOrders = data || [];
        renderOrderPoolPage();

    } catch (e) {
        console.error('加载订单失败:', e);
        if (tbody) {
            tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:30px; color:#ff8888;">加载失败: ${escapeHtml(e.message)}</td></tr>`;
        }
    }
}

function renderOrderPoolPage() {
    const tbody = document.getElementById('orderPoolTableBody');
    if (!tbody) return;

    if (allOrders.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding:30px; color:#6a7a9a;">No orders found</td></tr>';
        renderPagination();
        return;
    }

    tbody.innerHTML = '';

    for (const order of allOrders) {
        const row = tbody.insertRow();
        const statusClass = order.status === 'available' ? 'status-badge-available' : 'status-badge-unavailable';
        const statusText = order.status === 'available' ? 'Available' : 'Unavailable';

        row.insertCell(0).innerHTML = `<span style="font-size:12px; color:#6a7a92;">${order.id}</span>`;
        row.insertCell(1).innerHTML = `<span class="badge" style="background: rgba(255,255,255,0.08); padding: 2px 12px; border-radius: 20px; font-size: 11px; color: #c8d2e8; border: 1px solid rgba(255,255,255,0.06);">${escapeHtml(order.order_code || '-')}</span>`;
        
        const nameCell = row.insertCell(2);
        nameCell.style.fontWeight = '500';
        nameCell.style.color = '#d8e0f0';
        nameCell.style.fontSize = '13px';
        nameCell.textContent = order.accommodation_name || '-';

        row.insertCell(3).innerHTML = `<span style="font-weight:700; color:#c8b090; font-size:15px;">€${(order.price || 0).toFixed(2)}</span>`;

        let imageHtml = '';
        if (order.image_url) {
            imageHtml = `<img src="${order.image_url}" class="pool-thumb" onclick="window.open('${order.image_url}','_blank')" onerror="this.outerHTML='<div class=\\'pool-thumb-placeholder\\'><i class=\\'fas fa-image\\'></i></div>'">`;
        } else {
            imageHtml = `<div class="pool-thumb-placeholder"><i class="fas fa-image"></i></div>`;
        }
        row.insertCell(4).innerHTML = imageHtml;
        row.insertCell(5).innerHTML = `<span class="${statusClass}">${statusText}</span>`;
        row.insertCell(6).innerHTML = `
            <div style="display: flex; gap: 4px; flex-wrap: nowrap; align-items: center;">
                <button class="btn-sm-action btn-edit edit-order" data-id="${order.id}" style="white-space:nowrap; font-size:10px; padding:4px 12px;">
                    <i class="fas fa-edit"></i> Edit
                </button>
                <button class="btn-sm-action btn-delete delete-order" data-id="${order.id}" style="white-space:nowrap; font-size:10px; padding:4px 12px;">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </div>
        `;
    }

    document.querySelectorAll('.edit-order').forEach(function(btn) {
        btn.addEventListener('click', function() {
            const order = allOrders.find(function(o) { return o.id == this.dataset.id; }.bind(this));
            if (order) {
                openEditOrderModal(order);
            }
        });
    });

    document.querySelectorAll('.delete-order').forEach(function(btn) {
        btn.addEventListener('click', function() {
            const id = parseInt(this.dataset.id);
            showConfirm('Confirm Delete', 'Are you sure you want to delete this order?', async function() {
                await sb.from('orders_pool').delete().eq('id', id);
                await loadAllOrdersFromDB();
                if (window.loadDashboardPage) window.loadDashboardPage(currentDays);
                showToast('Order deleted', 'success');
            });
        });
    });

    renderPagination();
}

function renderPagination() {
    const container = document.getElementById('pagination');
    if (!container) return;

    const totalPages = Math.ceil(totalCount / pageSize);
    container.innerHTML = '';

    if (totalPages <= 1) return;

    // 上一页
    const prev = document.createElement('button');
    prev.className = 'page-btn';
    prev.innerHTML = '上一页';
    prev.disabled = currentPage <= 1;
    prev.onclick = function() {
        if (currentPage > 1) {
            currentPage--;
            loadAllOrdersFromDB();
        }
    };
    container.appendChild(prev);

    // 页码
    const start = Math.max(1, currentPage - 2);
    const end = Math.min(totalPages, currentPage + 2);

    if (start > 1) {
        const btn = document.createElement('button');
        btn.className = 'page-btn';
        btn.textContent = '1';
        btn.onclick = function() {
            currentPage = 1;
            loadAllOrdersFromDB();
        };
        container.appendChild(btn);
        if (start > 2) {
            const dot = document.createElement('span');
            dot.textContent = '…';
            dot.style.cssText = 'color: #4a5a72; padding: 0 4px;';
            container.appendChild(dot);
        }
    }

    for (let i = start; i <= end; i++) {
        const btn = document.createElement('button');
        btn.className = 'page-btn' + (i === currentPage ? ' active' : '');
        btn.textContent = i;
        btn.onclick = function(page) {
            return function() {
                currentPage = page;
                loadAllOrdersFromDB();
            };
        }(i);
        container.appendChild(btn);
    }

    if (end < totalPages) {
        if (end < totalPages - 1) {
            const dot = document.createElement('span');
            dot.textContent = '…';
            dot.style.cssText = 'color: #4a5a72; padding: 0 4px;';
            container.appendChild(dot);
        }
        const btn = document.createElement('button');
        btn.className = 'page-btn';
        btn.textContent = totalPages;
        btn.onclick = function() {
            currentPage = totalPages;
            loadAllOrdersFromDB();
        };
        container.appendChild(btn);
    }

    // 下一页
    const next = document.createElement('button');
    next.className = 'page-btn';
    next.innerHTML = '下一页';
    next.disabled = currentPage >= totalPages;
    next.onclick = function() {
        if (currentPage < totalPages) {
            currentPage++;
            loadAllOrdersFromDB();
        }
    };
    container.appendChild(next);

    // 信息
    const info = document.createElement('span');
    info.className = 'page-info';
    const from = (currentPage - 1) * pageSize + 1;
    const to = Math.min(currentPage * pageSize, totalCount);
    info.textContent = from + '-' + to + ' of ' + totalCount;
    container.appendChild(info);
}

function openAddOrderModal() {
    document.getElementById('orderModalTitle').innerHTML = 'Add Order';
    document.getElementById('orderCode').value = '';
    document.getElementById('hotelName').value = '';
    document.getElementById('price').value = '';
    document.getElementById('imageUrl').value = '';
    document.getElementById('status').value = 'available';
    document.getElementById('editId').value = '';
    document.getElementById('orderModal').classList.add('active');
}

function openEditOrderModal(order) {
    document.getElementById('orderModalTitle').innerHTML = 'Edit Order';
    document.getElementById('orderCode').value = order.order_code || '';
    document.getElementById('hotelName').value = order.accommodation_name || '';
    document.getElementById('price').value = order.price || '';
    document.getElementById('imageUrl').value = order.image_url || '';
    document.getElementById('status').value = order.status || 'available';
    document.getElementById('editId').value = order.id;
    document.getElementById('orderModal').classList.add('active');
}

async function saveOrder() {
    const id = document.getElementById('editId').value;
    const orderCode = document.getElementById('orderCode').value.trim();
    const hotelName = document.getElementById('hotelName').value.trim();
    const price = parseFloat(document.getElementById('price').value);
    const imageUrl = document.getElementById('imageUrl').value.trim();
    const status = document.getElementById('status').value;

    if (!orderCode || !hotelName || isNaN(price) || price <= 0) {
        showToast('Please fill in all required fields', 'error');
        return;
    }

    try {
        if (id) {
            await sb.from('orders_pool').update({
                order_code: orderCode,
                accommodation_name: hotelName,
                price: price,
                image_url: imageUrl,
                status: status
            }).eq('id', parseInt(id));
            showToast('Order updated successfully', 'success');
        } else {
            await sb.from('orders_pool').insert([{
                order_code: orderCode,
                accommodation_name: hotelName,
                price: price,
                image_url: imageUrl,
                status: status
            }]);
            showToast('Order added successfully', 'success');
        }
        document.getElementById('orderModal').classList.remove('active');
        currentPage = 1;
        await loadAllOrdersFromDB();
        if (window.loadDashboardPage) window.loadDashboardPage(currentDays);
    } catch (e) {
        showToast('Save failed: ' + e.message, 'error');
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

window.loadOrderPoolPage = loadOrderPoolPage;