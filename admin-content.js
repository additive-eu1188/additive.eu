// admin-content.js - 内容管理页面（6个模块：Event, Certificate, Employment Contract, T&C, Privacy, Rules）
let systemContents = [];
let eventsList = [];
let certificateData = null;
let contractData = null;
let legalPages = [];
let currentContentTab = 'events';
let uploadingImage = false;
let currentImageUrl = '';

// 存储当前编辑的图片列表
let contractImages = [];
let certificateImages = [];

async function loadContentPage() {
    const container = document.getElementById('page_content');
    if (!container) return;
    
    container.innerHTML = `
        <div class="card">
            <div class="search-bar" style="justify-content: space-between;">
                <h3><i class="fas fa-file-contract"></i> 内容管理</h3>
                <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                    <button id="tabEventsBtn" class="tab-content-btn active" data-tab="events"><i class="fas fa-calendar-alt"></i> Event</button>
                    <button id="tabCertificateBtn" class="tab-content-btn" data-tab="certificate"><i class="fas fa-building"></i> Certificate &amp; Company Profile</button>
                    <button id="tabContractBtn" class="tab-content-btn" data-tab="contract"><i class="fas fa-file-contract"></i> Employment Contract</button>
                    <button id="tabTcBtn" class="tab-content-btn" data-tab="tc"><i class="fas fa-gavel"></i> Terms &amp; Conditions</button>
                    <button id="tabPrivacyBtn" class="tab-content-btn" data-tab="privacy"><i class="fas fa-shield-alt"></i> Privacy &amp; Security</button>
                    <button id="tabRulesBtn" class="tab-content-btn" data-tab="rules"><i class="fas fa-list-ul"></i> Platform Rules</button>
                </div>
            </div>
            <div id="eventsPanel" class="content-panel"></div>
            <div id="certificatePanel" class="content-panel" style="display: none;"></div>
            <div id="contractPanel" class="content-panel" style="display: none;"></div>
            <div id="tcPanel" class="content-panel" style="display: none;"></div>
            <div id="privacyPanel" class="content-panel" style="display: none;"></div>
            <div id="rulesPanel" class="content-panel" style="display: none;"></div>
        </div>
    `;
    
    // 添加样式
    const style = document.createElement('style');
    style.textContent = `
        .tab-content-btn {
            background: rgba(74,124,255,0.1);
            border: 1px solid rgba(74,124,255,0.2);
            border-radius: 30px;
            padding: 6px 16px;
            color: #8a9abb;
            cursor: pointer;
            transition: all 0.2s;
            font-size: 13px;
            white-space: nowrap;
        }
        .tab-content-btn:hover {
            background: rgba(74,124,255,0.2);
        }
        .tab-content-btn.active {
            background: #4a7cff;
            color: #fff;
            border-color: #4a7cff;
        }
        .legal-card {
            background: #0f172a;
            border-radius: 16px;
            padding: 20px;
            margin-bottom: 20px;
            border: 1px solid rgba(74,124,255,0.15);
        }
        .legal-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 15px;
            padding-bottom: 10px;
            border-bottom: 1px solid rgba(74,124,255,0.1);
        }
        .legal-title {
            font-size: 18px;
            font-weight: 600;
            color: #4a7cff;
        }
        .legal-content-preview {
            background: rgba(0,0,0,0.3);
            border-radius: 12px;
            padding: 15px;
            max-height: 200px;
            overflow-y: auto;
            font-size: 13px;
            color: #c0c8e0;
            margin-bottom: 15px;
            white-space: pre-wrap;
        }
        .content-item {
            background: #0f172a;
            border-radius: 16px;
            padding: 15px;
            margin-bottom: 12px;
        }
        .event-item {
            background: #0f172a;
            border-radius: 16px;
            padding: 15px;
            margin-bottom: 12px;
            display: flex;
            gap: 15px;
            flex-wrap: wrap;
            align-items: center;
        }
        .event-image-preview {
            width: 80px;
            height: 60px;
            object-fit: cover;
            border-radius: 8px;
            cursor: pointer;
            border: 1px solid rgba(74,124,255,0.3);
        }
        .upload-area {
            background: rgba(74,124,255,0.1);
            border: 2px dashed rgba(74,124,255,0.3);
            border-radius: 12px;
            padding: 20px;
            text-align: center;
            cursor: pointer;
            transition: 0.2s;
            margin: 10px 0;
        }
        .upload-area:hover {
            background: rgba(74,124,255,0.15);
            border-color: #4a7cff;
        }
        .image-preview {
            max-width: 200px;
            max-height: 150px;
            border-radius: 8px;
            margin-top: 10px;
        }
        .content-editor-area {
            background: rgba(15, 25, 40, 0.5);
            border-radius: 16px;
            padding: 24px;
            margin-top: 16px;
        }
        .content-editor-area label {
            display: block;
            font-size: 12px;
            color: #8a9abb;
            margin-bottom: 6px;
        }
        .content-editor-area textarea {
            width: 100%;
            background: #0f172a;
            border: 1px solid #1e2a3a;
            border-radius: 8px;
            padding: 12px;
            color: #fff;
            font-family: monospace;
            font-size: 13px;
            resize: vertical;
        }
        .content-editor-area textarea:focus {
            border-color: #4a7cff;
            outline: none;
        }
        .content-editor-area input[type="text"] {
            width: 100%;
            background: #0f172a;
            border: 1px solid #1e2a3a;
            border-radius: 8px;
            padding: 10px;
            color: #fff;
            font-size: 14px;
        }
        .content-editor-area input[type="text"]:focus {
            border-color: #4a7cff;
            outline: none;
        }
        .upload-btn-area {
            background: rgba(74,124,255,0.1);
            border: 2px dashed rgba(74,124,255,0.3);
            border-radius: 8px;
            padding: 8px 16px;
            text-align: center;
            cursor: pointer;
            transition: 0.2s;
            display: flex;
            align-items: center;
            gap: 8px;
            width: fit-content;
        }
        .upload-btn-area:hover {
            background: rgba(74,124,255,0.15);
            border-color: #4a7cff;
        }
        .preview-box {
            background: rgba(0,0,0,0.3);
            border-radius: 12px;
            padding: 16px;
            max-height: 400px;
            overflow-y: auto;
            color: #c0c8e0;
            font-size: 13px;
            line-height: 1.6;
        }
        .preview-box h2 {
            color: #4a7cff;
            margin-top: 16px;
            margin-bottom: 12px;
        }
        .preview-box h3 {
            color: #eef5ff;
            margin-top: 12px;
            margin-bottom: 8px;
        }
        .preview-box p {
            margin-bottom: 12px;
        }
        .preview-box ul, .preview-box ol {
            margin-left: 24px;
            margin-bottom: 12px;
        }
        .preview-box li {
            margin-bottom: 6px;
        }
        .image-upload-row {
            display: flex;
            gap: 10px;
            flex-wrap: wrap;
            align-items: center;
        }
        .image-upload-row input[type="text"] {
            flex: 1;
            min-width: 200px;
        }
        .image-preview-thumb {
            max-width: 200px;
            max-height: 120px;
            border-radius: 8px;
            border: 1px solid rgba(74,124,255,0.2);
            margin-top: 8px;
        }
        .image-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
            gap: 12px;
            margin-top: 12px;
        }
        .image-grid-item {
            position: relative;
            border-radius: 8px;
            overflow: hidden;
            border: 1px solid rgba(74,124,255,0.15);
            background: rgba(0,0,0,0.2);
        }
        .image-grid-item img {
            width: 100%;
            height: 120px;
            object-fit: cover;
            display: block;
        }
        .image-grid-item .delete-image-btn {
            position: absolute;
            top: 4px;
            right: 4px;
            background: rgba(122, 47, 47, 0.9);
            border: none;
            border-radius: 50%;
            width: 28px;
            height: 28px;
            color: #fff;
            cursor: pointer;
            font-size: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: 0.2s;
        }
        .image-grid-item .delete-image-btn:hover {
            background: #9b3f3f;
            transform: scale(1.1);
        }
        .image-grid-item .image-index {
            position: absolute;
            bottom: 4px;
            left: 4px;
            background: rgba(0,0,0,0.6);
            padding: 2px 8px;
            border-radius: 10px;
            font-size: 10px;
            color: #8a9abb;
        }
        .no-images-placeholder {
            text-align: center;
            padding: 30px;
            color: #6a7a9a;
            font-size: 13px;
            border: 1px dashed rgba(74,124,255,0.15);
            border-radius: 8px;
        }
        .no-images-placeholder i {
            font-size: 32px;
            display: block;
            margin-bottom: 8px;
            opacity: 0.5;
        }
        @media (max-width: 768px) {
            .tab-content-btn {
                font-size: 11px;
                padding: 4px 12px;
            }
            .event-item {
                flex-direction: column;
                align-items: stretch;
            }
            .image-upload-row {
                flex-direction: column;
            }
            .image-grid {
                grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
            }
        }
    `;
    document.head.appendChild(style);
    
    // 加载所有数据
    await loadEventsList();
    await loadCertificateContent();
    await loadContractContent();
    await loadLegalPages('tc');
    await loadLegalPages('privacy');
    await loadLegalPages('rules');
    
    // 绑定标签切换
    document.getElementById('tabEventsBtn')?.addEventListener('click', () => switchContentTab('events'));
    document.getElementById('tabCertificateBtn')?.addEventListener('click', () => switchContentTab('certificate'));
    document.getElementById('tabContractBtn')?.addEventListener('click', () => switchContentTab('contract'));
    document.getElementById('tabTcBtn')?.addEventListener('click', () => switchContentTab('tc'));
    document.getElementById('tabPrivacyBtn')?.addEventListener('click', () => switchContentTab('privacy'));
    document.getElementById('tabRulesBtn')?.addEventListener('click', () => switchContentTab('rules'));
}

