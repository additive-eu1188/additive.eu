// admin-content.js - 内容管理页面（性能优化版 + 编辑器字体大小/样式）
// 所有内容统一使用 system_content 表

// ============================================================
// 全局状态
// ============================================================
if (typeof window._contentState === 'undefined') {
    window._contentState = {
        currentTab: 'events',
        contentData: {},
        eventsList: [],
        isDragging: false,
        dragStartIndex: null,
        draggedElement: null,
        currentPage: 1,
        pageSize: 10,
        totalItems: 0,
        fontSizeLevel: 0
    };
}

const state = window._contentState;
const FONT_SIZE_STEPS = [12, 13, 14, 16, 18];
const FONT_SIZE_LABELS = ['小', '较小', '默认', '较大', '大'];

let imageObserver = null;
let editorContent = '';
let editorImages = [];

// ============================================================
// 加载主页面
// ============================================================
async function loadContentPage() {
    const container = document.getElementById('page_content');
    if (!container) return;

    await loadAllContentData();

    container.innerHTML = `
        <div class="card" style="background: rgba(12, 16, 28, 0.6); backdrop-filter: blur(16px); border-radius: 20px; border: 1px solid rgba(255,255,255,0.04); padding: 24px;">
            
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
                <div style="display: flex; gap: 10px; flex-wrap: wrap; align-items: center;">
                    <div style="display: flex; gap: 4px; background: rgba(255,255,255,0.03); border-radius: 30px; padding: 4px; border: 1px solid rgba(255,255,255,0.04);">
                        <button id="fontSizeDecreaseBtn" class="font-size-btn" title="缩小字体" style="background: rgba(255,255,255,0.04); border: none; border-radius: 30px; padding: 4px 10px; color: #8892a8; cursor: pointer; font-size: 12px; transition: 0.2s; font-family: 'Inter', sans-serif;">
                            <i class="fas fa-search-minus"></i>
                        </button>
                        <span id="fontSizeLabel" style="font-size: 11px; color: #6a7a92; padding: 4px 6px; min-width: 32px; text-align: center; font-weight: 500;">默认</span>
                        <button id="fontSizeIncreaseBtn" class="font-size-btn" title="放大字体" style="background: rgba(255,255,255,0.04); border: none; border-radius: 30px; padding: 4px 10px; color: #8892a8; cursor: pointer; font-size: 12px; transition: 0.2s; font-family: 'Inter', sans-serif;">
                            <i class="fas fa-search-plus"></i>
                        </button>
                        <button id="fontSizeResetBtn" class="font-size-btn" title="重置字体大小" style="background: rgba(255,255,255,0.04); border: none; border-radius: 30px; padding: 4px 10px; color: #8892a8; cursor: pointer; font-size: 12px; transition: 0.2s; font-family: 'Inter', sans-serif;">
                            <i class="fas fa-undo-alt"></i>
                        </button>
                    </div>
                    <button id="refreshContentBtn" class="btn-primary" style="padding: 8px 20px; border-radius: 40px; border: none; background: rgba(255,255,255,0.06); color: #c8b090; font-weight: 600; cursor: pointer; font-size: 13px;">
                        <i class="fas fa-sync-alt"></i> Refresh
                    </button>
                </div>
            </div>

            <!-- ===== Tab 切换 ===== -->
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

            <div id="contentActionBar" style="display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 20px; align-items: center;">
                <button id="addContentBtn" class="success" style="background: rgba(74,222,128,0.06); border: 1px solid rgba(74,222,128,0.08); border-radius: 40px; padding: 8px 20px; color: #4ade80; font-weight: 600; font-size: 13px; cursor: pointer; transition: all 0.3s; font-family: 'Inter', sans-serif; display: inline-flex; align-items: center; gap: 6px;">
                    <i class="fas fa-plus"></i> Add Content
                </button>
                <button id="arrangeContentBtn" class="btn-primary" style="padding: 8px 20px; border-radius: 40px; border: none; background: rgba(255,255,255,0.06); color: #c8b090; font-weight: 600; cursor: pointer; font-size: 13px; font-family: 'Inter', sans-serif; display: inline-flex; align-items: center; gap: 6px;">
                    <i class="fas fa-arrows-alt"></i> Arrange
                </button>
                <span id="arrangeHint" style="font-size: 11px; color: #6a7a92; display: none;">Drag items to reorder</span>
            </div>

            <div id="contentListContainer" style="background: rgba(255,255,255,0.02); border-radius: 16px; border: 1px solid rgba(255,255,255,0.04); min-height: 200px; padding: 4px;">
            </div>
            
            <div id="contentPagination" style="display: flex; justify-content: center; gap: 6px; margin-top: 16px; flex-wrap: wrap;"></div>
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
            padding: 12px 16px;
            margin: 6px 8px;
            border: 1px solid rgba(255,255,255,0.04);
            display: flex;
            justify-content: space-between;
            align-items: center;
            transition: all 0.2s;
            cursor: default;
            gap: 12px;
        }
        .content-item:hover {
            background: rgba(255,255,255,0.04);
            border-color: rgba(200,176,144,0.10);
        }
        .thumb-container {
            display: flex;
            gap: 4px;
            flex-wrap: wrap;
            flex-shrink: 0;
        }
        .thumb-container .item-thumb {
            width: 44px;
            height: 33px;
            border-radius: 4px;
            object-fit: cover;
            border: 1px solid rgba(255,255,255,0.06);
            background: rgba(0,0,0,0.2);
        }
        .thumb-container .item-thumb-more {
            width: 44px;
            height: 33px;
            border-radius: 4px;
            background: rgba(255,255,255,0.05);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 10px;
            color: #6a7a92;
            border: 1px solid rgba(255,255,255,0.06);
            flex-shrink: 0;
        }
        .item-thumb-placeholder {
            width: 44px;
            height: 33px;
            border-radius: 4px;
            flex-shrink: 0;
            background: rgba(255,255,255,0.03);
            border: 1px dashed rgba(255,255,255,0.06);
            display: flex;
            align-items: center;
            justify-content: center;
            color: #4a5a72;
            font-size: 14px;
        }
        .content-item .item-info {
            flex: 1;
            display: flex;
            flex-direction: column;
            gap: 2px;
            min-width: 0;
        }
        .content-item .item-title {
            font-size: 14px;
            font-weight: 500;
            color: #d8e0f0;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }
        .content-item .item-sub {
            font-size: 11px;
            color: #6a7a92;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }
        .content-item .item-status {
            font-size: 10px;
            padding: 2px 12px;
            border-radius: 20px;
            flex-shrink: 0;
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
            flex-shrink: 0;
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

        .page-btn {
            background: rgba(255,255,255,0.03);
            border: 1px solid rgba(255,255,255,0.04);
            border-radius: 30px;
            padding: 6px 14px;
            color: #6a7a92;
            cursor: pointer;
            font-size: 12px;
            transition: 0.2s;
            font-family: 'Inter', sans-serif;
        }
        .page-btn:hover {
            background: rgba(255,255,255,0.06);
            color: #d8e0f0;
        }
        .page-btn.active {
            background: rgba(200,176,144,0.08);
            border-color: rgba(200,176,144,0.2);
            color: #c8b090;
        }
        .page-btn:disabled {
            opacity: 0.3;
            cursor: not-allowed;
        }

        .font-size-btn:hover {
            background: rgba(200,176,144,0.08) !important;
            color: #c8b090 !important;
        }

        /* ===== 编辑器样式 ===== */
        .editor-toolbar {
            display: flex;
            gap: 4px;
            flex-wrap: wrap;
            padding: 8px 12px;
            background: rgba(0,0,0,0.2);
            border-radius: 12px 12px 0 0;
            border: 1px solid rgba(255,255,255,0.04);
            border-bottom: none;
            align-items: center;
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
        .editor-toolbar select {
            background: rgba(255,255,255,0.06);
            border: 1px solid rgba(255,255,255,0.08);
            border-radius: 6px;
            padding: 4px 8px;
            color: #d8e0f0;
            font-size: 12px;
            font-family: 'Inter', sans-serif;
            cursor: pointer;
            outline: none;
        }
        .editor-toolbar select:hover {
            border-color: rgba(200,176,144,0.2);
        }
        .editor-toolbar select option {
            background: #1a1a2e;
            color: #d8e0f0;
        }
        .editor-toolbar .divider {
            color: #3a4a5a;
            margin: 0 2px;
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
            line-height: 1.8;
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
                flex: 1 1 100%;
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
            .editor-toolbar select {
                font-size: 10px;
                padding: 3px 6px;
            }
            .thumb-container .item-thumb {
                width: 36px;
                height: 27px;
            }
            .thumb-container .item-thumb-more {
                width: 36px;
                height: 27px;
                font-size: 9px;
            }
        }
    `;
    document.head.appendChild(style);

    // 绑定事件
    document.querySelectorAll('.content-tab-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.content-tab-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            state.currentTab = this.dataset.tab;
            state.currentPage = 1;
            renderContentList();
        });
    });

    document.getElementById('addContentBtn')?.addEventListener('click', openAddContentModal);
    document.getElementById('arrangeContentBtn')?.addEventListener('click', toggleArrangeMode);
    document.getElementById('refreshContentBtn')?.addEventListener('click', async function() {
        await loadAllContentData();
        state.currentPage = 1;
        renderContentList();
        showToast('Content refreshed', 'success');
    });

    document.getElementById('fontSizeDecreaseBtn')?.addEventListener('click', function() {
        changeFontSize(-1);
    });
    document.getElementById('fontSizeIncreaseBtn')?.addEventListener('click', function() {
        changeFontSize(1);
    });
    document.getElementById('fontSizeResetBtn')?.addEventListener('click', function() {
        resetFontSize();
    });

    loadFontSizeFromStorage();
    renderContentList();
}

