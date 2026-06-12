// admin-content.js - 内容管理页面（包含活动和内容管理）
let systemContents = [];
let eventsList = [];
let currentContentTab = 'contents';

async function loadContentPage() {
    const container = document.getElementById('page_content');
    if (!container) return;
    
    container.innerHTML = `
        <div class="card">
            <div class="search-bar" style="justify-content: space-between;">
                <h3><i class="fas fa-file-contract"></i> 内容管理</h3>
                <div style="display: flex; gap: 12px;">
                    <button id="tabContentsBtn" class="tab-content-btn active" data-tab="contents"><i class="fas fa-file-alt"></i> 系统内容</button>
                    <button id="tabEventsBtn" class="tab-content-btn" data-tab="events"><i class="fas fa-calendar-alt"></i> 活动管理</button>
                </div>
            </div>
            <div id="contentsPanel" class="content-panel"></div>
            <div id="eventsPanel" class="content-panel" style="display: none;"></div>
        </div>
    `;
    
    const style = document.createElement('style');
    style.textContent = `
        .tab-content-btn { background: rgba(74,124,255,0.1); border: 1px solid rgba(74,124,255,0.2); border-radius: 30px; padding: 6px 16px; color: #8a9abb; cursor: pointer; transition: all 0.2s; }
        .tab-content-btn.active { background: #4a7cff; color: #fff; border-color: #4a7cff; }
        .event-item { background: #0f172a; border-radius: 16px; padding: 15px; margin-bottom: 12px; display: flex; gap: 15px; flex-wrap: wrap; align-items: center; }
        .event-image-preview { width: 80px; height: 60px; object-fit: cover; border-radius: 8px; }
        .event-status-active { color: #2ed15a; }
        .event-status-inactive { color: #ff5a5a; }
    `;
    document.head.appendChild(style);
    
    document.getElementById('tabContentsBtn').addEventListener('click', () => switchContentTab('contents'));
    document.getElementById('tabEventsBtn').addEventListener('click', () => switchContentTab('events'));
    
    await loadContentList();
    await loadEventsList();
    switchContentTab('contents');
}

function switchContentTab(tab) {
    currentContentTab = tab;
    document.getElementById('tabContentsBtn').classList.toggle('active', tab === 'contents');
    document.getElementById('tabEventsBtn').classList.toggle('active', tab === 'events');
    document.getElementById('contentsPanel').style.display = tab === 'contents' ? 'block' : 'none';
    document.getElementById('eventsPanel').style.display = tab === 'events' ? 'block' : 'none';
    
    if (tab === 'contents') {
        renderContentList();
    } else if (tab === 'events') {
        renderEventsList();
    }
}

// ========== 系统内容管理 ==========
async function loadContentList() {
    const { data: contents } = await sb.from('system_content').select('*').order('id');
    systemContents = contents || [];
    renderContentList();
}

function renderContentList() {
    const container = document.getElementById('contentsPanel');
    if (!container) return;
    
    container.innerHTML = `
        <div class="search-bar" style="justify-content: flex-end;">
            <button id="addContentBtn" class="success"><i class="fas fa-plus"></i> 添加内容</button>
        </div>
        <div id="contentListContainer"></div>
    `;
    
    const listContainer = document.getElementById('contentListContainer');
    
    if (systemContents.length === 0) {
        listContainer.innerHTML = '<div style="text-align:center; padding:40px; color:#aaa;">暂无内容，点击"添加内容"开始</div>';
    } else {
        listContainer.innerHTML = '';
        systemContents.forEach(content => {
            const div = document.createElement('div');
            div.className = 'content-item';
            div.innerHTML = `
                <input type="text" class="content-title-input" data-id="${content.id}" value="${escapeHtml(content.title || '')}" placeholder="标题" style="width:100%; margin-bottom:10px; background:#0f172a; border:1px solid #1e2a3a; border-radius:8px; padding:10px; color:#fff;">
                <textarea rows="4" class="content-body-textarea" data-id="${content.id}" placeholder="内容" style="width:100%; margin-bottom:10px; background:#0f172a; border:1px solid #1e2a3a; border-radius:8px; padding:10px; color:#fff;">${escapeHtml(content.content || '')}</textarea>
                <div style="display:flex; gap:10px; justify-content:flex-end;">
                    <button class="save-content-btn" data-id="${content.id}" style="background:#2f6b3a; padding:8px 20px; border-radius:8px;">保存</button>
                    <button class="delete-content-btn" data-id="${content.id}" style="background:#7a2f2f; padding:8px 20px; border-radius:8px;">删除</button>
                </div>
            `;
            listContainer.appendChild(div);
        });
    }
    
    document.querySelectorAll('.save-content-btn').forEach(btn => btn.addEventListener('click', () => saveContentItem(btn.dataset.id)));
    document.querySelectorAll('.delete-content-btn').forEach(btn => btn.addEventListener('click', () => deleteContentItem(btn.dataset.id)));
    document.getElementById('addContentBtn')?.addEventListener('click', openAddContentModal);
}

