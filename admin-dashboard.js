// admin-dashboard.js - 完整版（柏林时间 + D&W Trend 与卡片数据一致）
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

// ============================================================
// 🔥 柏林时间工具函数
// ============================================================

// 获取当前柏林时间
function getBerlinDate() {
    var now = new Date();
    var utc = now.getTime() + (now.getTimezoneOffset() * 60000);
    var offset = isBerlinSummerTime(now) ? 2 : 1;
    return new Date(utc + (3600000 * offset));
}

// 判断是否夏令时（柏林时间）
function isBerlinSummerTime(date) {
    var year = date.getFullYear();
    var lastSundayMarch = new Date(year, 2, 31);
    lastSundayMarch.setDate(lastSundayMarch.getDate() - lastSundayMarch.getDay());
    var lastSundayOctober = new Date(year, 9, 31);
    lastSundayOctober.setDate(lastSundayOctober.getDate() - lastSundayOctober.getDay());
    var testDate = new Date(date);
    testDate.setHours(0, 0, 0, 0);
    return testDate >= lastSundayMarch && testDate < lastSundayOctober;
}

// 将任意日期转换为柏林时间日期
function convertToBerlinDate(date) {
    var utc = date.getTime() + (date.getTimezoneOffset() * 60000);
    var offset = isBerlinSummerTime(date) ? 2 : 1;
    return new Date(utc + (3600000 * offset));
}

// 获取柏林时间当天的开始（0:00）
function getBerlinStartOfDay(date) {
    var d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return convertToBerlinDate(d);
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
        
        // ============================================================
        // 🔥 使用柏林时间计算日期范围
        // ============================================================
        var nowDate = getBerlinDate();
        var startDate = new Date(nowDate);
        startDate.setDate(startDate.getDate() - days);
        var startStr = startDate.toISOString().split('T')[0];
        
        var lastPeriodStart = new Date(nowDate);
        lastPeriodStart.setDate(lastPeriodStart.getDate() - days * 2);
        var lastPeriodStr = lastPeriodStart.toISOString().split('T')[0];
        
        // 过滤数据（使用柏林时间）
        var newUsers = users.filter(function(u) {
            if (!u.created_at) return false;
            var berlinDate = convertToBerlinDate(new Date(u.created_at));
            return berlinDate.toISOString().split('T')[0] >= startStr;
        }).length;
        
        var prevNewUsers = users.filter(function(u) {
            if (!u.created_at) return false;
            var berlinDate = convertToBerlinDate(new Date(u.created_at));
            var dateStr = berlinDate.toISOString().split('T')[0];
            return dateStr >= lastPeriodStr && dateStr < startStr;
        }).length;
        
        // 🔥 根据 days 参数筛选存款和提款
// days = 0: 今天, days = 7: 最近7天, days = 30: 最近30天, days = -1: 所有时间

var filteredDeposits = deposits;
var filteredWithdrawals = withdrawals.filter(function(w) { return w.status === 'approved'; });

if (days === 0) {
    // Today：只统计今天
    var todayStr = nowDate.toISOString().split('T')[0];
    filteredDeposits = deposits.filter(function(d) {
        if (!d.created_at) return false;
        var berlinDate = convertToBerlinDate(new Date(d.created_at));
        return berlinDate.toISOString().split('T')[0] === todayStr;
    });
    filteredWithdrawals = withdrawals.filter(function(w) {
        if (!w.request_date) return false;
        if (w.status !== 'approved') return false;
        var berlinDate = convertToBerlinDate(new Date(w.request_date));
        return berlinDate.toISOString().split('T')[0] === todayStr;
    });
} else if (days === 7 || days === 30) {
    // 7 Days / 30 Days：只统计指定天数内
    var startDate = new Date(nowDate);
    startDate.setDate(startDate.getDate() - days);
    var startStr = startDate.toISOString().split('T')[0];
    filteredDeposits = deposits.filter(function(d) {
        if (!d.created_at) return false;
        var berlinDate = convertToBerlinDate(new Date(d.created_at));
        return berlinDate.toISOString().split('T')[0] >= startStr;
    });
    filteredWithdrawals = withdrawals.filter(function(w) {
        if (!w.request_date) return false;
        if (w.status !== 'approved') return false;
        var berlinDate = convertToBerlinDate(new Date(w.request_date));
        return berlinDate.toISOString().split('T')[0] >= startStr;
    });
}
// days = -1: All Time，不过滤

var totalDeposit = filteredDeposits.reduce(function(s, d) { return s + (d.amount || 0); }, 0);
var totalWithdraw = filteredWithdrawals.reduce(function(s, w) { return s + (w.amount || 0); }, 0);

// 保留 periodDeposit 和 prevPeriodDeposit 用于趋势显示
var periodDeposit = deposits.filter(function(d) {
    if (!d.created_at) return false;
    var berlinDate = convertToBerlinDate(new Date(d.created_at));
    return berlinDate.toISOString().split('T')[0] >= startStr;
}).reduce(function(s, d) { return s + (d.amount || 0); }, 0);

var prevPeriodDeposit = deposits.filter(function(d) {
    if (!d.created_at) return false;
    var berlinDate = convertToBerlinDate(new Date(d.created_at));
    var dateStr = berlinDate.toISOString().split('T')[0];
    return dateStr >= lastPeriodStr && dateStr < startStr;
}).reduce(function(s, d) { return s + (d.amount || 0); }, 0);

var periodWithdraw = withdrawals.filter(function(w) {
    if (!w.request_date) return false;
    if (w.status !== 'approved') return false;
    var berlinDate = convertToBerlinDate(new Date(w.request_date));
    return berlinDate.toISOString().split('T')[0] >= startStr;
}).reduce(function(s, w) { return s + (w.amount || 0); }, 0);

var prevPeriodWithdraw = withdrawals.filter(function(w) {
    if (!w.request_date) return false;
    if (w.status !== 'approved') return false;
    var berlinDate = convertToBerlinDate(new Date(w.request_date));
    var dateStr = berlinDate.toISOString().split('T')[0];
    return dateStr >= lastPeriodStr && dateStr < startStr;
}).reduce(function(s, w) { return s + (w.amount || 0); }, 0);
        
        var statsData = { 
    newUsers: newUsers, 
    prevNewUsers: prevNewUsers, 
    totalUsers: users.length, 
    totalDeposit: totalDeposit,        // 🔥 根据 days 筛选
    periodDeposit: periodDeposit, 
    prevPeriodDeposit: prevPeriodDeposit, 
    totalWithdraw: totalWithdraw,      // 🔥 根据 days 筛选
    periodWithdraw: periodWithdraw, 
    prevPeriodWithdraw: prevPeriodWithdraw 
};
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
// loadChartData - 与统计卡片数据完全一致（柏林时间，最近7天）
// ============================================================
async function loadChartData(force) {
    force = force || false;
    var now = Date.now();
    
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
        // 🔥 数据源与统计卡片完全一致
        // ============================================================
        var depositsRes = await sb.from('deposits')
            .select('created_at, amount')
            .eq('type', 'manual');
            
        var withdrawalsRes = await sb.from('withdrawals')
            .select('request_date, amount, status');
            
        var deposits = depositsRes.data || [];
        var withdrawals = withdrawalsRes.data || [];
        
        // ============================================================
        // 🔥 使用柏林时间生成最近7天
        // ============================================================
        var today = getBerlinDate();
        var dates = [];
        var dateStrMap = {};
        
        for (var i = 6; i >= 0; i--) {
            var d = new Date(today);
            d.setDate(d.getDate() - i);
            // 确保日期在柏林时间下
            var berlinDate = convertToBerlinDate(d);
            var dateStr = berlinDate.toISOString().split('T')[0];
            var label = (berlinDate.getMonth() + 1) + '/' + berlinDate.getDate();
            dates.push(label);
            dateStrMap[label] = dateStr;
        }
        
        // ============================================================
        // 🔥 按天汇总数据（最近7天，柏林时间）
        // ============================================================
        var depositData = [];
        var withdrawData = [];
        
        var firstDayStr = dateStrMap[dates[0]];
        var lastDayStr = dateStrMap[dates[dates.length - 1]];
        
        // 过滤出最近7天的数据（使用柏林时间）
        var periodDeposits = deposits.filter(function(d) {
            if (!d.created_at) return false;
            var berlinDate = convertToBerlinDate(new Date(d.created_at));
            var dateStr = berlinDate.toISOString().split('T')[0];
            return dateStr >= firstDayStr && dateStr <= lastDayStr;
        });
        
        var periodWithdrawals = withdrawals.filter(function(w) {
            if (!w.request_date) return false;
            if (w.status !== 'approved') return false;
            var berlinDate = convertToBerlinDate(new Date(w.request_date));
            var dateStr = berlinDate.toISOString().split('T')[0];
            return dateStr >= firstDayStr && dateStr <= lastDayStr;
        });
        
        // 按天汇总
        for (var i = 0; i < dates.length; i++) {
            var label = dates[i];
            var dateStr = dateStrMap[label];
            
            var dayDeposit = periodDeposits.filter(function(dep) {
                var berlinDate = convertToBerlinDate(new Date(dep.created_at));
                return berlinDate.toISOString().split('T')[0] === dateStr;
            }).reduce(function(s, d) { return s + (d.amount || 0); }, 0);
            
            var dayWithdraw = periodWithdrawals.filter(function(w) {
                var berlinDate = convertToBerlinDate(new Date(w.request_date));
                return berlinDate.toISOString().split('T')[0] === dateStr;
            }).reduce(function(s, w) { return s + (w.amount || 0); }, 0);
            
            depositData.push(dayDeposit);
            withdrawData.push(dayWithdraw);
        }
        
        console.log('📊 D&W Trend 数据 (柏林时间):', { dates, depositData, withdrawData });
        
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
            console.log('📊 D&W Trend 已更新 (柏林时间, 最近7天)');
        }
    } catch (e) {
        console.error('加载图表数据失败:', e);
    }
}

