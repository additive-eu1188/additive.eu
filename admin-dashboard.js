// admin-dashboard.js - 完整版
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

// ========== 加载转化率数据 ==========
async function loadConversionData(days, force) {
    force = force || false;
    var now = Date.now();
    if (!force && cachedData.conversion && (now - cachedData.lastConversionTime) < CACHE_DURATION) {
        applyConversionData(cachedData.conversion, days);
        return;
    }
    try {
        var periods = [
            { label: 'Today', days: 0 },
            { label: '7 Days', days: 7 },
            { label: '30 Days', days: 30 },
            { label: 'All Time', days: -1 }
        ];
        
        var result = [];
        var allUsers = await sb.from('users').select('uid, created_at');
        var allDeposits = await sb.from('deposits').select('uid, created_at, amount');
        
        var users = allUsers.data || [];
        var deposits = allDeposits.data || [];
        
        var depositUsers = {};
        deposits.forEach(function(d) {
            if (d.uid && (d.amount || 0) > 0) {
                depositUsers[d.uid] = true;
            }
        });
        
        for (var p = 0; p < periods.length; p++) {
            var period = periods[p];
            var startDate = new Date();
            
            if (period.days === -1) {
                startDate = new Date(0);
            } else if (period.days === 0) {
                startDate = new Date();
                startDate.setHours(0, 0, 0, 0);
            } else {
                startDate.setDate(startDate.getDate() - period.days);
            }
            
            var startStr = startDate.toISOString().split('T')[0];
            var endStr = new Date().toISOString().split('T')[0];
            
            var registeredUsers = users.filter(function(u) {
                if (!u.created_at) return false;
                var dateStr = u.created_at.split('T')[0];
                if (period.days === -1) return true;
                return dateStr >= startStr && dateStr <= endStr;
            });
            
            var totalRegister = registeredUsers.length;
            
            var convertedUsers = registeredUsers.filter(function(u) {
                return depositUsers[u.uid] === true;
            });
            
            var totalConverted = convertedUsers.length;
            var rate = totalRegister > 0 ? Math.round((totalConverted / totalRegister) * 100) : 0;
            
            result.push({
                label: period.label,
                days: period.days,
                register: totalRegister,
                converted: totalConverted,
                rate: rate
            });
        }
        
        cachedData.conversion = result;
        cachedData.lastConversionTime = now;
        applyConversionData(result, days);
        
    } catch (e) {
        console.error('加载转化率数据失败:', e);
    }
}

function applyConversionData(data, days) {
    var selected = data || [];
    var targetLabel = 'Today';
    if (days === 7) targetLabel = '7 Days';
    else if (days === 30) targetLabel = '30 Days';
    else if (days === -1) targetLabel = 'All Time';
    
    var matched = selected.filter(function(d) { return d.label === targetLabel; });
    var displayData = matched.length > 0 ? matched[0] : selected[0];
    
    // 更新环形图百分比
    var ringPercent = document.getElementById('ringPercent');
    if (ringPercent) {
        ringPercent.innerText = displayData.rate + '%';
    }
    
    // 更新 Today Register / Today Conversion
    var registerEl = document.getElementById('conversionRegister');
    var convertedEl = document.getElementById('conversionConverted');
    var labelEl = document.getElementById('conversionLabel');
    
    if (registerEl) registerEl.innerText = displayData.register;
    if (convertedEl) convertedEl.innerText = displayData.converted;
    if (labelEl) {
        var labelMap = {
            'Today': 'Today Register',
            '7 Days': '7 Days Register',
            '30 Days': '30 Days Register',
            'All Time': 'All Time Register'
        };
        labelEl.innerText = labelMap[displayData.label] || 'Today Register';
    }
    
    // 更新所有时间线的数据显示
    var allLabels = document.querySelectorAll('.conversion-stat-label');
    var allRegisters = document.querySelectorAll('.conversion-stat-register');
    var allConverteds = document.querySelectorAll('.conversion-stat-converted');
    var allRates = document.querySelectorAll('.conversion-stat-rate');
    
    var labelMap2 = {
        'Today': 'Today',
        '7 Days': '7 Days',
        '30 Days': '30 Days',
        'All Time': 'All Time'
    };
    
    for (var i = 0; i < data.length; i++) {
        var d = data[i];
        if (allLabels[i]) allLabels[i].innerText = labelMap2[d.label] || d.label;
        if (allRegisters[i]) allRegisters[i].innerText = d.register;
        if (allConverteds[i]) allConverteds[i].innerText = d.converted;
        if (allRates[i]) {
            allRates[i].innerText = d.rate + '%';
            allRates[i].style.color = d.rate >= 50 ? '#7ad0b0' : d.rate >= 20 ? '#c8b090' : '#e88080';
        }
    }
    
    // 高亮当前选中的行
    var allRows = document.querySelectorAll('.conversion-stat-row');
    for (var j = 0; j < allRows.length; j++) {
        var row = allRows[j];
        var label = row.querySelector('.conversion-stat-label');
        if (label && label.innerText === targetLabel) {
            row.style.background = 'rgba(200, 176, 144, 0.08)';
            row.style.borderRadius = '8px';
            row.style.padding = '3px 6px';
        } else {
            row.style.background = 'transparent';
            row.style.padding = '3px 0';
        }
    }
}