async function saveContentItem(id) {
    const title = document.querySelector(`.content-title-input[data-id="${id}"]`).value;
    const content = document.querySelector(`.content-body-textarea[data-id="${id}"]`).value;
    await sb.from('system_content').update({ title: title, content: content }).eq('id', id);
    showToast('保存成功', 'success');
    loadContentList();
}

async function deleteContentItem(id) {
    showConfirm('确认删除', '确定删除此内容吗？', async () => {
        await sb.from('system_content').delete().eq('id', id);
        showToast('已删除', 'success');
        loadContentList();
    });
}

function openAddContentModal() {
    const modalHtml = `
        <div id="addContentModal" class="modal-overlay" style="visibility: visible; opacity: 1;">
            <div class="modal-card">
                <h3><i class="fas fa-plus"></i> 添加内容</h3>
                <input type="text" id="contentTitle" placeholder="标题" style="width:100%; margin:10px 0; padding:12px; background:#0f172a; border:1px solid #1e2a3a; border-radius:8px; color:#fff;">
                <textarea id="contentBody" rows="5" placeholder="内容" style="width:100%; margin:10px 0; padding:12px; background:#0f172a; border:1px solid #1e2a3a; border-radius:8px; color:#fff;"></textarea>
                <div style="display: flex; gap: 12px; margin-top: 20px;">
                    <button id="saveContentItemBtn" class="success">保存</button>
                    <button id="closeContentModalBtn">取消</button>
                </div>
            </div>
        </div>
    `;
    const existing = document.getElementById('addContentModal');
    if (existing) existing.remove();
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    document.getElementById('saveContentItemBtn').onclick = saveNewContent;
    document.getElementById('closeContentModalBtn').onclick = () => document.getElementById('addContentModal').remove();
}

async function saveNewContent() {
    const title = document.getElementById('contentTitle').value.trim();
    const content = document.getElementById('contentBody').value.trim();
    if (!title || !content) {
        showToast('请填写标题和内容', 'error');
        return;
    }
    await sb.from('system_content').insert([{ title: title, content: content }]);
    showToast('添加成功', 'success');
    document.getElementById('addContentModal').remove();
    loadContentList();
}

