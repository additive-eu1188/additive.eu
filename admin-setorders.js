// admin-setorders.js - 订单触发页面（单页版，与 Withdrawal 风格一致）
let selectedAdvancedOrdersList = [];
let currentSetUser = null;
let currentTriggerTab = 'advanced';

// ============================================================
// 辅助函数 - 生成随机 Platform（仅用于卡牌订单）
// ============================================================
var PLATFORM_OPTIONS = ['Booking.com', 'Tripadvisor', 'Trivago', 'HRS', 'Airbnb', 'Hotels.com'];

function getRandomPlatform() {
    return PLATFORM_OPTIONS[Math.floor(Math.random() * PLATFORM_OPTIONS.length)];
}

async function loadSetordersPage() {
    const container = document.getElementById('page_setorders');
    if (!container) return;
    
    container.innerHTML = `
        <div class="card">
            <!-- 顶部 -->
            <div class="withdraw-header" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; margin-bottom: 24px;">
                <h2 style="font-size: 18px; font-weight: 600; color: #d8e0f0; margin: 0;">
                    <i class="fas fa-cog" style="color: #8892a8; margin-right: 10px;"></i>
                    Orders Trigger
                </h2>
                <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                    <button id="refreshTriggerBtn" class="btn-primary"><i class="fas fa-sync-alt"></i> Refresh</button>
                </div>
            </div>
            
            <!-- ========== 主面板：左右两栏 ========== -->
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 28px;">
                
                <!-- ===== 左侧面板 ===== -->
                <div style="background: rgba(12, 16, 28, 0.6); border-radius: 16px; padding: 20px; border: 1px solid rgba(255,255,255,0.04);">
                    
                    <!-- Trigger UID 输入 -->
                    <div style="margin-bottom: 16px;">
                        <label style="display: block; font-size: 10px; color: #6a7a92; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">Trigger UID</label>
                        <div style="display: flex; gap: 10px; align-items: center;">
                            <input type="text" id="triggerUidInput" class="search-input" placeholder="Enter UID" style="flex: 0 0 180px; max-width: 180px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.06); border-radius: 40px; padding: 8px 16px; color: #e6edf5; font-size: 13px; outline: none; height: 38px; box-sizing: border-box;">
                            
                            <!-- ✅ 用户 Round / Order 显示框 - 高度与搜索框一致 -->
                            <div id="userRoundDisplay" style="flex: 1; min-width: 160px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.06); border-radius: 40px; padding: 0 16px; color: rgba(255,255,255,0.3); font-size: 13px; text-align: center; font-weight: 500; transition: all 0.3s ease; height: 38px; box-sizing: border-box; display: flex; align-items: center; justify-content: center;">
                                <span id="userRoundText" style="display: flex; align-items: center; justify-content: space-between; width: 100%;">---</span>
                            </div>
                            
                            <button id="triggerUidSearchBtn" class="btn-primary" style="padding: 8px 20px; border-radius: 40px; border: none; background: #2a3a5a; color: #ffffff; font-weight: 600; cursor: pointer; font-size: 13px; white-space: nowrap; font-family: 'Inter', sans-serif; height: 38px; box-sizing: border-box; display: flex; align-items: center;">
                                <i class="fas fa-search"></i> Search
                            </button>
                        </div>
                    </div>
                    
                    <!-- 4张确认卡片 -->
                    <div id="confirmCardsContainer" style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin-bottom: 16px;">
                        <div style="background: rgba(255,255,255,0.02); border-radius: 12px; padding: 12px; text-align: center; border: 1px solid rgba(255,255,255,0.04);">
                            <div style="font-size: 9px; color: #6a7a92; text-transform: uppercase; letter-spacing: 0.5px;">User ID</div>
                            <div style="font-size: 15px; font-weight: 700; color: #d8e0f0;" id="cardUid">-</div>
                        </div>
                        <div style="background: rgba(255,255,255,0.02); border-radius: 12px; padding: 12px; text-align: center; border: 1px solid rgba(255,255,255,0.04);">
                            <div style="font-size: 9px; color: #6a7a92; text-transform: uppercase; letter-spacing: 0.5px;">Trigger Type</div>
                            <div style="font-size: 15px; font-weight: 700; color: #d8e0f0;" id="cardType">-</div>
                        </div>
                        <div style="background: rgba(255,255,255,0.02); border-radius: 12px; padding: 12px; text-align: center; border: 1px solid rgba(255,255,255,0.04);">
                            <div style="font-size: 9px; color: #6a7a92; text-transform: uppercase; letter-spacing: 0.5px;">Trigger Numbers</div>
                            <div style="font-size: 15px; font-weight: 700; color: #d8e0f0;" id="cardNumbers">-</div>
                        </div>
                        <div style="background: rgba(255,255,255,0.02); border-radius: 12px; padding: 12px; text-align: center; border: 1px solid rgba(255,255,255,0.04);">
                            <div style="font-size: 9px; color: #6a7a92; text-transform: uppercase; letter-spacing: 0.5px;">Trigger Amount</div>
                            <div style="font-size: 15px; font-weight: 700; color: #c8b090;" id="cardAmount">-</div>
                        </div>
                    </div>
                    
                    <!-- Trigger Type 标签 -->
                    <div style="display: flex; gap: 8px; margin-bottom: 16px;">
                        <button class="trigger-tab-btn active" data-type="advanced" style="flex: 1; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.06); border-radius: 30px; padding: 8px 12px; color: rgba(255,255,255,0.3); cursor: pointer; font-size: 11px; font-weight: 500; transition: all 0.2s; font-family: 'Inter', sans-serif; text-align: center;">
                            <i class="fas fa-crown"></i> Commercial Order
                        </button>
                        <button class="trigger-tab-btn" data-type="card_reward" style="flex: 1; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.06); border-radius: 30px; padding: 8px 12px; color: rgba(255,255,255,0.3); cursor: pointer; font-size: 11px; font-weight: 500; transition: all 0.2s; font-family: 'Inter', sans-serif; text-align: center;">
                            <i class="fas fa-gem"></i> Diamond Reward
                        </button>
                        <button class="trigger-tab-btn" data-type="card_order" style="flex: 1; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.06); border-radius: 30px; padding: 8px 12px; color: rgba(255,255,255,0.3); cursor: pointer; font-size: 11px; font-weight: 500; transition: all 0.2s; font-family: 'Inter', sans-serif; text-align: center;">
                            <i class="fas fa-ticket-alt"></i> x30 Commissions
                        </button>
                        <button class="trigger-tab-btn" data-type="svip_order" style="flex: 1; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.06); border-radius: 30px; padding: 8px 12px; color: rgba(255,255,255,0.3); cursor: pointer; font-size: 11px; font-weight: 500; transition: all 0.2s; font-family: 'Inter', sans-serif; text-align: center;">
                            <i class="fas fa-crown" style="color: #ffd700;"></i> x20 SVIP Order
                        </button>
                    </div>
                    
                    <!-- 输入区域 -->
                    <div style="display: flex; gap: 10px; margin-bottom: 12px;">
                        <div style="flex: 1;">
                            <label style="display: block; font-size: 10px; color: #6a7a92; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 2px;">Orders Number</label>
                            <input type="number" id="triggerOrderCount" class="search-input" value="1" min="1" step="1" style="width: 100%; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.06); border-radius: 8px; padding: 8px 12px; color: #e6edf5; font-size: 13px; outline: none;">
                        </div>
                        <div style="flex: 2;">
                            <label style="display: block; font-size: 10px; color: #6a7a92; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 2px;" id="triggerAmountLabel">Order Price (€)</label>
                            <div style="display: flex; gap: 8px;">
                                <input type="number" id="triggerAmount" class="search-input" step="0.01" min="0" placeholder="Enter amount" style="flex: 1; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.06); border-radius: 8px; padding: 8px 12px; color: #e6edf5; font-size: 13px; outline: none;">
                                <button id="triggerSearchBtn" class="btn-primary" style="padding: 8px 16px; border-radius: 40px; border: none; background: #2a3a5a; color: #ffffff; font-weight: 600; cursor: pointer; font-size: 13px; white-space: nowrap; font-family: 'Inter', sans-serif;">
                                    <i class="fas fa-search"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Confirm / Cancel 按钮 -->
                    <div style="display: flex; gap: 10px;">
                        <button id="confirmTriggerBtn" class="success" style="flex: 1; background: rgba(74,222,128,0.06); border: 1px solid rgba(74,222,128,0.08); border-radius: 40px; padding: 8px 0; color: #ffffff; font-weight: 600; font-size: 13px; cursor: pointer; transition: all 0.3s; font-family: 'Inter', sans-serif; display: flex; align-items: center; justify-content: center; gap: 6px;">
                            <i class="fas fa-check"></i> Confirm Trigger
                        </button>
                        <button id="cancelTriggerBtn" class="danger" style="flex: 1; background: rgba(232,128,128,0.06); border: 1px solid rgba(232,128,128,0.08); border-radius: 40px; padding: 8px 0; color: #ffffff; font-weight: 600; font-size: 13px; cursor: pointer; transition: all 0.3s; font-family: 'Inter', sans-serif; display: flex; align-items: center; justify-content: center; gap: 6px;">
                            <i class="fas fa-times"></i> Cancel
                        </button>
                    </div>
                </div>
                
                <!-- ===== 右侧面板 ===== -->
                <div style="background: rgba(12, 16, 28, 0.6); border-radius: 16px; padding: 20px; border: 1px solid rgba(255,255,255,0.04);">
                    <div style="font-size: 11px; color: #6a7a92; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px;">
                        <i class="fas fa-search" style="color: #8892a8;"></i> Search Results
                    </div>
                    <div id="searchResultsContainer" style="max-height: 320px; overflow-y: auto;">
                        <div style="text-align: center; padding: 40px 20px; color: #6a7a92; font-size: 13px;">
                            <i class="fas fa-desktop" style="display: block; font-size: 48px; color: rgba(255,255,255,0.04); margin-bottom: 12px;"></i>
                            <span style="color: rgba(255,255,255,0.08);">Search product price to show result</span>
                            <div style="font-size: 11px; color: rgba(255,255,255,0.04); margin-top: 4px;">Enter Trigger UID → Get Balance → Auto Calculate</div>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- ===== 底部：Trigger Status & History ===== -->
            <div style="background: rgba(12, 16, 28, 0.6); border-radius: 16px; padding: 20px; border: 1px solid rgba(255,255,255,0.04);">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                    <h3 style="font-size: 14px; font-weight: 600; color: #d8e0f0; margin: 0;">
                        <i class="fas fa-history" style="color: #8892a8; margin-right: 8px;"></i>
                        Trigger Status & History
                    </h3>
                    <button id="refreshHistoryBtn" class="btn-primary" style="padding: 4px 16px; border-radius: 40px; border: none; background: rgba(255,255,255,0.06); color: #ffffff; font-weight: 500; cursor: pointer; font-size: 12px; font-family: 'Inter', sans-serif;">
                        <i class="fas fa-sync-alt"></i> Refresh
                    </button>
                </div>
                
                <div class="table-container" style="max-height: 300px; overflow-y: auto; border-radius: 12px; border: 1px solid rgba(255,255,255,0.03);">
                    <table class="data-table" style="width: 100%; border-collapse: collapse; font-size: 12px; min-width: 700px;">
                        <thead>
                            <tr>
                                <th style="padding: 10px 14px; color: #a8b4d0; font-weight: 600; font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid rgba(255,255,255,0.04); background: rgba(10,14,28,0.3); text-align: left; min-width: 60px;">User ID</th>
                                <th style="padding: 10px 14px; color: #a8b4d0; font-weight: 600; font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid rgba(255,255,255,0.04); background: rgba(10,14,28,0.3); text-align: left;">Trigger Type</th>
                                <th style="padding: 10px 14px; color: #a8b4d0; font-weight: 600; font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid rgba(255,255,255,0.04); background: rgba(10,14,28,0.3); text-align: left;">Orders Number</th>
                                <th style="padding: 10px 14px; color: #a8b4d0; font-weight: 600; font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid rgba(255,255,255,0.04); background: rgba(10,14,28,0.3); text-align: left;">Trigger Amount</th>
                                <th style="padding: 10px 14px; color: #a8b4d0; font-weight: 600; font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid rgba(255,255,255,0.04); background: rgba(10,14,28,0.3); text-align: left; min-width: 180px;">Trigger Date</th>
                                <th style="padding: 10px 14px; color: #a8b4d0; font-weight: 600; font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid rgba(255,255,255,0.04); background: rgba(10,14,28,0.3); text-align: left;">Status</th>
                                <th style="padding: 10px 14px; color: #a8b4d0; font-weight: 600; font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid rgba(255,255,255,0.04); background: rgba(10,14,28,0.3); text-align: left; min-width: 90px;">Action</th>
                            </tr>
                        </thead>
                        <tbody id="triggerHistoryBody"><tr><td colspan="7" style="text-align:center; padding:20px; color:#6a7a9a;">Enter a UID to view trigger history</td></tr></tbody>
                    </table>
                </div>
            </div>
        </div>
    `;
    
    // 添加样式
    const style = document.createElement('style');
    style.textContent = `
        .trigger-tab-btn.active {
            background: rgba(200,176,144,0.12) !important;
            border-color: rgba(200,176,144,0.25) !important;
            color: #ffffff !important;
            box-shadow: 0 0 20px rgba(200,176,144,0.05);
        }
        .trigger-tab-btn:hover {
            background: rgba(255,255,255,0.06) !important;
            color: rgba(255,255,255,0.6) !important;
        }
        .result-item {
            padding: 10px 14px;
            border-radius: 8px;
            margin-bottom: 6px;
            background: rgba(255,255,255,0.02);
            border: 1px solid rgba(255,255,255,0.04);
            cursor: pointer;
            transition: 0.2s;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .result-item:hover {
            background: rgba(255,255,255,0.06);
            border-color: rgba(200,176,144,0.15);
        }
        .result-item.selected {
            border-color: #c8b090;
            background: rgba(200,176,144,0.06);
        }
        .result-item .result-name { font-size: 13px; font-weight: 500; color: #d8e0f0; }
        .result-item .result-price { font-size: 12px; color: #c8b090; font-weight: 600; }
        .result-item .result-check { color: #4ade80; font-size: 14px; }
        .status-badge-pending { background: rgba(212,192,154,0.10); color: #d4c09a; padding: 2px 10px; border-radius: 20px; font-size: 10px; display: inline-block; }
        .status-badge-activated { background: rgba(74,222,128,0.10); color: #4ade80; padding: 2px 10px; border-radius: 20px; font-size: 10px; display: inline-block; }
        .delete-trigger-btn {
            background: rgba(232,128,128,0.06);
            border: 1px solid rgba(232,128,128,0.08);
            border-radius: 30px;
            padding: 2px 12px;
            color: #e88080;
            cursor: pointer;
            font-size: 11px;
            transition: 0.2s;
            font-family: 'Inter', sans-serif;
        }
        .delete-trigger-btn:hover {
            background: rgba(232,128,128,0.12);
        }
        .btn-danger-cancel {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 6px;
        }
        
        /* ✅ 用户 Round 显示框样式 - 与搜索框高度一致 */
        #userRoundDisplay {
            transition: all 0.3s ease;
            min-width: 160px;
            height: 38px;
            box-sizing: border-box;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 0 16px;
        }
        #userRoundDisplay.active {
            border-color: rgba(200,176,144,0.25);
            background: rgba(200,176,144,0.06);
            color: #d8e0f0;
        }
        #userRoundText {
            display: flex;
            align-items: center;
            justify-content: space-between;
            width: 100%;
        }
        #userRoundDisplay .round-number {
            font-weight: 700;
            color: #c8b090;
            font-size: 14px;
        }
        #userRoundDisplay .orders-count {
            font-weight: 600;
            color: #d8e0f0;
            font-size: 13px;
        }
        #userRoundDisplay .orders-limit {
            color: #6a7a92;
            font-weight: 400;
        }
        #userRoundDisplay .round-label {
            color: rgba(255,255,255,0.3);
            font-size: 11px;
            font-weight: 500;
        }
        
        /* ===== 计算面板动画 ===== */
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(6px); }
            to { opacity: 1; transform: translateY(0); }
        }
        
        @media (max-width: 1200px) {
            #setordersMain > div:first-child {
                grid-template-columns: 1fr !important;
            }
            #confirmCardsContainer {
                grid-template-columns: repeat(2, 1fr) !important;
            }
        }
        @media (max-width: 768px) {
            #setordersMain > div:first-child {
                grid-template-columns: 1fr !important;
            }
            #confirmCardsContainer {
                grid-template-columns: 1fr 1fr !important;
            }
            .trigger-tab-btn {
                font-size: 9px !important;
                padding: 6px 8px !important;
            }
            #triggerUidInput {
                max-width: 120px !important;
                flex: 0 0 120px !important;
            }
            #userRoundDisplay {
                min-width: 100px !important;
                font-size: 11px !important;
                padding: 0 10px !important;
                height: 34px !important;
            }
            #userRoundDisplay .round-label {
                font-size: 9px !important;
            }
            #userRoundDisplay .round-number {
                font-size: 12px !important;
            }
            #userRoundDisplay .orders-count {
                font-size: 11px !important;
            }
        }
    `;
    document.head.appendChild(style);
    
    // ========== 绑定事件 ==========
    
    // Trigger UID 搜索
    document.getElementById('triggerUidSearchBtn')?.addEventListener('click', function() {
        const uid = document.getElementById('triggerUidInput').value.trim();
        if (uid) {
            selectUserByUid(uid);
        } else {
            showToast('请输入 UID', 'warning');
        }
    });
    document.getElementById('triggerUidInput')?.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            const uid = document.getElementById('triggerUidInput').value.trim();
            if (uid) {
                selectUserByUid(uid);
            }
        }
    });
    
    // Trigger Type 标签切换
    document.querySelectorAll('.trigger-tab-btn').forEach(function(btn) {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.trigger-tab-btn').forEach(function(b) {
                b.classList.remove('active');
                b.style.color = 'rgba(255,255,255,0.3)';
            });
            this.classList.add('active');
            this.style.color = '#ffffff';
            currentTriggerTab = this.dataset.type;
            
            const label = document.getElementById('triggerAmountLabel');
            if (currentTriggerTab === 'card_reward') {
                label.textContent = 'Reward Amount (€)';
            } else {
                label.textContent = 'Order Price (€)';
            }
            
            updateConfirmCards();
            
            // 如果当前有用户，显示计算面板
            if (currentSetUser) {
                showCalculatorPanel({
                    uid: currentSetUser.uid,
                    balance: currentSetUser.balance || 0,
                    username: currentSetUser.username
                });
                selectedAdvancedOrdersList = [];
            }
        });
    });
    
    // 搜索按钮
    document.getElementById('triggerSearchBtn')?.addEventListener('click', function() {
        searchTriggerOrders();
    });
    document.getElementById('triggerAmount')?.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            searchTriggerOrders();
        }
    });
    
    // 输入变化时更新卡片
    document.getElementById('triggerOrderCount')?.addEventListener('input', updateConfirmCards);
    document.getElementById('triggerAmount')?.addEventListener('input', updateConfirmCards);
    
    // Confirm / Cancel
    document.getElementById('confirmTriggerBtn')?.addEventListener('click', confirmTriggerOrder);
    document.getElementById('cancelTriggerBtn')?.addEventListener('click', cancelTriggerOrder);
    
    // 刷新
    document.getElementById('refreshTriggerBtn')?.addEventListener('click', function() {
        if (currentSetUser) {
            loadTriggerHistory();
            // 刷新用户余额
            fetchUserBalance(currentSetUser.uid).then(function(data) {
                if (data) {
                    currentSetUser.balance = data.balance || 0;
                    showCalculatorPanel({
                        uid: currentSetUser.uid,
                        balance: currentSetUser.balance,
                        username: currentSetUser.username
                    });
                    updateConfirmCards();
                }
            });
        }
        showToast('已刷新', 'success');
    });
    document.getElementById('refreshHistoryBtn')?.addEventListener('click', function() {
        if (currentSetUser) {
            loadTriggerHistory();
        } else {
            showToast('请先输入 UID', 'warning');
        }
    });
    
    // 初始显示空状态
    document.getElementById('triggerHistoryBody').innerHTML = '<tr><td colspan="7" style="text-align:center; padding:20px; color:#6a7a9a;">Enter a UID to view trigger history</td></tr>';
    
    // 初始清空 Round 显示
    updateUserRoundDisplay(null);
}

