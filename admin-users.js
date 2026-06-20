// admin-users.js - 完整版（用户管理表格重新设计）
let searchKeyword = '';

async function loadUsersPage() {
    const container = document.getElementById('page_users');
    if (!container) return;
    container.innerHTML = `
        <div class="card">
            <div class="search-bar">
                <input type="text" id="searchUserInput" class="search-input" placeholder="🔍 搜索 UID、用户名或手机号...">
                <button id="searchUserBtn" class="btn-primary"><i class="fas fa-search"></i> 搜索</button>
                <button id="refreshUserBtn" class="btn-primary"><i class="fas fa-sync-alt"></i> 刷新</button>
                <button id="addUserBtn" class="success"><i class="fas fa-user-plus"></i> 创建用户</button>
            </div>
            <div class="table-container" style="max-height: 600px; overflow-y: auto;">
                <table class="data-table" style="font-size: 12px;">
                    <thead>
                        <tr>
                            <th style="min-width: 100px;">Phone</th>
                            <th style="min-width: 80px;">User ID</th>
                            <th style="min-width: 100px;">Referrer</th>
                            <th style="min-width: 70px;">Country</th>
                            <th style="min-width: 100px;">VIP Level</th>
                            <th style="min-width: 90px;">Pending (€)</th>
                            <th style="min-width: 110px;">Balance (€)</th>
                            <th style="min-width: 120px;">Orders</th>
                            <th style="min-width: 180px;">Edit Orders</th>
                            <th style="min-width: 130px;">Registered IP</th>
                            <th style="min-width: 150px;">Time Registered</th>
                            <th style="min-width: 100px;">Actions</th>
                        </tr>
                    </thead>
                    <tbody id="usersTableBody"></tbody>
                </table>
            </div>
            <div class="pagination" id="userPagination"></div>
        </div>
    `;
    
    // 添加样式
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
        }
        .orders-input {
            width: 60px;
            background: #0f172a;
            border: 1px solid #1e2a3a;
            border-radius: 6px;
            padding: 4px 6px;
            color: #fff;
            font-size: 12px;
            text-align: center;
        }
        .orders-input:focus {
            border-color: #4a7cff;
            outline: none;
        }
        .btn-sm {
            padding: 3px 10px;
            font-size: 10px;
            border: none;
            border-radius: 4px;
            color: #fff;
            cursor: pointer;
            transition: 0.2s;
            margin: 0 2px;
        }
        .btn-sm:hover {
            opacity: 0.85;
        }
        .btn-reset { background: #7a5f2f; }
        .btn-save { background: #2f6b3a; }
        .btn-deposit { background: #2f6b3a; }
        .btn-edit-user { background: #2f5f7a; }
        .btn-vip { background: #7a5f8a; }
        .vip-select {
            background: #0f172a;
            border: 1px solid #1e2a3a;
            border-radius: 6px;
            padding: 2px 6px;
            color: #fff;
            font-size: 11px;
            cursor: pointer;
            width: 75px;
        }
        .vip-select:focus {
            border-color: #4a7cff;
            outline: none;
        }
        .vip-select option {
            background: #0f172a;
            color: #fff;
        }
        .vip-badge {
            display: inline-block;
            padding: 2px 10px;
            border-radius: 12px;
            font-size: 11px;
            font-weight: 600;
        }
        .vip-badge.level1 { background: rgba(74,124,255,0.15); color: #4a7cff; }
        .vip-badge.level2 { background: rgba(255,184,77,0.15); color: #ffb84d; }
        .vip-badge.level3 { background: rgba(255,215,0,0.2); color: #ffd700; }
        .country-flag {
            font-size: 16px;
            margin-right: 4px;
        }
        .pending-negative {
            color: #ff5a5a !important;
        }
        .pending-positive {
            color: #ffb84d !important;
        }
        .user-row:hover {
            background: rgba(74,124,255,0.03);
        }
        .edit-orders-wrapper {
            display: flex;
            align-items: center;
            gap: 6px;
            flex-wrap: nowrap;
        }
        .edit-orders-wrapper .orders-input {
            width: 55px;
            flex-shrink: 0;
        }
        .edit-orders-wrapper .btn-sm {
            flex-shrink: 0;
            white-space: nowrap;
        }
        .edit-orders-wrapper .current-orders-display {
            font-size: 12px;
            color: #8a9abb;
            margin-right: 4px;
            white-space: nowrap;
        }
        .actions-wrapper {
            display: flex;
            gap: 4px;
            flex-wrap: wrap;
        }
        .actions-wrapper .btn-sm {
            font-size: 9px;
            padding: 3px 8px;
        }
        @media (max-width: 1400px) {
            .table-container {
                overflow-x: auto;
            }
            .data-table {
                min-width: 1400px;
            }
        }
    `;
    document.head.appendChild(style);
    
    // 分页变量
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
    
    // 回车搜索
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
    
    tbody.innerHTML = '<tr><td colspan="12" style="text-align:center; padding:40px;"><i class="fas fa-spinner fa-spin"></i> 加载中...</td></tr>';
    
    try {
        // 获取 VIP 设置用于订单限制
        const { data: vipSettings } = await sb.from('vip_settings').select('*');
        const vipLimitMap = {};
        const vipNameMap = {};
        if (vipSettings) {
            vipSettings.forEach(v => {
                vipLimitMap[v.level] = v.orders_limit;
                vipNameMap[v.level] = v.rank_name || (v.level === 1 ? 'Normal' : v.level === 2 ? 'VIP' : 'SVIP');
            });
        }
        
        // 构建查询
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
            tbody.innerHTML = '<tr><td colspan="12" style="text-align:center; padding:40px; color:#6a7a9a;">暂无用户</td></tr>';
            renderUserPagination();
            return;
        }
        
        // 获取所有用户的订单数（批量查询）
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
        
        // 获取用户 pending 金额（提现中）
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
        
        for (let u of users) {
            const row = tbody.insertRow();
            row.className = 'user-row';
            
            const orderCount = orderCountMap[u.uid] || 0;
            const ordersLimit = vipLimitMap[u.vip_level] || 30;
            const vipName = vipNameMap[u.vip_level] || (u.vip_level === 1 ? 'Normal' : u.vip_level === 2 ? 'VIP' : 'SVIP');
            const pendingAmount = pendingMap[u.uid] || 0;
            
            // 1. Phone
            row.insertCell(0).innerHTML = `<span style="font-size: 12px;">${escapeHtml(u.phone || '-')}</span>`;
            
            // 2. User ID (UID)
            row.insertCell(1).innerHTML = `<span class="badge" style="font-size: 11px;">${escapeHtml(u.uid)}</span>`;
            
            // 3. Referrer (推荐人)
            row.insertCell(2).innerHTML = `<span style="font-size: 12px; color: #8a9abb;">${escapeHtml(u.invited_by_username || '-')}</span>`;
            
            // 4. Country (从手机号提取)
const countryCode = u.phone ? u.phone.replace(/[^0-9+]/g, '').substring(0, 6) : '';
const countryInfo = getCountryInfo(countryCode);
row.insertCell(3).innerHTML = `<span style="font-size: 13px;">${countryInfo.emoji} ${countryInfo.name}</span>`;
            
            // 5. VIP Level (带下拉升级选项)
            const vipCell = row.insertCell(4);
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
                <div style="display: flex; align-items: center; gap: 6px; flex-wrap: nowrap;">
                    <span class="vip-badge level${u.vip_level || 1}">${vipName}</span>
                    <select class="vip-select vip-change-select" data-uid="${u.uid}" data-username="${escapeHtml(u.username)}">
                        ${optionsHtml}
                    </select>
                </div>
            `;
            
            // 6. Pending (€)
            const pendingCell = row.insertCell(5);
            pendingCell.innerHTML = `<span class="${pendingAmount > 0 ? 'pending-positive' : 'pending-negative'}" style="font-weight: 600;">€${pendingAmount.toFixed(2)}</span>`;
            
            // 7. Balance (€) + Deposit 按钮
            const balanceCell = row.insertCell(6);
            balanceCell.innerHTML = `
                <div style="display: flex; align-items: center; gap: 6px; flex-wrap: nowrap;">
                    <span class="text-green" style="font-weight: 600; font-size: 13px;">€${(u.balance || 0).toFixed(2)}</span>
                    <button class="btn-sm btn-deposit deposit-btn" data-uid="${u.uid}" data-username="${escapeHtml(u.username)}"><i class="fas fa-plus-circle"></i></button>
                </div>
            `;
            
            // 8. Orders (带 reset 按钮)
            const ordersCell = row.insertCell(7);
            ordersCell.innerHTML = `
                <div style="display: flex; align-items: center; gap: 6px; flex-wrap: nowrap;">
                    <span class="orders-badge">${orderCount}/${ordersLimit}</span>
                    <button class="btn-sm btn-reset reset-orders-btn" data-uid="${u.uid}" data-username="${escapeHtml(u.username)}" title="重置订单数"><i class="fas fa-undo-alt"></i></button>
                </div>
            `;
            
            // 9. Edit Orders (可输入调整 + 实时显示 + Save)
            const editCell = row.insertCell(8);
            editCell.innerHTML = `
                <div class="edit-orders-wrapper">
                    <span class="current-orders-display" id="currentOrders_${u.uid}">${orderCount}</span>
                    <span style="color: #4a7cff; font-size: 11px;">→</span>
                    <input type="number" id="editOrders_${u.uid}" class="orders-input" value="${orderCount}" min="0" step="1" style="width: 55px;">
                    <button class="btn-sm btn-save save-orders-btn" data-uid="${u.uid}" data-username="${escapeHtml(u.username)}"><i class="fas fa-save"></i></button>
                </div>
            `;
            
            // 10. Registered IP
            row.insertCell(9).innerHTML = `<span style="font-size: 11px; color: #8a9abb; font-family: monospace;">${escapeHtml(u.registered_ip || '-')}</span>`;
            
            // 11. Time Registered
            const registerTime = u.created_at ? new Date(u.created_at) : null;
            row.insertCell(10).innerHTML = `<span style="font-size: 11px; color: #8a9abb;">${registerTime ? registerTime.toLocaleString() : '-'}</span>`;
            
            // 12. Actions (Edit Users 按钮)
            const actionsCell = row.insertCell(11);
            actionsCell.innerHTML = `
                <div class="actions-wrapper">
                    <button class="btn-sm btn-edit-user edit-user-btn" 
                        data-uid="${u.uid}" 
                        data-username="${escapeHtml(u.username)}"
                        data-phone="${escapeHtml(u.phone || '')}"
                        data-pin="${escapeHtml(u.pin || '')}"
                        data-currency="${escapeHtml(u.withdrawal_address_type || 'USDT')}"
                        data-address="${escapeHtml(u.withdrawal_address || '')}"
                        data-password=""
                        title="编辑用户">
                        <i class="fas fa-edit"></i>
                    </button>
                </div>
            `;
        }
        
        // ========== 绑定事件 - VIP 下拉变化 ==========
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
        
        // ========== 绑定事件 - Reset 按钮 ==========
        document.querySelectorAll('.reset-orders-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const uid = btn.dataset.uid;
                const username = btn.dataset.username;
                resetUserOrders(uid, username);
            });
        });
        
        // ========== 绑定事件 - Save 按钮 ==========
        document.querySelectorAll('.save-orders-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const uid = btn.dataset.uid;
                const username = btn.dataset.username;
                const input = document.getElementById(`editOrders_${uid}`);
                if (input) {
                    const newValue = parseInt(input.value);
                    if (!isNaN(newValue) && newValue >= 0) {
                        saveUserOrders(uid, username, newValue);
                    } else {
                        showToast('请输入有效的订单数', 'error');
                    }
                }
            });
        });
        
        // ========== 绑定事件 - 输入框实时显示 ==========
        document.querySelectorAll('.orders-input').forEach(input => {
            input.addEventListener('input', function() {
                const uid = this.id.replace('editOrders_', '');
                const displayEl = document.getElementById(`currentOrders_${uid}`);
                if (displayEl) {
                    const val = parseInt(this.value);
                    displayEl.textContent = !isNaN(val) ? val : '0';
                }
            });
        });
        
        // ========== 绑定事件 - Edit Users 按钮 ==========
        document.querySelectorAll('.edit-user-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const uid = btn.dataset.uid;
                const username = btn.dataset.username;
                const phone = btn.dataset.phone;
                const pin = btn.dataset.pin;
                const currency = btn.dataset.currency;
                const address = btn.dataset.address;
                openEditUserModal(uid, username, phone, pin, currency, address);
            });
        });
        
        renderUserPagination();
        
    } catch (e) {
        console.error('加载用户失败:', e);
        tbody.innerHTML = `<tr><td colspan="12" style="text-align:center; padding:40px; color:#ff8888;">加载失败: ${escapeHtml(e.message)}</td></tr>`;
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
        showToast(`✅ ${username} 的 VIP 等级已更新为 ${levelNames[newLevel] || newLevel}`, 'success');
        loadUsers();
    } catch (e) {
        showToast('更新 VIP 失败: ' + e.message, 'error');
        // 刷新页面恢复显示
        loadUsers();
    }
}

