// admin-setorders.js - 设置订单页面（优化版）
let setordersSearchKeyword = '';
let selectedAdvancedOrdersList = [];
let currentSetUser = null;

async function loadSetordersPage() {
    const container = document.getElementById('page_setorders');
    if (!container) return;
    container.innerHTML = `
        <div class="card">
            <div class="search-bar" style="justify-content: space-between;">
                <h3><i class="fas fa-cog"></i> 设置订单</h3>
                <button id="backToUserList" class="btn-primary" style="display:none;"><i class="fas fa-arrow-left"></i> 返回用户列表</button>
            </div>
            <div id="setordersUserSearch">
                <div class="search-bar">
                    <input type="text" id="setordersSearchUid" placeholder="🔍 输入 UID 或用户名" style="flex:1;" class="search-input">
                    <button id="setordersSearchBtn" class="btn-primary"><i class="fas fa-search"></i> 搜索用户</button>
                </div>
                <div id="setordersUserList" class="table-container" style="max-height: 300px;">
                    <table class="data-table">
                        <thead><tr><th>UID</th><th>用户名</th><th>操作</th></tr></thead>
                        <tbody id="setordersUserTableBody"></tbody>
                    </table>
                </div>
            </div>
            <div id="setordersMain" style="display: none;">
                <div class="uid-header" style="background: rgba(74,124,255,0.1); padding: 15px 20px; border-radius: 12px; margin-bottom: 20px;">
                    <div style="font-size: 14px; color: #8a9abb;">当前用户</div>
                    <div style="font-size: 20px; font-weight: 700; color: #4a7cff;"><span id="selectedUidDisplay"></span> - <span id="selectedUsernameDisplay"></span></div>
                </div>
                <div id="userTriggerOrdersList" style="margin-bottom: 20px;">
                    <h4 style="margin-bottom: 12px; color: #4a7cff;"><i class="fas fa-list"></i> 已设置的触发订单</h4>
                    <div id="triggerOrdersContainer" style="max-height: 300px; overflow-y: auto;"></div>
                </div>
                <div class="history-tabs" style="display: flex; gap: 8px; margin-bottom: 20px; border-bottom: 1px solid rgba(74,124,255,0.2); padding-bottom: 12px;">
                    <button class="tab-btn active" data-setorder-tab="advanced" style="background: none; border: none; padding: 8px 20px; border-radius: 20px; cursor: pointer; transition: 0.2s;"><i class="fas fa-crown"></i> 高级订单</button>
                    <button class="tab-btn" data-setorder-tab="card" style="background: none; border: none; padding: 8px 20px; border-radius: 20px; cursor: pointer; transition: 0.2s;"><i class="fas fa-gift"></i> 卡牌奖励</button>
                    <button class="tab-btn" data-setorder-tab="cardorder" style="background: none; border: none; padding: 8px 20px; border-radius: 20px; cursor: pointer; transition: 0.2s;"><i class="fas fa-ticket-alt"></i> 卡牌订单</button>
                </div>
                
                <!-- 高级订单面板 -->
                <div id="advancedPanel" style="background: rgba(15, 25, 40, 0.5); border-radius: 16px; padding: 20px;">
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 20px;">
                        <div>
                            <label style="display: block; font-size: 12px; color: #8a9abb; margin-bottom: 5px;"><i class="fas fa-hashtag"></i> 触发订单数</label>
                            <input type="number" id="advancedOrderCount" value="1" class="search-input" style="width: 100%;" placeholder="例如: 3">
                            <div style="font-size: 10px; color: #6a7a9a; margin-top: 4px;">用户完成第N单后触发</div>
                        </div>
                        <div>
                            <label style="display: block; font-size: 12px; color: #8a9abb; margin-bottom: 5px;"><i class="fas fa-euro-sign"></i> 目标价格 (€)</label>
                            <input type="number" id="advancedTargetPrice" step="0.01" class="search-input" style="width: 100%;" placeholder="例如: 50">
                            <div style="font-size: 10px; color: #6a7a9a; margin-top: 4px;">匹配相近价格的订单</div>
                        </div>
                    </div>
                    <button id="advancedSearchOrderBtn" class="btn-primary" style="width: 100%; margin-bottom: 20px;"><i class="fas fa-search"></i> 搜索匹配订单</button>
                    <div id="advancedOrdersList" style="max-height: 300px; overflow-y: auto; margin-bottom: 15px;"></div>
                    <div id="advancedActionBtns" style="display: none; gap: 12px;">
                        <button id="advancedConfirmBtn" class="success" style="flex: 1; padding: 10px;"><i class="fas fa-check"></i> 确认触发</button>
                        <button id="advancedCancelBtn" class="danger" style="flex: 1; padding: 10px;"><i class="fas fa-times"></i> 取消</button>
                    </div>
                </div>
                
                <!-- 卡牌奖励面板 -->
                <div id="cardPanel" style="display: none; background: rgba(15, 25, 40, 0.5); border-radius: 16px; padding: 20px;">
                    <div style="margin-bottom: 20px;">
                        <label style="display: block; font-size: 12px; color: #8a9abb; margin-bottom: 5px;"><i class="fas fa-hashtag"></i> 触发订单数</label>
                        <input type="number" id="cardOrderCount" class="search-input" style="width: 100%;" placeholder="例如: 5">
                        <div style="font-size: 10px; color: #6a7a9a; margin-top: 4px;">用户完成第N单后触发卡牌奖励</div>
                    </div>
                    <div style="margin-bottom: 20px;">
                        <label style="display: block; font-size: 12px; color: #8a9abb; margin-bottom: 5px;"><i class="fas fa-euro-sign"></i> 奖励金额 (€)</label>
                        <input type="number" id="cardTargetPrice" step="0.01" class="search-input" style="width: 100%;" placeholder="例如: 10">
                        <div style="font-size: 10px; color: #6a7a9a; margin-top: 4px;">用户将获得此金额作为现金奖励</div>
                    </div>
                    <button id="addCardRewardBtn" class="success" style="width: 100%; padding: 12px;"><i class="fas fa-plus-circle"></i> 添加卡牌奖励</button>
                </div>
                
                <!-- 卡牌订单面板 -->
                <div id="cardorderPanel" style="display: none; background: rgba(15, 25, 40, 0.5); border-radius: 16px; padding: 20px;">
                    <div style="margin-bottom: 20px;">
                        <label style="display: block; font-size: 12px; color: #8a9abb; margin-bottom: 5px;"><i class="fas fa-hashtag"></i> 触发订单数</label>
                        <input type="number" id="cardorderOrderCount" class="search-input" style="width: 100%;" placeholder="例如: 3">
                        <div style="font-size: 10px; color: #6a7a9a; margin-top: 4px;">用户完成第N单后触发卡牌订单</div>
                    </div>
                    <div style="margin-bottom: 20px;">
                        <label style="display: block; font-size: 12px; color: #8a9abb; margin-bottom: 5px;"><i class="fas fa-euro-sign"></i> 订单价格 (€)</label>
                        <input type="number" id="cardorderTargetPrice" step="0.01" class="search-input" style="width: 100%;" placeholder="例如: 50">
                        <div style="font-size: 10px; color: #6a7a9a; margin-top: 4px;">订单价格，完成后返还并获得15%佣金</div>
                    </div>
                    <button id="addCardOrderBtn" class="success" style="width: 100%; padding: 12px;"><i class="fas fa-plus-circle"></i> 添加卡牌订单</button>
                </div>
            </div>
        </div>
    `;
    
    // 添加样式
    const style = document.createElement('style');
    style.textContent = `
        .tab-btn.active {
            background: rgba(74,124,255,0.2) !important;
            color: #4a7cff !important;
        }
        .tab-btn:hover {
            background: rgba(74,124,255,0.1) !important;
        }
        .order-item-card {
            background: rgba(15, 25, 40, 0.6);
            border-radius: 12px;
            padding: 12px 15px;
            margin-bottom: 10px;
            display: flex;
            align-items: center;
            gap: 12px;
            transition: 0.2s;
            border: 1px solid rgba(74,124,255,0.15);
        }
        .order-item-card:hover {
            background: rgba(74,124,255,0.08);
            border-color: rgba(74,124,255,0.3);
        }
        .order-item-card input[type="checkbox"] {
            width: 18px;
            height: 18px;
            cursor: pointer;
            accent-color: #4a7cff;
        }
        .order-item-card .order-info {
            flex: 1;
        }
        .order-item-card .order-name {
            font-size: 14px;
            font-weight: 500;
            color: #fff;
            margin-bottom: 4px;
        }
        .order-item-card .order-price {
            font-size: 12px;
            color: #ffdd99;
        }
        .trigger-order-item {
            background: rgba(15, 25, 40, 0.6);
            border-radius: 12px;
            padding: 15px;
            margin-bottom: 10px;
            border: 1px solid rgba(74,124,255,0.15);
            transition: 0.2s;
        }
        .trigger-order-item:hover {
            background: rgba(74,124,255,0.05);
            border-color: rgba(74,124,255,0.3);
        }
        .trigger-order-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 10px;
        }
        .trigger-order-type {
            font-weight: 700;
            color: #4a7cff;
        }
        .trigger-order-badge {
            background: rgba(74,124,255,0.15);
            padding: 2px 8px;
            border-radius: 12px;
            font-size: 11px;
            color: #8a9abb;
        }
        .trigger-order-status {
            background: #ffaa33;
            padding: 2px 8px;
            border-radius: 12px;
            font-size: 10px;
            color: #0a0806;
        }
        .trigger-order-status.deducted {
            background: #ff5a5a;
            color: #fff;
        }
        .trigger-order-status.completed {
            background: #2ed15a;
            color: #0a0806;
        }
        .trigger-order-detail {
            font-size: 12px;
            color: #8a9abb;
            margin-top: 8px;
        }
        .trigger-order-time {
            font-size: 10px;
            color: #6a7a9a;
            margin-top: 5px;
        }
        .delete-trigger-btn {
            background: #7a2f2f;
            border: none;
            padding: 5px 12px;
            border-radius: 8px;
            color: #fff;
            cursor: pointer;
            transition: 0.2s;
        }
        .delete-trigger-btn:hover {
            background: #9b3f3f;
        }
    `;
    document.head.appendChild(style);
    
    await loadSetordersUserList();
    document.getElementById('setordersSearchBtn')?.addEventListener('click', () => { setordersSearchKeyword = document.getElementById('setordersSearchUid').value.trim(); loadSetordersUserList(); });
    document.getElementById('backToUserList')?.addEventListener('click', () => { document.getElementById('setordersUserSearch').style.display = 'block'; document.getElementById('setordersMain').style.display = 'none'; currentSetUser = null; });
    
    document.querySelectorAll('[data-setorder-tab]').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('[data-setorder-tab]').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const tab = btn.dataset.setorderTab;
            document.getElementById('advancedPanel').style.display = tab === 'advanced' ? 'block' : 'none';
            document.getElementById('cardPanel').style.display = tab === 'card' ? 'block' : 'none';
            document.getElementById('cardorderPanel').style.display = tab === 'cardorder' ? 'block' : 'none';
        });
    });
    
    document.getElementById('advancedSearchOrderBtn')?.addEventListener('click', advancedSearchOrder);
    document.getElementById('advancedConfirmBtn')?.addEventListener('click', confirmAdvancedOrder);
    document.getElementById('advancedCancelBtn')?.addEventListener('click', () => { selectedAdvancedOrdersList = []; document.getElementById('advancedOrdersList').innerHTML = ''; document.getElementById('advancedActionBtns').style.display = 'none'; });
    document.getElementById('addCardRewardBtn')?.addEventListener('click', addCardReward);
    document.getElementById('addCardOrderBtn')?.addEventListener('click', addCardOrder);
}