function switchContentTab(tab) {
    currentContentTab = tab;
    document.querySelectorAll('.tab-content-btn').forEach(b => b.classList.remove('active'));
    const tabMap = {
        'events': 'tabEventsBtn',
        'certificate': 'tabCertificateBtn',
        'contract': 'tabContractBtn',
        'tc': 'tabTcBtn',
        'privacy': 'tabPrivacyBtn',
        'rules': 'tabRulesBtn'
    };
    document.getElementById(tabMap[tab])?.classList.add('active');
    
    document.getElementById('eventsPanel').style.display = tab === 'events' ? 'block' : 'none';
    document.getElementById('certificatePanel').style.display = tab === 'certificate' ? 'block' : 'none';
    document.getElementById('contractPanel').style.display = tab === 'contract' ? 'block' : 'none';
    document.getElementById('tcPanel').style.display = tab === 'tc' ? 'block' : 'none';
    document.getElementById('privacyPanel').style.display = tab === 'privacy' ? 'block' : 'none';
    document.getElementById('rulesPanel').style.display = tab === 'rules' ? 'block' : 'none';
    
    if (tab === 'events') {
        renderEventsList();
    } else if (tab === 'certificate') {
        renderCertificateContent();
    } else if (tab === 'contract') {
        renderContractContent();
    } else if (tab === 'tc' || tab === 'privacy' || tab === 'rules') {
        renderLegalPage(tab);
    }
}

// ============================================================
// 1. 活动管理 (Event)
// ============================================================
async function loadEventsList() {
    const { data: events } = await sb.from('events').select('*').order('sort_order', { ascending: true });
    eventsList = events || [];
    renderEventsList();
}

