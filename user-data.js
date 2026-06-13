// user-data.js - 所有页面共享的用户数据管理

const SUPABASE_URL = 'https://qgmbzdfnwsdosdqphlxk.supabase.co';
const SUPABASE_KEY = 'sb_publishable_zsJFjfNUO7NKp8ZH5KrXFQ_WZ8Q2Kym';
const sb = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// 获取当前登录用户
function getCurrentUser() {
    const userStr = localStorage.getItem('currentUser');
    if (!userStr) return null;
    try {
        return JSON.parse(userStr);
    } catch(e) { return null; }
}

// 从 Supabase 获取用户最新数据
async function fetchUserData(uid) {
    const { data, error } = await sb
        .from('users')
        .select('*')
        .eq('uid', uid)
        .single();
    
    if (error) {
        console.error('获取用户数据失败:', error);
        return null;
    }
    return data;
}

// 获取用户订单历史
async function fetchUserOrders(uid, limit = 50) {
    const { data, error } = await sb
        .from('order_history')
        .select('*')
        .eq('uid', uid)
        .order('date', { ascending: false })
        .limit(limit);
    
    if (error) return [];
    return data;
}

// 获取用户充值/奖励记录
async function fetchUserDeposits(uid) {
    const { data, error } = await sb
        .from('deposits')
        .select('*')
        .eq('uid', uid)
        .order('created_at', { ascending: false });
    
    if (error) return [];
    return data;
}

// 同步用户数据到 localStorage 并返回
async function syncUserData() {
    const user = getCurrentUser();
    if (!user) return null;
    
    const freshData = await fetchUserData(user.uid);
    if (freshData) {
        user.balance = freshData.balance || 0;
        user.trialBonusAmount = freshData.trial_bonus_amount || 0;
        user.vipLevel = freshData.vip_level || 1;
        user.username = freshData.username;
        user.uid = freshData.uid;
        user.pin = freshData.pin || '';  // 👈 添加这行：同步 PIN
        user.inviteCode = freshData.invite_code || '';  // 👈 添加这行：同步邀请码
        localStorage.setItem('currentUser', JSON.stringify(user));
    }
    return user;
}

// 更新用户余额
async function updateUserBalance(uid, newBalance, newTrialBonus = null) {
    const updateData = { balance: newBalance };
    if (newTrialBonus !== null) {
        updateData.trial_bonus_amount = newTrialBonus;
    }
    
    const { error } = await sb
        .from('users')
        .update(updateData)
        .eq('uid', uid);
    
    if (error) {
        console.error('更新余额失败:', error);
        return false;
    }
    
    const user = getCurrentUser();
    if (user && user.uid === uid) {
        user.balance = newBalance;
        if (newTrialBonus !== null) {
            user.trialBonusAmount = newTrialBonus;
        }
        localStorage.setItem('currentUser', JSON.stringify(user));
    }
    return true;
}

// 检查登录状态
function checkLogin() {
    const user = getCurrentUser();
    if (!user || !user.isLoggedIn) {
        window.location.href = 'signin.html';
        return null;
    }
    return user;
}

// 获取用户总订单数和总佣金
async function fetchUserStats(uid) {
    const { data: orders } = await sb
        .from('order_history')
        .select('commission')
        .eq('uid', uid);
    
    const totalCommission = orders?.reduce((s, o) => s + (o.commission || 0), 0) || 0;
    const orderCount = orders?.length || 0;
    
    return { totalCommission, orderCount };
}

// ========== 触发订单相关函数 ==========

// 获取用户待完成的触发订单（pending 且 trigger_order_number <= 当前订单数 + 1）
async function getUserPendingTriggerOrder(uid) {
    // 先获取用户当前订单总数
    const { data: orders } = await sb
        .from('order_history')
        .select('id', { count: 'exact' })
        .eq('uid', uid);
    
    const currentOrderCount = orders?.length || 0;
    const nextOrderNumber = currentOrderCount + 1;
    
    // 查找触发订单数 <= 下一个订单数的 pending 订单
    const { data: triggers, error } = await sb
        .from('user_trigger_orders')
        .select('*')
        .eq('uid', uid)
        .eq('status', 'pending')
        .lte('trigger_order_number', nextOrderNumber)
        .order('trigger_order_number', { ascending: true })
        .limit(1);
    
    if (error) {
        console.error('获取触发订单失败:', error);
        return null;
    }
    
    return triggers?.[0] || null;
}