// ========== 更新用户 Round / Order 显示 ==========
function updateUserRoundDisplay(user) {
    const displayEl = document.getElementById('userRoundDisplay');
    const textEl = document.getElementById('userRoundText');
    
    if (!displayEl || !textEl) return;
    
    if (!user) {
        displayEl.classList.remove('active');
        textEl.innerHTML = '---';
        return;
    }
    
    displayEl.classList.add('active');
    
    const isPremium = user.isPremium || false;
    const currentRound = user.currentRound || 0;
    const roundOrdersCount = user.roundOrdersCount || 0;
    const ordersLimit = user.ordersLimit || 30;
    
    let displayText = '';
    if (!isPremium) {
        displayText = `
            <span class="round-label">TRIAL</span>
            <span>
                <span class="orders-count">${roundOrdersCount}</span>
                <span class="orders-limit">/ ${ordersLimit}</span>
            </span>
        `;
    } else {
        displayText = `
            <span>
                <span class="round-label">ROUND</span>
                <span class="round-number">${currentRound}</span>
            </span>
            <span>
                <span class="orders-count">${roundOrdersCount}</span>
                <span class="orders-limit">/ ${ordersLimit}</span>
            </span>
        `;
    }
    
    textEl.innerHTML = displayText;
}

// ============================================================
// 🔥 获取用户最新余额
// ============================================================
async function fetchUserBalance(uid) {
    try {
        const { data, error } = await sb
            .from('users')
            .select('balance, username')
            .eq('uid', uid)
            .single();
        
        if (error) throw error;
        return data;
    } catch (e) {
        console.error('获取用户余额失败:', e);
        return null;
    }
}

