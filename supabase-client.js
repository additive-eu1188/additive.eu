// supabase-client.js
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

// 替换为你的 Supabase 配置
const SUPABASE_URL = 'https://你的项目.supabase.co';
const SUPABASE_ANON_KEY = '你的anon key';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 用户相关函数
export async function signUp(phone, username, password, inviteCode = '') {
    // 检查用户名是否存在
    const { data: existing } = await supabase
        .from('users')
        .select('username')
        .eq('username', username)
        .single();
    
    if (existing) return { error: 'Username already exists' };
    
    // 生成 UID
    const { data: maxUid } = await supabase
        .from('users')
        .select('uid')
        .order('uid', { ascending: false })
        .limit(1);
    
    let newUid = '100001';
    if (maxUid && maxUid.length > 0) {
        newUid = (parseInt(maxUid[0].uid) + 1).toString();
    }
    
    // 生成邀请码
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let inviteCodeGen = '';
    for (let i = 0; i < 6; i++) {
        inviteCodeGen += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    // 处理邀请码
    let invitedBy = '';
    let invitedByUsername = '';
    if (inviteCode) {
        const { data: inviter } = await supabase
            .from('users')
            .select('uid, username')
            .eq('invite_code', inviteCode)
            .single();
        
        if (inviter) {
            invitedBy = inviter.uid;
            invitedByUsername = inviter.username;
            
            // 给邀请人奖励
            await supabase.rpc('add_referral_bonus', { referrer_uid: inviter.uid });
        }
    }
    
    // 创建用户
    const { data: newUser, error } = await supabase
        .from('users')
        .insert([{
            uid: newUid,
            phone: phone,
            username: username,
            password: password,
            invite_code: inviteCodeGen,
            invited_by: invitedBy,
            invited_by_username: invitedByUsername
        }])
        .select()
        .single();
    
    if (error) return { error: error.message };
    
    return { user: newUser };
}

export async function signIn(username, password) {
    const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('username', username)
        .eq('password', password)
        .single();
    
    if (error) return { error: 'Invalid username or password' };
    
    return { user };
}

export async function getUserBalance(uid) {
    const { data: user, error } = await supabase
        .from('users')
        .select('balance, trial_bonus_amount')
        .eq('uid', uid)
        .single();
    
    if (error) return { balance: 0, trialBonus: 0 };
    return { balance: user.balance, trialBonus: user.trial_bonus_amount };
}

export async function updateUserBalance(uid, newBalance, newTrialBonus) {
    const { error } = await supabase
        .from('users')
        .update({ balance: newBalance, trial_bonus_amount: newTrialBonus })
        .eq('uid', uid);
    
    return { error };
}

export async function getOrders() {
    const { data: orders, error } = await supabase
        .from('orders')
        .select('*')
        .eq('status', 'available');
    
    if (error) return [];
    return orders;
}

export async function addOrderHistory(uid, username, orderCode, accommodationName, price, commission, rating) {
    const { error } = await supabase
        .from('order_history')
        .insert([{
            uid, username, order_code: orderCode,
            accommodation_name: accommodationName, price, commission, rating
        }]);
    
    return { error };
}

export async function getUserOrderHistory(uid) {
    const { data: orders, error } = await supabase
        .from('order_history')
        .select('*')
        .eq('uid', uid)
        .order('created_at', { ascending: false });
    
    if (error) return [];
    return orders;
}

export async function getDepositHistory(uid) {
    const { data: deposits, error } = await supabase
        .from('deposits')
        .select('*')
        .eq('uid', uid)
        .order('created_at', { ascending: false });
    
    if (error) return [];
    return deposits;
}

export async function addDeposit(uid, username, amount, type) {
    const { error } = await supabase
        .from('deposits')
        .insert([{ uid, username, amount, type }]);
    
    // 同时更新用户余额
    const { data: user } = await supabase
        .from('users')
        .select('balance')
        .eq('uid', uid)
        .single();
    
    await supabase
        .from('users')
        .update({ balance: (user?.balance || 0) + amount })
        .eq('uid', uid);
    
    return { error };
}

export async function requestWithdrawal(uid, username, amount, walletAddress) {
    const { error } = await supabase
        .from('withdrawals')
        .insert([{ uid, username, amount, wallet_address: walletAddress }]);
    
    return { error };
}

export async function getVipSettings() {
    const { data: settings, error } = await supabase
        .from('vip_settings')
        .select('*')
        .order('level', { ascending: true });
    
    if (error) return [];
    return settings;
}

export async function getSignInRewards() {
    const { data: rewards, error } = await supabase
        .from('signin_rewards')
        .select('*')
        .order('day', { ascending: true });
    
    if (error) return [];
    return rewards;
}

export async function getAnimatedSettings() {
    const { data: settings, error } = await supabase
        .from('animated_settings')
        .select('*')
        .limit(1)
        .single();
    
    if (error) return { video_url: '', featured_hotels: [] };
    return settings;
}