// ========== 初始化波浪环形图 ==========
function initWaveRing() {
    var container = document.getElementById('waveRingContainer');
    if (!container) return;
    
    container.innerHTML = '';
    container.style.width = '220px';
    container.style.height = '220px';
    container.style.position = 'relative';
    container.style.margin = '0 auto';
    
    var canvas = document.createElement('canvas');
    canvas.width = 220;
    canvas.height = 220;
    canvas.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;border-radius:50%;z-index:1;';
    canvas.id = 'waveCanvas';
    container.appendChild(canvas);
    
    var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 220 220');
    svg.style.cssText = 'width:100%;height:100%;transform:rotate(-90deg);position:relative;z-index:2;';
    svg.innerHTML = `
        <defs>
            <linearGradient id="metalGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#3a2a1a"/>
                <stop offset="20%" stop-color="#c8b090"/>
                <stop offset="40%" stop-color="#b8942a"/>
                <stop offset="55%" stop-color="#e8d5c0"/>
                <stop offset="70%" stop-color="#8a7020"/>
                <stop offset="85%" stop-color="#c8b090"/>
                <stop offset="100%" stop-color="#2a1a0a"/>
            </linearGradient>
            <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#b8942a"/>
                <stop offset="30%" stop-color="#c8b090"/>
                <stop offset="60%" stop-color="#d4af37"/>
                <stop offset="100%" stop-color="#c8b090"/>
            </linearGradient>
        </defs>
        <circle cx="110" cy="110" r="95" fill="none" stroke="rgba(255,255,255,0.03)" stroke-width="12"/>
        <circle cx="110" cy="110" r="95" fill="none" stroke="url(#grad)" stroke-width="12" stroke-linecap="round" stroke-dasharray="596.9" stroke-dashoffset="596.9" filter="drop-shadow(0 0 20px rgba(200,176,144,0.3))" class="progress-ring"/>
    `;
    container.appendChild(svg);
    
    // 创建中心文字（最上层）- 金属质感
var centerText = document.createElement('div');
centerText.style.cssText = 'position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);text-align:center;pointer-events:none;z-index:10;';
centerText.innerHTML = `
    <div id="ringPercent" style="font-size:48px;font-weight:900;letter-spacing:-1px;line-height:1;background:linear-gradient(180deg,#f0e8d0 0%,#d4c09a 35%,#b8942a 65%,#e8d5c0 100%);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;filter:drop-shadow(0 0 30px rgba(200,176,144,0.15)) drop-shadow(0 4px 8px rgba(0,0,0,0.3));">78%</div>
    <div style="font-size:13px;font-weight:700;letter-spacing:3px;text-transform:uppercase;margin-top:6px;background:linear-gradient(180deg,#d4c09a 0%,#b8942a 50%,#8a7020 100%);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;filter:drop-shadow(0 0 20px rgba(200,176,144,0.08)) drop-shadow(0 2px 4px rgba(0,0,0,0.2));">Conversion Rate</div>
`;
container.appendChild(centerText);
    
    startWaveAnimation(canvas);
    
    setTimeout(function() {
        var progressRing = container.querySelector('.progress-ring');
        if (progressRing) {
            var rate = parseInt(document.getElementById('ringPercent')?.innerText || '78');
            var circumference = 596.9;
            var offset = circumference - (circumference * rate / 100);
            progressRing.style.transition = 'stroke-dashoffset 2.2s cubic-bezier(0.22,1,0.36,1)';
            progressRing.style.strokeDashoffset = offset;
        }
    }, 100);
}

