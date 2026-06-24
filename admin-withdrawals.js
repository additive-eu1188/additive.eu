// admin-withdrawals.js - 完整版（标签切换 + 搜索功能 + 专业质感样式 + 自定义下拉）
let currentWithdrawTab = 'pending';
let withdrawSearchKeyword = '';

// ========== 自定义下拉初始化 ==========
function initCustomSelect(containerId, options, selectedValue) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    // 如果已经初始化过，跳过
    if (container.dataset.initialized === 'true') return;
    container.dataset.initialized = 'true';
    
    const display = container.querySelector('.custom-select-display');
    const dropdown = container.querySelector('.custom-select-dropdown');
    const optionsList = container.querySelector('.custom-select-options');
    const hiddenInput = container.querySelector('.custom-select-hidden');
    
    if (!display || !dropdown || !optionsList || !hiddenInput) return;
    
    // 设置初始值
    if (selectedValue) {
        hiddenInput.value = selectedValue;
        const selectedOption = optionsList.querySelector(`[data-value="${selectedValue}"]`);
        if (selectedOption) {
            display.innerHTML = selectedOption.innerHTML;
        }
    }
    
    // 切换下拉显示
    display.addEventListener('click', function(e) {
        e.stopPropagation();
        const isOpen = dropdown.classList.contains('open');
        // 关闭所有其他下拉
        document.querySelectorAll('.custom-select-dropdown.open').forEach(el => {
            if (el !== dropdown) el.classList.remove('open');
        });
        dropdown.classList.toggle('open');
    });
    
    // 选项点击
    optionsList.querySelectorAll('.custom-select-option').forEach(option => {
        option.addEventListener('click', function(e) {
            e.stopPropagation();
            const value = this.dataset.value;
            const label = this.dataset.label || this.textContent.trim();
            hiddenInput.value = value;
            display.innerHTML = `<span>${label}</span>`;
            dropdown.classList.remove('open');
            
            // 触发 change 事件
            const changeEvent = new Event('change', { bubbles: true });
            hiddenInput.dispatchEvent(changeEvent);
            
            // 触发搜索
            const searchBtn = container.closest('.search-bar')?.querySelector('.btn-search, .search-btn');
            if (searchBtn) {
                searchBtn.click();
            }
        });
    });
    
    // 点击外部关闭
    document.addEventListener('click', function() {
        dropdown.classList.remove('open');
    });
}

// ========== 渲染自定义下拉HTML ==========
function renderCustomSelectHTML(id, options, selectedValue, placeholder) {
    const opts = options || ['All Crypto', 'BTC', 'ETH', 'USDC', 'USDT'];
    const selected = selectedValue || '';
    const ph = placeholder || 'All Crypto';
    
    let optionsHtml = opts.map(opt => {
        const value = opt === 'All Crypto' ? '' : opt;
        const selectedAttr = (value === selected) ? ' class="custom-select-option selected"' : ' class="custom-select-option"';
        return `<div${selectedAttr} data-value="${value}" data-label="${opt}">${opt}</div>`;
    }).join('');
    
    return `
        <div class="custom-select-wrapper" id="${id}">
            <div class="custom-select-display">
                <span>${selected ? opts.find(o => (o === 'All Crypto' ? '' : o) === selected) || ph : ph}</span>
                <i class="fas fa-chevron-down"></i>
            </div>
            <div class="custom-select-dropdown">
                <div class="custom-select-options">
                    ${optionsHtml}
                </div>
            </div>
            <input type="hidden" class="custom-select-hidden" value="${selected}">
        </div>
    `;
}