async function loadSetordersUserList() {
    let query = sb.from('users').select('uid, username').order('created_at', { ascending: false });
    if (setordersSearchKeyword) query = query.or(`uid.ilike.%${setordersSearchKeyword}%,username.ilike.%${setordersSearchKeyword}%`);
    const { data: users } = await query;
    const tbody = document.getElementById('setordersUserTableBody');
    if (tbody && users) {
        tbody.innerHTML = '';
        for (let u of users) {
            const row = tbody.insertRow();
            row.insertCell(0).innerHTML = `<span class="badge">${u.uid}</span>`;
            row.insertCell(1).innerText = u.username;
            row.insertCell(2).innerHTML = `<button class="setorder-select-btn" data-uid="${u.uid}" data-name="${u.username}" class="btn-primary" style="padding:6px 15px; font-size:12px;"><i class="fas fa-cog"></i> 设置订单</button>`;
        }
        document.querySelectorAll('.setorder-select-btn').forEach(btn => btn.addEventListener('click', () => selectUserForSetOrder(btn.dataset.uid, btn.dataset.name)));
    }
}

async function selectUserForSetOrder(uid, username) {
    currentSetUser = { uid, username };
    document.getElementById('selectedUidDisplay').innerText = uid;
    document.getElementById('selectedUsernameDisplay').innerText = username;
    document.getElementById('setordersUserSearch').style.display = 'none';
    document.getElementById('setordersMain').style.display = 'block';
    await loadUserTriggerOrders(uid);
}

