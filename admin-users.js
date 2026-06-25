// admin-users.js - 完整版（表格重构：Actions移到第一列，VIP改标题，国家缩写+国旗，REG/DATE）
let searchKeyword = '';

// ========== 国家数据映射（缩写 + 国旗代码） ==========
function getCountryData(countryName) {
    const countryMap = {
        'Germany': { abbr: 'DE', flag: 'de' },
        'United States': { abbr: 'US', flag: 'us' },
        'United Kingdom': { abbr: 'GB', flag: 'gb' },
        'Italy': { abbr: 'IT', flag: 'it' },
        'China': { abbr: 'CN', flag: 'cn' },
        'France': { abbr: 'FR', flag: 'fr' },
        'Spain': { abbr: 'ES', flag: 'es' },
        'Switzerland': { abbr: 'CH', flag: 'ch' },
        'Austria': { abbr: 'AT', flag: 'at' },
        'Netherlands': { abbr: 'NL', flag: 'nl' },
        'Belgium': { abbr: 'BE', flag: 'be' },
        'Denmark': { abbr: 'DK', flag: 'dk' },
        'Sweden': { abbr: 'SE', flag: 'se' },
        'Norway': { abbr: 'NO', flag: 'no' },
        'Finland': { abbr: 'FI', flag: 'fi' },
        'Portugal': { abbr: 'PT', flag: 'pt' },
        'Greece': { abbr: 'GR', flag: 'gr' },
        'Turkey': { abbr: 'TR', flag: 'tr' },
        'Russia': { abbr: 'RU', flag: 'ru' },
        'Japan': { abbr: 'JP', flag: 'jp' },
        'South Korea': { abbr: 'KR', flag: 'kr' },
        'India': { abbr: 'IN', flag: 'in' },
        'Brazil': { abbr: 'BR', flag: 'br' },
        'Mexico': { abbr: 'MX', flag: 'mx' },
        'Australia': { abbr: 'AU', flag: 'au' },
        'New Zealand': { abbr: 'NZ', flag: 'nz' },
        'South Africa': { abbr: 'ZA', flag: 'za' },
        'UAE': { abbr: 'AE', flag: 'ae' },
        'Saudi Arabia': { abbr: 'SA', flag: 'sa' },
        'Singapore': { abbr: 'SG', flag: 'sg' },
        'Malaysia': { abbr: 'MY', flag: 'my' },
        'Philippines': { abbr: 'PH', flag: 'ph' },
        'Indonesia': { abbr: 'ID', flag: 'id' },
        'Thailand': { abbr: 'TH', flag: 'th' },
        'Vietnam': { abbr: 'VN', flag: 'vn' },
        'Taiwan': { abbr: 'TW', flag: 'tw' },
        'Hong Kong': { abbr: 'HK', flag: 'hk' },
        'Macau': { abbr: 'MO', flag: 'mo' },
        'Ireland': { abbr: 'IE', flag: 'ie' },
        'Poland': { abbr: 'PL', flag: 'pl' },
        'Czech Republic': { abbr: 'CZ', flag: 'cz' },
        'Hungary': { abbr: 'HU', flag: 'hu' },
        'Croatia': { abbr: 'HR', flag: 'hr' },
        'Malta': { abbr: 'MT', flag: 'mt' },
        'Cyprus': { abbr: 'CY', flag: 'cy' },
        'Estonia': { abbr: 'EE', flag: 'ee' },
        'Latvia': { abbr: 'LV', flag: 'lv' },
        'Lithuania': { abbr: 'LT', flag: 'lt' },
        'Moldova': { abbr: 'MD', flag: 'md' },
        'Monaco': { abbr: 'MC', flag: 'mc' },
        'Liechtenstein': { abbr: 'LI', flag: 'li' },
        'Greenland': { abbr: 'GL', flag: 'gl' },
        'Faroe Islands': { abbr: 'FO', flag: 'fo' },
        'Iceland': { abbr: 'IS', flag: 'is' },
        'Luxembourg': { abbr: 'LU', flag: 'lu' },
        'Andorra': { abbr: 'AD', flag: 'ad' },
        'Gibraltar': { abbr: 'GI', flag: 'gi' },
        'Canada': { abbr: 'CA', flag: 'ca' },
        'Argentina': { abbr: 'AR', flag: 'ar' },
        'Chile': { abbr: 'CL', flag: 'cl' },
        'Colombia': { abbr: 'CO', flag: 'co' },
        'Peru': { abbr: 'PE', flag: 'pe' },
        'Venezuela': { abbr: 'VE', flag: 've' },
        'Egypt': { abbr: 'EG', flag: 'eg' },
        'Nigeria': { abbr: 'NG', flag: 'ng' },
        'Kenya': { abbr: 'KE', flag: 'ke' },
        'Israel': { abbr: 'IL', flag: 'il' },
        'Pakistan': { abbr: 'PK', flag: 'pk' },
        'Bangladesh': { abbr: 'BD', flag: 'bd' },
        'Sri Lanka': { abbr: 'LK', flag: 'lk' },
        'Nepal': { abbr: 'NP', flag: 'np' },
        'Afghanistan': { abbr: 'AF', flag: 'af' },
        'Iraq': { abbr: 'IQ', flag: 'iq' },
        'Iran': { abbr: 'IR', flag: 'ir' },
        'Kuwait': { abbr: 'KW', flag: 'kw' },
        'Qatar': { abbr: 'QA', flag: 'qa' },
        'Oman': { abbr: 'OM', flag: 'om' },
        'Bahrain': { abbr: 'BH', flag: 'bh' },
        'Lebanon': { abbr: 'LB', flag: 'lb' },
        'Jordan': { abbr: 'JO', flag: 'jo' },
        'Palestine': { abbr: 'PS', flag: 'ps' },
        'Syria': { abbr: 'SY', flag: 'sy' },
        'Yemen': { abbr: 'YE', flag: 'ye' },
        'Libya': { abbr: 'LY', flag: 'ly' },
        'Sudan': { abbr: 'SD', flag: 'sd' },
        'Morocco': { abbr: 'MA', flag: 'ma' },
        'Tunisia': { abbr: 'TN', flag: 'tn' },
        'Algeria': { abbr: 'DZ', flag: 'dz' },
        'Ukraine': { abbr: 'UA', flag: 'ua' },
        'Belarus': { abbr: 'BY', flag: 'by' },
        'Georgia': { abbr: 'GE', flag: 'ge' },
        'Armenia': { abbr: 'AM', flag: 'am' },
        'Azerbaijan': { abbr: 'AZ', flag: 'az' },
        'Kazakhstan': { abbr: 'KZ', flag: 'kz' },
        'Uzbekistan': { abbr: 'UZ', flag: 'uz' },
        'Turkmenistan': { abbr: 'TM', flag: 'tm' },
        'Kyrgyzstan': { abbr: 'KG', flag: 'kg' },
        'Tajikistan': { abbr: 'TJ', flag: 'tj' },
        'Mongolia': { abbr: 'MN', flag: 'mn' },
        'Cambodia': { abbr: 'KH', flag: 'kh' },
        'Laos': { abbr: 'LA', flag: 'la' },
        'Myanmar': { abbr: 'MM', flag: 'mm' },
        'Brunei': { abbr: 'BN', flag: 'bn' },
        'East Timor': { abbr: 'TL', flag: 'tl' },
        'Papua New Guinea': { abbr: 'PG', flag: 'pg' },
        'Fiji': { abbr: 'FJ', flag: 'fj' },
        'Solomon Islands': { abbr: 'SB', flag: 'sb' },
        'Vanuatu': { abbr: 'VU', flag: 'vu' },
        'Samoa': { abbr: 'WS', flag: 'ws' },
        'Tonga': { abbr: 'TO', flag: 'to' }
    };
    
    const data = countryMap[countryName];
    if (data) return data;
    
    // 如果找不到，使用前两个字母作为 fallback
    const fallback = countryName && countryName.length >= 2 ? countryName.substring(0, 2).toUpperCase() : '--';
    return { abbr: fallback, flag: null };
}

// 快捷函数：获取缩写
function getCountryAbbreviation(countryName) {
    return getCountryData(countryName).abbr;
}

// 快捷函数：获取国旗URL
function getCountryFlagUrl(countryName) {
    const data = getCountryData(countryName);
    return data.flag ? `https://flagcdn.com/w40/${data.flag}.png` : null;
}

