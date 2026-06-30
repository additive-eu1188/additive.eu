// admin-content.js - 内容管理页面（完整版）
// 风格与 Withdrawal 页面一致
// 支持 6 个内容模块：Events, Certificate, Contract, T&C, Privacy, Rules

// ============================================================
// 全局状态
// ============================================================
let currentContentTab = 'events';
let contentData = {};
let eventsList = [];
let isDragging = false;
let dragStartIndex = null;
let draggedElement = null;

// 富文本编辑器状态
let editorContent = '';
let editorImages = [];

// ============================================================
// 加载主页面
// ============================================================
async function loadContentPage() {
    const container = document.getElementById('page_content');
    if (!container) return;

    // 加载所有内容数据
    await loadAllContentData();

    container.innerHTML = `
        <div class="card" style="background: rgba(12, 16, 28, 0.6); backdrop-filter: blur(16px); border-radius: 20px; border: 1px solid rgba(255,255,255,0.04); padding: 24px;">
            
            <!-- ===== 页面标题 ===== -->
            <div class="withdraw-header" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; margin-bottom: 24px;">
                <div>
                    <h2 style="font-size: 18px; font-weight: 600; color: #d8e0f0; margin: 0;">
                        <i class="fas fa-file-alt" style="color: #8892a8; margin-right: 10px;"></i>
                        Content Management
                    </h2>
                    <p style="color: #6a7a92; font-size: 13px; margin: 4px 0 0 0;">
                        Manage every content and event displayed on the website.
                    </p>
                </div>
                <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                    <button id="refreshContentBtn" class="btn-primary" style="padding: 8px 20px; border-radius: 40px; border: none; background: rgba(255,255,255,0.06); color: #c8b090; font-weight: 600; cursor: pointer; font-size: 13px;">
                        <i class="fas fa-sync-alt"></i> Refresh
                    </button>
                </div>
            </div>

            <!-- ===== 6 个内容按钮 ===== -->
            <div style="display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 24px; padding: 6px; background: rgba(255,255,255,0.02); border-radius: 16px; border: 1px solid rgba(255,255,255,0.04);">
                <button class="content-tab-btn active" data-tab="events" style="flex: 1; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.06); border-radius: 30px; padding: 10px 16px; color: rgba(255,255,255,0.3); cursor: pointer; font-size: 13px; font-weight: 500; transition: all 0.2s; font-family: 'Inter', sans-serif; text-align: center; min-width: 80px;">
                    <i class="fas fa-calendar-alt"></i> Events
                </button>
                <button class="content-tab-btn" data-tab="certificate" style="flex: 1; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.06); border-radius: 30px; padding: 10px 16px; color: rgba(255,255,255,0.3); cursor: pointer; font-size: 13px; font-weight: 500; transition: all 0.2s; font-family: 'Inter', sans-serif; text-align: center; min-width: 80px;">
                    <i class="fas fa-building"></i> Certificate
                </button>
                <button class="content-tab-btn" data-tab="contract" style="flex: 1; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.06); border-radius: 30px; padding: 10px 16px; color: rgba(255,255,255,0.3); cursor: pointer; font-size: 13px; font-weight: 500; transition: all 0.2s; font-family: 'Inter', sans-serif; text-align: center; min-width: 80px;">
                    <i class="fas fa-file-contract"></i> Contract
                </button>
                <button class="content-tab-btn" data-tab="tc" style="flex: 1; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.06); border-radius: 30px; padding: 10px 16px; color: rgba(255,255,255,0.3); cursor: pointer; font-size: 13px; font-weight: 500; transition: all 0.2s; font-family: 'Inter', sans-serif; text-align: center; min-width: 80px;">
                    <i class="fas fa-gavel"></i> T&amp;C
                </button>
                <button class="content-tab-btn" data-tab="privacy" style="flex: 1; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.06); border-radius: 30px; padding: 10px 16px; color: rgba(255,255,255,0.3); cursor: pointer; font-size: 13px; font-weight: 500; transition: all 0.2s; font-family: 'Inter', sans-serif; text-align: center; min-width: 80px;">
                    <i class="fas fa-shield-alt"></i> Privacy
                </button>
                <button class="content-tab-btn" data-tab="rules" style="flex: 1; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.06); border-radius: 30px; padding: 10px 16px; color: rgba(255,255,255,0.3); cursor: pointer; font-size: 13px; font-weight: 500; transition: all 0.2s; font-family: 'Inter', sans-serif; text-align: center; min-width: 80px;">
                    <i class="fas fa-list-ul"></i> Rules
                </button>
            </div>

            <!-- ===== 操作栏 ===== -->
            <div id="contentActionBar" style="display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 20px; align-items: center;">
                <button id="addContentBtn" class="success" style="background: rgba(74,222,128,0.06); border: 1px solid rgba(74,222,128,0.08); border-radius: 40px; padding: 8px 20px; color: #4ade80; font-weight: 600; font-size: 13px; cursor: pointer; transition: all 0.3s; font-family: 'Inter', sans-serif; display: inline-flex; align-items: center; gap: 6px;">
                    <i class="fas fa-plus"></i> Add Event
                </button>
                <button id="arrangeContentBtn" class="btn-primary" style="padding: 8px 20px; border-radius: 40px; border: none; background: rgba(255,255,255,0.06); color: #c8b090; font-weight: 600; cursor: pointer; font-size: 13px; font-family: 'Inter', sans-serif; display: inline-flex; align-items: center; gap: 6px;">
                    <i class="fas fa-arrows-alt"></i> Arrange Event
                </button>
                <span id="arrangeHint" style="font-size: 11px; color: #6a7a92; display: none;">Drag items to reorder</span>
            </div>

            <!-- ===== 内容列表 ===== -->
            <div id="contentListContainer" style="background: rgba(255,255,255,0.02); border-radius: 16px; border: 1px solid rgba(255,255,255,0.04); min-height: 200px; padding: 4px;">
                <!-- 由 JavaScript 动态渲染 -->
            </div>
        </div>
    `;

    // 添加样式
    const style = document.createElement('style');
    style.textContent = `
        .content-tab-btn.active {
            background: rgba(200,176,144,0.12) !important;
            border-color: rgba(200,176,144,0.25) !important;
            color: #ffffff !important;
            box-shadow: 0 0 20px rgba(200,176,144,0.05);
        }
        .content-tab-btn:hover {
            background: rgba(255,255,255,0.06) !important;
            color: rgba(255,255,255,0.6) !important;
        }
        .content-item {
            background: rgba(255,255,255,0.02);
            border-radius: 12px;
            padding: 16px 20px;
            margin: 6px 8px;
            border: 1px solid rgba(255,255,255,0.04);
            display: flex;
            justify-content: space-between;
            align-items: center;
            transition: all 0.2s;
            cursor: default;
        }
        .content-item:hover {
            background: rgba(255,255,255,0.04);
            border-color: rgba(200,176,144,0.10);
        }
        .content-item.dragging {
            opacity: 0.4;
            border-color: rgba(200,176,144,0.3);
        }
        .content-item.drag-over {
            border-color: rgba(200,176,144,0.5);
            background: rgba(200,176,144,0.06);
            transform: scale(1.01);
        }
        .content-item .drag-handle {
            cursor: grab;
            color: rgba(255,255,255,0.15);
            font-size: 16px;
            margin-right: 12px;
            transition: 0.2s;
        }
        .content-item .drag-handle:hover {
            color: rgba(200,176,144,0.4);
        }
        .content-item .item-info {
            flex: 1;
            display: flex;
            align-items: center;
            gap: 14px;
        }
        .content-item .item-title {
            font-size: 14px;
            font-weight: 500;
            color: #d8e0f0;
        }
        .content-item .item-sub {
            font-size: 11px;
            color: #6a7a92;
        }
        .content-item .item-status {
            font-size: 10px;
            padding: 2px 12px;
            border-radius: 20px;
        }
        .status-active {
            background: rgba(74,222,128,0.10);
            color: #4ade80;
        }
        .status-inactive {
            background: rgba(232,128,128,0.10);
            color: #e88080;
        }
        .content-item .item-actions {
            display: flex;
            gap: 6px;
        }
        .content-item .item-actions button {
            background: rgba(255,255,255,0.04);
            border: 1px solid rgba(255,255,255,0.06);
            border-radius: 30px;
            padding: 4px 14px;
            color: #8892a8;
            cursor: pointer;
            font-size: 11px;
            transition: 0.2s;
            font-family: 'Inter', sans-serif;
        }
        .content-item .item-actions button:hover {
            background: rgba(255,255,255,0.08);
            color: #d8e0f0;
        }
        .content-item .item-actions .btn-edit:hover {
            border-color: rgba(200,176,144,0.2);
            color: #c8b090;
        }
        .content-item .item-actions .btn-delete:hover {
            border-color: rgba(232,128,128,0.2);
            color: #e88080;
        }

        /* 富文本编辑器 */
        .editor-toolbar {
            display: flex;
            gap: 4px;
            flex-wrap: wrap;
            padding: 8px 12px;
            background: rgba(0,0,0,0.2);
            border-radius: 12px 12px 0 0;
            border: 1px solid rgba(255,255,255,0.04);
            border-bottom: none;
        }
        .editor-toolbar button {
            background: rgba(255,255,255,0.04);
            border: 1px solid rgba(255,255,255,0.06);
            border-radius: 6px;
            padding: 4px 10px;
            color: #8892a8;
            cursor: pointer;
            font-size: 12px;
            transition: 0.2s;
            font-family: 'Inter', sans-serif;
        }
        .editor-toolbar button:hover {
            background: rgba(255,255,255,0.08);
            color: #d8e0f0;
        }
        .editor-toolbar button.active {
            background: rgba(200,176,144,0.12);
            color: #c8b090;
            border-color: rgba(200,176,144,0.2);
        }
        .editor-content {
            background: rgba(0,0,0,0.15);
            border: 1px solid rgba(255,255,255,0.04);
            border-radius: 0 0 12px 12px;
            padding: 16px;
            min-height: 200px;
            color: #d8e0f0;
            outline: none;
            font-size: 14px;
            line-height: 1.6;
        }
        .editor-content:focus {
            border-color: rgba(200,176,144,0.2);
        }
        .editor-content img {
            max-width: 100%;
            border-radius: 8px;
            margin: 8px 0;
        }
        .editor-content h1 { font-size: 28px; font-weight: 700; color: #ffffff; }
        .editor-content h2 { font-size: 24px; font-weight: 600; color: #ffffff; }
        .editor-content h3 { font-size: 20px; font-weight: 600; color: #d8e0f0; }
        .editor-content p { margin-bottom: 12px; }
        .editor-content ul, .editor-content ol { margin: 8px 0 12px 24px; }
        .editor-content li { margin-bottom: 4px; }

        /* 预览弹窗 */
        .preview-modal {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.85);
            backdrop-filter: blur(16px);
            z-index: 30000;
            display: flex;
            align-items: center;
            justify-content: center;
            visibility: hidden;
            opacity: 0;
            transition: all 0.3s ease;
        }
        .preview-modal.active {
            visibility: visible;
            opacity: 1;
        }
        .preview-modal .phone-frame {
            width: 380px;
            max-width: 90vw;
            max-height: 85vh;
            background: #0a0f2a;
            border-radius: 40px;
            padding: 20px 16px;
            border: 2px solid rgba(200,176,144,0.15);
            box-shadow: 0 30px 80px rgba(0,0,0,0.6);
            overflow-y: auto;
            position: relative;
        }
        .preview-modal .phone-frame .preview-content {
            color: #d8e0f0;
            font-size: 14px;
            line-height: 1.6;
        }
        .preview-modal .phone-frame .preview-content img {
            max-width: 100%;
            border-radius: 8px;
            margin: 8px 0;
        }
        .preview-modal .phone-frame .preview-content h1 { font-size: 24px; font-weight: 700; color: #ffffff; }
        .preview-modal .phone-frame .preview-content h2 { font-size: 20px; font-weight: 600; color: #ffffff; }
        .preview-modal .phone-frame .preview-content h3 { font-size: 17px; font-weight: 600; color: #d8e0f0; }
        .preview-modal .phone-frame .preview-content p { margin-bottom: 10px; }
        .preview-modal .phone-frame .preview-content ul, 
        .preview-modal .phone-frame .preview-content ol { margin: 6px 0 10px 20px; }
        .preview-modal .phone-frame .preview-content li { margin-bottom: 3px; }
        .preview-modal .phone-frame .preview-header {
            font-size: 11px;
            color: #6a7a92;
            text-align: center;
            padding-bottom: 12px;
            border-bottom: 1px solid rgba(255,255,255,0.04);
            margin-bottom: 16px;
        }
        .preview-modal .close-preview {
            position: absolute;
            top: 12px;
            right: 12px;
            background: rgba(255,255,255,0.06);
            border: 1px solid rgba(255,255,255,0.08);
            border-radius: 50%;
            width: 36px;
            height: 36px;
            color: #8892a8;
            cursor: pointer;
            font-size: 16px;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: 0.2s;
        }
        .preview-modal .close-preview:hover {
            background: rgba(255,255,255,0.12);
            color: #d8e0f0;
        }
        .preview-modal .preview-label {
            font-size: 10px;
            color: #4a5a72;
            text-align: center;
            margin-top: 12px;
            letter-spacing: 1px;
        }

        @media (max-width: 768px) {
            .content-tab-btn {
                font-size: 11px !important;
                padding: 8px 12px !important;
                min-width: 60px !important;
            }
            .content-item {
                flex-wrap: wrap;
                gap: 10px;
                padding: 12px 16px;
            }
            .content-item .item-info {
                flex-wrap: wrap;
                gap: 6px;
            }
            .content-item .item-actions {
                width: 100%;
                justify-content: flex-end;
            }
            .preview-modal .phone-frame {
                border-radius: 24px;
                padding: 16px 12px;
            }
            .editor-toolbar button {
                font-size: 10px;
                padding: 3px 8px;
            }
        }
    `;
    document.head.appendChild(style);

    // ===== 绑定事件 =====
    // 标签切换
    document.querySelectorAll('.content-tab-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.content-tab-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            currentContentTab = this.dataset.tab;
            renderContentList();
        });
    });

    // 添加内容
    document.getElementById('addContentBtn')?.addEventListener('click', openAddContentModal);

    // 排列内容
    document.getElementById('arrangeContentBtn')?.addEventListener('click', toggleArrangeMode);

    // 刷新
    document.getElementById('refreshContentBtn')?.addEventListener('click', async function() {
        await loadAllContentData();
        renderContentList();
        showToast('Content refreshed', 'success');
    });

    // 初始渲染
    renderContentList();
}