async function loadWithdrawalsPage() {
    const container = document.getElementById('page_withdrawals');
    if (!container) return;
    container.innerHTML = `
        <div class="card">
            <!-- 顶部：左侧标题 + 右侧按钮 -->
            <div class="withdraw-header" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; margin-bottom: 24px;">
                <h2 style="font-size: 18px; font-weight: 600; color: #d8e0f0; margin: 0;">
                    <i class="fas fa-arrow-right-to-bracket" style="color: #8892a8; margin-right: 10px;"></i>
                    Current Withdrawal and recent withdrawals records
                </h2>
                <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                    <button id="tabPending" class="tab-withdraw-btn active" data-tab="pending"><i class="fas fa-list-ul"></i> Withdrawals</button>
                    <button id="tabHistory" class="tab-withdraw-btn" data-tab="history"><i class="fas fa-clock-rotate-left"></i> Withdrawals History</button>
                    <button id="refreshWithdrawBtn" class="btn-primary"><i class="fas fa-sync-alt"></i> Refresh</button>
                </div>
            </div>
            
            <!-- 待处理面板 -->
            <div id="pendingPanel" class="withdraw-panel">
                <!-- 四张统计卡片 -->
                <div class="stats-grid" style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 24px;">
                    <div class="stat-item" style="background: rgba(12, 16, 28, 0.6); border-radius: 16px; padding: 16px 20px; text-align: center; border: 1px solid rgba(255,255,255,0.04);">
                        <div class="label" style="font-size: 11px; color: #8892a8; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">Total Withdrawals</div>
                        <div class="value" id="statTotalWithdraw" style="font-size: 28px; font-weight: 700; color: #ffffff;">€0</div>
                    </div>
                    <div class="stat-item" style="background: rgba(12, 16, 28, 0.6); border-radius: 16px; padding: 16px 20px; text-align: center; border: 1px solid rgba(255,255,255,0.04);">
                        <div class="label" style="font-size: 11px; color: #8892a8; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">Pending Withdrawals</div>
                        <div class="value" id="statPendingWithdraw" style="font-size: 28px; font-weight: 700; color: #ffffff;">€0</div>
                    </div>
                    <div class="stat-item" style="background: rgba(12, 16, 28, 0.6); border-radius: 16px; padding: 16px 20px; text-align: center; border: 1px solid rgba(255,255,255,0.04);">
                        <div class="label" style="font-size: 11px; color: #8892a8; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">Approved</div>
                        <div class="value" id="statApprovedWithdraw" style="font-size: 28px; font-weight: 700; color: #ffffff;">€0</div>
                    </div>
                    <div class="stat-item" style="background: rgba(12, 16, 28, 0.6); border-radius: 16px; padding: 16px 20px; text-align: center; border: 1px solid rgba(255,255,255,0.04);">
                        <div class="label" style="font-size: 11px; color: #8892a8; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">Rejected</div>
                        <div class="value" id="statRejectedWithdraw" style="font-size: 28px; font-weight: 700; color: #ffffff;">€0</div>
                    </div>
                </div>
                
                <!-- 搜索栏 -->
                <div class="search-bar" style="display: flex; flex-wrap: wrap; gap: 10px; align-items: center; background: rgba(8, 12, 24, 0.5); border-radius: 16px; padding: 12px 16px; margin-bottom: 20px; border: 1px solid rgba(255,255,255,0.03);">
                    <input type="text" id="pendingSearchInput" class="search-input" placeholder="Search UID / phone / wallet address" style="flex: 1; min-width: 160px; background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.10); border-radius: 40px; padding: 8px 16px; color: #e6edf5; font-size: 13px; outline: none;">
                    
                    <!-- 自定义 Crypto Type 下拉 -->
                    <div style="min-width: 140px; flex-shrink: 0;">
                        ${renderCustomSelectHTML('pendingCryptoSelect', ['All Crypto', 'BTC', 'ETH', 'USDC', 'USDT'], '')}
                    </div>
                    
                    <input type="number" id="pendingMinAmount" placeholder="Min Amount" style="width: 110px; background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.10); border-radius: 40px; padding: 8px 16px; color: #e6edf5; font-size: 13px; outline: none;">
                    <input type="number" id="pendingMaxAmount" placeholder="Max Amount" style="width: 110px; background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.10); border-radius: 40px; padding: 8px 16px; color: #e6edf5; font-size: 13px; outline: none;">
                    <button id="pendingSearchBtn" class="btn-primary" style="padding: 8px 20px; border-radius: 40px; border: none; background: #2a3a5a; color: #e6edf5; font-weight: 600; cursor: pointer; font-size: 13px; white-space: nowrap;"><i class="fas fa-search"></i> Search</button>
                    <button id="pendingClearBtn" class="btn-primary" style="padding: 8px 18px; border-radius: 40px; border: none; background: rgba(255,255,255,0.06); color: #b8c4de; font-weight: 500; cursor: pointer; font-size: 13px; white-space: nowrap;"><i class="fas fa-times"></i> Clear</button>
                </div>
                
                <div class="table-container" style="max-height: 500px; overflow-y: auto; border-radius: 16px; border: 1px solid rgba(255,255,255,0.03);">
                    <table class="data-table" style="width: 100%; border-collapse: collapse; font-size: 13px; min-width: 1000px;">
                        <thead>
                            <tr>
                                <th style="padding: 14px 14px; color: #a8b4d0; font-weight: 600; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid rgba(255,255,255,0.04); background: rgba(10,14,28,0.3); text-align: left;">User ID</th>
                                <th style="padding: 14px 14px; color: #a8b4d0; font-weight: 600; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid rgba(255,255,255,0.04); background: rgba(10,14,28,0.3); text-align: left;">Username</th>
                                <th style="padding: 14px 14px; color: #a8b4d0; font-weight: 600; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid rgba(255,255,255,0.04); background: rgba(10,14,28,0.3); text-align: left;">Amount</th>
                                <th style="padding: 14px 14px; color: #a8b4d0; font-weight: 600; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid rgba(255,255,255,0.04); background: rgba(10,14,28,0.3); text-align: left;">Crypto Type</th>
                                <th style="padding: 14px 14px; color: #a8b4d0; font-weight: 600; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid rgba(255,255,255,0.04); background: rgba(10,14,28,0.3); text-align: left;">Wallet Address</th>
                                <th style="padding: 14px 14px; color: #a8b4d0; font-weight: 600; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid rgba(255,255,255,0.04); background: rgba(10,14,28,0.3); text-align: left;">User IP</th>
                                <th style="padding: 14px 14px; color: #a8b4d0; font-weight: 600; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid rgba(255,255,255,0.04); background: rgba(10,14,28,0.3); text-align: left;">Withdrawal Time</th>
                                <th style="padding: 14px 14px; color: #a8b4d0; font-weight: 600; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid rgba(255,255,255,0.04); background: rgba(10,14,28,0.3); text-align: left;">Actions</th>
                            </tr>
                        </thead>
                        <tbody id="withdrawalsTableBody"><tr><td colspan="8" style="text-align:center; padding:30px; color:#6a7a9a;">Loading...</td></tr></tbody>
                    </table>
                </div>
            </div>
            
            <!-- 历史记录面板 -->
            <div id="historyPanel" class="withdraw-panel" style="display: none;">
                <!-- 历史页面的四张统计卡片 -->
                <div class="stats-grid" style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 24px;">
                    <div class="stat-item" style="background: rgba(12, 16, 28, 0.6); border-radius: 16px; padding: 16px 20px; text-align: center; border: 1px solid rgba(255,255,255,0.04);">
                        <div class="label" style="font-size: 11px; color: #8892a8; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">Total Withdrawals</div>
                        <div class="value" id="historyStatTotal" style="font-size: 28px; font-weight: 700; color: #ffffff;">€0</div>
                    </div>
                    <div class="stat-item" style="background: rgba(12, 16, 28, 0.6); border-radius: 16px; padding: 16px 20px; text-align: center; border: 1px solid rgba(255,255,255,0.04);">
                        <div class="label" style="font-size: 11px; color: #8892a8; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">Pending Withdrawals</div>
                        <div class="value" id="historyStatPending" style="font-size: 28px; font-weight: 700; color: #ffffff;">€0</div>
                    </div>
                    <div class="stat-item" style="background: rgba(12, 16, 28, 0.6); border-radius: 16px; padding: 16px 20px; text-align: center; border: 1px solid rgba(255,255,255,0.04);">
                        <div class="label" style="font-size: 11px; color: #8892a8; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">Approved</div>
                        <div class="value" id="historyStatApproved" style="font-size: 28px; font-weight: 700; color: #ffffff;">€0</div>
                    </div>
                    <div class="stat-item" style="background: rgba(12, 16, 28, 0.6); border-radius: 16px; padding: 16px 20px; text-align: center; border: 1px solid rgba(255,255,255,0.04);">
                        <div class="label" style="font-size: 11px; color: #8892a8; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">Rejected</div>
                        <div class="value" id="historyStatRejected" style="font-size: 28px; font-weight: 700; color: #ffffff;">€0</div>
                    </div>
                </div>
                
                <!-- 历史搜索栏 -->
                <div class="search-bar" style="display: flex; flex-wrap: wrap; gap: 10px; align-items: center; background: rgba(8, 12, 24, 0.5); border-radius: 16px; padding: 12px 16px; margin-bottom: 20px; border: 1px solid rgba(255,255,255,0.03);">
                    <input type="text" id="historySearchInput" class="search-input" placeholder="Search UID / phone / wallet address" style="flex: 1; min-width: 160px; background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.10); border-radius: 40px; padding: 8px 16px; color: #e6edf5; font-size: 13px; outline: none;">
                    
                    <!-- 自定义 Crypto Type 下拉 -->
                    <div style="min-width: 140px; flex-shrink: 0;">
                        ${renderCustomSelectHTML('historyCryptoSelect', ['All Crypto', 'BTC', 'ETH', 'USDC', 'USDT'], '')}
                    </div>
                    
                    <input type="number" id="historyMinAmount" placeholder="Min Amount" style="width: 110px; background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.10); border-radius: 40px; padding: 8px 16px; color: #e6edf5; font-size: 13px; outline: none;">
                    <input type="number" id="historyMaxAmount" placeholder="Max Amount" style="width: 110px; background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.10); border-radius: 40px; padding: 8px 16px; color: #e6edf5; font-size: 13px; outline: none;">
                    <button id="historySearchBtn" class="btn-primary" style="padding: 8px 20px; border-radius: 40px; border: none; background: #2a3a5a; color: #e6edf5; font-weight: 600; cursor: pointer; font-size: 13px; white-space: nowrap;"><i class="fas fa-search"></i> Search</button>
                    <button id="historyClearBtn" class="btn-primary" style="padding: 8px 18px; border-radius: 40px; border: none; background: rgba(255,255,255,0.06); color: #b8c4de; font-weight: 500; cursor: pointer; font-size: 13px; white-space: nowrap;"><i class="fas fa-times"></i> Clear</button>
                    <button id="clearHistoryBtn" class="danger" style="background:#7a2f2f; border:none; padding:8px 16px; border-radius:40px; color:#fff; cursor:pointer; margin-left: auto; white-space: nowrap;"><i class="fas fa-trash"></i> Clear All</button>
                </div>
                
                <div class="table-container" style="max-height: 500px; overflow-y: auto; border-radius: 16px; border: 1px solid rgba(255,255,255,0.03);">
                    <table class="data-table" style="width: 100%; border-collapse: collapse; font-size: 13px; min-width: 1000px;">
                        <thead>
                            <tr>
                                <th style="padding: 14px 14px; color: #a8b4d0; font-weight: 600; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid rgba(255,255,255,0.04); background: rgba(10,14,28,0.3); text-align: left;">User ID</th>
                                <th style="padding: 14px 14px; color: #a8b4d0; font-weight: 600; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid rgba(255,255,255,0.04); background: rgba(10,14,28,0.3); text-align: left;">Username</th>
                                <th style="padding: 14px 14px; color: #a8b4d0; font-weight: 600; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid rgba(255,255,255,0.04); background: rgba(10,14,28,0.3); text-align: left;">Amount</th>
                                <th style="padding: 14px 14px; color: #a8b4d0; font-weight: 600; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid rgba(255,255,255,0.04); background: rgba(10,14,28,0.3); text-align: left;">Crypto Type</th>
                                <th style="padding: 14px 14px; color: #a8b4d0; font-weight: 600; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid rgba(255,255,255,0.04); background: rgba(10,14,28,0.3); text-align: left;">Wallet Address</th>
                                <th style="padding: 14px 14px; color: #a8b4d0; font-weight: 600; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid rgba(255,255,255,0.04); background: rgba(10,14,28,0.3); text-align: left;">User IP</th>
                                <th style="padding: 14px 14px; color: #a8b4d0; font-weight: 600; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid rgba(255,255,255,0.04); background: rgba(10,14,28,0.3); text-align: left;">Withdrawal Time</th>
                                <th style="padding: 14px 14px; color: #a8b4d0; font-weight: 600; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid rgba(255,255,255,0.04); background: rgba(10,14,28,0.3); text-align: left;">Status</th>
                            </tr>
                        </thead>
                        <tbody id="withdrawalHistoryBody"><tr><td colspan="8" style="text-align:center; padding:30px; color:#6a7a9a;">Loading...</td></tr></tbody>
                    </table>
                </div>
            </div>
        </div>
    `;
    
    // 添加样式（包含自定义下拉样式，与 register 页面一致）
    const style = document.createElement('style');
    style.textContent = `
        .tab-withdraw-btn {
            background: rgba(255,255,255,0.04);
            border: 1px solid rgba(255,255,255,0.06);
            border-radius: 30px;
            padding: 8px 20px;
            color: #8892a8;
            cursor: pointer;
            transition: all 0.2s;
            font-size: 14px;
            font-weight: 500;
            font-family: 'Inter', sans-serif;
        }
        .tab-withdraw-btn:hover {
            background: rgba(255,255,255,0.08);
            color: #e6edf5;
        }
        .tab-withdraw-btn.active {
            background: #2a3a5a;
            color: #e6edf5;
            border-color: #3a5a7a;
        }
        .wallet-address-cell {
            max-width: 200px;
            word-break: break-all;
        }
        .wallet-address-wrapper {
            display: flex;
            align-items: center;
            gap: 6px;
        }
        .wallet-address-text {
            font-size: 11px;
            font-family: 'Courier New', monospace;
            color: #b0c0da;
            word-break: break-all;
            line-height: 1.4;
        }
        .copy-address-btn {
            background: rgba(255,255,255,0.04);
            border: none;
            padding: 2px 8px;
            border-radius: 4px;
            color: #6a7a92;
            cursor: pointer;
            font-size: 11px;
            transition: 0.2s;
            flex-shrink: 0;
        }
        .copy-address-btn:hover {
            background: rgba(255,255,255,0.08);
            color: #b0c0da;
        }
        .currency-badge {
            display: inline-block;
            padding: 2px 12px;
            border-radius: 40px;
            font-size: 11px;
            font-weight: 600;
            background: rgba(255,255,255,0.04);
            color: #b8c4de;
        }
        .currency-badge.usdt { background: rgba(212, 192, 154, 0.10); color: #d4c09a; }
        .currency-badge.eth { background: rgba(138, 180, 240, 0.10); color: #8ab4f0; }
        .currency-badge.btc { background: rgba(232, 128, 128, 0.10); color: #e88080; }
        .currency-badge.usdc { background: rgba(122, 208, 176, 0.10); color: #7ad0b0; }
        .status-badge-approved { background: rgba(122, 208, 176, 0.10); color: #7ad0b0; padding: 2px 12px; border-radius: 40px; font-size: 11px; display: inline-block; }
        .status-badge-rejected { background: rgba(232, 128, 128, 0.10); color: #e88080; padding: 2px 12px; border-radius: 40px; font-size: 11px; display: inline-block; }
        .status-badge-pending { background: rgba(212, 192, 154, 0.10); color: #d4c09a; padding: 2px 12px; border-radius: 40px; font-size: 11px; display: inline-block; }
        .btn-sm-action {
            padding: 4px 12px;
            font-size: 11px;
            border: none;
            border-radius: 40px;
            color: #fff;
            cursor: pointer;
            transition: 0.2s;
            margin-right: 4px;
            font-weight: 600;
        }
        .btn-sm-action:hover {
            opacity: 0.85;
        }
        .btn-approve { background: rgba(122, 208, 176, 0.15); color: #7ad0b0; }
        .btn-approve:hover { background: rgba(122, 208, 176, 0.25); }
        .btn-reject { background: rgba(232, 128, 128, 0.15); color: #e88080; }
        .btn-reject:hover { background: rgba(232, 128, 128, 0.25); }
        .withdraw-panel {
            animation: fadeIn 0.3s ease;
        }
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(8px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .country-flag-img {
            width: 22px;
            height: 16px;
            border-radius: 2px;
            vertical-align: middle;
            margin-right: 6px;
            object-fit: cover;
            border: 1px solid rgba(255,255,255,0.04);
        }
        .country-name {
            font-size: 12px;
            color: #c8d2e8;
            vertical-align: middle;
        }
        
        /* ===== 自定义下拉样式（与 register 页面一致） ===== */
        .custom-select-wrapper {
            position: relative;
            width: 100%;
            min-width: 140px;
        }
        .custom-select-display {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 8px 14px 8px 18px;
            background: rgba(255,255,255,0.08);
            border: 1px solid rgba(255,255,255,0.10);
            border-radius: 40px;
            cursor: pointer;
            color: #e6edf5;
            font-size: 13px;
            font-weight: 500;
            transition: 0.25s ease;
            min-height: 38px;
            user-select: none;
        }
        .custom-select-display:hover {
            border-color: rgba(255,255,255,0.18);
            background: rgba(255,255,255,0.10);
        }
        .custom-select-display i {
            color: #5a6a82;
            font-size: 11px;
            transition: 0.25s ease;
            margin-left: 6px;
            flex-shrink: 0;
        }
        .custom-select-dropdown {
            position: absolute;
            top: calc(100% + 6px);
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
        .custom-select-dropdown.open {
            opacity: 1;
            visibility: visible;
            transform: translateY(0) scale(1);
            max-height: 240px;
        }
        .custom-select-dropdown::-webkit-scrollbar {
            width: 3px;
        }
        .custom-select-dropdown::-webkit-scrollbar-thumb {
            background: rgba(255,255,255,0.08);
            border-radius: 4px;
        }
        .custom-select-options {
            padding: 4px 0;
        }
        .custom-select-option {
            padding: 10px 18px;
            cursor: pointer;
            transition: 0.15s ease;
            color: #b8c4de;
            font-size: 13px;
            font-weight: 500;
        }
        .custom-select-option:hover {
            background: rgba(255,255,255,0.04);
            color: #e6edf5;
        }
        .custom-select-option.selected {
            background: rgba(255,255,255,0.02);
            color: #e6edf5;
        }
        .custom-select-option.selected::after {
            content: ' ✓';
            color: #6a8af0;
        }
        
        select option {
            background: #141c2e !important;
            color: #e6edf5 !important;
            padding: 8px 12px !important;
        }
        select option:hover {
            background: #2a3a5a !important;
        }
        @media (max-width: 768px) {
            .wallet-address-cell {
                max-width: 120px;
            }
            .wallet-address-text {
                font-size: 10px;
            }
            .stats-grid {
                grid-template-columns: repeat(2, 1fr) !important;
            }
            .tab-withdraw-btn {
                font-size: 12px;
                padding: 6px 14px;
            }
            .search-bar {
                flex-direction: column;
                align-items: stretch;
            }
            .search-bar input, .search-bar .custom-select-wrapper {
                width: 100% !important;
                min-width: unset;
                flex: 1 1 auto !important;
            }
            .custom-select-wrapper {
                min-width: unset !important;
            }
        }
    `;
    document.head.appendChild(style);
    
    // 绑定标签切换
    document.getElementById('tabPending')?.addEventListener('click', () => switchWithdrawTab('pending'));
    document.getElementById('tabHistory')?.addEventListener('click', () => switchWithdrawTab('history'));
    
    // 绑定刷新按钮
    document.getElementById('refreshWithdrawBtn')?.addEventListener('click', refreshWithdrawData);
    
    // 初始化自定义下拉
    setTimeout(() => {
        initCustomSelect('pendingCryptoSelect', ['All Crypto', 'BTC', 'ETH', 'USDC', 'USDT'], '');
        initCustomSelect('historyCryptoSelect', ['All Crypto', 'BTC', 'ETH', 'USDC', 'USDT'], '');
    }, 100);
    
    // 绑定待处理搜索
    document.getElementById('pendingSearchBtn')?.addEventListener('click', () => {
        withdrawSearchKeyword = document.getElementById('pendingSearchInput').value.trim();
        loadWithdrawals();
    });
    document.getElementById('pendingClearBtn')?.addEventListener('click', () => {
        document.getElementById('pendingSearchInput').value = '';
        document.getElementById('pendingCryptoSelect')?.querySelector('.custom-select-hidden').value = '';
        document.getElementById('pendingCryptoSelect')?.querySelector('.custom-select-display').innerHTML = '<span>All Crypto</span><i class="fas fa-chevron-down"></i>';
        document.getElementById('pendingMinAmount').value = '';
        document.getElementById('pendingMaxAmount').value = '';
        withdrawSearchKeyword = '';
        loadWithdrawals();
    });
    document.getElementById('pendingSearchInput')?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            withdrawSearchKeyword = document.getElementById('pendingSearchInput').value.trim();
            loadWithdrawals();
        }
    });
    
    // 绑定自定义下拉 change 事件
    document.getElementById('pendingCryptoSelect')?.querySelector('.custom-select-hidden')?.addEventListener('change', function() {
        loadWithdrawals();
    });
    document.getElementById('historyCryptoSelect')?.querySelector('.custom-select-hidden')?.addEventListener('change', function() {
        loadWithdrawalHistory();
    });
    
    // 绑定历史搜索
    document.getElementById('historySearchBtn')?.addEventListener('click', () => {
        withdrawSearchKeyword = document.getElementById('historySearchInput').value.trim();
        loadWithdrawalHistory();
    });
    document.getElementById('historyClearBtn')?.addEventListener('click', () => {
        document.getElementById('historySearchInput').value = '';
        document.getElementById('historyCryptoSelect')?.querySelector('.custom-select-hidden').value = '';
        document.getElementById('historyCryptoSelect')?.querySelector('.custom-select-display').innerHTML = '<span>All Crypto</span><i class="fas fa-chevron-down"></i>';
        document.getElementById('historyMinAmount').value = '';
        document.getElementById('historyMaxAmount').value = '';
        withdrawSearchKeyword = '';
        loadWithdrawalHistory();
    });
    document.getElementById('historySearchInput')?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            withdrawSearchKeyword = document.getElementById('historySearchInput').value.trim();
            loadWithdrawalHistory();
        }
    });
    
    // 绑定清空记录
    document.getElementById('clearHistoryBtn')?.addEventListener('click', clearWithdrawalHistory);
    
    // 加载数据
    await loadWithdrawals();
    await loadWithdrawalHistory();
}