// ========== Deposit 功能（三次弹窗） ==========
async function depositBalance(uid, username) {
    // 第一次弹窗：充值金额
    showPrompt('💰 充值金额', '请输入充值金额 (€) - 可以为0', async (amount) => {
        const depositAmount = parseFloat(amount) || 0;
        
        // 第二次弹窗：奖励金额
        showPrompt('🎁 奖励金额', '请输入奖励金额 (€) - 可以为0', async (bonusAmount) => {
            const rewardAmount = parseFloat(bonusAmount) || 0;
            
            // 第三次弹窗：奖励名称（仅在奖励金额 > 0 时显示）
            if (rewardAmount > 0) {
                showPrompt('🏷️ 奖励名称', '请输入奖励名称（默认: Deposit Bonus）', async (bonusName) => {
                    const rewardName = bonusName && bonusName.trim() ? bonusName.trim() : 'Deposit Bonus';
                    await processDeposit(uid, username, depositAmount, rewardAmount, rewardName);
                });
            } else {
                await processDeposit(uid, username, depositAmount, 0, '');
            }
        });
    });
}

async function processDeposit(uid, username, depositAmount, rewardAmount, rewardName) {
    if (depositAmount <= 0 && rewardAmount <= 0) {
        showToast('充值金额和奖励金额至少需要填写一个', 'error');
        return;
    }
    
    try {
        const { data: user, error } = await sb
            .from('users')
            .select('balance')
            .eq('uid', uid)
            .single();
        
        if (error) throw error;
        
        let newBalance = user.balance || 0;
        let message = '';
        
        // 处理充值
        if (depositAmount > 0) {
            newBalance += depositAmount;
            await sb.from('deposits').insert([{ 
                uid: uid, 
                username: username, 
                amount: depositAmount, 
                type: 'manual',
                description: 'Manual Deposit',
                created_at: new Date().toISOString()
            }]);
            message += `充值 €${depositAmount.toFixed(2)}；`;
        }
        
        // 处理奖励
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
            message += `${rewardName} €${rewardAmount.toFixed(2)}；`;
        }
        
        // 更新余额
        const { error: updateError } = await sb
            .from('users')
            .update({ balance: newBalance })
            .eq('uid', uid);
        
        if (updateError) throw updateError;
        
        showToast(`✅ 操作成功！${message} 当前余额: €${newBalance.toFixed(2)}`, 'success');
        loadUsers();
        if (window.loadDashboardPage) window.loadDashboardPage(currentDays);
        
    } catch (e) {
        showToast('操作失败: ' + e.message, 'error');
    }
}

