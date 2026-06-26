// admin-setorders.js - 设置订单页面（左右面板布局，与 Withdrawal 风格一致）
let setordersSearchKeyword = '';
let selectedAdvancedOrdersList = [];
let currentSetUser = null;
let selectedCardOrder = null;
let currentTriggerTab = 'advanced';
let triggerHistoryData = [];
let triggerHistoryPage = 1;
const TRIGGER_HISTORY_PAGE_SIZE = 20;
let triggerSearchKeyword = '';

// ========== 渲染自定义下拉 ==========
function renderTriggerTypeSelect(selected) {
    const options = [
        { value: 'advanced', label: 'Commercial Order' },
        { value: 'card_reward', label: 'Diamond Reward' },
        { value: 'card_order', label: 'x30 Commissions Order' }
    ];
    
    let html = `
        <div class="trigger-type-select-wrapper" id="triggerTypeSelect">
            <div class="trigger-type-display" id="triggerTypeDisplay">
                <span>${selected ? options.find(o => o.value === selected)?.label || 'Select Type' : 'Select Type'}</span>
                <i class="fas fa-chevron-down" style="color: #5a6a82; font-size: 11px; margin-left: 6px;"></i>
            </div>
            <div class="trigger-type-dropdown" id="triggerTypeDropdown">
                <div class="trigger-type-options">
    `;
    
    options.forEach(function(opt) {
        const sel = opt.value === selected ? ' selected' : '';
        html += `<div class="trigger-type-option${sel}" data-value="${opt.value}">${opt.label}</div>`;
    });
    
    html += `
                </div>
            </div>
            <input type="hidden" id="triggerTypeHidden" value="${selected || ''}">
        </div>
    `;
    
    return html;
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
            
            <!-- 用户搜索 -->
            <div class="search-bar" style="display: flex; flex-wrap: wrap; gap: 10px; align-items: center; background: rgba(8, 12, 24, 0.5); border-radius: 16px; padding: 12px 16px; margin-bottom: 20px; border: 1px solid rgba(255,255,255,0.03);">
                <input type="text" id="setordersSearchUid" class="search-input" placeholder="Search UID / username" style="flex: 1; min-width: 160px; background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.10); border-radius: 40px; padding: 8px 16px; color: #e6edf5; font-size: 13px; outline: none;">
                <button id="setordersSearchBtn" class="btn-primary" style="padding: 8px 20px; border-radius: 40px; border: none; background: #2a3a5a; color: #e6edf5; font-weight: 600; cursor: pointer; font-size: 13px; white-space: nowrap;">
                    <i class="fas fa-search"></i> Search
                </button>
                <button id="setordersClearBtn" class="btn-primary" style="padding: 8px 18px; border-radius: 40px; border: none; background: rgba(255,255,255,0.06); color: #b8c4de; font-weight: 500; cursor: pointer; font-size: 13px; white-space: nowrap;">
                    <i class="fas fa-times"></i> Clear
                </button>
            </div>
            
            <!-- 用户结果列表 -->
            <div id="setordersUserList" style="max-height: 200px; overflow-y: auto; margin-bottom: 20px; display: none;">
                <table class="data-table" style="width: 100%; border-collapse: collapse; font-size: 13px;">
                    <thead>
                        <tr>
                            <th style="padding: 10px 16px; color: #a8b4d0; font-weight: 600; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid rgba(255,255,255,0.04); background: rgba(10,14,28,0.3); text-align: left;">User ID</th>
                            <th style="padding: 10px 16px; color: #a8b4d0; font-weight: 600; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid rgba(255,255,255,0.04); background: rgba(10,14,28,0.3); text-align: left;">Username</th>
                            <th style="padding: 10px 16px; color: #a8b4d0; font-weight: 600; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid rgba(255,255,255,0.04); background: rgba(10,14,28,0.3); text-align: left;">Action</th>
                        </tr>
                    </thead>
                    <tbody id="setordersUserTableBody"></tbody>
                </table>
            </div>
            
            <!-- ========== 主面板：左右两栏 ========== -->
            <div id="setordersMain" style="display: none;">
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 28px;">
                    
                    <!-- ===== 左侧面板 ===== -->
                    <div style="background: rgba(12, 16, 28, 0.6); border-radius: 16px; padding: 20px; border: 1px solid rgba(255,255,255,0.04);">
                        <!-- 3卡片 -->
                        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 16px;">
                            <div style="background: rgba(255,255,255,0.02); border-radius: 12px; padding: 12px; text-align: center; border: 1px solid rgba(255,255,255,0.04);">
                                <div style="font-size: 10px; color: #6a7a92; text-transform: uppercase; letter-spacing: 0.5px;">User ID</div>
                                <div style="font-size: 16px; font-weight: 700; color: #d8e0f0;" id="selectedUidDisplay">-</div>
                            </div>
                            <div style="background: rgba(255,255,255,0.02); border-radius: 12px; padding: 12px; text-align: center; border: 1px solid rgba(255,255,255,0.04);">
                                <div style="font-size: 10px; color: #6a7a92; text-transform: uppercase; letter-spacing: 0.5px;">Current Orders</div>
                                <div style="font-size: 16px; font-weight: 700; color: #d8e0f0;" id="selectedUserOrders">0</div>
                            </div>
                            <div style="background: rgba(255,255,255,0.02); border-radius: 12px; padding: 12px; text-align: center; border: 1px solid rgba(255,255,255,0.04);">
                                <div style="font-size: 10px; color: #6a7a92; text-transform: uppercase; letter-spacing: 0.5px;">User Current Balance</div>
                                <div style="font-size: 16px; font-weight: 700; color: #c8b090;" id="selectedUserBalance">€0.00</div>
                            </div>
                        </div>
                        
                        <!-- Trigger Type 标签 -->
                        <div style="display: flex; gap: 8px; margin-bottom: 16px; border-bottom: 1px solid rgba(255,255,255,0.04); padding-bottom: 12px;">
                            <button class="trigger-tab-btn active" data-type="advanced" style="background: rgba(200,176,144,0.06); border: 1px solid rgba(200,176,144,0.08); border-radius: 30px; padding: 6px 16px; color: #c8b090; cursor: pointer; font-size: 12px; font-weight: 500; transition: all 0.2s; font-family: 'Inter', sans-serif;">
                                <i class="fas fa-crown"></i> Commercial Order
                            </button>
                            <button class="trigger-tab-btn" data-type="card_reward" style="background: rgba(255,184,77,0.06); border: 1px solid rgba(255,184,77,0.08); border-radius: 30px; padding: 6px 16px; color: #ffb84d; cursor: pointer; font-size: 12px; font-weight: 500; transition: all 0.2s; font-family: 'Inter', sans-serif;">
                                <i class="fas fa-gem"></i> Diamond Reward
                            </button>
                            <button class="trigger-tab-btn" data-type="card_order" style="background: rgba(74,222,128,0.06); border: 1px solid rgba(74,222,128,0.08); border-radius: 30px; padding: 6px 16px; color: #4ade80; cursor: pointer; font-size: 12px; font-weight: 500; transition: all 0.2s; font-family: 'Inter', sans-serif;">
                                <i class="fas fa-ticket-alt"></i> x30 Commissions Order
                            </button>
                        </div>
                        
                        <!-- 输入区域 -->
                        <div style="margin-bottom: 12px;">
                            <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                                <div style="flex: 1; min-width: 120px;">
                                    <label style="display: block; font-size: 10px; color: #6a7a92; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 2px;">Orders Number</label>
                                    <input type="number" id="triggerOrderCount" class="search-input" value="1" min="1" step="1" style="width: 100%; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.06); border-radius: 8px; padding: 8px 12px; color: #e6edf5; font-size: 13px; outline: none;">
                                </div>
                                <div style="flex: 2; min-width: 150px;">
                                    <label style="display: block; font-size: 10px; color: #6a7a92; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 2px;" id="triggerAmountLabel">Order Price (€)</label>
                                    <input type="number" id="triggerAmount" class="search-input" step="0.01" min="0" placeholder="Enter amount" style="width: 100%; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.06); border-radius: 8px; padding: 8px 12px; color: #e6edf5; font-size: 13px; outline: none;">
                                </div>
                                <div style="flex: 1; min-width: 100px; display: flex; align-items: flex-end;">
                                    <button id="triggerSearchBtn" class="btn-primary" style="width: 100%; padding: 8px 16px; border-radius: 40px; border: none; background: #2a3a5a; color: #e6edf5; font-weight: 600; cursor: pointer; font-size: 13px;">
                                        <i class="fas fa-search"></i> Search
                                    </button>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Confirm / Cancel 按钮 -->
                        <div style="display: flex; gap: 10px; margin-top: 4px;">
                            <button id="confirmTriggerBtn" class="success" style="flex: 1; background: rgba(74,222,128,0.06); border: 1px solid rgba(74,222,128,0.08); border-radius: 40px; padding: 8px 0; color: #4ade80; font-weight: 600; font-size: 13px; cursor: pointer; transition: all 0.3s; font-family: 'Inter', sans-serif;">
                                <i class="fas fa-check"></i> Confirm Trigger
                            </button>
                            <button id="cancelTriggerBtn" class="danger" style="flex: 1; background: rgba(232,128,128,0.06); border: 1px solid rgba(232,128,128,0.08); border-radius: 40px; padding: 8px 0; color: #e88080; font-weight: 600; font-size: 13px; cursor: pointer; transition: all 0.3s; font-family: 'Inter', sans-serif;">
                                <i class="fas fa-times"></i> Cancel
                            </button>
                        </div>
                    </div>
                    
                    <!-- ===== 右侧面板 ===== -->
                    <div style="background: rgba(12, 16, 28, 0.6); border-radius: 16px; padding: 20px; border: 1px solid rgba(255,255,255,0.04);">
                        <div style="font-size: 11px; color: #6a7a92; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px;">
                            <i class="fas fa-search" style="color: #8892a8;"></i> Search Results
                        </div>
                        <div id="searchResultsContainer" style="max-height: 300px; overflow-y: auto;">
                            <div style="text-align: center; padding: 40px 20px; color: #6a7a92; font-size: 13px;">
                                <i class="fas fa-search" style="display: block; font-size: 32px; color: #4a5a72; margin-bottom: 12px;"></i>
                                Search product price to show result
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
                        <button id="refreshHistoryBtn" class="btn-primary" style="padding: 4px 16px; border-radius: 40px; border: none; background: rgba(255,255,255,0.06); color: #b8c4de; font-weight: 500; cursor: pointer; font-size: 12px; font-family: 'Inter', sans-serif;">
                            <i class="fas fa-sync-alt"></i> Refresh
                        </button>
                    </div>
                    
                    <!-- 搜索栏 -->
                    <div style="display: flex; gap: 10px; margin-bottom: 12px;">
                        <input type="text" id="triggerHistorySearch" class="search-input" placeholder="Search UID..." style="flex: 1; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.06); border-radius: 40px; padding: 6px 16px; color: #e6edf5; font-size: 12px; outline: none;">
                        <button id="triggerHistorySearchBtn" class="btn-primary" style="padding: 4px 16px; border-radius: 40px; border: none; background: #2a3a5a; color: #e6edf5; font-weight: 500; cursor: pointer; font-size: 12px; font-family: 'Inter', sans-serif;">
                            <i class="fas fa-search"></i> Search
                        </button>
                        <button id="triggerHistoryClearBtn" class="btn-primary" style="padding: 4px 16px; border-radius: 40px; border: none; background: rgba(255,255,255,0.06); color: #b8c4de; font-weight: 500; cursor: pointer; font-size: 12px; font-family: 'Inter', sans-serif;">
                            <i class="fas fa-times"></i> Clear
                        </button>
                    </div>
                    
                    <div class="table-container" style="max-height: 300px; overflow-y: auto; border-radius: 12px; border: 1px solid rgba(255,255,255,0.03);">
                        <table class="data-table" style="width: 100%; border-collapse: collapse; font-size: 12px; min-width: 700px;">
                            <thead>
                                <tr>
                                    <th style="padding: 10px 14px; color: #a8b4d0; font-weight: 600; font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid rgba(255,255,255,0.04); background: rgba(10,14,28,0.3); text-align: left;">User ID</th>
                                    <th style="padding: 10px 14px; color: #a8b4d0; font-weight: 600; font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid rgba(255,255,255,0.04); background: rgba(10,14,28,0.3); text-align: left;">Trigger Type</th>
                                    <th style="padding: 10px 14px; color: #a8b4d0; font-weight: 600; font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid rgba(255,255,255,0.04); background: rgba(10,14,28,0.3); text-align: left;">Orders Number</th>
                                    <th style="padding: 10px 14px; color: #a8b4d0; font-weight: 600; font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid rgba(255,255,255,0.04); background: rgba(10,14,28,0.3); text-align: left;">Trigger Amount</th>
                                    <th style="padding: 10px 14px; color: #a8b4d0; font-weight: 600; font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid rgba(255,255,255,0.04); background: rgba(10,14,28,0.3); text-align: left;">Status</th>
                                    <th style="padding: 10px 14px; color: #a8b4d0; font-weight: 600; font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid rgba(255,255,255,0.04); background: rgba(10,14,28,0.3); text-align: left; min-width: 90px;">Action</th>
                                </tr>
                            </thead>
                            <tbody id="triggerHistoryBody"><tr><td colspan="6" style="text-align:center; padding:20px; color:#6a7a9a;">Loading...</td></tr></tbody>
                        </table>
                    </div>
                    <div class="pagination" id="triggerHistoryPagination" style="margin-top: 8px;"></div>
                </div>
            </div>
        </div>
    `;
    
    // 添加样式
    const style = document.createElement('style');
    style.textContent = `
        .trigger-tab-btn.active {
            background: rgba(200,176,144,0.12) !important;
            border-color: rgba(200,176,144,0.2) !important;
            color: #d8e0f0 !important;
        }
        .trigger-tab-btn:hover {
            opacity: 0.8;
        }
        .trigger-type-select-wrapper {
            position: relative;
            width: 100%;
            min-width: 160px;
        }
        .trigger-type-display {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 6px 14px 6px 16px;
            background: rgba(255,255,255,0.04);
            border: 1px solid rgba(255,255,255,0.06);
            border-radius: 40px;
            cursor: pointer;
            color: #e6edf5;
            font-size: 13px;
            font-weight: 500;
            transition: 0.25s ease;
            min-height: 36px;
            user-select: none;
        }
        .trigger-type-display:hover {
            border-color: rgba(255,255,255,0.12);
            background: rgba(255,255,255,0.06);
        }
        .trigger-type-dropdown {
            position: absolute;
            top: calc(100% + 4px);
            left: 0;
            right: 0;
            background: rgba(14, 18, 30, 0.98);
            backdrop-filter: blur(16px);
            border: 1px solid rgba(255,255,255,0.06);
            border-radius: 12px;
            padding: 6px 0;
            opacity: 0;
            visibility: hidden;
            transform: translateY(-6px) scale(0.98);
            transition: all 0.2s ease;
            z-index: 100;
            box-shadow: 0 20px 60px rgba(0,0,0,0.5);
            overflow: hidden;
            max-height: 0;
            overflow-y: auto;
        }
        .trigger-type-dropdown.open {
            opacity: 1;
            visibility: visible;
            transform: translateY(0) scale(1);
            max-height: 200px;
        }
        .trigger-type-option {
            padding: 8px 16px;
            cursor: pointer;
            transition: 0.15s ease;
            color: #b8c4de;
            font-size: 13px;
            font-weight: 500;
        }
        .trigger-type-option:hover {
            background: rgba(255,255,255,0.04);
            color: #e6edf5;
        }
        .trigger-type-option.selected {
            background: rgba(255,255,255,0.02);
            color: #e6edf5;
        }
        .trigger-type-option.selected::after {
            content: ' ✓';
            color: #6a8af0;
        }
        .status-badge-pending { background: rgba(212,192,154,0.10); color: #d4c09a; padding: 2px 10px; border-radius: 20px; font-size: 10px; display: inline-block; }
        .status-badge-activated { background: rgba(74,222,128,0.10); color: #4ade80; padding: 2px 10px; border-radius: 20px; font-size: 10px; display: inline-block; }
        .status-badge-completed { background: rgba(74,124,255,0.10); color: #4a7cff; padding: 2px 10px; border-radius: 20px; font-size: 10px; display: inline-block; }
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
        
        @media (max-width: 1200px) {
            #setordersMain > div:first-child {
                grid-template-columns: 1fr !important;
            }
        }
        @media (max-width: 768px) {
            #setordersMain > div:first-child {
                grid-template-columns: 1fr !important;
            }
            .trigger-tab-btn {
                font-size: 10px !important;
                padding: 4px 10px !important;
            }
        }
    `;
    document.head.appendChild(style);
    
    // 绑定搜索用户
    document.getElementById('setordersSearchBtn')?.addEventListener('click', function() {
        setordersSearchKeyword = document.getElementById('setordersSearchUid').value.trim();
        loadSetordersUserList();
    });
    document.getElementById('setordersClearBtn')?.addEventListener('click', function() {
        document.getElementById('setordersSearchUid').value = '';
        setordersSearchKeyword = '';
        document.getElementById('setordersUserList').style.display = 'none';
        document.getElementById('setordersMain').style.display = 'none';
        currentSetUser = null;
    });
    document.getElementById('setordersSearchUid')?.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            setordersSearchKeyword = document.getElementById('setordersSearchUid').value.trim();
            loadSetordersUserList();
        }
    });
    
    // 绑定标签切换
    document.querySelectorAll('.trigger-tab-btn').forEach(function(btn) {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.trigger-tab-btn').forEach(function(b) { b.classList.remove('active'); });
            this.classList.add('active');
            currentTriggerTab = this.dataset.type;
            
            // 更新标签文字
            const label = document.getElementById('triggerAmountLabel');
            if (currentTriggerTab === 'card_reward') {
                label.textContent = 'Reward Amount (€)';
            } else {
                label.textContent = 'Order Price (€)';
            }
            
            // 清空搜索结果
            document.getElementById('searchResultsContainer').innerHTML = `
                <div style="text-align: center; padding: 40px 20px; color: #6a7a92; font-size: 13px;">
                    <i class="fas fa-search" style="display: block; font-size: 32px; color: #4a5a72; margin-bottom: 12px;"></i>
                    Search product price to show result
                </div>
            `;
            selectedCardOrder = null;
            selectedAdvancedOrdersList = [];
        });
    });
    
    // 绑定搜索按钮
    document.getElementById('triggerSearchBtn')?.addEventListener('click', function() {
        searchTriggerOrders();
    });
    document.getElementById('triggerAmount')?.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            searchTriggerOrders();
        }
    });
    
    // 绑定 Confirm / Cancel
    document.getElementById('confirmTriggerBtn')?.addEventListener('click', confirmTriggerOrder);
    document.getElementById('cancelTriggerBtn')?.addEventListener('click', cancelTriggerOrder);
    
    // 绑定历史刷新
    document.getElementById('refreshHistoryBtn')?.addEventListener('click', function() {
        loadTriggerHistory();
    });
    document.getElementById('refreshTriggerBtn')?.addEventListener('click', function() {
        if (currentSetUser) {
            loadSetordersUserList();
            loadTriggerHistory();
            showToast('已刷新', 'success');
        }
    });
    
    // 绑定历史搜索
    document.getElementById('triggerHistorySearchBtn')?.addEventListener('click', function() {
        triggerSearchKeyword = document.getElementById('triggerHistorySearch').value.trim();
        triggerHistoryPage = 1;
        loadTriggerHistory();
    });
    document.getElementById('triggerHistoryClearBtn')?.addEventListener('click', function() {
        document.getElementById('triggerHistorySearch').value = '';
        triggerSearchKeyword = '';
        triggerHistoryPage = 1;
        loadTriggerHistory();
    });
    document.getElementById('triggerHistorySearch')?.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            triggerSearchKeyword = document.getElementById('triggerHistorySearch').value.trim();
            triggerHistoryPage = 1;
            loadTriggerHistory();
        }
    });
    
    // 加载历史
    await loadTriggerHistory();
}

// ========== 搜索用户 ==========
async function loadSetordersUserList() {
    const tbody = document.getElementById('setordersUserTableBody');
    const listDiv = document.getElementById('setordersUserList');
    
    if (!setordersSearchKeyword) {
        listDiv.style.display = 'none';
        return;
    }
    
    try {
        let query = sb.from('users').select('uid, username, balance, round_orders_count').order('created_at', { ascending: false });
        if (setordersSearchKeyword) {
            query = query.or('uid.ilike.%' + setordersSearchKeyword + '%,username.ilike.%' + setordersSearchKeyword + '%');
        }
        
        const { data: users } = await query.limit(20);
        
        if (!users || users.length === 0) {
            listDiv.style.display = 'block';
            tbody.innerHTML = '<tr><td colspan="3" style="text-align:center; padding:20px; color:#6a7a9a;">No users found</td></tr>';
            return;
        }
        
        listDiv.style.display = 'block';
        tbody.innerHTML = '';
        
        for (const user of users) {
            const row = tbody.insertRow();
            row.insertCell(0).innerHTML = '<span class="badge" style="background: rgba(255,255,255,0.08); padding: 2px 12px; border-radius: 20px; font-size: 11px; color: #c8d2e8; border: 1px solid rgba(255,255,255,0.06);">' + escapeHtml(user.uid) + '</span>';
            row.insertCell(1).innerText = user.username;
            row.insertCell(2).innerHTML = `<button class="select-user-btn" data-uid="${user.uid}" data-name="${user.username}" data-balance="${user.balance || 0}" data-orders="${user.round_orders_count || 0}" style="background: rgba(74,124,255,0.06); border: 1px solid rgba(74,124,255,0.08); border-radius: 30px; padding: 4px 16px; color: #4a7cff; cursor: pointer; font-size: 11px; font-weight: 500; transition: 0.2s; font-family: 'Inter', sans-serif;">
                <i class="fas fa-arrow-right"></i> Select
            </button>`;
        }
        
        document.querySelectorAll('.select-user-btn').forEach(function(btn) {
            btn.addEventListener('click', function() {
                const uid = this.dataset.uid;
                const name = this.dataset.name;
                const balance = parseFloat(this.dataset.balance) || 0;
                const orders = parseInt(this.dataset.orders) || 0;
                selectUserForTrigger(uid, name, balance, orders);
            });
        });
        
    } catch (e) {
        console.error('搜索用户失败:', e);
    }
}

// ========== 选择用户 ==========
function selectUserForTrigger(uid, username, balance, orders) {
    currentSetUser = { uid, username, balance, orders };
    
    document.getElementById('selectedUidDisplay').innerText = uid;
    document.getElementById('selectedUserOrders').innerText = orders;
    document.getElementById('selectedUserBalance').innerHTML = '€' + balance.toFixed(2);
    document.getElementById('setordersUserList').style.display = 'none';
    document.getElementById('setordersMain').style.display = 'block';
    
    // 清空搜索结果
    document.getElementById('searchResultsContainer').innerHTML = `
        <div style="text-align: center; padding: 40px 20px; color: #6a7a92; font-size: 13px;">
            <i class="fas fa-search" style="display: block; font-size: 32px; color: #4a5a72; margin-bottom: 12px;"></i>
            Search product price to show result
        </div>
    `;
    selectedCardOrder = null;
    selectedAdvancedOrdersList = [];
    
    loadTriggerHistory();
}

// ========== 搜索触发订单 ==========
async function searchTriggerOrders() {
    if (!currentSetUser) {
        showToast('请先选择用户', 'error');
        return;
    }
    
    const amount = parseFloat(document.getElementById('triggerAmount').value);
    if (!amount || amount <= 0) {
        showToast('请输入有效的金额', 'error');
        return;
    }
    
    const container = document.getElementById('searchResultsContainer');
    container.innerHTML = '<div style="text-align:center; padding:20px; color:#6a7a9a;"><i class="fas fa-spinner fa-spin"></i> Searching...</div>';
    
    try {
        const priceNum = Math.floor(amount);
        const digitCount = priceNum.toString().length;
        let minPrice = priceNum, maxPrice;
        if (digitCount === 2) maxPrice = priceNum + 19;
        else if (digitCount === 3) maxPrice = priceNum + 99;
        else if (digitCount === 4) maxPrice = priceNum + 999;
        else if (digitCount === 5) maxPrice = priceNum + 9999;
        else maxPrice = priceNum;
        
        // 根据类型搜索
        if (currentTriggerTab === 'card_reward') {
            // 卡牌奖励：直接显示结果
            container.innerHTML = `
                <div style="padding: 12px; background: rgba(255,184,77,0.06); border-radius: 8px; border: 1px solid rgba(255,184,77,0.08);">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <div style="font-size: 13px; font-weight: 500; color: #d8e0f0;">Diamond Reward</div>
                            <div style="font-size: 12px; color: #ffb84d;">€${amount.toFixed(2)}</div>
                        </div>
                        <div style="color: #4ade80;"><i class="fas fa-check-circle"></i> Ready</div>
                    </div>
                </div>
                <div style="margin-top: 8px; font-size: 11px; color: #6a7a92; text-align: center;">Click Confirm Trigger to set this reward</div>
            `;
            return;
        }
        
        // 高级订单 / 卡牌订单：搜索订单池
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
        
        container.innerHTML = '';
        selectedAdvancedOrdersList = [];
        
        const isCardOrder = currentTriggerTab === 'card_order';
        
        for (const order of matchedOrders) {
            const div = document.createElement('div');
            div.className = 'result-item';
            div.dataset.id = order.id;
            div.dataset.price = order.price;
            div.dataset.name = order.accommodation_name;
            div.dataset.image = order.image_url || '';
            div.dataset.code = order.order_code || '';
            
            const commission = isCardOrder ? (order.price * 0.15) : (order.price * 0.05);
            const commissionText = isCardOrder ? '15%' : '5%';
            
            div.innerHTML = `
                <div>
                    <div class="result-name">${escapeHtml(order.accommodation_name || 'Hotel Task')}</div>
                    <div style="font-size: 11px; color: #6a7a92;">Code: ${escapeHtml(order.order_code || '-')}</div>
                </div>
                <div style="text-align: right;">
                    <div class="result-price">€${order.price.toFixed(2)}</div>
                    <div style="font-size: 10px; color: #4ade80;">Commission: €${commission.toFixed(2)} (${commissionText})</div>
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
            });
            
            container.appendChild(div);
        }
        
        // 如果没有选中任何订单，默认选中第一个
        const firstResult = container.querySelector('.result-item');
        if (firstResult) {
            firstResult.click();
        }
        
    } catch (e) {
        console.error('搜索失败:', e);
        container.innerHTML = '<div style="text-align:center; padding:20px; color:#e88080;">搜索失败: ' + e.message + '</div>';
    }
}