function renderEventsList() {
    const container = document.getElementById('eventsPanel');
    if (!container) return;
    
    container.innerHTML = `
        <div class="search-bar" style="justify-content: flex-end;">
            <button id="addEventBtn" class="success"><i class="fas fa-plus"></i> 添加活动</button>
            <button id="refreshEventsBtn" class="btn-primary"><i class="fas fa-sync-alt"></i> 刷新</button>
        </div>
        <div id="eventsListContainer"></div>
    `;
    
    const listContainer = document.getElementById('eventsListContainer');
    
    if (eventsList.length === 0) {
        listContainer.innerHTML = '<div style="text-align:center; padding:40px; color:#aaa;">暂无活动，点击"添加活动"开始</div>';
        return;
    }
    
    listContainer.innerHTML = '';
    eventsList.forEach(event => {
        const div = document.createElement('div');
        div.className = 'event-item';
        div.setAttribute('data-id', event.id);
        div.innerHTML = `
            <div>
                <img src="${event.image_url || 'https://placehold.co/80x60/0f172a/4a7cff?text=No+Img'}" class="event-image-preview" onclick="window.open('${event.image_url || '#'}','_blank')" onerror="this.src='https://placehold.co/80x60/0f172a/4a7cff?text=No+Img'">
            </div>
            <div style="flex:2;">
                <input type="text" class="event-title-edit" data-id="${event.id}" value="${escapeHtml(event.title || '')}" placeholder="标题" style="width:100%; background:#0f172a; border:1px solid #1e2a3a; border-radius:8px; padding:8px; color:#fff;">
            </div>
            <div>
                <input type="date" class="event-date-edit" data-id="${event.id}" value="${event.event_date || ''}" style="background:#0f172a; border:1px solid #1e2a3a; border-radius:8px; padding:8px; color:#fff;">
            </div>
            <div>
                <select class="event-status-edit" data-id="${event.id}" style="background:#0f172a; border:1px solid #1e2a3a; border-radius:8px; padding:8px; color:#fff;">
                    <option value="active" ${event.status === 'active' ? 'selected' : ''}>显示</option>
                    <option value="inactive" ${event.status === 'inactive' ? 'selected' : ''}>隐藏</option>
                </select>
            </div>
            <div>
                <input type="number" class="event-sort-edit" data-id="${event.id}" value="${event.sort_order || 0}" placeholder="排序" style="width:70px; background:#0f172a; border:1px solid #1e2a3a; border-radius:8px; padding:8px; color:#fff;">
            </div>
            <div>
                <button class="edit-event-detail" data-id="${event.id}" style="background:#2f6b3a; padding:6px 12px; border-radius:8px; border:none; color:#fff; cursor:pointer;"><i class="fas fa-edit"></i> 编辑</button>
                <button class="delete-event-btn" data-id="${event.id}" style="background:#7a2f2f; padding:6px 12px; border-radius:8px; border:none; color:#fff; cursor:pointer;"><i class="fas fa-trash"></i> 删除</button>
            </div>
        `;
        listContainer.appendChild(div);
    });
    
    document.querySelectorAll('.event-title-edit').forEach(input => input.addEventListener('change', () => updateEventField(input.dataset.id, 'title', input.value)));
    document.querySelectorAll('.event-date-edit').forEach(input => input.addEventListener('change', () => updateEventField(input.dataset.id, 'event_date', input.value)));
    document.querySelectorAll('.event-status-edit').forEach(select => select.addEventListener('change', () => updateEventField(select.dataset.id, 'status', select.value)));
    document.querySelectorAll('.event-sort-edit').forEach(input => input.addEventListener('change', () => updateEventField(input.dataset.id, 'sort_order', parseInt(input.value) || 0)));
    document.querySelectorAll('.edit-event-detail').forEach(btn => btn.addEventListener('click', () => openEditEventModal(btn.dataset.id)));
    document.querySelectorAll('.delete-event-btn').forEach(btn => btn.addEventListener('click', () => deleteEvent(btn.dataset.id)));
    
    document.getElementById('addEventBtn')?.addEventListener('click', openAddEventModal);
    document.getElementById('refreshEventsBtn')?.addEventListener('click', loadEventsList);
}

async function updateEventField(id, field, value) {
    await sb.from('events').update({ [field]: value, updated_at: new Date().toISOString() }).eq('id', parseInt(id));
    showToast('已更新', 'success');
    loadEventsList();
}

async function deleteEvent(id) {
    showConfirm('确认删除', '确定删除此活动吗？', async () => {
        await sb.from('events').delete().eq('id', parseInt(id));
        showToast('已删除', 'success');
        loadEventsList();
    });
}

function openAddEventModal() {
    let currentImageUrl = '';
    
    const modalHtml = `
        <div id="addEventModal" class="modal-overlay" style="visibility: visible; opacity: 1;">
            <div class="modal-card" style="width: 650px; max-width: 90%; max-height: 85vh; overflow-y: auto;">
                <h3><i class="fas fa-plus"></i> 添加活动</h3>
                <div><label style="font-size:12px;color:#8a9abb;">标题 *</label><input type="text" id="eventTitle" placeholder="活动标题" style="width:100%; margin:10px 0; padding:12px; background:#0f172a; border:1px solid #1e2a3a; border-radius:8px; color:#fff;"></div>
                <div><label style="font-size:12px;color:#8a9abb;">活动图片</label><div id="eventImageUploader"></div></div>
                <div><label style="font-size:12px;color:#8a9abb;">简短描述</label><input type="text" id="eventShortDesc" placeholder="简短描述" style="width:100%; margin:10px 0; padding:12px; background:#0f172a; border:1px solid #1e2a3a; border-radius:8px; color:#fff;"></div>
                <div><label style="font-size:12px;color:#8a9abb;">详细描述</label><textarea id="eventDesc" rows="3" placeholder="详细描述" style="width:100%; margin:10px 0; padding:12px; background:#0f172a; border:1px solid #1e2a3a; border-radius:8px; color:#fff;"></textarea></div>
                <div><label style="font-size:12px;color:#8a9abb;">内容详情</label><textarea id="eventContent" rows="5" placeholder="完整内容" style="width:100%; margin:10px 0; padding:12px; background:#0f172a; border:1px solid #1e2a3a; border-radius:8px; color:#fff;"></textarea></div>
                <div style="display: flex; gap: 12px;">
                    <div style="flex:1"><label style="font-size:12px;color:#8a9abb;">开始日期</label><input type="date" id="eventDate" style="width:100%; margin:10px 0; padding:12px; background:#0f172a; border:1px solid #1e2a3a; border-radius:8px; color:#fff;"></div>
                    <div style="flex:1"><label style="font-size:12px;color:#8a9abb;">结束日期</label><input type="date" id="eventEndDate" style="width:100%; margin:10px 0; padding:12px; background:#0f172a; border:1px solid #1e2a3a; border-radius:8px; color:#fff;"></div>
                </div>
                <div><label style="font-size:12px;color:#8a9abb;">标签徽章</label><input type="text" id="eventBadge" placeholder="如: 🔥 Limited Time" value="Promotion" style="width:100%; margin:10px 0; padding:12px; background:#0f172a; border:1px solid #1e2a3a; border-radius:8px; color:#fff;"></div>
                <div><label style="font-size:12px;color:#8a9abb;">状态</label><select id="eventStatus" style="width:100%; margin:10px 0; padding:12px; background:#0f172a; border:1px solid #1e2a3a; border-radius:8px; color:#fff;"><option value="active">显示</option><option value="inactive">隐藏</option></select></div>
                <div><label style="font-size:12px;color:#8a9abb;">排序</label><input type="number" id="eventSortOrder" value="0" style="width:100%; margin:10px 0; padding:12px; background:#0f172a; border:1px solid #1e2a3a; border-radius:8px; color:#fff;"></div>
                <div style="display: flex; gap: 12px; margin-top: 20px;">
                    <button id="saveEventBtn" class="success" style="background:#2f6b3a;border:none;padding:12px 24px;border-radius:8px;color:#fff;cursor:pointer;font-weight:600;">保存</button>
                    <button id="closeEventModalBtn" style="background:#7a2f2f;border:none;padding:12px 24px;border-radius:8px;color:#fff;cursor:pointer;">取消</button>
                </div>
            </div>
        </div>
    `;
    
    const existing = document.getElementById('addEventModal');
    if (existing) existing.remove();
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    
    createImageUploader('eventImageUploader', '', (imageUrl) => {
        currentImageUrl = imageUrl;
    });
    
    document.getElementById('saveEventBtn').onclick = async () => {
        const title = document.getElementById('eventTitle').value.trim();
        if (!title) {
            showToast('请填写活动标题', 'error');
            return;
        }
        
        const eventData = {
            title: title,
            short_description: document.getElementById('eventShortDesc').value.trim(),
            description: document.getElementById('eventDesc').value.trim(),
            content: document.getElementById('eventContent').value.trim(),
            image_url: currentImageUrl,
            event_date: document.getElementById('eventDate').value || null,
            end_date: document.getElementById('eventEndDate').value || null,
            badge: document.getElementById('eventBadge').value.trim() || 'Promotion',
            status: document.getElementById('eventStatus').value,
            sort_order: parseInt(document.getElementById('eventSortOrder').value) || 0,
            created_at: new Date().toISOString()
        };
        
        const { error } = await sb.from('events').insert([eventData]);
        if (error) {
            showToast('添加失败: ' + error.message, 'error');
            return;
        }
        
        showToast('活动添加成功', 'success');
        document.getElementById('addEventModal').remove();
        loadEventsList();
    };
    
    document.getElementById('closeEventModalBtn').onclick = () => document.getElementById('addEventModal').remove();
}

