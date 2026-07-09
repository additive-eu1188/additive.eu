// admin-kyc.js - 完整优化版（支持所有文件类型弹窗预览）
// 优化内容：
// 1. 支持所有文件类型（HEIC, PDF, DOC, XLS, PPT, 视频, 音频, 压缩包, 代码等）
// 2. 所有文件点击后在弹窗中预览（不是新标签页）
// 3. HEIC/PDF 直接在弹窗中显示
// 4. Verification History 按最新到最旧排序
// 5. 分页加载（每页20条）
// 6. 图片懒加载（IntersectionObserver）
// 7. 批量查询优化（减少数据库请求）
// 8. 缓存用户名

let activeTab = 'pending';
let kycSearchKeyword = '';
let kycCurrentPage = 1;
const KYC_PAGE_SIZE = 20;
let kycTotalCount = 0;
let usernameCache = {};
let kycImageObserver = null;

async function loadKycPage() {
    const container = document.getElementById('page_kyc');
    if (!container) return;
    container.innerHTML = `
        <div class="card">
            <!-- 顶部：左侧标题 + 右侧按钮 -->
            <div class="withdraw-header" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; margin-bottom: 24px;">
                <h2 style="font-size: 18px; font-weight: 600; color: #d8e0f0; margin: 0;">
                    <i class="fas fa-id-card" style="color: #8892a8; margin-right: 10px;"></i>
                    KYC Verification Management
                </h2>
                <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                    <button id="kycTabPending" class="tab-kyc-btn active" data-tab="pending"><i class="fas fa-list-ul"></i> Pending</button>
                    <button id="kycTabVerified" class="tab-kyc-btn" data-tab="verified"><i class="fas fa-history"></i> Verification History</button>
                    <button id="refreshKycBtn" class="btn-primary"><i class="fas fa-sync-alt"></i> Refresh</button>
                </div>
            </div>
            
            <!-- 待处理面板 -->
            <div id="kycPendingPanel" class="kyc-panel">
                <!-- 统计卡片 -->
                <div class="stats-grid" style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; margin-bottom: 24px;">
                    <div class="stat-item" style="background: rgba(12, 16, 28, 0.6); border-radius: 16px; padding: 16px 20px; text-align: center; border: 1px solid rgba(255,255,255,0.04);">
                        <div class="label" style="font-size: 11px; color: #8892a8; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">Total KYC</div>
                        <div class="value" id="kycStatTotal" style="font-size: 28px; font-weight: 700; color: #ffffff;">0</div>
                    </div>
                    <div class="stat-item" style="background: rgba(12, 16, 28, 0.6); border-radius: 16px; padding: 16px 20px; text-align: center; border: 1px solid rgba(255,255,255,0.04);">
                        <div class="label" style="font-size: 11px; color: #8892a8; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">Pending KYC</div>
                        <div class="value" id="kycStatPending" style="font-size: 28px; font-weight: 700; color: #ffffff;">0</div>
                    </div>
                </div>
                
                <!-- 搜索栏 -->
                <div class="search-bar" style="display: flex; flex-wrap: wrap; gap: 10px; align-items: center; background: rgba(8, 12, 24, 0.5); border-radius: 16px; padding: 12px 16px; margin-bottom: 20px; border: 1px solid rgba(255,255,255,0.03);">
                    <input type="text" id="kycSearchInput" class="search-input" placeholder="Search UID / username" style="flex: 1; min-width: 160px; background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.10); border-radius: 40px; padding: 8px 16px; color: #e6edf5; font-size: 13px; outline: none;">
                    
                    <select id="kycDocTypeFilter" style="min-width: 160px; flex-shrink: 0; background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.10); border-radius: 40px; padding: 8px 16px; color: #e6edf5; font-size: 13px; outline: none; cursor: pointer;">
                        <option value="">All Document Types</option>
                        <option value="passport">Passport</option>
                        <option value="resident_permit">Resident Permit</option>
                        <option value="driving_license_front">Driving License (Front)</option>
                        <option value="driving_license_back">Driving License (Back)</option>
                        <option value="national_id_front">National ID (Front)</option>
                        <option value="national_id_back">National ID (Back)</option>
                    </select>
                    
                    <button id="kycSearchBtn" class="btn-primary" style="padding: 8px 20px; border-radius: 40px; border: none; background: #2a3a5a; color: #e6edf5; font-weight: 600; cursor: pointer; font-size: 13px; white-space: nowrap;"><i class="fas fa-search"></i> Search</button>
                </div>
                
                <div class="table-container" style="max-height: 500px; overflow-y: auto; border-radius: 16px; border: 1px solid rgba(255,255,255,0.03);">
                    <table class="data-table" style="width: 100%; border-collapse: collapse; font-size: 13px; min-width: 900px;">
                        <thead>
                            <tr>
                                <th style="padding: 14px 14px; color: #a8b4d0; font-weight: 600; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid rgba(255,255,255,0.04); background: rgba(10,14,28,0.3); text-align: left; min-width: 80px;">User ID</th>
                                <th style="padding: 14px 14px; color: #a8b4d0; font-weight: 600; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid rgba(255,255,255,0.04); background: rgba(10,14,28,0.3); text-align: left; min-width: 100px;">Username</th>
                                <th style="padding: 14px 14px; color: #a8b4d0; font-weight: 600; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid rgba(255,255,255,0.04); background: rgba(10,14,28,0.3); text-align: left; min-width: 130px;">Document Type</th>
                                <th style="padding: 14px 14px; color: #a8b4d0; font-weight: 600; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid rgba(255,255,255,0.04); background: rgba(10,14,28,0.3); text-align: left; min-width: 150px;">Front</th>
                                <th style="padding: 14px 14px; color: #a8b4d0; font-weight: 600; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid rgba(255,255,255,0.04); background: rgba(10,14,28,0.3); text-align: left; min-width: 150px;">Back</th>
                                <th style="padding: 14px 14px; color: #a8b4d0; font-weight: 600; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid rgba(255,255,255,0.04); background: rgba(10,14,28,0.3); text-align: left; min-width: 160px;">Actions</th>
                            </tr>
                        </thead>
                        <tbody id="kycTableBody"><tr><td colspan="6" style="text-align:center; padding:30px; color:#6a7a9a;">Loading...</td></tr></tbody>
                    </table>
                </div>
                <div id="kycPendingPagination" style="display: flex; gap: 8px; justify-content: center; margin-top: 16px; flex-wrap: wrap;"></div>
            </div>
            
            <!-- 已验证面板 -->
            <div id="kycVerifiedPanel" class="kyc-panel" style="display: none;">
                <!-- 统计卡片 -->
                <div class="stats-grid" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 24px;">
                    <div class="stat-item" style="background: rgba(12, 16, 28, 0.6); border-radius: 16px; padding: 16px 20px; text-align: center; border: 1px solid rgba(255,255,255,0.04);">
                        <div class="label" style="font-size: 11px; color: #8892a8; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">Total KYC</div>
                        <div class="value" id="kycVerifiedStatTotal" style="font-size: 28px; font-weight: 700; color: #ffffff;">0</div>
                    </div>
                    <div class="stat-item" style="background: rgba(12, 16, 28, 0.6); border-radius: 16px; padding: 16px 20px; text-align: center; border: 1px solid rgba(255,255,255,0.04);">
                        <div class="label" style="font-size: 11px; color: #8892a8; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">KYC Approved</div>
                        <div class="value" id="kycVerifiedStatApproved" style="font-size: 28px; font-weight: 700; color: #ffffff;">0</div>
                    </div>
                    <div class="stat-item" style="background: rgba(12, 16, 28, 0.6); border-radius: 16px; padding: 16px 20px; text-align: center; border: 1px solid rgba(255,255,255,0.04);">
                        <div class="label" style="font-size: 11px; color: #8892a8; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">KYC Rejected</div>
                        <div class="value" id="kycVerifiedStatRejected" style="font-size: 28px; font-weight: 700; color: #ffffff;">0</div>
                    </div>
                </div>
                
                <!-- 搜索栏 -->
                <div class="search-bar" style="display: flex; flex-wrap: wrap; gap: 10px; align-items: center; background: rgba(8, 12, 24, 0.5); border-radius: 16px; padding: 12px 16px; margin-bottom: 20px; border: 1px solid rgba(255,255,255,0.03);">
                    <input type="text" id="kycVerifiedSearchInput" class="search-input" placeholder="Search UID / username" style="flex: 1; min-width: 160px; background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.10); border-radius: 40px; padding: 8px 16px; color: #e6edf5; font-size: 13px; outline: none;">
                    
                    <select id="kycVerifiedDocTypeFilter" style="min-width: 160px; flex-shrink: 0; background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.10); border-radius: 40px; padding: 8px 16px; color: #e6edf5; font-size: 13px; outline: none; cursor: pointer;">
                        <option value="">All Document Types</option>
                        <option value="passport">Passport</option>
                        <option value="resident_permit">Resident Permit</option>
                        <option value="driving_license_front">Driving License (Front)</option>
                        <option value="driving_license_back">Driving License (Back)</option>
                        <option value="national_id_front">National ID (Front)</option>
                        <option value="national_id_back">National ID (Back)</option>
                    </select>
                    
                    <button id="kycVerifiedSearchBtn" class="btn-primary" style="padding: 8px 20px; border-radius: 40px; border: none; background: #2a3a5a; color: #e6edf5; font-weight: 600; cursor: pointer; font-size: 13px; white-space: nowrap;"><i class="fas fa-search"></i> Search</button>
                    <button id="kycVerifiedClearBtn" class="btn-primary" style="padding: 8px 18px; border-radius: 40px; border: none; background: rgba(255,255,255,0.06); color: #b8c4de; font-weight: 500; cursor: pointer; font-size: 13px; white-space: nowrap;"><i class="fas fa-times"></i> Clear</button>
                </div>
                
                <div class="table-container" style="max-height: 500px; overflow-y: auto; border-radius: 16px; border: 1px solid rgba(255,255,255,0.03);">
                    <table class="data-table" style="width: 100%; border-collapse: collapse; font-size: 13px; min-width: 900px;">
                        <thead>
                            <tr>
                                <th style="padding: 14px 14px; color: #a8b4d0; font-weight: 600; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid rgba(255,255,255,0.04); background: rgba(10,14,28,0.3); text-align: left; min-width: 80px;">User ID</th>
                                <th style="padding: 14px 14px; color: #a8b4d0; font-weight: 600; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid rgba(255,255,255,0.04); background: rgba(10,14,28,0.3); text-align: left; min-width: 100px;">Username</th>
                                <th style="padding: 14px 14px; color: #a8b4d0; font-weight: 600; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid rgba(255,255,255,0.04); background: rgba(10,14,28,0.3); text-align: left; min-width: 130px;">Document Type</th>
                                <th style="padding: 14px 14px; color: #a8b4d0; font-weight: 600; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid rgba(255,255,255,0.04); background: rgba(10,14,28,0.3); text-align: left; min-width: 150px;">Front</th>
                                <th style="padding: 14px 14px; color: #a8b4d0; font-weight: 600; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid rgba(255,255,255,0.04); background: rgba(10,14,28,0.3); text-align: left; min-width: 150px;">Back</th>
                                <th style="padding: 14px 14px; color: #a8b4d0; font-weight: 600; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid rgba(255,255,255,0.04); background: rgba(10,14,28,0.3); text-align: left; min-width: 160px;">Status</th>
                            </tr>
                        </thead>
                        <tbody id="kycVerifiedTableBody"><tr><td colspan="6" style="text-align:center; padding:30px; color:#6a7a9a;">Loading...</td></tr></tbody>
                    </table>
                </div>
                <div id="kycVerifiedPagination" style="display: flex; gap: 8px; justify-content: center; margin-top: 16px; flex-wrap: wrap;"></div>
            </div>
        </div>
    `;
    
    // 添加样式（包含预览弹窗样式）
    const style = document.createElement('style');
    style.textContent = `
        .tab-kyc-btn {
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
        .tab-kyc-btn:hover {
            background: rgba(255,255,255,0.08);
            color: #e6edf5;
        }
        .tab-kyc-btn.active {
            background: #2a3a5a;
            color: #e6edf5;
            border-color: #3a5a7a;
        }
        .kyc-panel { animation: fadeIn 0.3s ease; }
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(8px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .kyc-doc-image {
            width: 80px;
            height: 60px;
            object-fit: cover;
            border-radius: 8px;
            cursor: pointer;
            border: 1px solid rgba(255,255,255,0.06);
            transition: 0.2s;
        }
        .kyc-doc-image:hover {
            transform: scale(1.02);
            border-color: rgba(200,176,144,0.3);
        }
        .kyc-doc-placeholder {
            width: 80px;
            height: 60px;
            border-radius: 8px;
            background: rgba(255,255,255,0.03);
            border: 1px dashed rgba(255,255,255,0.06);
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            color: #4a5a72;
            font-size: 10px;
            transition: 0.2s;
            cursor: pointer;
        }
        .kyc-doc-placeholder:hover {
            border-color: rgba(200,176,144,0.3);
            background: rgba(200,176,144,0.05);
        }
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
        .btn-sm-action:hover { opacity: 0.85; }
        .btn-approve { background: rgba(122, 208, 176, 0.15); color: #7ad0b0; }
        .btn-approve:hover { background: rgba(122, 208, 176, 0.25); }
        .btn-reject { background: rgba(232, 128, 128, 0.15); color: #e88080; }
        .btn-reject:hover { background: rgba(232, 128, 128, 0.25); }
        .status-badge-approved { background: rgba(122, 208, 176, 0.10); color: #7ad0b0; padding: 2px 12px; border-radius: 40px; font-size: 11px; display: inline-block; }
        .status-badge-rejected { background: rgba(232, 128, 128, 0.10); color: #e88080; padding: 2px 12px; border-radius: 40px; font-size: 11px; display: inline-block; }
        .status-badge-pending { background: rgba(212, 192, 154, 0.10); color: #d4c09a; padding: 2px 12px; border-radius: 40px; font-size: 11px; display: inline-block; }
        .page-btn {
            padding: 6px 14px;
            border-radius: 30px;
            border: 1px solid rgba(255,255,255,0.04);
            background: rgba(255,255,255,0.02);
            color: rgba(255,255,255,0.15);
            font-size: 12px;
            font-weight: 500;
            cursor: pointer;
            transition: 0.3s;
            font-family: 'Inter', sans-serif;
        }
        .page-btn:hover {
            border-color: rgba(214,178,94,0.06);
            color: rgba(255,255,255,0.25);
        }
        .page-btn.active {
            background: rgba(214,178,94,0.06);
            color: #c8b090;
            border-color: rgba(214,178,94,0.06);
        }
        .page-btn:disabled {
            opacity: 0.2;
            cursor: not-allowed;
        }
        .page-info {
            font-size: 11px;
            color: rgba(255,255,255,0.12);
            padding: 0 8px;
        }
        
        /* ===== 预览弹窗样式 ===== */
        .kyc-preview-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.92);
            backdrop-filter: blur(16px);
            -webkit-backdrop-filter: blur(16px);
            z-index: 99999;
            display: none;
            align-items: center;
            justify-content: center;
            animation: previewFadeIn 0.25s ease;
        }
        .kyc-preview-overlay.active {
            display: flex;
        }
        @keyframes previewFadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        @keyframes previewScaleIn {
            from { transform: scale(0.92); opacity: 0; }
            to { transform: scale(1); opacity: 1; }
        }
        .kyc-preview-content {
            position: relative;
            max-width: 92vw;
            max-height: 92vh;
            background: rgba(20, 24, 40, 0.95);
            border-radius: 24px;
            border: 1px solid rgba(201, 176, 149, 0.1);
            box-shadow: 0 30px 80px rgba(0, 0, 0, 0.6);
            overflow: hidden;
            animation: previewScaleIn 0.3s cubic-bezier(0.2, 0.9, 0.4, 1.1) forwards;
        }
        .kyc-preview-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 16px 24px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.04);
        }
        .kyc-preview-header .file-info {
            display: flex;
            align-items: center;
            gap: 12px;
        }
        .kyc-preview-header .file-info .file-type-badge {
            font-size: 11px;
            font-weight: 600;
            padding: 4px 14px;
            border-radius: 20px;
            background: rgba(201, 176, 149, 0.1);
            color: #c8b090;
        }
        .kyc-preview-header .file-info .file-name {
            font-size: 14px;
            color: #d8e0f0;
            font-weight: 500;
            max-width: 300px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }
        .kyc-preview-close {
            width: 36px;
            height: 36px;
            border-radius: 50%;
            background: rgba(255, 255, 255, 0.04);
            border: 1px solid rgba(255, 255, 255, 0.06);
            color: #6a7a92;
            cursor: pointer;
            font-size: 18px;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: 0.25s;
        }
        .kyc-preview-close:hover {
            background: rgba(232, 128, 128, 0.12);
            color: #e88080;
        }
        .kyc-preview-body {
            padding: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 200px;
            max-height: 75vh;
            overflow: auto;
        }
        .kyc-preview-body img {
            max-width: 100%;
            max-height: 70vh;
            border-radius: 12px;
            object-fit: contain;
        }
        .kyc-preview-body iframe {
            width: 100%;
            height: 70vh;
            border: none;
            border-radius: 12px;
            background: rgba(0, 0, 0, 0.2);
        }
        .kyc-preview-body .file-preview-placeholder {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 60px 40px;
            color: #6a7a92;
            text-align: center;
        }
        .kyc-preview-body .file-preview-placeholder i {
            font-size: 64px;
            color: #c8b090;
            margin-bottom: 16px;
        }
        .kyc-preview-body .file-preview-placeholder .preview-label {
            font-size: 14px;
            color: #c8b090;
            font-weight: 500;
        }
        .kyc-preview-body .file-preview-placeholder .preview-hint {
            font-size: 12px;
            color: #5a6a82;
            margin-top: 8px;
        }
        .kyc-preview-body .file-preview-placeholder .download-link {
            margin-top: 16px;
            padding: 8px 24px;
            border-radius: 40px;
            background: rgba(201, 176, 149, 0.1);
            border: 1px solid rgba(201, 176, 149, 0.2);
            color: #c8b090;
            text-decoration: none;
            font-size: 13px;
            transition: 0.2s;
        }
        .kyc-preview-body .file-preview-placeholder .download-link:hover {
            background: rgba(201, 176, 149, 0.2);
        }
        .kyc-preview-body .video-preview {
            max-width: 100%;
            max-height: 70vh;
            border-radius: 12px;
        }
        .kyc-preview-body .audio-preview {
            width: 100%;
            max-width: 500px;
        }
        @media (max-width: 768px) {
            .kyc-preview-content {
                max-width: 96vw;
                max-height: 96vh;
            }
            .kyc-preview-header .file-info .file-name {
                max-width: 150px;
                font-size: 12px;
            }
            .kyc-preview-body {
                padding: 12px;
                max-height: 70vh;
            }
            .kyc-preview-body iframe {
                height: 50vh;
            }
        }
        @media (max-width: 600px) {
            .stats-grid { grid-template-columns: repeat(2, 1fr) !important; }
            .tab-kyc-btn { font-size: 12px; padding: 6px 14px; }
            .search-bar { flex-direction: column; align-items: stretch; }
            .search-bar input, .search-bar select { width: 100% !important; min-width: unset; flex: 1 1 auto !important; }
        }
    `;
    document.head.appendChild(style);
    
    // 绑定标签切换
    document.getElementById('kycTabPending')?.addEventListener('click', function() { 
        kycCurrentPage = 1;
        switchKycTab('pending'); 
    });
    document.getElementById('kycTabVerified')?.addEventListener('click', function() { 
        kycCurrentPage = 1;
        switchKycTab('verified'); 
    });
    document.getElementById('refreshKycBtn')?.addEventListener('click', function() { 
        kycCurrentPage = 1;
        loadKycPending(); 
        loadKycVerified(); 
        updateKycStats();
    });
    
    // 绑定待处理搜索
    document.getElementById('kycSearchBtn')?.addEventListener('click', function() {
        kycSearchKeyword = document.getElementById('kycSearchInput').value.trim();
        kycCurrentPage = 1;
        loadKycPending();
    });
    document.getElementById('kycSearchInput')?.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            kycSearchKeyword = document.getElementById('kycSearchInput').value.trim();
            kycCurrentPage = 1;
            loadKycPending();
        }
    });
    
    // 绑定已验证搜索
    document.getElementById('kycVerifiedSearchBtn')?.addEventListener('click', function() {
        kycSearchKeyword = document.getElementById('kycVerifiedSearchInput').value.trim();
        kycCurrentPage = 1;
        loadKycVerified();
    });
    document.getElementById('kycVerifiedClearBtn')?.addEventListener('click', function() {
        document.getElementById('kycVerifiedSearchInput').value = '';
        document.getElementById('kycVerifiedDocTypeFilter').value = '';
        kycSearchKeyword = '';
        kycCurrentPage = 1;
        loadKycVerified();
    });
    document.getElementById('kycVerifiedSearchInput')?.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            kycSearchKeyword = document.getElementById('kycVerifiedSearchInput').value.trim();
            kycCurrentPage = 1;
            loadKycVerified();
        }
    });
    
    // 加载数据
    await loadKycPending();
    await loadKycVerified();
    await updateKycStats();
}