async function loadUserTriggerOrders(uid) {
    const container = document.getElementById('triggerOrdersContainer');
    if (!container) return;
    container.innerHTML = '<div style="text-align: center; padding: 20px; color: #aaa;"><i class="fas fa-spinner fa-spin"></i> 加载中...</div>';
    const { data: orders, error } = await sb.from('user_trigger_orders').select('*').eq('uid', uid).in('status', ['pending', 'deducted']).order('trigger_order_number', { ascending: true });
    if (error || !orders || orders.length === 0) {
        container.innerHTML = '<div style="text-align: center; padding: 20px; color: #aaa;"><i class="fas fa-inbox"></i><br>暂无已设置的触发订单</div>';
        return;
    }
    container.innerHTML = '';
    for (let order of orders) {
        const orderDiv = document.createElement('div');
        orderDiv.className = 'trigger-order-item';
        
        let orderTypeText = '', extraInfo = '', statusClass = '';
        if (order.order_type === 'advanced') {
            orderTypeText = '高级订单';
            extraInfo = `匹配订单: ${order.matched_order_name || '-'} (€${parseFloat(order.matched_price || 0).toFixed(2)}) | 佣金: 5%`;
        } else if (order.order_type === 'card_reward') {
            orderTypeText = '卡牌奖励';
            extraInfo = `奖励金额: €${parseFloat(order.target_price || 0).toFixed(2)} (直接加到余额)`;
        } else if (order.order_type === 'card_order') {
            orderTypeText = '卡牌订单';
            extraInfo = `订单价格: €${parseFloat(order.target_price || 0).toFixed(2)} | 佣金: 15%`;
        }
        
        const statusText = order.status === 'deducted' ? '已扣款，等待充值' : '等待触发';
        statusClass = order.status === 'deducted' ? 'deducted' : '';
        
        orderDiv.innerHTML = `
            <div class="trigger-order-header">
                <div>
                    <span class="trigger-order-type">${orderTypeText}</span>
                    <span class="trigger-order-badge">第 ${order.trigger_order_number} 单触发</span>
                    <span class="trigger-order-status ${statusClass}">${statusText}</span>
                </div>
                <button class="delete-trigger-btn" data-id="${order.id}"><i class="fas fa-trash"></i> 删除</button>
            </div>
            <div class="trigger-order-detail">${extraInfo}</div>
            <div class="trigger-order-time"><i class="fas fa-clock"></i> 创建时间: ${new Date(order.created_at).toLocaleString()}</div>
        `;
        container.appendChild(orderDiv);
    }
    document.querySelectorAll('.delete-trigger-btn').forEach(btn => btn.addEventListener('click', async () => {
        showConfirm('确认删除', '删除这个触发订单？', async () => {
            await sb.from('user_trigger_orders').delete().eq('id', parseInt(btn.dataset.id));
            loadUserTriggerOrders(currentSetUser.uid);
            showToast('删除成功', 'success');
        });
    }));
}