async function loadUsersPage() {
    const container = document.getElementById('page_users');
    if (!container) return;
    container.innerHTML = `
        <div class="card">
            <div class="search-bar">
                <input type="text" id="searchUserInput" class="search-input" placeholder="🔍 Search UID / Username / Phone Number">
                <button id="searchUserBtn" class="btn-primary"><i class="fas fa-search"></i> Search</button>
                <button id="refreshUserBtn" class="btn-primary"><i class="fas fa-sync-alt"></i> Refresh</button>
                <button id="addUserBtn" class="success"><i class="fas fa-user-plus"></i> Create User</button>
            </div>
            <div class="table-container" style="max-height: 600px; overflow-y: auto;">
                <table class="data-table" style="font-size: 12px;">
                    <thead>
                        <tr>
                            <th style="min-width: 90px;">Actions</th>
                            <th style="min-width: 80px;">Phone</th>
                            <th style="min-width: 70px;">User ID</th>
                            <th style="min-width: 80px;">Referrer</th>
                            <th style="min-width: 60px;">Country</th>
                            <th style="min-width: 65px;">VIP RANK</th>
                            <th style="min-width: 70px;">Pending (€)</th>
                            <th style="min-width: 75px;">Balance (€)</th>
                            <th style="min-width: 200px;">Round / Orders</th>
                            <th style="min-width: 90px;">Registered IP</th>
                            <th style="min-width: 70px;">Last Online</th>
                        </tr>
                    </thead>
                    <tbody id="usersTableBody"></tbody>
                </table>
            </div>
            <div class="pagination" id="userPagination"></div>
        </div>
    `;
    
    const style = document.createElement('style');
    style.textContent = `
        /* ===== 高级暗色面板样式（与Withdrawal页面一致） ===== */
        .card {
            background: rgba(12, 16, 28, 0.6) !important;
            backdrop-filter: blur(16px) saturate(1.4) !important;
            -webkit-backdrop-filter: blur(16px) saturate(1.4) !important;
            border: 1px solid rgba(255,255,255,0.04) !important;
            border-radius: 20px !important;
            padding: 22px 24px !important;
            box-shadow: 0 4px 20px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.03) !important;
        }
        
        .search-bar input.search-input {
            background: rgba(255,255,255,0.06) !important;
            border: 1px solid rgba(255,255,255,0.06) !important;
            border-radius: 40px !important;
            padding: 8px 18px !important;
            color: #e6edf5 !important;
            font-size: 13px !important;
        }
        .search-bar input.search-input:focus {
            border-color: rgba(200,176,144,0.2) !important;
            background: rgba(255,255,255,0.08) !important;
        }
        .search-bar input.search-input::placeholder {
            color: rgba(255,255,255,0.15) !important;
        }

        .btn-primary {
            background: rgba(200,176,144,0.06) !important;
            border: 1px solid rgba(200,176,144,0.08) !important;
            border-radius: 40px !important;
            padding: 8px 20px !important;
            color: #c8b090 !important;
            font-weight: 600 !important;
            font-size: 13px !important;
            transition: all 0.3s !important;
        }
        .btn-primary:hover {
            background: rgba(200,176,144,0.1) !important;
            transform: translateY(-1px) !important;
        }
        button.success {
            background: rgba(74,222,128,0.06) !important;
            border: 1px solid rgba(74,222,128,0.08) !important;
            color: #7ad0b0 !important;
            padding: 8px 20px !important;
            border-radius: 40px !important;
            font-weight: 600 !important;
            font-size: 13px !important;
            transition: all 0.3s !important;
        }
        button.success:hover {
            background: rgba(74,222,128,0.1) !important;
        }

        .data-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 12px;
        }
        .data-table th {
            color: rgba(255,255,255,0.25) !important;
            font-weight: 600 !important;
            font-size: 10px !important;
            text-transform: uppercase !important;
            letter-spacing: 0.8px !important;
            padding: 10px 10px !important;
            border-bottom: 1px solid rgba(255,255,255,0.04) !important;
            background: rgba(10,14,28,0.3) !important;
        }
        .data-table td {
            padding: 8px 10px !important;
            border-bottom: 1px solid rgba(255,255,255,0.03) !important;
            color: rgba(255,255,255,0.7) !important;
            font-size: 12px !important;
            vertical-align: middle !important;
        }
        .data-table tr:hover td {
            background: rgba(200,176,144,0.03) !important;
        }

/* ===== 列宽定义 - 精确调整版 ===== */
.data-table th:nth-child(1),
.data-table td:nth-child(1) { width: 85px !important; min-width: 85px !important; } /* Actions */

.data-table th:nth-child(2),
.data-table td:nth-child(2) { width: 90px !important; min-width: 90px !important; } /* Phone - 拉长 */

.data-table th:nth-child(3),
.data-table td:nth-child(3) { width: 80px !important; min-width: 80px !important; } /* User ID + Position - 稍微缩小 */

.data-table th:nth-child(4),
.data-table td:nth-child(4) { width: 70px !important; min-width: 70px !important; } /* Referrer - 从50px改为70px，拉长 */

.data-table th:nth-child(5),
.data-table td:nth-child(5) { width: 55px !important; min-width: 55px !important; } /* Country */

.data-table th:nth-child(6),
.data-table td:nth-child(6) { width: 85px !important; min-width: 85px !important; } /* VIP RANK - 从82px改为85px，拉长 */

/* 在列宽定义中修改第7列 */
.data-table th:nth-child(7),
.data-table td:nth-child(7) { width: 95px !important; min-width: 95px !important; } /* Pending - 从85px改为95px */

/* 在列宽定义中修改第8列 */
.data-table th:nth-child(8),
.data-table td:nth-child(8) { width: 135px !important; min-width: 135px !important; } /* Balance - 从115px改为135px */

.data-table th:nth-child(9),
.data-table td:nth-child(9) { width: 260px !important; min-width: 260px !important; } /* Round / Orders - 稍微缩小，给Balance腾空间 */

.data-table th:nth-child(10),
.data-table td:nth-child(10) { width: 100px !important; min-width: 100px !important; } /* Registered IP - 加宽，填补缝隙 */

.data-table th:nth-child(11),
.data-table td:nth-child(11) { width: 85px !important; min-width: 85px !important; } /* Last Online */

        /* ===== Actions 列 ===== */
        .actions-wrapper {
            display: flex;
            align-items: center;
            gap: 0 !important;
            flex-wrap: nowrap;
        }
        .btn-actions {
            background: rgba(200,176,144,0.06) !important;
            border: 1px solid rgba(200,176,144,0.08) !important;
            border-radius: 30px !important;
            padding: 4px 14px !important;
            color: #c8b090 !important;
            font-size: 10px !important;
            font-weight: 600 !important;
            cursor: pointer !important;
            transition: all 0.2s !important;
            white-space: nowrap !important;
            font-family: 'Inter', sans-serif !important;
            letter-spacing: 0.5px !important;
        }
        .btn-actions:hover {
            background: rgba(200,176,144,0.12) !important;
            transform: translateX(2px) !important;
        }

        /* ===== Phone 细字 - 调亮 ===== */
.phone-text {
    font-size: 11px !important;
    font-weight: 400 !important;
    color: rgba(255,255,255,0.65) !important;  /* 从0.5 -> 0.65 */
}

/* ===== User ID 细字 - 调亮 ===== */
.uid-text {
    font-size: 11px !important;
    font-weight: 400 !important;
    color: rgba(255,255,255,0.55) !important;  /* 从0.4 -> 0.55 */
    font-family: monospace !important;
}

/* ===== Referrer 细字 - 调亮 ===== */
.referrer-text {
    font-size: 12px !important;
    font-weight: 400 !important;
    color: rgba(255,255,255,0.50) !important;  /* 从0.35 -> 0.50 */
}

/* ===== Country - 国旗变小 ===== */
.country-flag-sm {
    width: 16px !important;
    height: 12px !important;
    border-radius: 2px;
    object-fit: cover;
    vertical-align: middle;
    border: 1px solid rgba(255,255,255,0.04);
    margin-right: 3px;
    flex-shrink: 0;
}
.country-name-text {
    font-size: 11px;
    font-weight: 500;
    color: rgba(255,255,255,0.65);
    letter-spacing: 0.3px;
    vertical-align: middle;
}

/* ===== Last Online - 字体亮一些 ===== */
.last-online-text {
    font-size: 11px !important;
    font-weight: 400 !important;
    color: rgba(255,255,255,0.55) !important;  /* 从0.40 -> 0.55 */
}

/* ===== Registered IP - 调亮 ===== */
.ip-text {
    font-size: 11px !important;
    font-weight: 400 !important;
    color: rgba(255,255,255,0.45) !important;  /* 从0.25 -> 0.45 */
    font-family: monospace !important;
}

/* ===== 表头 - 调亮 ===== */
.data-table th {
    color: rgba(255,255,255,0.45) !important;  /* 从0.25 -> 0.45 */
    font-weight: 600 !important;
    font-size: 10px !important;
    text-transform: uppercase !important;
    letter-spacing: 0.8px !important;
    padding: 10px 10px !important;
    border-bottom: 1px solid rgba(255,255,255,0.04) !important;
    background: rgba(10,14,28,0.3) !important;
}

/* ===== 表格数据 - 调亮 ===== */
.data-table td {
    padding: 8px 10px !important;
    border-bottom: 1px solid rgba(255,255,255,0.03) !important;
    color: rgba(255,255,255,0.80) !important;  /* 从0.7 -> 0.80 */
    font-size: 12px !important;
    vertical-align: middle !important;
}

        /* ===== VIP 下拉框 - 无动画版 ===== */
.vip-wrapper {
    position: relative;
    display: inline-block;
    width: 85px;
}

.vip-select {
    width: 85px !important;
    min-width: 85px !important;
    max-width: 85px !important;
    height: 24px !important;
    padding: 0 16px 0 22px !important;
    border-radius: 14px !important;
    border: 1px solid rgba(200, 176, 144, 0.2) !important;
    background: rgba(255, 255, 255, 0.03) !important;
    color: #e6edf5 !important;
    font-size: 10px !important;
    font-weight: 600 !important;
    cursor: pointer !important;
    appearance: none !important;
    -webkit-appearance: none !important;
    font-family: 'Inter', sans-serif !important;
    text-align: center !important;
    text-overflow: clip !important;
    white-space: nowrap !important;
    letter-spacing: 0.2px !important;
    line-height: 24px !important;
    box-sizing: border-box !important;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='8' height='5'%3E%3Cpath d='M0 0l4 5 4-5z' fill='rgba(200,176,144,0.4)'/%3E%3C/svg%3E") !important;
    background-repeat: no-repeat !important;
    background-position: right 8px center !important;
    background-size: 8px 5px !important;
    /* 删除 transition */
}

/* 删除 :hover 动画效果 */
.vip-select:hover {
    border-color: rgba(200, 176, 144, 0.4) !important;
    background: rgba(255, 255, 255, 0.08) !important;
    /* 删除了 transform 和 box-shadow */
}

.vip-select:focus {
    outline: none !important;
    border-color: rgba(200, 176, 144, 0.5) !important;
}

/* ===== Round/Orders 列 - 字体亮一些 ===== */
.orders-wrapper {
    display: flex;
    align-items: center;
    gap: 4px !important;
    flex-wrap: nowrap;
}
.orders-wrapper .btn-sm {
    font-size: 9px !important;
    padding: 3px 8px !important;
    white-space: nowrap !important;
    flex-shrink: 0 !important;
    border: none !important;
    border-radius: 4px !important;
    cursor: pointer !important;
    transition: 0.2s !important;
}
.orders-wrapper .btn-sm i {
    margin-right: 3px;
}
.btn-reset {
    background: rgba(200,176,144,0.08) !important;
    color: #c8b090 !important;
}
.btn-save-orders {
    background: rgba(74,222,128,0.08) !important;
    color: #7ad0b0 !important;
}
.orders-wrapper .orders-input {
    width: 42px !important;
    flex-shrink: 0 !important;
    background: rgba(255,255,255,0.04) !important;
    border: 1px solid rgba(255,255,255,0.04) !important;
    border-radius: 4px !important;
    padding: 2px 4px !important;
    color: rgba(255,255,255,0.75) !important;  /* 从0.6 -> 0.75 */
    font-size: 11px !important;
    text-align: center !important;
}
.orders-wrapper .round-number {
    font-size: 11px !important;
    color: rgba(255,255,255,0.45) !important;  /* 从0.2 -> 0.45 */
    min-width: 28px !important;
    flex-shrink: 0 !important;
    font-weight: 500 !important;
}
.orders-wrapper .orders-slash {
    font-size: 10px !important;
    color: rgba(255,255,255,0.35) !important;  /* 从0.12 -> 0.35 */
    flex-shrink: 0 !important;
}

        /* ===== Pending ===== */
        .pending-negative { color: #e88080 !important; }
        .pending-positive { color: #c8b090 !important; }
        .pending-amount {
            font-weight: 700 !important;
            font-size: 13px !important;
        }

        /* ===== Balance - + - 按钮在左侧 ===== */
.balance-amount {
    font-weight: 700 !important;
    font-size: 14px !important;
    color: #7ad0b0 !important;
}
.balance-wrapper {
    display: flex;
    align-items: center;
    gap: 3px !important;
    flex-wrap: nowrap;
}
.balance-wrapper .btn-sm {
    font-size: 9px !important;
    padding: 2px 6px !important;
    white-space: nowrap !important;
    flex-shrink: 0 !important;
    border: none !important;
    border-radius: 4px !important;
    cursor: pointer !important;
    transition: 0.2s !important;
    font-weight: 600 !important;
    min-width: 18px !important;
    text-align: center !important;
    font-family: 'Inter', sans-serif !important;
}
.balance-wrapper .btn-sm:hover {
    opacity: 0.75 !important;
}
.balance-wrapper .btn-deposit {
    background: rgba(74,222,128,0.12) !important;
    color: #4ade80 !important;
}
.balance-wrapper .btn-deduct {
    background: rgba(232,128,128,0.12) !important;
    color: #e88080 !important;
    margin-right: 4px !important;
}

        /* ===== Last Online - 调亮 ===== */
.last-online-text {
    font-size: 11px !important;
    font-weight: 400 !important;
    color: rgba(255, 255, 255, 0.70) !important;  /* 从0.40 -> 0.55 -> 0.70 */
}

        /* ===== Registered IP - 字体亮一些 ===== */
.ip-text {
    font-size: 11px !important;
    font-weight: 400 !important;
    color: rgba(255,255,255,0.60) !important;  /* 从0.45 -> 0.60 */
    font-family: monospace !important;
}

        /* ===== Position ===== */
        .position-text {
            font-size: 11px !important;
            font-weight: 600 !important;
        }

        .badge {
            background: rgba(255,255,255,0.03) !important;
            padding: 2px 8px !important;
            border-radius: 20px !important;
            font-size: 10px !important;
            color: rgba(255,255,255,0.15) !important;
            border: 1px solid rgba(255,255,255,0.02) !important;
        }

        .table-container::-webkit-scrollbar { width: 3px; height: 3px; }
        .table-container::-webkit-scrollbar-thumb { background: rgba(200,176,144,0.06); border-radius: 4px; }
        .table-container::-webkit-scrollbar-track { background: transparent; }

        @media (max-width: 1400px) {
    .table-container { overflow-x: auto; }
    .data-table { min-width: 1200px; }  /* 减小到 1200px */
}
    `;
    document.head.appendChild(style);
    
    window.userCurrentPage = 1;
    window.userPageSize = 30;
    window.userTotalCount = 0;
    
    await loadUsers();
    
    document.getElementById('searchUserBtn')?.addEventListener('click', () => { 
        searchKeyword = document.getElementById('searchUserInput').value.trim(); 
        window.userCurrentPage = 1;
        loadUsers(); 
    });
    document.getElementById('refreshUserBtn')?.addEventListener('click', () => { 
        document.getElementById('searchUserInput').value = ''; 
        searchKeyword = ''; 
        window.userCurrentPage = 1;
        loadUsers(); 
    });
    document.getElementById('addUserBtn')?.addEventListener('click', () => {
        document.getElementById('addUserModal').classList.add('active');
    });
    document.getElementById('searchUserInput')?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            searchKeyword = document.getElementById('searchUserInput').value.trim();
            window.userCurrentPage = 1;
            loadUsers();
        }
    });
}