function switchKycTab(tab) {
    activeTab = tab;
    
    var pendingBtn = document.getElementById('kycTabPending');
    var verifiedBtn = document.getElementById('kycTabVerified');
    var pendingPanel = document.getElementById('kycPendingPanel');
    var verifiedPanel = document.getElementById('kycVerifiedPanel');
    
    pendingBtn.classList.remove('active');
    verifiedBtn.classList.remove('active');
    
    if (tab === 'pending') {
        pendingBtn.classList.add('active');
        pendingPanel.style.display = 'block';
        verifiedPanel.style.display = 'none';
        loadKycPending();
    } else {
        verifiedBtn.classList.add('active');
        pendingPanel.style.display = 'none';
        verifiedPanel.style.display = 'block';
        loadKycVerified();
    }
}

async function updateKycStats() {
    try {
        const totalRes = await sb.from('kyc_verifications').select('id', { count: 'exact', head: true });
        const pendingRes = await sb.from('kyc_verifications').select('id', { count: 'exact', head: true }).eq('status', 'pending');
        const approvedRes = await sb.from('kyc_verifications').select('id', { count: 'exact', head: true }).eq('status', 'approved');
        const rejectedRes = await sb.from('kyc_verifications').select('id', { count: 'exact', head: true }).eq('status', 'rejected');
        
        document.getElementById('kycStatTotal').innerText = totalRes.count || 0;
        document.getElementById('kycStatPending').innerText = pendingRes.count || 0;
        
        document.getElementById('kycVerifiedStatTotal').innerText = totalRes.count || 0;
        document.getElementById('kycVerifiedStatApproved').innerText = approvedRes.count || 0;
        document.getElementById('kycVerifiedStatRejected').innerText = rejectedRes.count || 0;
    } catch (e) {
        console.error('更新KYC统计失败:', e);
    }
}