// ============================================================
// loadConversionData - 统计注册用户转化率（完整版）
// ============================================================
async function loadConversionData(days, force) {
    force = force || false;
    var now = Date.now();
    
    console.log('🔍 loadConversionData 被调用, days:', days, 'force:', force);
    
    if (days === 0) {
        force = true;
    }
    
    if (!force && cachedData.conversion && (now - cachedData.lastConversionTime) < CACHE_DURATION) {
        console.log('📦 使用缓存的 conversion 数据:', cachedData.conversion);
        applyConversionData(cachedData.conversion, days);
        return;
    }
    
    try {
        var periods = [];
        
        if (days === 0) {
            periods.push({ label: 'Today', daysOffset: 0 });
        } else if (days === 7) {
            periods.push({ label: 'Today', daysOffset: 0 });
            periods.push({ label: '7 Days', daysOffset: 7 });
        } else if (days === 30) {
            periods.push({ label: 'Today', daysOffset: 0 });
            periods.push({ label: '7 Days', daysOffset: 7 });
            periods.push({ label: '30 Days', daysOffset: 30 });
        } else if (days === -1) {
            periods.push({ label: 'Today', daysOffset: 0 });
            periods.push({ label: '7 Days', daysOffset: 7 });
            periods.push({ label: '30 Days', daysOffset: 30 });
            periods.push({ label: 'All Time', daysOffset: -1 });
        } else {
            // 🔥 默认当作 Today
            console.log('⚠️ days 值异常 (' + days + ')，自动切换为 Today');
            periods.push({ label: 'Today', daysOffset: 0 });
        }
        
        console.log('📊 periods:', periods);
        
        var result = [];
        
        var allUsers = await sb.from('users').select('uid, created_at');
        console.log('👤 总用户数:', allUsers.data?.length || 0);
        
        var allDeposits = await sb.from('deposits')
            .select('uid, created_at, amount, type')
            .in('type', ['manual', 'deposit_bonus']);
        console.log('💰 总存款记录数:', allDeposits.data?.length || 0);
        
        var users = allUsers.data || [];
        var deposits = allDeposits.data || [];
        
        var depositUsers = {};
        deposits.forEach(function(d) {
            if (d.uid && (d.amount || 0) >= 40) {
                depositUsers[d.uid] = true;
            }
        });
        console.log('✅ 已转化用户数（存款>=40）:', Object.keys(depositUsers).length);
        
        var today = getBerlinDate();
        var todayStr = today.toISOString().split('T')[0];
        console.log('📅 今天 (柏林时间):', todayStr);
        
        for (var p = 0; p < periods.length; p++) {
            var period = periods[p];
            var label = period.label;
            var daysOffset = period.daysOffset;
            
            var registeredUsers = [];
            
            if (daysOffset === -1) {
                registeredUsers = users;
            } else if (daysOffset === 0) {
                registeredUsers = users.filter(function(u) {
                    if (!u.created_at) return false;
                    var berlinDate = convertToBerlinDate(new Date(u.created_at));
                    var dateStr = berlinDate.toISOString().split('T')[0];
                    return dateStr === todayStr;
                });
                console.log('📊 Today 注册用户数:', registeredUsers.length);
                console.log('📊 Today 注册用户 UIDs:', registeredUsers.map(function(u) { return u.uid; }));
            } else {
                var startDate = new Date(today);
                startDate.setDate(startDate.getDate() - daysOffset);
                var startStr = startDate.toISOString().split('T')[0];
                
                registeredUsers = users.filter(function(u) {
                    if (!u.created_at) return false;
                    var berlinDate = convertToBerlinDate(new Date(u.created_at));
                    var dateStr = berlinDate.toISOString().split('T')[0];
                    return dateStr >= startStr && dateStr <= todayStr;
                });
            }
            
            var totalRegister = registeredUsers.length;
            var convertedUsers = registeredUsers.filter(function(u) {
                return depositUsers[u.uid] === true;
            });
            var totalConverted = convertedUsers.length;
            var rate = totalRegister > 0 ? Math.round((totalConverted / totalRegister) * 100) : 0;
            
            console.log('📊 ' + label + ': register=' + totalRegister + ', converted=' + totalConverted + ', rate=' + rate + '%');
            
            result.push({
                label: label,
                days: daysOffset,
                register: totalRegister,
                converted: totalConverted,
                rate: rate
            });
            
            console.log('📊 result 当前长度:', result.length);
        }
        
        console.log('📊 for 循环结束，result 长度:', result.length);
        console.log('📊 result 内容:', JSON.stringify(result));
        console.log('✅ loadConversionData 最终结果:', result);
        
        cachedData.conversion = result;
        cachedData.lastConversionTime = now;
        applyConversionData(result, days);
        
    } catch (e) {
        console.error('❌ 加载转化率数据失败:', e);
    }
}