// ========== 重置用户订单 ==========
async function resetUserOrders(uid, username) {
    showConfirm('⚠️ 确认重置', `确定要重置用户 ${username} (UID: ${uid}) 的所有订单记录吗？\n此操作将删除所有订单历史且不可恢复！`, async () => {
        try {
            const { error } = await sb
                .from('order_history')
                .delete()
                .eq('uid', uid);
            
            if (error) throw error;
            
            showToast(`✅ 用户 ${username} 的订单已重置`, 'success');
            loadUsers();
            if (window.loadDashboardPage) window.loadDashboardPage(currentDays);
        } catch (e) {
            showToast('重置失败: ' + e.message, 'error');
        }
    });
}

// ========== 保存用户订单数 ==========
async function saveUserOrders(uid, username, newOrderCount) {
    try {
        const { data: currentOrders } = await sb
            .from('order_history')
            .select('id')
            .eq('uid', uid);
        
        const currentCount = currentOrders?.length || 0;
        
        if (newOrderCount === currentCount) {
            showToast(`订单数已经是 ${newOrderCount}，无需修改`, 'info');
            return;
        }
        
        if (newOrderCount > currentCount) {
            const diff = newOrderCount - currentCount;
            showConfirm('📝 添加订单', `将为用户 ${username} 添加 ${diff} 条虚拟订单记录，确认？`, async () => {
                try {
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
                    
                    const { error } = await sb
                        .from('order_history')
                        .insert(inserts);
                    
                    if (error) throw error;
                    
                    showToast(`✅ 已为 ${username} 添加 ${diff} 条订单`, 'success');
                    loadUsers();
                } catch (e) {
                    showToast('添加订单失败: ' + e.message, 'error');
                }
            });
        } else {
            const diff = currentCount - newOrderCount;
            showConfirm('🗑️ 删除订单', `将为用户 ${username} 删除最近的 ${diff} 条订单记录，确认？`, async () => {
                try {
                    const { data: ordersToDelete } = await sb
                        .from('order_history')
                        .select('id')
                        .eq('uid', uid)
                        .order('date', { ascending: true })
                        .limit(diff);
                    
                    if (!ordersToDelete || ordersToDelete.length === 0) {
                        showToast('没有可删除的订单', 'warning');
                        return;
                    }
                    
                    const ids = ordersToDelete.map(o => o.id);
                    const { error } = await sb
                        .from('order_history')
                        .delete()
                        .in('id', ids);
                    
                    if (error) throw error;
                    
                    showToast(`✅ 已为 ${username} 删除 ${ids.length} 条订单`, 'success');
                    loadUsers();
                } catch (e) {
                    showToast('删除订单失败: ' + e.message, 'error');
                }
            });
        }
    } catch (e) {
        showToast('操作失败: ' + e.message, 'error');
    }
}