// ========== 标签切换 ==========
function switchWithdrawTab(tab) {
    currentWithdrawTab = tab;
    document.getElementById('tabPending').classList.toggle('active', tab === 'pending');
    document.getElementById('tabHistory').classList.toggle('active', tab === 'history');
    document.getElementById('pendingPanel').style.display = tab === 'pending' ? 'block' : 'none';
    document.getElementById('historyPanel').style.display = tab === 'history' ? 'block' : 'none';
    
    if (tab === 'pending') {
        loadWithdrawals();
    } else {
        loadWithdrawalHistory();
    }
}

// ========== 刷新所有数据 ==========
async function refreshWithdrawData() {
    const btn = document.getElementById('refreshWithdrawBtn');
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Refreshing...';
    }
    
    try {
        await Promise.all([
            loadWithdrawals(),
            loadWithdrawalHistory()
        ]);
        if (window.loadDashboardPage) window.loadDashboardPage(currentDays);
        showToast('Data refreshed', 'success');
    } catch (e) {
        console.error('Refresh failed:', e);
        showToast('Refresh failed: ' + e.message, 'error');
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-sync-alt"></i> Refresh';
        }
    }
}

// ========== 获取国家国旗 ==========
function getCountryFlag(countryName) {
    if (!countryName || countryName === 'Unknown') return null;
    const flagMap = {
        'Germany': 'de', 'United States': 'us', 'United Kingdom': 'gb',
        'Italy': 'it', 'China': 'cn', 'France': 'fr', 'Spain': 'es',
        'Switzerland': 'ch', 'Austria': 'at', 'Netherlands': 'nl',
        'Belgium': 'be', 'Denmark': 'dk', 'Sweden': 'se', 'Norway': 'no',
        'Finland': 'fi', 'Portugal': 'pt', 'Greece': 'gr', 'Turkey': 'tr',
        'Russia': 'ru', 'Japan': 'jp', 'South Korea': 'kr', 'India': 'in',
        'Brazil': 'br', 'Mexico': 'mx', 'Australia': 'au', 'New Zealand': 'nz',
        'South Africa': 'za', 'UAE': 'ae', 'Saudi Arabia': 'sa', 'Singapore': 'sg',
        'Malaysia': 'my', 'Philippines': 'ph', 'Indonesia': 'id', 'Thailand': 'th',
        'Vietnam': 'vn', 'Taiwan': 'tw', 'Hong Kong': 'hk', 'Macau': 'mo',
        'Ireland': 'ie', 'Poland': 'pl', 'Czech Republic': 'cz', 'Hungary': 'hu',
        'Croatia': 'hr', 'Malta': 'mt', 'Cyprus': 'cy', 'Estonia': 'ee',
        'Latvia': 'lv', 'Lithuania': 'lt', 'Moldova': 'md', 'Monaco': 'mc',
        'Liechtenstein': 'li', 'Greenland': 'gl', 'Faroe Islands': 'fo',
        'Iceland': 'is', 'Luxembourg': 'lu', 'Andorra': 'ad', 'Gibraltar': 'gi',
        'Canada': 'ca', 'Argentina': 'ar', 'Chile': 'cl', 'Colombia': 'co',
        'Peru': 'pe', 'Venezuela': 've', 'Egypt': 'eg', 'Nigeria': 'ng',
        'Kenya': 'ke', 'Israel': 'il', 'Pakistan': 'pk', 'Bangladesh': 'bd'
    };
    const code = flagMap[countryName];
    return code ? `https://flagcdn.com/w40/${code}.png` : null;
}