function applyConversionData(data, days) {
    // 🔥 如果 data 为空或没有数据，使用默认值
    if (!data || data.length === 0) {
        console.log('⚠️ applyConversionData: data 为空，使用默认值');
        data = [{ label: 'Today', days: 0, register: 0, converted: 0, rate: 0 }];
    }
    
    // 🔥 根据 days 参数决定显示哪个时间段的数据
    var displayData = null;
    var targetLabel = 'Today';
    
    if (days === 0) {
        targetLabel = 'Today';
    } else if (days === 7) {
        targetLabel = '7 Days';
    } else if (days === 30) {
        targetLabel = '30 Days';
    } else if (days === -1) {
        targetLabel = 'All Time';
    }
    
    // 查找匹配的数据
    for (var i = 0; i < data.length; i++) {
        if (data[i].label === targetLabel) {
            displayData = data[i];
            break;
        }
    }
    
    // 如果没找到，使用第一个
    if (!displayData && data.length > 0) {
        displayData = data[0];
    }
    
    if (!displayData) {
        displayData = { label: 'Today', register: 0, converted: 0, rate: 0 };
    }
    
    console.log('📊 applyConversionData 显示:', displayData);
    
    // 🔥 更新环形图百分比
    var ringPercent = document.getElementById('ringPercent');
    if (ringPercent) {
        ringPercent.innerText = displayData.rate + '%';
    }
    
    // 🔥 更新顶部显示的 Register / Converted 数字
    var registerEl = document.getElementById('conversionRegister');
    var convertedEl = document.getElementById('conversionConverted');
    var labelEl = document.getElementById('conversionLabel');
    
    // 🔥 直接更新，不使用 requestAnimationFrame（确保立即生效）
    if (registerEl) {
        registerEl.innerText = displayData.register;
        console.log('✅ Register 更新为:', displayData.register);
    }
    if (convertedEl) {
        convertedEl.innerText = displayData.converted;
        console.log('✅ Converted 更新为:', displayData.converted);
    }
    if (labelEl) {
        labelEl.innerText = displayData.label + ' Register';
    }
    
    // 🔥 更新所有统计行
    var allLabels = document.querySelectorAll('.conversion-stat-label');
    var allRegisters = document.querySelectorAll('.conversion-stat-register');
    var allConverteds = document.querySelectorAll('.conversion-stat-converted');
    var allRates = document.querySelectorAll('.conversion-stat-rate');
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
    
    // 更新第一行的数据
    if (allLabels.length > 0) allLabels[0].innerText = displayData.label;
    if (allRegisters.length > 0) allRegisters[0].innerText = displayData.register;
    if (allConverteds.length > 0) allConverteds[0].innerText = displayData.converted;
    if (allRates.length > 0) {
        allRates[0].innerText = displayData.rate + '%';
        allRates[0].style.color = displayData.rate >= 50 ? '#ccb89f' : displayData.rate >= 20 ? '#c8b090' : '#e88080';
    }
}

