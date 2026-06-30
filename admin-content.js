<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
    <title>ADDITIVE - Content Management</title>
    <link rel="stylesheet" href="common.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
    <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
    <script src="user-data.js"></script>
    <style>
        /* ===== 与 Withdrawal 页面风格一致 ===== */
        .content-header {
            margin-bottom: 24px;
        }
        .content-header h1 {
            font-size: 28px;
            font-weight: 700;
            color: #ffffff;
            margin-bottom: 6px;
        }
        .content-header p {
            color: #7a85a5;
            font-size: 13px;
        }

        .content-tabs {
            display: flex;
            gap: 8px;
            margin-bottom: 24px;
            flex-wrap: wrap;
        }
        .content-tab-btn {
            background: rgba(255, 255, 255, 0.04);
            border: 1px solid rgba(255, 255, 255, 0.06);
            border-radius: 30px;
            padding: 8px 20px;
            color: #8892a8;
            cursor: pointer;
            transition: all 0.2s;
            font-size: 13px;
            font-weight: 500;
            font-family: 'Inter', sans-serif;
        }
        .content-tab-btn:hover {
            background: rgba(255, 255, 255, 0.08);
            color: #e6edf5;
        }
        .content-tab-btn.active {
            background: #2a3a5a;
            color: #e6edf5;
            border-color: #3a5a7a;
        }

        .content-panel {
            display: none;
            animation: fadeIn 0.3s ease;
        }
        .content-panel.active {
            display: block;
        }
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(8px); }
            to { opacity: 1; transform: translateY(0); }
        }

        /* ===== 卡片 ===== */
        .content-card {
            background: rgba(12, 16, 28, 0.6);
            backdrop-filter: blur(16px) saturate(1.4);
            -webkit-backdrop-filter: blur(16px) saturate(1.4);
            border-radius: 20px;
            padding: 22px 24px;
            margin-bottom: 20px;
            border: 1px solid rgba(255, 255, 255, 0.04);
            transition: all 0.3s ease;
        }
        .content-card:hover {
            border-color: rgba(200, 176, 144, 0.06);
            transform: translateY(-2px);
            box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
        }

        /* ===== 工具栏 ===== */
        .toolbar {
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 12px;
            flex-wrap: wrap;
            margin-bottom: 20px;
        }
        .toolbar-left {
            display: flex;
            gap: 10px;
            flex-wrap: wrap;
        }
        .toolbar-right {
            display: flex;
            gap: 10px;
            flex-wrap: wrap;
        }

        .btn-tool {
            background: rgba(200, 176, 144, 0.06);
            border: 1px solid rgba(200, 176, 144, 0.08);
            border-radius: 40px;
            padding: 8px 20px;
            color: #c8b090;
            font-weight: 600;
            font-size: 13px;
            cursor: pointer;
            transition: all 0.3s;
            font-family: 'Inter', sans-serif;
            display: inline-flex;
            align-items: center;
            gap: 6px;
        }
        .btn-tool:hover {
            background: rgba(200, 176, 144, 0.12);
            transform: translateY(-1px);
        }
        .btn-tool-success {
            background: rgba(74, 222, 128, 0.06);
            border: 1px solid rgba(74, 222, 128, 0.08);
            color: #7ad0b0;
        }
        .btn-tool-success:hover {
            background: rgba(74, 222, 128, 0.12);
        }
        .btn-tool-danger {
            background: rgba(232, 128, 128, 0.06);
            border: 1px solid rgba(232, 128, 128, 0.08);
            color: #e88080;
        }
        .btn-tool-danger:hover {
            background: rgba(232, 128, 128, 0.12);
        }
        .btn-tool-arrange {
            background: rgba(74, 124, 255, 0.06);
            border: 1px solid rgba(74, 124, 255, 0.08);
            color: #6a8af0;
        }
        .btn-tool-arrange:hover {
            background: rgba(74, 124, 255, 0.12);
        }
        .btn-tool-arrange.active {
            background: rgba(74, 124, 255, 0.15);
            border-color: rgba(74, 124, 255, 0.25);
            color: #8aafff;
        }

        /* ===== 内容条目 ===== */
        .content-item {
            background: rgba(0, 0, 0, 0.2);
            border-radius: 16px;
            padding: 16px 20px;
            margin-bottom: 10px;
            border: 1px solid rgba(255, 255, 255, 0.04);
            display: flex;
            justify-content: space-between;
            align-items: center;
            transition: all 0.2s;
            cursor: default;
        }
        .content-item:hover {
            border-color: rgba(200, 176, 144, 0.12);
            background: rgba(0, 0, 0, 0.3);
        }
        .content-item.dragging {
            opacity: 0.5;
            border-color: #4a7cff;
            border-style: dashed;
        }
        .content-item.drag-over {
            border-color: #4a7cff;
            background: rgba(74, 124, 255, 0.06);
        }
        .content-item .drag-handle {
            cursor: grab;
            color: #4a5a72;
            font-size: 16px;
            padding: 4px 8px 4px 0;
            user-select: none;
        }
        .content-item .drag-handle:active {
            cursor: grabbing;
        }
        .content-item .item-info {
            flex: 1;
            min-width: 0;
        }
        .content-item .item-title {
            font-size: 14px;
            font-weight: 600;
            color: #d8e0f0;
        }
        .content-item .item-preview {
            font-size: 12px;
            color: #8892a8;
            margin-top: 2px;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
            max-height: 36px;
        }
        .content-item .item-actions {
            display: flex;
            gap: 6px;
            flex-shrink: 0;
        }
        .content-item .item-actions button {
            padding: 4px 14px;
            border-radius: 30px;
            font-size: 11px;
            font-weight: 600;
            cursor: pointer;
            transition: 0.2s;
            border: none;
            font-family: 'Inter', sans-serif;
        }
        .content-item .item-actions .btn-edit {
            background: rgba(200, 176, 144, 0.08);
            color: #c8b090;
        }
        .content-item .item-actions .btn-edit:hover {
            background: rgba(200, 176, 144, 0.18);
        }
        .content-item .item-actions .btn-delete {
            background: rgba(232, 128, 128, 0.08);
            color: #e88080;
        }
        .content-item .item-actions .btn-delete:hover {
            background: rgba(232, 128, 128, 0.18);
        }

        /* ===== 排序模式提示 ===== */
        .arrange-hint {
            background: rgba(74, 124, 255, 0.08);
            border: 1px solid rgba(74, 124, 255, 0.15);
            border-radius: 12px;
            padding: 12px 20px;
            margin-bottom: 16px;
            text-align: center;
            font-size: 13px;
            color: #6a8af0;
            display: none;
        }
        .arrange-hint.active {
            display: block;
        }

        /* ===== 空状态 ===== */
        .empty-state {
            text-align: center;
            padding: 60px 40px;
            color: #6a7a9a;
        }
        .empty-state i {
            font-size: 48px;
            color: #4a5a72;
            margin-bottom: 16px;
            display: block;
        }
        .empty-state p {
            font-size: 14px;
        }

        /* ===== 弹窗 ===== */
        .modal-overlay-custom {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(7, 11, 26, 0.92);
            backdrop-filter: blur(14px);
            z-index: 30000;
            display: none;
            align-items: center;
            justify-content: center;
        }
        .modal-overlay-custom.active {
            display: flex !important;
        }
        .modal-content-custom {
            background: linear-gradient(160deg, #1a1428, #0e0a1a);
            border-radius: 24px;
            padding: 32px 36px 28px;
            max-width: 680px;
            width: 90%;
            max-height: 90vh;
            overflow-y: auto;
            border: 1px solid rgba(201, 176, 149, 0.08);
            box-shadow: 0 24px 60px rgba(0, 0, 0, 0.6);
            transform: scale(0.92);
            transition: transform 0.3s cubic-bezier(0.2, 0.9, 0.4, 1.1);
        }
        .modal-overlay-custom.active .modal-content-custom {
            transform: scale(1);
        }
        .modal-content-custom::-webkit-scrollbar {
            width: 3px;
        }
        .modal-content-custom::-webkit-scrollbar-thumb {
            background: rgba(200, 176, 144, 0.15);
            border-radius: 4px;
        }

        .modal-content-custom .modal-title {
            display: flex;
            align-items: center;
            gap: 10px;
            margin-bottom: 20px;
        }
        .modal-content-custom .modal-title h3 {
            font-size: 18px;
            font-weight: 600;
            color: #d8e0f0;
            margin: 0;
        }
        .modal-content-custom .modal-title i {
            color: #c8b090;
            font-size: 20px;
        }

        .modal-content-custom .form-group {
            margin-bottom: 16px;
        }
        .modal-content-custom .form-group label {
            display: block;
            font-size: 11px;
            color: #8892a8;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 4px;
            font-weight: 600;
        }
        .modal-content-custom .form-group input[type="text"],
        .modal-content-custom .form-group textarea {
            width: 100%;
            background: rgba(255, 255, 255, 0.04);
            border: 1px solid rgba(255, 255, 255, 0.06);
            border-radius: 10px;
            padding: 10px 14px;
            color: #e6edf5;
            font-size: 14px;
            outline: none;
            transition: 0.2s;
            font-family: 'Inter', sans-serif;
            box-sizing: border-box;
            resize: vertical;
        }
        .modal-content-custom .form-group textarea {
            min-height: 120px;
        }
        .modal-content-custom .form-group input[type="text"]:focus,
        .modal-content-custom .form-group textarea:focus {
            border-color: rgba(200, 176, 144, 0.25);
            background: rgba(255, 255, 255, 0.06);
        }

        /* ===== 富文本工具栏 ===== */
        .editor-toolbar {
            display: flex;
            gap: 6px;
            flex-wrap: wrap;
            margin-bottom: 10px;
            background: rgba(255, 255, 255, 0.02);
            padding: 8px 12px;
            border-radius: 10px;
            border: 1px solid rgba(255, 255, 255, 0.04);
        }
        .editor-toolbar .tool-group {
            display: flex;
            gap: 4px;
            align-items: center;
            padding-right: 10px;
            border-right: 1px solid rgba(255, 255, 255, 0.06);
        }
        .editor-toolbar .tool-group:last-child {
            border-right: none;
            padding-right: 0;
        }
        .editor-toolbar .tool-btn {
            background: rgba(255, 255, 255, 0.04);
            border: 1px solid rgba(255, 255, 255, 0.06);
            border-radius: 6px;
            padding: 4px 10px;
            color: #8892a8;
            font-size: 12px;
            cursor: pointer;
            transition: 0.2s;
            font-family: 'Inter', sans-serif;
            display: flex;
            align-items: center;
            gap: 4px;
        }
        .editor-toolbar .tool-btn:hover {
            background: rgba(255, 255, 255, 0.08);
            color: #e6edf5;
        }
        .editor-toolbar .tool-btn i {
            font-size: 13px;
        }
        .editor-toolbar .tool-btn.active {
            background: rgba(200, 176, 144, 0.12);
            color: #c8b090;
            border-color: rgba(200, 176, 144, 0.2);
        }
        .editor-toolbar .tool-select {
            background: rgba(255, 255, 255, 0.04);
            border: 1px solid rgba(255, 255, 255, 0.06);
            border-radius: 6px;
            padding: 4px 8px;
            color: #8892a8;
            font-size: 12px;
            outline: none;
            font-family: 'Inter', sans-serif;
            cursor: pointer;
        }
        .editor-toolbar .tool-select:focus {
            border-color: rgba(200, 176, 144, 0.25);
        }
        .editor-toolbar .color-picker-wrapper {
            position: relative;
            display: inline-block;
        }
        .editor-toolbar .color-picker-wrapper input[type="color"] {
            width: 28px;
            height: 28px;
            border: 2px solid rgba(255, 255, 255, 0.06);
            border-radius: 6px;
            cursor: pointer;
            background: transparent;
            padding: 0;
            vertical-align: middle;
        }
        .editor-toolbar .color-picker-wrapper input[type="color"]::-webkit-color-swatch-wrapper {
            padding: 2px;
        }
        .editor-toolbar .color-picker-wrapper input[type="color"]::-webkit-color-swatch {
            border: none;
            border-radius: 4px;
        }

        .upload-btn-area {
            background: rgba(74, 124, 255, 0.08);
            border: 2px dashed rgba(74, 124, 255, 0.2);
            border-radius: 10px;
            padding: 12px 16px;
            text-align: center;
            cursor: pointer;
            transition: 0.2s;
            display: flex;
            align-items: center;
            gap: 10px;
            justify-content: center;
        }
        .upload-btn-area:hover {
            background: rgba(74, 124, 255, 0.12);
            border-color: rgba(74, 124, 255, 0.35);
        }
        .upload-btn-area i {
            font-size: 20px;
            color: #4a7cff;
        }
        .upload-btn-area span {
            color: #8892a8;
            font-size: 13px;
        }
        .upload-preview {
            margin-top: 10px;
            display: none;
        }
        .upload-preview img {
            max-width: 100%;
            max-height: 200px;
            border-radius: 8px;
            border: 1px solid rgba(255, 255, 255, 0.06);
        }
        .upload-preview .remove-img {
            display: inline-block;
            margin-top: 6px;
            color: #e88080;
            font-size: 12px;
            cursor: pointer;
            background: none;
            border: none;
            font-family: 'Inter', sans-serif;
        }
        .upload-preview .remove-img:hover {
            text-decoration: underline;
        }

        .modal-buttons {
            display: flex;
            gap: 10px;
            margin-top: 20px;
            justify-content: flex-end;
        }
        .modal-buttons .btn-cancel {
            background: rgba(255, 255, 255, 0.04);
            border: 1px solid rgba(255, 255, 255, 0.06);
            border-radius: 40px;
            padding: 10px 28px;
            color: #6a6a80;
            font-weight: 500;
            font-size: 13px;
            cursor: pointer;
            transition: 0.2s;
            font-family: 'Inter', sans-serif;
        }
        .modal-buttons .btn-cancel:hover {
            background: rgba(255, 255, 255, 0.08);
        }
        .modal-buttons .btn-save {
            background: rgba(74, 222, 128, 0.06);
            border: 1px solid rgba(74, 222, 128, 0.08);
            border-radius: 40px;
            padding: 10px 28px;
            color: #7ad0b0;
            font-weight: 600;
            font-size: 13px;
            cursor: pointer;
            transition: 0.2s;
            font-family: 'Inter', sans-serif;
        }
        .modal-buttons .btn-save:hover {
            background: rgba(74, 222, 128, 0.12);
        }

        @media (max-width: 768px) {
            .content-tabs {
                gap: 6px;
            }
            .content-tab-btn {
                font-size: 11px;
                padding: 6px 14px;
            }
            .toolbar {
                flex-direction: column;
                align-items: stretch;
            }
            .toolbar-left, .toolbar-right {
                justify-content: center;
            }
            .content-item {
                flex-wrap: wrap;
                gap: 10px;
                padding: 14px 16px;
            }
            .content-item .item-actions {
                width: 100%;
                justify-content: flex-end;
            }
            .modal-content-custom {
                padding: 24px 20px;
                max-height: 95vh;
            }
            .editor-toolbar {
                gap: 4px;
                padding: 6px 10px;
            }
            .editor-toolbar .tool-group {
                padding-right: 6px;
            }
            .editor-toolbar .tool-btn {
                font-size: 11px;
                padding: 3px 8px;
            }
            .editor-toolbar .tool-select {
                font-size: 11px;
                padding: 3px 6px;
            }
        }
        @media (max-width: 480px) {
            .content-tab-btn {
                font-size: 10px;
                padding: 4px 10px;
            }
            .btn-tool {
                font-size: 11px;
                padding: 6px 14px;
            }
            .modal-content-custom {
                padding: 18px 14px;
            }
        }
    </style>
</head>
<body>

<div class="menu-overlay" id="menuOverlay" onclick="closeMenu()"></div>

<div class="app">
    <!-- Sidebar -->
    <aside class="sidebar" id="sidebar">
        <div class="sidebar-top">
            <div class="logo">
                <img src="https://qgmbzdfnwsdosdqphlxk.supabase.co/storage/v1/object/public/logos/additivelogo1.png" alt="ADDITIVE" style="height:35px;width:auto;">
            </div>
            <nav class="nav">
                <a href="dashboard.html" class="nav-item"><i class="fas fa-th-large"></i><span>Dashboard</span></a>
                <a href="start.html" class="nav-item"><i class="fas fa-play"></i><span>Start</span></a>
                <a href="history.html" class="nav-item"><i class="fas fa-clock"></i><span>History</span></a>
                <a href="checkin.html" class="nav-item"><i class="fas fa-calendar-check"></i><span>Sign in</span></a>
                <a href="event.html" class="nav-item"><i class="fas fa-calendar-alt"></i><span>Event</span></a>
                <a href="withdrawal.html" class="nav-item"><i class="fas fa-arrow-right-to-bracket"></i><span>Withdrawal</span></a>
                <a href="employment.html" class="nav-item"><i class="fas fa-file-contract"></i><span>Employment Contract</span></a>
                <a href="company.html" class="nav-item"><i class="fas fa-building"></i><span>Company Profile</span></a>
                <a href="chat.html" class="nav-item"><i class="fas fa-comment-dots"></i><span>Chat with us</span></a>
                <a href="settings.html" class="nav-item"><i class="fas fa-sliders-h"></i><span>Settings</span></a>
                <a href="membership.html" class="nav-item"><i class="fas fa-crown"></i><span>Membership</span></a>
            </nav>
        </div>
        <div class="sidebar-upgrade-card">
            <div class="sidebar-premium-badge">PREMIUM ACCESS</div>
            <div class="sidebar-upgrade-title">Upgrade your membership</div>
            <div class="sidebar-upgrade-desc">Unlock higher rewards,<br>priority support, and premium<br>hotel discovery benefits</div>
            <a href="membership.html" class="sidebar-upgrade-btn">Upgrade Now <i class="fas fa-arrow-right"></i></a>
        </div>
    </aside>

    <!-- Main -->
    <main class="main">
        <div class="mobile-top-bar">
            <div class="menu-toggle" id="menuToggleBtn" onclick="toggleMenu()"><i class="fas fa-bars"></i></div>
            <div class="mobile-logo"><img src="https://qgmbzdfnwsdosdqphlxk.supabase.co/storage/v1/object/public/logos/additivelogo1.png" alt="ADDITIVE"></div>
        </div>

        <!-- Header -->
        <div class="content-header">
            <h1>Content Management</h1>
            <p>Manage Event Content &amp; Terms Conditions displayed on platform.</p>
        </div>

        <!-- Tabs -->
        <div class="content-tabs" id="contentTabs">
            <button class="content-tab-btn active" data-tab="event">Event</button>
            <button class="content-tab-btn" data-tab="contract">Employment Contract</button>
            <button class="content-tab-btn" data-tab="tc">Terms &amp; Conditions</button>
            <button class="content-tab-btn" data-tab="privacy">Privacy &amp; Security</button>
            <button class="content-tab-btn" data-tab="rules">Platform Rules</button>
        </div>

        <!-- Panel Container -->
        <div id="panelContainer"></div>

        <div class="footer-note"><i class="fas fa-lock"></i> Secure platform · Protected by ADDITIVE</div>
    </main>
</div>

<!-- ===== Add/Edit Modal ===== -->
<div id="contentModal" class="modal-overlay-custom">
    <div class="modal-content-custom">
        <div class="modal-title">
            <i class="fas fa-file-alt"></i>
            <h3 id="modalTitle">Add Content</h3>
        </div>

        <!-- Content Input -->
        <div class="form-group">
            <label>Content</label>
            <textarea id="contentInput" rows="6" placeholder="Write your content here..."></textarea>
        </div>

        <!-- Editor Toolbar -->
        <div class="editor-toolbar">
            <div class="tool-group">
                <select id="fontSizeSelect" class="tool-select">
                    <option value="12">12px</option>
                    <option value="14" selected>14px</option>
                    <option value="16">16px</option>
                    <option value="18">18px</option>
                    <option value="20">20px</option>
                    <option value="24">24px</option>
                    <option value="28">28px</option>
                    <option value="32">32px</option>
                </select>
            </div>
            <div class="tool-group">
                <select id="fontFamilySelect" class="tool-select">
                    <option value="Inter">Inter</option>
                    <option value="Arial">Arial</option>
                    <option value="Georgia">Georgia</option>
                    <option value="Courier New">Courier New</option>
                    <option value="Times New Roman">Times New Roman</option>
                </select>
            </div>
            <div class="tool-group">
                <button class="tool-btn" id="boldBtn" title="Bold"><i class="fas fa-bold"></i></button>
                <button class="tool-btn" id="italicBtn" title="Italic"><i class="fas fa-italic"></i></button>
                <button class="tool-btn" id="underlineBtn" title="Underline"><i class="fas fa-underline"></i></button>
            </div>
            <div class="tool-group">
                <div class="color-picker-wrapper">
                    <input type="color" id="colorPicker" value="#ffffff">
                </div>
            </div>
            <div class="tool-group">
                <button class="tool-btn" id="applyStyleBtn" title="Apply Style"><i class="fas fa-check"></i> Apply</button>
                <button class="tool-btn" id="clearStyleBtn" title="Clear Style"><i class="fas fa-undo"></i> Clear</button>
            </div>
        </div>

        <!-- Image Upload -->
        <div class="form-group">
            <label>Upload Image</label>
            <div class="upload-btn-area" id="imageUploadArea">
                <i class="fas fa-cloud-upload-alt"></i>
                <span>Click to upload image</span>
                <input type="file" id="imageFileInput" accept="image/*" style="display:none;">
            </div>
            <div class="upload-preview" id="uploadPreview">
                <img id="previewImage" src="" alt="Preview">
                <button class="remove-img" id="removeImageBtn"><i class="fas fa-times"></i> Remove</button>
            </div>
        </div>

        <div class="modal-buttons">
            <button class="btn-cancel" id="modalCancelBtn">Cancel</button>
            <button class="btn-save" id="modalSaveBtn"><i class="fas fa-save"></i> Save Content</button>
        </div>
    </div>
</div>

<script>
// ============================================================
// Supabase
// ============================================================
const SUPABASE_URL = 'https://qgmbzdfnwsdosdqphlxk.supabase.co';
const SUPABASE_KEY = 'sb_publishable_zsJFjfNUO7NKp8ZH5KrXFQ_WZ8Q2Kym';
const sb = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// ============================================================
// State
// ============================================================
let currentTab = 'event';
let contents = {};
let editingId = null;
let uploadedImageUrl = '';
let isArrangeMode = false;
let dragItem = null;

// ============================================================
// Menu
// ============================================================
function toggleMenu() {
    const s = document.getElementById('sidebar');
    const o = document.getElementById('menuOverlay');
    if (s) s.classList.toggle('open');
    if (o) o.classList.toggle('active');
}
function closeMenu() {
    const s = document.getElementById('sidebar');
    const o = document.getElementById('menuOverlay');
    if (s) s.classList.remove('open');
    if (o) o.classList.remove('active');
}

// ============================================================
// Tab mapping
// ============================================================
const tabMap = {
    'event': { title: 'Event', type: 'event' },
    'contract': { title: 'Employment Contract', type: 'contract' },
    'tc': { title: 'Terms & Conditions', type: 'tc' },
    'privacy': { title: 'Privacy & Security', type: 'privacy' },
    'rules': { title: 'Platform Rules', type: 'rules' }
};

// ============================================================
// Load content for a tab
// ============================================================
async function loadContent(tab) {
    const type = tabMap[tab]?.type || 'event';
    const panel = document.getElementById('panelContainer');
    if (!panel) return;

    panel.innerHTML = `
        <div class="toolbar">
            <div class="toolbar-left">
                <button class="btn-tool btn-tool-success" id="addContentBtn"><i class="fas fa-plus"></i> Add Content</button>
                <button class="btn-tool btn-tool-arrange" id="arrangeContentBtn"><i class="fas fa-arrows-alt"></i> Arrange Content</button>
            </div>
            <div class="toolbar-right">
                <span style="font-size:12px;color:#5a6a82;" id="contentCount">0 items</span>
            </div>
        </div>
        <div class="arrange-hint" id="arrangeHint">
            <i class="fas fa-arrows-alt"></i> Drag and drop to reorder content. Click "Arrange Content" again to save.
        </div>
        <div id="contentList"></div>
    `;

    // Fetch content
    const { data, error } = await sb
        .from('system_content')
        .select('*')
        .eq('type', type)
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: true });

    if (error) {
        console.error('Load content error:', error);
        document.getElementById('contentList').innerHTML = '<div class="empty-state"><i class="fas fa-exclamation-circle"></i><p>Failed to load content</p></div>';
        return;
    }

    contents[tab] = data || [];
    renderContentList(tab);

    // Bind events
    document.getElementById('addContentBtn').addEventListener('click', () => openAddModal(tab));
    document.getElementById('arrangeContentBtn').addEventListener('click', () => toggleArrangeMode(tab));
    updateContentCount(tab);
}