// ========== 加载用户列表 ==========
async function loadUsers() {
    const tbody = document.getElementById('usersTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = '<tr><td colspan="11" style="text-align:center; padding:40px; color:rgba(255,255,255,0.2);"><i class="fas fa-spinner fa-spin"></i> Loading...</td></tr>';
    
    try {
        const { data: vipSettings } = await sb.from('vip_settings').select('*');
        const vipLimitMap = {};
        const vipNameMap = {};
        if (vipSettings) {
            vipSettings.forEach(v => {
                vipLimitMap[v.level] = v.orders_limit;
                vipNameMap[v.level] = v.rank_name || (v.level === 1 ? 'Normal' : v.level === 2 ? 'VIP' : 'SVIP');
            });
        }
        
        let query = sb.from('users').select('*', { count: 'exact' });
        
        if (searchKeyword) {
            query = query.or(`uid.ilike.%${searchKeyword}%,username.ilike.%${searchKeyword}%,phone.ilike.%${searchKeyword}%`);
        }
        
        const { data: users, error, count } = await query
            .order('created_at', { ascending: false })
            .range((window.userCurrentPage - 1) * window.userPageSize, window.userCurrentPage * window.userPageSize - 1);
        
        if (error) throw error;
        
        window.userTotalCount = count || 0;
        
        if (!users || users.length === 0) {
            tbody.innerHTML = '<tr><td colspan="11" style="text-align:center; padding:40px; color:rgba(255,255,255,0.15);">No users</td></tr>';
            renderUserPagination();
            return;
        }
        
        const uids = users.map(u => u.uid);
        const { data: allOrders } = await sb
            .from('order_history')
            .select('uid')
            .in('uid', uids);
        
        const orderCountMap = {};
        if (allOrders) {
            allOrders.forEach(o => {
                orderCountMap[o.uid] = (orderCountMap[o.uid] || 0) + 1;
            });
        }
        
        const { data: pendingWithdrawals } = await sb
            .from('withdrawals')
            .select('uid, amount')
            .in('uid', uids)
            .eq('status', 'pending');
        
        const pendingMap = {};
        if (pendingWithdrawals) {
            pendingWithdrawals.forEach(w => {
                pendingMap[w.uid] = (pendingMap[w.uid] || 0) + w.amount;
            });
        }

// ============================================================
// 获取用户待处理的触发订单金额 (pending 卡片的金额)
// ============================================================
const { data: pendingTriggerOrders } = await sb
    .from('user_trigger_orders')
    .select('uid, commission_amount, target_price, order_type')
    .in('uid', uids)
    .eq('status', 'pending');

const pendingTriggerMap = {};
if (pendingTriggerOrders) {
    pendingTriggerOrders.forEach(t => {
        // 如果是 card_reward，使用 target_price；其他使用 commission_amount
        const amount = t.order_type === 'card_reward' ? (t.target_price || 0) : (t.commission_amount || 0);
        pendingTriggerMap[t.uid] = (pendingTriggerMap[t.uid] || 0) + amount;
    });
}

// 获取所有用户的 amount_due 数据
const { data: amountDueUsers } = await sb
    .from('users')
    .select('uid, amount_due_round, amount_due_orders_count')
    .in('uid', uids);

const amountDueMap = {};
if (amountDueUsers) {
    amountDueUsers.forEach(u => {
        const totalAmountDue = (u.amount_due_round || 0) + (u.amount_due_orders_count || 0);
        if (totalAmountDue > 0) {
            amountDueMap[u.uid] = totalAmountDue;
        }
    });
}
        
        tbody.innerHTML = '';
        
        // ========== IP 重复检测 ==========
        const ipMap = {};
        const duplicateIps = [];
        for (const u of users) {
            if (u.registered_ip && u.registered_ip !== '') {
                if (ipMap[u.registered_ip]) {
                    if (!duplicateIps.includes(u.registered_ip)) {
                        duplicateIps.push(u.registered_ip);
                    }
                } else {
                    ipMap[u.registered_ip] = u.uid;
                }
            }
        }
        
        if (duplicateIps.length > 0) {
            const sortedIps = [...duplicateIps].sort();
            const currentKey = sortedIps.join('|');
            const ignoredKey = localStorage.getItem('duplicate_ip_ignored');
            
            if (ignoredKey !== currentKey) {
                let htmlMessage = '';
                for (const ip of duplicateIps) {
                    const usersWithIp = users.filter(u => u.registered_ip === ip);
                    const userList = usersWithIp.map(u => `${u.username} (UID: ${u.uid})`).join('<br>');
                    const displayIp = ip || 'Unknown';
                    htmlMessage += `📌 IP: ${displayIp}<br>${userList}<br><br>`;
                }
                htmlMessage += 'Please check abnormal users registration activity.';
                window._duplicateIpKey = currentKey;
                
                setTimeout(() => {
                    const plainText = htmlMessage.replace(/<br>/g, '\n');
                    showAmberNotification(
                        '⚠️ Multiple Registered IP Detected',
                        plainText,
                        'warning'
                    );
                    
                    setTimeout(() => {
                        const notifications = document.querySelectorAll('.notification-amber');
                        if (notifications.length > 0) {
                            const latestNotification = notifications[notifications.length - 1];
                            const messageDiv = latestNotification.querySelector('div[style*="flex: 1"]');
                            if (messageDiv) {
                                const messageTextEl = messageDiv.querySelector('div[style*="font-size: 12px"]');
                                if (messageTextEl) {
                                    messageTextEl.innerHTML = htmlMessage;
                                } else {
                                    const allDivs = messageDiv.querySelectorAll('div');
                                    if (allDivs.length >= 2) {
                                        allDivs[1].innerHTML = htmlMessage;
                                    }
                                }
                                
                                const btn = document.createElement('button');
                                btn.textContent = 'Don\'t show again';
                                btn.style.cssText = `
                                    background: rgba(255,255,255,0.1);
                                    border: 1px solid rgba(255,255,255,0.2);
                                    padding: 4px 14px;
                                    border-radius: 20px;
                                    color: #d4c8a0;
                                    cursor: pointer;
                                    font-size: 11px;
                                    margin-top: 8px;
                                    font-family: 'Inter', sans-serif;
                                    transition: 0.2s;
                                    display: block;
                                `;
                                btn.onmouseover = function() {
                                    this.style.background = 'rgba(255,255,255,0.2)';
                                };
                                btn.onmouseout = function() {
                                    this.style.background = 'rgba(255,255,255,0.1)';
                                };
                                btn.onclick = function(e) {
                                    e.stopPropagation();
                                    dismissDuplicateIpAlert();
                                };
                                messageDiv.appendChild(btn);
                            }
                        }
                    }, 300);
                }, 500);
            }
        }
        
        for (let u of users) {
    const row = tbody.insertRow();
    row.className = 'user-row';
    
    const orderCount = orderCountMap[u.uid] || 0;
    const ordersLimit = vipLimitMap[u.vip_level] || 30;
    const vipName = vipNameMap[u.vip_level] || (u.vip_level === 1 ? 'Normal' : u.vip_level === 2 ? 'VIP' : 'SVIP');
    const pendingAmount = pendingMap[u.uid] || 0;
    const creditScore = u.credit_score !== undefined && u.credit_score !== null ? u.credit_score : 100;
    const countryAbbr = getCountryAbbreviation(u.country);
    
    // ===== 1. Actions (索引 0) =====
const actionsCell = row.insertCell(0);
actionsCell.innerHTML = `
    <div class="actions-wrapper">
        <button class="btn-actions edit-user-btn" 
            data-uid="${u.uid}" 
            data-username="${escapeHtml(u.username)}"
            data-phone="${escapeHtml(u.phone || '')}"
            data-pin="${escapeHtml(u.pin || '')}"
            data-currency="${escapeHtml(u.withdrawal_address_type || 'USDT')}"
            data-address="${escapeHtml(u.withdrawal_address || '')}"
            data-credit-score="${creditScore}"
            data-user-role="${escapeHtml(u.user_role || 'User')}"
            data-withdrawal-frozen="${u.withdrawal_frozen || false}"
            data-is-banned="${u.is_banned || false}"
            data-created-at="${u.created_at || ''}"
            title="Edit User">
            <i class="fas fa-cog"></i> Actions
        </button>
    </div>
`;
    
    // ===== 2. Phone (索引 1) =====
    row.insertCell(1).innerHTML = `<span class="phone-text">${escapeHtml(u.phone || '-')}</span>`;
    
    // ===== 3. User ID + Position (索引 2) =====
    const userRole = u.user_role || 'User';
    const roleColor = userRole === 'Agent' ? '#c8b090' : 'rgba(255,255,255,0.25)';
    const roleDisplay = userRole === 'Agent' ? 'Agent' : 'User';
    row.insertCell(2).innerHTML = `
        <div style="display:flex; flex-direction:column; align-items:flex-start; gap:1px;">
            <span class="uid-text">${escapeHtml(u.uid)}</span>
            <span style="font-size:9px; font-weight:500; color:${roleColor}; background:rgba(255,255,255,0.03); padding:0px 6px; border-radius:8px; letter-spacing:0.3px;">${roleDisplay}</span>
        </div>
    `;
    
    // ===== 4. Referrer (索引 3) =====
    row.insertCell(3).innerHTML = `<span class="referrer-text">${escapeHtml(u.invited_by_username || '-')}</span>`;
    
    // ===== 5. Country (索引 4) - 国旗变小，和名称并排 =====
const countryCell = row.insertCell(4);
const countryData = getCountryData(u.country);
const flagUrl = countryData.flag ? `https://flagcdn.com/w40/${countryData.flag}.png` : null;
let countryHtml = '';
if (flagUrl) {
    countryHtml = `<img src="${flagUrl}" class="country-flag-sm" onerror="this.style.display='none'" alt="" style="width:16px; height:12px; border-radius:2px; object-fit:cover; vertical-align:middle; border:1px solid rgba(255,255,255,0.04); margin-right:3px;"> <span class="country-name-text" style="font-size:11px; font-weight:500; color:rgba(255,255,255,0.65); vertical-align:middle;">${countryData.abbr}</span>`;
} else {
    countryHtml = `<span class="country-name-text" style="font-size:11px; font-weight:500; color:rgba(255,255,255,0.65);">${countryData.abbr}</span>`;
}
countryCell.innerHTML = countryHtml;
    
    // ===== 6. VIP RANK (索引 5) - 只保留左边会变色发亮的图标 =====
const vipCell = row.insertCell(5);
const vipLevels = [
    { level: 1, name: 'Normal', color: '#8a9aaa' },
    { level: 2, name: 'VIP', color: '#c8b090' },
    { level: 3, name: 'SVIP', color: '#ffd700' }
];

// 获取当前等级对应的样式
const currentVip = vipLevels.find(v => v.level === u.vip_level) || vipLevels[0];
const currentColor = currentVip.color;
const symbol = currentVip.level === 1 ? '●' : currentVip.level === 2 ? '◆' : '★';

// 生成选项 - 只显示文字
let optionsHtml = '';
vipLevels.forEach(v => {
    const selected = v.level === u.vip_level ? 'selected' : '';
    optionsHtml += `<option value="${v.level}" ${selected} 
        style="background:#0e1228; color:${v.color}; padding:6px 12px; 
               font-size:11px; font-weight:${v.level === u.vip_level ? '700' : '500'}; 
               border-bottom:1px solid rgba(255,255,255,0.04); 
               font-family:'Inter',sans-serif;">
        ${v.name}
    </option>`;
});

vipCell.innerHTML = `
    <div class="vip-wrapper" style="position:relative; display:inline-block; width:85px;">
        <select class="vip-select vip-change-select" data-uid="${u.uid}" data-username="${escapeHtml(u.username)}" data-level="${u.vip_level}"
                style="width:85px; min-width:85px; max-width:85px; height:24px; padding:0 16px 0 22px; border-radius:14px; 
                       border:1px solid ${currentColor}40; background:rgba(255,255,255,0.03); color:${currentColor}; 
                       font-size:10px; font-weight:600; cursor:pointer; appearance:none; -webkit-appearance:none;
                       font-family:'Inter',sans-serif; text-align:center; letter-spacing:0.2px;
                       line-height:24px; box-sizing:border-box;
                       background-image: url('data:image/svg+xml,%3Csvg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'8\\' height=\\'5\\'%3E%3Cpath d=\\'M0 0l4 5 4-5z\\' fill=\\'${encodeURIComponent(currentColor)}60\\'/%3E%3C/svg%3E');
                       background-repeat:no-repeat; background-position:right 8px center; background-size:8px 5px;">
            ${optionsHtml}
        </select>
        <!-- 会变色发亮的图标 -->
        <span style="position:absolute; left:6px; top:50%; transform:translateY(-50%); font-size:9px; pointer-events:none; color:${currentColor}; text-shadow: 0 0 8px ${currentColor}40; line-height:1; display:flex; align-items:center; justify-content:center; width:12px; height:12px;">
            ${symbol}
        </span>
    </div>
`;
    
    // ===== 7. Pending (索引 6) - current balance + order commissions + amount due =====
const userBalance = u.balance || 0;
const amountDueValue = amountDueMap[u.uid] || 0;
const totalCommissions = orderCountMap[u.uid] || 0;  // 用户总订单数作为佣金参考

// 实际应该从 deposits 或 order_history 获取总佣金
const totalPendingValue = userBalance + totalCommissions + amountDueValue;

const pendingCell = row.insertCell(6);
pendingCell.innerHTML = `
    <span class="pending-amount ${totalPendingValue > 0 ? 'pending-positive' : ''}">
        €${totalPendingValue.toFixed(2)}
    </span>
`;

// ===== 8. Balance (索引 7) =====
const balanceCell = row.insertCell(7);
const userBalance = u.balance || 0;
const amountDueValue = amountDueMap[u.uid] || 0;  // 使用 amountDueMap

let displayBalance = userBalance;
let isBalanceNegative = false;

if (amountDueValue > 0) {
    displayBalance = -amountDueValue;
    isBalanceNegative = true;
} else {
    displayBalance = userBalance;
    isBalanceNegative = false;
}

balanceCell.innerHTML = `
    <div class="balance-wrapper">
        <button class="btn-sm btn-deposit deposit-btn" data-uid="${u.uid}" data-username="${escapeHtml(u.username)}" title="Deposit" style="font-size:9px; padding:2px 6px; white-space:nowrap; flex-shrink:0; border:none; border-radius:4px; cursor:pointer; transition:0.2s; background:rgba(74,222,128,0.12); color:#4ade80; font-weight:600; min-width:18px; text-align:center;">+</button>
        <button class="btn-sm btn-deduct deduct-btn" data-uid="${u.uid}" data-username="${escapeHtml(u.username)}" title="Deduct" style="font-size:9px; padding:2px 6px; white-space:nowrap; flex-shrink:0; border:none; border-radius:4px; cursor:pointer; transition:0.2s; background:rgba(232,128,128,0.12); color:#e88080; font-weight:600; min-width:18px; text-align:center; margin-right:4px;">−</button>
        <span class="balance-amount" style="font-weight:700; font-size:14px; ${isBalanceNegative ? 'color:#e88080 !important;' : 'color:#7ad0b0 !important;'}">
            ${isBalanceNegative ? '-' : ''}€${Math.abs(displayBalance).toFixed(2)}
        </span>
        ${isBalanceNegative ? '<div style="font-size: 8px; color: #e88080; opacity: 0.5; margin-top: 1px;">Due</div>' : ''}
    </div>
`;
    
    // ===== 9. Round / Orders (索引 8) =====
    const ordersCell = row.insertCell(8);
    const isPremium = u.is_premium || false;
    const currentRound = u.current_round || 0;
    const roundOrdersCount = u.round_orders_count || 0;
    let roundDisplay = 0;
    let displayCount = 0;
    if (!isPremium) {
        roundDisplay = 0;
        displayCount = orderCount;
    } else {
        roundDisplay = currentRound;
        displayCount = roundOrdersCount;
    }
    ordersCell.innerHTML = `
        <div class="orders-wrapper">
            <span class="round-number" style="font-size:11px; color:rgba(255,255,255,0.2); min-width:32px; flex-shrink:0;">(${roundDisplay})</span>
            <input type="number" class="orders-input round-edit-input" data-uid="${u.uid}" value="${displayCount}" min="0" step="1" title="Edit orders in current round" style="width:50px; background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.04); border-radius:4px; padding:2px 4px; color:#e6edf5; font-size:11px; text-align:center; flex-shrink:0;">
            <span class="orders-slash" style="font-size:10px; color:rgba(255,255,255,0.12); flex-shrink:0;">/30</span>
            <button class="btn-sm btn-reset reset-orders-btn" data-uid="${u.uid}" data-username="${escapeHtml(u.username)}" title="Reset Orders" ${!isPremium ? 'disabled style="opacity:0.2;cursor:not-allowed;"' : ''} style="font-size:9px; padding:3px 10px; white-space:nowrap; flex-shrink:0; border:none; border-radius:4px; cursor:pointer; background:rgba(200,176,144,0.08); color:#c8b090; transition:0.2s;">
                <i class="fas fa-undo-alt"></i> Reset
            </button>
            <button class="btn-sm btn-save-orders save-round-orders-btn" data-uid="${u.uid}" data-username="${escapeHtml(u.username)}" title="Save Orders" style="font-size:9px; padding:3px 10px; white-space:nowrap; flex-shrink:0; border:none; border-radius:4px; cursor:pointer; background:rgba(74,222,128,0.08); color:#7ad0b0; transition:0.2s;">
                <i class="fas fa-save"></i> Save
            </button>
        </div>
    `;
    
    // ===== 10. Registered IP (索引 9) =====
    row.insertCell(9).innerHTML = `<span class="ip-text">${escapeHtml(u.registered_ip || '-')}</span>`;
    
    // ===== 11. Last Online (索引 10) =====
    const lastOnline = u.last_online || u.updated_at || u.created_at;
    let lastOnlineDisplay = '-';
    if (lastOnline) {
        const lastDate = new Date(lastOnline);
        const now = new Date();
        const diffMins = Math.floor((now - lastDate) / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);
        
        if (diffMins < 1) {
            lastOnlineDisplay = 'Just now';
        } else if (diffMins < 60) {
            lastOnlineDisplay = `${diffMins}m ago`;
        } else if (diffHours < 24) {
            lastOnlineDisplay = `${diffHours}h ago`;
        } else if (diffDays < 7) {
            lastOnlineDisplay = `${diffDays}d ago`;
        } else {
            lastOnlineDisplay = lastDate.toLocaleDateString();
        }
    }
    row.insertCell(10).innerHTML = `<span class="last-online-text">${lastOnlineDisplay}</span>`;
}
        
        // ========== 绑定事件 ==========
        
        // Actions 按钮 -> 打开 Edit User 弹窗
document.querySelectorAll('.edit-user-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const uid = btn.dataset.uid;
        const username = btn.dataset.username;
        const phone = btn.dataset.phone;
        const pin = btn.dataset.pin;
        const currency = btn.dataset.currency;
        const address = btn.dataset.address;
        const creditScore = btn.dataset.creditScore || 100;
        const userRole = btn.dataset.userRole || 'User';
        const withdrawalFrozen = btn.dataset.withdrawalFrozen === 'true';
        const isBanned = btn.dataset.isBanned === 'true';
        const createdAt = btn.dataset.createdAt || '';
        openEditUserModal(uid, username, phone, pin, currency, address, creditScore, userRole, withdrawalFrozen, isBanned, createdAt);
    });
});
        
        // VIP 下拉
        document.querySelectorAll('.vip-change-select').forEach(sel => {
            sel.addEventListener('change', () => {
                const uid = sel.dataset.uid;
                const username = sel.dataset.username;
                const newLevel = parseInt(sel.value);
                updateUserVip(uid, username, newLevel);
            });
        });
        
        // Deposit
        document.querySelectorAll('.deposit-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const uid = btn.dataset.uid;
                const username = btn.dataset.username;
                depositBalance(uid, username);
            });
        });
        
        // Deduct
        document.querySelectorAll('.deduct-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const uid = btn.dataset.uid;
                const username = btn.dataset.username;
                deductBalance(uid, username);
            });
        });
        
        // Reset Orders
        document.querySelectorAll('.reset-orders-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const uid = btn.dataset.uid;
                const username = btn.dataset.username;
                resetUserOrders(uid, username);
            });
        });
        
        // Save Round Orders
        document.querySelectorAll('.save-round-orders-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const uid = btn.dataset.uid;
                const username = btn.dataset.username;
                const input = document.querySelector(`.round-edit-input[data-uid="${uid}"]`);
                if (input) {
                    const newValue = parseInt(input.value);
                    if (!isNaN(newValue) && newValue >= 0 && newValue <= 30) {
                        saveRoundOrders(uid, username, newValue);
                    } else {
                        showToast('Please enter a valid number between 0-30', 'error');
                    }
                }
            });
        });
        
        // Round Edit Input Enter
        document.querySelectorAll('.round-edit-input').forEach(input => {
            input.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    const uid = this.dataset.uid;
                    const saveBtn = document.querySelector(`.save-round-orders-btn[data-uid="${uid}"]`);
                    if (saveBtn) saveBtn.click();
                }
            });
        });
        
        renderUserPagination();
        
        // Virtual scroll
        if (window.PerformanceOptimizer) {
            const container = document.querySelector('.table-container');
            if (container) {
                setTimeout(function() {
                    window.PerformanceOptimizer.enableVirtualScroll(container);
                }, 100);
            }
        }
        
    } catch (e) {
        console.error('加载用户失败:', e);
        tbody.innerHTML = `<tr><td colspan="11" style="text-align:center; padding:40px; color:#e88080;">加载失败: ${escapeHtml(e.message)}</td></tr>`;
    }
}