function openEditEventModal(id) {
    const event = eventsList.find(e => e.id == id);
    if (!event) return;
    
    let currentImageUrl = event.image_url || '';
    
    const modalHtml = `
        <div id="editEventModal" class="modal-overlay" style="visibility: visible; opacity: 1;">
            <div class="modal-card" style="width: 650px; max-width: 90%; max-height: 85vh; overflow-y: auto;">
                <h3><i class="fas fa-edit"></i> 编辑活动</h3>
                <div><label style="font-size:12px;color:#8a9abb;">标题 *</label><input type="text" id="editEventTitle" value="${escapeHtml(event.title)}" style="width:100%; margin:10px 0; padding:12px; background:#0f172a; border:1px solid #1e2a3a; border-radius:8px; color:#fff;"></div>
                <div><label style="font-size:12px;color:#8a9abb;">活动图片</label><div id="editEventImageUploader"></div></div>
                <div><label style="font-size:12px;color:#8a9abb;">简短描述</label><input type="text" id="editEventShortDesc" value="${escapeHtml(event.short_description || '')}" style="width:100%; margin:10px 0; padding:12px; background:#0f172a; border:1px solid #1e2a3a; border-radius:8px; color:#fff;"></div>
                <div><label style="font-size:12px;color:#8a9abb;">详细描述</label><textarea id="editEventDesc" rows="3" style="width:100%; margin:10px 0; padding:12px; background:#0f172a; border:1px solid #1e2a3a; border-radius:8px; color:#fff;">${escapeHtml(event.description || '')}</textarea></div>
                <div><label style="font-size:12px;color:#8a9abb;">内容详情</label><textarea id="editEventContent" rows="5" style="width:100%; margin:10px 0; padding:12px; background:#0f172a; border:1px solid #1e2a3a; border-radius:8px; color:#fff;">${escapeHtml(event.content || '')}</textarea></div>
                <div style="display: flex; gap: 12px;">
                    <div style="flex:1"><label style="font-size:12px;color:#8a9abb;">开始日期</label><input type="date" id="editEventDate" value="${event.event_date || ''}" style="width:100%; margin:10px 0; padding:12px; background:#0f172a; border:1px solid #1e2a3a; border-radius:8px; color:#fff;"></div>
                    <div style="flex:1"><label style="font-size:12px;color:#8a9abb;">结束日期</label><input type="date" id="editEventEndDate" value="${event.end_date || ''}" style="width:100%; margin:10px 0; padding:12px; background:#0f172a; border:1px solid #1e2a3a; border-radius:8px; color:#fff;"></div>
                </div>
                <div><label style="font-size:12px;color:#8a9abb;">标签徽章</label><input type="text" id="editEventBadge" value="${escapeHtml(event.badge || 'Promotion')}" style="width:100%; margin:10px 0; padding:12px; background:#0f172a; border:1px solid #1e2a3a; border-radius:8px; color:#fff;"></div>
                <div><label style="font-size:12px;color:#8a9abb;">状态</label><select id="editEventStatus" style="width:100%; margin:10px 0; padding:12px; background:#0f172a; border:1px solid #1e2a3a; border-radius:8px; color:#fff;"><option value="active" ${event.status === 'active' ? 'selected' : ''}>显示</option><option value="inactive" ${event.status === 'inactive' ? 'selected' : ''}>隐藏</option></select></div>
                <div><label style="font-size:12px;color:#8a9abb;">排序</label><input type="number" id="editEventSortOrder" value="${event.sort_order || 0}" style="width:100%; margin:10px 0; padding:12px; background:#0f172a; border:1px solid #1e2a3a; border-radius:8px; color:#fff;"></div>
                <div style="display: flex; gap: 12px; margin-top: 20px;">
                    <button id="updateEventBtn" class="success" style="background:#2f6b3a;border:none;padding:12px 24px;border-radius:8px;color:#fff;cursor:pointer;font-weight:600;">更新</button>
                    <button id="closeEditEventModalBtn" style="background:#7a2f2f;border:none;padding:12px 24px;border-radius:8px;color:#fff;cursor:pointer;">取消</button>
                </div>
            </div>
        </div>
    `;
    
    const existing = document.getElementById('editEventModal');
    if (existing) existing.remove();
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    
    createImageUploader('editEventImageUploader', currentImageUrl, (imageUrl) => {
        currentImageUrl = imageUrl;
    });
    
    document.getElementById('updateEventBtn').onclick = async () => {
        const title = document.getElementById('editEventTitle').value.trim();
        if (!title) {
            showToast('请填写活动标题', 'error');
            return;
        }
        
        const updateData = {
            title: title,
            short_description: document.getElementById('editEventShortDesc').value.trim(),
            description: document.getElementById('editEventDesc').value.trim(),
            content: document.getElementById('editEventContent').value.trim(),
            image_url: currentImageUrl,
            event_date: document.getElementById('editEventDate').value || null,
            end_date: document.getElementById('editEventEndDate').value || null,
            badge: document.getElementById('editEventBadge').value.trim(),
            status: document.getElementById('editEventStatus').value,
            sort_order: parseInt(document.getElementById('editEventSortOrder').value) || 0,
            updated_at: new Date().toISOString()
        };
        
        const { error } = await sb.from('events').update(updateData).eq('id', id);
        if (error) {
            showToast('更新失败: ' + error.message, 'error');
            return;
        }
        
        showToast('活动更新成功', 'success');
        document.getElementById('editEventModal').remove();
        loadEventsList();
    };
    
    document.getElementById('closeEditEventModalBtn').onclick = () => document.getElementById('editEventModal').remove();
}