// ========== 活动管理 ==========
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
    } else {
        listContainer.innerHTML = '';
        eventsList.forEach(event => {
            const div = document.createElement('div');
            div.className = 'event-item';
            div.setAttribute('data-id', event.id);
            div.innerHTML = `
                <div><img src="${event.image_url || 'https://placehold.co/80x60/0f172a/4a7cff?text=No+Img'}" class="event-image-preview" onerror="this.src='https://placehold.co/80x60/0f172a/4a7cff?text=No+Img'"></div>
                <div style="flex:2;"><input type="text" class="event-title-edit" data-id="${event.id}" value="${escapeHtml(event.title || '')}" placeholder="标题" style="width:100%; background:#0f172a; border:1px solid #1e2a3a; border-radius:8px; padding:8px; color:#fff;"></div>
                <div><input type="date" class="event-date-edit" data-id="${event.id}" value="${event.event_date || ''}" style="background:#0f172a; border:1px solid #1e2a3a; border-radius:8px; padding:8px; color:#fff;"></div>
                <div><select class="event-status-edit" data-id="${event.id}" style="background:#0f172a; border:1px solid #1e2a3a; border-radius:8px; padding:8px; color:#fff;">
                    <option value="active" ${event.status === 'active' ? 'selected' : ''}>显示</option>
                    <option value="inactive" ${event.status === 'inactive' ? 'selected' : ''}>隐藏</option>
                </select></div>
                <div><input type="number" class="event-sort-edit" data-id="${event.id}" value="${event.sort_order || 0}" placeholder="排序" style="width:70px; background:#0f172a; border:1px solid #1e2a3a; border-radius:8px; padding:8px; color:#fff;"></div>
                <div>
                    <button class="edit-event-detail" data-id="${event.id}" style="background:#2f6b3a; padding:6px 12px; border-radius:8px;"><i class="fas fa-edit"></i> 编辑</button>
                    <button class="delete-event-btn" data-id="${event.id}" style="background:#7a2f2f; padding:6px 12px; border-radius:8px;"><i class="fas fa-trash"></i> 删除</button>
                </div>
            `;
            listContainer.appendChild(div);
        });
    }
    
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
    const modalHtml = `
        <div id="addEventModal" class="modal-overlay" style="visibility: visible; opacity: 1;">
            <div class="modal-card" style="width: 600px; max-width: 90%;">
                <h3><i class="fas fa-plus"></i> 添加活动</h3>
                <div><label>标题 *</label><input type="text" id="eventTitle" placeholder="活动标题" style="width:100%; margin:10px 0; padding:12px; background:#0f172a; border:1px solid #1e2a3a; border-radius:8px; color:#fff;"></div>
                <div><label>简短描述</label><input type="text" id="eventShortDesc" placeholder="简短描述" style="width:100%; margin:10px 0; padding:12px; background:#0f172a; border:1px solid #1e2a3a; border-radius:8px; color:#fff;"></div>
                <div><label>详细描述</label><textarea id="eventDesc" rows="3" placeholder="详细描述" style="width:100%; margin:10px 0; padding:12px; background:#0f172a; border:1px solid #1e2a3a; border-radius:8px; color:#fff;"></textarea></div>
                <div><label>内容详情</label><textarea id="eventContent" rows="5" placeholder="完整内容" style="width:100%; margin:10px 0; padding:12px; background:#0f172a; border:1px solid #1e2a3a; border-radius:8px; color:#fff;"></textarea></div>
                <div><label>图片 URL</label><input type="text" id="eventImageUrl" placeholder="图片URL" style="width:100%; margin:10px 0; padding:12px; background:#0f172a; border:1px solid #1e2a3a; border-radius:8px; color:#fff;"></div>
                <div style="display: flex; gap: 12px;"><div style="flex:1"><label>开始日期</label><input type="date" id="eventDate" style="width:100%; margin:10px 0; padding:12px; background:#0f172a; border:1px solid #1e2a3a; border-radius:8px; color:#fff;"></div><div style="flex:1"><label>结束日期</label><input type="date" id="eventEndDate" style="width:100%; margin:10px 0; padding:12px; background:#0f172a; border:1px solid #1e2a3a; border-radius:8px; color:#fff;"></div></div>
                <div><label>标签徽章</label><input type="text" id="eventBadge" placeholder="如: 🔥 Limited Time" value="Promotion" style="width:100%; margin:10px 0; padding:12px; background:#0f172a; border:1px solid #1e2a3a; border-radius:8px; color:#fff;"></div>
                <div><label>状态</label><select id="eventStatus" style="width:100%; margin:10px 0; padding:12px; background:#0f172a; border:1px solid #1e2a3a; border-radius:8px; color:#fff;"><option value="active">显示</option><option value="inactive">隐藏</option></select></div>
                <div><label>排序</label><input type="number" id="eventSortOrder" value="0" style="width:100%; margin:10px 0; padding:12px; background:#0f172a; border:1px solid #1e2a3a; border-radius:8px; color:#fff;"></div>
                <div style="display: flex; gap: 12px; margin-top: 20px;">
                    <button id="saveEventBtn" class="success">保存</button>
                    <button id="closeEventModalBtn">取消</button>
                </div>
            </div>
        </div>
    `;
    const existing = document.getElementById('addEventModal');
    if (existing) existing.remove();
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    document.getElementById('saveEventBtn').onclick = saveNewEvent;
    document.getElementById('closeEventModalBtn').onclick = () => document.getElementById('addEventModal').remove();
}

async function saveNewEvent() {
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
        image_url: document.getElementById('eventImageUrl').value.trim(),
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
}

