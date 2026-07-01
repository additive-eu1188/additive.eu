// admin-dashboard.js - 完整版（完全静态，无动画，金属质感 #ccb89f）
let trendChart = null;
let ringChart = null;
let breatheInterval = null;
let pulseInterval = null;
let dashboardRefreshInterval = null;
let dashboardRendered = false;
let cachedData = {
    stats: null,
    chart: null,
    activity: null,
    conversion: null,
    lastStatsTime: 0,
    lastChartTime: 0,
    lastActivityTime: 0,
    lastConversionTime: 0
};
const CACHE_DURATION = 30000;
const DEBOUNCE_DELAY = 300;

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = function() {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

async function loadQuickCards() {
    try {
        var kycRes = await sb.from('kyc_verifications').select('id', { count: 'exact', head: true }).eq('status', 'pending');
        var withdrawalRes = await sb.from('withdrawals').select('id', { count: 'exact', head: true }).eq('status', 'pending');
        var poolRes = await sb.from('orders_pool').select('*', { count: 'exact', head: true });
        var emailRes = await sb.from('email_verification_requests').select('id', { count: 'exact', head: true }).eq('is_verified', false).is('code', null);
        
        var kycEl = document.getElementById('kycPendingCount');
        var withdrawalEl = document.getElementById('withdrawalPendingCount');
        var poolEl = document.getElementById('orderPoolCount');
        var emailEl = document.getElementById('emailPendingCount');
        
        if (kycEl) kycEl.innerText = kycRes.count || 0;
        if (withdrawalEl) withdrawalEl.innerText = withdrawalRes.count || 0;
        if (poolEl) poolEl.innerText = poolRes.count || 0;
        if (emailEl) emailEl.innerText = emailRes.count || 0;
        
        console.log('实时更新: KYC待审核=' + (kycRes.count || 0) + ', 提现待处理=' + (withdrawalRes.count || 0) + ', 待发送Email=' + (emailRes.count || 0));
    } catch (e) { console.error('加载快捷卡片失败:', e); }
}

async function loadStatsData(days, force) {
    force = force || false;
    var now = Date.now();
    if (!force && cachedData.stats && (now - cachedData.lastStatsTime) < CACHE_DURATION) {
        applyStatsData(cachedData.stats);
        return;
    }
    try {
        var usersRes = await sb.from('users').select('created_at, balance');
        
        var depositsRes = await sb.from('deposits')
            .select('created_at, amount')
            .eq('type', 'manual');
        
        var withdrawalsRes = await sb.from('withdrawals').select('request_date, amount, status');
        var users = usersRes.data || [];
        var deposits = depositsRes.data || [];
        var withdrawals = withdrawalsRes.data || [];
        var nowDate = new Date();
        var startDate = new Date(); startDate.setDate(nowDate.getDate() - days);
        var startStr = startDate.toISOString().split('T')[0];
        var lastPeriodStart = new Date(); lastPeriodStart.setDate(nowDate.getDate() - days * 2);
        var lastPeriodStr = lastPeriodStart.toISOString().split('T')[0];
        
        var newUsers = users.filter(function(u) { return u.created_at && u.created_at.split('T')[0] >= startStr; }).length;
        var prevNewUsers = users.filter(function(u) { return u.created_at && u.created_at.split('T')[0] >= lastPeriodStr && u.created_at.split('T')[0] < startStr; }).length;
        var totalDeposit = deposits.reduce(function(s, d) { return s + (d.amount || 0); }, 0);
        var periodDeposit = deposits.filter(function(d) { return d.created_at && d.created_at.split('T')[0] >= startStr; }).reduce(function(s, d) { return s + (d.amount || 0); }, 0);
        var prevPeriodDeposit = deposits.filter(function(d) { return d.created_at && d.created_at.split('T')[0] >= lastPeriodStr && d.created_at.split('T')[0] < startStr; }).reduce(function(s, d) { return s + (d.amount || 0); }, 0);
        var totalWithdraw = withdrawals.filter(function(w) { return w.status === 'approved'; }).reduce(function(s, w) { return s + (w.amount || 0); }, 0);
        var periodWithdraw = withdrawals.filter(function(w) { return w.status === 'approved' && w.request_date && w.request_date.split('T')[0] >= startStr; }).reduce(function(s, w) { return s + (w.amount || 0); }, 0);
        var prevPeriodWithdraw = withdrawals.filter(function(w) { return w.status === 'approved' && w.request_date && w.request_date.split('T')[0] >= lastPeriodStr && w.request_date.split('T')[0] < startStr; }).reduce(function(s, w) { return s + (w.amount || 0); }, 0);
        
        var statsData = { newUsers: newUsers, prevNewUsers: prevNewUsers, totalUsers: users.length, totalDeposit: totalDeposit, periodDeposit: periodDeposit, prevPeriodDeposit: prevPeriodDeposit, totalWithdraw: totalWithdraw, periodWithdraw: periodWithdraw, prevPeriodWithdraw: prevPeriodWithdraw };
        cachedData.stats = statsData;
        cachedData.lastStatsTime = now;
        applyStatsData(statsData);
    } catch (e) { console.error('加载统计数据失败:', e); }
}

function applyStatsData(data) {
    var newUsersEl = document.getElementById('newUsersCount');
    var totalUsersEl = document.getElementById('totalUsersCount');
    var totalDepositEl = document.getElementById('totalDepositCount');
    var totalWithdrawEl = document.getElementById('totalWithdrawCount');
    var newUsersTrendEl = document.getElementById('newUsersTrend');
    var totalDepositTrendEl = document.getElementById('totalDepositTrend');
    var totalWithdrawTrendEl = document.getElementById('totalWithdrawTrend');
    
    if (newUsersEl) animateNumber(newUsersEl, data.newUsers, '', '');
    if (newUsersTrendEl) newUsersTrendEl.innerHTML = getTrendHtml(data.newUsers, data.prevNewUsers);
    if (totalUsersEl) animateNumber(totalUsersEl, data.totalUsers, '', '');
    if (totalDepositEl) animateNumber(totalDepositEl, data.totalDeposit, '€', '');
    if (totalDepositTrendEl) totalDepositTrendEl.innerHTML = getTrendHtml(data.periodDeposit, data.prevPeriodDeposit);
    if (totalWithdrawEl) animateNumber(totalWithdrawEl, data.totalWithdraw, '€', '');
    if (totalWithdrawTrendEl) totalWithdrawTrendEl.innerHTML = getTrendHtml(data.periodWithdraw, data.prevPeriodWithdraw);
}

// ============================================================
// loadChartData - 显示当月 Deposit & Withdrawal 趋势
// ============================================================
async function loadChartData(force) {
    force = force || false;
    var now = Date.now();
    
    // 缓存检查
    if (!force && cachedData.chart && (now - cachedData.lastChartTime) < CACHE_DURATION && trendChart) {
        trendChart.setOption({ 
            xAxis: { data: cachedData.chart.dates }, 
            series: [
                { data: cachedData.chart.depositData },
                { data: cachedData.chart.withdrawData }
            ] 
        });
        return;
    }
    
    try {
        // ============================================================
        // 🔥 查询 deposits (manual + deposit_bonus + card_reward)
        // ============================================================
        var depositsRes = await sb.from('deposits')
            .select('created_at, amount')
            .in('type', ['manual', 'deposit_bonus', 'card_reward']);
            
        var withdrawalsRes = await sb.from('withdrawals')
            .select('request_date, amount, status');
            
        var deposits = depositsRes.data || [];
        var withdrawals = withdrawalsRes.data || [];
        
        // ============================================================
        // 🔥 获取当前月份的第一天和最后一天
        // ============================================================
        var today = new Date();
        var year = today.getFullYear();
        var month = today.getMonth(); // 0 = 1月, 5 = 6月
        var daysInMonth = new Date(year, month + 1, 0).getDate(); // 当月总天数
        var currentDay = today.getDate(); // 当前是几号
        
        // 生成当月所有日期 (1日 到 总天数)
        var dates = [];
        var dateStrMap = {};
        
        for (var day = 1; day <= daysInMonth; day++) {
            var d = new Date(year, month, day);
            var dateStr = d.toISOString().split('T')[0];
            var label = (month + 1) + '/' + day;
            dates.push(label);
            dateStrMap[label] = dateStr;
        }
        
        console.log('📅 当前月份:', year + '-' + String(month + 1).padStart(2, '0'), '总天数:', daysInMonth, '今日:', currentDay);
        
        // ============================================================
        // 🔥 按天汇总数据（仅限本月）
        // ============================================================
        var depositData = [];
        var withdrawData = [];
        
        // 获取本月第一天和最后一天的日期字符串
        var firstDayStr = new Date(year, month, 1).toISOString().split('T')[0];
        var lastDayStr = new Date(year, month + 1, 0).toISOString().split('T')[0];
        
        // 过滤出本月的数据
        var monthDeposits = deposits.filter(function(d) {
            return d.created_at && d.created_at >= firstDayStr && d.created_at <= lastDayStr;
        });
        
        var monthWithdrawals = withdrawals.filter(function(w) {
            return w.status === 'approved' && w.request_date && w.request_date >= firstDayStr && w.request_date <= lastDayStr;
        });
        
        // 按天汇总
        for (var i = 0; i < dates.length; i++) {
            var label = dates[i];
            var dateStr = dateStrMap[label];
            var dayNum = parseInt(label.split('/')[1]);
            
            // 如果日期还没到（未来日期），数据为 null（显示为空）
            // 如果日期已经到了但没有数据，数据为 0（显示在底部）
            if (dayNum > currentDay) {
                // 未来日期：用 null 表示空
                depositData.push(null);
                withdrawData.push(null);
            } else {
                // 过去或今天的日期：计算数据
                var dayDeposit = monthDeposits.filter(function(dep) {
                    return dep.created_at && dep.created_at.split('T')[0] === dateStr;
                }).reduce(function(s, d) { return s + (d.amount || 0); }, 0);
                
                var dayWithdraw = monthWithdrawals.filter(function(w) {
                    return w.request_date && w.request_date.split('T')[0] === dateStr;
                }).reduce(function(s, w) { return s + (w.amount || 0); }, 0);
                
                depositData.push(dayDeposit);
                withdrawData.push(dayWithdraw);
            }
        }
        
        console.log('📊 本月数据汇总完成, 总天数:', dates.length);
        
        cachedData.chart = { dates: dates, depositData: depositData, withdrawData: withdrawData };
        cachedData.lastChartTime = now;
        
        if (trendChart) {
            trendChart.setOption({ 
                xAxis: { data: dates }, 
                series: [
                    { 
                        name: 'Deposit', 
                        data: depositData,
                        connectNulls: false
                    },
                    { 
                        name: 'Withdrawal', 
                        data: withdrawData,
                        connectNulls: false
                    }
                ]
            });
            console.log('📊 D&W Trend 已更新 (本月数据: ' + dates.length + '天)');
        }
    } catch (e) {
        console.error('加载图表数据失败:', e);
    }
}

// ============================================================
// 🔥 loadConversionData - 只统计 Today 注册的用户
// ============================================================
async function loadConversionData(days, force) {
    force = force || false;
    var now = Date.now();
    if (!force && cachedData.conversion && (now - cachedData.lastConversionTime) < CACHE_DURATION) {
        applyConversionData(cachedData.conversion, days);
        return;
    }
    try {
        // ============================================================
        // 🔥 只显示 Today 的数据
        // ============================================================
        var periods = [
            { label: 'Today', days: 0 }
        ];
        
        var result = [];
        var allUsers = await sb.from('users').select('uid, created_at');
        var allDeposits = await sb.from('deposits')
            .select('uid, created_at, amount, type')
            .in('type', ['manual', 'deposit_bonus']);
        
        var users = allUsers.data || [];
        var deposits = allDeposits.data || [];
        
        var depositUsers = {};
        deposits.forEach(function(d) {
            if (d.uid && (d.amount || 0) >= 40) {
                depositUsers[d.uid] = true;
            }
        });
        
        // ============================================================
        // 🔥 只统计今天注册的用户
        // ============================================================
        var today = new Date();
        today.setHours(0, 0, 0, 0);
        var todayStr = today.toISOString().split('T')[0];
        
        var registeredUsers = users.filter(function(u) {
            if (!u.created_at) return false;
            var dateStr = u.created_at.split('T')[0];
            return dateStr === todayStr;
        });
        
        var totalRegister = registeredUsers.length;
        var convertedUsers = registeredUsers.filter(function(u) {
            return depositUsers[u.uid] === true;
        });
        var totalConverted = convertedUsers.length;
        var rate = totalRegister > 0 ? Math.round((totalConverted / totalRegister) * 100) : 0;
        
        result.push({
            label: 'Today',
            days: 0,
            register: totalRegister,
            converted: totalConverted,
            rate: rate
        });
        
        cachedData.conversion = result;
        cachedData.lastConversionTime = now;
        applyConversionData(result, days);
        
    } catch (e) {
        console.error('加载转化率数据失败:', e);
    }
}

// ============================================================
// 🔥 applyConversionData - 只显示 Today，隐藏其他行
// ============================================================
function applyConversionData(data, days) {
    var displayData = data[0] || { label: 'Today', register: 0, converted: 0, rate: 0 };
    
    var ringPercent = document.getElementById('ringPercent');
    if (ringPercent) {
        ringPercent.innerText = displayData.rate + '%';
    }
    
    var registerEl = document.getElementById('conversionRegister');
    var convertedEl = document.getElementById('conversionConverted');
    var labelEl = document.getElementById('conversionLabel');
    
    if (registerEl) registerEl.innerText = displayData.register;
    if (convertedEl) convertedEl.innerText = displayData.converted;
    if (labelEl) {
        labelEl.innerText = 'Today Register';
    }
    
    // 更新列表 - 只显示 Today
    var allLabels = document.querySelectorAll('.conversion-stat-label');
    var allRegisters = document.querySelectorAll('.conversion-stat-register');
    var allConverteds = document.querySelectorAll('.conversion-stat-converted');
    var allRates = document.querySelectorAll('.conversion-stat-rate');
    
    if (allLabels.length > 0) allLabels[0].innerText = 'Today';
    if (allRegisters.length > 0) allRegisters[0].innerText = displayData.register;
    if (allConverteds.length > 0) allConverteds[0].innerText = displayData.converted;
    if (allRates.length > 0) {
        allRates[0].innerText = displayData.rate + '%';
        allRates[0].style.color = displayData.rate >= 50 ? '#ccb89f' : displayData.rate >= 20 ? '#c8b090' : '#e88080';
    }
    
    // 隐藏其他行
    var allRows = document.querySelectorAll('.conversion-stat-row');
    allRows.forEach(function(row, index) {
        if (index === 0) {
            row.style.display = 'flex';
            row.style.background = 'rgba(204,184,159,0.08)';
            row.style.borderRadius = '8px';
            row.style.padding = '3px 6px';
        } else {
            row.style.display = 'none';
        }
    });
}

// ========== 初始化环形进度条（静态金属质感 #ccb89f） ==========
function initWaveRing() {
    var container = document.getElementById('waveRingContainer');
    if (!container) return;
    
    container.innerHTML = '';
    container.style.width = '220px';
    container.style.height = '220px';
    container.style.position = 'relative';
    container.style.margin = '0 auto';
    
    // 使用 SVG 绘制静态金属环形进度条
    var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 220 220');
    svg.style.cssText = 'width:100%;height:100%;transform:rotate(-90deg);position:relative;z-index:2;';
    svg.innerHTML = `
        <defs>
            <linearGradient id="metalGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#3a2a1a"/>
                <stop offset="20%" stop-color="#ccb89f"/>
                <stop offset="40%" stop-color="#b8942a"/>
                <stop offset="55%" stop-color="#e8d5c0"/>
                <stop offset="70%" stop-color="#8a7020"/>
                <stop offset="85%" stop-color="#ccb89f"/>
                <stop offset="100%" stop-color="#2a1a0a"/>
            </linearGradient>
            <linearGradient id="progressGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#ccb89f"/>
                <stop offset="30%" stop-color="#d4c8a0"/>
                <stop offset="60%" stop-color="#e8d5c0"/>
                <stop offset="100%" stop-color="#ccb89f"/>
            </linearGradient>
        </defs>
        <!-- 背景圆环 -->
        <circle cx="110" cy="110" r="95" fill="none" stroke="rgba(204,184,159,0.06)" stroke-width="12"/>
        <!-- 进度圆环（金属质感 #ccb89f） -->
        <circle cx="110" cy="110" r="95" fill="none" stroke="url(#progressGrad)" stroke-width="12" stroke-linecap="round" stroke-dasharray="596.9" stroke-dashoffset="596.9" filter="drop-shadow(0 0 20px rgba(204,184,159,0.15))" class="progress-ring" style="transition: stroke-dashoffset 1s ease;"/>
        <!-- 外圈装饰光晕 -->
        <circle cx="110" cy="110" r="100" fill="none" stroke="rgba(204,184,159,0.03)" stroke-width="1"/>
    `;
    container.appendChild(svg);
    
    // 中心文字（百分比 + 标签）
    var centerText = document.createElement('div');
    centerText.style.cssText = 'position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);text-align:center;pointer-events:none;z-index:10;';
    centerText.innerHTML = `
        <div id="ringPercent" style="font-size:48px;font-weight:900;letter-spacing:-1px;line-height:1;background:linear-gradient(180deg,#ffffff 0%,#d0d8e8 35%,#8892a8 65%,#c0c8d8 100%);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;filter:drop-shadow(0 0 30px rgba(200,210,230,0.12)) drop-shadow(0 4px 8px rgba(0,0,0,0.3));">78%</div>
        <div style="font-size:13px;font-weight:700;letter-spacing:2px;text-transform:uppercase;margin-top:6px;background:linear-gradient(180deg,#d0d8e8 0%,#8892a8 50%,#5a6a82 100%);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;filter:drop-shadow(0 0 20px rgba(200,210,230,0.08)) drop-shadow(0 2px 4px rgba(0,0,0,0.2));">Conversion Rate</div>
    `;
    container.appendChild(centerText);
    
    // 等待数据加载后更新进度
    setTimeout(function() {
        var progressRing = container.querySelector('.progress-ring');
        if (progressRing) {
            var rate = parseInt(document.getElementById('ringPercent')?.innerText || '78');
            var circumference = 596.9;
            var offset = circumference - (circumference * rate / 100);
            progressRing.style.strokeDashoffset = offset;
        }
    }, 300);
}

// ========== 加载最近注册用户数据 ==========
async function loadRecentRegistrations() {
    var tbody = document.getElementById('recentRegistrationsBody');
    if (!tbody) return;
    
    try {
        var usersRes = await sb.from('users')
            .select('uid, username, invited_by_username, created_at, balance')
            .order('created_at', { ascending: false })
            .limit(9);
        
        var users = usersRes.data || [];
        
        if (users.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 20px; color: #4a5a72; font-size: 12px;">No users yet</td></tr>';
            return;
        }
        
        var uids = users.map(function(u) { return u.uid; });
        var { data: deposits } = await sb
            .from('deposits')
            .select('uid, amount')
            .eq('type', 'manual')
            .in('uid', uids);
        
        var manualDepositMap = {};
        if (deposits) {
            deposits.forEach(function(d) {
                manualDepositMap[d.uid] = (manualDepositMap[d.uid] || 0) + (d.amount || 0);
            });
        }
        
        var html = '';
        for (var i = 0; i < users.length; i++) {
            var u = users[i];
            var referrer = u.invited_by_username || '-';
            
            var totalManual = manualDepositMap[u.uid] || 0;
            var hasManualDeposit = totalManual >= 40;
            var joinedMembership = hasManualDeposit ? '✅ Yes' : '❌ No';
            
            var amount = totalManual > 0 ? '€' + totalManual.toFixed(2) : '€0.00';
            
            html += '<tr style="border-bottom: 1px solid rgba(200,176,144,0.03);">' +
                '<td style="padding: 4px 6px; color: #d8dff0; font-weight: 500;">' + escapeHtml(u.username) + '</td>' +
                '<td style="padding: 4px 6px; color: #8892a8;">' + escapeHtml(referrer) + '</td>' +
                '<td style="padding: 4px 6px; text-align: center; color: ' + (hasManualDeposit ? '#ccb89f' : '#5a4a2a') + ';">' + joinedMembership + '</td>' +
                '<td style="padding: 4px 6px; text-align: right; color: ' + (totalManual > 0 ? '#ccb89f' : '#4a5a72') + '; font-weight: 600;">' + amount + '</td>' +
                '</tr>';
        }
        tbody.innerHTML = html;
        
    } catch (e) {
        console.error('加载最近注册用户失败:', e);
        tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 16px; color: #e88080; font-size: 12px;">Failed to load</td></tr>';
    }
}

async function loadActivityTimeline(force) {
    force = force || false;
    var now = Date.now();
    if (!force && cachedData.activity && (now - cachedData.lastActivityTime) < CACHE_DURATION) {
        renderActivityList(cachedData.activity);
        return;
    }
    try {
        console.log('🔄 加载实时活动...');
        
        var kycRes = await sb.from('kyc_verifications').select('*').order('uploaded_at', { ascending: false }).limit(30);
        var withdrawalRes = await sb.from('withdrawals').select('*').order('request_date', { ascending: false }).limit(30);
        var userRes = await sb.from('users').select('*').order('created_at', { ascending: false }).limit(30);
        var emailRes = await sb.from('email_verification_requests').select('*').order('requested_at', { ascending: false }).limit(30);
        
        var kycList = kycRes.data || [];
        var withdrawalList = withdrawalRes.data || [];
        var userList = userRes.data || [];
        var emailList = emailRes.data || [];
        
        console.log('📊 数据统计: KYC=' + kycList.length + ', 提现=' + withdrawalList.length + ', 用户=' + userList.length + ', 邮箱=' + emailList.length);
        
        var activities = [];
        
        for (var k = 0; k < kycList.length; k++) {
            var item = kycList[k];
            var username = item.username || item.uid;
            if (!item.username || item.username === item.uid) {
                var userResult = await sb.from('users').select('username').eq('uid', item.uid).maybeSingle();
                if (userResult.data) username = userResult.data.username;
            }
            
            var statusText = '';
            if (item.status === 'pending') statusText = '待审核';
            else if (item.status === 'approved') statusText = '已通过';
            else if (item.status === 'rejected') statusText = '已拒绝';
            
            activities.push({
                type: 'kyc',
                title: '📋 KYC申请 ' + statusText,
                user: username,
                time: item.uploaded_at || item.created_at,
                icon: 'fas fa-id-card',
                color: '#ccb89f'
            });
        }
        
        for (var w = 0; w < withdrawalList.length; w++) {
            var item = withdrawalList[w];
            var statusText = '';
            if (item.status === 'pending') statusText = '待审核';
            else if (item.status === 'approved') statusText = '已批准';
            else if (item.status === 'rejected') statusText = '已拒绝';
            
            activities.push({
                type: 'withdrawal',
                title: '💰 提现申请 ' + statusText,
                user: item.username,
                amount: '€' + (item.amount || 0).toFixed(2),
                time: item.request_date,
                icon: 'fas fa-money-bill-wave',
                color: '#ccb89f'
            });
        }
        
        for (var u = 0; u < userList.length; u++) {
            var item = userList[u];
            activities.push({
                type: 'user',
                title: '👤 新用户注册',
                user: item.username,
                time: item.created_at,
                icon: 'fas fa-user-plus',
                color: '#ccb89f'
            });
        }
        
        for (var e = 0; e < emailList.length; e++) {
            var item = emailList[e];
            var statusText = '';
            if (item.code && !item.is_verified) statusText = '待验证';
            else if (item.is_verified) statusText = '已验证';
            else statusText = '待设置验证码';
            
            activities.push({
                type: 'email',
                title: '📧 邮箱验证请求 ' + statusText,
                user: item.email,
                time: item.requested_at,
                icon: 'fas fa-envelope',
                color: '#ccb89f'
            });
        }
        
        activities.sort(function(a, b) { return new Date(b.time) - new Date(a.time); });
        
        console.log('📋 生成活动列表: ' + activities.length + ' 条');
        
        cachedData.activity = activities.slice(0, 30);
        cachedData.lastActivityTime = now;
        renderActivityList(activities.slice(0, 15));
        
    } catch (e) {
        console.error('加载活动时间线失败:', e);
    }
}

function renderActivityList(activities) {
    var activityList = document.getElementById('activityList');
    if (!activityList) return;
    
    if (!activities || activities.length === 0) {
        activityList.innerHTML = '<div style="text-align: center; padding: 20px; color: #6a7a9a;">暂无活动</div>';
        return;
    }
    
    var html = '';
    for (var i = 0; i < activities.length; i++) {
        var a = activities[i];
        var amountHtml = '';
        if (a.amount) {
            amountHtml = '<div style="font-size: 11px; color: #ccb89f;">' + a.amount + '</div>';
        }
        html += '<div style="display: flex; align-items: center; gap: 14px; padding: 12px 0; border-bottom: 1px solid rgba(180,180,200,0.04); cursor: pointer;" onclick="handleActivityClick(\'' + a.type + '\')">' +
            '<div style="width: 36px; height: 36px; border-radius: 10px; background: ' + a.color + '15; display: flex; align-items: center; justify-content: center;">' +
            '<i class="' + a.icon + '" style="color: ' + a.color + ';"></i>' +
            '</div>' +
            '<div style="flex: 1;">' +
            '<div style="font-size: 13px; font-weight: 500; color: #d8dff0;">' + escapeHtml(a.title) + '</div>' +
            '<div style="font-size: 11px; color: #8892a8;">' + escapeHtml(a.user) + '</div>' +
            amountHtml +
            '</div>' +
            '<div style="font-size: 10px; color: #5a6a82;">' + formatTime(a.time) + '</div>' +
            '</div>';
    }
    activityList.innerHTML = html;
}

window.handleActivityClick = function(type) {
    if (type === 'kyc') {
        showPage('kyc');
    } else if (type === 'withdrawal') {
        showPage('withdrawals');
    } else if (type === 'email') {
        showPage('emailverify');
    }
};

async function refreshDashboard(days, force) {
    days = days || currentDays;
    force = force || false;
    await Promise.all([
        loadQuickCards(),
        loadStatsData(days, force),
        loadChartData(force),
        loadConversionData(days, force),
        loadActivityTimeline(force),
        loadRecentRegistrations()
    ]);
    
    var ringPercent = document.getElementById('ringPercent');
    if (ringPercent && cachedData.conversion) {
        var targetLabel = 'Today';
        if (days === 7) targetLabel = '7 Days';
        else if (days === 30) targetLabel = '30 Days';
        else if (days === -1) targetLabel = 'All Time';
        var matched = cachedData.conversion.filter(function(d) { return d.label === targetLabel; });
        if (matched.length > 0) {
            var rate = matched[0].rate;
            ringPercent.innerText = rate + '%';
            var container = document.getElementById('waveRingContainer');
            if (container) {
                var progressRing = container.querySelector('.progress-ring');
                if (progressRing) {
                    var circumference = 596.9;
                    var offset = circumference - (circumference * rate / 100);
                    progressRing.style.strokeDashoffset = offset;
                }
            }
        }
    }
}

// ============================================================
// initTrendChart - 细线条 + 小圆点（极简样式）
// ============================================================
function initTrendChart() {
    var dom = document.getElementById('trendChart');
    if (!dom) {
        console.error('trendChart容器不存在');
        return;
    }
    if (trendChart) {
        trendChart.dispose();
        trendChart = null;
    }
    
    console.log('📊 趋势图已加载（当月数据）');
    
    trendChart = echarts.init(dom);
    
    // ✅ 生成当月的默认日期标签
    var defaultDates = [];
    var today = new Date();
    var year = today.getFullYear();
    var month = today.getMonth();
    var daysInMonth = new Date(year, month + 1, 0).getDate();
    
    for (var day = 1; day <= daysInMonth; day++) {
        defaultDates.push((month + 1) + '/' + day);
    }
    
    // 默认数据：过去日期为 0，未来日期为 null
    var currentDay = today.getDate();
    var defaultDepositData = [];
    var defaultWithdrawData = [];
    
    for (var i = 1; i <= daysInMonth; i++) {
        if (i > currentDay) {
            defaultDepositData.push(null);
            defaultWithdrawData.push(null);
        } else {
            defaultDepositData.push(0);
            defaultWithdrawData.push(0);
        }
    }
    
    trendChart.setOption({
        tooltip: { 
            trigger: 'axis', 
            axisPointer: { type: 'line' }, 
            backgroundColor: 'rgba(14,18,30,0.92)', 
            borderColor: 'rgba(180,180,200,0.06)', 
            borderWidth: 1, 
            textStyle: { color: '#d8dff0', fontSize: 11 },
            formatter: function(params) {
                var result = params[0].axisValue + '<br/>';
                var hasData = false;
                params.forEach(function(p) {
                    if (p.value !== null && p.value !== undefined) {
                        result += p.marker + ' ' + p.seriesName + ': €' + p.value.toFixed(2) + '<br/>';
                        hasData = true;
                    }
                });
                if (!hasData) {
                    result += '<span style="color:#5a6a82;">No data for this day</span>';
                }
                return result;
            }
        },
        grid: { 
            top: 16, 
            left: 38, 
            right: 12, 
            bottom: 18, 
            containLabel: false 
        },
        xAxis: { 
            type: 'category', 
            data: defaultDates,
            axisLabel: { 
                color: 'rgba(255,255,255,0.15)', 
                fontSize: 9,
                interval: Math.max(0, Math.floor(defaultDates.length / 30))
            }, 
            axisLine: { lineStyle: { color: 'rgba(255,255,255,0.04)' } }, 
            axisTick: { show: false } 
        },
        yAxis: { 
            type: 'value', 
            name: '', 
            axisLabel: { color: 'rgba(255,255,255,0.10)', fontSize: 8 }, 
            axisLine: { show: false }, 
            axisTick: { show: false }, 
            splitLine: { lineStyle: { color: 'rgba(255,255,255,0.03)', type: 'dashed' } } 
        },
        legend: { show: false },
        series: [
            { 
                name: 'Deposit', 
                type: 'line', 
                data: defaultDepositData,
                smooth: false,
                symbol: 'circle', 
                symbolSize: 3,
                lineStyle: { 
                    color: '#4ade80', 
                    width: 1.5
                }, 
                itemStyle: { color: '#4ade80' },
                connectNulls: false,
                animation: false,
                animationDuration: 0
            },
            { 
                name: 'Withdrawal', 
                type: 'line', 
                data: defaultWithdrawData,
                smooth: false,
                symbol: 'circle', 
                symbolSize: 3,
                lineStyle: { 
                    color: '#e88080', 
                    width: 1.5
                }, 
                itemStyle: { color: '#e88080' },
                connectNulls: false,
                animation: false,
                animationDuration: 0
            }
        ]
    });
    
    console.log('✅ D&W Trend 初始化完成（当月: ' + defaultDates.length + '天）');
    
    if (pulseInterval) {
        clearInterval(pulseInterval);
        pulseInterval = null;
    }
}

function bindDateFilters() {
    var handleFilterChange = debounce(function(btn) {
        document.querySelectorAll('.date-filter-btn').forEach(function(b) { b.classList.remove('active'); });
        btn.classList.add('active');
        var days = parseInt(btn.dataset.days);
        currentDays = days;
        refreshDashboard(days, true);
    }, DEBOUNCE_DELAY);
    document.querySelectorAll('.date-filter-btn').forEach(function(btn) {
        if (btn._handler) btn.removeEventListener('click', btn._handler);
        btn._handler = function() { handleFilterChange(btn); };
        btn.addEventListener('click', btn._handler);
    });
}

function loadDashboardPage(days) {
    days = days || 1;
    var container = document.getElementById('page_dashboard');
    if (!container) return;
    
    if (dashboardRendered) {
        refreshDashboard(currentDays, true);
        return;
    }
    
    dashboardRendered = true;
    
    container.innerHTML = `
        <!-- ========== Notification 按钮 ========== -->
        <div class="notification-container" style="display: flex; justify-content: flex-start; margin-bottom: 16px; position: relative;">
            <div style="position: relative; display: inline-block;">
                <button id="notificationBellBtn" style="background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.06); border-radius: 50%; width: 44px; height: 44px; color: #d8e0f0; cursor: pointer; position: relative; transition: all 0.3s; font-size: 18px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 20px rgba(0,0,0,0.2);">
                    <i class="fas fa-bell"></i>
                    <span id="notificationBadge" style="position: absolute; top: -4px; right: -4px; background: #e88080; color: #fff; border-radius: 50%; font-size: 10px; font-weight: 700; min-width: 18px; height: 18px; display: none; align-items: center; justify-content: center; padding: 0 4px; border: 2px solid rgba(12, 16, 28, 0.8);">0</span>
                </button>
                
                <!-- Notification Dropdown -->
                <div id="notificationDropdown" style="display: none; position: absolute; top: 52px; left: 0; width: 400px; max-height: 500px; background: rgba(16, 20, 34, 0.98); border-radius: 16px; border: 1px solid rgba(255,255,255,0.06); box-shadow: 0 20px 60px rgba(0,0,0,0.6); overflow: hidden; z-index: 1000; backdrop-filter: blur(20px);">
                    <div style="padding: 16px 20px; border-bottom: 1px solid rgba(255,255,255,0.04); display: flex; justify-content: space-between; align-items: center;">
                        <h4 style="font-size: 14px; font-weight: 600; color: #d8e0f0; margin: 0;">
                            <i class="fas fa-bell" style="color: #8892a8; margin-right: 8px;"></i>
                            Notifications
                        </h4>
                        <span id="notificationCount" style="font-size: 11px; color: #6a7a92;">0</span>
                    </div>
                    <div id="notificationList" style="max-height: 350px; overflow-y: auto; padding: 8px 0;">
                        <div style="text-align: center; padding: 40px 20px; color: #6a7a92; font-size: 13px;">
                            <i class="fas fa-inbox" style="display: block; font-size: 28px; color: #4a5a72; margin-bottom: 10px;"></i>
                            No notifications
                        </div>
                    </div>
                    <div style="padding: 12px 20px; border-top: 1px solid rgba(255,255,255,0.04);">
                        <button id="clearAllNotificationsBtn" style="width: 100%; background: rgba(232,128,128,0.06); border: 1px solid rgba(232,128,128,0.08); border-radius: 30px; padding: 8px 0; color: #e88080; font-weight: 500; font-size: 12px; cursor: pointer; transition: all 0.2s; font-family: 'Inter', sans-serif;">
                            <i class="fas fa-trash"></i> Clear All
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <!-- 日期过滤器 -->
        <div style="display: flex; justify-content: flex-end; gap: 10px; margin-bottom: 24px; flex-wrap: wrap;">
            <button class="date-filter-btn active" data-days="1" style="background: linear-gradient(145deg, rgba(20,24,40,0.6), rgba(10,12,24,0.4)); border: 1px solid rgba(180,180,200,0.06); border-radius: 30px; padding: 8px 20px; color: #8892a8; cursor: pointer; transition: all 0.3s; font-size: 13px; font-weight: 500; font-family: 'Inter', sans-serif; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">Today</button>
            <button class="date-filter-btn" data-days="7" style="background: linear-gradient(145deg, rgba(20,24,40,0.6), rgba(10,12,24,0.4)); border: 1px solid rgba(180,180,200,0.06); border-radius: 30px; padding: 8px 20px; color: #8892a8; cursor: pointer; transition: all 0.3s; font-size: 13px; font-weight: 500; font-family: 'Inter', sans-serif; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">7 Days</button>
            <button class="date-filter-btn" data-days="30" style="background: linear-gradient(145deg, rgba(20,24,40,0.6), rgba(10,12,24,0.4)); border: 1px solid rgba(180,180,200,0.06); border-radius: 30px; padding: 8px 20px; color: #8892a8; cursor: pointer; transition: all 0.3s; font-size: 13px; font-weight: 500; font-family: 'Inter', sans-serif; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">30 Days</button>
            <button class="date-filter-btn" data-days="-1" style="background: linear-gradient(145deg, rgba(20,24,40,0.6), rgba(10,12,24,0.4)); border: 1px solid rgba(180,180,200,0.06); border-radius: 30px; padding: 8px 20px; color: #8892a8; cursor: pointer; transition: all 0.3s; font-size: 13px; font-weight: 500; font-family: 'Inter', sans-serif; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">All Time</button>
        </div>
        
        <!-- 快捷卡片 -->
        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 24px;">
            <div onclick="showPage('kyc')" style="background: linear-gradient(145deg, rgba(20,24,40,0.85), rgba(10,12,24,0.6)); border-radius: 16px; padding: 18px 16px; border: 1px solid rgba(180,180,200,0.06); cursor: pointer; transition: all 0.3s; position: relative; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.04);">
                <div style="position: absolute; top: -15%; right: -5%; width: 75%; height: 75%; background: radial-gradient(ellipse at 70% 20%, rgba(255,255,255,0.10), transparent 70%); pointer-events: none; border-radius: 50%;"></div>
                <div style="position: absolute; top: 0; left: 0; right: 0; height: 1px; background: linear-gradient(90deg, transparent, rgba(180,180,200,0.08), transparent);"></div>
                <i class="fas fa-id-card" style="font-size: 22px; color: #ccb89f; margin-bottom: 6px; display: block; position: relative; z-index: 1;"></i>
                <div id="kycPendingCount" style="font-size: 26px; font-weight: 700; color: #ffffff; margin: 2px 0; position: relative; z-index: 1;">0</div>
                <div style="font-size: 11px; color: #8892a8; text-transform: uppercase; letter-spacing: 0.5px; position: relative; z-index: 1;">Pending KYC</div>
            </div>
            <div onclick="showPage('withdrawals')" style="background: linear-gradient(145deg, rgba(20,24,40,0.85), rgba(10,12,24,0.6)); border-radius: 16px; padding: 18px 16px; border: 1px solid rgba(180,180,200,0.06); cursor: pointer; transition: all 0.3s; position: relative; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.04);">
                <div style="position: absolute; top: -15%; right: -5%; width: 75%; height: 75%; background: radial-gradient(ellipse at 70% 20%, rgba(255,255,255,0.10), transparent 70%); pointer-events: none; border-radius: 50%;"></div>
                <div style="position: absolute; top: 0; left: 0; right: 0; height: 1px; background: linear-gradient(90deg, transparent, rgba(180,180,200,0.08), transparent);"></div>
                <i class="fas fa-money-bill-wave" style="font-size: 22px; color: #ccb89f; margin-bottom: 6px; display: block; position: relative; z-index: 1;"></i>
                <div id="withdrawalPendingCount" style="font-size: 26px; font-weight: 700; color: #ffffff; margin: 2px 0; position: relative; z-index: 1;">0</div>
                <div style="font-size: 11px; color: #8892a8; text-transform: uppercase; letter-spacing: 0.5px; position: relative; z-index: 1;">Pending Withdrawals</div>
            </div>
            <div onclick="showPage('emailverify')" style="background: linear-gradient(145deg, rgba(20,24,40,0.85), rgba(10,12,24,0.6)); border-radius: 16px; padding: 18px 16px; border: 1px solid rgba(180,180,200,0.06); cursor: pointer; transition: all 0.3s; position: relative; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.04);">
                <div style="position: absolute; top: -15%; right: -5%; width: 75%; height: 75%; background: radial-gradient(ellipse at 70% 20%, rgba(255,255,255,0.10), transparent 70%); pointer-events: none; border-radius: 50%;"></div>
                <div style="position: absolute; top: 0; left: 0; right: 0; height: 1px; background: linear-gradient(90deg, transparent, rgba(180,180,200,0.08), transparent);"></div>
                <i class="fas fa-envelope" style="font-size: 22px; color: #ccb89f; margin-bottom: 6px; display: block; position: relative; z-index: 1;"></i>
                <div id="emailPendingCount" style="font-size: 26px; font-weight: 700; color: #ffffff; margin: 2px 0; position: relative; z-index: 1;">0</div>
                <div style="font-size: 11px; color: #8892a8; text-transform: uppercase; letter-spacing: 0.5px; position: relative; z-index: 1;">Pending Email</div>
            </div>
            <div onclick="showPage('orderpool')" style="background: linear-gradient(145deg, rgba(20,24,40,0.85), rgba(10,12,24,0.6)); border-radius: 16px; padding: 18px 16px; border: 1px solid rgba(180,180,200,0.06); cursor: pointer; transition: all 0.3s; position: relative; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.04);">
                <div style="position: absolute; top: -15%; right: -5%; width: 75%; height: 75%; background: radial-gradient(ellipse at 70% 20%, rgba(255,255,255,0.10), transparent 70%); pointer-events: none; border-radius: 50%;"></div>
                <div style="position: absolute; top: 0; left: 0; right: 0; height: 1px; background: linear-gradient(90deg, transparent, rgba(180,180,200,0.08), transparent);"></div>
                <i class="fas fa-hotel" style="font-size: 22px; color: #ccb89f; margin-bottom: 6px; display: block; position: relative; z-index: 1;"></i>
                <div id="orderPoolCount" style="font-size: 26px; font-weight: 700; color: #ffffff; margin: 2px 0; position: relative; z-index: 1;">0</div>
                <div style="font-size: 11px; color: #8892a8; text-transform: uppercase; letter-spacing: 0.5px; position: relative; z-index: 1;">Hotel Orders Count</div>
            </div>
        </div>
        
        <!-- 统计卡片 -->
        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 24px;">
            <div style="background: linear-gradient(145deg, rgba(20,24,40,0.85), rgba(10,12,24,0.6)); border-radius: 16px; padding: 18px 20px; border: 1px solid rgba(180,180,200,0.06); transition: all 0.3s; position: relative; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.04);">
                <div style="position: absolute; top: -15%; right: -5%; width: 75%; height: 75%; background: radial-gradient(ellipse at 70% 20%, rgba(255,255,255,0.10), transparent 70%); pointer-events: none; border-radius: 50%;"></div>
                <div style="position: absolute; top: 0; left: 0; right: 0; height: 1px; background: linear-gradient(90deg, transparent, rgba(180,180,200,0.08), transparent);"></div>
                <i class="fas fa-user-plus" style="font-size: 20px; color: #ccb89f; margin-bottom: 4px; display: block; position: relative; z-index: 1;"></i>
                <div id="newUsersCount" style="font-size: 28px; font-weight: 700; color: #ffffff; letter-spacing: -0.5px; position: relative; z-index: 1;">0</div>
                <div style="font-size: 11px; color: #8892a8; text-transform: uppercase; letter-spacing: 0.5px; margin-top: 2px; position: relative; z-index: 1;">New Registered Today</div>
                <div id="newUsersTrend" style="font-size: 10px; margin-top: 4px; position: relative; z-index: 1;"></div>
            </div>
            <div style="background: linear-gradient(145deg, rgba(20,24,40,0.85), rgba(10,12,24,0.6)); border-radius: 16px; padding: 18px 20px; border: 1px solid rgba(180,180,200,0.06); transition: all 0.3s; position: relative; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.04);">
                <div style="position: absolute; top: -15%; right: -5%; width: 75%; height: 75%; background: radial-gradient(ellipse at 70% 20%, rgba(255,255,255,0.10), transparent 70%); pointer-events: none; border-radius: 50%;"></div>
                <div style="position: absolute; top: 0; left: 0; right: 0; height: 1px; background: linear-gradient(90deg, transparent, rgba(180,180,200,0.08), transparent);"></div>
                <i class="fas fa-users" style="font-size: 20px; color: #ccb89f; margin-bottom: 4px; display: block; position: relative; z-index: 1;"></i>
                <div id="totalUsersCount" style="font-size: 28px; font-weight: 700; color: #ffffff; letter-spacing: -0.5px; position: relative; z-index: 1;">0</div>
                <div style="font-size: 11px; color: #8892a8; text-transform: uppercase; letter-spacing: 0.5px; margin-top: 2px; position: relative; z-index: 1;">Total Users</div>
                <div id="totalUsersTrend" style="font-size: 10px; margin-top: 4px; position: relative; z-index: 1;"></div>
            </div>
            <div style="background: linear-gradient(145deg, rgba(20,24,40,0.85), rgba(10,12,24,0.6)); border-radius: 16px; padding: 18px 20px; border: 1px solid rgba(180,180,200,0.06); transition: all 0.3s; position: relative; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.04);">
                <div style="position: absolute; top: -15%; right: -5%; width: 75%; height: 75%; background: radial-gradient(ellipse at 70% 20%, rgba(255,255,255,0.10), transparent 70%); pointer-events: none; border-radius: 50%;"></div>
                <div style="position: absolute; top: 0; left: 0; right: 0; height: 1px; background: linear-gradient(90deg, transparent, rgba(180,180,200,0.08), transparent);"></div>
                <i class="fas fa-arrow-down" style="font-size: 20px; color: #ccb89f; margin-bottom: 4px; display: block; position: relative; z-index: 1;"></i>
                <div id="totalDepositCount" style="font-size: 28px; font-weight: 700; color: #ffffff; letter-spacing: -0.5px; position: relative; z-index: 1;">€0</div>
                <div style="font-size: 11px; color: #8892a8; text-transform: uppercase; letter-spacing: 0.5px; margin-top: 2px; position: relative; z-index: 1;">Total Deposits</div>
                <div id="totalDepositTrend" style="font-size: 10px; margin-top: 4px; position: relative; z-index: 1;"></div>
            </div>
            <div style="background: linear-gradient(145deg, rgba(20,24,40,0.85), rgba(10,12,24,0.6)); border-radius: 16px; padding: 18px 20px; border: 1px solid rgba(180,180,200,0.06); transition: all 0.3s; position: relative; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.04);">
                <div style="position: absolute; top: -15%; right: -5%; width: 75%; height: 75%; background: radial-gradient(ellipse at 70% 20%, rgba(255,255,255,0.10), transparent 70%); pointer-events: none; border-radius: 50%;"></div>
                <div style="position: absolute; top: 0; left: 0; right: 0; height: 1px; background: linear-gradient(90deg, transparent, rgba(180,180,200,0.08), transparent);"></div>
                <i class="fas fa-arrow-up" style="font-size: 20px; color: #ccb89f; margin-bottom: 4px; display: block; position: relative; z-index: 1;"></i>
                <div id="totalWithdrawCount" style="font-size: 28px; font-weight: 700; color: #ffffff; letter-spacing: -0.5px; position: relative; z-index: 1;">€0</div>
                <div style="font-size: 11px; color: #8892a8; text-transform: uppercase; letter-spacing: 0.5px; margin-top: 2px; position: relative; z-index: 1;">Total Withdrawals</div>
                <div id="totalWithdrawTrend" style="font-size: 10px; margin-top: 4px; position: relative; z-index: 1;"></div>
            </div>
        </div>
        
        <!-- 图表区域 -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 28px;">
            <!-- 趋势图 -->
<div style="background: linear-gradient(145deg, rgba(20,24,40,0.85), rgba(10,12,24,0.6)); backdrop-filter: blur(8px); border-radius: 20px; padding: 20px; border: 1px solid rgba(180,180,200,0.06); box-shadow: 0 4px 20px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.04); position: relative; overflow: hidden;">
    <div style="position: absolute; top: -15%; right: -5%; width: 75%; height: 75%; background: radial-gradient(ellipse at 70% 20%, rgba(255,255,255,0.06), transparent 70%); pointer-events: none; border-radius: 50%;"></div>
    <div style="position: absolute; top: 0; left: 0; right: 0; height: 1px; background: linear-gradient(90deg, transparent, rgba(180,180,200,0.08), transparent);"></div>
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; position: relative; z-index: 1;">
        <div style="font-size: 16px; font-weight: 600; color: #d8dff0;">D&W Trend</div>
    </div>
    <div id="trendChart" style="height: 320px; width: 100%; position: relative; z-index: 1;"></div>
</div>
            
            <!-- 转化率卡片 -->
            <div style="background: linear-gradient(145deg, rgba(20,24,40,0.85), rgba(10,12,24,0.6)); backdrop-filter: blur(8px); border-radius: 20px; padding: 20px; border: 1px solid rgba(180,180,200,0.06); box-shadow: 0 4px 20px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.04); position: relative; overflow: hidden;">
                <div style="position: absolute; top: -15%; right: -5%; width: 75%; height: 75%; background: radial-gradient(ellipse at 70% 20%, rgba(255,255,255,0.06), transparent 70%); pointer-events: none; border-radius: 50%;"></div>
                <div style="position: absolute; top: 0; left: 0; right: 0; height: 1px; background: linear-gradient(90deg, transparent, rgba(180,180,200,0.08), transparent);"></div>
                
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 6px; position: relative; z-index: 1;">
                    <div style="font-size: 15px; font-weight: 600; color: #d8dff0;">📈 New Orders Conversion Rate</div>
                    <div style="text-align: right;">
                        <div style="font-size: 10px; color: #6a5a3a; letter-spacing: 0.5px;">
                            <span style="color: #8892a8;">Today Register</span>
                        </div>
                        <div style="display: flex; align-items: baseline; gap: 4px; justify-content: flex-end;">
                            <span id="conversionRegister" style="font-size: 22px; font-weight: 700; color: #ccb89f;">0</span>
                            <span style="font-size: 12px; color: #6a5a3a;">/</span>
                            <span id="conversionConverted" style="font-size: 16px; font-weight: 600; color: #d4af37;">0</span>
                            <span style="font-size: 10px; color: #5a4a2a;">converted</span>
                        </div>
                    </div>
                </div>
                
                <div style="display: flex; align-items: stretch; gap: 12px; position: relative; z-index: 1; min-height: 210px;">
                    <div id="waveRingContainer" style="width: 220px; height: 280px; flex-shrink: 0; position: relative; align-self: center;"></div>
                    
                    <div style="flex: 1; min-width: 0; display: flex; flex-direction: column; justify-content: space-between; gap: 0px;">
                        <div style="border-top: 1px solid rgba(200,176,144,0.06); padding-top: 8px;">
                            <div class="conversion-stat-row" style="display: flex; justify-content: space-between; padding: 2px 0; font-size: 11px; color: #6a7a92;">
                                <span class="conversion-stat-label">Today</span>
                                <span><span class="conversion-stat-register">0</span> / <span class="conversion-stat-converted">0</span></span>
                                <span class="conversion-stat-rate" style="font-weight: 600;">0%</span>
                            </div>
                            <div class="conversion-stat-row" style="display: flex; justify-content: space-between; padding: 2px 0; font-size: 11px; color: #6a7a92;">
                                <span class="conversion-stat-label">7 Days</span>
                                <span><span class="conversion-stat-register">0</span> / <span class="conversion-stat-converted">0</span></span>
                                <span class="conversion-stat-rate" style="font-weight: 600;">0%</span>
                            </div>
                            <div class="conversion-stat-row" style="display: flex; justify-content: space-between; padding: 2px 0; font-size: 11px; color: #6a7a92;">
                                <span class="conversion-stat-label">30 Days</span>
                                <span><span class="conversion-stat-register">0</span> / <span class="conversion-stat-converted">0</span></span>
                                <span class="conversion-stat-rate" style="font-weight: 600;">0%</span>
                            </div>
                            <div class="conversion-stat-row" style="display: flex; justify-content: space-between; padding: 2px 0; font-size: 11px; color: #6a7a92;">
                                <span class="conversion-stat-label">All Time</span>
                                <span><span class="conversion-stat-register">0</span> / <span class="conversion-stat-converted">0</span></span>
                                <span class="conversion-stat-rate" style="font-weight: 600;">0%</span>
                            </div>
                        </div>
                        
                        <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid rgba(200,176,144,0.06);">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2px;">
                                <div style="font-size: 9px; color: #5a4a2a; font-weight: 500; letter-spacing: 0.5px; text-transform: uppercase;">
                                    <i class="fas fa-users" style="color: #ccb89f; margin-right: 4px; font-size: 9px;"></i>Recent
                                </div>
                                <a href="#" onclick="showPage('users'); return false;" style="font-size: 8px; color: #4a3a2a; text-decoration: none; transition: 0.2s;" onmouseover="this.style.color='#ccb89f'" onmouseout="this.style.color='#4a3a2a'">View All →</a>
                            </div>
                            <div style="overflow-y: auto; max-height: 155px;">
                                <table style="width: 100%; border-collapse: collapse; font-size: 10px;">
                                    <thead>
                                        <tr style="border-bottom: 1px solid rgba(200,176,144,0.04); position: sticky; top: 0; background: rgba(20,24,40,0.9); z-index: 2;">
                                            <th style="text-align: left; padding: 2px 4px; color: #4a3a2a; font-weight: 500; font-size: 8px; text-transform: uppercase; letter-spacing: 0.3px;">User</th>
                                            <th style="text-align: left; padding: 2px 4px; color: #4a3a2a; font-weight: 500; font-size: 8px; text-transform: uppercase; letter-spacing: 0.3px;">Ref</th>
                                            <th style="text-align: center; padding: 2px 4px; color: #4a3a2a; font-weight: 500; font-size: 8px; text-transform: uppercase; letter-spacing: 0.3px;">Joined</th>
                                            <th style="text-align: right; padding: 2px 4px; color: #4a3a2a; font-weight: 500; font-size: 8px; text-transform: uppercase; letter-spacing: 0.3px;">Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody id="recentRegistrationsBody">
                                        <tr><td colspan="4" style="text-align: center; padding: 8px; color: #4a5a72; font-size: 10px;">Loading...</td></tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- 实时活动 -->
        <div style="background: linear-gradient(145deg, rgba(20,24,40,0.85), rgba(10,12,24,0.6)); backdrop-filter: blur(8px); border-radius: 20px; padding: 20px; border: 1px solid rgba(180,180,200,0.06); box-shadow: 0 4px 20px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.04); position: relative; overflow: hidden;">
            <div style="position: absolute; top: -15%; right: -5%; width: 75%; height: 75%; background: radial-gradient(ellipse at 70% 20%, rgba(255,255,255,0.06), transparent 70%); pointer-events: none; border-radius: 50%;"></div>
            <div style="position: absolute; top: 0; left: 0; right: 0; height: 1px; background: linear-gradient(90deg, transparent, rgba(180,180,200,0.08), transparent);"></div>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; position: relative; z-index: 1;">
                <div style="font-size: 16px; font-weight: 600; color: #d8dff0;"><i class="fas fa-history" style="color: #8892a8; margin-right: 8px;"></i>Real-Time Event</div>
                <div style="font-size: 11px; color: #ccb89f;"><i class="fas fa-circle" style="font-size: 8px; margin-right: 4px;"></i>Real-Time Updates</div>
            </div>
            <div id="activityList" style="max-height: 350px; overflow-y: auto; position: relative; z-index: 1;">
                <div style="text-align: center; padding: 20px; color: #6a7a9a;">Loading...</div>
            </div>
        </div>
    `;
    
    var style = document.createElement('style');
    style.textContent = `
        .date-filter-btn.active {
            background: linear-gradient(145deg, rgba(30,40,70,0.8), rgba(20,28,50,0.6)) !important;
            color: #e6edf5 !important;
            border-color: rgba(180,180,200,0.12) !important;
            box-shadow: 0 2px 12px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.04) !important;
        }
        .date-filter-btn:hover {
            background: linear-gradient(145deg, rgba(24,28,48,0.7), rgba(14,16,28,0.5)) !important;
            color: #e6edf5 !important;
            border-color: rgba(180,180,200,0.10) !important;
        }
        [onclick] > div[style*="linear-gradient"]:hover {
            border-color: rgba(180,180,200,0.12) !important;
            transform: translateY(-3px);
            box-shadow: 0 8px 30px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.06) !important;
        }
        [onclick] > div[style*="linear-gradient"]:hover > div:first-child {
            background: radial-gradient(ellipse at 70% 20%, rgba(255,255,255,0.15), transparent 70%) !important;
        }
        .trend-up { color: #ccb89f; }
        .trend-down { color: #e88080; }
        #activityList::-webkit-scrollbar { width: 3px; }
        #activityList::-webkit-scrollbar-thumb { background: rgba(180,180,200,0.06); border-radius: 4px; }
        #activityList::-webkit-scrollbar-track { background: transparent; }
        .conversion-stat-row:hover {
            background: rgba(204,184,159,0.04);
            border-radius: 6px;
        }
        #recentRegistrationsBody tr:hover td {
            background: rgba(204,184,159,0.04);
        }
        #recentRegistrationsBody td {
            padding: 2px 4px;
        }
        #recentRegistrationsBody::-webkit-scrollbar { width: 3px; }
        #recentRegistrationsBody::-webkit-scrollbar-thumb { background: rgba(204,184,159,0.12); border-radius: 4px; }
        .notification-item:hover {
            background: rgba(255,255,255,0.06) !important;
            border-color: rgba(204,184,159,0.2) !important;
        }
        #notificationList::-webkit-scrollbar {
            width: 4px;
        }
        #notificationList::-webkit-scrollbar-thumb {
            background: rgba(204,184,159,0.15);
            border-radius: 4px;
        }
        #notificationList::-webkit-scrollbar-track {
            background: transparent;
        }
    `;
    document.head.appendChild(style);
    
    setTimeout(function() {
        initTrendChart();
        bindDateFilters();
        initWaveRing();
        refreshDashboard(days, true);
        initNotificationEvents();
    }, 200);
    
    if (dashboardRefreshInterval) clearInterval(dashboardRefreshInterval);
    dashboardRefreshInterval = setInterval(function() { refreshDashboard(currentDays, false); }, 15000);
}

window.loadDashboardPage = loadDashboardPage;
window.refreshDashboardData = function(days) {
    refreshDashboard(days || currentDays, true);
};

// ============================================================
// 辅助函数（如果不存在则定义）
// ============================================================
if (typeof escapeHtml !== 'function') {
    window.escapeHtml = function(str) {
        if (!str) return '';
        return String(str).replace(/[&<>]/g, function(m) {
            if (m === '&') return '&amp;';
            if (m === '<') return '&lt;';
            if (m === '>') return '&gt;';
            return m;
        });
    };
}

if (typeof formatTime !== 'function') {
    window.formatTime = function(timestamp) {
        if (!timestamp) return '-';
        try {
            var date = new Date(timestamp);
            var now = new Date();
            var diff = Math.floor((now - date) / 1000);
            
            if (diff < 60) return 'Just now';
            if (diff < 3600) return Math.floor(diff / 60) + 'm ago';
            if (diff < 86400) return Math.floor(diff / 3600) + 'h ago';
            if (diff < 172800) return 'Yesterday';
            
            var month = String(date.getMonth() + 1).padStart(2, '0');
            var day = String(date.getDate()).padStart(2, '0');
            var year = date.getFullYear();
            var hours = String(date.getHours()).padStart(2, '0');
            var minutes = String(date.getMinutes()).padStart(2, '0');
            return month + '/' + day + '/' + year + ' ' + hours + ':' + minutes;
        } catch (e) {
            return '-';
        }
    };
}

// ============================================================
// 🔥 Notification 事件绑定（使用 admin-common.js 中的函数）
// ============================================================
function initNotificationEvents() {
    var bellBtn = document.getElementById('notificationBellBtn');
    var dropdown = document.getElementById('notificationDropdown');
    var clearBtn = document.getElementById('clearAllNotificationsBtn');

    if (bellBtn) {
        bellBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            if (dropdown.style.display === 'block') {
                dropdown.style.display = 'none';
            } else {
                dropdown.style.display = 'block';
                if (typeof updateNotificationUI === 'function') {
                    updateNotificationUI();
                }
            }
        });
    }

    document.addEventListener('click', function(e) {
        var container = document.querySelector('.notification-container');
        if (container && !container.contains(e.target) && dropdown) {
            dropdown.style.display = 'none';
        }
    });

    if (clearBtn) {
        clearBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            if (typeof showConfirm === 'function') {
                showConfirm('Clear All Notifications', 'Are you sure you want to clear all notifications?', function() {
                    if (typeof window.clearAllNotifications === 'function') {
                        window.clearAllNotifications();
                    }
                });
            } else {
                if (typeof window.clearAllNotifications === 'function') {
                    window.clearAllNotifications();
                }
            }
        });
    }
}