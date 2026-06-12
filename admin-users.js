// admin-users.js - 完整版（使用自定义弹窗）
let searchKeyword = '';

async function loadUsersPage() {
    const container = document.getElementById('page_users');
    if (!container) return;
    container.innerHTML = `
        <div class="card">
            <div class="search-bar">
                <input type="text" id="searchUserInput" class="search-input" placeholder="🔍 搜索 UID 或用户名...">
                <button id="searchUserBtn" class="btn-primary"><i class="fas fa-search"></i> 搜索</button>
                <button id="refreshUserBtn" class="btn-primary"><i class="fas fa-sync-alt"></i> 刷新</button>
                <button id="addUserBtn" class="success"><i class="fas fa-user-plus"></i> 创建用户</button>
            </div>
            <div class="table-container">
                <table class="data-table">
                    <thead><tr><th>UID</th><th>用户名</th><th>邀请码</th><th>推荐人</th><th>余额</th><th>体验金</th><th>订单数</th><th>VIP等级</th><th>钱包地址</th><th>操作</th></tr></thead>
                    <tbody id="usersTableBody"></tbody>
                </table>
            </div>
        </div>
    `;
    await loadUsers();
    document.getElementById('searchUserBtn')?.addEventListener('click', () => { searchKeyword = document.getElementById('searchUserInput').value; loadUsers(); });
    document.getElementById('refreshUserBtn')?.addEventListener('click', () => { document.getElementById('searchUserInput').value = ''; searchKeyword = ''; loadUsers(); });
    document.getElementById('addUserBtn')?.addEventListener('click', () => document.getElementById('addUserModal').classList.add('active'));
}

async function loadUsers() {
    let query = sb.from('users').select('*').order('created_at', { ascending: false });
    if (searchKeyword) query = query.or(`uid.ilike.%${searchKeyword}%,username.ilike.%${searchKeyword}%`);
    const { data: users } = await query;
    const { data: allOrders } = await sb.from('order_history').select('*');
    const { data: vipSettings } = await sb.from('vip_settings').select('*');
    const vipLimitMap = {};
    if (vipSettings) vipSettings.forEach(v => vipLimitMap[v.level] = v.orders_limit);
    const tbody = document.getElementById('usersTableBody');
    if (tbody && users) {
        tbody.innerHTML = '';
        for (let u of users) {
            const userOrders = allOrders?.filter(o => o.uid === u.uid).length || 0;
            const ordersLimit = vipLimitMap[u.vip_level] || 30;
            const row = tbody.insertRow();
            row.insertCell(0).innerHTML = `<span class="badge">${u.uid}</span>`;
            row.insertCell(1).innerText = u.username;
            row.insertCell(2).innerHTML = `<span class="badge">${u.invite_code || '-'}</span>`;
            row.insertCell(3).innerText = u.invited_by_username || '-';
            row.insertCell(4).innerHTML = `<span class="text-green">€${(u.balance || 0).toFixed(2)}</span>`;
            row.insertCell(5).innerHTML = `<span class="text-gold">€${(u.trial_bonus_amount || 0).toFixed(2)}</span>`;
            row.insertCell(6).innerHTML = `${userOrders}/${ordersLimit} <button class="reset-orders-btn" data-uid="${u.uid}" style="background:#7a5f2f; padding:2px 8px; font-size:10px; margin-left:8px;"><i class="fas fa-undo-alt"></i> 重置</button>`;
            row.insertCell(7).innerHTML = `<select class="vip-select" data-uid="${u.uid}" style="background:#0f172a; border:1px solid #1e2a3a; border-radius:8px; padding:4px 8px;"><option value="1" ${u.vip_level == 1 ? 'selected' : ''}>Normal</option><option value="2" ${u.vip_level == 2 ? 'selected' : ''}>VIP</option><option value="3" ${u.vip_level == 3 ? 'selected' : ''}>SVIP</option></select>`;
            row.insertCell(8).innerHTML = u.withdrawal_address ? u.withdrawal_address.substring(0, 12) + '...' : '-';
            row.insertCell(9).innerHTML = `<button class="deposit-btn" data-uid="${u.uid}" style="background:#2f6b3a; padding:4px 10px; font-size:11px; margin-right:4px;"><i class="fas fa-plus-circle"></i> 充值</button><button class="cut-btn" data-uid="${u.uid}" style="background:#7a2f2f; padding:4px 10px; font-size:11px; margin-right:4px;"><i class="fas fa-minus-circle"></i> 扣款</button><button class="edit-user-btn" data-uid="${u.uid}" data-phone="${u.phone || ''}" data-username="${u.username}" data-pin="${u.pin || ''}" style="background:#2f6b3a; padding:4px 10px; font-size:11px; margin-right:4px;"><i class="fas fa-edit"></i> 修改</button><button class="delete-btn" data-uid="${u.uid}" style="background:#7a2f2f; padding:4px 10px; font-size:11px;"><i class="fas fa-trash"></i> 删除</button>`;
        }
        document.querySelectorAll('.vip-select').forEach(sel => sel.addEventListener('change', () => updateVip(sel.dataset.uid, sel.value)));
        document.querySelectorAll('.deposit-btn').forEach(btn => btn.addEventListener('click', () => depositBalance(btn.dataset.uid)));
        document.querySelectorAll('.cut-btn').forEach(btn => btn.addEventListener('click', () => cutBalance(btn.dataset.uid)));
        document.querySelectorAll('.edit-user-btn').forEach(btn => btn.addEventListener('click', () => openEditUserModal(btn.dataset.uid, btn.dataset.phone, btn.dataset.username, btn.dataset.pin)));
        document.querySelectorAll('.delete-btn').forEach(btn => btn.addEventListener('click', () => delUser(btn.dataset.uid)));
        document.querySelectorAll('.reset-orders-btn').forEach(btn => btn.addEventListener('click', () => resetUserOrders(btn.dataset.uid)));
    }
}