// ========== 波浪动画引擎 ==========
function startWaveAnimation(canvas) {
    var ctx = canvas.getContext('2d');
    var w = 220, h = 220;
    var cx = 110, cy = 110;
    
    // ===== 扩散圆圈 =====
    var expandingRings = [];
    var ringSpawnCounter = 0;
    
    function spawnExpandingRing() {
        var radius = 5 + Math.random() * 6;
        var speed = 0.5 + Math.random() * 0.4;
        var maxRadius = 65 + Math.random() * 15;
        var alpha = 0.2 + Math.random() * 0.15;
        var color = Math.random() > 0.5 ? '#c8b090' : '#d4af37';
        var width = 1.5 + Math.random() * 1.5;
        expandingRings.push({
            radius: radius,
            maxRadius: maxRadius,
            speed: speed,
            alpha: alpha,
            color: color,
            width: width
        });
    }
    
    var time = 0;
    
    function draw() {
        time++;
        ctx.clearRect(0, 0, w, h);
        
        // ===== 生成声波圈 =====
        ringSpawnCounter++;
        if (ringSpawnCounter % 20 === 0) {
            spawnExpandingRing();
        }
        
        // ===== 绘制声波圈 =====
        for (var r = expandingRings.length - 1; r >= 0; r--) {
            var ring = expandingRings[r];
            ring.radius += 0.5 * ring.speed;
            
            var fade = ring.alpha * (1 - ring.radius / ring.maxRadius);
            
            if (ring.radius > ring.maxRadius || fade < 0.005) {
                expandingRings.splice(r, 1);
                continue;
            }
            
            ctx.beginPath();
            ctx.arc(cx, cy, ring.radius, 0, Math.PI * 2);
            ctx.strokeStyle = ring.color;
            ctx.lineWidth = ring.width * (1 - ring.radius / ring.maxRadius * 0.5);
            ctx.globalAlpha = Math.max(0, fade);
            ctx.shadowColor = ring.color;
            ctx.shadowBlur = 6;
            ctx.stroke();
            ctx.shadowBlur = 0;
        }
        
        // ===== 中心光晕 =====
        var centerGlow = ctx.createRadialGradient(cx, cy, 0, cx, cy, 60);
        centerGlow.addColorStop(0, 'rgba(200,176,144,0.03)');
        centerGlow.addColorStop(1, 'transparent');
        ctx.fillStyle = centerGlow;
        ctx.globalAlpha = 1;
        ctx.beginPath();
        ctx.arc(cx, cy, 60, 0, Math.PI * 2);
        ctx.fill();
        
        requestAnimationFrame(draw);
    }
    draw();
}

