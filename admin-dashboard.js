// admin-dashboard.js - 金属拉丝质感 + 右上角光晕
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
    lastStatsTime: 0,
    lastChartTime: 0,
    lastActivityTime: 0
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
        var depositsRes = await sb.from('deposits').select('created_at, amount');
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

async function loadChartData(days, force) {
    force = force || false;
    var now = Date.now();
    if (!force && cachedData.chart && (now - cachedData.lastChartTime) < CACHE_DURATION && trendChart) {
        trendChart.setOption({ xAxis: { data: cachedData.chart.dates }, series: [{ data: cachedData.chart.depositData }, { data: cachedData.chart.withdrawData }] });
        return;
    }
    try {
        var depositsRes = await sb.from('deposits').select('created_at, amount');
        var withdrawalsRes = await sb.from('withdrawals').select('request_date, amount, status');
        var deposits = depositsRes.data || [];
        var withdrawals = withdrawalsRes.data || [];
        var dates = [], depositData = [], withdrawData = [];
        var today = new Date();
        for (var i = days - 1; i >= 0; i--) {
            var d = new Date(); d.setDate(today.getDate() - i);
            var dateStr = d.toISOString().split('T')[0];
            dates.push((d.getMonth() + 1) + '/' + d.getDate());
            var dayDeposit = deposits.filter(function(dep) { return dep.created_at && dep.created_at.split('T')[0] === dateStr; }).reduce(function(s, d) { return s + (d.amount || 0); }, 0);
            var dayWithdraw = withdrawals.filter(function(w) { return w.status === 'approved' && w.request_date && w.request_date.split('T')[0] === dateStr; }).reduce(function(s, w) { return s + (w.amount || 0); }, 0);
            depositData.push(dayDeposit);
            withdrawData.push(dayWithdraw);
        }
        cachedData.chart = { dates: dates, depositData: depositData, withdrawData: withdrawData };
        cachedData.lastChartTime = now;
        if (trendChart) {
            trendChart.setOption({ 
                xAxis: { data: dates }, 
                series: [
                    { name: '入金', data: depositData },
                    { name: '出金', data: withdrawData }
                ]
            });
            console.log('趋势线图已更新');
        }
    } catch (e) { console.error('加载图表数据失败:', e); }
}