function openEditEventModal(id) {
    const event = eventsList.find(e => e.id == id);
    if (!event) return;
    
    const modalHtml = `
        <div id="editEventModal" class="modal-overlay" style="visibility: visible; opacity: 1;">
            <div class="modal-card" style="width: 600px; max-width: 90%;">
                <h3><i class="fas fa-edit"></i> 编辑活动</h3>
                <div><label>标题 *</label><input type="text" id="editEventTitle" value="${escapeHtml(event.title)}" style="width:100%; margin:10px 0; padding:12px; background:#0f172a; border:1px solid #1e2a3a; border-radius:8px; color:#fff;"></div>
                <div><label>简短描述</label><input type="text" id="editEventShortDesc" value="${escapeHtml(event.short_description || '')}" style="width:100%; margin:10px 0; padding:12px; background:#0f172a; border:1px solid #1e2a3a; border-radius:8px; color:#fff;"></div>
                <div><label>详细描述</label><textarea id="editEventDesc" rows="3" style="width:100%; margin:10px 0; padding:12px; background:#0f172a; border:1px solid #1e2a3a; border-radius:8px; color:#fff;">${escapeHtml(event.description || '')}</textarea></div>
                <div><label>内容详情</label><textarea id="editEventContent" rows="5" style="width:100%; margin:10px 0; padding:12px; background:#0f172a; border:1px solid #1e2a3a; border-radius:8px; color:#fff;">${escapeHtml(event.content || '')}</textarea></div>
                <div><label>图片 URL</label><input type="text" id="editEventImageUrl" value="${escapeHtml(event.image_url || '')}" style="width:100%; margin:10px 0; padding:12px; background:#0f172a; border:1px solid #1e2a3a; border-radius:8px; color:#fff;"></div>
                <div style="display: flex; gap: 12px;"><div style="flex:1"><label>开始日期</label><input type="date" id="editEventDate" value="${event.event_date || ''}" style="width:100%; margin:10px 0; padding:12px; background:#0f172a; border:1px solid #1e2a3a; border-radius:8px; color:#fff;"></div><div style="flex:1"><label>结束日期</label><input type="date" id="editEventEndDate" value="${event.end_date || ''}" style="width:100%; margin:10px 0; padding:12px; background:#0f172a; border:1px solid #1e2a3a; border-radius:8px; color:#fff;"></div></div>
                <div><label>标签徽章</label><input type="text" id="editEventBadge" value="${escapeHtml(event.badge || 'Promotion')}" style="width:100%; margin:10px 0; padding:12px; background:#0f172a; border:1px solid #1e2a3a; border-radius:8px; color:#fff;"></div>
                <div><label>状态</label><select id="editEventStatus" style="width:100%; margin:10px 0; padding:12px; background:#0f172a; border:1px solid #1e2a3a; border-radius:8px; color:#fff;"><option value="active" ${event.status === 'active' ? 'selected' : ''}>显示</option><option value="inactive" ${event.status === 'inactive' ? 'selected' : ''}>隐藏</option></select></div>
                <div><label>排序</label><input type="number" id="editEventSortOrder" value="${event.sort_order || 0}" style="width:100%; margin:10px 0; padding:12px; background:#0f172a; border:1px solid #1e2a3a; border-radius:8px; color:#fff;"></div>
                <div style="display: flex; gap: 12px; margin-top: 20px;">
                    <button id="updateEventBtn" class="success">更新</button>
                    <button id="closeEditEventModalBtn">取消</button>
                </div>
            </div>
        </div>
    `;
    const existing = document.getElementById('editEventModal');
    if (existing) existing.remove();
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    
    document.getElementById('updateEventBtn').onclick = async () => {
        const updateData = {
            title: document.getElementById('editEventTitle').value.trim(),
            short_description: document.getElementById('editEventShortDesc').value.trim(),
            description: document.getElementById('editEventDesc').value.trim(),
            content: document.getElementById('editEventContent').value.trim(),
            image_url: document.getElementById('editEventImageUrl').value.trim(),
            event_date: document.getElementById('editEventDate').value || null,
            end_date: document.getElementById('editEventEndDate').value || null,
            badge: document.getElementById('editEventBadge').value.trim(),
            status: document.getElementById('editEventStatus').value,
            sort_order: parseInt(document.getElementById('editEventSortOrder').value) || 0,
            updated_at: new Date().toISOString()
        };
        
        if (!updateData.title) {
            showToast('请填写活动标题', 'error');
            return;
        }
        
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

window.loadContentPage = loadContentPage;