// ============================================================
// 🔥 预览弹窗函数（所有文件类型通用）
// ============================================================
function openKycPreview(url, fileType, fileName) {
    // 移除已有弹窗
    const existing = document.querySelector('.kyc-preview-overlay');
    if (existing) existing.remove();
    
    const safeUrl = getSafeImageUrl(url);
    const lowerUrl = url.toLowerCase();
    const typeInfo = getFileTypeInfo(url);
    
    // 构建弹窗
    const overlay = document.createElement('div');
    overlay.className = 'kyc-preview-overlay active';
    
    let bodyContent = '';
    
    // 判断文件类型并生成预览内容
    const isImage = typeInfo.type === 'image';
    const isHeic = typeInfo.type === 'heic';
    const isPdf = typeInfo.type === 'pdf';
    const isVideo = typeInfo.type === 'video';
    const isAudio = typeInfo.type === 'audio';
    const isWord = typeInfo.type === 'word';
    const isExcel = typeInfo.type === 'excel';
    const isPowerpoint = typeInfo.type === 'powerpoint';
    const isText = typeInfo.type === 'text' || typeInfo.type === 'richtext' || typeInfo.type === 'code';
    const isArchive = typeInfo.type === 'archive';
    const isUnknown = typeInfo.type === 'unknown';
    
    if (isImage) {
        // 图片：直接显示
        bodyContent = `<img src="${safeUrl}" alt="KYC Document" onerror="this.outerHTML='<div class=\\'file-preview-placeholder\\'><i class=\\'fas fa-file-image\\'></i><div class=\\'preview-label\\'>Image</div><div class=\\'preview-hint\\'>Failed to load image</div><a href=\\'${safeUrl}\\' target=\\'_blank\\' class=\\'download-link\\'><i class=\\'fas fa-download\\'></i> Download</a></div>'">`;
    } else if (isPdf) {
        // PDF：使用 iframe 内嵌显示
        bodyContent = `<iframe src="${safeUrl}#toolbar=1" frameborder="0"></iframe>`;
    } else if (isHeic) {
        // HEIC：无法直接预览，显示下载提示
        bodyContent = `
            <div class="file-preview-placeholder">
                <i class="fas fa-file-image"></i>
                <div class="preview-label">HEIC Image</div>
                <div class="preview-hint">HEIC format cannot be previewed directly in browser</div>
                <a href="${safeUrl}" target="_blank" class="download-link"><i class="fas fa-download"></i> Download & View</a>
            </div>
        `;
    } else if (isVideo) {
        // 视频：使用 video 标签
        bodyContent = `<video src="${safeUrl}" controls class="video-preview" autoplay></video>`;
    } else if (isAudio) {
        // 音频：使用 audio 标签
        bodyContent = `<audio src="${safeUrl}" controls class="audio-preview" autoplay></audio>`;
    } else if (isWord || isExcel || isPowerpoint) {
        // Office 文档：使用 Google Docs Viewer 或下载
        const docType = isWord ? 'Word' : isExcel ? 'Excel' : 'PowerPoint';
        bodyContent = `
            <div class="file-preview-placeholder">
                <i class="fas ${typeInfo.icon}"></i>
                <div class="preview-label">${docType} Document</div>
                <div class="preview-hint">Office documents cannot be previewed directly in browser</div>
                <a href="${safeUrl}" target="_blank" class="download-link"><i class="fas fa-download"></i> Download & View</a>
            </div>
        `;
    } else if (isText) {
        // 文本/代码文件：尝试使用 iframe 加载
        bodyContent = `<iframe src="${safeUrl}" frameborder="0"></iframe>`;
    } else if (isArchive) {
        // 压缩包：显示下载提示
        bodyContent = `
            <div class="file-preview-placeholder">
                <i class="fas ${typeInfo.icon}"></i>
                <div class="preview-label">${typeInfo.label} Archive</div>
                <div class="preview-hint">Archive files cannot be previewed directly in browser</div>
                <a href="${safeUrl}" target="_blank" class="download-link"><i class="fas fa-download"></i> Download</a>
            </div>
        `;
    } else {
        // 未知格式：显示下载提示
        bodyContent = `
            <div class="file-preview-placeholder">
                <i class="fas ${typeInfo.icon}"></i>
                <div class="preview-label">${typeInfo.label}</div>
                <div class="preview-hint">This file type cannot be previewed directly in browser</div>
                <a href="${safeUrl}" target="_blank" class="download-link"><i class="fas fa-download"></i> Download</a>
            </div>
        `;
    }
    
    const displayName = fileName || url.split('/').pop() || 'KYC Document';
    const badgeLabel = typeInfo.label || 'File';
    
    overlay.innerHTML = `
        <div class="kyc-preview-content">
            <div class="kyc-preview-header">
                <div class="file-info">
                    <span class="file-type-badge">${badgeLabel}</span>
                    <span class="file-name">${escapeHtml(displayName)}</span>
                </div>
                <button class="kyc-preview-close" onclick="closeKycPreview()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="kyc-preview-body">
                ${bodyContent}
            </div>
        </div>
    `;
    
    document.body.appendChild(overlay);
    
    // 点击遮罩关闭
    overlay.addEventListener('click', function(e) {
        if (e.target === this) {
            closeKycPreview();
        }
    });
    
    // ESC 键关闭
    document.addEventListener('keydown', function escHandler(e) {
        if (e.key === 'Escape') {
            closeKycPreview();
            document.removeEventListener('keydown', escHandler);
        }
    });
}