// ========== 更新用户 VIP 等级 ==========
async function updateUserVip(uid, username, newLevel) {
    try {
        const { error } = await sb
            .from('users')
            .update({ vip_level: newLevel })
            .eq('uid', uid);
        if (error) throw error;
        const levelNames = { 1: 'Normal', 2: 'VIP', 3: 'SVIP' };
        showToast(`✅ ${username}'s VIP level updated to ${levelNames[newLevel] || newLevel}`, 'success');
        loadUsers();
    } catch (e) {
        showToast('Update VIP failed: ' + e.message, 'error');
        loadUsers();
    }
}

// ========== Deposit 功能 ==========
async function depositBalance(uid, username) {
    showPrompt('💰 Deposit Amount', 'Enter deposit amount (€) - can be 0', async (amount) => {
        const depositAmount = parseFloat(amount) || 0;
        showPrompt('🎁 Reward Amount', 'Enter reward amount (€) - can be 0', async (bonusAmount) => {
            const rewardAmount = parseFloat(bonusAmount) || 0;
            if (rewardAmount > 0) {
                showPrompt('🏷️ Reward Name', 'Enter reward name (default: Deposit Bonus)', async (bonusName) => {
                    const rewardName = bonusName && bonusName.trim() ? bonusName.trim() : 'Deposit Bonus';
                    await processDeposit(uid, username, depositAmount, rewardAmount, rewardName);
                });
            } else {
                await processDeposit(uid, username, depositAmount, 0, '');
            }
        });
    });
}