// ============================================================
// Render content list
// ============================================================
function renderContentList(tab) {
    const list = document.getElementById('contentList');
    if (!list) return;

    const items = contents[tab] || [];

    if (items.length === 0) {
        list.innerHTML = `<div class="empty-state"><i class="fas fa-file-alt"></i><p>No content yet. Click "Add Content" to get started.</p></div>`;
        return;
    }

    list.innerHTML = '';
    items.forEach((item, index) => {
        const div = document.createElement('div');
        div.className = 'content-item';
        div.dataset.id = item.id;
        div.dataset.index = index;

        // Preview text
        const preview = item.content ? item.content.substring(0, 80) + (item.content.length > 80 ? '...' : '') : 'Empty content';

        div.innerHTML = `
            <div class="drag-handle" style="display:${isArrangeMode ? 'block' : 'none'};"><i class="fas fa-grip-lines"></i></div>
            <div class="item-info">
                <div class="item-title">${escapeHtml(item.title || 'Untitled')}</div>
                <div class="item-preview">${escapeHtml(preview)}</div>
            </div>
            <div class="item-actions">
                <button class="btn-edit" onclick="openEditModal('${tab}', '${item.id}')"><i class="fas fa-edit"></i> Edit</button>
                <button class="btn-delete" onclick="deleteContent('${tab}', '${item.id}')"><i class="fas fa-trash"></i> Delete</button>
            </div>
        `;

        // Drag events
        if (isArrangeMode) {
            div.draggable = true;
            div.addEventListener('dragstart', handleDragStart);
            div.addEventListener('dragend', handleDragEnd);
            div.addEventListener('dragover', handleDragOver);
            div.addEventListener('dragenter', handleDragEnter);
            div.addEventListener('dragleave', handleDragLeave);
            div.addEventListener('drop', handleDrop);
        }

        list.appendChild(div);
    });
}