async function advancedSearchOrder() {
    const targetPrice = parseFloat(document.getElementById('advancedTargetPrice').value);
    if (isNaN(targetPrice) || targetPrice <= 0) {
        showToast('请输入有效的目标价格', 'error');
        return;
    }
    
    const priceNum = Math.floor(targetPrice);
    const digitCount = priceNum.toString().length;
    let minPrice = priceNum, maxPrice;
    if (digitCount === 2) maxPrice = priceNum + 19;
    else if (digitCount === 3) maxPrice = priceNum + 99;
    else if (digitCount === 4) maxPrice = priceNum + 999;
    else if (digitCount === 5) maxPrice = priceNum + 9999;
    else maxPrice = priceNum;
    
    showToast(`搜索价格范围: €${minPrice} - €${maxPrice}`, 'info');
    
    const { data: matchedOrders } = await sb.from('orders_pool').select('*').eq('status', 'available').gte('price', minPrice).lte('price', maxPrice).order('price', { ascending: true });
    const container = document.getElementById('advancedOrdersList');
    container.innerHTML = '';
    selectedAdvancedOrdersList = [];
    
    if (!matchedOrders || matchedOrders.length === 0) {
        container.innerHTML = '<div style="text-align:center; padding:40px; color:#aaa;"><i class="fas fa-search"></i><br>未找到匹配的订单</div>';
        return;
    }
    
    for (let order of matchedOrders) {
        const div = document.createElement('div');
        div.className = 'order-item-card';
        div.innerHTML = `
            <input type="checkbox" class="order-checkbox" data-id="${order.id}" data-price="${order.price}">
            <div class="order-info">
                <div class="order-name">${order.accommodation_name || 'Hotel Task'}</div>
                <div class="order-price">€${order.price.toFixed(2)}</div>
            </div>
            <div style="font-size: 11px; color: #8a9abb;">佣金: €${(order.price * 0.05).toFixed(2)} (5%)</div>
        `;
        container.appendChild(div);
        const checkbox = div.querySelector('.order-checkbox');
        checkbox.addEventListener('change', (e) => {
            const orderData = { id: order.id, price: order.price, name: order.accommodation_name };
            if (e.target.checked) selectedAdvancedOrdersList.push(orderData);
            else selectedAdvancedOrdersList = selectedAdvancedOrdersList.filter(o => o.id !== order.id);
            document.getElementById('advancedActionBtns').style.display = selectedAdvancedOrdersList.length > 0 ? 'flex' : 'none';
        });
    }
}