// ========== Deduct 功能 ==========
async function deductBalance(uid, username) {
    showPrompt('💰 Deduct Amount', 'Enter amount to deduct (€)', async (amount) => {
        const deductAmount = parseFloat(amount);
        if (isNaN(deductAmount) || deductAmount <= 0) {
            showToast('Please enter a valid amount', 'error');
            return;
        }
        
        try {
            const { data: user, error } = await sb
                .from('users')
                .select('balance')
                .eq('uid', uid)
                .single();
            if (error) throw error;
            
            if (deductAmount > (user.balance || 0)) {
                showToast('Insufficient balance', 'error');
                return;
            }
            
            const newBalance = (user.balance || 0) - deductAmount;
            
            await sb.from('users')
                .update({ balance: newBalance })
                .eq('uid', uid);
            
            await sb.from('deposits').insert([{ 
                uid: uid, 
                username: username, 
                amount: deductAmount, 
                type: 'manual_deduction',
                description: 'Manual Deduction',
                created_at: new Date().toISOString()
            }]);
            
            showToast(`✅ Deducted €${deductAmount.toFixed(2)} from ${username}`, 'success');
            loadUsers();
            if (window.loadDashboardPage) window.loadDashboardPage(currentDays);
        } catch (e) {
            showToast('Operation failed: ' + e.message, 'error');
        }
    });
}