// 检查用户是否有待完成的触发订单（用于判断负数状态）
async function hasPendingTriggerOrder(uid) {
    const trigger = await getUserPendingTriggerOrder(uid);
    return trigger !== null;
}

// 获取触发订单的 Pending 金额（完成后的预期总余额）
async function getTriggerOrderPendingAmount(uid, currentBalance, triggerOrder) {
    if (!triggerOrder) {
        triggerOrder = await getUserPendingTriggerOrder(uid);
    }
    
    if (!triggerOrder) return 0;
    
    const matchedPrice = triggerOrder.matched_price || 0;
    const commission = triggerOrder.commission_amount || 0;
    
    // Pending = 当前余额 + 订单价格 + 佣金
    return currentBalance + matchedPrice + commission;
}

// 完成触发订单（用户提交订单后调用）
async function completeTriggerOrder(uid, triggerOrder) {
    if (!triggerOrder) return false;
    
    const matchedPrice = triggerOrder.matched_price || 0;
    const commission = triggerOrder.commission_amount || 0;
    
    // 获取用户当前余额
    const { data: userData } = await sb
        .from('users')
        .select('balance')
        .eq('uid', uid)
        .single();
    
    const currentBalance = userData?.balance || 0;
    
    // 新余额 = 当前余额 + 订单价格 + 佣金
    const newBalance = currentBalance + matchedPrice + commission;
    
    // 更新余额
    const { error: balanceError } = await sb
        .from('users')
        .update({ balance: newBalance })
        .eq('uid', uid);
    
    if (balanceError) {
        console.error('更新余额失败:', balanceError);
        return false;
    }
    
    // 标记触发订单为已完成
    const { error: updateError } = await sb
        .from('user_trigger_orders')
        .update({
            status: 'completed',
            completed_at: new Date().toISOString()
        })
        .eq('id', triggerOrder.id);
    
    if (updateError) {
        console.error('更新触发订单状态失败:', updateError);
        return false;
    }
    
    // 更新本地用户数据
    const localUser = getCurrentUser();
    if (localUser && localUser.uid === uid) {
        localUser.balance = newBalance;
        localStorage.setItem('currentUser', JSON.stringify(localUser));
    }
    
    return true;
}

// 取消触发订单（后台用）
async function cancelTriggerOrder(triggerId) {
    const { error } = await sb
        .from('user_trigger_orders')
        .update({ status: 'cancelled' })
        .eq('id', triggerId);
    
    return !error;
}

// ========== 统一菜单控制函数（所有页面共用） ==========
window.toggleMenu = function() { 
    var sidebar = document.getElementById('sidebar'); 
    var overlay = document.getElementById('menuOverlay'); 
    if (sidebar) sidebar.classList.toggle('open');
    if (overlay) overlay.classList.toggle('active');
    if (sidebar && sidebar.classList.contains('open')) {
        document.body.style.overflow = 'hidden';
    } else {
        document.body.style.overflow = '';
    }
};

window.closeMenu = function() { 
    var sidebar = document.getElementById('sidebar'); 
    var overlay = document.getElementById('menuOverlay'); 
    if (sidebar) sidebar.classList.remove('open'); 
    if (overlay) overlay.classList.remove('active');
    document.body.style.overflow = '';
};

// 点击导航链接自动关闭菜单（移动端）
function initNavClickClose() {
    var navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(function(item) {
        item.addEventListener('click', function() {
            if (window.innerWidth <= 768) {
                setTimeout(function() { window.closeMenu(); }, 150);
            }
        });
    });
}

// 页面加载时初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initNavClickClose);
} else {
    initNavClickClose();
}