// ========== 初始化环形进度条 ==========
function initWaveRing() {
    var container = document.getElementById('waveRingContainer');
    if (!container) return;
    
    container.innerHTML = '';
    container.style.width = '200px';
    container.style.height = '200px';
    container.style.position = 'relative';
    container.style.margin = '0 auto';
    container.style.marginTop = '-20px';
    
    var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 200 200');
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
        <circle cx="100" cy="100" r="85" fill="none" stroke="rgba(204,184,159,0.06)" stroke-width="12"/>
        <circle cx="100" cy="100" r="85" fill="none" stroke="url(#progressGrad)" stroke-width="12" stroke-linecap="round" stroke-dasharray="534.07" stroke-dashoffset="534.07" filter="drop-shadow(0 0 20px rgba(204,184,159,0.15))" class="progress-ring" style="transition: stroke-dashoffset 1s ease;"/>
        <circle cx="100" cy="100" r="90" fill="none" stroke="rgba(204,184,159,0.03)" stroke-width="1"/>
    `;
    container.appendChild(svg);
    
    var centerText = document.createElement('div');
    centerText.style.cssText = 'position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);text-align:center;pointer-events:none;z-index:10;';
    centerText.innerHTML = `
        <div id="ringPercent" style="font-size:40px;font-weight:900;letter-spacing:-1px;line-height:1;background:linear-gradient(180deg,#ffffff 0%,#d0d8e8 35%,#8892a8 65%,#c0c8d8 100%);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;filter:drop-shadow(0 0 30px rgba(200,210,230,0.12)) drop-shadow(0 4px 8px rgba(0,0,0,0.3));">78%</div>
        <div style="font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;margin-top:4px;background:linear-gradient(180deg,#d0d8e8 0%,#8892a8 50%,#5a6a82 100%);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;filter:drop-shadow(0 0 20px rgba(200,210,230,0.08)) drop-shadow(0 2px 4px rgba(0,0,0,0.2));">Conversion Rate</div>
    `;
    container.appendChild(centerText);
    
    setTimeout(function() {
        var progressRing = container.querySelector('.progress-ring');
        if (progressRing) {
            var rate = parseInt(document.getElementById('ringPercent')?.innerText || '78');
            var circumference = 534.07;
            var offset = circumference - (circumference * rate / 100);
            progressRing.style.strokeDashoffset = offset;
        }
    }, 300);
}

// ========== 加载最近注册用户数据（根据当前筛选条件） ==========
async function loadRecentRegistrations() {
    var tbody = document.getElementById('recentRegistrationsBody');
    if (!tbody) return;
    
    try {
        // 🔥 根据 currentDays 计算日期范围
        var nowDate = getBerlinDate();
        var startDate = new Date(nowDate);
        
        if (currentDays === -1) {
            // All Time：从最早开始
            startDate = new Date('2000-01-01');
        } else if (currentDays === 0) {
            // Today：只取今天
            startDate.setHours(0, 0, 0, 0);
        } else {
            // 7 Days / 30 Days
            startDate.setDate(startDate.getDate() - currentDays);
        }
        
        var startStr = startDate.toISOString().split('T')[0];
        
        // 🔥 查询时过滤日期
        var query = sb.from('users')
            .select('uid, username, invited_by_username, created_at, balance')
            .order('created_at', { ascending: false })
            .limit(9);
        
        // 如果不是 All Time，添加日期过滤
        if (currentDays !== -1) {
            query = query.gte('created_at', startStr);
            if (currentDays === 0) {
                // Today：只取今天
                query = query.gte('created_at', startStr + 'T00:00:00');
            }
        }
        
        var usersRes = await query;
        var users = usersRes.data || [];
        
        if (users.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 12px; color: #5a6a7a; font-size: 12px;">No users in this period</td></tr>';
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
            
            var amount = totalManual > 0 ? '€' + totalManual.toFixed(2) : '€0.00';
            
            // 🔥 行样式 - 字体更大更亮，使用 Font Awesome 图标
            html += '<tr style="border-bottom: 1px solid rgba(200,176,144,0.04);">' +
                '<td style="padding: 5px 8px; color: #e8eef8; font-weight: 600; font-size: 13px;">' + escapeHtml(u.uid) + '</td>' +
                '<td style="padding: 5px 8px; color: #aab8c8; font-size: 13px;">' + escapeHtml(referrer) + '</td>' +
                '<td style="padding: 5px 8px; text-align: center; font-size: 13px; font-weight: 500;">' + 
                    (hasManualDeposit ? '<i class="fas fa-check-circle" style="color: #4ade80; font-size: 15px;"></i>' : '<i class="fas fa-times-circle" style="color: #5a4a3a; font-size: 15px;"></i>') + 
                '</td>' +
                '<td style="padding: 5px 8px; text-align: right; color: ' + (totalManual > 0 ? '#d4c8a0' : '#5a6a7a') + '; font-weight: 600; font-size: 13px;">' + amount + '</td>' +
                '</tr>';
        }
        tbody.innerHTML = html;
        
    } catch (e) {
        console.error('加载最近注册用户失败:', e);
        tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 12px; color: #e88080; font-size: 12px;">Failed to load</td></tr>';
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
    
    // 🔥 更新 currentDays 供 loadRecentRegistrations 使用
    currentDays = days;
    
    var conversionForce = force || (days === 0);
    
    await Promise.all([
        loadQuickCards(),
        loadStatsData(days, force),
        loadChartData(force),
        loadConversionData(days, conversionForce),
        loadActivityTimeline(force),
        loadRecentRegistrations()
    ]);

// 🔥 只在 Today 视图更新 New Order 数据
if (days === 0) {
    var today = getBerlinDate();
    var todayStr = today.toISOString().split('T')[0];
    try {
        var user = getCurrentUser();
        var stored = localStorage.getItem('newOrderData_' + (user?.uid || 'global'));
        if (stored) {
            var parsed = JSON.parse(stored);
            if (parsed.date === todayStr) {
                newOrderData = parsed.data || [];
                newOrderCount = parsed.count || 0;
            } else {
                newOrderData = [];
                newOrderCount = 0;
                lastNewOrderDate = todayStr;
            }
        }
        updateNewOrderBadge();
    } catch (e) {}
    
    setTimeout(updateNewOrderData, 500);
} else {
    var congratsEl = document.getElementById('congratsMessage');
    if (congratsEl) {
        congratsEl.innerHTML = '';
        congratsEl.style.display = 'none';
    }
}
    
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
                    var circumference = 534.07;
var offset = circumference - (circumference * rate / 100);
                    progressRing.style.strokeDashoffset = offset;
                }
            }
        }
    }
    
    // 🔥 返回 Promise
    return;
}

// ============================================================
// initTrendChart - 柏林时间，最近7天
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
    
    console.log('📊 趋势图已加载（柏林时间，最近7天）');
    
    trendChart = echarts.init(dom);
    
    // ✅ 生成最近7天的日期标签（柏林时间）
    var defaultDates = [];
    var today = getBerlinDate();
    
    for (var i = 6; i >= 0; i--) {
        var d = new Date(today);
        d.setDate(d.getDate() - i);
        defaultDates.push((d.getMonth() + 1) + '/' + d.getDate());
    }
    
    // 默认数据：全部为 0
    var defaultDepositData = [];
    var defaultWithdrawData = [];
    
    for (var i = 0; i < 7; i++) {
        defaultDepositData.push(0);
        defaultWithdrawData.push(0);
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
                    if (p.value !== null && p.value !== undefined && p.value > 0) {
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
                color: 'rgba(255,255,255,0.6)', 
                fontSize: 12
            }, 
            axisLine: { lineStyle: { color: 'rgba(255,255,255,0.04)' } }, 
            axisTick: { show: false } 
        },
        yAxis: { 
            type: 'value', 
            name: '', 
            axisLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 12 }, 
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
    
    console.log('✅ D&W Trend 初始化完成（柏林时间，最近7天）');
    
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
        
        console.log('🔍 bindDateFilters 切换日期:', days);
        
        refreshDashboard(days, true);
    }, DEBOUNCE_DELAY);
    
    document.querySelectorAll('.date-filter-btn').forEach(function(btn) {
        if (btn._handler) btn.removeEventListener('click', btn._handler);
        btn._handler = function() { handleFilterChange(btn); };
        btn.addEventListener('click', btn._handler);
    });
}

// ========== 更新时间显示 ==========
function updateBerlinClock() {
    var now = getBerlinDate();
    var hours = String(now.getHours()).padStart(2, '0');
    var minutes = String(now.getMinutes()).padStart(2, '0');
    var seconds = String(now.getSeconds()).padStart(2, '0');
    var timeStr = hours + ':' + minutes + ':' + seconds;
    
    var clockEl = document.getElementById('berlinClock');
    if (clockEl) {
        clockEl.textContent = timeStr;
    }
}

function loadDashboardPage(days) {
    days = days || 0;
    var container = document.getElementById('page_dashboard');
    if (!container) return;
    
    if (dashboardRendered) {
        refreshDashboard(currentDays, true);
        return;
    }
    
    dashboardRendered = true;
    
    container.innerHTML = `

        <!-- 日期过滤器 -->
<div style="display: flex; justify-content: flex-end; gap: 10px; padding-top: 20px; margin-top: 8px; margin-bottom: 24px; flex-wrap: wrap;">
    <button class="date-filter-btn active" data-days="0" style="background: linear-gradient(145deg, rgba(20,24,40,0.6), rgba(10,12,24,0.4)); border: 1px solid rgba(180,180,200,0.06); border-radius: 30px; padding: 8px 20px; color: #8892a8; cursor: pointer; transition: all 0.3s; font-size: 13px; font-weight: 500; font-family: 'Inter', sans-serif; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">Today</button>
    <button class="date-filter-btn" data-days="7" style="background: linear-gradient(145deg, rgba(20,24,40,0.6), rgba(10,12,24,0.4)); border: 1px solid rgba(180,180,200,0.06); border-radius: 30px; padding: 8px 20px; color: #8892a8; cursor: pointer; transition: all 0.3s; font-size: 13px; font-weight: 500; font-family: 'Inter', sans-serif; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">7 Days</button>
    <button class="date-filter-btn" data-days="30" style="background: linear-gradient(145deg, rgba(20,24,40,0.6), rgba(10,12,24,0.4)); border: 1px solid rgba(180,180,200,0.06); border-radius: 30px; padding: 8px 20px; color: #8892a8; cursor: pointer; transition: all 0.3s; font-size: 13px; font-weight: 500; font-family: 'Inter', sans-serif; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">30 Days</button>
    <button class="date-filter-btn" data-days="-1" style="background: linear-gradient(145deg, rgba(20,24,40,0.6), rgba(10,12,24,0.4)); border: 1px solid rgba(180,180,200,0.06); border-radius: 30px; padding: 8px 20px; color: #8892a8; cursor: pointer; transition: all 0.3s; font-size: 13px; font-weight: 500; font-family: 'Inter', sans-serif; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">All Time</button>
</div>

<!-- 🔥 柏林实时时间 -->
<div style="display: flex; justify-content: flex-end; align-items: center; margin-bottom: 16px; padding: 6px 16px; background: rgba(20,24,40,0.3); border-radius: 30px; border: 1px solid rgba(200,176,144,0.06); width: fit-content; margin-left: auto;">
    <div style="display: flex; align-items: center; gap: 10px;">
        <i class="fas fa-clock" style="color: #8892a8; font-size: 13px;"></i>
        <span style="color: #6a7a8a; font-size: 11px; font-weight: 500; letter-spacing: 0.5px;">BERLIN</span>
        <span id="berlinClock" style="color: #e8eef0; font-size: 14px; font-weight: 600; font-family: 'Courier New', monospace; letter-spacing: 1px;">00:00:00</span>
    </div>
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
                    <div style="font-size: 15px; font-weight: 600; color: #d8dff0;">Conversion Rate</div>
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
                        
                        <!-- ========== Recent 表格 ========== -->
                        <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid rgba(200,176,144,0.06);">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                                <div style="font-size: 11px; color: #8a7a6a; font-weight: 600; letter-spacing: 0.8px; text-transform: uppercase;">
                                    <i class="fas fa-users" style="color: #ccb89f; margin-right: 6px; font-size: 11px;"></i>Recent
                                </div>
                                <!-- ❌ View All 已删除 -->
                            </div>
                            <div style="overflow-y: auto; max-height: 155px;">
                                <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
                                    <thead>
                                        <tr style="border-bottom: 1px solid rgba(200,176,144,0.06); position: sticky; top: 0; background: rgba(20,24,40,0.95); z-index: 2;">
                                            <th style="text-align: left; padding: 5px 8px; color: #c8b8a8; font-weight: 600; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px;">User</th>
                                            <th style="text-align: left; padding: 5px 8px; color: #c8b8a8; font-weight: 600; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px;">Ref</th>
                                            <th style="text-align: center; padding: 5px 8px; color: #c8b8a8; font-weight: 600; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px;">Joined</th>
                                            <th style="text-align: right; padding: 5px 8px; color: #c8b8a8; font-weight: 600; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px;">Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody id="recentRegistrationsBody">
                                        <tr><td colspan="4" style="text-align: center; padding: 12px; color: #5a6a7a; font-size: 12px;">Loading...</td></tr>
                                    </tbody>
                                </table>
                            </div>

<!-- 🔥 New Order 按钮 -->
<div style="margin-top: 8px; padding-top: 6px; border-top: 1px solid rgba(200,176,144,0.04);">
    <div style="display:flex; justify-content:center; position:relative; z-index:1;">
        <button id="newOrderBtn" class="btn-new-order" style="
            display: inline-flex;
            align-items: center;
            gap: 10px;
            padding: 10px 24px;
            border-radius: 40px;
            font-weight: 600;
            font-size: 13px;
            cursor: pointer;
            font-family: 'Inter', sans-serif;
            transition: all 0.3s ease;
            border: none;
            position: relative;
            overflow: hidden;
            background: linear-gradient(145deg, #1a1a2e, #2a2a4a, #1a1a2e);
            color: #e8e8f0;
            border: 1px solid rgba(200,200,220,0.15);
            box-shadow: 0 4px 24px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.06);
        ">
            <i class="fas fa-gem" style="font-size:13px; color:rgba(200,200,220,0.4);"></i>
            <span>New Order</span>
        </button>
    </div>
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
    
    // 启动时钟
    updateBerlinClock();
    if (window.clockInterval) clearInterval(window.clockInterval);
    window.clockInterval = setInterval(updateBerlinClock, 1000);
    
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
            padding: 5px 8px;
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
    try {
        initTrendChart();
        bindDateFilters();
        initWaveRing();
        initNotificationEvents();
    } catch (e) {
        console.warn('⚠️ 初始化组件时出错:', e.message);
    }
    
    cachedData.conversion = null;
    cachedData.lastConversionTime = 0;
    
    // 🔥 绑定 New Order 按钮
    var btn = document.getElementById('newOrderBtn');
    if (btn) {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            showNewOrderPanel(this);
        });
        updateNewOrderBadge();
    }
    
    refreshDashboard(0, true).then(function() {
        console.log('✅ Dashboard 数据加载完成');
        console.log('🔄 实时监听已启动，无需定时轮询');
    });
}, 200);

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