async function confirmAdvancedOrder() {
    if (!currentSetUser) {
        showToast('请先选择用户', 'error');
        return;
    }
    const orderCount = parseInt(document.getElementById('advancedOrderCount').value) || 1;
    if (orderCount <= 0) {
        showToast('请输入有效的触发订单数', 'error');
        return;
    }
    if (selectedAdvancedOrdersList.length === 0) {
        showToast('请至少选择一个订单', 'error');
        return;
    }
    
    for (let order of selectedAdvancedOrdersList) {
        const matchedPrice = order.price;
        const commissionAmount = matchedPrice * 0.05;
        
        // 获取订单图片
        const { data: poolOrder } = await sb.from('orders_pool').select('image_url, accommodation_name, order_code').eq('id', order.id).single();
        
        await sb.from('user_trigger_orders').insert([{ 
            uid: currentSetUser.uid, 
            username: currentSetUser.username, 
            order_type: 'advanced', 
            trigger_order_number: orderCount, 
            target_price: parseFloat(document.getElementById('advancedTargetPrice').value),
            matched_order_id: order.id,
            matched_order_code: poolOrder?.order_code || '',
            matched_order_name: poolOrder?.accommodation_name || order.name || '',
            matched_price: matchedPrice,
            matched_image_url: poolOrder?.image_url || '',
            commission_rate: 5.0, 
            commission_amount: commissionAmount, 
            status: 'pending' 
        }]);
    }
    showToast(`成功为 ${currentSetUser.username} 设置 ${selectedAdvancedOrdersList.length} 个高级订单`, 'success');
    selectedAdvancedOrdersList = [];
    document.getElementById('advancedOrdersList').innerHTML = '';
    document.getElementById('advancedActionBtns').style.display = 'none';
    document.getElementById('advancedOrderCount').value = '1';
    document.getElementById('advancedTargetPrice').value = '';
    await loadUserTriggerOrders(currentSetUser.uid);
}