function closeKycPreview() {
    const overlay = document.querySelector('.kyc-preview-overlay');
    if (overlay) overlay.remove();
}

// ============================================================
// 批量获取用户名（缓存优化）
// ============================================================
async function getUsernameBatch(uids) {
    const result = {};
    const uncached = [];
    
    for (const uid of uids) {
        if (usernameCache[uid]) {
            result[uid] = usernameCache[uid];
        } else {
            uncached.push(uid);
        }
    }
    
    if (uncached.length > 0) {
        try {
            const { data } = await sb
                .from('users')
                .select('uid, username')
                .in('uid', uncached);
            if (data) {
                data.forEach(u => {
                    usernameCache[u.uid] = u.username || u.uid;
                    result[u.uid] = usernameCache[u.uid];
                });
            }
        } catch (e) {
            console.error('批量获取用户名失败:', e);
        }
        // 未找到的用户使用 uid
        uncached.forEach(uid => {
            if (!result[uid]) {
                result[uid] = uid;
                usernameCache[uid] = uid;
            }
        });
    }
    
    return result;
}

// ============================================================
// 生成安全图片URL
// ============================================================
function getSafeImageUrl(url) {
    if (!url) return null;
    try {
        const encoded = encodeURI(url);
        return encoded;
    } catch (e) {
        return url;
    }
}