// ============================================================
// 🔥 轻量级刷新函数（事件驱动）
// ============================================================

// 只刷新快捷卡片
async function refreshQuickCardsOnly() {
    try {
        var [kycRes, withdrawalRes, emailRes] = await Promise.all([
            sb.from('kyc_verifications').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
            sb.from('withdrawals').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
            sb.from('email_verification_requests').select('id', { count: 'exact', head: true }).eq('is_verified', false).is('code', null)
        ]);
        
        var kycEl = document.getElementById('kycPendingCount');
        var withdrawalEl = document.getElementById('withdrawalPendingCount');
        var emailEl = document.getElementById('emailPendingCount');
        
        if (kycEl) kycEl.innerText = kycRes.count || 0;
        if (withdrawalEl) withdrawalEl.innerText = withdrawalRes.count || 0;
        if (emailEl) emailEl.innerText = emailRes.count || 0;
    } catch (e) {
        console.error('刷新快捷卡片失败:', e);
    }
}

// 只刷新 Recent 表格
async function refreshRecentOnly() {
    try {
        var nowDate = getBerlinDate();
        var startDate = new Date(nowDate);
        startDate.setHours(0, 0, 0, 0);
        var startStr = startDate.toISOString().split('T')[0];
        
        var { data: users } = await sb.from('users')
            .select('uid, username, invited_by_username, created_at, balance')
            .gte('created_at', startStr + 'T00:00:00')
            .order('created_at', { ascending: false })
            .limit(9);
        
        var tbody = document.getElementById('recentRegistrationsBody');
        if (!tbody) return;
        
        if (!users || users.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 12px; color: #5a6a7a; font-size: 12px;">No users today</td></tr>';
            return;
        }
        
        var uids = users.map(function(u) { return u.uid; });
        var { data: deposits } = await sb.from('deposits')
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
            var amount = totalManual > 0 ? '€' + totalManual.toFixed(2) : '€0.00';
            
            html += '<tr style="border-bottom: 1px solid rgba(200,176,144,0.04);">' +
                '<td style="padding: 5px 8px; color: #e8eef8; font-weight: 600; font-size: 13px;">' + escapeHtml(u.uid) + '</td>' +
                '<td style="padding: 5px 8px; color: #aab8c8; font-size: 13px;">' + escapeHtml(referrer) + '</td>' +
                '<td style="padding: 5px 8px; text-align: center; font-size: 13px; font-weight: 500;">' + 
                    (hasManualDeposit ? '<i class="fas fa-check-circle" style="color: #4ade80; font-size: 15px;"></i>' : '<i class="fas fa-times-circle" style="color: #5a4a3a; font-size: 15px;"></i>') + 
                '</td>' +
                '<td style="padding: 5px 8px; text-align: right; color: ' + (totalManual > 0 ? '#d4c8a0' : '#5a6a7a') + '; font-weight: 600; font-size: 13px;">' + amount + '</td>' +
                '</tr>';
        }
        tbody.innerHTML = html;
        
    } catch (e) {
        console.error('刷新Recent失败:', e);
    }
}