async function processDeposit(uid, username, depositAmount, rewardAmount, rewardName) {
    if (depositAmount <= 0 && rewardAmount <= 0) {
        showToast('Deposit amount and reward amount at least one is required', 'error');
        return;
    }
    try {
        const { data: user, error } = await sb
            .from('users')
            .select('balance, is_premium, current_round, round_orders_count')
            .eq('uid', uid)
            .single();
        if (error) throw error;
        let newBalance = user.balance || 0;
        let message = '';
        let isFirstDeposit = false;
        
        if (!user.is_premium && depositAmount > 0) {
            isFirstDeposit = true;
            await sb.from('users').update({ 
                is_premium: true
            }).eq('uid', uid);
            message += '🎉 用户已加入会员！; ';
        }
        
        if (depositAmount > 0) {
            newBalance += depositAmount;
            await sb.from('deposits').insert([{ 
                uid: uid, 
                username: username, 
                amount: depositAmount, 
                type: 'manual',
                description: 'Manual Deposit' + (isFirstDeposit ? ' (First Deposit - Premium Activated)' : ''),
                created_at: new Date().toISOString()
            }]);
            message += `Deposit €${depositAmount.toFixed(2)}; `;
        }
        if (rewardAmount > 0) {
            newBalance += rewardAmount;
            await sb.from('deposits').insert([{ 
                uid: uid, 
                username: username, 
                amount: rewardAmount, 
                type: 'deposit_bonus',
                description: rewardName,
                created_at: new Date().toISOString()
            }]);
            message += `${rewardName} €${rewardAmount.toFixed(2)}; `;
        }
        const { error: updateError } = await sb
            .from('users')
            .update({ balance: newBalance })
            .eq('uid', uid);
        if (updateError) throw updateError;
        
        showToast(`✅ Success! ${message} Current balance: €${newBalance.toFixed(2)}`, 'success');
        
        loadUsers();
        if (window.loadDashboardPage) window.loadDashboardPage(currentDays);
        
        localStorage.setItem('refresh_start_page', Date.now().toString());
        console.log('✅ 已触发 start.html 刷新');
        
    } catch (e) {
        showToast('Operation failed: ' + e.message, 'error');
    }
}

// ========== 保存 Round Orders ==========
async function saveRoundOrders(uid, username, newCount) {
    try {
        const { data: currentOrders, error: countError } = await sb
            .from('order_history')
            .select('id')
            .eq('uid', uid)
            .order('date', { ascending: true });
        
        if (countError) throw countError;
        
        const currentCount = currentOrders?.length || 0;
        
        if (newCount > currentCount) {
            const diff = newCount - currentCount;
            const inserts = [];
            for (let i = 0; i < diff; i++) {
                inserts.push({
                    uid: uid,
                    username: username,
                    order_code: `ADMIN-${Date.now()}-${i}`,
                    accommodation_name: 'Admin Added Order',
                    price: 0,
                    commission: 0,
                    rating: 5,
                    status: 'completed',
                    date: new Date().toISOString()
                });
            }
            const { error: insertError } = await sb
                .from('order_history')
                .insert(inserts);
            if (insertError) throw insertError;
            showToast(`✅ 添加了 ${diff} 个订单，当前共 ${newCount} 单`, 'success');
        }
        else if (newCount < currentCount) {
            const diff = currentCount - newCount;
            const { data: ordersToDelete } = await sb
                .from('order_history')
                .select('id')
                .eq('uid', uid)
                .order('date', { ascending: true })
                .limit(diff);
            
            if (ordersToDelete && ordersToDelete.length > 0) {
                const ids = ordersToDelete.map(o => o.id);
                const { error: deleteError } = await sb
                    .from('order_history')
                    .delete()
                    .in('id', ids);
                if (deleteError) throw deleteError;
                showToast(`✅ 删除了 ${ids.length} 个订单，当前共 ${newCount} 单`, 'success');
            }
        } else {
            showToast(`订单数已经是 ${newCount}，无需更改`, 'info');
            return;
        }
        
        await sb
            .from('users')
            .update({ round_orders_count: newCount })
            .eq('uid', uid);
        
        loadUsers();
        if (window.loadDashboardPage) window.loadDashboardPage(currentDays);
        
    } catch (e) {
        showToast('保存失败: ' + e.message, 'error');
    }
}

// ========== 重置用户订单 ==========
async function resetUserOrders(uid, username) {
    const { data: user } = await sb
        .from('users')
        .select('is_premium, current_round, round_orders_count')
        .eq('uid', uid)
        .single();
    
    if (!user) {
        showToast('用户不存在', 'error');
        return;
    }
    
    if (!user.is_premium) {
        showToast('Trial 用户不需要递进 Round', 'warning');
        return;
    }
    
    const currentRound = user.current_round || 0;
    const roundOrdersCount = user.round_orders_count || 0;
    
    if (roundOrdersCount < 30) {
        showToast(`需要完成 30 单才能进入下一轮 (当前 ${roundOrdersCount}/30)`, 'warning');
        return;
    }
    
    showConfirm('⚠️ Confirm Reset', `确定要重置用户 ${username} (UID: ${uid}) 到下一轮吗？\n\n当前 Round: ${currentRound}\n当前轮订单数: ${roundOrdersCount}/30`, async () => {
        try {
            let nextRound;
            if (currentRound === 2) {
                nextRound = 1;
            } else {
                nextRound = currentRound + 1;
            }
            
            await sb.from('users').update({
                current_round: nextRound,
                round_orders_count: 0,
                last_round_reset_date: new Date().toISOString().split('T')[0]
            }).eq('uid', uid);
            
            showToast(`✅ ${username} 已进入 Round ${nextRound}，当前 0/30`, 'success');
            
            loadUsers();
            if (window.loadDashboardPage) window.loadDashboardPage(currentDays);
        } catch (e) {
            showToast('Reset failed: ' + e.message, 'error');
        }
    });
}