// ========== 加载待处理提现 ==========
async function loadWithdrawals() {
    const tbody = document.getElementById('withdrawalsTableBody');
    if (!tbody) return;
    
    try {
        let query = sb
            .from('withdrawals')
            .select('*')
            .eq('status', 'pending')
            .order('request_date', { ascending: false });
        
        // 应用搜索过滤
        const keyword = document.getElementById('pendingSearchInput')?.value.trim() || '';
        const cryptoFilter = document.getElementById('pendingCryptoSelect')?.querySelector('.custom-select-hidden')?.value || '';
        const minAmount = parseFloat(document.getElementById('pendingMinAmount')?.value) || 0;
        const maxAmount = parseFloat(document.getElementById('pendingMaxAmount')?.value) || Infinity;
        
        if (keyword) {
            query = query.or(`uid.ilike.%${keyword}%,username.ilike.%${keyword}%,wallet_address.ilike.%${keyword}%`);
        }
        
        const { data: wd, error } = await query;
        
        if (error) throw error;
        
        // 前端过滤（crypto, amount）
        let filtered = wd || [];
        if (cryptoFilter) {
            filtered = filtered.filter(w => (w.currency || w.withdrawal_address_type || 'USDT').toUpperCase() === cryptoFilter.toUpperCase());
        }
        if (minAmount > 0) {
            filtered = filtered.filter(w => (w.amount || 0) >= minAmount);
        }
        if (maxAmount < Infinity) {
            filtered = filtered.filter(w => (w.amount || 0) <= maxAmount);
        }
        
        // 更新统计卡片
        const totalAmount = filtered.reduce((sum, w) => sum + (w.amount || 0), 0);
        document.getElementById('statTotalWithdraw').innerHTML = '€' + totalAmount.toFixed(2);
        document.getElementById('statPendingWithdraw').innerHTML = '€' + totalAmount.toFixed(2);
        document.getElementById('statApprovedWithdraw').innerHTML = '€0.00';
        document.getElementById('statRejectedWithdraw').innerHTML = '€0.00';
        
        if (!filtered || filtered.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" style="text-align:center; padding:30px; color:#6a7a9a;">No pending withdrawals</td></tr>';
            return;
        }
        
        tbody.innerHTML = '';
        for (let w of filtered) {
            const row = tbody.insertRow();
            const currency = w.currency || w.withdrawal_address_type || 'USDT';
            const currencyClass = currency.toLowerCase();
            
            // 获取用户国家
            let countryName = 'Unknown';
            let flagUrl = null;
            try {
                const { data: userData } = await sb.from('users').select('country').eq('uid', w.uid).single();
                if (userData) {
                    countryName = userData.country || 'Unknown';
                    flagUrl = getCountryFlag(countryName);
                }
            } catch (e) { /* ignore */ }
            
            row.insertCell(0).innerHTML = `<span class="badge" style="background: rgba(255,255,255,0.08); padding: 2px 12px; border-radius: 20px; font-size: 11px; color: #c8d2e8; border: 1px solid rgba(255,255,255,0.06);">${escapeHtml(w.uid)}</span>`;
            row.insertCell(1).innerText = w.username || w.uid;
            row.insertCell(2).innerHTML = `<span style="color: #d4c09a; font-weight: 600;">€${(w.amount || 0).toFixed(2)}</span>`;
            row.insertCell(3).innerHTML = `<span class="currency-badge ${currencyClass}">${escapeHtml(currency)}</span>`;
            
            // 钱包地址 - 完整显示 + 复制按钮
            const address = w.wallet_address || '-';
            const addressCell = row.insertCell(4);
            addressCell.className = 'wallet-address-cell';
            addressCell.innerHTML = `
                <div class="wallet-address-wrapper">
                    <span class="wallet-address-text">${escapeHtml(address)}</span>
                    ${address !== '-' ? `<button class="copy-address-btn" data-address="${escapeHtml(address)}"><i class="fas fa-copy"></i></button>` : ''}
                </div>
            `;
            
            // User IP with country flag
            const ipCell = row.insertCell(5);
            if (flagUrl && countryName !== 'Unknown') {
                ipCell.innerHTML = `<img src="${flagUrl}" class="country-flag-img" onerror="this.style.display='none'" alt=""> <span class="country-name">${escapeHtml(countryName)}</span>`;
            } else {
                ipCell.innerHTML = `<span style="font-size: 12px; color: #6a7a9a;">${escapeHtml(w.user_ip || '-')}</span>`;
            }
            
            row.insertCell(6).innerText = w.request_date ? new Date(w.request_date).toLocaleString() : '-';
            row.insertCell(7).innerHTML = `
                <button class="btn-sm-action btn-approve approve-withdraw" data-id="${w.id}" data-uid="${w.uid}" data-amt="${w.amount}"><i class="fas fa-check"></i> Approve</button>
                <button class="btn-sm-action btn-reject reject-withdraw" data-id="${w.id}" data-uid="${w.uid}" data-amt="${w.amount}"><i class="fas fa-times"></i> Reject</button>
            `;
        }
        
        // 绑定复制按钮
        document.querySelectorAll('#withdrawalsTableBody .copy-address-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                copyToClipboard(btn.dataset.address);
            });
        });
        
        // 绑定批准/拒绝
        document.querySelectorAll('.approve-withdraw').forEach(btn => {
            btn.addEventListener('click', () => handleApproveWithdraw(btn.dataset.id, btn.dataset.uid, btn.dataset.amt));
        });
        document.querySelectorAll('.reject-withdraw').forEach(btn => {
            btn.addEventListener('click', () => handleRejectWithdraw(btn.dataset.id, btn.dataset.uid, btn.dataset.amt));
        });
        
    } catch (e) {
        console.error('加载提现失败:', e);
        tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; padding:30px; color:#ff8888;">加载失败: ${escapeHtml(e.message)}</td></tr>`;
    }
}