// 只刷新转化率
async function refreshConversionOnly() {
    try {
        var today = getBerlinDate();
        var todayStr = today.toISOString().split('T')[0];
        
        var [usersRes, depositsRes] = await Promise.all([
            sb.from('users').select('uid').gte('created_at', todayStr + 'T00:00:00'),
            sb.from('deposits').select('uid').in('type', ['manual', 'deposit_bonus']).gte('created_at', todayStr + 'T00:00:00')
        ]);
        
        var users = usersRes.data || [];
        var deposits = depositsRes.data || [];
        
        var depositUsers = {};
        deposits.forEach(function(d) {
            depositUsers[d.uid] = true;
        });
        
        var totalRegister = users.length;
        var totalConverted = users.filter(function(u) {
            return depositUsers[u.uid] === true;
        }).length;
        var rate = totalRegister > 0 ? Math.round((totalConverted / totalRegister) * 100) : 0;
        
        var registerEl = document.getElementById('conversionRegister');
        var convertedEl = document.getElementById('conversionConverted');
        var ringPercent = document.getElementById('ringPercent');
        
        if (registerEl) registerEl.innerText = totalRegister;
        if (convertedEl) convertedEl.innerText = totalConverted;
        if (ringPercent) ringPercent.innerText = rate + '%';
        
    } catch (e) {
        console.error('刷新转化率失败:', e);
    }
}