// ========== 加载最近注册用户数据（最多5条） ==========
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
        
        var html = '';
        for (var i = 0; i < users.length; i++) {
            var u = users[i];
            var referrer = u.invited_by_username || '-';
            var joinedMembership = u.balance > 0 ? '✅ Yes' : '❌ No';
            var amount = u.balance > 0 ? '€' + u.balance.toFixed(2) : '€0.00';
            
            html += '<tr style="border-bottom: 1px solid rgba(200,176,144,0.03);">' +
                '<td style="padding: 4px 6px; color: #d8dff0; font-weight: 500;">' + escapeHtml(u.username) + '</td>' +
                '<td style="padding: 4px 6px; color: #8892a8;">' + escapeHtml(referrer) + '</td>' +
                '<td style="padding: 4px 6px; text-align: center; color: ' + (u.balance > 0 ? '#7ad0b0' : '#5a4a2a') + ';">' + joinedMembership + '</td>' +
                '<td style="padding: 4px 6px; text-align: right; color: ' + (u.balance > 0 ? '#c8b090' : '#4a5a72') + '; font-weight: 600;">' + amount + '</td>' +
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
                <i class="fas fa-id-card" style="font-size: 22px; color: #c8b090; margin-bottom: 6px; display: block; position: relative; z-index: 1;"></i>
                <div id="kycPendingCount" style="font-size: 26px; font-weight: 700; color: #ffffff; margin: 2px 0; position: relative; z-index: 1;">0</div>
                <div style="font-size: 11px; color: #8892a8; text-transform: uppercase; letter-spacing: 0.5px; position: relative; z-index: 1;">Pending KYC</div>
            </div>
            <div onclick="showPage('withdrawals')" style="background: linear-gradient(145deg, rgba(20,24,40,0.85), rgba(10,12,24,0.6)); border-radius: 16px; padding: 18px 16px; border: 1px solid rgba(180,180,200,0.06); cursor: pointer; transition: all 0.3s; position: relative; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.04);">
                <div style="position: absolute; top: -15%; right: -5%; width: 75%; height: 75%; background: radial-gradient(ellipse at 70% 20%, rgba(255,255,255,0.10), transparent 70%); pointer-events: none; border-radius: 50%;"></div>
                <div style="position: absolute; top: 0; left: 0; right: 0; height: 1px; background: linear-gradient(90deg, transparent, rgba(180,180,200,0.08), transparent);"></div>
                <i class="fas fa-money-bill-wave" style="font-size: 22px; color: #c8b090; margin-bottom: 6px; display: block; position: relative; z-index: 1;"></i>
                <div id="withdrawalPendingCount" style="font-size: 26px; font-weight: 700; color: #ffffff; margin: 2px 0; position: relative; z-index: 1;">0</div>
                <div style="font-size: 11px; color: #8892a8; text-transform: uppercase; letter-spacing: 0.5px; position: relative; z-index: 1;">Pending Withdrawals</div>
            </div>
            <div onclick="showPage('emailverify')" style="background: linear-gradient(145deg, rgba(20,24,40,0.85), rgba(10,12,24,0.6)); border-radius: 16px; padding: 18px 16px; border: 1px solid rgba(180,180,200,0.06); cursor: pointer; transition: all 0.3s; position: relative; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.04);">
                <div style="position: absolute; top: -15%; right: -5%; width: 75%; height: 75%; background: radial-gradient(ellipse at 70% 20%, rgba(255,255,255,0.10), transparent 70%); pointer-events: none; border-radius: 50%;"></div>
                <div style="position: absolute; top: 0; left: 0; right: 0; height: 1px; background: linear-gradient(90deg, transparent, rgba(180,180,200,0.08), transparent);"></div>
                <i class="fas fa-envelope" style="font-size: 22px; color: #c8b090; margin-bottom: 6px; display: block; position: relative; z-index: 1;"></i>
                <div id="emailPendingCount" style="font-size: 26px; font-weight: 700; color: #ffffff; margin: 2px 0; position: relative; z-index: 1;">0</div>
                <div style="font-size: 11px; color: #8892a8; text-transform: uppercase; letter-spacing: 0.5px; position: relative; z-index: 1;">Pending Email</div>
            </div>
            <div onclick="showPage('orderpool')" style="background: linear-gradient(145deg, rgba(20,24,40,0.85), rgba(10,12,24,0.6)); border-radius: 16px; padding: 18px 16px; border: 1px solid rgba(180,180,200,0.06); cursor: pointer; transition: all 0.3s; position: relative; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.04);">
                <div style="position: absolute; top: -15%; right: -5%; width: 75%; height: 75%; background: radial-gradient(ellipse at 70% 20%, rgba(255,255,255,0.10), transparent 70%); pointer-events: none; border-radius: 50%;"></div>
                <div style="position: absolute; top: 0; left: 0; right: 0; height: 1px; background: linear-gradient(90deg, transparent, rgba(180,180,200,0.08), transparent);"></div>
                <i class="fas fa-hotel" style="font-size: 22px; color: #c8b090; margin-bottom: 6px; display: block; position: relative; z-index: 1;"></i>
                <div id="orderPoolCount" style="font-size: 26px; font-weight: 700; color: #ffffff; margin: 2px 0; position: relative; z-index: 1;">0</div>
                <div style="font-size: 11px; color: #8892a8; text-transform: uppercase; letter-spacing: 0.5px; position: relative; z-index: 1;">Hotel Orders Count</div>
            </div>
        </div>
        
        <!-- 统计卡片 -->
        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 24px;">
            <div style="background: linear-gradient(145deg, rgba(20,24,40,0.85), rgba(10,12,24,0.6)); border-radius: 16px; padding: 18px 20px; border: 1px solid rgba(180,180,200,0.06); transition: all 0.3s; position: relative; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.04);">
                <div style="position: absolute; top: -15%; right: -5%; width: 75%; height: 75%; background: radial-gradient(ellipse at 70% 20%, rgba(255,255,255,0.10), transparent 70%); pointer-events: none; border-radius: 50%;"></div>
                <div style="position: absolute; top: 0; left: 0; right: 0; height: 1px; background: linear-gradient(90deg, transparent, rgba(180,180,200,0.08), transparent);"></div>
                <i class="fas fa-user-plus" style="font-size: 20px; color: #c8b090; margin-bottom: 4px; display: block; position: relative; z-index: 1;"></i>
                <div id="newUsersCount" style="font-size: 28px; font-weight: 700; color: #ffffff; letter-spacing: -0.5px; position: relative; z-index: 1;">0</div>
                <div style="font-size: 11px; color: #8892a8; text-transform: uppercase; letter-spacing: 0.5px; margin-top: 2px; position: relative; z-index: 1;">New Registered Today</div>
                <div id="newUsersTrend" style="font-size: 10px; margin-top: 4px; position: relative; z-index: 1;"></div>
            </div>
            <div style="background: linear-gradient(145deg, rgba(20,24,40,0.85), rgba(10,12,24,0.6)); border-radius: 16px; padding: 18px 20px; border: 1px solid rgba(180,180,200,0.06); transition: all 0.3s; position: relative; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.04);">
                <div style="position: absolute; top: -15%; right: -5%; width: 75%; height: 75%; background: radial-gradient(ellipse at 70% 20%, rgba(255,255,255,0.10), transparent 70%); pointer-events: none; border-radius: 50%;"></div>
                <div style="position: absolute; top: 0; left: 0; right: 0; height: 1px; background: linear-gradient(90deg, transparent, rgba(180,180,200,0.08), transparent);"></div>
                <i class="fas fa-users" style="font-size: 20px; color: #c8b090; margin-bottom: 4px; display: block; position: relative; z-index: 1;"></i>
                <div id="totalUsersCount" style="font-size: 28px; font-weight: 700; color: #ffffff; letter-spacing: -0.5px; position: relative; z-index: 1;">0</div>
                <div style="font-size: 11px; color: #8892a8; text-transform: uppercase; letter-spacing: 0.5px; margin-top: 2px; position: relative; z-index: 1;">Total Users</div>
                <div id="totalUsersTrend" style="font-size: 10px; margin-top: 4px; position: relative; z-index: 1;"></div>
            </div>
            <div style="background: linear-gradient(145deg, rgba(20,24,40,0.85), rgba(10,12,24,0.6)); border-radius: 16px; padding: 18px 20px; border: 1px solid rgba(180,180,200,0.06); transition: all 0.3s; position: relative; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.04);">
                <div style="position: absolute; top: -15%; right: -5%; width: 75%; height: 75%; background: radial-gradient(ellipse at 70% 20%, rgba(255,255,255,0.10), transparent 70%); pointer-events: none; border-radius: 50%;"></div>
                <div style="position: absolute; top: 0; left: 0; right: 0; height: 1px; background: linear-gradient(90deg, transparent, rgba(180,180,200,0.08), transparent);"></div>
                <i class="fas fa-arrow-down" style="font-size: 20px; color: #c8b090; margin-bottom: 4px; display: block; position: relative; z-index: 1;"></i>
                <div id="totalDepositCount" style="font-size: 28px; font-weight: 700; color: #ffffff; letter-spacing: -0.5px; position: relative; z-index: 1;">€0</div>
                <div style="font-size: 11px; color: #8892a8; text-transform: uppercase; letter-spacing: 0.5px; margin-top: 2px; position: relative; z-index: 1;">Total Deposits</div>
                <div id="totalDepositTrend" style="font-size: 10px; margin-top: 4px; position: relative; z-index: 1;"></div>
            </div>
            <div style="background: linear-gradient(145deg, rgba(20,24,40,0.85), rgba(10,12,24,0.6)); border-radius: 16px; padding: 18px 20px; border: 1px solid rgba(180,180,200,0.06); transition: all 0.3s; position: relative; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.04);">
                <div style="position: absolute; top: -15%; right: -5%; width: 75%; height: 75%; background: radial-gradient(ellipse at 70% 20%, rgba(255,255,255,0.10), transparent 70%); pointer-events: none; border-radius: 50%;"></div>
                <div style="position: absolute; top: 0; left: 0; right: 0; height: 1px; background: linear-gradient(90deg, transparent, rgba(180,180,200,0.08), transparent);"></div>
                <i class="fas fa-arrow-up" style="font-size: 20px; color: #c8b090; margin-bottom: 4px; display: block; position: relative; z-index: 1;"></i>
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
                    <div style="display: flex; gap: 16px; font-size: 12px; color: #8892a8;"><span><span style="display: inline-block; width: 12px; height: 12px; background: #7ad0b0; border-radius: 2px; margin-right: 6px;"></span>Deposits</span><span><span style="display: inline-block; width: 12px; height: 12px; background: #e88080; border-radius: 2px; margin-right: 6px;"></span>Withdrawals</span></div>
                </div>
                <div id="trendChart" style="height: 320px; width: 100%; position: relative; z-index: 1;"></div>
            </div>
            
            <!-- 转化率卡片 - 左环占满左边，右数据紧凑排列 -->
            <div style="background: linear-gradient(145deg, rgba(20,24,40,0.85), rgba(10,12,24,0.6)); backdrop-filter: blur(8px); border-radius: 20px; padding: 20px; border: 1px solid rgba(180,180,200,0.06); box-shadow: 0 4px 20px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.04); position: relative; overflow: hidden;">
                <div style="position: absolute; top: -15%; right: -5%; width: 75%; height: 75%; background: radial-gradient(ellipse at 70% 20%, rgba(255,255,255,0.06), transparent 70%); pointer-events: none; border-radius: 50%;"></div>
                <div style="position: absolute; top: 0; left: 0; right: 0; height: 1px; background: linear-gradient(90deg, transparent, rgba(180,180,200,0.08), transparent);"></div>
                
                <!-- 标题行：左标题 + 右 Today Register -->
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 6px; position: relative; z-index: 1;">
                    <div style="font-size: 15px; font-weight: 600; color: #d8dff0;">📈 New Orders Conversion Rate</div>
                    <div style="text-align: right;">
                        <div style="font-size: 10px; color: #6a5a3a; letter-spacing: 0.5px;">
                            <span style="color: #8892a8;">Today Register</span>
                        </div>
                        <div style="display: flex; align-items: baseline; gap: 4px; justify-content: flex-end;">
                            <span id="conversionRegister" style="font-size: 22px; font-weight: 700; color: #c8b090;">0</span>
                            <span style="font-size: 12px; color: #6a5a3a;">/</span>
                            <span id="conversionConverted" style="font-size: 16px; font-weight: 600; color: #d4af37;">0</span>
                            <span style="font-size: 10px; color: #5a4a2a;">converted</span>
                        </div>
                    </div>
                </div>
                
                <!-- 主体：左环占满 + 右数据紧凑 -->
                <div style="display: flex; align-items: stretch; gap: 12px; position: relative; z-index: 1; min-height: 210px;">
                    
                    <!-- 左侧环形图 -->
<div id="waveRingContainer" style="width: 220px; height: 280px; flex-shrink: 0; position: relative; align-self: center;"></div>
                    
                    <!-- 右侧数据 -->
<div style="flex: 1; min-width: 0; display: flex; flex-direction: column; justify-content: space-between; gap: 0px;">
                        <!-- A: 4行统计数据 -->
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
                        
                        <!-- B: 用户表格 -->
<div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid rgba(200,176,144,0.06);">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2px;">
                                <div style="font-size: 9px; color: #5a4a2a; font-weight: 500; letter-spacing: 0.5px; text-transform: uppercase;">
                                    <i class="fas fa-users" style="color: #c8b090; margin-right: 4px; font-size: 9px;"></i>Recent
                                </div>
                                <a href="#" onclick="showPage('users'); return false;" style="font-size: 8px; color: #4a3a2a; text-decoration: none; transition: 0.2s;" onmouseover="this.style.color='#c8b090'" onmouseout="this.style.color='#4a3a2a'">View All →</a>
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
                <div style="font-size: 11px; color: #7ad0b0;"><i class="fas fa-circle" style="font-size: 8px; margin-right: 4px;"></i>Real-Time Updates</div>
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
        .trend-up { color: #7ad0b0; }
        .trend-down { color: #e88080; }
        #activityList::-webkit-scrollbar { width: 3px; }
        #activityList::-webkit-scrollbar-thumb { background: rgba(180,180,200,0.06); border-radius: 4px; }
        #activityList::-webkit-scrollbar-track { background: transparent; }
        .conversion-stat-row:hover {
            background: rgba(200,176,144,0.04);
            border-radius: 6px;
        }
        #recentRegistrationsBody tr:hover td {
            background: rgba(200,176,144,0.04);
        }
        #recentRegistrationsBody td {
            padding: 2px 4px;
        }
        #recentRegistrationsBody::-webkit-scrollbar { width: 3px; }
        #recentRegistrationsBody::-webkit-scrollbar-thumb { background: rgba(200,176,144,0.12); border-radius: 4px; }
    `;
    document.head.appendChild(style);
    
    setTimeout(function() {
        initTrendChart();
        bindDateFilters();
        initWaveRing();
        refreshDashboard(days, true);
    }, 200);
    
    if (dashboardRefreshInterval) clearInterval(dashboardRefreshInterval);
    dashboardRefreshInterval = setInterval(function() { refreshDashboard(currentDays, false); }, 15000);
}

window.loadDashboardPage = loadDashboardPage;
window.refreshDashboardData = function(days) {
    refreshDashboard(days || currentDays, true);
};