// ========== 确认触发订单 ==========
async function confirmTriggerOrder() {
    if (!currentSetUser) {
        showToast('请先选择用户', 'error');
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
        const selectedEl = document.querySelector('.result-item.selected');
        if (!selectedEl) {
            showToast('请先搜索并选择一个订单', 'error');
            return;
        }
        selectedOrder = {
            id: parseInt(selectedEl.dataset.id),
            price: parseFloat(selectedEl.dataset.price),
            name: selectedEl.dataset.name,
            image_url: selectedEl.dataset.image,
            order_code: selectedEl.dataset.code
        };
    }
    
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
        } else {
            showToast('请选择有效的触发类型', 'error');
            return;
        }
        
        await sb.from('user_trigger_orders').insert([insertData]);
        
        const typeNames = {
            'advanced': 'Commercial Order',
            'card_reward': 'Diamond Reward',
            'card_order': 'x30 Commissions Order'
        };
        
        showToast('✅ ' + typeNames[currentTriggerTab] + ' triggered for ' + currentSetUser.username, 'success');
        
        // 刷新
        document.getElementById('triggerOrderCount').value = '1';
        document.getElementById('triggerAmount').value = '';
        document.getElementById('searchResultsContainer').innerHTML = `
            <div style="text-align: center; padding: 40px 20px; color: #6a7a92; font-size: 13px;">
                <i class="fas fa-search" style="display: block; font-size: 32px; color: #4a5a72; margin-bottom: 12px;"></i>
                Search product price to show result
            </div>
        `;
        selectedAdvancedOrdersList = [];
        selectedCardOrder = null;
        
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
            <i class="fas fa-search" style="display: block; font-size: 32px; color: #4a5a72; margin-bottom: 12px;"></i>
            Search product price to show result
        </div>
    `;
    selectedAdvancedOrdersList = [];
    selectedCardOrder = null;
    showToast('已取消', 'info');
}

// ========== 加载触发历史 ==========
async function loadTriggerHistory() {
    const tbody = document.getElementById('triggerHistoryBody');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:20px; color:#6a7a9a;">Loading...</td></tr>';
    
    try {
        let query = sb
            .from('user_trigger_orders')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (currentSetUser) {
            query = query.eq('uid', currentSetUser.uid);
        }
        
        if (triggerSearchKeyword) {
            query = query.ilike('uid', '%' + triggerSearchKeyword + '%');
        }
        
        const { data: records, error } = await query;
        if (error) throw error;
        
        if (!records || records.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:20px; color:#6a7a9a;">No trigger records</td></tr>';
            return;
        }
        
        const typeNames = {
            'advanced': 'Commercial Order',
            'card_reward': 'Diamond Reward',
            'card_order': 'x30 Commissions Order'
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
            row.insertCell(4).innerHTML = '<span class="' + statusClass + '">' + statusText + '</span>';
            
            // Action: 删除按钮
            if (record.status === 'pending') {
                row.insertCell(5).innerHTML = `<button class="delete-trigger-btn" data-id="${record.id}" style="background: rgba(232,128,128,0.06); border: 1px solid rgba(232,128,128,0.08); border-radius: 30px; padding: 2px 12px; color: #e88080; cursor: pointer; font-size: 11px; transition: 0.2s; font-family: 'Inter', sans-serif;">
                    <i class="fas fa-trash"></i> Delete
                </button>`;
            } else {
                row.insertCell(5).innerHTML = '<span style="font-size: 11px; color: #6a7a92;">-</span>';
            }
        }
        
        // 绑定删除事件
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
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:20px; color:#e88080;">加载失败: ' + escapeHtml(e.message) + '</td></tr>';
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