// 暴露给 admin-common.js 使用
window.refreshQuickCardsOnly = refreshQuickCardsOnly;
window.refreshRecentOnly = refreshRecentOnly;
window.refreshConversionOnly = refreshConversionOnly;

// ============================================================
// 🔥 New Order 功能函数
// ============================================================

function showNewOrderPanel(btnElement) {
    if (newOrderPanel) {
        newOrderPanel.remove();
        newOrderPanel = null;
        return;
    }
    
    var today = getBerlinDate();
    var todayStr = today.toISOString().split('T')[0];
    
    if (lastNewOrderDate !== todayStr) {
        newOrderData = [];
        newOrderCount = 0;
        lastNewOrderDate = todayStr;
        try {
            localStorage.setItem('newOrderData_' + (getCurrentUser()?.uid || 'global'), JSON.stringify({
                data: newOrderData,
                count: newOrderCount,
                date: todayStr
            }));
        } catch (e) {}
    }
    
    try {
        var user = getCurrentUser();
        var stored = localStorage.getItem('newOrderData_' + (user?.uid || 'global'));
        if (stored) {
            var parsed = JSON.parse(stored);
            if (parsed.date === todayStr) {
                newOrderData = parsed.data || [];
                newOrderCount = parsed.count || 0;
            }
        }
    } catch (e) {}
    
    var panel = document.createElement('div');
    panel.id = 'newOrderPanel';
    panel.style.cssText = `
        position: fixed;
        top: 20px;
        left: 20px;
        z-index: 99999;
        background: rgba(12, 16, 30, 0.75);
        backdrop-filter: blur(24px);
        -webkit-backdrop-filter: blur(24px);
        border-radius: 20px;
        padding: 24px 28px;
        min-width: 380px;
        max-width: 440px;
        max-height: 360px;
        overflow-y: auto;
        box-shadow: 0 30px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.03);
        animation: newOrderFadeSlide 0.35s ease;
        border: none;
    `;
    
    if (!document.getElementById('newOrderAnimStyle')) {
        var styleEl = document.createElement('style');
        styleEl.id = 'newOrderAnimStyle';
        styleEl.textContent = `
            @keyframes newOrderFadeSlide {
                0% { opacity: 0; transform: translateY(-10px) scale(0.97); }
                100% { opacity: 1; transform: translateY(0) scale(1); }
            }
            #newOrderPanel::-webkit-scrollbar { width: 2px; }
            #newOrderPanel::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.06); border-radius: 4px; }
        `;
        document.head.appendChild(styleEl);
    }
    
    var itemsHtml = '';
    if (newOrderData.length === 0) {
        itemsHtml = `
            <div style="text-align:center; padding:20px 0; color:rgba(255,255,255,0.04); font-size:13px;">
                <i class="fas fa-inbox" style="display:block; font-size:24px; margin-bottom:6px; color:rgba(255,255,255,0.02);"></i>
                No new orders today
            </div>
        `;
    } else {
        newOrderData.forEach(function(item) {
            itemsHtml += `
                <div style="padding:8px 10px; border-radius:8px; font-size:13px; color:rgba(255,255,255,0.55); line-height:1.5; transition:0.15s;">
                    <span style="color:#C9B095; font-weight:500;">${escapeHtml(item.referrer)}</span>'s client <span style="color:#ffd700; font-weight:600;">${escapeHtml(item.uid)}</span> become new order today! <i class="fas fa-gem" style="color:rgba(200,200,220,0.06); margin-left:4px; font-size:11px;"></i>
                </div>
            `;
        });
    }
    
    panel.innerHTML = `
        <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:14px; padding-bottom:10px; border-bottom:1px solid rgba(255,255,255,0.04);">
            <div style="display:flex; align-items:center; gap:10px;">
                <i class="fas fa-gem" style="font-size:16px; color:rgba(200,200,220,0.25);"></i>
                <span style="font-size:12px; font-weight:600; color:rgba(255,255,255,0.35); text-transform:uppercase; letter-spacing:1.5px;">Today's New Orders</span>
            </div>
            <span style="font-size:12px; font-weight:600; color:rgba(200,200,220,0.2); background:rgba(255,255,255,0.02); padding:2px 14px; border-radius:20px; letter-spacing:0.3px;">${newOrderCount}</span>
        </div>
        <div style="display:flex; flex-direction:column; gap:1px; max-height:240px; overflow-y:auto; padding-right:2px;">
            ${itemsHtml}
        </div>
    `;
    
    document.body.appendChild(panel);
    newOrderPanel = panel;
    
    var closeHandler = function(e) {
        if (panel && !panel.contains(e.target) && e.target.id !== 'newOrderBtn') {
            panel.remove();
            newOrderPanel = null;
            document.removeEventListener('click', closeHandler);
        }
    };
    setTimeout(function() { document.addEventListener('click', closeHandler); }, 100);
    
    var escHandler = function(e) {
        if (e.key === 'Escape' && newOrderPanel) {
            newOrderPanel.remove();
            newOrderPanel = null;
            document.removeEventListener('keydown', escHandler);
        }
    };
    document.addEventListener('keydown', escHandler);
}