// ============================================================
// 加载所有内容数据
// ============================================================
async function loadAllContentData() {
    try {
        // 1. 加载 Events
        const { data: events } = await sb
            .from('events')
            .select('*')
            .order('sort_order', { ascending: true });
        eventsList = events || [];

        // 2. 加载 Certificate (Company Profile)
        const { data: cert } = await sb
            .from('system_content')
            .select('*')
            .eq('type', 'company')
            .single();
        contentData.certificate = cert || null;

        // 3. 加载 Contract
        const { data: contract } = await sb
            .from('system_content')
            .select('*')
            .eq('type', 'contract')
            .single();
        contentData.contract = contract || null;

        // 4. 加载 T&C
        const { data: tc } = await sb
            .from('system_content')
            .select('*')
            .eq('type', 'tc')
            .single();
        contentData.tc = tc || null;

        // 5. 加载 Privacy
        const { data: privacy } = await sb
            .from('system_content')
            .select('*')
            .eq('type', 'privacy')
            .single();
        contentData.privacy = privacy || null;

        // 6. 加载 Rules
        const { data: rules } = await sb
            .from('system_content')
            .select('*')
            .eq('type', 'rules')
            .single();
        contentData.rules = rules || null;

        console.log('✅ 所有内容数据加载完成');
        console.log('   Events:', eventsList.length);
        console.log('   Certificate:', contentData.certificate ? '✓' : '✗');
        console.log('   Contract:', contentData.contract ? '✓' : '✗');
        console.log('   T&C:', contentData.tc ? '✓' : '✗');
        console.log('   Privacy:', contentData.privacy ? '✓' : '✗');
        console.log('   Rules:', contentData.rules ? '✓' : '✗');

    } catch (e) {
        console.error('加载内容数据失败:', e);
    }
}