// ============================================================
// Drag & Drop handlers
// ============================================================
let draggedIndex = null;

function handleDragStart(e) {
    draggedIndex = parseInt(this.dataset.index);
    this.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', this.innerHTML);
}

function handleDragEnd(e) {
    this.classList.remove('dragging');
    document.querySelectorAll('.content-item').forEach(el => el.classList.remove('drag-over'));
}

function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
}

function handleDragEnter(e) {
    e.preventDefault();
    this.classList.add('drag-over');
}

function handleDragLeave(e) {
    this.classList.remove('drag-over');
}

function handleDrop(e) {
    e.preventDefault();
    this.classList.remove('drag-over');

    const targetIndex = parseInt(this.dataset.index);
    if (draggedIndex === null || draggedIndex === targetIndex) return;

    const tab = currentTab;
    const items = contents[tab] || [];
    const [removed] = items.splice(draggedIndex, 1);
    items.splice(targetIndex, 0, removed);

    // Update sort_order
    items.forEach((item, idx) => item.sort_order = idx);

    contents[tab] = items;
    renderContentList(tab);
    draggedIndex = null;
}

// ============================================================
// Toggle arrange mode
// ============================================================
function toggleArrangeMode(tab) {
    isArrangeMode = !isArrangeMode;
    const btn = document.getElementById('arrangeContentBtn');
    const hint = document.getElementById('arrangeHint');

    if (isArrangeMode) {
        btn.classList.add('active');
        btn.innerHTML = '<i class="fas fa-save"></i> Save Order';
        hint.classList.add('active');
    } else {
        btn.classList.remove('active');
        btn.innerHTML = '<i class="fas fa-arrows-alt"></i> Arrange Content';
        hint.classList.remove('active');
        saveOrder(tab);
    }

    renderContentList(tab);
}