// ============================================================
// 🔥 显示计算面板
// ============================================================
function showCalculatorPanel(userData) {
    const container = document.getElementById('searchResultsContainer');
    if (!container) return;

    // 初始值
    var balanceValue = userData.balance || 0;

    container.innerHTML = `
        <div style="animation: fadeIn 0.35s ease;">
            <!-- 顶部：User ID + Balance -->
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 14px;">
                <div style="background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.04); border-radius: 10px; padding: 10px 14px;">
                    <div style="font-size: 9px; color: rgba(255,255,255,0.15); text-transform: uppercase; letter-spacing: 0.6px; font-weight: 500;">
                        <i class="fas fa-user" style="margin-right: 4px; font-size: 9px; color: rgba(255,255,255,0.08);"></i> User ID
                    </div>
                    <div style="font-size: 16px; font-weight: 600; color: #d8e0f0;" id="calcUidDisplay">${userData.uid || '-'}</div>
                </div>
                <div style="background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.04); border-radius: 10px; padding: 10px 14px;">
                    <div style="font-size: 9px; color: rgba(255,255,255,0.15); text-transform: uppercase; letter-spacing: 0.6px; font-weight: 500;">
                        <i class="fas fa-wallet" style="margin-right: 4px; font-size: 9px; color: rgba(255,255,255,0.08);"></i> <span class="balance-label">User Current Balance</span>
                    </div>
                    <div style="font-size: 16px; font-weight: 600; color: #C9B095;" id="calcBalanceDisplay">€${balanceValue.toFixed(2)}</div>
                </div>
            </div>

            <!-- 输入行：Orders Number + Set Negative -->
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 10px;">
                <div style="display: flex; flex-direction: column; gap: 3px;">
                    <span style="font-size: 9px; color: rgba(255,255,255,0.15); text-transform: uppercase; letter-spacing: 0.6px; font-weight: 500;">
                        <i class="fas fa-hashtag" style="margin-right: 4px; font-size: 9px; color: rgba(255,255,255,0.08);"></i> Orders Number
                    </span>
                    <input type="number" id="calcOrdersInput" value="1" min="1" step="1" placeholder="0" 
                           style="width:100%; background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.05); border-radius:10px; padding:7px 12px; color:#d8e0f0; font-size:14px; font-weight:500; outline:none; font-family:'Inter',sans-serif; transition:0.25s ease;">
                </div>
                <div style="display: flex; flex-direction: column; gap: 3px;">
                    <span style="font-size: 9px; color: rgba(255,255,255,0.15); text-transform: uppercase; letter-spacing: 0.6px; font-weight: 500;">
                        <i class="fas fa-coins" style="margin-right: 4px; font-size: 9px; color: rgba(255,255,255,0.08);"></i> Set Negative
                    </span>
                    <input type="number" id="calcNegativeInput" value="0" step="0.01" placeholder="0.00" min="0"
                           style="width:100%; background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.05); border-radius:10px; padding:7px 12px; color:#d8e0f0; font-size:14px; font-weight:500; outline:none; font-family:'Inter',sans-serif; transition:0.25s ease;">
                </div>
            </div>

            <!-- 公式小字 -->
            <div style="font-size: 13px; color: rgba(255,255,255,0.15); font-family: 'Courier New', monospace; letter-spacing: 0.3px; text-align: right; margin-bottom: 10px; font-weight: 500;">
                <span id="formulaLabel" style="color: rgba(201,176,149,0.5); font-weight: 600;">Balance</span> × 0.005 × <span style="color: rgba(201,176,149,0.5); font-weight: 600;">Orders</span> + <span id="formulaLabel2" style="color: rgba(201,176,149,0.5); font-weight: 600;">Balance</span> + <span style="color: rgba(74,222,128,0.4); font-weight: 600;">Set Negative</span>
            </div>

            <!-- ============================================================ -->
            <!-- 🔥 样式 7 · 霓虹金边 - Result 卡片 -->
            <!-- ============================================================ -->
            <div style="background: rgba(10, 8, 4, 0.7); border: 2px solid #ffb84d; border-radius: 14px; padding: 14px 18px; display: flex; align-items: center; justify-content: space-between; box-shadow: 0 0 60px rgba(255, 184, 77, 0.08), inset 0 0 20px rgba(255, 184, 77, 0.02); margin-bottom: 12px;">
                <span style="font-size: 12px; font-weight: 600; color: #ffb84d; text-transform: uppercase; letter-spacing: 1.5px;">
                    <i class="fas fa-crown" style="margin-right: 8px;"></i> Result
                </span>
                <span style="font-size: 26px; font-weight: 800; color: #ffdd77; text-shadow: 0 0 40px rgba(255, 221, 119, 0.1);" id="calcResultDisplay">€0.00</span>
            </div>

            <!-- ============================================================ -->
            <!-- 🔥 Multiple Orders - 只计算，不展示结果卡片，自动填入 Set Negative -->
            <!-- ============================================================ -->
            <div style="margin-top: 18px; padding-top: 16px; border-top: 1px solid rgba(255,255,255,0.06);">
                <div style="font-size: 13px; font-weight: 600; color: #C9B095; margin-bottom: 12px; letter-spacing: 0.5px; display: flex; align-items: center; gap: 8px;">
                    <i class="fas fa-layer-group" style="font-size: 14px;"></i> Multiple Orders
                    <span style="font-size: 9px; color: rgba(74,222,128,0.3); font-weight: 400; margin-left: auto;">
                        <i class="fas fa-sync-alt"></i> Auto fills Set Negative
                    </span>
                </div>

                <!-- 4列输入 -->
                <div style="display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 10px; margin-bottom: 6px;">
                    <div style="display: flex; flex-direction: column; gap: 3px;">
                        <span style="font-size: 9px; color: rgba(255,255,255,0.20); text-transform: uppercase; letter-spacing: 0.4px; font-weight: 500;">
                            <i class="fas fa-clock" style="margin-right: 4px; font-size: 9px;"></i> Pending
                        </span>
                        <span style="font-size: 16px; font-weight: 700; color: #C9B095; padding: 6px 0; background: rgba(255,255,255,0.02); border-radius: 8px; text-align: center; border: 1px solid rgba(255,255,255,0.03);" id="multiPendingDisplay">€0.00</span>
                    </div>
                    <div style="display: flex; flex-direction: column; gap: 3px;">
                        <span style="font-size: 9px; color: rgba(255,255,255,0.20); text-transform: uppercase; letter-spacing: 0.4px; font-weight: 500;">
                            <i class="fas fa-gift" style="margin-right: 4px; font-size: 9px;"></i> Deposit Bonus
                        </span>
                        <input type="number" id="multiDepositInput" value="0" step="0.01" min="0" placeholder="0.00"
                               style="width:100%; background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.05); border-radius:8px; padding:7px 10px; color:#d8e0f0; font-size:14px; font-weight:500; outline:none; font-family:'Inter',sans-serif; transition:0.25s ease; text-align:center;">
                    </div>
                    <div style="display: flex; flex-direction: column; gap: 3px;">
                        <span style="font-size: 9px; color: rgba(255,255,255,0.20); text-transform: uppercase; letter-spacing: 0.4px; font-weight: 500;">
                            <i class="fas fa-money-bill-wave" style="margin-right: 4px; font-size: 9px;"></i> Cash Reward
                        </span>
                        <input type="number" id="multiCashInput" value="0" step="0.01" min="0" placeholder="0.00"
                               style="width:100%; background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.05); border-radius:8px; padding:7px 10px; color:#d8e0f0; font-size:14px; font-weight:500; outline:none; font-family:'Inter',sans-serif; transition:0.25s ease; text-align:center;">
                    </div>
                    <div style="display: flex; flex-direction: column; gap: 3px;">
                        <span style="font-size: 9px; color: rgba(255,255,255,0.20); text-transform: uppercase; letter-spacing: 0.4px; font-weight: 500;">
                            <i class="fas fa-minus-circle" style="margin-right: 4px; font-size: 9px;"></i> Set Negative
                        </span>
                        <input type="number" id="multiNegativeInput" value="0" step="0.01" min="0" placeholder="0.00"
                               style="width:100%; background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.05); border-radius:8px; padding:7px 10px; color:#d8e0f0; font-size:14px; font-weight:500; outline:none; font-family:'Inter',sans-serif; transition:0.25s ease; text-align:center;">
                    </div>
                </div>

                <!-- 公式展示行（精简） -->
                <div style="font-size: 10px; color: rgba(255,255,255,0.06); font-family: 'Courier New', monospace; text-align: center; padding: 2px 0 0 0; letter-spacing: 0.3px;">
                    Pending + Deposit + Cash + Set Negative − Pending → <span style="color: rgba(74,222,128,0.15);">auto fills Set Negative</span>
                </div>
            </div>

            <!-- 底部提示 -->
            <div style="font-size: 10px; color: rgba(255,255,255,0.04); text-align: center; letter-spacing: 0.4px; padding-top: 12px; margin-top: 8px; border-top: 1px solid rgba(255,255,255,0.02);">
                <i class="fas fa-arrow-right" style="margin-right: 4px; font-size: 9px;"></i> 输入 Order Price 后点击 Search 查看订单列表
            </div>
        </div>
    `;

    // ============================================================
    // 🔥 主计算器更新函数
    // ============================================================
    function updateCalculator() {
        var ordersInput = document.getElementById('calcOrdersInput');
        var negativeInput = document.getElementById('calcNegativeInput');
        var resultDisplay = document.getElementById('calcResultDisplay');
        var balanceDisplay = document.getElementById('calcBalanceDisplay');
        var uidDisplay = document.getElementById('calcUidDisplay');
        
        if (!ordersInput || !negativeInput || !resultDisplay) return;
        
        var currentValue = window._pendingDisplayValue !== undefined ? window._pendingDisplayValue : (userData.balance || 0);
        var orders = parseInt(ordersInput.value) || 1;
        var setNegative = parseFloat(negativeInput.value) || 0;
        
        var result = currentValue * 0.005 * orders + currentValue + setNegative;
        
        if (uidDisplay) uidDisplay.textContent = userData.uid || '-';
        if (balanceDisplay) balanceDisplay.textContent = '€' + currentValue.toFixed(2);
        resultDisplay.textContent = '€' + result.toFixed(2);
    }

    // ============================================================
    // 🔥 Multiple Orders - 只计算，自动填充 Set Negative（不展示结果卡片）
    // ============================================================
    function updateMultiCalculator() {
        var pendingDisplay = document.getElementById('multiPendingDisplay');
        var depositInput = document.getElementById('multiDepositInput');
        var cashInput = document.getElementById('multiCashInput');
        var negativeInput = document.getElementById('multiNegativeInput');
        var mainNegativeInput = document.getElementById('calcNegativeInput');
        
        if (!depositInput || !cashInput || !negativeInput) return;
        
        var pendingValue = window._pendingDisplayValue !== undefined ? window._pendingDisplayValue : (userData.balance || 0);
        var depositBonus = parseFloat(depositInput.value) || 0;
        var cashReward = parseFloat(cashInput.value) || 0;
        var setNegative = parseFloat(negativeInput.value) || 0;
        
        var multiResult = depositBonus + cashReward + setNegative;
        
        if (pendingDisplay) pendingDisplay.textContent = '€' + pendingValue.toFixed(2);
        
        // 🔥 自动填充主 Set Negative
        if (mainNegativeInput) {
            if (multiResult > 0) {
                var currentMainNegative = parseFloat(mainNegativeInput.value) || 0;
                if (currentMainNegative === 0 || currentMainNegative === window._lastAutoFilledValue) {
                    mainNegativeInput.value = multiResult.toFixed(2);
                    window._lastAutoFilledValue = multiResult;
                    updateCalculator();
                }
            } else {
                window._lastAutoFilledValue = 0;
            }
        }
    }

    // ============================================================
    // 🔥 异步获取 pending_display 并更新
    // ============================================================
    sb.from('users')
        .select('pending_display')
        .eq('uid', userData.uid)
        .single()
        .then(function(result) {
            if (result.data) {
                var pendingDisplay = result.data.pending_display || 0;
                var hasPending = pendingDisplay > 0;
                var displayValue = hasPending ? pendingDisplay : (userData.balance || 0);
                
                var balanceDisplay = document.getElementById('calcBalanceDisplay');
                var labelEl = document.querySelector('.balance-label');
                var formulaLabel = document.getElementById('formulaLabel');
                var formulaLabel2 = document.getElementById('formulaLabel2');
                var pendingDisplayEl = document.getElementById('multiPendingDisplay');
                
                if (balanceDisplay) {
                    balanceDisplay.textContent = '€' + displayValue.toFixed(2);
                }
                if (labelEl) {
                    labelEl.textContent = hasPending ? 'User Pending Amount' : 'User Current Balance';
                }
                if (pendingDisplayEl) {
                    pendingDisplayEl.textContent = '€' + displayValue.toFixed(2);
                }
                
                var formulaText = hasPending ? 'Pending' : 'Balance';
                if (formulaLabel) formulaLabel.textContent = formulaText;
                if (formulaLabel2) formulaLabel2.textContent = formulaText;
                
                window._pendingDisplayValue = displayValue;
                window._hasPending = hasPending;
                window._lastAutoFilledValue = 0;
                
                updateCalculator();
                updateMultiCalculator();
            }
        })
        .catch(function() {
            var balanceDisplay = document.getElementById('calcBalanceDisplay');
            if (balanceDisplay) {
                balanceDisplay.textContent = '€' + (userData.balance || 0).toFixed(2);
            }
            var pendingDisplayEl = document.getElementById('multiPendingDisplay');
            if (pendingDisplayEl) {
                pendingDisplayEl.textContent = '€' + (userData.balance || 0).toFixed(2);
            }
            window._pendingDisplayValue = userData.balance || 0;
            window._hasPending = false;
            window._lastAutoFilledValue = 0;
            updateCalculator();
            updateMultiCalculator();
        });

    // ============================================================
    // 🔥 绑定输入事件
    // ============================================================
    var ordersInput = document.getElementById('calcOrdersInput');
    var negativeInput = document.getElementById('calcNegativeInput');
    var multiDepositInput = document.getElementById('multiDepositInput');
    var multiCashInput = document.getElementById('multiCashInput');
    var multiNegativeInput = document.getElementById('multiNegativeInput');
    
    if (ordersInput) ordersInput.addEventListener('input', updateCalculator);
    if (negativeInput) negativeInput.addEventListener('input', function() {
        var val = parseFloat(this.value) || 0;
        window._lastAutoFilledValue = val;
        updateCalculator();
    });
    if (multiDepositInput) multiDepositInput.addEventListener('input', updateMultiCalculator);
    if (multiCashInput) multiCashInput.addEventListener('input', updateMultiCalculator);
    if (multiNegativeInput) multiNegativeInput.addEventListener('input', updateMultiCalculator);

    // 备用：延迟执行确保首次渲染
    setTimeout(function() {
        updateCalculator();
        updateMultiCalculator();
    }, 200);
}