async function addCardReward() {
    if (!currentSetUser) {
        showToast('请先选择用户', 'error');
        return;
    }
    const orderCount = parseInt(document.getElementById('cardOrderCount').value) || 0;
    const rewardAmount = parseFloat(document.getElementById('cardTargetPrice').value) || 0;
    if (orderCount <= 0) {
        showToast('请输入有效的触发订单数', 'error');
        return;
    }
    if (rewardAmount <= 0) {
        showToast('请输入有效的奖励金额', 'error');
        return;
    }
    await sb.from('user_trigger_orders').insert([{ 
        uid: currentSetUser.uid, 
        username: currentSetUser.username, 
        order_type: 'card_reward', 
        trigger_order_number: orderCount, 
        target_price: rewardAmount, 
        status: 'pending' 
    }]);
    showToast(`卡牌奖励设置成功：第${orderCount}单触发 €${rewardAmount.toFixed(2)}`, 'success');
    await loadUserTriggerOrders(currentSetUser.uid);
    document.getElementById('cardOrderCount').value = '';
    document.getElementById('cardTargetPrice').value = '';
}

async function addCardOrder() {
    if (!currentSetUser) {
        showToast('请先选择用户', 'error');
        return;
    }
    const orderCount = parseInt(document.getElementById('cardorderOrderCount').value) || 0;
    const targetPrice = parseFloat(document.getElementById('cardorderTargetPrice').value) || 0;
    if (orderCount <= 0) {
        showToast('请输入有效的触发订单数', 'error');
        return;
    }
    if (targetPrice <= 0) {
        showToast('请输入有效的订单价格', 'error');
        return;
    }
    const commissionAmount = targetPrice * 0.15;
    await sb.from('user_trigger_orders').insert([{ 
        uid: currentSetUser.uid, 
        username: currentSetUser.username, 
        order_type: 'card_order', 
        trigger_order_number: orderCount, 
        target_price: targetPrice, 
        matched_price: targetPrice, 
        commission_rate: 15.0, 
        commission_amount: commissionAmount, 
        status: 'pending' 
    }]);
    showToast(`卡牌订单设置成功：第${orderCount}单触发 €${targetPrice.toFixed(2)} (15%佣金 = €${commissionAmount.toFixed(2)})`, 'success');
    await loadUserTriggerOrders(currentSetUser.uid);
    document.getElementById('cardorderOrderCount').value = '';
    document.getElementById('cardorderTargetPrice').value = '';
}

window.loadSetordersPage = loadSetordersPage;