// ============================================================
// 字体大小控制（列表视图）
// ============================================================
function changeFontSize(delta) {
    state.fontSizeLevel = Math.max(-2, Math.min(2, state.fontSizeLevel + delta));
    applyFontSize();
    saveFontSizeToStorage();
    updateFontSizeLabel();
}

function resetFontSize() {
    state.fontSizeLevel = 0;
    applyFontSize();
    saveFontSizeToStorage();
    updateFontSizeLabel();
    showToast('字体已重置为默认大小', 'info');
}

function applyFontSize() {
    const baseSize = FONT_SIZE_STEPS[state.fontSizeLevel + 2];
    const container = document.querySelector('#contentListContainer');
    const contentItems = document.querySelectorAll('.content-item .item-title');
    const subItems = document.querySelectorAll('.content-item .item-sub');
    const statusItems = document.querySelectorAll('.content-item .item-status');
    const actionButtons = document.querySelectorAll('.content-item .item-actions button');
    
    if (container) container.style.fontSize = baseSize + 'px';
    contentItems.forEach(el => el.style.fontSize = (baseSize) + 'px');
    subItems.forEach(el => el.style.fontSize = (baseSize - 3) + 'px');
    statusItems.forEach(el => el.style.fontSize = (baseSize - 4) + 'px');
    actionButtons.forEach(el => el.style.fontSize = (baseSize - 3) + 'px');
}