// ============================================================
// Save order to database
// ============================================================
async function saveOrder(tab) {
    const items = contents[tab] || [];
    if (items.length === 0) return;

    try {
        for (const item of items) {
            await sb
                .from('system_content')
                .update({ sort_order: item.sort_order || 0 })
                .eq('id', item.id);
        }
        showToast('Order saved successfully', 'success');
    } catch (e) {
        console.error('Save order error:', e);
        showToast('Failed to save order', 'error');
    }
}

// ============================================================
// Update count
// ============================================================
function updateContentCount(tab) {
    const el = document.getElementById('contentCount');
    if (!el) return;
    const count = (contents[tab] || []).length;
    el.textContent = count + ' items';
}

// ============================================================
// Open Add Modal
// ============================================================
function openAddModal(tab) {
    editingId = null;
    uploadedImageUrl = '';
    document.getElementById('modalTitle').textContent = 'Add Content';
    document.getElementById('contentInput').value = '';
    document.getElementById('uploadPreview').style.display = 'none';
    document.getElementById('previewImage').src = '';
    document.getElementById('colorPicker').value = '#ffffff';
    document.getElementById('fontSizeSelect').value = '14';
    document.getElementById('fontFamilySelect').value = 'Inter';
    document.getElementById('contentModal').classList.add('active');
}

