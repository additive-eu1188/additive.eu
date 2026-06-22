// user-data.js - 所有页面共享的用户数据管理

const SUPABASE_URL = 'https://qgmbzdfnwsdosdqphlxk.supabase.co';
const SUPABASE_KEY = 'sb_publishable_zsJFjfNUO7NKp8ZH5KrXFQ_WZ8Q2Kym';
const sb = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// 获取当前登录用户
function getCurrentUser() {
    const userStr = localStorage.getItem('currentUser');
    if (!userStr) return null;
    try {
        const user = JSON.parse(userStr);
        // 确保所有字段存在
        if (user.creditScore === undefined) user.creditScore = 100;
        if (user.currentRound === undefined) user.currentRound = 0;
        if (user.roundOrdersCount === undefined) user.roundOrdersCount = 0;
        if (user.isPremium === undefined) user.isPremium = false;
        if (user.totalRoundsCompleted === undefined) user.totalRoundsCompleted = 0;
        return user;
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
        user.pin = freshData.pin || '';
        user.inviteCode = freshData.invite_code || '';
        user.creditScore = freshData.credit_score || 100;
        // Round 相关字段
        user.currentRound = freshData.current_round || 0;
        user.roundOrdersCount = freshData.round_orders_count || 0;
        user.isPremium = freshData.is_premium || false;
        user.totalRoundsCompleted = freshData.total_rounds_completed || 0;
        user.lastRoundResetDate = freshData.last_round_reset_date || null;
        user.amountDueRound = freshData.amount_due_round || 0;
        user.amountDueOrdersCount = freshData.amount_due_orders_count || 0;
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

// 更新用户 Round 数据
async function updateUserRound(uid, currentRound, roundOrdersCount, totalRoundsCompleted = null) {
    const updateData = {
        current_round: currentRound,
        round_orders_count: roundOrdersCount
    };
    if (totalRoundsCompleted !== null) {
        updateData.total_rounds_completed = totalRoundsCompleted;
    }
    
    const { error } = await sb
        .from('users')
        .update(updateData)
        .eq('uid', uid);
    
    if (error) {
        console.error('更新 Round 数据失败:', error);
        return false;
    }
    
    const user = getCurrentUser();
    if (user && user.uid === uid) {
        user.currentRound = currentRound;
        user.roundOrdersCount = roundOrdersCount;
        if (totalRoundsCompleted !== null) {
            user.totalRoundsCompleted = totalRoundsCompleted;
        }
        localStorage.setItem('currentUser', JSON.stringify(user));
    }
    return true;
}

// 检查用户是否有 Amount Due
async function checkUserHasAmountDue(uid) {
    const { data, error } = await sb
        .from('users')
        .select('amount_due_round, amount_due_orders_count')
        .eq('uid', uid)
        .single();
    
    if (error || !data) return false;
    return data.amount_due_round > 0 || data.amount_due_orders_count > 0;
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

// ========== Round 相关函数 ==========

// 获取用户当前 Round 显示信息
function getUserRoundDisplay(user) {
    if (!user) user = getCurrentUser();
    if (!user) return { round: 0, orders: '0/30', isComplete: false };
    
    const isTrialUser = !user.isPremium;
    const round = user.currentRound || 0;
    const count = user.roundOrdersCount || 0;
    const ordersPerRound = 30;
    
    // Trial 用户：显示 Round 0
    if (isTrialUser && round === 0) {
        return {
            round: 0,
            orders: `${count}/${ordersPerRound}`,
            isComplete: count >= ordersPerRound,
            isTrial: true
        };
    }
    
    // 正式用户
    if (round === 1) {
        return {
            round: 1,
            orders: `${count}/${ordersPerRound}`,
            isComplete: count >= ordersPerRound,
            isTrial: false
        };
    } else if (round === 2) {
        return {
            round: 2,
            orders: `${count}/${ordersPerRound}`,
            isComplete: count >= ordersPerRound,
            isTrial: false
        };
    }
    
    return {
        round: 0,
        orders: `${count}/${ordersPerRound}`,
        isComplete: false,
        isTrial: true
    };
}

// 检查用户是否已完成 Round 2（可以领取签到奖励）
function canClaimSignInBonus(user) {
    if (!user) user = getCurrentUser();
    if (!user) return false;
    
    // Trial 用户不能领取
    if (!user.isPremium) return false;
    
    // 正式用户必须完成 Round 2
    const round = user.currentRound || 0;
    const count = user.roundOrdersCount || 0;
    
    return round === 2 && count >= 30;
}

// 检查用户是否可以提款
function canWithdraw(user) {
    if (!user) user = getCurrentUser();
    if (!user) return false;
    
    // Trial 用户（未充值）：完成30单即可提款
    if (!user.isPremium) {
        return (user.roundOrdersCount || 0) >= 30;
    }
    
    // 正式用户：必须完成 Round 2
    const round = user.currentRound || 0;
    const count = user.roundOrdersCount || 0;
    return round === 2 && count >= 30;
}

// ========== 触发订单相关函数 ==========

// 获取用户待完成的触发订单
// 优先级：claimed（卡牌已翻开）> pending（等待触发）
async function getUserPendingTriggerOrder(uid) {
    // 获取用户当前轮订单数
    const { data: userData, error } = await sb
        .from('users')
        .select('round_orders_count')
        .eq('uid', uid)
        .single();
    
    if (error || !userData) {
        console.error('获取用户 round_orders_count 失败:', error);
        return null;
    }
    
    const currentOrderCount = userData.round_orders_count || 0;
    const nextOrderNumber = currentOrderCount + 1;

    // ============================================================
    // 🔥 第一步：优先查找 claimed 状态的订单（卡牌已翻开，等待用户做单）
    // 不限制 trigger_order_number，只要有 claimed 就返回
    // ============================================================
    const { data: claimedTriggers, error: claimedError } = await sb
        .from('user_trigger_orders')
        .select('*')
        .eq('uid', uid)
        .eq('status', 'claimed')
        .order('trigger_order_number', { ascending: true })
        .limit(1);
    
    if (claimedError) {
        console.error('获取 claimed 触发订单失败:', claimedError);
    }
    
    if (claimedTriggers && claimedTriggers.length > 0) {
        console.log('✅ 找到 claimed 卡牌订单:', claimedTriggers[0].id, 'trigger_order_number:', claimedTriggers[0].trigger_order_number);
        return claimedTriggers[0];
    }

    // ============================================================
    // 🔥 第二步：查找 pending 状态的订单（等待触发的订单）
    // 精确匹配 trigger_order_number = nextOrderNumber
    // ============================================================
    const { data: pendingTriggers, error: pendingError } = await sb
        .from('user_trigger_orders')
        .select('*')
        .eq('uid', uid)
        .eq('status', 'pending')
        .eq('trigger_order_number', nextOrderNumber)
        .limit(1);
    
    if (pendingError) {
        console.error('获取 pending 触发订单失败:', pendingError);
        return null;
    }
    
    if (pendingTriggers && pendingTriggers.length > 0) {
        console.log('✅ 找到 pending 触发订单:', pendingTriggers[0].id, 'trigger_order_number:', pendingTriggers[0].trigger_order_number);
        return pendingTriggers[0];
    }
    
    return null;
}

// 检查用户是否有待完成的触发订单
async function hasPendingTriggerOrder(uid) {
    const trigger = await getUserPendingTriggerOrder(uid);
    return trigger !== null;
}

// 获取触发订单的 Pending 金额
async function getTriggerOrderPendingAmount(uid, currentBalance, triggerOrder) {
    if (!triggerOrder) {
        triggerOrder = await getUserPendingTriggerOrder(uid);
    }
    if (!triggerOrder) return 0;
    const matchedPrice = triggerOrder.matched_price || 0;
    const commission = triggerOrder.commission_amount || 0;
    return currentBalance + matchedPrice + commission;
}

// 完成触发订单
async function completeTriggerOrder(uid, triggerOrder) {
    if (!triggerOrder) return false;
    const matchedPrice = triggerOrder.matched_price || 0;
    const commission = triggerOrder.commission_amount || 0;
    const { data: userData } = await sb
        .from('users')
        .select('balance')
        .eq('uid', uid)
        .single();
    const currentBalance = userData?.balance || 0;
    const newBalance = currentBalance + matchedPrice + commission;
    const { error: balanceError } = await sb
        .from('users')
        .update({ balance: newBalance })
        .eq('uid', uid);
    if (balanceError) {
        console.error('更新余额失败:', balanceError);
        return false;
    }
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
    const localUser = getCurrentUser();
    if (localUser && localUser.uid === uid) {
        localUser.balance = newBalance;
        localStorage.setItem('currentUser', JSON.stringify(localUser));
    }
    return true;
}

// 取消触发订单
async function cancelTriggerOrder(triggerId) {
    const { error } = await sb
        .from('user_trigger_orders')
        .update({ status: 'cancelled' })
        .eq('id', triggerId);
    return !error;
}

// ========== 统一菜单控制函数 ==========
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

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initNavClickClose);
} else {
    initNavClickClose();
}