function updateNewOrderBadge() {
    var btn = document.getElementById('newOrderBtn');
    if (!btn) return;
    
    var badge = btn.querySelector('.order-badge');
    if (newOrderCount > 0) {
        if (!badge) {
            badge = document.createElement('span');
            badge.className = 'order-badge';
            badge.style.cssText = `
                position: absolute;
                top: -6px;
                right: -6px;
                background: #ffd700;
                color: #0a0f2a;
                font-size: 10px;
                font-weight: 700;
                min-width: 18px;
                height: 18px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 0 5px;
                box-shadow: 0 0 20px rgba(255,215,0,0.15);
                border: 1px solid rgba(255,215,0,0.2);
            `;
            badge.textContent = newOrderCount;
            btn.style.position = 'relative';
            btn.appendChild(badge);
        } else {
            badge.textContent = newOrderCount;
        }
    } else {
        if (badge) badge.remove();
    }
}

async function updateNewOrderData() {
    try {
        var today = getBerlinDate();
        var todayStr = today.toISOString().split('T')[0];
        
        var { data: users } = await sb
            .from('users')
            .select('uid, username, invited_by_username')
            .gte('created_at', todayStr + 'T00:00:00');
        
        if (!users || users.length === 0) {
            newOrderData = [];
            newOrderCount = 0;
            updateNewOrderBadge();
            return;
        }
        
        var uids = users.map(function(u) { return u.uid; });
        var { data: deposits } = await sb
            .from('deposits')
            .select('uid, amount')
            .in('uid', uids)
            .in('type', ['manual', 'deposit_bonus']);
        
        var depositUsers = {};
        if (deposits) {
            deposits.forEach(function(d) {
                if (d.amount >= 40) {
                    depositUsers[d.uid] = true;
                }
            });
        }
        
        var convertedUsers = users.filter(function(u) {
            return depositUsers[u.uid] === true;
        });
        
        newOrderData = [];
        convertedUsers.forEach(function(u) {
            var referrer = u.invited_by_username || 'New';
            newOrderData.push({
                referrer: referrer,
                uid: u.uid
            });
        });
        newOrderCount = newOrderData.length;
        
        try {
            var user = getCurrentUser();
            localStorage.setItem('newOrderData_' + (user?.uid || 'global'), JSON.stringify({
                data: newOrderData,
                count: newOrderCount,
                date: todayStr
            }));
        } catch (e) {}
        
        updateNewOrderBadge();
        
    } catch (e) {
        console.error('更新 New Order 数据失败:', e);
    }
}

function addNewOrder(referrer, uid) {
    var today = getBerlinDate();
    var todayStr = today.toISOString().split('T')[0];
    
    if (lastNewOrderDate !== todayStr) {
        newOrderData = [];
        newOrderCount = 0;
        lastNewOrderDate = todayStr;
    }
    
    var exists = newOrderData.some(function(item) { return item.uid === uid; });
    if (exists) return;
    
    newOrderData.push({ referrer: referrer, uid: uid });
    newOrderCount = newOrderData.length;
    
    try {
        var user = getCurrentUser();
        localStorage.setItem('newOrderData_' + (user?.uid || 'global'), JSON.stringify({
            data: newOrderData,
            count: newOrderCount,
            date: todayStr
        }));
    } catch (e) {}
    
    updateNewOrderBadge();
}

// 暴露 New Order 函数
window.addNewOrder = addNewOrder;
window.updateNewOrderData = updateNewOrderData;
window.showNewOrderPanel = showNewOrderPanel;
window.updateNewOrderBadge = updateNewOrderBadge;

// ============================================================
// 初始化 New Order 数据
// ============================================================
(function initNewOrderData() {
    var today = getBerlinDate();
    var todayStr = today.toISOString().split('T')[0];
    try {
        var user = getCurrentUser();
        var stored = localStorage.getItem('newOrderData_' + (user?.uid || 'global'));
        if (stored) {
            var parsed = JSON.parse(stored);
            if (parsed.date === todayStr) {
                newOrderData = parsed.data || [];
                newOrderCount = parsed.count || 0;
            } else {
                newOrderData = [];
                newOrderCount = 0;
                lastNewOrderDate = todayStr;
            }
        }
    } catch (e) {}
})();

console.log('✅ admin-dashboard.js loaded');
console.log('   - Recent 表格: 9条 (可滑动)');
console.log('   - 环形图: 上移, 尺寸缩小');
console.log('   - New Order 按钮: 样式3 (深色金属+银边)');
console.log('   - 展开窗: 样式A (毛玻璃, 标题亮色)');
console.log('   - UID: 黄色高亮, 无#前缀');