// ============================================================
// Open Edit Modal
// ============================================================
function openEditModal(tab, id) {
    const items = contents[tab] || [];
    const item = items.find(i => i.id == id);
    if (!item) return;

    editingId = id;
    uploadedImageUrl = item.image_url || '';
    document.getElementById('modalTitle').textContent = 'Edit Content';
    document.getElementById('contentInput').value = item.content || '';
    document.getElementById('colorPicker').value = '#ffffff';
    document.getElementById('fontSizeSelect').value = '14';
    document.getElementById('fontFamilySelect').value = 'Inter';

    if (uploadedImageUrl) {
        document.getElementById('uploadPreview').style.display = 'block';
        document.getElementById('previewImage').src = uploadedImageUrl;
    } else {
        document.getElementById('uploadPreview').style.display = 'none';
        document.getElementById('previewImage').src = '';
    }

    document.getElementById('contentModal').classList.add('active');
}

// ============================================================
// Close Modal
// ============================================================
function closeModal() {
    document.getElementById('contentModal').classList.remove('active');
    editingId = null;
}

// ============================================================
// Save Content
// ============================================================
async function saveContent() {
    const content = document.getElementById('contentInput').value.trim();
    if (!content) {
        showToast('Please enter content', 'error');
        return;
    }

    const type = tabMap[currentTab]?.type || 'event';
    const title = tabMap[currentTab]?.title || 'Event';

    try {
        if (editingId) {
            // Update
            await sb
                .from('system_content')
                .update({
                    content: content,
                    image_url: uploadedImageUrl || null,
                    updated_at: new Date().toISOString()
                })
                .eq('id', editingId);
            showToast('Content updated', 'success');
        } else {
            // Insert
            const items = contents[currentTab] || [];
            const maxOrder = items.reduce((max, i) => Math.max(max, i.sort_order || 0), 0);
            await sb
                .from('system_content')
                .insert([{
                    type: type,
                    title: title,
                    content: content,
                    image_url: uploadedImageUrl || null,
                    sort_order: maxOrder + 1,
                    created_at: new Date().toISOString()
                }]);
            showToast('Content added', 'success');
        }

        closeModal();
        await loadContent(currentTab);
    } catch (e) {
        console.error('Save error:', e);
        showToast('Failed to save: ' + e.message, 'error');
    }
}