async function loadRingData() {
    try {
        var usersResult = await sb.from('users').select('uid');
        var users = usersResult.data;
        if (!users || users.length === 0) return;
        
        var completed30Orders = 0;
        var batchSize = 50;
        for (var i = 0; i < users.length; i += batchSize) {
            var batch = users.slice(i, i + batchSize);
            var promises = batch.map(function(user) { return sb.from('order_history').select('id', { count: 'exact', head: true }).eq('uid', user.uid); });
            var results = await Promise.all(promises);
            completed30Orders += results.filter(function(r) { return (r.count || 0) >= 30; }).length;
        }
        var rate = Math.round((completed30Orders / users.length) * 100);
        var percentEl = document.getElementById('ringPercent');
        if (percentEl) percentEl.innerText = rate + '%';
        
        if (ringChart) {
            ringChart.setOption({ series: [{ data: [{ value: rate }, { value: 100 - rate }] }] });
        }
    } catch (e) { console.error('加载环形图数据失败:', e); }
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
                color: '#c8b090'
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
                color: '#c8b090'
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
                color: '#c8b090'
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
                color: '#c8b090'
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
            amountHtml = '<div style="font-size: 11px; color: #7ad0b0;">' + a.amount + '</div>';
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
        loadChartData(days, force),
        loadRingData(),
        loadActivityTimeline(force)
    ]);
}

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
    trendChart = echarts.init(dom);
    trendChart.setOption({
        tooltip: { 
            trigger: 'axis', 
            axisPointer: { type: 'shadow' }, 
            backgroundColor: 'rgba(14,18,30,0.95)', 
            borderColor: 'rgba(180,180,200,0.06)', 
            borderWidth: 1, 
            textStyle: { color: '#d8dff0' } 
        },
        legend: { data: ['入金', '出金'], textStyle: { color: '#8892a8' }, right: 10, top: 0 },
        grid: { top: 50, left: 60, right: 40, bottom: 30, containLabel: true },
        xAxis: { 
            type: 'category', 
            data: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'], 
            axisLabel: { color: '#8892a8' }, 
            axisLine: { lineStyle: { color: 'rgba(180,180,200,0.04)' } }, 
            axisTick: { show: false } 
        },
        yAxis: { 
            type: 'value', 
            name: '金额 (€)', 
            nameTextStyle: { color: '#8892a8' }, 
            axisLabel: { color: '#8892a8' }, 
            splitLine: { lineStyle: { color: 'rgba(180,180,200,0.03)', type: 'dashed' } } 
        },
        series: [
            { 
                name: '入金', 
                type: 'line', 
                data: [0, 0, 0, 0, 0, 0, 0], 
                smooth: true, 
                symbol: 'circle', 
                symbolSize: 6,
                lineStyle: { color: '#7ad0b0', width: 3, shadowBlur: 10, shadowColor: '#7ad0b030' }, 
                areaStyle: { opacity: 0.25, color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{ offset: 0, color: '#7ad0b0' }, { offset: 1, color: 'transparent' }]) } 
            },
            { 
                name: '出金', 
                type: 'line', 
                data: [0, 0, 0, 0, 0, 0, 0], 
                smooth: true, 
                symbol: 'circle', 
                symbolSize: 6,
                lineStyle: { color: '#e88080', width: 3, shadowBlur: 10, shadowColor: '#e8808030' }, 
                areaStyle: { opacity: 0.25, color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{ offset: 0, color: '#e88080' }, { offset: 1, color: 'transparent' }]) } 
            }
        ]
    });
    
    console.log('趋势线图初始化完成');
    
    if (pulseInterval) clearInterval(pulseInterval);
    var pulseOpacity = 0.3, pulseDirection = 0.006;
    pulseInterval = setInterval(function() {
        pulseOpacity += pulseDirection;
        if (pulseOpacity >= 0.5) pulseDirection = -0.006;
        if (pulseOpacity <= 0.2) pulseDirection = 0.006;
        if (trendChart) {
            trendChart.setOption({
                series: [
                    { lineStyle: { shadowBlur: 12 + (1 - pulseOpacity) * 10 }, areaStyle: { opacity: 0.15 + pulseOpacity * 0.15 } },
                    { lineStyle: { shadowBlur: 12 + (1 - pulseOpacity) * 10 }, areaStyle: { opacity: 0.15 + pulseOpacity * 0.15 } }
                ]
            });
        }
    }, 200);
}

function initRingChart() {
    var dom = document.getElementById('ringChart');
    if (!dom) {
        console.error('ringChart容器不存在');
        return;
    }
    
    dom.innerHTML = '';
    dom.style.height = '220px';
    dom.style.width = '100%';
    
    if (ringChart) {
        try {
            ringChart.dispose();
        } catch(e) {}
        ringChart = null;
    }
    
    ringChart = echarts.init(dom);
    ringChart.setOption({
        tooltip: { show: false },
        series: [{
            type: 'pie',
            radius: ['55%', '75%'],
            center: ['50%', '50%'],
            data: [
                { value: 0, name: '完成', itemStyle: { color: '#8ab4f0', borderRadius: 8 } },
                { value: 100, name: '剩余', itemStyle: { color: 'rgba(180,180,200,0.03)', borderRadius: 8 } }
            ],
            label: { show: false },
            startAngle: 90,
            animation: true
        }]
    });
    
    console.log('环形图初始化成功');
}