async function resetUserOrders(uid) {
    showConfirm('确认重置', '重置后该用户订单数将归0，订单记录将被删除，是否继续？', async () => {
        await sb.from('order_history').delete().eq('uid', uid);
        showToast('订单已重置', 'success');
        loadUsers();
    });
}

async function depositBalance(uid) {
    showPrompt('充值金额', '请输入充值金额 (€)', async (amt) => {
        const amount = parseFloat(amt) || 0;
        if (amount <= 0) {
            showToast('请输入有效金额', 'error');
            return;
        }
        const { data: user } = await sb.from('users').select('balance, username').eq('uid', uid).single();
        const newBalance = (user.balance || 0) + amount;
        await sb.from('users').update({ balance: newBalance }).eq('uid', uid);
        await sb.from('deposits').insert([{ uid, username: user.username, amount: amount, type: 'manual' }]);
        loadUsers();
        if (window.loadDashboardPage) window.loadDashboardPage(currentDays);
        showToast(`充值 €${amount} 成功`, 'success');
    });
}

async function cutBalance(uid) {
    showPrompt('扣款金额', '请输入扣款金额 (€)', async (amt) => {
        const amount = parseFloat(amt);
        if (!amount || amount <= 0) {
            showToast('请输入有效金额', 'error');
            return;
        }
        const { data: user } = await sb.from('users').select('balance').eq('uid', uid).single();
        if ((user.balance || 0) < amount) {
            showToast('余额不足', 'error');
            return;
        }
        await sb.from('users').update({ balance: (user.balance || 0) - amount }).eq('uid', uid);
        loadUsers();
        if (window.loadDashboardPage) window.loadDashboardPage(currentDays);
        showToast(`-€${amount}`, 'success');
    });
}