// ============================================================
// 获取文件类型和图标
// ============================================================
function getFileTypeInfo(url) {
    if (!url) return { type: 'unknown', icon: 'fa-file', label: 'File' };
    
    const lowerUrl = url.toLowerCase();
    
    // 图片格式
    const imageFormats = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg', '.ico', '.tiff', '.tif'];
    for (const ext of imageFormats) {
        if (lowerUrl.endsWith(ext)) {
            return { type: 'image', icon: 'fa-file-image', label: ext.substring(1).toUpperCase() };
        }
    }
    
    // HEIC/HEIF (苹果图片格式)
    if (lowerUrl.endsWith('.heic') || lowerUrl.endsWith('.heif')) {
        return { type: 'heic', icon: 'fa-file-image', label: 'HEIC' };
    }
    
    // 文档格式
    if (lowerUrl.endsWith('.pdf')) {
        return { type: 'pdf', icon: 'fa-file-pdf', label: 'PDF' };
    }
    if (lowerUrl.endsWith('.doc') || lowerUrl.endsWith('.docx')) {
        return { type: 'word', icon: 'fa-file-word', label: 'DOC' };
    }
    if (lowerUrl.endsWith('.xls') || lowerUrl.endsWith('.xlsx')) {
        return { type: 'excel', icon: 'fa-file-excel', label: 'XLS' };
    }
    if (lowerUrl.endsWith('.ppt') || lowerUrl.endsWith('.pptx')) {
        return { type: 'powerpoint', icon: 'fa-file-powerpoint', label: 'PPT' };
    }
    if (lowerUrl.endsWith('.txt')) {
        return { type: 'text', icon: 'fa-file-alt', label: 'TXT' };
    }
    if (lowerUrl.endsWith('.rtf')) {
        return { type: 'richtext', icon: 'fa-file-alt', label: 'RTF' };
    }
    
    // 视频格式
    const videoFormats = ['.mp4', '.mov', '.avi', '.mkv', '.wmv', '.flv', '.webm', '.m4v', '.3gp'];
    for (const ext of videoFormats) {
        if (lowerUrl.endsWith(ext)) {
            return { type: 'video', icon: 'fa-file-video', label: ext.substring(1).toUpperCase() };
        }
    }
    
    // 音频格式
    const audioFormats = ['.mp3', '.wav', '.aac', '.flac', '.ogg', '.wma', '.m4a'];
    for (const ext of audioFormats) {
        if (lowerUrl.endsWith(ext)) {
            return { type: 'audio', icon: 'fa-file-audio', label: ext.substring(1).toUpperCase() };
        }
    }
    
    // 压缩包格式
    const archiveFormats = ['.zip', '.rar', '.7z', '.tar', '.gz', '.bz2'];
    for (const ext of archiveFormats) {
        if (lowerUrl.endsWith(ext)) {
            return { type: 'archive', icon: 'fa-file-archive', label: ext.substring(1).toUpperCase() };
        }
    }
    
    // 代码格式
    const codeFormats = ['.js', '.ts', '.py', '.java', '.cpp', '.c', '.h', '.html', '.css', '.json', '.xml', '.yaml', '.yml', '.sh', '.bat', '.ps1'];
    for (const ext of codeFormats) {
        if (lowerUrl.endsWith(ext)) {
            return { type: 'code', icon: 'fa-file-code', label: ext.substring(1).toUpperCase() };
        }
    }
    
    // 未知格式
    return { type: 'unknown', icon: 'fa-file', label: 'File' };
}