// ========== 加载提现历史 ==========
async function loadWithdrawalHistory() {
    const tbody = document.getElementById('withdrawalHistoryBody');
    if (!tbody) return;
    
    try {
        let query = sb
            .from('withdrawals')
            .select('*')
            .in('status', ['approved', 'rejected'])
            .order('processed_at', { ascending: false })
            .limit(200);
        
        const keyword = document.getElementById('historySearchInput')?.value.trim() || '';
        const cryptoFilter = document.getElementById('historyCryptoSelect')?.querySelector('.custom-select-hidden')?.value || '';
        const minAmount = parseFloat(document.getElementById('historyMinAmount')?.value) || 0;
        const maxAmount = parseFloat(document.getElementById('historyMaxAmount')?.value) || Infinity;
        
        if (keyword) {
            query = query.or(`uid.ilike.%${keyword}%,username.ilike.%${keyword}%,wallet_address.ilike.%${keyword}%`);
        }
        
        const { data: history, error } = await query;
        
        if (error) throw error;
        
        // 前端过滤
        let filtered = history || [];
        if (cryptoFilter) {
            filtered = filtered.filter(w => (w.currency || w.withdrawal_address_type || 'USDT').toUpperCase() === cryptoFilter.toUpperCase());
        }
        if (minAmount > 0) {
            filtered = filtered.filter(w => (w.amount || 0) >= minAmount);
        }
        if (maxAmount < Infinity) {
            filtered = filtered.filter(w => (w.amount || 0) <= maxAmount);
        }
        
        // 更新历史统计卡片
        const total = filtered.reduce((sum, w) => sum + (w.amount || 0), 0);
        const pending = filtered.filter(w => w.status === 'pending').reduce((sum, w) => sum + (w.amount || 0), 0);
        const approved = filtered.filter(w => w.status === 'approved').reduce((sum, w) => sum + (w.amount || 0), 0);
        const rejected = filtered.filter(w => w.status === 'rejected').reduce((sum, w) => sum + (w.amount || 0), 0);
        
        document.getElementById('historyStatTotal').innerHTML = '€' + total.toFixed(2);
        document.getElementById('historyStatPending').innerHTML = '€' + pending.toFixed(2);
        document.getElementById('historyStatApproved').innerHTML = '€' + approved.toFixed(2);
        document.getElementById('historyStatRejected').innerHTML = '€' + rejected.toFixed(2);
        
        if (!filtered || filtered.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" style="text-align:center; padding:30px; color:#6a7a9a;">No withdrawal records</td></tr>';
            return;
        }
        
        tbody.innerHTML = '';
        for (let w of filtered) {
            const row = tbody.insertRow();
            const currency = w.currency || w.withdrawal_address_type || 'USDT';
            const currencyClass = currency.toLowerCase();
            
            // 获取用户国家
            let countryName = 'Unknown';
            let flagUrl = null;
            try {
                const { data: userData } = await sb.from('users').select('country').eq('uid', w.uid).single();
                if (userData) {
                    countryName = userData.country || 'Unknown';
                    flagUrl = getCountryFlag(countryName);
                }
            } catch (e) { /* ignore */ }
            
            row.insertCell(0).innerHTML = `<span class="badge" style="background: rgba(255,255,255,0.08); padding: 2px 12px; border-radius: 20px; font-size: 11px; color: #c8d2e8; border: 1px solid rgba(255,255,255,0.06);">${escapeHtml(w.uid)}</span>`;
            row.insertCell(1).innerText = w.username || w.uid;
            row.insertCell(2).innerHTML = `<span style="color: ${w.status === 'approved' ? '#7ad0b0' : '#e88080'}; font-weight: 600;">€${(w.amount || 0).toFixed(2)}</span>`;
            row.insertCell(3).innerHTML = `<span class="currency-badge ${currencyClass}">${escapeHtml(currency)}</span>`;
            
            const address = w.wallet_address || '-';
            const addressCell = row.insertCell(4);
            addressCell.className = 'wallet-address-cell';
            addressCell.innerHTML = `
                <div class="wallet-address-wrapper">
                    <span class="wallet-address-text">${escapeHtml(address)}</span>
                    ${address !== '-' ? `<button class="copy-address-btn" data-address="${escapeHtml(address)}"><i class="fas fa-copy"></i></button>` : ''}
                </div>
            `;
            
            const ipCell = row.insertCell(5);
            if (flagUrl && countryName !== 'Unknown') {
                ipCell.innerHTML = `<img src="${flagUrl}" class="country-flag-img" onerror="this.style.display='none'" alt=""> <span class="country-name">${escapeHtml(countryName)}</span>`;
            } else {
                ipCell.innerHTML = `<span style="font-size: 12px; color: #6a7a9a;">${escapeHtml(w.user_ip || '-')}</span>`;
            }
            
            row.insertCell(6).innerText = w.request_date ? new Date(w.request_date).toLocaleString() : '-';
            row.insertCell(7).innerHTML = `<span class="status-badge-${w.status}">${w.status === 'approved' ? '✅ Approved' : '❌ Rejected'}</span>`;
        }
        
        // 绑定复制按钮
        document.querySelectorAll('#withdrawalHistoryBody .copy-address-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                copyToClipboard(btn.dataset.address);
            });
        });
        
    } catch (e) {
        console.error('加载历史记录失败:', e);
        tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; padding:30px; color:#ff8888;">加载失败: ${escapeHtml(e.message)}</td></tr>`;
    }
}