function openEditUserModal(uid, phone, username, pin) {
    const modalHtml = `
        <div id="editUserModal" class="modal-overlay" style="visibility: visible; opacity: 1;">
            <div class="modal-card">
                <h3><i class="fas fa-edit"></i> 修改用户信息 - ${escapeHtml(username)}</h3>
                <div><label>Phone Number</label><input type="tel" id="editPhone" value="${escapeHtml(phone || '')}" style="width:100%; margin:10px 0; padding:10px; background:#0f172a; border:1px solid #1e2a3a; border-radius:8px; color:#fff;"></div>
                <div><label>Login Password</label><input type="password" id="editPassword" placeholder="留空则不修改" style="width:100%; margin:10px 0; padding:10px; background:#0f172a; border:1px solid #1e2a3a; border-radius:8px; color:#fff;"><small>留空表示不修改密码</small></div>
                <div><label>Withdrawal PIN (4 digits)</label><input type="password" id="editPin" maxlength="4" value="${escapeHtml(pin || '')}" style="width:100%; margin:10px 0; padding:10px; background:#0f172a; border:1px solid #1e2a3a; border-radius:8px; color:#fff;"></div>
                <div style="display: flex; gap: 12px; margin-top: 20px;">
                    <button id="confirmEditBtn" class="success">保存修改</button>
                    <button id="cancelEditBtn">取消</button>
                </div>
            </div>
        </div>
    `;
    const existing = document.getElementById('editUserModal');
    if (existing) existing.remove();
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    const modal = document.getElementById('editUserModal');
    document.getElementById('confirmEditBtn').onclick = async () => {
        const newPhone = document.getElementById('editPhone').value.trim();
        const newPassword = document.getElementById('editPassword').value;
        const newPin = document.getElementById('editPin').value;
        const updateData = {};
        if (newPhone) updateData.phone = newPhone;
        if (newPassword && newPassword.length >= 4) updateData.password = newPassword;
        if (newPin && newPin.length === 4 && !isNaN(newPin)) updateData.pin = newPin;
        if (Object.keys(updateData).length === 0) {
            showToast('没有修改任何信息', 'warning');
            modal.remove();
            return;
        }
        const { error } = await sb.from('users').update(updateData).eq('uid', uid);
        if (error) {
            showToast('修改失败: ' + error.message, 'error');
        } else {
            showToast('用户信息已更新', 'success');
            modal.remove();
            loadUsers();
        }
    };
    document.getElementById('cancelEditBtn').onclick = () => modal.remove();
}

async function updateVip(uid, level) {
    await sb.from('users').update({ vip_level: parseInt(level) }).eq('uid', uid);
    loadUsers();
}

async function delUser(uid) {
    showConfirm('确认删除', '永久删除用户？此操作不可恢复', async () => {
        await sb.from('users').delete().eq('uid', uid);
        await sb.from('order_history').delete().eq('uid', uid);
        await sb.from('deposits').delete().eq('uid', uid);
        await sb.from('withdrawals').delete().eq('uid', uid);
        loadUsers();
        if (window.loadDashboardPage) window.loadDashboardPage(currentDays);
        showToast('已删除', 'success');
    });
}

// 创建用户 Modal 事件
document.getElementById('createUserBtn')?.addEventListener('click', async () => {
    const phone = document.getElementById('newPhone').value.trim();
    const username = document.getElementById('newUsername').value.trim();
    const pwd = document.getElementById('newPassword').value;
    if (!phone || !username || !pwd) {
        showToast('请填写完整', 'error');
        return;
    }
    const { data: exist } = await sb.from('users').select('username').eq('username', username).single();
    if (exist) {
        showToast('用户名已存在', 'error');
        return;
    }
    const { data: max } = await sb.from('users').select('uid').order('uid', { ascending: false }).limit(1);
    let newUid = '100001';
    if (max && max.length) newUid = (parseInt(max[0].uid) + 1).toString();
    const inviteCode = Array(6).fill().map(() => 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'[Math.floor(Math.random() * 36)]).join('');
    const { error } = await sb.from('users').insert([{ uid: newUid, phone, username, password: pwd, invite_code: inviteCode, balance: 0, vip_level: 1, trial_bonus_amount: 0 }]);
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

document.getElementById('closeUserModalBtn')?.addEventListener('click', () => document.getElementById('addUserModal').classList.remove('active'));

window.loadUsersPage = loadUsersPage;