// ============================================================
// 🔥 搜索触发订单
// ============================================================
async function searchTriggerOrders() {
    if (!currentSetUser) {
        showToast('请先输入 Trigger UID', 'error');
        return;
    }

    // 🔥 Diamond Reward：不需要搜索订单，只刷新计算面板
    if (currentTriggerTab === 'card_reward') {
        const userData = await fetchUserBalance(currentSetUser.uid);
        if (userData) {
            currentSetUser.balance = userData.balance || 0;
            updateConfirmCards();
        }
        showCalculatorPanel({
            uid: currentSetUser.uid,
            balance: currentSetUser.balance || 0,
            username: currentSetUser.username
        });
        return;
    }

    const amount = parseFloat(document.getElementById('triggerAmount').value);
    if (!amount || amount <= 0) {
        showToast('请输入有效的金额', 'error');
        return;
    }

    const container = document.getElementById('searchResultsContainer');

    try {
        // 🔥 获取用户最新余额
        const userData = await fetchUserBalance(currentSetUser.uid);
        
        if (userData) {
            currentSetUser.balance = userData.balance || 0;
            updateConfirmCards();
        }

        // 🔥 搜索订单
        container.innerHTML = '<div style="text-align:center; padding:20px; color:#6a7a9a;"><i class="fas fa-spinner fa-spin"></i> Searching...</div>';

        const priceNum = Math.floor(amount);
        const digitCount = priceNum.toString().length;
        let minPrice = priceNum, maxPrice;
        if (digitCount === 2) maxPrice = priceNum + 19;
        else if (digitCount === 3) maxPrice = priceNum + 99;
        else if (digitCount === 4) maxPrice = priceNum + 999;
        else if (digitCount === 5) maxPrice = priceNum + 9999;
        else maxPrice = priceNum;

        const { data: matchedOrders } = await sb
            .from('orders_pool')
            .select('*')
            .eq('status', 'available')
            .gte('price', minPrice)
            .lte('price', maxPrice)
            .order('price', { ascending: true })
            .limit(20);

        if (!matchedOrders || matchedOrders.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 30px 20px; color: #6a7a92; font-size: 13px;">
                    <i class="fas fa-exclamation-circle" style="display: block; font-size: 28px; color: #4a5a72; margin-bottom: 8px;"></i>
                    No orders found for €${amount.toFixed(2)}
                    <div style="font-size: 11px; color: #4a5a72; margin-top: 4px;">Try different amount</div>
                </div>
            `;
            return;
        }

        // 渲染订单列表
        container.innerHTML = '';
        selectedAdvancedOrdersList = [];
        const isCardOrder = currentTriggerTab === 'card_order';
        const isSvipOrder = currentTriggerTab === 'svip_order';
        
        const textColor = isSvipOrder ? '#ffd700' : '#c8b090';
        const commissionRate = isSvipOrder ? 0.10 : (isCardOrder ? 0.15 : 0.05);
        const commissionText = isSvipOrder ? '10% x20 SVIP' : (isCardOrder ? '15%' : '5%');
        const nameColor = isSvipOrder ? '#ffd700' : '#d8e0f0';
        
        for (const order of matchedOrders) {
            const div = document.createElement('div');
            div.className = 'result-item';
            div.dataset.id = order.id;
            div.dataset.price = order.price;
            div.dataset.name = order.accommodation_name;
            div.dataset.image = order.image_url || '';
            div.dataset.code = order.order_code || '';
            
            const commission = order.price * commissionRate;
            
            div.innerHTML = `
                <div>
                    <div class="result-name" style="color: ${nameColor};">${escapeHtml(order.accommodation_name || 'Hotel Task')}${isSvipOrder ? ' ⭐' : ''}</div>
                    <div style="font-size: 11px; color: #6a7a92;">Code: ${escapeHtml(order.order_code || '-')}</div>
                </div>
                <div style="text-align: right;">
                    <div class="result-price" style="color: ${textColor};">€${order.price.toFixed(2)}</div>
                    <div style="font-size: 10px; color: ${isSvipOrder ? '#ffd700' : '#4ade80'};">Commission: €${commission.toFixed(2)} (${commissionText})</div>
                </div>
                <div class="result-check" style="display: none;"><i class="fas fa-check-circle"></i></div>
            `;
            
            div.addEventListener('click', function() {
                document.querySelectorAll('.result-item').forEach(function(el) {
                    el.classList.remove('selected');
                    const check = el.querySelector('.result-check');
                    if (check) check.style.display = 'none';
                });
                this.classList.add('selected');
                const check = this.querySelector('.result-check');
                if (check) check.style.display = 'block';
                
                selectedAdvancedOrdersList = [{
                    id: order.id,
                    price: order.price,
                    name: order.accommodation_name,
                    image_url: order.image_url,
                    order_code: order.order_code
                }];
                
                document.getElementById('cardAmount').innerHTML = '€' + order.price.toFixed(2);
            });
            
            container.appendChild(div);
        }
        
        const firstResult = container.querySelector('.result-item');
        if (firstResult) {
            firstResult.click();
        }
        
    } catch (e) {
        console.error('搜索失败:', e);
        container.innerHTML = '<div style="text-align:center; padding:20px; color:#e88080;">搜索失败: ' + e.message + '</div>';
    }
}

// ========== 根据 UID 选择用户 ==========
async function selectUserByUid(uid) {
    try {
        const { data: user, error } = await sb
            .from('users')
            .select('uid, username, balance, round_orders_count, current_round, is_premium, vip_level')
            .eq('uid', uid)
            .single();
        
        if (error || !user) {
            showToast('未找到用户 UID: ' + uid, 'error');
            updateUserRoundDisplay(null);
            document.getElementById('searchResultsContainer').innerHTML = `
                <div style="text-align: center; padding: 40px 20px; color: #6a7a92; font-size: 13px;">
                    <i class="fas fa-desktop" style="display: block; font-size: 48px; color: rgba(255,255,255,0.04); margin-bottom: 12px;"></i>
                    <span style="color: rgba(255,255,255,0.08);">Search product price to show result</span>
                    <div style="font-size: 11px; color: rgba(255,255,255,0.04); margin-top: 4px;">Enter Trigger UID → Get Balance → Auto Calculate</div>
                </div>
            `;
            return;
        }
        
        let ordersLimit = 30;
        try {
            const { data: vipSetting } = await sb
                .from('vip_settings')
                .select('orders_limit')
                .eq('level', user.vip_level || 1)
                .single();
            if (vipSetting) {
                ordersLimit = vipSetting.orders_limit || 30;
            }
        } catch (e) {
            console.log('使用默认 orders_limit: 30');
        }
        
        currentSetUser = {
            uid: user.uid,
            username: user.username,
            balance: user.balance || 0,
            roundOrdersCount: user.round_orders_count || 0,
            currentRound: user.current_round || 0,
            isPremium: user.is_premium || false,
            vipLevel: user.vip_level || 1,
            ordersLimit: ordersLimit
        };
        
        document.getElementById('cardUid').innerText = user.uid;
        updateConfirmCards();
        updateUserRoundDisplay(currentSetUser);

        // 🔥 获取最新余额
        const freshUserData = await fetchUserBalance(uid);
        if (freshUserData) {
            currentSetUser.balance = freshUserData.balance || 0;
        }
        
        // ============================================================
        // 🔥 确保当前标签被激活
        // ============================================================
        const hasActiveTab = document.querySelector('.trigger-tab-btn.active');
        if (!hasActiveTab) {
            const commercialBtn = document.querySelector('.trigger-tab-btn[data-type="advanced"]');
            if (commercialBtn) {
                commercialBtn.classList.add('active');
                commercialBtn.style.color = '#ffffff';
                currentTriggerTab = 'advanced';
                document.getElementById('triggerAmountLabel').textContent = 'Order Price (€)';
            }
        }
        
        // ============================================================
        // 🔥 所有类型都显示计算面板
        // ============================================================
        showCalculatorPanel({
            uid: currentSetUser.uid,
            balance: currentSetUser.balance,
            username: currentSetUser.username
        });
        selectedAdvancedOrdersList = [];
        
        await loadTriggerHistory();
        showToast('✅ 用户 ' + user.username + ' 已选择', 'success');
        
    } catch (e) {
        showToast('查找用户失败: ' + e.message, 'error');
        updateUserRoundDisplay(null);
    }
}

// ========== 更新确认卡片 ==========
function updateConfirmCards() {
    if (!currentSetUser) return;
    
    const typeNames = {
        'advanced': 'Commercial Order',
        'card_reward': 'Diamond Reward',
        'card_order': 'x30 Commissions',
        'svip_order': 'x20 SVIP Order'
    };
    
    const orderCount = parseInt(document.getElementById('triggerOrderCount').value) || 1;
    let displayAmount = '-';
    if (selectedAdvancedOrdersList.length > 0) {
        displayAmount = '€' + selectedAdvancedOrdersList[0].price.toFixed(2);
    } else {
        if (currentTriggerTab === 'card_reward') {
            const amount = parseFloat(document.getElementById('triggerAmount').value) || 0;
            displayAmount = amount > 0 ? '€' + amount.toFixed(2) : '-';
        } else {
            displayAmount = '-';
        }
    }
    
    document.getElementById('cardType').innerText = typeNames[currentTriggerTab] || '-';
    document.getElementById('cardNumbers').innerText = orderCount;
    document.getElementById('cardAmount').innerHTML = displayAmount;
}

// ========== 确认触发订单 ==========
async function confirmTriggerOrder() {
    if (!currentSetUser) {
        showToast('请先输入 Trigger UID', 'error');
        return;
    }
    
    const orderCount = parseInt(document.getElementById('triggerOrderCount').value) || 1;
    if (orderCount <= 0) {
        showToast('请输入有效的订单数', 'error');
        return;
    }
    
    const amount = parseFloat(document.getElementById('triggerAmount').value);
    if (!amount || amount <= 0) {
        showToast('请输入有效的金额', 'error');
        return;
    }
    
    let selectedOrder = null;
    if (currentTriggerTab !== 'card_reward') {
        if (selectedAdvancedOrdersList.length > 0) {
            selectedOrder = selectedAdvancedOrdersList[0];
        } else {
            const selectedEl = document.querySelector('.result-item.selected');
            if (selectedEl) {
                selectedOrder = {
                    id: parseInt(selectedEl.dataset.id),
                    price: parseFloat(selectedEl.dataset.price),
                    name: selectedEl.dataset.name,
                    image_url: selectedEl.dataset.image,
                    order_code: selectedEl.dataset.code
                };
            }
        }
        
        if (!selectedOrder) {
            showToast('请先搜索并选择一个订单', 'error');
            return;
        }
    }
    
    const typeNames = {
        'advanced': 'Commercial Order',
        'card_reward': 'Diamond Reward',
        'card_order': 'x30 Commissions Order',
        'svip_order': 'x20 SVIP Order'
    };
    
    try {
        let insertData = {
            uid: currentSetUser.uid,
            username: currentSetUser.username,
            trigger_order_number: orderCount,
            status: 'pending',
            created_at: new Date().toISOString()
        };
        
        if (currentTriggerTab === 'advanced' && selectedOrder) {
            insertData.order_type = 'advanced';
            insertData.target_price = amount;
            insertData.matched_order_id = selectedOrder.id;
            insertData.matched_order_code = selectedOrder.order_code;
            insertData.matched_order_name = selectedOrder.name;
            insertData.matched_price = selectedOrder.price;
            insertData.matched_image_url = selectedOrder.image_url || '';
            insertData.commission_rate = 5.0;
            insertData.commission_amount = selectedOrder.price * 0.05;
        } else if (currentTriggerTab === 'card_reward') {
            insertData.order_type = 'card_reward';
            insertData.target_price = amount;
            insertData.commission_amount = 0;
        } else if (currentTriggerTab === 'card_order' && selectedOrder) {
            insertData.order_type = 'card_order';
            insertData.target_price = amount;
            insertData.matched_order_id = selectedOrder.id;
            insertData.matched_order_code = selectedOrder.order_code;
            insertData.matched_order_name = selectedOrder.name;
            insertData.matched_price = selectedOrder.price;
            insertData.matched_image_url = selectedOrder.image_url || '';
            insertData.commission_rate = 15.0;
            insertData.commission_amount = selectedOrder.price * 0.15;
            insertData.assigned_quality = 'Exceptional';
            insertData.assigned_platform = getRandomPlatform();
        } else if (currentTriggerTab === 'svip_order' && selectedOrder) {
            insertData.order_type = 'svip_order';
            insertData.target_price = amount;
            insertData.matched_order_id = selectedOrder.id;
            insertData.matched_order_code = selectedOrder.order_code;
            insertData.matched_order_name = selectedOrder.name;
            insertData.matched_price = selectedOrder.price;
            insertData.matched_image_url = selectedOrder.image_url || '';
            insertData.commission_rate = 10.0;
            insertData.commission_amount = selectedOrder.price * 0.10;
        } else {
            showToast('请选择有效的触发类型', 'error');
            return;
        }
        
        await sb.from('user_trigger_orders').insert([insertData]);
        
        showToast('✅ ' + typeNames[currentTriggerTab] + ' triggered for ' + currentSetUser.username, 'success');
        
        document.getElementById('triggerOrderCount').value = '1';
        document.getElementById('triggerAmount').value = '';
        document.getElementById('searchResultsContainer').innerHTML = `
            <div style="text-align: center; padding: 40px 20px; color: #6a7a92; font-size: 13px;">
                <i class="fas fa-desktop" style="display: block; font-size: 48px; color: rgba(255,255,255,0.04); margin-bottom: 12px;"></i>
                <span style="color: rgba(255,255,255,0.08);">Search product price to show result</span>
                <div style="font-size: 11px; color: rgba(255,255,255,0.04); margin-top: 4px;">Enter Trigger UID → Get Balance → Auto Calculate</div>
            </div>
        `;
        selectedAdvancedOrdersList = [];
        updateConfirmCards();
        await loadTriggerHistory();
        
    } catch (e) {
        showToast('触发失败: ' + e.message, 'error');
    }
}

// ========== 取消触发 ==========
function cancelTriggerOrder() {
    document.getElementById('triggerOrderCount').value = '1';
    document.getElementById('triggerAmount').value = '';
    document.getElementById('searchResultsContainer').innerHTML = `
        <div style="text-align: center; padding: 40px 20px; color: #6a7a92; font-size: 13px;">
            <i class="fas fa-desktop" style="display: block; font-size: 48px; color: rgba(255,255,255,0.04); margin-bottom: 12px;"></i>
            <span style="color: rgba(255,255,255,0.08);">Search product price to show result</span>
            <div style="font-size: 11px; color: rgba(255,255,255,0.04); margin-top: 4px;">Enter Trigger UID → Get Balance → Auto Calculate</div>
        </div>
    `;
    selectedAdvancedOrdersList = [];
    updateConfirmCards();
    showToast('已取消', 'info');
}

// ========== 加载触发历史（只加载当前用户） ==========
async function loadTriggerHistory() {
    const tbody = document.getElementById('triggerHistoryBody');
    if (!tbody) return;
    
    if (!currentSetUser) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding:20px; color:#6a7a9a;">Enter a UID to view trigger history</td></tr>';
        return;
    }
    
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding:20px; color:#6a7a9a;">Loading...</td></tr>';
    
    try {
        const { data: records, error } = await sb
            .from('user_trigger_orders')
            .select('*')
            .eq('uid', currentSetUser.uid)
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        if (!records || records.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding:20px; color:#6a7a9a;">No trigger records for this user</td></tr>';
            return;
        }
        
        const typeNames = {
            'advanced': 'Commercial Order',
            'card_reward': 'Diamond Reward',
            'card_order': 'x30 Commissions Order',
            'svip_order': 'x20 SVIP Order'
        };
        
        tbody.innerHTML = '';
        
        for (const record of records) {
            const row = tbody.insertRow();
            
            const statusText = record.status === 'completed' ? 'Activated' : 'Pending';
            const statusClass = record.status === 'completed' ? 'status-badge-activated' : 'status-badge-pending';
            const amount = record.order_type === 'card_reward' ? record.target_price : (record.matched_price || record.target_price || 0);
            
            row.insertCell(0).innerHTML = '<span class="badge" style="background: rgba(255,255,255,0.08); padding: 2px 12px; border-radius: 20px; font-size: 11px; color: #c8d2e8; border: 1px solid rgba(255,255,255,0.06);">' + escapeHtml(record.uid) + '</span>';
            row.insertCell(1).innerHTML = '<span style="font-size: 12px; color: #d8e0f0;">' + (typeNames[record.order_type] || record.order_type) + '</span>';
            row.insertCell(2).innerHTML = '<span style="font-size: 12px; color: #8892a8;">' + record.trigger_order_number + '</span>';
            row.insertCell(3).innerHTML = '<span style="font-size: 12px; color: #c8b090; font-weight: 600;">€' + (amount || 0).toFixed(2) + '</span>';
            
            const triggerDate = record.created_at ? new Date(record.created_at).toLocaleString() : '-';
            row.insertCell(4).innerHTML = '<span style="font-size: 12px; color: #8892a8; white-space: nowrap;">' + triggerDate + '</span>';
            
            row.insertCell(5).innerHTML = '<span class="' + statusClass + '">' + statusText + '</span>';
            
            if (record.status === 'pending') {
                row.insertCell(6).innerHTML = `<button class="delete-trigger-btn" data-id="${record.id}"><i class="fas fa-trash"></i> Delete</button>`;
            } else {
                row.insertCell(6).innerHTML = '<span style="font-size: 11px; color: #6a7a92;">-</span>';
            }
        }
        
        document.querySelectorAll('.delete-trigger-btn').forEach(function(btn) {
            btn.addEventListener('click', function() {
                const id = parseInt(this.dataset.id);
                showConfirm('Delete Trigger', 'Are you sure to delete this trigger?', async function() {
                    try {
                        await sb.from('user_trigger_orders').delete().eq('id', id);
                        showToast('Trigger deleted', 'success');
                        loadTriggerHistory();
                    } catch (e) {
                        showToast('Delete failed: ' + e.message, 'error');
                    }
                });
            });
        });
        
    } catch (e) {
        console.error('加载触发历史失败:', e);
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding:20px; color:#e88080;">加载失败: ' + escapeHtml(e.message) + '</td></tr>';
    }
}

function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

window.loadSetordersPage = loadSetordersPage;