// ============================================================
// 🔥 核心函数：渲染任何类型的文件（所有文件点击打开预览弹窗）
// ============================================================
function renderKycImage(url, alt, placeholderText) {
    if (!url) {
        return `<div class="kyc-doc-placeholder">${placeholderText || 'No Image'}</div>`;
    }
    
    const safeUrl = getSafeImageUrl(url);
    const fileInfo = getFileTypeInfo(url);
    const fileName = url.split('/').pop() || 'File';
    
    // 🔥 所有文件点击都打开预览弹窗
    const previewClick = `openKycPreview('${safeUrl}', '${fileInfo.type}', '${escapeHtml(fileName)}')`;
    
    // 🔥 如果是图片格式，显示缩略图
    if (fileInfo.type === 'image') {
        return `<img data-src="${safeUrl}" src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='60'%3E%3Crect width='80' height='60' fill='rgba(255,255,255,0.02)'/%3E%3C/svg%3E" class="kyc-doc-image lazy-kyc" onclick="${previewClick}" onerror="this.outerHTML='<div class=\\'kyc-doc-placeholder\\' onclick=\\'${previewClick}\\'><i class=\\'fas fa-file-image\\' style=\\'font-size:20px; color:#c8b090; display:block; margin-bottom:4px;\\'></i><span style=\\'font-size:9px; color:#c8b090;\\'>Image</span></div>'" alt="${alt || 'KYC Image'}">`;
    }
    
    // 🔥 HEIC 格式
    if (fileInfo.type === 'heic') {
        return `<div class="kyc-doc-placeholder" onclick="${previewClick}">
            <i class="fas fa-file-image" style="font-size:20px; color:#c8b090; display:block; margin-bottom:4px;"></i>
            <span style="font-size:9px; color:#c8b090;">HEIC</span>
        </div>`;
    }
    
    // 🔥 PDF 格式
    if (fileInfo.type === 'pdf') {
        return `<div class="kyc-doc-placeholder" onclick="${previewClick}">
            <i class="fas fa-file-pdf" style="font-size:20px; color:#e88080; display:block; margin-bottom:4px;"></i>
            <span style="font-size:9px; color:#e88080;">PDF</span>
        </div>`;
    }
    
    // 🔥 Word 文档
    if (fileInfo.type === 'word') {
        return `<div class="kyc-doc-placeholder" onclick="${previewClick}">
            <i class="fas fa-file-word" style="font-size:20px; color:#2b579a; display:block; margin-bottom:4px;"></i>
            <span style="font-size:9px; color:#2b579a;">DOC</span>
        </div>`;
    }
    
    // 🔥 Excel 文档
    if (fileInfo.type === 'excel') {
        return `<div class="kyc-doc-placeholder" onclick="${previewClick}">
            <i class="fas fa-file-excel" style="font-size:20px; color:#217346; display:block; margin-bottom:4px;"></i>
            <span style="font-size:9px; color:#217346;">XLS</span>
        </div>`;
    }
    
    // 🔥 PowerPoint 文档
    if (fileInfo.type === 'powerpoint') {
        return `<div class="kyc-doc-placeholder" onclick="${previewClick}">
            <i class="fas fa-file-powerpoint" style="font-size:20px; color:#cb4154; display:block; margin-bottom:4px;"></i>
            <span style="font-size:9px; color:#cb4154;">PPT</span>
        </div>`;
    }
    
    // 🔥 文本文件
    if (fileInfo.type === 'text' || fileInfo.type === 'richtext') {
        return `<div class="kyc-doc-placeholder" onclick="${previewClick}">
            <i class="fas fa-file-alt" style="font-size:20px; color:#c8b090; display:block; margin-bottom:4px;"></i>
            <span style="font-size:9px; color:#c8b090;">${fileInfo.label}</span>
        </div>`;
    }
    
    // 🔥 视频文件
    if (fileInfo.type === 'video') {
        return `<div class="kyc-doc-placeholder" onclick="${previewClick}">
            <i class="fas fa-file-video" style="font-size:20px; color:#ff6b6b; display:block; margin-bottom:4px;"></i>
            <span style="font-size:9px; color:#ff6b6b;">${fileInfo.label}</span>
        </div>`;
    }
    
    // 🔥 音频文件
    if (fileInfo.type === 'audio') {
        return `<div class="kyc-doc-placeholder" onclick="${previewClick}">
            <i class="fas fa-file-audio" style="font-size:20px; color:#4a7cff; display:block; margin-bottom:4px;"></i>
            <span style="font-size:9px; color:#4a7cff;">${fileInfo.label}</span>
        </div>`;
    }
    
    // 🔥 压缩包
    if (fileInfo.type === 'archive') {
        return `<div class="kyc-doc-placeholder" onclick="${previewClick}">
            <i class="fas fa-file-archive" style="font-size:20px; color:#ffb84d; display:block; margin-bottom:4px;"></i>
            <span style="font-size:9px; color:#ffb84d;">${fileInfo.label}</span>
        </div>`;
    }
    
    // 🔥 代码文件
    if (fileInfo.type === 'code') {
        return `<div class="kyc-doc-placeholder" onclick="${previewClick}">
            <i class="fas fa-file-code" style="font-size:20px; color:#4ade80; display:block; margin-bottom:4px;"></i>
            <span style="font-size:9px; color:#4ade80;">${fileInfo.label}</span>
        </div>`;
    }
    
    // 🔥 未知格式 - 通用文件图标
    return `<div class="kyc-doc-placeholder" onclick="${previewClick}">
        <i class="fas fa-file" style="font-size:20px; color:#c8b090; display:block; margin-bottom:4px;"></i>
        <span style="font-size:9px; color:#c8b090;">${fileInfo.label}</span>
    </div>`;
}

// ============================================================
// 图片懒加载
// ============================================================
function setupKycLazyLoading() {
    if (kycImageObserver) {
        kycImageObserver.disconnect();
    }
    
    if ('IntersectionObserver' in window) {
        kycImageObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    const src = img.dataset.src;
                    if (src) {
                        img.src = src;
                        img.removeAttribute('data-src');
                    }
                    kycImageObserver.unobserve(img);
                }
            });
        }, { rootMargin: '50px' });
        
        document.querySelectorAll('.lazy-kyc').forEach(img => {
            kycImageObserver.observe(img);
        });
    } else {
        document.querySelectorAll('.lazy-kyc').forEach(img => {
            const src = img.dataset.src;
            if (src) {
                img.src = src;
                img.removeAttribute('data-src');
            }
        });
    }
}