// ========== 复制功能 ==========
function copyToClipboard(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(() => {
            showToast('Address copied!', 'success');
        }).catch(() => {
            fallbackCopy(text);
        });
    } else {
        fallbackCopy(text);
    }
}

function fallbackCopy(text) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.left = '-9999px';
    textarea.style.top = '-9999px';
    document.body.appendChild(textarea);
    textarea.select();
    try {
        document.execCommand('copy');
        showToast('Address copied!', 'success');
    } catch (e) {
        showToast('Copy failed, please copy manually', 'error');
    }
    textarea.remove();
}

// ========== 批准提现 ==========
async function handleApproveWithdraw(id, uid, amount) {
    showConfirm('Approve Withdrawal', `Confirm to approve withdrawal of €${parseFloat(amount).toFixed(2)} for user ${uid}?`, async () => {
        try {
            const { error } = await sb
                .from('withdrawals')
                .update({ 
                    status: 'approved',
                    processed_at: new Date().toISOString()
                })
                .eq('id', parseInt(id));
            
            if (error) throw error;
            
            await refreshWithdrawData();
            if (window.loadDashboardPage) window.loadDashboardPage(currentDays);
            showToast('✅ Withdrawal approved', 'success');
        } catch (e) {
            showToast('Approval failed: ' + e.message, 'error');
        }
    });
}

