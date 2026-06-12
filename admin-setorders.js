// admin-setorders.js - 设置订单页面（使用自定义弹窗）
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
                    <table class="data-table"><thead><tr><th>UID</th><th>用户名</th><th>操作</th></tr></thead><tbody id="setordersUserTableBody"></tbody></table>
                </div>
            </div>
            <div id="setordersMain" style="display: none;">
                <div class="uid-header" style="background: rgba(74,124,255,0.1); padding: 10px 16px; border-radius: 12px; margin-bottom: 20px;">当前用户：<span id="selectedUidDisplay" style="color:#4a7cff;"></span> - <span id="selectedUsernameDisplay"></span></div>
                <div id="userTriggerOrdersList" style="margin-bottom: 20px;">
                    <h4 style="margin-bottom: 12px; color: #4a7cff;"><i class="fas fa-list"></i> 已设置的订单</h4>
                    <div id="triggerOrdersContainer" style="max-height: 300px; overflow-y: auto;"></div>
                </div>
                <div class="history-tabs" style="display: flex; gap: 8px; margin-bottom: 20px;">
                    <button class="tab-btn active" data-setorder-tab="advanced">高级订单</button>
                    <button class="tab-btn" data-setorder-tab="card">卡牌奖励</button>
                    <button class="tab-btn" data-setorder-tab="cardorder">卡牌订单</button>
                </div>
                <div id="advancedPanel"><div class="setorders-left"><input type="number" id="advancedOrderCount" value="1"><input type="number" id="advancedTargetPrice" step="0.01"><button id="advancedSearchOrderBtn" class="btn-primary">搜索订单</button></div><div id="advancedOrdersList"></div><div id="advancedActionBtns" style="display:none;"><button id="advancedConfirmBtn" class="success">确认触发</button><button id="advancedCancelBtn" class="danger">取消</button></div></div>
                <div id="cardPanel" style="display:none;"><div><input type="number" id="cardOrderCount" placeholder="触发单数"><input type="number" id="cardTargetPrice" step="0.01" placeholder="奖励金额"><button id="addCardRewardBtn" class="success">确认添加卡牌奖励</button></div></div>
                <div id="cardorderPanel" style="display:none;"><div><input type="number" id="cardorderOrderCount" placeholder="触发单数"><input type="number" id="cardorderTargetPrice" step="0.01" placeholder="订单价格"><button id="addCardOrderBtn" class="success">确认添加卡牌订单</button></div></div>
            </div>
        </div>
    `;
    await loadSetordersUserList();
    document.getElementById('setordersSearchBtn')?.addEventListener('click', () => { setordersSearchKeyword = document.getElementById('setordersSearchUid').value.trim(); loadSetordersUserList(); });
    document.getElementById('backToUserList')?.addEventListener('click', () => { document.getElementById('setordersUserSearch').style.display = 'block'; document.getElementById('setordersMain').style.display = 'none'; currentSetUser = null; });
    document.querySelectorAll('[data-setorder-tab]').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('[data-setorder-tab]').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const tab = btn.dataset.setorderTab;
            document.getElementById('advancedPanel').style.display = tab === 'advanced' ? 'flex' : 'none';
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
            row.insertCell(2).innerHTML = `<button class="setorder-select-btn" data-uid="${u.uid}" data-name="${u.username}" class="btn-primary" style="padding:4px 12px; font-size:12px;"><i class="fas fa-cog"></i> 设置订单</button>`;
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
    container.innerHTML = '<div style="text-align: center; padding: 20px; color: #aaa;">加载中...</div>';
    const { data: orders, error } = await sb.from('user_trigger_orders').select('*').eq('uid', uid).in('status', ['pending', 'deducted']).order('trigger_order_number', { ascending: true });
    if (error || !orders || orders.length === 0) {
        container.innerHTML = '<div style="text-align: center; padding: 20px; color: #aaa;">暂无已设置的订单</div>';
        return;
    }
    container.innerHTML = '';
    for (let order of orders) {
        const orderDiv = document.createElement('div');
        orderDiv.className = 'trigger-order-item';
        orderDiv.style.cssText = 'background:#0f172a; border-radius:12px; padding:12px; margin-bottom:10px; border:1px solid rgba(74,124,255,0.2);';
        let orderTypeText = '', extraInfo = '';
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
        orderDiv.innerHTML = `<div style="display: flex; justify-content: space-between;"><div><strong style="color:#4a7cff;">${orderTypeText}</strong> <span class="badge">第 ${order.trigger_order_number} 单触发</span> <span style="background:#ffaa33; padding:2px 8px; border-radius:12px; font-size:10px;">${statusText}</span><div style="font-size: 12px; margin-top: 5px;">${extraInfo}</div><div style="font-size: 11px; color: #aaa;">创建时间: ${new Date(order.created_at).toLocaleString()}</div></div><button class="delete-trigger-btn" data-id="${order.id}" style="background:#7a2f2f; padding:5px 12px; border-radius:8px;"><i class="fas fa-trash"></i> 删除</button></div>`;
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
    if (isNaN(targetPrice)) {
        showToast('请输入有效价格', 'error');
        return;
    }
    const priceNum = Math.floor(targetPrice);
    const digitCount = priceNum.toString().length;
    let minPrice = priceNum, maxPrice;
    if (digitCount === 3) maxPrice = priceNum + 99;
    else if (digitCount === 4) maxPrice = priceNum + 999;
    else if (digitCount === 5) maxPrice = priceNum + 9999;
    else maxPrice = priceNum;
    const { data: matchedOrders } = await sb.from('orders_pool').select('*').eq('status', 'available').gte('price', minPrice).lte('price', maxPrice).order('price', { ascending: true });
    const container = document.getElementById('advancedOrdersList');
    container.innerHTML = '';
    selectedAdvancedOrdersList = [];
    if (!matchedOrders || matchedOrders.length === 0) {
        container.innerHTML = '<div style="text-align:center; padding:20px;">未找到匹配订单</div>';
        return;
    }
    for (let order of matchedOrders) {
        const div = document.createElement('div');
        div.className = 'order-item-card';
        div.style.cssText = 'background:#0f172a; border-radius:12px; padding:12px; margin-bottom:8px; display:flex; gap:12px; align-items:center;';
        div.innerHTML = `<input type="checkbox" class="order-checkbox" data-id="${order.id}" data-price="${order.price}"><div><div>${order.accommodation_name || 'Hotel Task'}</div><div>€${order.price.toFixed(2)}</div></div>`;
        container.appendChild(div);
        const checkbox = div.querySelector('.order-checkbox');
        checkbox.addEventListener('change', (e) => {
            const orderData = { id: order.id, price: order.price };
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
    if (selectedAdvancedOrdersList.length === 0) {
        showToast('请至少选择一个订单', 'error');
        return;
    }
    for (let order of selectedAdvancedOrdersList) {
        const matchedPrice = order.price;
        const commissionAmount = matchedPrice * 0.05;
        await sb.from('user_trigger_orders').insert([{ uid: currentSetUser.uid, username: currentSetUser.username, order_type: 'advanced', trigger_order_number: orderCount, target_price: parseFloat(document.getElementById('advancedTargetPrice').value), matched_order_id: order.id, matched_price: matchedPrice, commission_rate: 5.0, commission_amount: commissionAmount, status: 'pending' }]);
    }
    showToast(`成功为 ${currentSetUser.username} 设置高级订单`, 'success');
    selectedAdvancedOrdersList = [];
    document.getElementById('advancedOrdersList').innerHTML = '';
    document.getElementById('advancedActionBtns').style.display = 'none';
    await loadUserTriggerOrders(currentSetUser.uid);
}

async function addCardReward() {
    if (!currentSetUser) {
        showToast('请先选择用户', 'error');
        return;
    }
    const orderCount = parseInt(document.getElementById('cardOrderCount').value) || 0;
    const rewardAmount = parseFloat(document.getElementById('cardTargetPrice').value) || 0;
    if (orderCount <= 0 || rewardAmount <= 0) {
        showToast('请输入有效数值', 'error');
        return;
    }
    await sb.from('user_trigger_orders').insert([{ uid: currentSetUser.uid, username: currentSetUser.username, order_type: 'card_reward', trigger_order_number: orderCount, target_price: rewardAmount, status: 'pending' }]);
    showToast(`卡牌奖励设置成功：第${orderCount}单触发 €${rewardAmount}`, 'success');
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
    if (orderCount <= 0 || targetPrice <= 0) {
        showToast('请输入有效数值', 'error');
        return;
    }
    const commissionAmount = targetPrice * 0.15;
    await sb.from('user_trigger_orders').insert([{ uid: currentSetUser.uid, username: currentSetUser.username, order_type: 'card_order', trigger_order_number: orderCount, target_price: targetPrice, matched_price: targetPrice, commission_rate: 15.0, commission_amount: commissionAmount, status: 'pending' }]);
    showToast(`卡牌订单设置成功：第${orderCount}单触发 €${targetPrice} (15%佣金)`, 'success');
    await loadUserTriggerOrders(currentSetUser.uid);
    document.getElementById('cardorderOrderCount').value = '';
    document.getElementById('cardorderTargetPrice').value = '';
}

window.loadSetordersPage = loadSetordersPage;