// ============================================================
// Delete Content
// ============================================================
async function deleteContent(tab, id) {
    if (!confirm('Are you sure you want to delete this content?')) return;

    try {
        await sb.from('system_content').delete().eq('id', id);
        showToast('Content deleted', 'success');
        await loadContent(tab);
    } catch (e) {
        console.error('Delete error:', e);
        showToast('Failed to delete', 'error');
    }
}

// ============================================================
// Image Upload
// ============================================================
async function uploadImage(file) {
    if (!file.type.startsWith('image/')) {
        showToast('Please select an image file', 'error');
        return;
    }
    if (file.size > 5 * 1024 * 1024) {
        showToast('Image size must be less than 5MB', 'error');
        return;
    }

    const fileName = `content/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const storageBucket = 'content-images';

    try {
        const response = await fetch(`${SUPABASE_URL}/storage/v1/object/${storageBucket}/${fileName}`, {
            method: 'POST',
            headers: {
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`
            },
            body: file
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText);
        }

        const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/${storageBucket}/${fileName}`;
        uploadedImageUrl = publicUrl;

        document.getElementById('uploadPreview').style.display = 'block';
        document.getElementById('previewImage').src = publicUrl;

        showToast('Image uploaded', 'success');
    } catch (e) {
        console.error('Upload error:', e);
        showToast('Upload failed: ' + e.message, 'error');
    }
}

// ============================================================
// Apply style to content
// ============================================================
function applyStyle() {
    const textarea = document.getElementById('contentInput');
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = textarea.value.substring(start, end);
    if (!selectedText) {
        showToast('Select some text to apply style', 'info');
        return;
    }

    const fontSize = document.getElementById('fontSizeSelect').value;
    const fontFamily = document.getElementById('fontFamilySelect').value;
    const color = document.getElementById('colorPicker').value;

    let style = `font-size:${fontSize}px; font-family:${fontFamily}; color:${color};`;

    // Check bold/italic/underline via active class
    const boldBtn = document.getElementById('boldBtn');
    const italicBtn = document.getElementById('italicBtn');
    const underlineBtn = document.getElementById('underlineBtn');

    if (boldBtn.classList.contains('active')) style += ' font-weight:700;';
    if (italicBtn.classList.contains('active')) style += ' font-style:italic;';
    if (underlineBtn.classList.contains('active')) style += ' text-decoration:underline;';

    const wrapped = `<span style="${style}">${selectedText}</span>`;
    const before = textarea.value.substring(0, start);
    const after = textarea.value.substring(end);
    textarea.value = before + wrapped + after;

    // Restore selection
    const newStart = start;
    const newEnd = start + wrapped.length;
    textarea.setSelectionRange(newStart, newEnd);
    textarea.focus();
}

// ============================================================
// Clear style from selected text
// ============================================================
function clearStyle() {
    const textarea = document.getElementById('contentInput');
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = textarea.value.substring(start, end);
    if (!selectedText) {
        showToast('Select text to clear style', 'info');
        return;
    }

    // Remove span tags and style attributes
    const cleaned = selectedText.replace(/<span[^>]*>/g, '').replace(/<\/span>/g, '');
    const before = textarea.value.substring(0, start);
    const after = textarea.value.substring(end);
    textarea.value = before + cleaned + after;

    const newEnd = start + cleaned.length;
    textarea.setSelectionRange(start, newEnd);
    textarea.focus();
}

// ============================================================
// Utility
// ============================================================
function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

function showToast(msg, type) {
    const existing = document.querySelector('.custom-toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = 'custom-toast';
    toast.style.cssText = `
        position: fixed; bottom: 30px; left: 50%; transform: translateX(-50%) translateY(100px);
        background: rgba(15,20,35,0.95); backdrop-filter: blur(20px); border-radius: 50px;
        padding: 12px 24px; display: flex; align-items: center; gap: 12px;
        z-index: 99999; opacity: 0; transition: all 0.3s ease;
        box-shadow: 0 10px 30px rgba(0,0,0,0.3); font-family: 'Inter', sans-serif;
        color: #fff; border-left: 3px solid ${type === 'success' ? '#7ad0b0' : type === 'error' ? '#e88080' : '#6a8af0'};
    `;

    const icon = type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle';
    const color = type === 'success' ? '#7ad0b0' : type === 'error' ? '#e88080' : '#6a8af0';

    toast.innerHTML = `
        <div><i class="fas ${icon}" style="color:${color};font-size:18px;"></i></div>
        <div style="font-size:14px;">${msg}</div>
        <div style="position:absolute;bottom:0;left:0;height:3px;background:${color};width:100%;border-radius:0 0 50px 50px;animation:toastProgress 3s linear forwards;"></div>
    `;

    document.body.appendChild(toast);
    setTimeout(() => { toast.style.transform = 'translateX(-50%) translateY(0)'; toast.style.opacity = '1'; }, 10);
    setTimeout(() => {
        toast.style.transform = 'translateX(-50%) translateY(100px)';
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// ============================================================
// Tab switching
// ============================================================
function switchTab(tab) {
    currentTab = tab;

    document.querySelectorAll('.content-tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tab);
    });

    // Reset arrange mode
    isArrangeMode = false;

    loadContent(tab);
}

// ============================================================
// Initialize
// ============================================================
document.addEventListener('DOMContentLoaded', function() {
    // Tab clicks
    document.querySelectorAll('.content-tab-btn').forEach(btn => {
        btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });

    // Modal events
    document.getElementById('modalCancelBtn').addEventListener('click', closeModal);
    document.getElementById('modalSaveBtn').addEventListener('click', saveContent);

    // Close modal on overlay click
    document.getElementById('contentModal').addEventListener('click', function(e) {
        if (e.target === this) closeModal();
    });

    // Image upload
    document.getElementById('imageUploadArea').addEventListener('click', function() {
        document.getElementById('imageFileInput').click();
    });
    document.getElementById('imageFileInput').addEventListener('change', function(e) {
        if (e.target.files[0]) uploadImage(e.target.files[0]);
        this.value = '';
    });
    document.getElementById('removeImageBtn').addEventListener('click', function() {
        uploadedImageUrl = '';
        document.getElementById('uploadPreview').style.display = 'none';
        document.getElementById('previewImage').src = '';
    });

    // Editor toolbar
    document.getElementById('boldBtn').addEventListener('click', function() {
        this.classList.toggle('active');
    });
    document.getElementById('italicBtn').addEventListener('click', function() {
        this.classList.toggle('active');
    });
    document.getElementById('underlineBtn').addEventListener('click', function() {
        this.classList.toggle('active');
    });
    document.getElementById('applyStyleBtn').addEventListener('click', applyStyle);
    document.getElementById('clearStyleBtn').addEventListener('click', clearStyle);

    // Keyboard shortcut: Ctrl+Enter to save
    document.getElementById('contentInput').addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
            e.preventDefault();
            document.getElementById('modalSaveBtn').click();
        }
    });

    // Close modal on Escape
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') closeModal();
    });

    // Load default tab
    switchTab('event');
});

// Global for inline onclick
window.openEditModal = openEditModal;
window.deleteContent = deleteContent;
window.closeModal = closeModal;
</script>

</body>
</html>