// ============================================================
// 分页渲染
// ============================================================
function renderKycPagination(containerId, currentPage, totalCount, pageSize, callback) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    container.innerHTML = '';
    const totalPages = Math.ceil(totalCount / pageSize);
    
    if (totalPages <= 1) return;
    
    const prevBtn = document.createElement('button');
    prevBtn.className = 'page-btn';
    prevBtn.innerHTML = '<i class="fas fa-chevron-left"></i>';
    prevBtn.disabled = currentPage <= 1;
    prevBtn.onclick = function() {
        if (currentPage > 1) {
            callback(currentPage - 1);
        }
    };
    container.appendChild(prevBtn);
    
    const startPage = Math.max(1, currentPage - 2);
    const endPage = Math.min(totalPages, currentPage + 2);
    
    if (startPage > 1) {
        const btn = document.createElement('button');
        btn.className = 'page-btn';
        btn.textContent = '1';
        btn.onclick = function() { callback(1); };
        container.appendChild(btn);
        if (startPage > 2) {
            const ellipsis = document.createElement('span');
            ellipsis.textContent = '…';
            ellipsis.style.cssText = 'color: #4a5a72; padding: 0 4px;';
            container.appendChild(ellipsis);
        }
    }
    
    for (let i = startPage; i <= endPage; i++) {
        const btn = document.createElement('button');
        btn.className = 'page-btn' + (i === currentPage ? ' active' : '');
        btn.textContent = i;
        btn.onclick = function() { callback(i); };
        container.appendChild(btn);
    }
    
    if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
            const ellipsis = document.createElement('span');
            ellipsis.textContent = '…';
            ellipsis.style.cssText = 'color: #4a5a72; padding: 0 4px;';
            container.appendChild(ellipsis);
        }
        const btn = document.createElement('button');
        btn.className = 'page-btn';
        btn.textContent = totalPages;
        btn.onclick = function() { callback(totalPages); };
        container.appendChild(btn);
    }
    
    const nextBtn = document.createElement('button');
    nextBtn.className = 'page-btn';
    nextBtn.innerHTML = '<i class="fas fa-chevron-right"></i>';
    nextBtn.disabled = currentPage >= totalPages;
    nextBtn.onclick = function() {
        if (currentPage < totalPages) {
            callback(currentPage + 1);
        }
    };
    container.appendChild(nextBtn);
    
    const info = document.createElement('span');
    info.className = 'page-info';
    const from = (currentPage - 1) * pageSize + 1;
    const to = Math.min(currentPage * pageSize, totalCount);
    info.textContent = from + '-' + to + ' of ' + totalCount;
    container.appendChild(info);
}

// ============================================================
// 加载待处理 KYC
// ============================================================
async function loadKycPending(page) {
    if (page !== undefined) kycCurrentPage = page;
    
    const tbody = document.getElementById('kycTableBody');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:30px; color:#6a7a9a;"><i class="fas fa-spinner fa-spin"></i> Loading...</td></tr>';
    
    try {
        let query = sb.from('kyc_verifications')
            .select('*', { count: 'exact' })
            .eq('status', 'pending')
            .order('uploaded_at', { ascending: false });
        
        const keyword = document.getElementById('kycSearchInput')?.value.trim() || '';
        const docType = document.getElementById('kycDocTypeFilter')?.value || '';
        
        if (keyword) {
            const { data: matchedUsers } = await sb
                .from('users')
                .select('uid')
                .or(`uid.ilike.%${keyword}%,username.ilike.%${keyword}%`)
                .limit(50);
            if (matchedUsers && matchedUsers.length > 0) {
                const uids = matchedUsers.map(u => u.uid);
                query = query.in('uid', uids);
            } else {
                query = query.ilike('uid', `%${keyword}%`);
            }
        }
        if (docType) {
            query = query.eq('document_type', docType);
        }
        
        const { data: kycList, error, count } = await query
            .range((kycCurrentPage - 1) * KYC_PAGE_SIZE, kycCurrentPage * KYC_PAGE_SIZE - 1);
        
        if (error) throw error;
        
        kycTotalCount = count || 0;
        
        if (!kycList || kycList.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:30px; color:#6a7a9a;">No pending KYC records</td></tr>';
            document.getElementById('kycPendingPagination').innerHTML = '';
            return;
        }
        
        const uids = [...new Set(kycList.map(item => item.uid))];
        const userMap = await getUsernameBatch(uids);
        
        const userGroups = {};
        for (const item of kycList) {
            if (!userGroups[item.uid]) userGroups[item.uid] = [];
            userGroups[item.uid].push(item);
        }
        
        tbody.innerHTML = '';
        
        for (const [uid, items] of Object.entries(userGroups)) {
            const row = tbody.insertRow();
            const username = userMap[uid] || uid;
            
            const nationalIdFront = items.find(i => i.document_type === 'national_id_front');
            const nationalIdBack = items.find(i => i.document_type === 'national_id_back');
            const passport = items.find(i => i.document_type === 'passport');
            const residentPermit = items.find(i => i.document_type === 'resident_permit');
            const drivingLicenseFront = items.find(i => i.document_type === 'driving_license_front');
            const drivingLicenseBack = items.find(i => i.document_type === 'driving_license_back');
            
            let docTypeDisplay = '-';
            if (passport) docTypeDisplay = 'Passport';
            else if (residentPermit) docTypeDisplay = 'Resident Permit';
            else if (drivingLicenseFront) docTypeDisplay = 'Driving License';
            else if (nationalIdFront) docTypeDisplay = 'National ID';
            
            const hasPending = items.some(i => i.status === 'pending');
            
            const frontImg = nationalIdFront || passport || residentPermit || drivingLicenseFront;
            const frontHtml = renderKycImage(frontImg?.image_url, 'Front', 'No Image');
            
            let backHtml = '';
            if (nationalIdBack && nationalIdBack.image_url) {
                backHtml = renderKycImage(nationalIdBack.image_url, 'Back', 'No Back');
            } else if (drivingLicenseBack && drivingLicenseBack.image_url) {
                backHtml = renderKycImage(drivingLicenseBack.image_url, 'Back', 'No Back');
            } else if (passport || residentPermit) {
                backHtml = '<div class="kyc-doc-placeholder" style="border-color:transparent;">—</div>';
            } else {
                backHtml = '<div class="kyc-doc-placeholder">No Back</div>';
            }
            
            let actionsHtml = '';
            if (hasPending) {
                actionsHtml = `
                    <div style="display: flex; gap: 6px; flex-wrap: nowrap; align-items: center; justify-content: flex-start;">
                        <button class="btn-sm-action btn-approve approve-kyc" data-uid="${uid}" style="white-space: nowrap; flex-shrink: 0;">
                            <i class="fas fa-check"></i> Approve
                        </button>
                        <button class="btn-sm-action btn-reject reject-kyc" data-uid="${uid}" style="white-space: nowrap; flex-shrink: 0;">
                            <i class="fas fa-times"></i> Reject
                        </button>
                    </div>
                `;
            } else {
                actionsHtml = `<span class="status-badge-rejected">Rejected</span>`;
            }
            
            row.insertCell(0).innerHTML = `<span class="badge" style="background: rgba(255,255,255,0.08); padding: 2px 12px; border-radius: 20px; font-size: 11px; color: #c8d2e8; border: 1px solid rgba(255,255,255,0.06);">${escapeHtml(uid)}</span>`;
            row.insertCell(1).innerText = username;
            row.insertCell(2).innerHTML = `<span style="font-size:12px; color:#b0c0da;">${docTypeDisplay}</span>`;
            row.insertCell(3).innerHTML = frontHtml;
            row.insertCell(4).innerHTML = backHtml;
            row.insertCell(5).innerHTML = actionsHtml;
        }
        
        document.querySelectorAll('.approve-kyc').forEach(btn => btn.addEventListener('click', async () => {
            const uid = btn.dataset.uid;
            showConfirm('Approve KYC', `Confirm to approve KYC for user ${uid}?`, async () => {
                await sb.from('kyc_verifications').update({ status: 'approved', approved_at: new Date().toISOString() }).eq('uid', uid).eq('status', 'pending');
                await sb.from('user_kyc_status').upsert({ uid: uid, is_verified: true });
                await loadKycPending(kycCurrentPage);
                await loadKycVerified();
                await updateKycStats();
                if (window.loadDashboardPage) window.loadDashboardPage(currentDays);
                showToast(`✅ KYC approved for ${uid}`, 'success');
            });
        }));

        document.querySelectorAll('.reject-kyc').forEach(btn => btn.addEventListener('click', async () => {
            const uid = btn.dataset.uid;
            showConfirm('Reject KYC', `Confirm to reject KYC for user ${uid}?`, async () => {
                await sb.from('kyc_verifications').update({ status: 'rejected' }).eq('uid', uid).eq('status', 'pending');
                await loadKycPending(kycCurrentPage);
                await loadKycVerified();
                await updateKycStats();
                showToast(`❌ KYC rejected for ${uid}`, 'info');
            });
        }));
        
        setTimeout(setupKycLazyLoading, 100);
        
        renderKycPagination('kycPendingPagination', kycCurrentPage, kycTotalCount, KYC_PAGE_SIZE, (page) => {
            loadKycPending(page);
        });
        
    } catch (e) {
        console.error('加载KYC待处理失败:', e);
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:30px; color:#ff8888;">加载失败: ${escapeHtml(e.message)}</td></tr>`;
    }
}