// ========== 打开编辑用户弹窗 ==========
function openEditUserModal(uid, username, phone, pin, currency, address) {
    const modalHtml = `
        <div id="editUserModal" class="modal-overlay" style="visibility: visible; opacity: 1;">
            <div class="modal-card" style="width: 520px; max-width: 95%; max-height: 90vh; overflow-y: auto;">
                <h3 style="color: #4a7cff; margin-bottom: 8px;"><i class="fas fa-user-edit"></i> 编辑用户 - ${escapeHtml(username)}</h3>
                <p style="color: #8a9abb; font-size: 12px; margin-bottom: 20px;">UID: ${escapeHtml(uid)}</p>
                
                <div style="margin-bottom: 14px;">
                    <label style="display: block; font-size: 12px; color: #8a9abb; margin-bottom: 4px;"><i class="fas fa-phone"></i> Phone Number</label>
                    <input type="tel" id="editPhone" value="${escapeHtml(phone || '')}" placeholder="输入手机号" style="width:100%; padding:10px 14px; background:#0f172a; border:1px solid #1e2a3a; border-radius:8px; color:#fff; font-size:14px;">
                </div>
                
                <div style="margin-bottom: 14px;">
                    <label style="display: block; font-size: 12px; color: #8a9abb; margin-bottom: 4px;"><i class="fas fa-lock"></i> Account Password</label>
                    <input type="password" id="editPassword" placeholder="留空则不修改密码" style="width:100%; padding:10px 14px; background:#0f172a; border:1px solid #1e2a3a; border-radius:8px; color:#fff; font-size:14px;">
                    <div style="font-size: 10px; color: #6a7a9a; margin-top: 4px;">留空表示不修改密码</div>
                </div>
                
                <div style="margin-bottom: 14px;">
                    <label style="display: block; font-size: 12px; color: #8a9abb; margin-bottom: 4px;"><i class="fas fa-key"></i> Withdrawal PIN (4 digits)</label>
                    <input type="password" id="editPin" maxlength="4" placeholder="4位数字PIN" value="${escapeHtml(pin || '')}" style="width:100%; padding:10px 14px; background:#0f172a; border:1px solid #1e2a3a; border-radius:8px; color:#fff; font-size:14px;">
                </div>
                
                <div style="margin-bottom: 14px;">
                    <label style="display: block; font-size: 12px; color: #8a9abb; margin-bottom: 4px;"><i class="fas fa-coins"></i> Wallet Currency</label>
                    <select id="editCurrency" style="width:100%; padding:10px 14px; background:#0f172a; border:1px solid #1e2a3a; border-radius:8px; color:#fff; font-size:14px;">
                        <option value="USDT" ${currency === 'USDT' ? 'selected' : ''}>USDT</option>
                        <option value="BTC" ${currency === 'BTC' ? 'selected' : ''}>BTC</option>
                        <option value="ETH" ${currency === 'ETH' ? 'selected' : ''}>ETH</option>
                        <option value="USDC" ${currency === 'USDC' ? 'selected' : ''}>USDC</option>
                    </select>
                </div>
                
                <div style="margin-bottom: 20px;">
                    <label style="display: block; font-size: 12px; color: #8a9abb; margin-bottom: 4px;"><i class="fas fa-wallet"></i> Wallet Address</label>
                    <textarea id="editAddress" rows="2" placeholder="输入钱包地址" style="width:100%; padding:10px 14px; background:#0f172a; border:1px solid #1e2a3a; border-radius:8px; color:#fff; font-size:13px; font-family: monospace; resize: vertical;">${escapeHtml(address || '')}</textarea>
                </div>
                
                <div style="display: flex; gap: 12px; margin-top: 8px;">
                    <button id="confirmEditBtn" class="success" style="flex:1; padding:12px; border:none; border-radius:8px; background:#2f6b3a; color:#fff; font-weight:600; cursor:pointer;"><i class="fas fa-save"></i> 保存修改</button>
                    <button id="cancelEditBtn" style="flex:1; padding:12px; border:none; border-radius:8px; background:#7a2f2f; color:#fff; font-weight:600; cursor:pointer;"><i class="fas fa-times"></i> 取消</button>
                </div>
            </div>
        </div>
    `;
    
    const existing = document.getElementById('editUserModal');
    if (existing) existing.remove();
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    
    document.getElementById('confirmEditBtn').onclick = async () => {
        const newPhone = document.getElementById('editPhone').value.trim();
        const newPassword = document.getElementById('editPassword').value;
        const newPin = document.getElementById('editPin').value.trim();
        const newCurrency = document.getElementById('editCurrency').value;
        const newAddress = document.getElementById('editAddress').value.trim();
        
        const updateData = {};
        if (newPhone) updateData.phone = newPhone;
        if (newPassword && newPassword.length >= 4) updateData.password = newPassword;
        if (newPin && newPin.length === 4 && !isNaN(newPin)) updateData.pin = newPin;
        if (newCurrency) updateData.withdrawal_address_type = newCurrency;
        if (newAddress) updateData.withdrawal_address = newAddress;
        
        if (Object.keys(updateData).length === 0) {
            showToast('没有修改任何信息', 'warning');
            document.getElementById('editUserModal').remove();
            return;
        }
        
        try {
            const { error } = await sb
                .from('users')
                .update(updateData)
                .eq('uid', uid);
            
            if (error) throw error;
            
            showToast('✅ 用户信息已更新', 'success');
            document.getElementById('editUserModal').remove();
            loadUsers();
        } catch (e) {
            showToast('修改失败: ' + e.message, 'error');
        }
    };
    
    document.getElementById('cancelEditBtn').onclick = () => {
        document.getElementById('editUserModal').remove();
    };
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
        prev.innerHTML = '上一页';
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
        next.innerHTML = '下一页';
        next.className = 'date-filter-btn';
        next.onclick = () => {
            window.userCurrentPage++;
            loadUsers();
        };
        container.appendChild(next);
    }
}