// ============================================================
// 渲染内容列表
// ============================================================
function renderContentList() {
    const container = document.getElementById('contentListContainer');
    if (!container) return;

    const tab = currentContentTab;
    let items = [];
    let title = '';

    if (tab === 'events') {
        items = eventsList.map(e => ({
            id: e.id,
            title: e.title || 'Untitled Event',
            subtitle: e.event_date ? new Date(e.event_date).toLocaleDateString() : 'No date',
            status: e.status || 'active',
            type: 'event',
            data: e
        }));
        title = 'Events';
    } else if (tab === 'certificate') {
        const d = contentData.certificate;
        items = d ? [{
            id: d.id || 'cert',
            title: 'Certificate & Company Profile',
            subtitle: d.content ? d.content.substring(0, 60) + '...' : 'No content',
            status: d.content ? 'active' : 'inactive',
            type: 'certificate',
            data: d
        }] : [];
        title = 'Certificate & Company Profile';
    } else if (tab === 'contract') {
        const d = contentData.contract;
        items = d ? [{
            id: d.id || 'contract',
            title: 'Employment Contract',
            subtitle: d.content ? d.content.substring(0, 60) + '...' : 'No content',
            status: d.content ? 'active' : 'inactive',
            type: 'contract',
            data: d
        }] : [];
        title = 'Employment Contract';
    } else if (tab === 'tc') {
        const d = contentData.tc;
        items = d ? [{
            id: d.id || 'tc',
            title: 'Terms & Conditions',
            subtitle: d.content ? d.content.substring(0, 60) + '...' : 'No content',
            status: d.content ? 'active' : 'inactive',
            type: 'tc',
            data: d
        }] : [];
        title = 'Terms & Conditions';
    } else if (tab === 'privacy') {
        const d = contentData.privacy;
        items = d ? [{
            id: d.id || 'privacy',
            title: 'Privacy & Security',
            subtitle: d.content ? d.content.substring(0, 60) + '...' : 'No content',
            status: d.content ? 'active' : 'inactive',
            type: 'privacy',
            data: d
        }] : [];
        title = 'Privacy & Security';
    } else if (tab === 'rules') {
        const d = contentData.rules;
        items = d ? [{
            id: d.id || 'rules',
            title: 'Platform Rules',
            subtitle: d.content ? d.content.substring(0, 60) + '...' : 'No content',
            status: d.content ? 'active' : 'inactive',
            type: 'rules',
            data: d
        }] : [];
        title = 'Platform Rules';
    }

    if (items.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 60px 20px; color: #6a7a92; font-size: 14px;">
                <i class="fas fa-file-alt" style="display: block; font-size: 40px; color: #4a5a72; margin-bottom: 16px;"></i>
                No ${title} found
                <div style="font-size: 12px; color: #4a5a72; margin-top: 4px;">Click "Add Event" to create one</div>
            </div>
        `;
        return;
    }

    const isArrangeMode = document.getElementById('arrangeContentBtn')?.classList.contains('active') || false;

    let html = '';
    items.forEach((item, index) => {
        const statusClass = item.status === 'active' ? 'status-active' : 'status-inactive';
        const statusText = item.status === 'active' ? 'Active' : 'Inactive';

        html += `
            <div class="content-item" data-id="${item.id}" data-type="${item.type}" data-index="${index}" draggable="${isArrangeMode}">
                <div style="display: flex; align-items: center; flex: 1; min-width: 0;">
                    ${isArrangeMode ? `<span class="drag-handle"><i class="fas fa-grip-vertical"></i></span>` : ''}
                    <div class="item-info">
                        <span class="item-title">${escapeHtml(item.title)}</span>
                        <span class="item-sub">${escapeHtml(item.subtitle)}</span>
                        <span class="item-status ${statusClass}">${statusText}</span>
                    </div>
                </div>
                <div class="item-actions">
                    <button class="btn-edit" onclick="openEditContentModal('${item.type}', '${item.id}')">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    ${item.type === 'event' ? `<button class="btn-delete" onclick="deleteEventItem('${item.id}')">
                        <i class="fas fa-trash"></i> Delete
                    </button>` : ''}
                </div>
            </div>
        `;
    });

    container.innerHTML = html;

    // 拖拽事件
    if (isArrangeMode) {
        setupDragAndDrop(container);
        document.getElementById('arrangeHint').style.display = 'inline';
    } else {
        document.getElementById('arrangeHint').style.display = 'none';
    }
}

// ============================================================
// 拖拽排序功能
// ============================================================
function setupDragAndDrop(container) {
    const items = container.querySelectorAll('.content-item');

    items.forEach(item => {
        item.addEventListener('dragstart', function(e) {
            this.classList.add('dragging');
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/plain', this.dataset.index);
        });

        item.addEventListener('dragend', function(e) {
            this.classList.remove('dragging');
            document.querySelectorAll('.content-item').forEach(el => el.classList.remove('drag-over'));
        });

        item.addEventListener('dragover', function(e) {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            document.querySelectorAll('.content-item').forEach(el => el.classList.remove('drag-over'));
            this.classList.add('drag-over');
        });

        item.addEventListener('dragleave', function(e) {
            this.classList.remove('drag-over');
        });

        item.addEventListener('drop', function(e) {
            e.preventDefault();
            this.classList.remove('drag-over');

            const fromIndex = parseInt(e.dataTransfer.getData('text/plain'));
            const toIndex = parseInt(this.dataset.index);

            if (fromIndex === toIndex) return;

            // 重新排序 eventsList
            const [movedItem] = eventsList.splice(fromIndex, 1);
            eventsList.splice(toIndex, 0, movedItem);

            // 更新 sort_order
            eventsList.forEach((item, idx) => {
                item.sort_order = idx;
            });

            // 保存到数据库
            saveEventsOrder();

            // 重新渲染
            renderContentList();
            showToast('Order updated', 'success');
        });
    });
}

// ============================================================
// 切换排列模式
// ============================================================
function toggleArrangeMode() {
    const btn = document.getElementById('arrangeContentBtn');
    const isActive = btn.classList.contains('active');

    if (isActive) {
        btn.classList.remove('active');
        btn.style.borderColor = 'rgba(255,255,255,0.06)';
        btn.style.background = 'rgba(255,255,255,0.06)';
        btn.style.color = '#c8b090';
        renderContentList();
    } else {
        btn.classList.add('active');
        btn.style.borderColor = 'rgba(200,176,144,0.3)';
        btn.style.background = 'rgba(200,176,144,0.08)';
        btn.style.color = '#ffffff';
        renderContentList();
    }
}

// ============================================================
// 保存 Events 排序
// ============================================================
async function saveEventsOrder() {
    try {
        for (const event of eventsList) {
            await sb
                .from('events')
                .update({ sort_order: event.sort_order || 0 })
                .eq('id', event.id);
        }
        console.log('✅ Events order saved');
    } catch (e) {
        console.error('保存排序失败:', e);
    }
}

// ============================================================
// 删除 Event
// ============================================================
window.deleteEventItem = function(id) {
    showConfirm('Delete Event', 'Are you sure you want to delete this event?', async function() {
        try {
            await sb.from('events').delete().eq('id', parseInt(id));
            await loadAllContentData();
            renderContentList();
            showToast('Event deleted', 'success');
        } catch (e) {
            showToast('Delete failed: ' + e.message, 'error');
        }
    });
};

// ============================================================
// 打开添加内容弹窗 (Add Event)
// ============================================================
function openAddContentModal() {
    // 重置编辑器
    editorContent = '';
    editorImages = [];

    const modalHtml = `
        <div id="addContentModal" class="modal-overlay" style="visibility: visible; opacity: 1; display: flex; align-items: center; justify-content: center; z-index: 20000;">
            <div class="modal-card" style="width: 820px; max-width: 94%; max-height: 90vh; overflow-y: auto; background: linear-gradient(160deg, #1a1428, #0e0a1a); border: 1px solid rgba(200,176,144,0.1); border-radius: 24px; padding: 28px 30px; box-shadow: 0 30px 80px rgba(0,0,0,0.6);">
                
                <!-- 标题 -->
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                    <h3 style="font-size: 18px; font-weight: 600; color: #d8e0f0; margin: 0;">
                        <i class="fas fa-plus" style="color: #c8b090; margin-right: 10px;"></i>
                        Add Event
                    </h3>
                    <button onclick="closeContentModal()" style="background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.06); border-radius: 50%; width: 32px; height: 32px; color: #6a7a92; cursor: pointer; font-size: 16px; display: flex; align-items: center; justify-content: center;">
                        <i class="fas fa-times"></i>
                    </button>
                </div>

                <!-- ===== 内容编辑器 ===== -->
                <div style="margin-bottom: 16px;">
                    <label style="display: block; font-size: 11px; color: #6a7a92; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">Event Title</label>
                    <input type="text" id="eventTitleInput" placeholder="Enter event title..." style="width: 100%; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.06); border-radius: 10px; padding: 10px 16px; color: #d8e0f0; font-size: 14px; outline: none; font-family: 'Inter', sans-serif;">
                </div>

                <!-- ===== 富文本工具栏 ===== -->
                <div style="margin-bottom: 4px;">
                    <label style="display: block; font-size: 11px; color: #6a7a92; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">Content</label>
                    <div class="editor-toolbar">
                        <button onclick="execCommand('bold')" title="Bold"><b>B</b></button>
                        <button onclick="execCommand('italic')" title="Italic"><i>I</i></button>
                        <button onclick="execCommand('underline')" title="Underline"><u>U</u></button>
                        <span style="color: #3a4a5a;">|</span>
                        <button onclick="execCommand('formatBlock', 'h1')" title="Heading 1">H1</button>
                        <button onclick="execCommand('formatBlock', 'h2')" title="Heading 2">H2</button>
                        <button onclick="execCommand('formatBlock', 'h3')" title="Heading 3">H3</button>
                        <span style="color: #3a4a5a;">|</span>
                        <button onclick="execCommand('insertUnorderedList')" title="Bullet List"><i class="fas fa-list-ul"></i></button>
                        <button onclick="execCommand('insertOrderedList')" title="Numbered List"><i class="fas fa-list-ol"></i></button>
                        <span style="color: #3a4a5a;">|</span>
                        <button onclick="execCommand('foreColor', '#c8b090')" title="Gold Color"><i class="fas fa-palette" style="color: #c8b090;"></i></button>
                        <button onclick="execCommand('foreColor', '#ffffff')" title="White Color"><i class="fas fa-palette" style="color: #ffffff;"></i></button>
                        <span style="color: #3a4a5a;">|</span>
                        <button onclick="uploadEditorImage()" title="Insert Image"><i class="fas fa-image"></i></button>
                        <button onclick="insertLink()" title="Insert Link"><i class="fas fa-link"></i></button>
                    </div>
                    <div class="editor-content" id="eventEditor" contenteditable="true" placeholder="Write your content here..."></div>
                </div>

                <!-- ===== 图片上传预览 ===== -->
                <div id="editorImagePreview" style="display: flex; gap: 8px; flex-wrap: wrap; margin: 8px 0 12px 0; padding: 8px; background: rgba(0,0,0,0.15); border-radius: 8px; min-height: 30px;">
                    <span style="font-size: 11px; color: #6a7a92;">Uploaded images will appear here</span>
                </div>

                <!-- ===== 操作按钮 ===== -->
                <div style="display: flex; gap: 12px; margin-top: 16px; border-top: 1px solid rgba(255,255,255,0.04); padding-top: 16px;">
                    <button onclick="previewContent()" class="btn-primary" style="padding: 10px 24px; border-radius: 40px; border: 1px solid rgba(200,176,144,0.15); background: rgba(200,176,144,0.06); color: #c8b090; font-weight: 600; cursor: pointer; font-size: 13px; font-family: 'Inter', sans-serif; display: inline-flex; align-items: center; gap: 6px;">
                        <i class="fas fa-eye"></i> Preview
                    </button>
                    <button onclick="postContent()" class="success" style="padding: 10px 32px; border-radius: 40px; border: 1px solid rgba(74,222,128,0.15); background: rgba(74,222,128,0.06); color: #4ade80; font-weight: 600; cursor: pointer; font-size: 13px; font-family: 'Inter', sans-serif; display: inline-flex; align-items: center; gap: 6px;">
                        <i class="fas fa-upload"></i> Post Content
                    </button>
                    <button onclick="closeContentModal()" style="padding: 10px 24px; border-radius: 40px; border: 1px solid rgba(255,255,255,0.06); background: transparent; color: #6a7a92; font-weight: 500; cursor: pointer; font-size: 13px; font-family: 'Inter', sans-serif;">
                        Cancel
                    </button>
                </div>

                <!-- ===== 状态提示 ===== -->
                <div id="contentStatus" style="margin-top: 12px; font-size: 12px; color: #6a7a92; text-align: center;"></div>
            </div>
        </div>
    `;

    // 移除旧弹窗
    const existing = document.getElementById('addContentModal');
    if (existing) existing.remove();

    document.body.insertAdjacentHTML('beforeend', modalHtml);

    // 聚焦编辑器
    setTimeout(() => {
        const editor = document.getElementById('eventEditor');
        if (editor) editor.focus();
    }, 300);
}

// ============================================================
// 关闭弹窗
// ============================================================
window.closeContentModal = function() {
    const modal = document.getElementById('addContentModal');
    if (modal) modal.remove();

    const preview = document.querySelector('.preview-modal');
    if (preview) preview.remove();
};

// ============================================================
// 富文本编辑器命令
// ============================================================
window.execCommand = function(command, value) {
    document.execCommand(command, false, value || null);
    document.getElementById('eventEditor')?.focus();
};

// ============================================================
// 插入链接
// ============================================================
window.insertLink = function() {
    const url = prompt('Enter URL:', 'https://');
    if (url) {
        document.execCommand('createLink', false, url);
    }
};

// ============================================================
// 上传编辑器图片
// ============================================================
window.uploadEditorImage = function() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.multiple = true;
    input.onchange = async function(e) {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        for (const file of files) {
            if (!file.type.startsWith('image/')) continue;
            if (file.size > 5 * 1024 * 1024) {
                showToast('Image must be less than 5MB', 'error');
                continue;
            }

            try {
                const url = await uploadContentImage(file);
                if (url) {
                    // 插入图片到编辑器
                    document.execCommand('insertImage', false, url);
                    // 添加到预览列表
                    addImageToPreview(url);
                    showToast('Image uploaded', 'success');
                }
            } catch (err) {
                showToast('Upload failed: ' + err.message, 'error');
            }
        }
    };
    input.click();
};

// ============================================================
// 上传图片到存储
// ============================================================
async function uploadContentImage(file) {
    const fileName = `content/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const storageBucket = 'content-images';

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
    editorImages.push(publicUrl);
    return publicUrl;
}

// ============================================================
// 添加图片到预览列表
// ============================================================
function addImageToPreview(url) {
    const container = document.getElementById('editorImagePreview');
    if (!container) return;

    // 移除占位文字
    const placeholder = container.querySelector('span');
    if (placeholder && container.children.length === 1) {
        container.innerHTML = '';
    }

    const div = document.createElement('div');
    div.style.cssText = 'position: relative; display: inline-block; width: 80px; height: 60px; border-radius: 6px; overflow: hidden; border: 1px solid rgba(255,255,255,0.06);';
    div.innerHTML = `
        <img src="${url}" style="width: 100%; height: 100%; object-fit: cover;">
        <button onclick="removeEditorImage(this, '${url}')" style="position: absolute; top: 2px; right: 2px; background: rgba(232,128,128,0.8); border: none; border-radius: 50%; width: 18px; height: 18px; color: #fff; cursor: pointer; font-size: 10px; display: flex; align-items: center; justify-content: center; padding: 0;">
            <i class="fas fa-times"></i>
        </button>
    `;
    container.appendChild(div);
}

// ============================================================
// 移除编辑器图片
// ============================================================
window.removeEditorImage = function(btn, url) {
    const index = editorImages.indexOf(url);
    if (index > -1) {
        editorImages.splice(index, 1);
    }
    const div = btn.closest('div');
    if (div) div.remove();

    // 如果没有图片了，恢复占位文字
    const container = document.getElementById('editorImagePreview');
    if (container && container.children.length === 0) {
        container.innerHTML = '<span style="font-size: 11px; color: #6a7a92;">Uploaded images will appear here</span>';
    }
};

// ============================================================
// 预览内容
// ============================================================
window.previewContent = function() {
    const editor = document.getElementById('eventEditor');
    if (!editor) return;

    const content = editor.innerHTML;
    const title = document.getElementById('eventTitleInput')?.value || 'Untitled Event';

    const previewHtml = `
        <div class="preview-modal active" id="previewModal">
            <div class="phone-frame" style="position: relative;">
                <button class="close-preview" onclick="closePreview()">
                    <i class="fas fa-times"></i>
                </button>
                <div class="preview-header">
                    <i class="fas fa-mobile-alt"></i> ADDITIVE · Preview
                </div>
                <div class="preview-content">
                    <h2 style="color: #c8b090; font-size: 20px;">${escapeHtml(title)}</h2>
                    ${content}
                </div>
                <div class="preview-label">— Mobile Preview —</div>
            </div>
        </div>
    `;

    // 移除旧的预览
    const existing = document.querySelector('.preview-modal');
    if (existing) existing.remove();

    document.body.insertAdjacentHTML('beforeend', previewHtml);

    // 点击背景关闭
    document.getElementById('previewModal')?.addEventListener('click', function(e) {
        if (e.target === this) closePreview();
    });
};

// ============================================================
// 关闭预览
// ============================================================
window.closePreview = function() {
    const modal = document.querySelector('.preview-modal');
    if (modal) modal.remove();
};

// ============================================================
// 发布内容 (Post Content)
// ============================================================
window.postContent = async function() {
    const title = document.getElementById('eventTitleInput')?.value.trim();
    const editor = document.getElementById('eventEditor');
    const content = editor ? editor.innerHTML : '';
    const statusEl = document.getElementById('contentStatus');

    if (!title) {
        if (statusEl) statusEl.innerHTML = '<span style="color: #e88080;">⚠️ Please enter a title</span>';
        return;
    }
    if (!content || content === '<br>' || content === '<div><br></div>') {
        if (statusEl) statusEl.innerHTML = '<span style="color: #e88080;">⚠️ Please enter some content</span>';
        return;
    }

    if (statusEl) statusEl.innerHTML = '<span style="color: #c8b090;"><i class="fas fa-spinner fa-spin"></i> Posting...</span>';

    try {
        // 如果是 Events 标签
        if (currentContentTab === 'events') {
            const newEvent = {
                title: title,
                content: content,
                short_description: content.replace(/<[^>]*>/g, '').substring(0, 150),
                image_url: editorImages.length > 0 ? editorImages[0] : '',
                status: 'active',
                sort_order: eventsList.length,
                created_at: new Date().toISOString()
            };

            const { data, error } = await sb
                .from('events')
                .insert([newEvent])
                .select();

            if (error) throw error;

            await loadAllContentData();
            renderContentList();
            closeContentModal();
            showToast('✅ Event posted successfully!', 'success');

        } else {
            // 其他内容类型 (Certificate, Contract, T&C, Privacy, Rules)
            const typeMap = {
                'certificate': 'company',
                'contract': 'contract',
                'tc': 'tc',
                'privacy': 'privacy',
                'rules': 'rules'
            };
            const type = typeMap[currentContentTab] || currentContentTab;

            // 检查是否已存在
            const existing = contentData[currentContentTab];
            const imageUrlsJson = JSON.stringify(editorImages);

            if (existing) {
                const { error } = await sb
                    .from('system_content')
                    .update({
                        title: title,
                        content: content,
                        image_url: imageUrlsJson,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', existing.id);

                if (error) throw error;
            } else {
                const { error } = await sb
                    .from('system_content')
                    .insert([{
                        type: type,
                        title: title,
                        content: content,
                        image_url: imageUrlsJson,
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString()
                    }]);

                if (error) throw error;
            }

            await loadAllContentData();
            renderContentList();
            closeContentModal();
            showToast('✅ Content posted successfully!', 'success');
        }

    } catch (e) {
        console.error('Post failed:', e);
        if (statusEl) statusEl.innerHTML = `<span style="color: #e88080;">❌ Failed: ${e.message}</span>`;
        showToast('Failed: ' + e.message, 'error');
    }
};

// ============================================================
// 编辑内容
// ============================================================
window.openEditContentModal = function(type, id) {
    let item = null;
    let title = '';

    if (type === 'event') {
        item = eventsList.find(e => e.id == id);
        title = item?.title || 'Edit Event';
    } else {
        const data = contentData[type];
        if (data) {
            item = data;
            title = item?.title || 'Edit Content';
            // 如果是 certificate，使用 company 的 content
        }
    }

    if (!item) {
        showToast('Item not found', 'error');
        return;
    }

    // 提取图片
    let images = [];
    if (item.image_url) {
        try {
            const parsed = JSON.parse(item.image_url);
            if (Array.isArray(parsed)) images = parsed;
            else if (typeof parsed === 'string') images = [parsed];
        } catch (e) {
            if (item.image_url) images = [item.image_url];
        }
    }
    editorImages = images;

    const modalHtml = `
        <div id="editContentModal" class="modal-overlay" style="visibility: visible; opacity: 1; display: flex; align-items: center; justify-content: center; z-index: 20000;">
            <div class="modal-card" style="width: 820px; max-width: 94%; max-height: 90vh; overflow-y: auto; background: linear-gradient(160deg, #1a1428, #0e0a1a); border: 1px solid rgba(200,176,144,0.1); border-radius: 24px; padding: 28px 30px; box-shadow: 0 30px 80px rgba(0,0,0,0.6);">
                
                <!-- 标题 -->
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                    <h3 style="font-size: 18px; font-weight: 600; color: #d8e0f0; margin: 0;">
                        <i class="fas fa-edit" style="color: #c8b090; margin-right: 10px;"></i>
                        ${escapeHtml(title)}
                    </h3>
                    <button onclick="closeEditModal()" style="background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.06); border-radius: 50%; width: 32px; height: 32px; color: #6a7a92; cursor: pointer; font-size: 16px; display: flex; align-items: center; justify-content: center;">
                        <i class="fas fa-times"></i>
                    </button>
                </div>

                <!-- 标题输入 -->
                <div style="margin-bottom: 16px;">
                    <label style="display: block; font-size: 11px; color: #6a7a92; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">Title</label>
                    <input type="text" id="editTitleInput" value="${escapeHtml(item.title || '')}" style="width: 100%; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.06); border-radius: 10px; padding: 10px 16px; color: #d8e0f0; font-size: 14px; outline: none; font-family: 'Inter', sans-serif;">
                </div>

                <!-- 工具栏 -->
                <div style="margin-bottom: 4px;">
                    <label style="display: block; font-size: 11px; color: #6a7a92; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">Content</label>
                    <div class="editor-toolbar">
                        <button onclick="execCommand('bold')" title="Bold"><b>B</b></button>
                        <button onclick="execCommand('italic')" title="Italic"><i>I</i></button>
                        <button onclick="execCommand('underline')" title="Underline"><u>U</u></button>
                        <span style="color: #3a4a5a;">|</span>
                        <button onclick="execCommand('formatBlock', 'h1')">H1</button>
                        <button onclick="execCommand('formatBlock', 'h2')">H2</button>
                        <button onclick="execCommand('formatBlock', 'h3')">H3</button>
                        <span style="color: #3a4a5a;">|</span>
                        <button onclick="execCommand('insertUnorderedList')"><i class="fas fa-list-ul"></i></button>
                        <button onclick="execCommand('insertOrderedList')"><i class="fas fa-list-ol"></i></button>
                        <span style="color: #3a4a5a;">|</span>
                        <button onclick="execCommand('foreColor', '#c8b090')"><i class="fas fa-palette" style="color: #c8b090;"></i></button>
                        <button onclick="execCommand('foreColor', '#ffffff')"><i class="fas fa-palette" style="color: #ffffff;"></i></button>
                        <span style="color: #3a4a5a;">|</span>
                        <button onclick="uploadEditorImage()"><i class="fas fa-image"></i></button>
                        <button onclick="insertLink()"><i class="fas fa-link"></i></button>
                    </div>
                    <div class="editor-content" id="editEditor" contenteditable="true">${item.content || ''}</div>
                </div>

                <!-- 图片预览 -->
                <div id="editImagePreview" style="display: flex; gap: 8px; flex-wrap: wrap; margin: 8px 0 12px 0; padding: 8px; background: rgba(0,0,0,0.15); border-radius: 8px; min-height: 30px;">
                    ${images.length > 0 ? images.map(url => `
                        <div style="position: relative; display: inline-block; width: 80px; height: 60px; border-radius: 6px; overflow: hidden; border: 1px solid rgba(255,255,255,0.06);">
                            <img src="${url}" style="width: 100%; height: 100%; object-fit: cover;">
                            <button onclick="removeEditImage(this, '${url}')" style="position: absolute; top: 2px; right: 2px; background: rgba(232,128,128,0.8); border: none; border-radius: 50%; width: 18px; height: 18px; color: #fff; cursor: pointer; font-size: 10px; display: flex; align-items: center; justify-content: center; padding: 0;">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                    `).join('') : '<span style="font-size: 11px; color: #6a7a92;">Uploaded images will appear here</span>'}
                </div>

                <!-- 操作按钮 -->
                <div style="display: flex; gap: 12px; margin-top: 16px; border-top: 1px solid rgba(255,255,255,0.04); padding-top: 16px;">
                    <button onclick="previewEditContent()" class="btn-primary" style="padding: 10px 24px; border-radius: 40px; border: 1px solid rgba(200,176,144,0.15); background: rgba(200,176,144,0.06); color: #c8b090; font-weight: 600; cursor: pointer; font-size: 13px; font-family: 'Inter', sans-serif; display: inline-flex; align-items: center; gap: 6px;">
                        <i class="fas fa-eye"></i> Preview
                    </button>
                    <button onclick="updateContent('${type}', '${id}')" class="success" style="padding: 10px 32px; border-radius: 40px; border: 1px solid rgba(74,222,128,0.15); background: rgba(74,222,128,0.06); color: #4ade80; font-weight: 600; cursor: pointer; font-size: 13px; font-family: 'Inter', sans-serif; display: inline-flex; align-items: center; gap: 6px;">
                        <i class="fas fa-save"></i> Update
                    </button>
                    <button onclick="closeEditModal()" style="padding: 10px 24px; border-radius: 40px; border: 1px solid rgba(255,255,255,0.06); background: transparent; color: #6a7a92; font-weight: 500; cursor: pointer; font-size: 13px; font-family: 'Inter', sans-serif;">
                        Cancel
                    </button>
                </div>

                <div id="editStatus" style="margin-top: 12px; font-size: 12px; color: #6a7a92; text-align: center;"></div>
            </div>
        </div>
    `;

    const existing = document.getElementById('editContentModal');
    if (existing) existing.remove();

    document.body.insertAdjacentHTML('beforeend', modalHtml);
};

// ============================================================
// 关闭编辑弹窗
// ============================================================
window.closeEditModal = function() {
    const modal = document.getElementById('editContentModal');
    if (modal) modal.remove();
    const preview = document.querySelector('.preview-modal');
    if (preview) preview.remove();
};

// ============================================================
// 预览编辑内容
// ============================================================
window.previewEditContent = function() {
    const editor = document.getElementById('editEditor');
    if (!editor) return;

    const content = editor.innerHTML;
    const title = document.getElementById('editTitleInput')?.value || 'Content Preview';

    const previewHtml = `
        <div class="preview-modal active" id="previewModal">
            <div class="phone-frame" style="position: relative;">
                <button class="close-preview" onclick="closePreview()">
                    <i class="fas fa-times"></i>
                </button>
                <div class="preview-header">
                    <i class="fas fa-mobile-alt"></i> ADDITIVE · Preview
                </div>
                <div class="preview-content">
                    <h2 style="color: #c8b090; font-size: 20px;">${escapeHtml(title)}</h2>
                    ${content}
                </div>
                <div class="preview-label">— Mobile Preview —</div>
            </div>
        </div>
    `;

    const existing = document.querySelector('.preview-modal');
    if (existing) existing.remove();

    document.body.insertAdjacentHTML('beforeend', previewHtml);

    document.getElementById('previewModal')?.addEventListener('click', function(e) {
        if (e.target === this) closePreview();
    });
};

// ============================================================
// 更新内容
// ============================================================
window.updateContent = async function(type, id) {
    const title = document.getElementById('editTitleInput')?.value.trim();
    const editor = document.getElementById('editEditor');
    const content = editor ? editor.innerHTML : '';
    const statusEl = document.getElementById('editStatus');

    if (!title) {
        if (statusEl) statusEl.innerHTML = '<span style="color: #e88080;">⚠️ Please enter a title</span>';
        return;
    }

    if (statusEl) statusEl.innerHTML = '<span style="color: #c8b090;"><i class="fas fa-spinner fa-spin"></i> Updating...</span>';

    try {
        const imageUrlsJson = JSON.stringify(editorImages);

        if (type === 'event') {
            const { error } = await sb
                .from('events')
                .update({
                    title: title,
                    content: content,
                    short_description: content.replace(/<[^>]*>/g, '').substring(0, 150),
                    image_url: editorImages.length > 0 ? editorImages[0] : '',
                    updated_at: new Date().toISOString()
                })
                .eq('id', parseInt(id));

            if (error) throw error;

        } else {
            // 其他类型
            const typeMap = {
                'certificate': 'company',
                'contract': 'contract',
                'tc': 'tc',
                'privacy': 'privacy',
                'rules': 'rules'
            };
            const dbType = typeMap[type] || type;

            // 获取现有记录
            const existing = contentData[type];
            if (existing) {
                const { error } = await sb
                    .from('system_content')
                    .update({
                        title: title,
                        content: content,
                        image_url: imageUrlsJson,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', existing.id);

                if (error) throw error;
            } else {
                const { error } = await sb
                    .from('system_content')
                    .insert([{
                        type: dbType,
                        title: title,
                        content: content,
                        image_url: imageUrlsJson,
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString()
                    }]);

                if (error) throw error;
            }
        }

        await loadAllContentData();
        renderContentList();
        closeEditModal();
        showToast('✅ Content updated successfully!', 'success');

    } catch (e) {
        console.error('Update failed:', e);
        if (statusEl) statusEl.innerHTML = `<span style="color: #e88080;">❌ Failed: ${e.message}</span>`;
        showToast('Failed: ' + e.message, 'error');
    }
};

// ============================================================
// 移除编辑图片
// ============================================================
window.removeEditImage = function(btn, url) {
    const index = editorImages.indexOf(url);
    if (index > -1) {
        editorImages.splice(index, 1);
    }
    const div = btn.closest('div');
    if (div) div.remove();

    const container = document.getElementById('editImagePreview');
    if (container && container.children.length === 0) {
        container.innerHTML = '<span style="font-size: 11px; color: #6a7a92;">Uploaded images will appear here</span>';
    }
};

// ============================================================
// 工具函数
// ============================================================
function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

function showToast(msg, type) {
    // 使用现有的 toast 系统
    if (typeof window.showToast === 'function') {
        window.showToast(msg, type);
    } else {
        console.log(`[${type}]`, msg);
        alert(msg);
    }
}

// ============================================================
// 暴露全局
// ============================================================
window.loadContentPage = loadContentPage;
window.renderContentList = renderContentList;
window.loadAllContentData = loadAllContentData;

console.log('✅ admin-content.js loaded (完整版)');
console.log('   - 支持 6 个内容模块');
console.log('   - 富文本编辑器带工具栏');
console.log('   - 拖拽排序功能');
console.log('   - 移动端预览功能');
console.log('   - 与 Withdrawal 页面风格一致');