// ============================================================
// 加载已审核 KYC（最新优先）
// ============================================================
async function loadKycVerified(page) {
    if (page !== undefined) kycCurrentPage = page;
    
    const tbody = document.getElementById('kycVerifiedTableBody');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:30px; color:#6a7a9a;"><i class="fas fa-spinner fa-spin"></i> Loading...</td></tr>';
    
    try {
        let query = sb.from('kyc_verifications')
            .select('*', { count: 'exact' })
            .in('status', ['approved', 'rejected'])
            .order('uploaded_at', { ascending: false });
        
        const keyword = document.getElementById('kycVerifiedSearchInput')?.value.trim() || '';
        const docType = document.getElementById('kycVerifiedDocTypeFilter')?.value || '';
        
        if (keyword) {
            const { data: matchedUsers } = await sb
                .from('users')
                .select('uid')
                .or(`uid.ilike.%${keyword}%,username.ilike.%${keyword}%`)
                .limit(50);
            if (matchedUsers && matchedUsers.length > 0) {
                const uids = matchedUsers.map(u => u.uid);
                query = query.in('uid', uids);
            } else {
                query = query.ilike('uid', `%${keyword}%`);
            }
        }
        if (docType) {
            query = query.eq('document_type', docType);
        }
        
        const { data: kycList, error, count } = await query
            .range((kycCurrentPage - 1) * KYC_PAGE_SIZE, kycCurrentPage * KYC_PAGE_SIZE - 1);
        
        if (error) throw error;
        
        kycTotalCount = count || 0;
        
        if (!kycList || kycList.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:30px; color:#6a7a9a;">No history records</td></tr>';
            document.getElementById('kycVerifiedPagination').innerHTML = '';
            return;
        }
        
        const uids = [...new Set(kycList.map(item => item.uid))];
        const userMap = await getUsernameBatch(uids);
        
        const userGroups = {};
        for (const item of kycList) {
            if (!userGroups[item.uid]) userGroups[item.uid] = [];
            userGroups[item.uid].push(item);
        }
        
        tbody.innerHTML = '';
        
        for (const [uid, items] of Object.entries(userGroups)) {
            const row = tbody.insertRow();
            const username = userMap[uid] || uid;
            
            const nationalIdFront = items.find(i => i.document_type === 'national_id_front');
            const nationalIdBack = items.find(i => i.document_type === 'national_id_back');
            const passport = items.find(i => i.document_type === 'passport');
            const residentPermit = items.find(i => i.document_type === 'resident_permit');
            const drivingLicenseFront = items.find(i => i.document_type === 'driving_license_front');
            const drivingLicenseBack = items.find(i => i.document_type === 'driving_license_back');
            
            let docTypeDisplay = '-';
            if (passport) docTypeDisplay = 'Passport';
            else if (residentPermit) docTypeDisplay = 'Resident Permit';
            else if (drivingLicenseFront) docTypeDisplay = 'Driving License';
            else if (nationalIdFront) docTypeDisplay = 'National ID';
            
            const frontImg = nationalIdFront || passport || residentPermit || drivingLicenseFront;
            const frontHtml = renderKycImage(frontImg?.image_url, 'Front', 'No Image');
            
            let backHtml = '';
            if (nationalIdBack && nationalIdBack.image_url) {
                backHtml = renderKycImage(nationalIdBack.image_url, 'Back', 'No Back');
            } else if (drivingLicenseBack && drivingLicenseBack.image_url) {
                backHtml = renderKycImage(drivingLicenseBack.image_url, 'Back', 'No Back');
            } else if (passport || residentPermit) {
                backHtml = '<div class="kyc-doc-placeholder" style="border-color:transparent;">—</div>';
            } else {
                backHtml = '<div class="kyc-doc-placeholder">No Back</div>';
            }
            
            const allApproved = items.every(i => i.status === 'approved');
            const allRejected = items.every(i => i.status === 'rejected');
            let statusHtml = '';
            if (allApproved) {
                statusHtml = '<span class="status-badge-approved">✅ Approved</span>';
            } else if (allRejected) {
                statusHtml = '<span class="status-badge-rejected">❌ Rejected</span>';
            } else {
                const statuses = items.map(i => i.status).join(', ');
                statusHtml = `<span style="font-size: 11px; color: #b0c0da;">${statuses}</span>`;
            }
            
            row.insertCell(0).innerHTML = `<span class="badge" style="background: rgba(255,255,255,0.08); padding: 2px 12px; border-radius: 20px; font-size: 11px; color: #c8d2e8; border: 1px solid rgba(255,255,255,0.06);">${escapeHtml(uid)}</span>`;
            row.insertCell(1).innerText = username;
            row.insertCell(2).innerHTML = `<span style="font-size:12px; color:#b0c0da;">${docTypeDisplay}</span>`;
            row.insertCell(3).innerHTML = frontHtml;
            row.insertCell(4).innerHTML = backHtml;
            row.insertCell(5).innerHTML = statusHtml;
        }
        
        setTimeout(setupKycLazyLoading, 100);
        
        renderKycPagination('kycVerifiedPagination', kycCurrentPage, kycTotalCount, KYC_PAGE_SIZE, (page) => {
            loadKycVerified(page);
        });
        
    } catch (e) {
        console.error('加载KYC历史失败:', e);
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:30px; color:#ff8888;">加载失败: ${escapeHtml(e.message)}</td></tr>`;
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

window.loadKycPage = loadKycPage;