// ========== 拒绝提现 ==========
async function handleRejectWithdraw(id, uid, amount) {
    showConfirm('Reject Withdrawal', `Confirm to reject withdrawal of €${parseFloat(amount).toFixed(2)} for user ${uid}? Amount will be returned.`, async () => {
        try {
            const { data: user, error: userError } = await sb
                .from('users')
                .select('balance')
                .eq('uid', uid)
                .single();
            
            if (userError) throw userError;
            
            const { error: balanceError } = await sb
                .from('users')
                .update({ balance: (user.balance || 0) + parseFloat(amount) })
                .eq('uid', uid);
            
            if (balanceError) throw balanceError;
            
            const { error } = await sb
                .from('withdrawals')
                .update({ 
                    status: 'rejected',
                    processed_at: new Date().toISOString()
                })
                .eq('id', parseInt(id));
            
            if (error) throw error;
            
            await refreshWithdrawData();
            if (window.loadDashboardPage) window.loadDashboardPage(currentDays);
            showToast('❌ Withdrawal rejected, amount returned', 'success');
        } catch (e) {
            showToast('Rejection failed: ' + e.message, 'error');
        }
    });
}

// ========== 清空历史记录 ==========
async function clearWithdrawalHistory() {
    showConfirm('⚠️ Clear Records', 'Are you sure you want to delete all withdrawal history? This cannot be undone!', async () => {
        try {
            const { error } = await sb
                .from('withdrawals')
                .delete()
                .in('status', ['approved', 'rejected']);
            
            if (error) throw error;
            
            showToast('All withdrawal records cleared', 'success');
            loadWithdrawalHistory();
        } catch (e) {
            showToast('Clear failed: ' + e.message, 'error');
        }
    });
}

// ========== 工具函数 ==========
function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

window.loadWithdrawalsPage = loadWithdrawalsPage;