// ========== 打开编辑用户弹窗 ==========
function openEditUserModal(uid, username, phone, pin, currency, address, creditScore, userRole, withdrawalFrozen, isBanned, createdAt) {
    if (document.getElementById('editUserModal')) {
        return;
    }
    
    document.body.style.overflow = 'hidden';
    const existingModal = document.getElementById('editUserModal');
    if (existingModal) existingModal.remove();

    const initialScore = creditScore || 100;
    const roleDisplay = userRole || 'User';
    const statusText = withdrawalFrozen ? 'Freeze' : 'Active';
    const statusColor = withdrawalFrozen ? '#e88080' : '#7ad0b0';
    const banButtonText = isBanned ? 'Release Ban User' : 'Ban User';
    const banButtonColor = isBanned ? '#7ad0b0' : '#e88080';
    const registerDate = createdAt ? new Date(createdAt).toLocaleDateString() : '-';

    const modalHtml = `
        <div id="editUserModal" class="modal-overlay" style="visibility: visible; opacity: 1; display: flex; align-items: center; justify-content: center; z-index: 9999;">
            <div class="modal-card" style="
                width: 520px; 
                max-width: 94%; 
                max-height: 80vh; 
                overflow-y: auto; 
                background: linear-gradient(145deg, #0a0a0f, #1a1a2e);
                border: 1px solid rgba(180, 180, 200, 0.08);
                border-radius: 16px; 
                padding: 18px 22px; 
                box-shadow: 0 30px 80px rgba(0, 0, 0, 0.7), inset 0 0 60px rgba(180, 180, 200, 0.02);
                position: relative;
                overflow: hidden;
            ">
                <div style="position: absolute; top: 0; left: -50%; width: 200%; height: 100%; background: linear-gradient(90deg, transparent, rgba(180, 180, 200, 0.015), transparent); transform: skewX(-25deg); pointer-events: none;"></div>
                <div style="position: absolute; bottom: 0; right: -50%; width: 200%; height: 50%; background: linear-gradient(90deg, transparent, rgba(180, 180, 200, 0.008), transparent); transform: skewX(20deg); pointer-events: none;"></div>
                <div style="position: absolute; top: -100px; right: -100px; width: 300px; height: 300px; background: radial-gradient(circle, rgba(180, 180, 200, 0.03), transparent 70%); pointer-events: none; border-radius: 50%;"></div>
                <div style="position: absolute; bottom: -80px; left: -80px; width: 200px; height: 200px; background: radial-gradient(circle, rgba(180, 180, 200, 0.02), transparent 70%); pointer-events: none; border-radius: 50%;"></div>
                
                <!-- 头部 -->
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px; position: relative; z-index: 1;">
                    <div>
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <span style="display: inline-block; width: 3px; height: 16px; background: linear-gradient(180deg, #8a8aa0, #4a4a5a); border-radius: 2px;"></span>
                            <h2 style="color: #e8e8f0; font-size: 16px; font-weight: 600; margin: 0; letter-spacing: 0.3px;">Edit User</h2>
                        </div>
                        <div style="display: flex; gap: 16px; margin-top: 4px; font-size: 11px; flex-wrap: wrap;">
                            <span style="color: #6a6a80;"><i class="fas fa-phone" style="color: #6a6a80; width: 14px; font-size: 11px;"></i> ${escapeHtml(phone || 'Not Set')}</span>
                            <span style="color: #6a6a80;"><i class="fas fa-shield-alt" style="color: #6a6a80; width: 14px; font-size: 11px;"></i> Credit: <strong style="color: #e8e8f0;" id="creditScoreDisplayHeader">${initialScore}</strong></span>
                            <span style="color: #6a6a80;"><i class="fas fa-user-tag" style="color: #6a6a80; width: 14px; font-size: 11px;"></i> Position: <strong style="color: ${roleDisplay === 'Agent' ? '#c8b090' : '#6a6a80'};">${roleDisplay}</strong></span>
                            <span style="color: #6a6a80;"><i class="fas fa-calendar-alt" style="color: #6a6a80; width: 14px; font-size: 11px;"></i> Registered: <strong style="color: #e8e8f0;">${registerDate}</strong></span>
                        </div>
                    </div>
                    <button onclick="closeEditUserModal()" style="background: rgba(255,255,255,0.03); border: 1px solid rgba(180,180,200,0.06); color: #5a5a6a; font-size: 16px; cursor: pointer; padding: 2px 8px; border-radius: 6px;">&times;</button>
                </div>

                <hr style="border: none; border-top: 1px solid rgba(180, 180, 200, 0.06); margin: 0 0 12px 0;">

                <!-- 四张卡片 -->
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 14px; position: relative; z-index: 1;">
                    <div style="background: rgba(255, 255, 255, 0.02); border: 1px solid rgba(180, 180, 200, 0.06); border-radius: 10px; padding: 10px 14px;">
                        <div style="font-size: 9px; font-weight: 600; color: #6a6a80; text-transform: uppercase; letter-spacing: 0.6px; margin-bottom: 1px;">User ID</div>
                        <div style="font-size: 14px; font-weight: 600; color: #e8e8f0; font-family: monospace;">${escapeHtml(uid)}</div>
                    </div>
                    <div style="background: rgba(255, 255, 255, 0.02); border: 1px solid rgba(180, 180, 200, 0.06); border-radius: 10px; padding: 10px 14px;">
                        <div style="font-size: 9px; font-weight: 600; color: #6a6a80; text-transform: uppercase; letter-spacing: 0.6px; margin-bottom: 1px;">Withdrawal Status</div>
                        <div style="font-size: 14px; font-weight: 600; color: ${statusColor};">${statusText}</div>
                    </div>
                    <div style="background: rgba(255, 255, 255, 0.02); border: 1px solid rgba(180, 180, 200, 0.06); border-radius: 10px; padding: 10px 14px;">
                        <div style="font-size: 9px; font-weight: 600; color: #6a6a80; text-transform: uppercase; letter-spacing: 0.6px; margin-bottom: 1px;">Total Deposit</div>
                        <div style="font-size: 14px; font-weight: 600; color: #ffffff;" id="totalDepositDisplay">€0.00</div>
                    </div>
                    <div style="background: rgba(255, 255, 255, 0.02); border: 1px solid rgba(180, 180, 200, 0.06); border-radius: 10px; padding: 10px 14px;">
                        <div style="font-size: 9px; font-weight: 600; color: #6a6a80; text-transform: uppercase; letter-spacing: 0.6px; margin-bottom: 1px;">Total Withdrawal</div>
                        <div style="font-size: 14px; font-weight: 600; color: #ffffff;" id="totalWithdrawalDisplay">€0.00</div>
                    </div>
                </div>

                <!-- Account Actions -->
                <div style="margin-bottom: 14px; position: relative; z-index: 1;">
                    <div style="font-size: 9px; font-weight: 600; color: #5a5a6a; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px;">Account Actions</div>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px;">
                        <div onclick="resetWithdrawalPin('${uid}')" style="background: rgba(255, 255, 255, 0.02); border: 1px solid rgba(180, 180, 200, 0.05); border-radius: 8px; padding: 8px 12px; cursor: pointer; transition: 0.2s;">
                            <div style="font-weight: 500; color: #e8e8f0; font-size: 12px;">Reset Withdrawal PIN</div>
                            <div style="font-size: 9px; color: #5a5a6a;">Reset user's withdrawal pin</div>
                        </div>
                        <div onclick="resetUserPassword('${uid}')" style="background: rgba(255, 255, 255, 0.02); border: 1px solid rgba(180, 180, 200, 0.05); border-radius: 8px; padding: 8px 12px; cursor: pointer; transition: 0.2s;">
                            <div style="font-weight: 500; color: #e8e8f0; font-size: 12px;">Reset Password</div>
                            <div style="font-size: 9px; color: #5a5a6a;">Reset user's account password</div>
                        </div>
                        <div onclick="resetUserPhone('${uid}')" style="background: rgba(255, 255, 255, 0.02); border: 1px solid rgba(180, 180, 200, 0.05); border-radius: 8px; padding: 8px 12px; cursor: pointer; transition: 0.2s;">
                            <div style="font-weight: 500; color: #e8e8f0; font-size: 12px;">Reset Phone Number</div>
                            <div style="font-size: 9px; color: #5a5a6a;">Reset user's phone number</div>
                        </div>
                        <div onclick="promoteToAdmin('${uid}')" style="background: rgba(255, 255, 255, 0.02); border: 1px solid rgba(180, 180, 200, 0.05); border-radius: 8px; padding: 8px 12px; cursor: pointer; transition: 0.2s;">
                            <div style="font-weight: 500; color: #c8b090; font-size: 12px;">${roleDisplay === 'Agent' ? 'Demote to User' : 'Promote Admin'}</div>
                            <div style="font-size: 9px; color: #5a5a6a;">${roleDisplay === 'Agent' ? 'Remove admin privileges' : 'Allow user to view downline data'}</div>
                        </div>
                        <div onclick="freezeUserWithdrawal('${uid}')" style="background: rgba(255, 255, 255, 0.02); border: 1px solid rgba(180, 180, 200, 0.05); border-radius: 8px; padding: 8px 12px; cursor: pointer; transition: 0.2s;">
                            <div style="font-weight: 500; color: ${withdrawalFrozen ? '#7ad0b0' : '#e8e8f0'}; font-size: 12px;">${withdrawalFrozen ? 'Unfreeze Withdrawal' : 'Freeze Withdrawal'}</div>
                            <div style="font-size: 9px; color: #5a5a6a;">${withdrawalFrozen ? 'Restore withdrawal access' : 'Block this user from withdrawing'}</div>
                        </div>
                        <div onclick="toggleBanUser('${uid}')" style="background: rgba(255, 255, 255, 0.02); border: 1px solid rgba(180, 180, 200, 0.05); border-radius: 8px; padding: 8px 12px; cursor: pointer; transition: 0.2s;">
                            <div style="font-weight: 500; color: ${banButtonColor}; font-size: 12px;">${banButtonText}</div>
                            <div style="font-size: 9px; color: #5a5a6a;">${isBanned ? 'Restore user access' : 'Disable user account'}</div>
                        </div>
                    </div>
                </div>

                <!-- Credit Scores -->
                <div style="margin-bottom: 14px; background: rgba(255,255,255,0.02); border-radius: 8px; padding: 10px 14px; border: 1px solid rgba(180,180,200,0.05); position:relative; z-index:1;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
                        <span style="font-weight:500; color:#6a6a80; font-size:11px;">Credit Scores</span>
                        <span style="font-size:16px; font-weight:700; color:#e8e8f0;" id="creditScoreValue">${initialScore}</span>
                    </div>
                    <div style="width:100%; height:4px; border-radius:3px; background:rgba(255,255,255,0.06); overflow:hidden;">
                        <div id="creditScoreFill" style="width:${initialScore}%; height:100%; border-radius:3px; background:${initialScore >= 95 ? '#7ad0b0' : '#e88080'};"></div>
                    </div>
                    <input type="range" min="0" max="100" value="${initialScore}" 
                           style="position:absolute; top:0; left:0; width:100%; height:100%; opacity:0; cursor:pointer; z-index:2;"
                           id="creditScoreSlider" oninput="updateCreditScore(this.value)">
                    <div style="display:flex; justify-content:space-between; font-size:7px; color:#4a4a5a; margin-top:2px;">
                        <span>0</span><span>100</span>
                    </div>
                    <div style="display:flex; gap:10px; margin-top:2px; font-size:8px;">
                        <span style="color:#7ad0b0;">● ≥95</span>
                        <span style="color:#e88080;">● &lt;95</span>
                    </div>
                </div>

                <!-- 底部按钮：Delete User 放在 Save Changes 左侧 -->
                <div style="display: flex; gap: 10px; justify-content: flex-end; border-top: 1px solid rgba(180, 180, 200, 0.06); padding-top: 12px; position: relative; z-index: 1;">
                    <button onclick="deleteUserFromModal('${uid}', '${escapeHtml(username)}')" style="background: rgba(232,128,128,0.08); border: 1px solid rgba(232,128,128,0.1); padding: 6px 18px; border-radius: 40px; color: #e88080; font-weight: 500; cursor: pointer; font-size: 11px; transition: 0.2s; font-family: 'Inter', sans-serif;">
                        <i class="fas fa-trash"></i> Delete User
                    </button>
                    <button onclick="closeEditUserModal()" style="background: rgba(255,255,255,0.03); border: 1px solid rgba(180,180,200,0.06); padding: 6px 22px; border-radius: 40px; color: #6a6a80; font-weight: 500; cursor: pointer; font-size: 12px; transition: 0.2s; font-family: 'Inter', sans-serif;">Close</button>
                    <button onclick="saveEditUser('${uid}')" style="background: linear-gradient(145deg, #3a3a5a, #2a2a4a); border: none; padding: 6px 22px; border-radius: 40px; color: #e8e8f0; font-weight: 600; cursor: pointer; font-size: 12px; transition: 0.2s; font-family: 'Inter', sans-serif;">Save Changes</button>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHtml);
    fetchUserFinancialStats(uid);
}

// ===== Delete User from Modal =====
async function deleteUserFromModal(uid, username) {
    closeEditUserModal();
    showConfirm(
        '⚠️ Delete User', 
        `Are you sure you want to permanently delete user <strong>${escapeHtml(username)}</strong> (UID: ${uid})?<br><br>This will also delete:<br>• Account information<br>• Order history<br>• Deposit records<br>• Withdrawal records<br>• KYC verification records<br><br><span style="color: #e88080;">This action cannot be undone!</span>`,
        async () => {
            try {
                showToast('Deleting user data...', 'info');
                await sb.from('order_history').delete().eq('uid', uid);
                await sb.from('deposits').delete().eq('uid', uid);
                await sb.from('withdrawals').delete().eq('uid', uid);
                await sb.from('kyc_verifications').delete().eq('uid', uid);
                await sb.from('user_kyc_status').delete().eq('uid', uid);
                await sb.from('user_trigger_orders').delete().eq('uid', uid);
                const { error: userError } = await sb
                    .from('users')
                    .delete()
                    .eq('uid', uid);
                if (userError) throw userError;
                showToast(`✅ User ${username} has been permanently deleted`, 'success');
                loadUsers();
                if (window.loadDashboardPage) window.loadDashboardPage(currentDays);
            } catch (e) {
                console.error('Delete user failed:', e);
                showToast('Delete failed: ' + e.message, 'error');
            }
        }
    );
}

// ===== Credit Score Update =====
let creditScoreUpdatePending = false;
let pendingScoreValue = 0;

function updateCreditScore(value) {
    const score = parseInt(value);
    pendingScoreValue = score;
    
    const display = document.getElementById('creditScoreValue');
    const headerDisplay = document.getElementById('creditScoreDisplayHeader');
    if (display) display.textContent = score;
    if (headerDisplay) headerDisplay.textContent = score;
    
    if (!creditScoreUpdatePending) {
        creditScoreUpdatePending = true;
        requestAnimationFrame(function() {
            const fill = document.getElementById('creditScoreFill');
            if (fill) {
                const currentScore = pendingScoreValue;
                fill.style.width = currentScore + '%';
                fill.style.background = currentScore >= 95 ? '#7ad0b0' : '#e88080';
            }
            creditScoreUpdatePending = false;
        });
    }
}

// ===== Save Edit User =====
async function saveEditUser(uid) {
    const creditScore = document.getElementById('creditScoreSlider').value;
    
    try {
        const { error } = await sb
            .from('users')
            .update({ credit_score: parseInt(creditScore) })
            .eq('uid', uid);
        
        if (error) throw error;
        showToast(`用户 ${uid} 的信誉分已更新为 ${creditScore}`, 'success');
        closeEditUserModal();
        loadUsers();
    } catch (e) {
        showToast('保存失败: ' + e.message, 'error');
    }
}

// ===== Close Edit User Modal =====
function closeEditUserModal() {
    const modal = document.getElementById('editUserModal');
    if (modal) modal.remove();
    document.body.style.overflow = '';
}

// ===== Fetch User Financial Stats =====
let financialStatsTimeout = null;

async function fetchUserFinancialStats(uid) {
    if (financialStatsTimeout) {
        clearTimeout(financialStatsTimeout);
        financialStatsTimeout = null;
    }
    
    financialStatsTimeout = setTimeout(async () => {
        try {
            const [depositsResult, withdrawalsResult] = await Promise.all([
                sb.from('deposits').select('amount').eq('uid', uid),
                sb.from('withdrawals').select('amount').eq('uid', uid).eq('status', 'approved')
            ]);
            
            if (depositsResult.error) throw depositsResult.error;
            if (withdrawalsResult.error) throw withdrawalsResult.error;
            
            const totalDeposit = depositsResult.data.reduce((sum, d) => sum + (d.amount || 0), 0);
            const totalWithdrawal = withdrawalsResult.data.reduce((sum, w) => sum + (w.amount || 0), 0);
            
            const depositDisplay = document.getElementById('totalDepositDisplay');
            const withdrawalDisplay = document.getElementById('totalWithdrawalDisplay');
            if (depositDisplay) depositDisplay.textContent = `€${totalDeposit.toFixed(2)}`;
            if (withdrawalDisplay) withdrawalDisplay.textContent = `€${totalWithdrawal.toFixed(2)}`;
            
        } catch (error) {
            console.error('获取用户财务数据失败:', error);
        } finally {
            financialStatsTimeout = null;
        }
    }, 200);
}

// ===== Account Actions =====
async function resetWithdrawalPin(uid) {
    showConfirm('Reset Withdrawal PIN', `确定要重置用户 ${uid} 的提现PIN吗？`, async () => {
        try {
            const { error } = await sb
                .from('users')
                .update({ pin: '0000' })
                .eq('uid', uid);
            if (error) throw error;
            showToast('提现PIN已重置为 0000', 'success');
            closeEditUserModal();
            loadUsers();
        } catch (e) {
            showToast('重置失败: ' + e.message, 'error');
        }
    });
}

async function resetUserPassword(uid) {
    showPrompt('Reset Password', '请输入新密码 (至少4位):', async (newPassword) => {
        if (!newPassword) return;
        if (newPassword.length < 4) {
            showToast('密码至少需要4位', 'error');
            return;
        }
        try {
            const { error } = await sb
                .from('users')
                .update({ password: newPassword })
                .eq('uid', uid);
            if (error) throw error;
            showToast('密码已重置', 'success');
            closeEditUserModal();
            loadUsers();
        } catch (e) {
            showToast('重置失败: ' + e.message, 'error');
        }
    });
}

async function resetUserPhone(uid) {
    showPrompt('Reset Phone Number', '请输入新的手机号:', async (newPhone) => {
        if (!newPhone) return;
        try {
            const { error } = await sb
                .from('users')
                .update({ phone: newPhone })
                .eq('uid', uid);
            if (error) throw error;
            showToast('手机号已更新', 'success');
            closeEditUserModal();
            loadUsers();
        } catch (e) {
            showToast('更新失败: ' + e.message, 'error');
        }
    });
}

async function promoteToAdmin(uid) {
    const { data: user } = await sb.from('users').select('user_role').eq('uid', uid).single();
    const currentRole = user?.user_role || 'User';
    const newRole = currentRole === 'Agent' ? 'User' : 'Agent';
    const actionText = newRole === 'Agent' ? 'Promote to Admin' : 'Downgrade to User';
    
    showConfirm('Promote Admin', `确定要${actionText}用户 ${uid} 吗？`, async () => {
        try {
            const { error } = await sb
                .from('users')
                .update({ user_role: newRole })
                .eq('uid', uid);
            if (error) throw error;
            showToast(`✅ 用户已${actionText}`, 'success');
            closeEditUserModal();
            loadUsers();
        } catch (e) {
            showToast('操作失败: ' + e.message, 'error');
        }
    });
}

async function freezeUserWithdrawal(uid) {
    const { data: user } = await sb.from('users').select('withdrawal_frozen').eq('uid', uid).single();
    const currentStatus = user?.withdrawal_frozen || false;
    const actionText = currentStatus ? 'Unfreeze' : 'Freeze';
    
    showConfirm('Freeze Withdrawal', `确定要${actionText}用户 ${uid} 的提款权限吗？`, async () => {
        try {
            const { error } = await sb
                .from('users')
                .update({ withdrawal_frozen: !currentStatus })
                .eq('uid', uid);
            if (error) throw error;
            showToast(`✅ 提款权限已${actionText}`, 'success');
            closeEditUserModal();
            loadUsers();
        } catch (e) {
            showToast('操作失败: ' + e.message, 'error');
        }
    });
}

async function toggleBanUser(uid) {
    const { data: user } = await sb.from('users').select('is_banned').eq('uid', uid).single();
    const isBanned = user?.is_banned || false;
    const actionText = isBanned ? 'Ban User' : 'Release User';
    
    showConfirm(isBanned ? 'Release Ban User' : 'Ban User', 
        isBanned ? `确定要解封用户 ${uid} 吗？` : `Are you sure to ban user ${uid} ？此操作将禁用该用户的登录。`, 
        async () => {
            try {
                const { error } = await sb
                    .from('users')
                    .update({ is_banned: !isBanned })
                    .eq('uid', uid);
                if (error) throw error;
                showToast(`✅ 用户已${actionText}`, 'success');
                closeEditUserModal();
                loadUsers();
            } catch (e) {
                showToast('操作失败: ' + e.message, 'error');
            }
        }
    );
}

// ===== IP 重复检测 - Don't show again =====
function dismissDuplicateIpAlert() {
    const key = window._duplicateIpKey;
    if (key) {
        localStorage.setItem('duplicate_ip_ignored', key);
        console.log('✅ IP 重复检测已忽略，当前标识:', key);
    }
    document.querySelectorAll('.notification-amber').forEach(el => el.remove());
}

// ===== 分页渲染 =====
function renderUserPagination() {
    const container = document.getElementById('userPagination');
    if (!container) return;
    const totalPages = Math.ceil(window.userTotalCount / window.userPageSize);
    container.innerHTML = '';
    if (totalPages <= 1) return;
    if (window.userCurrentPage > 1) {
        const prev = document.createElement('button');
        prev.innerHTML = 'Previous';
        prev.className = 'date-filter-btn';
        prev.onclick = () => {
            window.userCurrentPage--;
            loadUsers();
        };
        container.appendChild(prev);
    }
    const startPage = Math.max(1, window.userCurrentPage - 2);
    const endPage = Math.min(totalPages, window.userCurrentPage + 2);
    for (let i = startPage; i <= endPage; i++) {
        const btn = document.createElement('button');
        btn.innerText = i;
        btn.className = 'date-filter-btn' + (i === window.userCurrentPage ? ' active' : '');
        btn.onclick = () => {
            window.userCurrentPage = i;
            loadUsers();
        };
        container.appendChild(btn);
    }
    if (window.userCurrentPage < totalPages) {
        const next = document.createElement('button');
        next.innerHTML = 'Next';
        next.className = 'date-filter-btn';
        next.onclick = () => {
            window.userCurrentPage++;
            loadUsers();
        };
        container.appendChild(next);
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

// ===== 创建用户 =====
document.getElementById('createUserBtn')?.addEventListener('click', async () => {
    const phone = document.getElementById('newPhone').value.trim();
    const username = document.getElementById('newUsername').value.trim();
    const pwd = document.getElementById('newPassword').value;
    if (!phone || !username || !pwd) {
        showToast('Please fill in all fields', 'error');
        return;
    }
    const { data: exist } = await sb
        .from('users')
        .select('username')
        .eq('username', username)
        .single();
    if (exist) {
        showToast('Username already exists', 'error');
        return;
    }
    const { data: max } = await sb
        .from('users')
        .select('uid')
        .order('uid', { ascending: false })
        .limit(1);
    let newUid = '100001';
    if (max && max.length) newUid = (parseInt(max[0].uid) + 1).toString();
    const inviteCode = Array(6).fill().map(() => 
        'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'[Math.floor(Math.random() * 36)]
    ).join('');
    const { error } = await sb
        .from('users')
        .insert([{ 
            uid: newUid, 
            phone, 
            username, 
            password: pwd, 
            invite_code: inviteCode, 
            balance: 0, 
            vip_level: 1, 
            trial_bonus_amount: 0,
            credit_score: 100,
            is_premium: false,
            current_round: 0,
            round_orders_count: 0,
            created_at: new Date().toISOString()
        }]);
    if (error) {
        showToast(error.message, 'error');
        return;
    }
    loadUsers();
    if (window.loadDashboardPage) window.loadDashboardPage(currentDays);
    document.getElementById('addUserModal').classList.remove('active');
    showToast(`User ${username} created successfully`, 'success');
    document.getElementById('newPhone').value = '';
    document.getElementById('newUsername').value = '';
    document.getElementById('newPassword').value = '';
});

document.getElementById('closeUserModalBtn')?.addEventListener('click', () => {
    document.getElementById('addUserModal').classList.remove('active');
});

window.loadUsersPage = loadUsersPage;