function updateFontSizeLabel() {
    const label = document.getElementById('fontSizeLabel');
    if (label) label.textContent = FONT_SIZE_LABELS[state.fontSizeLevel + 2];
}

function saveFontSizeToStorage() {
    try { localStorage.setItem('content_font_size_level', String(state.fontSizeLevel)); } catch (e) {}
}

function loadFontSizeFromStorage() {
    try {
        const saved = localStorage.getItem('content_font_size_level');
        if (saved !== null) {
            state.fontSizeLevel = parseInt(saved);
            if (isNaN(state.fontSizeLevel) || state.fontSizeLevel < -2 || state.fontSizeLevel > 2) {
                state.fontSizeLevel = 0;
            }
            applyFontSize();
            updateFontSizeLabel();
        }
    } catch (e) {}
}

// ============================================================
// 加载所有内容数据
// ============================================================
async function loadAllContentData() {
    try {
        const { data: events, error: eventsError } = await sb
            .from('system_content')
            .select('*')
            .eq('type', 'events')
            .order('id', { ascending: true });

        if (eventsError) {
            console.error('加载 Events 失败:', eventsError);
            state.eventsList = [];
        } else {
            state.eventsList = events || [];
        }

        const { data: cert, error: certError } = await sb
            .from('system_content')
            .select('*')
            .eq('type', 'company')
            .maybeSingle();
        state.contentData.certificate = cert || null;

        const { data: contract, error: contractError } = await sb
            .from('system_content')
            .select('*')
            .eq('type', 'contract')
            .maybeSingle();
        state.contentData.contract = contract || null;

        const { data: tc, error: tcError } = await sb
            .from('system_content')
            .select('*')
            .eq('type', 'tc')
            .maybeSingle();
        state.contentData.tc = tc || null;

        const { data: privacy, error: privacyError } = await sb
            .from('system_content')
            .select('*')
            .eq('type', 'privacy')
            .maybeSingle();
        state.contentData.privacy = privacy || null;

        const { data: rules, error: rulesError } = await sb
            .from('system_content')
            .select('*')
            .eq('type', 'rules')
            .maybeSingle();
        state.contentData.rules = rules || null;

        console.log('✅ 所有内容数据加载完成, Events:', state.eventsList.length);

    } catch (e) {
        console.error('加载内容数据失败:', e);
    }
}

// ============================================================
// 获取内容的所有图片 URL
// ============================================================
function getAllContentImages(item) {
    if (!item || !item.image_url) return [];
    try {
        const parsed = JSON.parse(item.image_url);
        if (Array.isArray(parsed)) return parsed;
        if (typeof parsed === 'string' && parsed.startsWith('http')) return [parsed];
    } catch (e) {
        if (typeof item.image_url === 'string' && item.image_url.startsWith('http')) {
            return [item.image_url];
        }
    }
    return [];
}