// ============================================================
// 2. Certificate & Company Profile (多图 + 内容)
// ============================================================
async function loadCertificateContent() {
    const { data, error } = await sb
        .from('system_content')
        .select('*')
        .eq('type', 'certificate')
        .single();
    
    if (error && error.code !== 'PGRST116') {
        console.error('加载证书内容失败:', error);
    }
    
    certificateData = data || null;
    if (certificateData?.image_url) {
        try {
            certificateImages = JSON.parse(certificateData.image_url);
            if (!Array.isArray(certificateImages)) {
                certificateImages = [certificateImages];
            }
        } catch (e) {
            certificateImages = certificateData.image_url ? [certificateData.image_url] : [];
        }
    } else {
        certificateImages = [];
    }
    renderCertificateContent();
}

function renderCertificateContent() {
    const container = document.getElementById('certificatePanel');
    if (!container) return;
    
    let imagesHtml = '';
    if (certificateImages.length > 0) {
        imagesHtml = `<div class="image-grid">`;
        certificateImages.forEach((url, index) => {
            imagesHtml += `
                <div class="image-grid-item">
                    <img src="${url}" onclick="window.open('${url}','_blank')" onerror="this.style.display='none'">
                    <button class="delete-image-btn" onclick="deleteCertificateImage(${index})" title="删除图片"><i class="fas fa-times"></i></button>
                    <span class="image-index">#${index + 1}</span>
                </div>
            `;
        });
        imagesHtml += `</div>`;
    } else {
        imagesHtml = `<div class="no-images-placeholder"><i class="fas fa-image"></i>暂无图片，请上传</div>`;
    }
    
    container.innerHTML = `
        <div style="margin-top: 16px;">
            <div class="content-editor-area">
                <h4 style="color: #4a7cff; margin-bottom: 16px;"><i class="fas fa-building"></i> Certificate &amp; Company Profile</h4>
                <p style="color: #8a9abb; font-size: 13px; margin-bottom: 16px;">上传证书/公司图片和编辑内容，用户将在前端 "Company Profile" 页面查看。</p>
                
                <div style="margin-bottom: 16px;">
                    <label>图片（支持多张）</label>
                    <div class="image-upload-row">
                        <div class="upload-btn-area" id="certificateUploadArea">
                            <i class="fas fa-cloud-upload-alt" style="color: #4a7cff;"></i>
                            <span style="color: #8a9abb; font-size: 12px;">上传图片</span>
                            <input type="file" id="certificateFileInput" accept="image/*" style="display:none;">
                        </div>
                        <span style="font-size: 11px; color: #6a7a9a;">已上传 ${certificateImages.length} 张</span>
                    </div>
                    <div id="certificateImageGrid">
                        ${imagesHtml}
                    </div>
                </div>
                
                <div style="margin-bottom: 16px;">
                    <label>内容 (支持 HTML)</label>
                    <textarea id="certificateContent" rows="12" style="width:100%; background:#0f172a; border:1px solid #1e2a3a; border-radius:8px; padding:12px; color:#fff; font-family:monospace; font-size:13px; resize:vertical;">${escapeHtml(certificateData?.content || '')}</textarea>
                </div>
                
                <div style="display: flex; gap: 12px; margin-top: 8px;">
                    <button id="saveCertificateBtn" class="success" style="background:#2f6b3a;border:none;padding:10px 24px;border-radius:8px;color:#fff;cursor:pointer;font-weight:600;"><i class="fas fa-save"></i> 保存</button>
                    <button id="previewCertificateBtn" class="btn-primary" style="padding:10px 24px;"><i class="fas fa-eye"></i> 预览</button>
                </div>
                
                <div id="certificatePreviewPanel" style="display:none; margin-top:16px; background:rgba(0,0,0,0.3); border-radius:12px; padding:16px; max-height:400px; overflow-y:auto;"></div>
            </div>
        </div>
    `;
    
    const uploadArea = document.getElementById('certificateUploadArea');
    const fileInput = document.getElementById('certificateFileInput');
    if (uploadArea && fileInput) {
        uploadArea.addEventListener('click', () => fileInput.click());
        fileInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            await uploadCertificateImage(file);
            fileInput.value = '';
        });
    }
    
    document.getElementById('saveCertificateBtn').addEventListener('click', async () => {
        const content = document.getElementById('certificateContent').value;
        const imageUrlsJson = JSON.stringify(certificateImages);
        
        try {
            const { data: existing } = await sb
                .from('system_content')
                .select('id')
                .eq('type', 'certificate')
                .single();
            
            let error;
            if (existing) {
                const { error: updateError } = await sb
                    .from('system_content')
                    .update({
                        title: 'Certificate & Company Profile',
                        content: content,
                        image_url: imageUrlsJson,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', existing.id);
                error = updateError;
            } else {
                const { error: insertError } = await sb
                    .from('system_content')
                    .insert({
                        type: 'certificate',
                        title: 'Certificate & Company Profile',
                        content: content,
                        image_url: imageUrlsJson,
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString()
                    });
                error = insertError;
            }
            
            if (error) {
                showToast('保存失败: ' + error.message, 'error');
            } else {
                showToast('✅ 已保存', 'success');
                await loadCertificateContent();
            }
        } catch (e) {
            showToast('保存失败: ' + e.message, 'error');
        }
    });
    
    document.getElementById('previewCertificateBtn').addEventListener('click', () => {
        const content = document.getElementById('certificateContent').value;
        const panel = document.getElementById('certificatePreviewPanel');
        panel.style.display = 'block';
        panel.innerHTML = content || '<em style="color:#6a7a9a;">暂无内容</em>';
    });
}

window.deleteCertificateImage = function(index) {
    showConfirm('确认删除', '确定要删除这张图片吗？', async () => {
        certificateImages.splice(index, 1);
        renderCertificateContent();
        const content = document.getElementById('certificateContent')?.value || '';
        const imageUrlsJson = JSON.stringify(certificateImages);
        
        try {
            const { data: existing } = await sb
                .from('system_content')
                .select('id')
                .eq('type', 'certificate')
                .single();
            
            if (existing) {
                await sb
                    .from('system_content')
                    .update({
                        content: content,
                        image_url: imageUrlsJson,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', existing.id);
                showToast('图片已删除', 'success');
            }
        } catch (e) {
            console.error('删除图片保存失败:', e);
        }
    });
};

async function uploadCertificateImage(file) {
    if (!file.type.startsWith('image/')) {
        showToast('请选择图片文件', 'error');
        return;
    }
    if (file.size > 5 * 1024 * 1024) {
        showToast('图片大小不能超过 5MB', 'error');
        return;
    }
    
    showToast('上传中...', 'info');
    
    const fileName = `certificate/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
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
        certificateImages.push(publicUrl);
        showToast('图片上传成功！', 'success');
        renderCertificateContent();
    } catch (error) {
        console.error('上传失败:', error);
        showToast('上传失败: ' + error.message, 'error');
    }
}

// ============================================================
// 3. Employment Contract (多图 + 内容)
// ============================================================
let contractData = null;

async function loadContractContent() {
    const { data, error } = await sb
        .from('system_content')
        .select('*')
        .eq('type', 'contract')
        .single();
    
    if (error && error.code !== 'PGRST116') {
        console.error('加载雇佣合同失败:', error);
    }
    
    contractData = data || null;
    if (contractData?.image_url) {
        try {
            contractImages = JSON.parse(contractData.image_url);
            if (!Array.isArray(contractImages)) {
                contractImages = [contractImages];
            }
        } catch (e) {
            contractImages = contractData.image_url ? [contractData.image_url] : [];
        }
    } else {
        contractImages = [];
    }
    renderContractContent();
}

function renderContractContent() {
    const container = document.getElementById('contractPanel');
    if (!container) return;
    
    let imagesHtml = '';
    if (contractImages.length > 0) {
        imagesHtml = `<div class="image-grid">`;
        contractImages.forEach((url, index) => {
            imagesHtml += `
                <div class="image-grid-item">
                    <img src="${url}" onclick="window.open('${url}','_blank')" onerror="this.style.display='none'">
                    <button class="delete-image-btn" onclick="deleteContractImage(${index})" title="删除图片"><i class="fas fa-times"></i></button>
                    <span class="image-index">#${index + 1}</span>
                </div>
            `;
        });
        imagesHtml += `</div>`;
    } else {
        imagesHtml = `<div class="no-images-placeholder"><i class="fas fa-image"></i>暂无图片，请上传</div>`;
    }
    
    container.innerHTML = `
        <div style="margin-top: 16px;">
            <div class="content-editor-area">
                <h4 style="color: #4a7cff; margin-bottom: 16px;"><i class="fas fa-file-contract"></i> Employment Contract</h4>
                <p style="color: #8a9abb; font-size: 13px; margin-bottom: 16px;">上传合同图片和编辑内容，用户将在前端 "Employment Contract" 页面查看。</p>
                
                <div style="margin-bottom: 16px;">
                    <label>合同图片（支持多张）</label>
                    <div class="image-upload-row">
                        <div class="upload-btn-area" id="contractUploadArea">
                            <i class="fas fa-cloud-upload-alt" style="color: #4a7cff;"></i>
                            <span style="color: #8a9abb; font-size: 12px;">上传图片</span>
                            <input type="file" id="contractFileInput" accept="image/*" style="display:none;">
                        </div>
                        <span style="font-size: 11px; color: #6a7a9a;">已上传 ${contractImages.length} 张</span>
                    </div>
                    <div id="contractImageGrid">
                        ${imagesHtml}
                    </div>
                </div>
                
                <div style="margin-bottom: 16px;">
                    <label>合同内容 (支持 HTML)</label>
                    <textarea id="contractContent" rows="12" style="width:100%; background:#0f172a; border:1px solid #1e2a3a; border-radius:8px; padding:12px; color:#fff; font-family:monospace; font-size:13px; resize:vertical;">${escapeHtml(contractData?.content || '')}</textarea>
                </div>
                
                <div style="display: flex; gap: 12px; margin-top: 8px;">
                    <button id="saveContractBtn" class="success" style="background:#2f6b3a;border:none;padding:10px 24px;border-radius:8px;color:#fff;cursor:pointer;font-weight:600;"><i class="fas fa-save"></i> 保存</button>
                    <button id="previewContractBtn" class="btn-primary" style="padding:10px 24px;"><i class="fas fa-eye"></i> 预览</button>
                </div>
                
                <div id="contractPreviewPanel" style="display:none; margin-top:16px; background:rgba(0,0,0,0.3); border-radius:12px; padding:16px; max-height:400px; overflow-y:auto;"></div>
            </div>
        </div>
    `;
    
    const uploadArea = document.getElementById('contractUploadArea');
    const fileInput = document.getElementById('contractFileInput');
    if (uploadArea && fileInput) {
        uploadArea.addEventListener('click', () => fileInput.click());
        fileInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            await uploadContractImage(file);
            fileInput.value = '';
        });
    }
    
    document.getElementById('saveContractBtn').addEventListener('click', async () => {
        const content = document.getElementById('contractContent').value;
        const imageUrlsJson = JSON.stringify(contractImages);
        
        try {
            const { data: existing } = await sb
                .from('system_content')
                .select('id')
                .eq('type', 'contract')
                .single();
            
            let error;
            if (existing) {
                const { error: updateError } = await sb
                    .from('system_content')
                    .update({
                        title: 'Employment Contract',
                        content: content,
                        image_url: imageUrlsJson,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', existing.id);
                error = updateError;
            } else {
                const { error: insertError } = await sb
                    .from('system_content')
                    .insert({
                        type: 'contract',
                        title: 'Employment Contract',
                        content: content,
                        image_url: imageUrlsJson,
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString()
                    });
                error = insertError;
            }
            
            if (error) {
                showToast('保存失败: ' + error.message, 'error');
            } else {
                showToast('✅ 合同已保存', 'success');
                await loadContractContent();
            }
        } catch (e) {
            showToast('保存失败: ' + e.message, 'error');
        }
    });
    
    document.getElementById('previewContractBtn').addEventListener('click', () => {
        const content = document.getElementById('contractContent').value;
        const panel = document.getElementById('contractPreviewPanel');
        panel.style.display = 'block';
        panel.innerHTML = content || '<em style="color:#6a7a9a;">暂无内容</em>';
    });
}

window.deleteContractImage = function(index) {
    showConfirm('确认删除', '确定要删除这张图片吗？', async () => {
        contractImages.splice(index, 1);
        renderContractContent();
        const content = document.getElementById('contractContent')?.value || '';
        const imageUrlsJson = JSON.stringify(contractImages);
        
        try {
            const { data: existing } = await sb
                .from('system_content')
                .select('id')
                .eq('type', 'contract')
                .single();
            
            if (existing) {
                await sb
                    .from('system_content')
                    .update({
                        content: content,
                        image_url: imageUrlsJson,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', existing.id);
                showToast('图片已删除', 'success');
            }
        } catch (e) {
            console.error('删除图片保存失败:', e);
        }
    });
};

async function uploadContractImage(file) {
    if (!file.type.startsWith('image/')) {
        showToast('请选择图片文件', 'error');
        return;
    }
    if (file.size > 5 * 1024 * 1024) {
        showToast('图片大小不能超过 5MB', 'error');
        return;
    }
    
    showToast('上传中...', 'info');
    
    const fileName = `contract/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
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
        contractImages.push(publicUrl);
        showToast('图片上传成功！', 'success');
        renderContractContent();
    } catch (error) {
        console.error('上传失败:', error);
        showToast('上传失败: ' + error.message, 'error');
    }
}

// ============================================================
// 4. Legal Pages (T&C, Privacy, Rules)
// ============================================================
async function loadLegalPages(type) {
    const titleMap = {
        'tc': 'Terms & Conditions',
        'privacy': 'Privacy & Security',
        'rules': 'Platform Rules'
    };
    
    let { data, error } = await sb
        .from('system_content')
        .select('*')
        .eq('type', type)
        .single();
    
    if (error || !data) {
        const defaultContent = getDefaultContent(type);
        const { data: newData, error: insertError } = await sb
            .from('system_content')
            .insert([{ 
                type: type, 
                title: titleMap[type], 
                content: defaultContent,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            }])
            .select()
            .single();
        
        if (!insertError && newData) {
            data = newData;
        }
    }
    
    if (data) {
        // 存储到对应的变量
        if (type === 'tc') legalPages[0] = data;
        else if (type === 'privacy') legalPages[1] = data;
        else if (type === 'rules') legalPages[2] = data;
    }
    
    if (currentContentTab === type) {
        renderLegalPage(type);
    }
}

function getDefaultContent(type) {
    if (type === 'tc') {
        return `<h2>Terms and Conditions</h2>
<p>Last updated: January 1, 2025</p>
<h3>1. Acceptance of Terms</h3>
<p>By accessing and using the ADDITIVE platform, you agree to be bound by these Terms and Conditions.</p>
<h3>2. User Accounts</h3>
<p>You must be at least 18 years old to create an account. You are responsible for maintaining the confidentiality of your account credentials.</p>
<h3>3. Platform Use</h3>
<p>Our platform connects hotels with marketing services. You agree to use the platform only for lawful purposes.</p>
<h3>4. Payments and Fees</h3>
<p>All fees are clearly displayed before confirmation. Payments are processed securely through our payment partners.</p>
<h3>5. Termination</h3>
<p>We reserve the right to suspend or terminate accounts that violate these terms.</p>
<h3>6. Contact</h3>
<p>For questions about these Terms, contact us at legal@additive.com</p>`;
    } else if (type === 'privacy') {
        return `<h2>Privacy & Security Policy</h2>
<p>Last updated: January 1, 2025</p>
<h3>1. Information We Collect</h3>
<p>We collect information you provide directly to us, such as when you create an account, fill out a form, or communicate with us.</p>
<h3>2. How We Use Your Information</h3>
<p>We use the information to provide, maintain, and improve our services, to communicate with you, and to protect the security of our platform.</p>
<h3>3. Data Security</h3>
<p>We implement appropriate technical and organizational measures to protect your personal information against unauthorized access.</p>
<h3>4. Data Retention</h3>
<p>We retain your information for as long as your account is active or as needed to provide you services.</p>
<h3>5. Your Rights</h3>
<p>You have the right to access, correct, or delete your personal information. Contact us to exercise these rights.</p>
<h3>6. Cookies</h3>
<p>We use cookies to enhance your experience on our platform. You can adjust your browser settings to refuse cookies.</p>`;
    } else if (type === 'rules') {
        return `<h2>Platform Rules</h2>
<p>Last updated: January 1, 2025</p>
<h3>1. User Conduct</h3>
<p>Users must act professionally and respectfully when interacting with other platform users and our support team.</p>
<h3>2. Prohibited Activities</h3>
<p>The following activities are prohibited: fraudulent transactions, spamming, harassment, and attempting to bypass platform security.</p>
<h3>3. Content Guidelines</h3>
<p>Any content uploaded must not violate intellectual property rights or contain offensive material.</p>
<h3>4. Fair Use Policy</h3>
<p>The platform is intended for legitimate business purposes. Excessive or abusive usage may result in account restriction.</p>
<h3>5. Reporting Violations</h3>
<p>If you witness a violation of these rules, please report it to our support team immediately.</p>
<h3>6. Enforcement</h3>
<p>Violations may result in warnings, temporary suspension, or permanent account termination.</p>`;
    }
    return '<p>Content coming soon...</p>';
}

function renderLegalPage(type) {
    const panelMap = {
        'tc': 'tcPanel',
        'privacy': 'privacyPanel',
        'rules': 'rulesPanel'
    };
    const container = document.getElementById(panelMap[type]);
    if (!container) return;
    
    const pageMap = {
        'tc': legalPages[0],
        'privacy': legalPages[1],
        'rules': legalPages[2]
    };
    const page = pageMap[type];
    
    if (!page) {
        container.innerHTML = '<div style="text-align:center; padding:40px; color:#aaa;">加载中...</div>';
        return;
    }
    
    container.innerHTML = `
        <div class="legal-card">
            <div class="legal-header">
                <div class="legal-title"><i class="fas fa-file-contract"></i> ${page.title}</div>
                <button class="edit-legal-btn" data-id="${page.id}" data-type="${type}" style="background:#2f6b3a; border:none; padding:6px 16px; border-radius:8px; color:#fff; cursor:pointer;"><i class="fas fa-edit"></i> 编辑内容</button>
            </div>
            <div class="legal-content-preview" id="preview_${page.id}">
                ${page.content ? page.content.substring(0, 300) + (page.content.length > 300 ? '...' : '') : '<em>暂无内容</em>'}
            </div>
            <div style="font-size: 11px; color: #6a7a9a;">
                <i class="fas fa-clock"></i> 最后更新: ${new Date(page.updated_at || page.created_at).toLocaleString()}
            </div>
        </div>
    `;
    
    container.querySelector('.edit-legal-btn')?.addEventListener('click', () => {
        openEditLegalModal(page, type);
    });
}

function openEditLegalModal(page, type) {
    const modalHtml = `
        <div id="editLegalModal" class="modal-overlay" style="visibility: visible; opacity: 1;">
            <div class="modal-card" style="width: 800px; max-width: 90%; max-height: 85vh; overflow-y: auto;">
                <h3><i class="fas fa-edit"></i> 编辑 ${page.title}</h3>
                <div style="margin-bottom: 15px;">
                    <label style="display: block; margin-bottom: 8px; color: #8a9abb;">内容 (支持HTML格式)</label>
                    <textarea id="legalContent" rows="15" style="width:100%; background:#0f172a; border:1px solid #1e2a3a; border-radius:12px; padding:15px; color:#fff; font-family:monospace;">${escapeHtml(page.content || '')}</textarea>
                </div>
                <div style="margin-bottom: 15px;">
                    <label style="display: block; margin-bottom: 8px; color: #8a9abb;">预览</label>
                    <div id="legalPreview" style="background: rgba(0,0,0,0.3); border-radius: 12px; padding: 15px; max-height: 200px; overflow-y: auto; font-size: 13px; color: #c0c8e0;">
                        ${page.content || '<em>预览区域</em>'}
                    </div>
                </div>
                <div style="display: flex; gap: 12px; margin-top: 20px;">
                    <button id="saveLegalBtn" class="success" style="background:#2f6b3a;border:none;padding:12px 24px;border-radius:8px;color:#fff;cursor:pointer;font-weight:600;">保存</button>
                    <button id="previewLegalBtn" class="btn-primary" style="padding:12px 24px;"><i class="fas fa-eye"></i> 刷新预览</button>
                    <button id="closeLegalModalBtn" style="background:#7a2f2f;border:none;padding:12px 24px;border-radius:8px;color:#fff;cursor:pointer;">取消</button>
                </div>
            </div>
        </div>
    `;
    
    const existing = document.getElementById('editLegalModal');
    if (existing) existing.remove();
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    
    document.getElementById('previewLegalBtn').onclick = () => {
        const content = document.getElementById('legalContent').value;
        document.getElementById('legalPreview').innerHTML = content || '<em>暂无内容</em>';
    };
    
    document.getElementById('saveLegalBtn').onclick = async () => {
        const content = document.getElementById('legalContent').value;
        
        const { error } = await sb
            .from('system_content')
            .update({ 
                content: content,
                updated_at: new Date().toISOString()
            })
            .eq('id', page.id);
        
        if (error) {
            showToast('保存失败: ' + error.message, 'error');
            return;
        }
        
        showToast('保存成功', 'success');
        document.getElementById('editLegalModal').remove();
        await loadLegalPages(type);
        renderLegalPage(type);
    };
    
    document.getElementById('closeLegalModalBtn').onclick = () => {
        document.getElementById('editLegalModal').remove();
    };
}

// ============================================================
// 工具函数
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
    // ... toast 实现保持不变
}

function showConfirm(title, message, onConfirm) {
    if (confirm(title + '\n' + message)) {
        if (onConfirm) onConfirm();
    }
}

// 事件图片上传（用于活动管理）
function createImageUploader(containerId, currentImageUrl, onUploadComplete) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    container.innerHTML = `
        <div class="upload-area" id="uploadArea_${containerId}">
            <i class="fas fa-cloud-upload-alt"></i>
            <div>点击或拖拽上传图片</div>
            <small style="color: #8a9abb;">支持 JPG, PNG, GIF (最大 5MB)</small>
            <div id="previewContainer_${containerId}" style="margin-top: 10px;">
                ${currentImageUrl ? `<img src="${currentImageUrl}" class="image-preview" onclick="window.open('${currentImageUrl}','_blank')">` : ''}
            </div>
            <input type="file" id="fileInput_${containerId}" accept="image/*" style="display: none;">
        </div>
    `;
    
    const uploadArea = document.getElementById(`uploadArea_${containerId}`);
    const fileInput = document.getElementById(`fileInput_${containerId}`);
    
    uploadArea.addEventListener('click', () => {
        fileInput.click();
    });
    
    fileInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (file) {
            const previewContainer = document.getElementById(`previewContainer_${containerId}`);
            const fileName = `events/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
            const storageBucket = 'event-images';
            
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
                previewContainer.innerHTML = `<img src="${publicUrl}" class="image-preview" onclick="window.open('${publicUrl}','_blank')">`;
                if (onUploadComplete) onUploadComplete(publicUrl);
                showToast('图片上传成功！', 'success');
            } catch (error) {
                console.error('上传失败:', error);
                showToast('上传失败: ' + error.message, 'error');
            }
        }
    });
}

window.loadContentPage = loadContentPage;