function bindDateFilters() {
    var handleFilterChange = debounce(function(btn) {
        document.querySelectorAll('.date-filter-btn').forEach(function(b) { b.classList.remove('active'); });
        btn.classList.add('active');
        currentDays = parseInt(btn.dataset.days);
        refreshDashboard(currentDays, true);
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
        <!-- 日期筛选按钮 -->
        <div style="display: flex; justify-content: flex-end; gap: 10px; margin-bottom: 24px; flex-wrap: wrap;">
            <button class="date-filter-btn active" data-days="1" style="background: linear-gradient(145deg, rgba(20,24,40,0.6), rgba(10,12,24,0.4)); border: 1px solid rgba(180,180,200,0.06); border-radius: 30px; padding: 8px 20px; color: #8892a8; cursor: pointer; transition: all 0.3s; font-size: 13px; font-weight: 500; font-family: 'Inter', sans-serif; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">Today</button>
            <button class="date-filter-btn" data-days="7" style="background: linear-gradient(145deg, rgba(20,24,40,0.6), rgba(10,12,24,0.4)); border: 1px solid rgba(180,180,200,0.06); border-radius: 30px; padding: 8px 20px; color: #8892a8; cursor: pointer; transition: all 0.3s; font-size: 13px; font-weight: 500; font-family: 'Inter', sans-serif; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">7 Days</button>
            <button class="date-filter-btn" data-days="30" style="background: linear-gradient(145deg, rgba(20,24,40,0.6), rgba(10,12,24,0.4)); border: 1px solid rgba(180,180,200,0.06); border-radius: 30px; padding: 8px 20px; color: #8892a8; cursor: pointer; transition: all 0.3s; font-size: 13px; font-weight: 500; font-family: 'Inter', sans-serif; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">30 Days</button>
        </div>
        
        <!-- 快捷卡片 - 金属拉丝质感 + 右上角光晕 -->
        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 24px;">
            <div onclick="showPage('kyc')" style="background: linear-gradient(145deg, rgba(20,24,40,0.85), rgba(10,12,24,0.6)); border-radius: 16px; padding: 18px 16px; border: 1px solid rgba(180,180,200,0.06); cursor: pointer; transition: all 0.3s; position: relative; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.04);">
                <div style="position: absolute; top: -15%; right: -5%; width: 75%; height: 75%; background: radial-gradient(ellipse at 70% 20%, rgba(255,255,255,0.10), transparent 70%); pointer-events: none; border-radius: 50%;"></div>
                <div style="position: absolute; top: 0; left: 0; right: 0; height: 1px; background: linear-gradient(90deg, transparent, rgba(180,180,200,0.08), transparent);"></div>
                <i class="fas fa-id-card" style="font-size: 22px; color: #c8b090; margin-bottom: 6px; display: block; position: relative; z-index: 1;"></i>
                <div id="kycPendingCount" style="font-size: 26px; font-weight: 700; color: #ffffff; margin: 2px 0; position: relative; z-index: 1;">0</div>
                <div style="font-size: 11px; color: #8892a8; text-transform: uppercase; letter-spacing: 0.5px; position: relative; z-index: 1;">Pending KYC</div>
                <div style="position: absolute; bottom: 8px; right: 12px; font-size: 48px; color: rgba(180,180,200,0.02); pointer-events: none;"><i class="fas fa-id-card"></i></div>
            </div>
            <div onclick="showPage('withdrawals')" style="background: linear-gradient(145deg, rgba(20,24,40,0.85), rgba(10,12,24,0.6)); border-radius: 16px; padding: 18px 16px; border: 1px solid rgba(180,180,200,0.06); cursor: pointer; transition: all 0.3s; position: relative; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.04);">
                <div style="position: absolute; top: -15%; right: -5%; width: 75%; height: 75%; background: radial-gradient(ellipse at 70% 20%, rgba(255,255,255,0.10), transparent 70%); pointer-events: none; border-radius: 50%;"></div>
                <div style="position: absolute; top: 0; left: 0; right: 0; height: 1px; background: linear-gradient(90deg, transparent, rgba(180,180,200,0.08), transparent);"></div>
                <i class="fas fa-money-bill-wave" style="font-size: 22px; color: #c8b090; margin-bottom: 6px; display: block; position: relative; z-index: 1;"></i>
                <div id="withdrawalPendingCount" style="font-size: 26px; font-weight: 700; color: #ffffff; margin: 2px 0; position: relative; z-index: 1;">0</div>
                <div style="font-size: 11px; color: #8892a8; text-transform: uppercase; letter-spacing: 0.5px; position: relative; z-index: 1;">Pending Withdrawals</div>
                <div style="position: absolute; bottom: 8px; right: 12px; font-size: 48px; color: rgba(180,180,200,0.02); pointer-events: none;"><i class="fas fa-money-bill-wave"></i></div>
            </div>
            <div onclick="showPage('emailverify')" style="background: linear-gradient(145deg, rgba(20,24,40,0.85), rgba(10,12,24,0.6)); border-radius: 16px; padding: 18px 16px; border: 1px solid rgba(180,180,200,0.06); cursor: pointer; transition: all 0.3s; position: relative; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.04);">
                <div style="position: absolute; top: -15%; right: -5%; width: 75%; height: 75%; background: radial-gradient(ellipse at 70% 20%, rgba(255,255,255,0.10), transparent 70%); pointer-events: none; border-radius: 50%;"></div>
                <div style="position: absolute; top: 0; left: 0; right: 0; height: 1px; background: linear-gradient(90deg, transparent, rgba(180,180,200,0.08), transparent);"></div>
                <i class="fas fa-envelope" style="font-size: 22px; color: #c8b090; margin-bottom: 6px; display: block; position: relative; z-index: 1;"></i>
                <div id="emailPendingCount" style="font-size: 26px; font-weight: 700; color: #ffffff; margin: 2px 0; position: relative; z-index: 1;">0</div>
                <div style="font-size: 11px; color: #8892a8; text-transform: uppercase; letter-spacing: 0.5px; position: relative; z-index: 1;">Pending Email</div>
                <div style="position: absolute; bottom: 8px; right: 12px; font-size: 48px; color: rgba(180,180,200,0.02); pointer-events: none;"><i class="fas fa-envelope"></i></div>
            </div>
            <div onclick="showPage('orderpool')" style="background: linear-gradient(145deg, rgba(20,24,40,0.85), rgba(10,12,24,0.6)); border-radius: 16px; padding: 18px 16px; border: 1px solid rgba(180,180,200,0.06); cursor: pointer; transition: all 0.3s; position: relative; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.04);">
                <div style="position: absolute; top: -15%; right: -5%; width: 75%; height: 75%; background: radial-gradient(ellipse at 70% 20%, rgba(255,255,255,0.10), transparent 70%); pointer-events: none; border-radius: 50%;"></div>
                <div style="position: absolute; top: 0; left: 0; right: 0; height: 1px; background: linear-gradient(90deg, transparent, rgba(180,180,200,0.08), transparent);"></div>
                <i class="fas fa-hotel" style="font-size: 22px; color: #c8b090; margin-bottom: 6px; display: block; position: relative; z-index: 1;"></i>
                <div id="orderPoolCount" style="font-size: 26px; font-weight: 700; color: #ffffff; margin: 2px 0; position: relative; z-index: 1;">0</div>
                <div style="font-size: 11px; color: #8892a8; text-transform: uppercase; letter-spacing: 0.5px; position: relative; z-index: 1;">Hotel Orders Count</div>
                <div style="position: absolute; bottom: 8px; right: 12px; font-size: 48px; color: rgba(180,180,200,0.02); pointer-events: none;"><i class="fas fa-hotel"></i></div>
            </div>
        </div>
        
        <!-- 统计卡片 - 金属拉丝质感 + 右上角光晕 -->
        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 24px;">
            <div style="background: linear-gradient(145deg, rgba(20,24,40,0.85), rgba(10,12,24,0.6)); border-radius: 16px; padding: 18px 20px; border: 1px solid rgba(180,180,200,0.06); transition: all 0.3s; position: relative; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.04);">
                <div style="position: absolute; top: -15%; right: -5%; width: 75%; height: 75%; background: radial-gradient(ellipse at 70% 20%, rgba(255,255,255,0.10), transparent 70%); pointer-events: none; border-radius: 50%;"></div>
                <div style="position: absolute; top: 0; left: 0; right: 0; height: 1px; background: linear-gradient(90deg, transparent, rgba(180,180,200,0.08), transparent);"></div>
                <i class="fas fa-user-plus" style="font-size: 20px; color: #c8b090; margin-bottom: 4px; display: block; position: relative; z-index: 1;"></i>
                <div id="newUsersCount" style="font-size: 28px; font-weight: 700; color: #ffffff; letter-spacing: -0.5px; position: relative; z-index: 1;">0</div>
                <div style="font-size: 11px; color: #8892a8; text-transform: uppercase; letter-spacing: 0.5px; margin-top: 2px; position: relative; z-index: 1;">New Registered Today</div>
                <div id="newUsersTrend" style="font-size: 10px; margin-top: 4px; position: relative; z-index: 1;"></div>
                <div style="position: absolute; bottom: 8px; right: 12px; font-size: 48px; color: rgba(180,180,200,0.02); pointer-events: none;"><i class="fas fa-user-plus"></i></div>
            </div>
            <div style="background: linear-gradient(145deg, rgba(20,24,40,0.85), rgba(10,12,24,0.6)); border-radius: 16px; padding: 18px 20px; border: 1px solid rgba(180,180,200,0.06); transition: all 0.3s; position: relative; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.04);">
                <div style="position: absolute; top: -15%; right: -5%; width: 75%; height: 75%; background: radial-gradient(ellipse at 70% 20%, rgba(255,255,255,0.10), transparent 70%); pointer-events: none; border-radius: 50%;"></div>
                <div style="position: absolute; top: 0; left: 0; right: 0; height: 1px; background: linear-gradient(90deg, transparent, rgba(180,180,200,0.08), transparent);"></div>
                <i class="fas fa-users" style="font-size: 20px; color: #c8b090; margin-bottom: 4px; display: block; position: relative; z-index: 1;"></i>
                <div id="totalUsersCount" style="font-size: 28px; font-weight: 700; color: #ffffff; letter-spacing: -0.5px; position: relative; z-index: 1;">0</div>
                <div style="font-size: 11px; color: #8892a8; text-transform: uppercase; letter-spacing: 0.5px; margin-top: 2px; position: relative; z-index: 1;">Total Users</div>
                <div id="totalUsersTrend" style="font-size: 10px; margin-top: 4px; position: relative; z-index: 1;"></div>
                <div style="position: absolute; bottom: 8px; right: 12px; font-size: 48px; color: rgba(180,180,200,0.02); pointer-events: none;"><i class="fas fa-users"></i></div>
            </div>
            <div style="background: linear-gradient(145deg, rgba(20,24,40,0.85), rgba(10,12,24,0.6)); border-radius: 16px; padding: 18px 20px; border: 1px solid rgba(180,180,200,0.06); transition: all 0.3s; position: relative; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.04);">
                <div style="position: absolute; top: -15%; right: -5%; width: 75%; height: 75%; background: radial-gradient(ellipse at 70% 20%, rgba(255,255,255,0.10), transparent 70%); pointer-events: none; border-radius: 50%;"></div>
                <div style="position: absolute; top: 0; left: 0; right: 0; height: 1px; background: linear-gradient(90deg, transparent, rgba(180,180,200,0.08), transparent);"></div>
                <i class="fas fa-arrow-down" style="font-size: 20px; color: #c8b090; margin-bottom: 4px; display: block; position: relative; z-index: 1;"></i>
                <div id="totalDepositCount" style="font-size: 28px; font-weight: 700; color: #ffffff; letter-spacing: -0.5px; position: relative; z-index: 1;">€0</div>
                <div style="font-size: 11px; color: #8892a8; text-transform: uppercase; letter-spacing: 0.5px; margin-top: 2px; position: relative; z-index: 1;">Total Deposits</div>
                <div id="totalDepositTrend" style="font-size: 10px; margin-top: 4px; position: relative; z-index: 1;"></div>
                <div style="position: absolute; bottom: 8px; right: 12px; font-size: 48px; color: rgba(180,180,200,0.02); pointer-events: none;"><i class="fas fa-arrow-down"></i></div>
            </div>
            <div style="background: linear-gradient(145deg, rgba(20,24,40,0.85), rgba(10,12,24,0.6)); border-radius: 16px; padding: 18px 20px; border: 1px solid rgba(180,180,200,0.06); transition: all 0.3s; position: relative; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.04);">
                <div style="position: absolute; top: -15%; right: -5%; width: 75%; height: 75%; background: radial-gradient(ellipse at 70% 20%, rgba(255,255,255,0.10), transparent 70%); pointer-events: none; border-radius: 50%;"></div>
                <div style="position: absolute; top: 0; left: 0; right: 0; height: 1px; background: linear-gradient(90deg, transparent, rgba(180,180,200,0.08), transparent);"></div>
                <i class="fas fa-arrow-up" style="font-size: 20px; color: #c8b090; margin-bottom: 4px; display: block; position: relative; z-index: 1;"></i>
                <div id="totalWithdrawCount" style="font-size: 28px; font-weight: 700; color: #ffffff; letter-spacing: -0.5px; position: relative; z-index: 1;">€0</div>
                <div style="font-size: 11px; color: #8892a8; text-transform: uppercase; letter-spacing: 0.5px; margin-top: 2px; position: relative; z-index: 1;">Total Withdrawals</div>
                <div id="totalWithdrawTrend" style="font-size: 10px; margin-top: 4px; position: relative; z-index: 1;"></div>
                <div style="position: absolute; bottom: 8px; right: 12px; font-size: 48px; color: rgba(180,180,200,0.02); pointer-events: none;"><i class="fas fa-arrow-up"></i></div>
            </div>
        </div>
        
        <!-- 图表区域 -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 28px;">
            <div style="background: linear-gradient(145deg, rgba(20,24,40,0.85), rgba(10,12,24,0.6)); backdrop-filter: blur(8px); border-radius: 20px; padding: 20px; border: 1px solid rgba(180,180,200,0.06); box-shadow: 0 4px 20px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.04); position: relative; overflow: hidden;">
                <div style="position: absolute; top: -15%; right: -5%; width: 75%; height: 75%; background: radial-gradient(ellipse at 70% 20%, rgba(255,255,255,0.06), transparent 70%); pointer-events: none; border-radius: 50%;"></div>
                <div style="position: absolute; top: 0; left: 0; right: 0; height: 1px; background: linear-gradient(90deg, transparent, rgba(180,180,200,0.08), transparent);"></div>
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; position: relative; z-index: 1;">
                    <div style="font-size: 16px; font-weight: 600; color: #d8dff0;">D&W Trend</div>
                    <div style="display: flex; gap: 16px; font-size: 12px; color: #8892a8;"><span><span style="display: inline-block; width: 12px; height: 12px; background: #7ad0b0; border-radius: 2px; margin-right: 6px;"></span>Deposits</span><span><span style="display: inline-block; width: 12px; height: 12px; background: #e88080; border-radius: 2px; margin-right: 6px;"></span>Withdrawals</span></div>
                </div>
                <div id="trendChart" style="height: 320px; width: 100%; position: relative; z-index: 1;"></div>
            </div>
            <div style="background: linear-gradient(145deg, rgba(20,24,40,0.85), rgba(10,12,24,0.6)); backdrop-filter: blur(8px); border-radius: 20px; padding: 20px; border: 1px solid rgba(180,180,200,0.06); box-shadow: 0 4px 20px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.04); position: relative; overflow: hidden; text-align: center;">
                <div style="position: absolute; top: -15%; right: -5%; width: 75%; height: 75%; background: radial-gradient(ellipse at 70% 20%, rgba(255,255,255,0.06), transparent 70%); pointer-events: none; border-radius: 50%;"></div>
                <div style="position: absolute; top: 0; left: 0; right: 0; height: 1px; background: linear-gradient(90deg, transparent, rgba(180,180,200,0.08), transparent);"></div>
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; position: relative; z-index: 1;">
                    <div style="font-size: 16px; font-weight: 600; color: #d8dff0;">📊 Users Analytics</div>
                    <div style="display: flex; gap: 16px; font-size: 12px; color: #8892a8;"><span><span style="display: inline-block; width: 12px; height: 12px; background: #8ab4f0; border-radius: 2px; margin-right: 6px;"></span>Complete Tasks</span></div>
                </div>
                <div id="ringChart" style="height: 220px; width: 100%; position: relative; z-index: 1;"></div>
                <div id="ringPercent" style="font-size: 24px; font-weight: 700; color: #ffffff; margin-top: 8px; position: relative; z-index: 1;">0%</div>
                <div style="font-size: 11px; color: #8892a8; position: relative; z-index: 1;">Percentage Completed Tasks</div>
            </div>
        </div>
        
        <!-- 实时活动 -->
        <div style="background: linear-gradient(145deg, rgba(20,24,40,0.85), rgba(10,12,24,0.6)); backdrop-filter: blur(8px); border-radius: 20px; padding: 20px; border: 1px solid rgba(180,180,200,0.06); box-shadow: 0 4px 20px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.04); position: relative; overflow: hidden;">
            <div style="position: absolute; top: -15%; right: -5%; width: 75%; height: 75%; background: radial-gradient(ellipse at 70% 20%, rgba(255,255,255,0.06), transparent 70%); pointer-events: none; border-radius: 50%;"></div>
            <div style="position: absolute; top: 0; left: 0; right: 0; height: 1px; background: linear-gradient(90deg, transparent, rgba(180,180,200,0.08), transparent);"></div>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; position: relative; z-index: 1;">
                <div style="font-size: 16px; font-weight: 600; color: #d8dff0;"><i class="fas fa-history" style="color: #8892a8; margin-right: 8px;"></i>Real-Time Event</div>
                <div style="font-size: 11px; color: #7ad0b0;"><i class="fas fa-circle" style="font-size: 8px; margin-right: 4px;"></i>Real-Time Updates</div>
            </div>
            <div id="activityList" style="max-height: 350px; overflow-y: auto; position: relative; z-index: 1;">
                <div style="text-align: center; padding: 20px; color: #6a7a9a;">Loading...</div>
            </div>
        </div>
    `;
    
    // 添加样式
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
        .stat-card-hover:hover {
            border-color: rgba(180,180,200,0.12) !important;
            transform: translateY(-3px);
            box-shadow: 0 8px 30px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.06) !important;
        }
        .stat-card-hover:hover > div:first-child {
            background: radial-gradient(ellipse at 70% 20%, rgba(255,255,255,0.15), transparent 70%) !important;
        }
        .trend-up { color: #7ad0b0; }
        .trend-down { color: #e88080; }
        #activityList::-webkit-scrollbar { width: 3px; }
        #activityList::-webkit-scrollbar-thumb { background: rgba(180,180,200,0.06); border-radius: 4px; }
        #activityList::-webkit-scrollbar-track { background: transparent; }
    `;
    document.head.appendChild(style);
    
    setTimeout(function() {
        initTrendChart();
        initRingChart();
        bindDateFilters();
        refreshDashboard(days, true);
    }, 200);
    
    if (dashboardRefreshInterval) clearInterval(dashboardRefreshInterval);
    dashboardRefreshInterval = setInterval(function() { refreshDashboard(currentDays, false); }, 15000);
}

window.loadDashboardPage = loadDashboardPage;
window.refreshDashboardData = function(days) {
    refreshDashboard(days || currentDays, true);
};