// ============================================================
// 渲染内容列表（带分页 + 懒加载）
// ============================================================
function renderContentList() {
    const container = document.getElementById('contentListContainer');
    const paginationContainer = document.getElementById('contentPagination');
    if (!container) return;

    const tab = state.currentTab;
    let items = [];
    let title = '';

    if (tab === 'events') {
        items = state.eventsList.map(e => ({
            id: e.id,
            title: e.title || 'Untitled Event',
            subtitle: e.updated_at ? new Date(e.updated_at).toLocaleDateString() : 'No date',
            status: 'active',
            type: 'event',
            data: e,
            images: getAllContentImages(e)
        }));
        title = 'Events';
    } else if (tab === 'certificate') {
        const d = state.contentData.certificate;
        items = d ? [{
            id: d.id || 'cert',
            title: 'Certificate & Company Profile',
            subtitle: d.content ? d.content.substring(0, 60) + '...' : 'No content',
            status: d.content ? 'active' : 'inactive',
            type: 'certificate',
            data: d,
            images: getAllContentImages(d)
        }] : [];
        title = 'Certificate & Company Profile';
    } else if (tab === 'contract') {
        const d = state.contentData.contract;
        items = d ? [{
            id: d.id || 'contract',
            title: 'Employment Contract',
            subtitle: d.content ? d.content.substring(0, 60) + '...' : 'No content',
            status: d.content ? 'active' : 'inactive',
            type: 'contract',
            data: d,
            images: getAllContentImages(d)
        }] : [];
        title = 'Employment Contract';
    } else if (tab === 'tc') {
        const d = state.contentData.tc;
        items = d ? [{
            id: d.id || 'tc',
            title: 'Terms & Conditions',
            subtitle: d.content ? d.content.substring(0, 60) + '...' : 'No content',
            status: d.content ? 'active' : 'inactive',
            type: 'tc',
            data: d,
            images: getAllContentImages(d)
        }] : [];
        title = 'Terms & Conditions';
    } else if (tab === 'privacy') {
        const d = state.contentData.privacy;
        items = d ? [{
            id: d.id || 'privacy',
            title: 'Privacy & Security',
            subtitle: d.content ? d.content.substring(0, 60) + '...' : 'No content',
            status: d.content ? 'active' : 'inactive',
            type: 'privacy',
            data: d,
            images: getAllContentImages(d)
        }] : [];
        title = 'Privacy & Security';
    } else if (tab === 'rules') {
        const d = state.contentData.rules;
        items = d ? [{
            id: d.id || 'rules',
            title: 'Platform Rules',
            subtitle: d.content ? d.content.substring(0, 60) + '...' : 'No content',
            status: d.content ? 'active' : 'inactive',
            type: 'rules',
            data: d,
            images: getAllContentImages(d)
        }] : [];
        title = 'Platform Rules';
    }

    state.totalItems = items.length;

    if (state.totalItems === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 60px 20px; color: #6a7a92; font-size: 14px;">
                <i class="fas fa-file-alt" style="display: block; font-size: 40px; color: #4a5a72; margin-bottom: 16px;"></i>
                No ${title} found
                <div style="font-size: 12px; color: #4a5a72; margin-top: 4px;">Click "Add Content" to create one</div>
            </div>
        `;
        paginationContainer.innerHTML = '';
        return;
    }

    const totalPages = Math.ceil(state.totalItems / state.pageSize);
    if (state.currentPage > totalPages) state.currentPage = totalPages;
    if (state.currentPage < 1) state.currentPage = 1;

    const startIndex = (state.currentPage - 1) * state.pageSize;
    const endIndex = Math.min(startIndex + state.pageSize, state.totalItems);
    const pageItems = items.slice(startIndex, endIndex);

    renderPageItems(container, pageItems);
    renderPagination(paginationContainer, state.currentPage, totalPages);

    setTimeout(() => applyFontSize(), 50);
    setupImageLazyLoad();
}

// ============================================================
// 渲染单页内容
// ============================================================
function renderPageItems(container, items) {
    const isArrangeMode = document.getElementById('arrangeContentBtn')?.classList.contains('active') || false;

    let html = '';
    items.forEach((item, index) => {
        const statusClass = item.status === 'active' ? 'status-active' : 'status-inactive';
        const statusText = item.status === 'active' ? 'Active' : 'Inactive';
        
        let thumbHtml = '';
        if (item.images && item.images.length > 0) {
            thumbHtml = '<div class="thumb-container">';
            const maxShow = 4;
            const showImages = item.images.slice(0, maxShow);
            showImages.forEach(imgUrl => {
                thumbHtml += `<img data-src="${imgUrl}" class="item-thumb lazy-image" onerror="this.style.display='none'" alt="">`;
            });
            if (item.images.length > maxShow) {
                thumbHtml += `<div class="item-thumb-more">+${item.images.length - maxShow}</div>`;
            }
            thumbHtml += '</div>';
        } else {
            thumbHtml = `<div class="item-thumb-placeholder"><i class="fas fa-image"></i></div>`;
        }

        html += `
            <div class="content-item" data-id="${item.id}" data-type="${item.type}" data-tab="${state.currentTab}" data-index="${(state.currentPage - 1) * state.pageSize + index}" draggable="${isArrangeMode}">
                ${isArrangeMode ? `<span class="drag-handle"><i class="fas fa-grip-vertical"></i></span>` : ''}
                ${thumbHtml}
                <div class="item-info">
                    <span class="item-title">${escapeHtml(item.title)}</span>
                    <span class="item-sub">${escapeHtml(item.subtitle)}</span>
                </div>
                <span class="item-status ${statusClass}">${statusText}</span>
                <div class="item-actions">
                    <button class="btn-edit" onclick="openEditContentModal('${item.type}', '${item.id}')">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="btn-delete" onclick="deleteContentItem('${item.type}', '${item.id}')">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            </div>
        `;
    });

    container.innerHTML = html;

    if (isArrangeMode) {
        document.getElementById('arrangeHint').style.display = 'inline';
    } else {
        document.getElementById('arrangeHint').style.display = 'none';
    }
}

// ============================================================
// 图片懒加载
// ============================================================
function setupImageLazyLoad() {
    if (imageObserver) {
        imageObserver.disconnect();
    }

    if ('IntersectionObserver' in window) {
        imageObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    const src = img.dataset.src;
                    if (src) {
                        img.src = src;
                        img.removeAttribute('data-src');
                    }
                    imageObserver.unobserve(img);
                }
            });
        }, { rootMargin: '50px 0px' });

        document.querySelectorAll('.lazy-image').forEach(img => {
            imageObserver.observe(img);
        });
    } else {
        document.querySelectorAll('.lazy-image').forEach(img => {
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
function renderPagination(container, currentPage, totalPages) {
    if (!container) return;
    container.innerHTML = '';

    if (totalPages <= 1) return;

    const prevBtn = document.createElement('button');
    prevBtn.className = 'page-btn';
    prevBtn.innerHTML = '<i class="fas fa-chevron-left"></i>';
    prevBtn.disabled = currentPage <= 1;
    prevBtn.onclick = () => { if (currentPage > 1) { state.currentPage--; renderContentList(); } };
    container.appendChild(prevBtn);

    const maxVisible = 7;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let endPage = Math.min(totalPages, startPage + maxVisible - 1);
    if (endPage - startPage < maxVisible - 1) {
        startPage = Math.max(1, endPage - maxVisible + 1);
    }

    if (startPage > 1) {
        const btn = document.createElement('button');
        btn.className = 'page-btn';
        btn.textContent = '1';
        btn.onclick = () => { state.currentPage = 1; renderContentList(); };
        container.appendChild(btn);
        if (startPage > 2) {
            const ellipsis = document.createElement('span');
            ellipsis.textContent = '…';
            ellipsis.style.cssText = 'color:#4a5a72; padding:0 4px;';
            container.appendChild(ellipsis);
        }
    }

    for (let i = startPage; i <= endPage; i++) {
        const btn = document.createElement('button');
        btn.className = 'page-btn' + (i === currentPage ? ' active' : '');
        btn.textContent = i;
        btn.onclick = () => { state.currentPage = i; renderContentList(); };
        container.appendChild(btn);
    }

    if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
            const ellipsis = document.createElement('span');
            ellipsis.textContent = '…';
            ellipsis.style.cssText = 'color:#4a5a72; padding:0 4px;';
            container.appendChild(ellipsis);
        }
        const btn = document.createElement('button');
        btn.className = 'page-btn';
        btn.textContent = totalPages;
        btn.onclick = () => { state.currentPage = totalPages; renderContentList(); };
        container.appendChild(btn);
    }

    const nextBtn = document.createElement('button');
    nextBtn.className = 'page-btn';
    nextBtn.innerHTML = '<i class="fas fa-chevron-right"></i>';
    nextBtn.disabled = currentPage >= totalPages;
    nextBtn.onclick = () => { if (currentPage < totalPages) { state.currentPage++; renderContentList(); } };
    container.appendChild(nextBtn);
}

// ============================================================
// 拖拽排序（禁用）
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
        showToast('Drag & drop disabled - coming soon', 'info');
        renderContentList();
    }
}

// ============================================================
// 删除内容
// ============================================================
window.deleteContentItem = function(type, id) {
    const typeNames = {
        'event': 'Event',
        'certificate': 'Certificate',
        'contract': 'Contract',
        'tc': 'Terms & Conditions',
        'privacy': 'Privacy Policy',
        'rules': 'Platform Rules'
    };
    const typeName = typeNames[type] || 'Content';

    if (typeof window.showConfirm === 'function') {
        window.showConfirm('Delete ' + typeName, 'Are you sure you want to delete this ' + typeName + '?', async function() {
            try {
                await sb.from('system_content').delete().eq('id', parseInt(id));
                await loadAllContentData();
                state.currentPage = 1;
                renderContentList();
                showToast(typeName + ' deleted successfully', 'success');
            } catch (e) {
                showToast('Delete failed: ' + e.message, 'error');
            }
        });
    } else {
        if (confirm('Delete this ' + typeName + '?')) {
            (async function() {
                try {
                    await sb.from('system_content').delete().eq('id', parseInt(id));
                    await loadAllContentData();
                    state.currentPage = 1;
                    renderContentList();
                    showToast(typeName + ' deleted successfully', 'success');
                } catch (e) {
                    showToast('Delete failed: ' + e.message, 'error');
                }
            })();
        }
    }
};

// ============================================================
// 打开添加内容弹窗
// ============================================================
function openAddContentModal() {
    editorContent = '';
    editorImages = [];

    const tabNames = {
        'events': 'Event',
        'certificate': 'Certificate',
        'contract': 'Contract',
        'tc': 'Terms & Conditions',
        'privacy': 'Privacy Policy',
        'rules': 'Platform Rules'
    };
    const tabName = tabNames[state.currentTab] || 'Content';

    const modalHtml = `
        <div id="addContentModal" class="modal-overlay" style="visibility: visible; opacity: 1; display: flex; align-items: center; justify-content: center; z-index: 20000;">
            <div class="modal-card" style="width: 820px; max-width: 94%; max-height: 90vh; overflow-y: auto; background: linear-gradient(160deg, #1a1428, #0e0a1a); border: 1px solid rgba(200,176,144,0.1); border-radius: 24px; padding: 28px 30px; box-shadow: 0 30px 80px rgba(0,0,0,0.6);">
                
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                    <h3 style="font-size: 18px; font-weight: 600; color: #d8e0f0; margin: 0;">
                        <i class="fas fa-plus" style="color: #c8b090; margin-right: 10px;"></i>
                        Add ${tabName}
                    </h3>
                    <button onclick="closeContentModal()" style="background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.06); border-radius: 50%; width: 32px; height: 32px; color: #6a7a92; cursor: pointer; font-size: 16px; display: flex; align-items: center; justify-content: center;">
                        <i class="fas fa-times"></i>
                    </button>
                </div>

                <div style="margin-bottom: 16px;">
                    <label style="display: block; font-size: 11px; color: #6a7a92; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">Title</label>
                    <input type="text" id="eventTitleInput" placeholder="Enter title..." style="width: 100%; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.06); border-radius: 10px; padding: 10px 16px; color: #d8e0f0; font-size: 14px; outline: none; font-family: 'Inter', sans-serif;">
                </div>

                <div style="margin-bottom: 4px;">
                    <label style="display: block; font-size: 11px; color: #6a7a92; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">Content</label>
                    
                    <!-- ===== 编辑器工具栏（含字体大小 + 字体样式） ===== -->
                    <div class="editor-toolbar">
                        <button onclick="execCommand('bold')" title="Bold"><b>B</b></button>
                        <button onclick="execCommand('italic')" title="Italic"><i>I</i></button>
                        <button onclick="execCommand('underline')" title="Underline"><u>U</u></button>
                        <span class="divider">|</span>
                        
                        <!-- 字体大小下拉 -->
                        <select id="editorFontSize" onchange="changeEditorFontSize(this.value)" title="字体大小">
                            <option value="3">字号</option>
                            <option value="1">极小</option>
                            <option value="2">小</option>
                            <option value="3" selected>默认</option>
                            <option value="4">大</option>
                            <option value="5">极大</option>
                            <option value="6">超大</option>
                            <option value="7">巨大</option>
                        </select>
                        
                        <!-- 字体样式下拉 -->
                        <select id="editorFontFamily" onchange="changeEditorFontFamily(this.value)" title="字体样式">
                            <option value="">字体</option>
                            <option value="Arial, sans-serif">Arial</option>
                            <option value="'Times New Roman', serif">Times New Roman</option>
                            <option value="Georgia, serif">Georgia</option>
                            <option value="'Courier New', monospace">Courier New</option>
                            <option value="Verdana, sans-serif">Verdana</option>
                            <option value="'Trebuchet MS', sans-serif">Trebuchet MS</option>
                            <option value="Impact, sans-serif">Impact</option>
                            <option value="'Comic Sans MS', cursive">Comic Sans</option>
                        </select>
                        
                        <span class="divider">|</span>
                        <button onclick="execCommand('insertUnorderedList')" title="Bullet List"><i class="fas fa-list-ul"></i></button>
                        <button onclick="execCommand('insertOrderedList')" title="Numbered List"><i class="fas fa-list-ol"></i></button>
                        <span class="divider">|</span>
                        <button onclick="execCommand('foreColor', '#c8b090')" title="Gold Color"><i class="fas fa-palette" style="color: #c8b090;"></i></button>
                        <button onclick="execCommand('foreColor', '#ffffff')" title="White Color"><i class="fas fa-palette" style="color: #ffffff;"></i></button>
                        <span class="divider">|</span>
                        <button onclick="uploadEditorImage()" title="Insert Image"><i class="fas fa-image"></i></button>
                        <button onclick="insertLink()" title="Insert Link"><i class="fas fa-link"></i></button>
                        <button onclick="execCommand('removeFormat')" title="清除格式"><i class="fas fa-eraser"></i></button>
                    </div>
                    
                    <div class="editor-content" id="eventEditor" contenteditable="true" placeholder="Write your content here..."></div>
                </div>

                <div id="editorImagePreview" style="display: flex; gap: 8px; flex-wrap: wrap; margin: 8px 0 12px 0; padding: 8px; background: rgba(0,0,0,0.15); border-radius: 8px; min-height: 30px;">
                    <span style="font-size: 11px; color: #6a7a92;">Uploaded images will appear here</span>
                </div>

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

                <div id="contentStatus" style="margin-top: 12px; font-size: 12px; color: #6a7a92; text-align: center;"></div>
            </div>
        </div>
    `;

    const existing = document.getElementById('addContentModal');
    if (existing) existing.remove();

    document.body.insertAdjacentHTML('beforeend', modalHtml);

    setTimeout(() => {
        const editor = document.getElementById('eventEditor');
        if (editor) editor.focus();
    }, 300);
}

// ============================================================
// 编辑器字体大小（选中文字后调整）
// ============================================================
window.changeEditorFontSize = function(size) {
    if (!size || size === '3') {
        document.execCommand('removeFormat', false, null);
        return;
    }
    document.execCommand('fontSize', false, size);
};

// ============================================================
// 编辑器字体样式（选中文字后调整）
// ============================================================
window.changeEditorFontFamily = function(font) {
    if (!font) {
        document.execCommand('removeFormat', false, null);
        return;
    }
    document.execCommand('fontName', false, font);
};

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
                    document.execCommand('insertImage', false, url);
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
    const title = document.getElementById('eventTitleInput')?.value || 'Untitled';

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
// 关闭预览
// ============================================================
window.closePreview = function() {
    const modal = document.querySelector('.preview-modal');
    if (modal) modal.remove();
};

// ============================================================
// 发布内容
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
        const imageUrlsJson = JSON.stringify(editorImages);

        const typeMap = {
            'events': 'events',
            'certificate': 'company',
            'contract': 'contract',
            'tc': 'tc',
            'privacy': 'privacy',
            'rules': 'rules'
        };
        const type = typeMap[state.currentTab] || state.currentTab;

        if (state.currentTab !== 'events') {
            const existing = state.contentData[state.currentTab];
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

                await loadAllContentData();
                state.currentPage = 1;
                renderContentList();
                closeContentModal();
                showToast('✅ Content updated successfully!', 'success');
                return;
            }
        }

        const newContent = {
            type: type,
            title: title,
            content: content,
            image_url: imageUrlsJson,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        const { error } = await sb
            .from('system_content')
            .insert([newContent]);

        if (error) throw error;

        await loadAllContentData();
        state.currentPage = 1;
        renderContentList();
        closeContentModal();
        showToast('✅ Content posted successfully!', 'success');

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
        item = state.eventsList.find(e => e.id == id);
        title = item?.title || 'Edit Event';
    } else {
        const data = state.contentData[type];
        if (data) {
            item = data;
            title = item?.title || 'Edit Content';
        }
    }

    if (!item) {
        showToast('Item not found', 'error');
        return;
    }

    let images = getAllContentImages(item);
    editorImages = images;

    const modalHtml = `
        <div id="editContentModal" class="modal-overlay" style="visibility: visible; opacity: 1; display: flex; align-items: center; justify-content: center; z-index: 20000;">
            <div class="modal-card" style="width: 820px; max-width: 94%; max-height: 90vh; overflow-y: auto; background: linear-gradient(160deg, #1a1428, #0e0a1a); border: 1px solid rgba(200,176,144,0.1); border-radius: 24px; padding: 28px 30px; box-shadow: 0 30px 80px rgba(0,0,0,0.6);">
                
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                    <h3 style="font-size: 18px; font-weight: 600; color: #d8e0f0; margin: 0;">
                        <i class="fas fa-edit" style="color: #c8b090; margin-right: 10px;"></i>
                        ${escapeHtml(title)}
                    </h3>
                    <button onclick="closeEditModal()" style="background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.06); border-radius: 50%; width: 32px; height: 32px; color: #6a7a92; cursor: pointer; font-size: 16px; display: flex; align-items: center; justify-content: center;">
                        <i class="fas fa-times"></i>
                    </button>
                </div>

                <div style="margin-bottom: 16px;">
                    <label style="display: block; font-size: 11px; color: #6a7a92; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">Title</label>
                    <input type="text" id="editTitleInput" value="${escapeHtml(item.title || '')}" style="width: 100%; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.06); border-radius: 10px; padding: 10px 16px; color: #d8e0f0; font-size: 14px; outline: none; font-family: 'Inter', sans-serif;">
                </div>

                <div style="margin-bottom: 4px;">
                    <label style="display: block; font-size: 11px; color: #6a7a92; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">Content</label>
                    
                    <!-- ===== 编辑器工具栏（含字体大小 + 字体样式） ===== -->
                    <div class="editor-toolbar">
                        <button onclick="execCommand('bold')"><b>B</b></button>
                        <button onclick="execCommand('italic')"><i>I</i></button>
                        <button onclick="execCommand('underline')"><u>U</u></button>
                        <span class="divider">|</span>
                        
                        <select id="editEditorFontSize" onchange="changeEditEditorFontSize(this.value)" title="字体大小">
                            <option value="3">字号</option>
                            <option value="1">极小</option>
                            <option value="2">小</option>
                            <option value="3" selected>默认</option>
                            <option value="4">大</option>
                            <option value="5">极大</option>
                            <option value="6">超大</option>
                            <option value="7">巨大</option>
                        </select>
                        
                        <select id="editEditorFontFamily" onchange="changeEditEditorFontFamily(this.value)" title="字体样式">
                            <option value="">字体</option>
                            <option value="Arial, sans-serif">Arial</option>
                            <option value="'Times New Roman', serif">Times New Roman</option>
                            <option value="Georgia, serif">Georgia</option>
                            <option value="'Courier New', monospace">Courier New</option>
                            <option value="Verdana, sans-serif">Verdana</option>
                            <option value="'Trebuchet MS', sans-serif">Trebuchet MS</option>
                            <option value="Impact, sans-serif">Impact</option>
                            <option value="'Comic Sans MS', cursive">Comic Sans</option>
                        </select>
                        
                        <span class="divider">|</span>
                        <button onclick="execCommand('insertUnorderedList')"><i class="fas fa-list-ul"></i></button>
                        <button onclick="execCommand('insertOrderedList')"><i class="fas fa-list-ol"></i></button>
                        <span class="divider">|</span>
                        <button onclick="execCommand('foreColor', '#c8b090')"><i class="fas fa-palette" style="color: #c8b090;"></i></button>
                        <button onclick="execCommand('foreColor', '#ffffff')"><i class="fas fa-palette" style="color: #ffffff;"></i></button>
                        <span class="divider">|</span>
                        <button onclick="uploadEditorImage()"><i class="fas fa-image"></i></button>
                        <button onclick="insertLink()"><i class="fas fa-link"></i></button>
                        <button onclick="execCommand('removeFormat')"><i class="fas fa-eraser"></i></button>
                    </div>
                    
                    <div class="editor-content" id="editEditor" contenteditable="true">${item.content || ''}</div>
                </div>

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
// 编辑弹窗 - 字体大小
// ============================================================
window.changeEditEditorFontSize = function(size) {
    if (!size || size === '3') {
        document.execCommand('removeFormat', false, null);
        return;
    }
    document.execCommand('fontSize', false, size);
};

// ============================================================
// 编辑弹窗 - 字体样式
// ============================================================
window.changeEditEditorFontFamily = function(font) {
    if (!font) {
        document.execCommand('removeFormat', false, null);
        return;
    }
    document.execCommand('fontName', false, font);
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

        const { error } = await sb
            .from('system_content')
            .update({
                title: title,
                content: content,
                image_url: imageUrlsJson,
                updated_at: new Date().toISOString()
            })
            .eq('id', parseInt(id));

        if (error) throw error;

        await loadAllContentData();
        state.currentPage = 1;
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

// ============================================================
// 暴露全局
// ============================================================
window.loadContentPage = loadContentPage;
window.renderContentList = renderContentList;
window.loadAllContentData = loadAllContentData;

console.log('✅ admin-content.js loaded (性能优化 + 编辑器字体大小/样式)');
console.log('   - 图片懒加载 (IntersectionObserver)');
console.log('   - 分页功能 (每页10条)');
console.log('   - 编辑器字体大小下拉 (选中文字调整)');
console.log('   - 编辑器字体样式下拉 (Arial, Times, Georgia, etc.)');
console.log('   - 所有内容类型都有删除按钮');