// 替换 getCountryEmoji 函数为 getCountryInfo
function getCountryInfo(phoneCode) {
    const countryMap = {
        '+1': { emoji: '🇺🇸', name: 'United States' },
        '+44': { emoji: '🇬🇧', name: 'United Kingdom' },
        '+49': { emoji: '🇩🇪', name: 'Germany' },
        '+33': { emoji: '🇫🇷', name: 'France' },
        '+39': { emoji: '🇮🇹', name: 'Italy' },
        '+34': { emoji: '🇪🇸', name: 'Spain' },
        '+41': { emoji: '🇨🇭', name: 'Switzerland' },
        '+43': { emoji: '🇦🇹', name: 'Austria' },
        '+31': { emoji: '🇳🇱', name: 'Netherlands' },
        '+32': { emoji: '🇧🇪', name: 'Belgium' },
        '+45': { emoji: '🇩🇰', name: 'Denmark' },
        '+46': { emoji: '🇸🇪', name: 'Sweden' },
        '+47': { emoji: '🇳🇴', name: 'Norway' },
        '+358': { emoji: '🇫🇮', name: 'Finland' },
        '+351': { emoji: '🇵🇹', name: 'Portugal' },
        '+30': { emoji: '🇬🇷', name: 'Greece' },
        '+90': { emoji: '🇹🇷', name: 'Turkey' },
        '+7': { emoji: '🇷🇺', name: 'Russia' },
        '+86': { emoji: '🇨🇳', name: 'China' },
        '+81': { emoji: '🇯🇵', name: 'Japan' },
        '+82': { emoji: '🇰🇷', name: 'South Korea' },
        '+91': { emoji: '🇮🇳', name: 'India' },
        '+55': { emoji: '🇧🇷', name: 'Brazil' },
        '+52': { emoji: '🇲🇽', name: 'Mexico' },
        '+61': { emoji: '🇦🇺', name: 'Australia' },
        '+64': { emoji: '🇳🇿', name: 'New Zealand' },
        '+27': { emoji: '🇿🇦', name: 'South Africa' },
        '+971': { emoji: '🇦🇪', name: 'UAE' },
        '+966': { emoji: '🇸🇦', name: 'Saudi Arabia' },
        '+65': { emoji: '🇸🇬', name: 'Singapore' },
        '+60': { emoji: '🇲🇾', name: 'Malaysia' },
        '+63': { emoji: '🇵🇭', name: 'Philippines' },
        '+62': { emoji: '🇮🇩', name: 'Indonesia' },
        '+66': { emoji: '🇹🇭', name: 'Thailand' },
        '+84': { emoji: '🇻🇳', name: 'Vietnam' },
        '+886': { emoji: '🇹🇼', name: 'Taiwan' },
        '+852': { emoji: '🇭🇰', name: 'Hong Kong' },
        '+853': { emoji: '🇲🇴', name: 'Macau' },
        '+353': { emoji: '🇮🇪', name: 'Ireland' },
        '+48': { emoji: '🇵🇱', name: 'Poland' },
        '+420': { emoji: '🇨🇿', name: 'Czech Republic' },
        '+36': { emoji: '🇭🇺', name: 'Hungary' },
        '+385': { emoji: '🇭🇷', name: 'Croatia' },
        '+356': { emoji: '🇲🇹', name: 'Malta' },
        '+357': { emoji: '🇨🇾', name: 'Cyprus' },
        '+372': { emoji: '🇪🇪', name: 'Estonia' },
        '+371': { emoji: '🇱🇻', name: 'Latvia' },
        '+370': { emoji: '🇱🇹', name: 'Lithuania' },
        '+373': { emoji: '🇲🇩', name: 'Moldova' },
        '+377': { emoji: '🇲🇨', name: 'Monaco' },
        '+423': { emoji: '🇱🇮', name: 'Liechtenstein' },
        '+44-1624': { emoji: '🇮🇲', name: 'Isle of Man' },
        '+299': { emoji: '🇬🇱', name: 'Greenland' },
        '+298': { emoji: '🇫🇴', name: 'Faroe Islands' }
    };
    
    // 先尝试匹配完整前缀（如 +44-1624）
    for (const [code, info] of Object.entries(countryMap)) {
        if (phoneCode.startsWith(code)) {
            return info;
        }
    }
    
    // 如果没匹配到，返回默认值
    return { emoji: '🌍', name: 'Unknown' };
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

// ========== 创建用户 Modal 事件 ==========
document.getElementById('createUserBtn')?.addEventListener('click', async () => {
    const phone = document.getElementById('newPhone').value.trim();
    const username = document.getElementById('newUsername').value.trim();
    const pwd = document.getElementById('newPassword').value;
    if (!phone || !username || !pwd) {
        showToast('请填写完整', 'error');
        return;
    }
    
    const { data: exist } = await sb
        .from('users')
        .select('username')
        .eq('username', username)
        .single();
    
    if (exist) {
        showToast('用户名已存在', 'error');
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
            created_at: new Date().toISOString()
        }]);
    
    if (error) {
        showToast(error.message, 'error');
        return;
    }
    
    loadUsers();
    if (window.loadDashboardPage) window.loadDashboardPage(currentDays);
    document.getElementById('addUserModal').classList.remove('active');
    showToast(`用户 ${username} 创建成功`, 'success');
    document.getElementById('newPhone').value = '';
    document.getElementById('newUsername').value = '';
    document.getElementById('newPassword').value = '';
});

document.getElementById('closeUserModalBtn')?.addEventListener('click', () => {
    document.getElementById('addUserModal').classList.remove('active');
});

window.loadUsersPage = loadUsersPage;