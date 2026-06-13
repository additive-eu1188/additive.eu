// admin-content.js - 内容管理页面（包含活动管理、法律页面、系统内容）
let systemContents = [];
let legalPages = [];
let eventsList = [];
let currentContentTab = 'events';
let uploadingImage = false;
let currentImageUrl = '';

async function loadContentPage() {
    const container = document.getElementById('page_content');
    if (!container) return;
    
    container.innerHTML = `
        <div class="card">
            <div class="search-bar" style="justify-content: space-between;">
                <h3><i class="fas fa-file-contract"></i> 内容管理</h3>
                <div style="display: flex; gap: 12px; flex-wrap: wrap;">
                    <button id="tabEventsBtn" class="tab-content-btn active" data-tab="events"><i class="fas fa-calendar-alt"></i> 活动管理</button>
                    <button id="tabLegalBtn" class="tab-content-btn" data-tab="legal"><i class="fas fa-gavel"></i> 法律页面</button>
                    <button id="tabContentsBtn" class="tab-content-btn" data-tab="contents"><i class="fas fa-file-alt"></i> 系统内容</button>
                </div>
            </div>
            <div id="eventsPanel" class="content-panel"></div>
            <div id="legalPanel" class="content-panel" style="display: none;"></div>
            <div id="contentsPanel" class="content-panel" style="display: none;"></div>
        </div>
    `;
    
    const style = document.createElement('style');
    style.textContent = `
        .tab-content-btn { background: rgba(74,124,255,0.1); border: 1px solid rgba(74,124,255,0.2); border-radius: 30px; padding: 6px 16px; color: #8a9abb; cursor: pointer; transition: all 0.2s; }
        .tab-content-btn.active { background: #4a7cff; color: #fff; border-color: #4a7cff; }
        .legal-card { background: #0f172a; border-radius: 16px; padding: 20px; margin-bottom: 20px; border: 1px solid rgba(74,124,255,0.15); }
        .legal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; padding-bottom: 10px; border-bottom: 1px solid rgba(74,124,255,0.1); }
        .legal-title { font-size: 18px; font-weight: 600; color: #4a7cff; }
        .legal-content-preview { background: rgba(0,0,0,0.3); border-radius: 12px; padding: 15px; max-height: 200px; overflow-y: auto; font-size: 13px; color: #c0c8e0; margin-bottom: 15px; white-space: pre-wrap; }
        .content-item { background: #0f172a; border-radius: 16px; padding: 15px; margin-bottom: 12px; }
        .event-item { background: #0f172a; border-radius: 16px; padding: 15px; margin-bottom: 12px; display: flex; gap: 15px; flex-wrap: wrap; align-items: center; }
        .event-image-preview { width: 80px; height: 60px; object-fit: cover; border-radius: 8px; cursor: pointer; border: 1px solid rgba(74,124,255,0.3); }
        .upload-area { background: rgba(74,124,255,0.1); border: 2px dashed rgba(74,124,255,0.3); border-radius: 12px; padding: 20px; text-align: center; cursor: pointer; transition: 0.2s; margin: 10px 0; }
        .upload-area:hover { background: rgba(74,124,255,0.15); border-color: #4a7cff; }
        .image-preview { max-width: 200px; max-height: 150px; border-radius: 8px; margin-top: 10px; }
    `;
    document.head.appendChild(style);
    
    // 加载所有数据
    await loadEventsList();
    await loadLegalPages();
    await loadContentList();
    
    // 绑定标签切换
    document.getElementById('tabEventsBtn').addEventListener('click', () => switchContentTab('events'));
    document.getElementById('tabLegalBtn').addEventListener('click', () => switchContentTab('legal'));
    document.getElementById('tabContentsBtn').addEventListener('click', () => switchContentTab('contents'));
}

function switchContentTab(tab) {
    currentContentTab = tab;
    document.getElementById('tabEventsBtn').classList.toggle('active', tab === 'events');
    document.getElementById('tabLegalBtn').classList.toggle('active', tab === 'legal');
    document.getElementById('tabContentsBtn').classList.toggle('active', tab === 'contents');
    document.getElementById('eventsPanel').style.display = tab === 'events' ? 'block' : 'none';
    document.getElementById('legalPanel').style.display = tab === 'legal' ? 'block' : 'none';
    document.getElementById('contentsPanel').style.display = tab === 'contents' ? 'block' : 'none';
    
    if (tab === 'events') {
        renderEventsList();
    } else if (tab === 'legal') {
        renderLegalPages();
    } else if (tab === 'contents') {
        renderContentList();
    }
}

// ========== 1. 活动管理（原有功能） ==========
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
                <button class="edit-event-detail" data-id="${event.id}" style="background:#2f6b3a; padding:6px 12px; border-radius:8px;"><i class="fas fa-edit"></i> 编辑</button>
                <button class="delete-event-btn" data-id="${event.id}" style="background:#7a2f2f; padding:6px 12px; border-radius:8px;"><i class="fas fa-trash"></i> 删除</button>
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
                <div><label>标题 *</label><input type="text" id="eventTitle" placeholder="活动标题" style="width:100%; margin:10px 0; padding:12px; background:#0f172a; border:1px solid #1e2a3a; border-radius:8px; color:#fff;"></div>
                <div><label>活动图片</label><div id="eventImageUploader"></div></div>
                <div><label>简短描述</label><input type="text" id="eventShortDesc" placeholder="简短描述" style="width:100%; margin:10px 0; padding:12px; background:#0f172a; border:1px solid #1e2a3a; border-radius:8px; color:#fff;"></div>
                <div><label>详细描述</label><textarea id="eventDesc" rows="3" placeholder="详细描述" style="width:100%; margin:10px 0; padding:12px; background:#0f172a; border:1px solid #1e2a3a; border-radius:8px; color:#fff;"></textarea></div>
                <div><label>内容详情</label><textarea id="eventContent" rows="5" placeholder="完整内容" style="width:100%; margin:10px 0; padding:12px; background:#0f172a; border:1px solid #1e2a3a; border-radius:8px; color:#fff;"></textarea></div>
                <div style="display: flex; gap: 12px;">
                    <div style="flex:1"><label>开始日期</label><input type="date" id="eventDate" style="width:100%; margin:10px 0; padding:12px; background:#0f172a; border:1px solid #1e2a3a; border-radius:8px; color:#fff;"></div>
                    <div style="flex:1"><label>结束日期</label><input type="date" id="eventEndDate" style="width:100%; margin:10px 0; padding:12px; background:#0f172a; border:1px solid #1e2a3a; border-radius:8px; color:#fff;"></div>
                </div>
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
                <div><label>标题 *</label><input type="text" id="editEventTitle" value="${escapeHtml(event.title)}" style="width:100%; margin:10px 0; padding:12px; background:#0f172a; border:1px solid #1e2a3a; border-radius:8px; color:#fff;"></div>
                <div><label>活动图片</label><div id="editEventImageUploader"></div></div>
                <div><label>简短描述</label><input type="text" id="editEventShortDesc" value="${escapeHtml(event.short_description || '')}" style="width:100%; margin:10px 0; padding:12px; background:#0f172a; border:1px solid #1e2a3a; border-radius:8px; color:#fff;"></div>
                <div><label>详细描述</label><textarea id="editEventDesc" rows="3" style="width:100%; margin:10px 0; padding:12px; background:#0f172a; border:1px solid #1e2a3a; border-radius:8px; color:#fff;">${escapeHtml(event.description || '')}</textarea></div>
                <div><label>内容详情</label><textarea id="editEventContent" rows="5" style="width:100%; margin:10px 0; padding:12px; background:#0f172a; border:1px solid #1e2a3a; border-radius:8px; color:#fff;">${escapeHtml(event.content || '')}</textarea></div>
                <div style="display: flex; gap: 12px;">
                    <div style="flex:1"><label>开始日期</label><input type="date" id="editEventDate" value="${event.event_date || ''}" style="width:100%; margin:10px 0; padding:12px; background:#0f172a; border:1px solid #1e2a3a; border-radius:8px; color:#fff;"></div>
                    <div style="flex:1"><label>结束日期</label><input type="date" id="editEventEndDate" value="${event.end_date || ''}" style="width:100%; margin:10px 0; padding:12px; background:#0f172a; border:1px solid #1e2a3a; border-radius:8px; color:#fff;"></div>
                </div>
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

// 图片上传函数
async function uploadImage(file, type = 'event') {
    return new Promise(async (resolve, reject) => {
        if (!file) {
            reject('No file selected');
            return;
        }
        
        if (!file.type.startsWith('image/')) {
            showToast('请选择图片文件', 'error');
            reject('Invalid file type');
            return;
        }
        
        if (file.size > 5 * 1024 * 1024) {
            showToast('图片大小不能超过 5MB', 'error');
            reject('File too large');
            return;
        }
        
        const fileName = `${type}/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
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
            showToast('图片上传成功！', 'success');
            resolve(publicUrl);
        } catch (error) {
            console.error('上传失败:', error);
            showToast('上传失败: ' + error.message, 'error');
            reject(error.message);
        }
    });
}

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
            <div id="uploadProgress_${containerId}" class="upload-progress" style="display:none;">
                <div id="uploadProgressBar_${containerId}" class="upload-progress-bar"></div>
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
            const progressBar = document.getElementById(`uploadProgressBar_${containerId}`);
            const progressContainer = document.getElementById(`uploadProgress_${containerId}`);
            const previewContainer = document.getElementById(`previewContainer_${containerId}`);
            
            progressContainer.style.display = 'block';
            progressBar.style.width = '30%';
            
            try {
                const imageUrl = await uploadImage(file, 'events');
                progressBar.style.width = '100%';
                previewContainer.innerHTML = `<img src="${imageUrl}" class="image-preview" onclick="window.open('${imageUrl}','_blank')">`;
                setTimeout(() => {
                    progressContainer.style.display = 'none';
                    progressBar.style.width = '0%';
                }, 500);
                if (onUploadComplete) onUploadComplete(imageUrl);
            } catch (error) {
                progressContainer.style.display = 'none';
            }
        }
    });
}

// ========== 2. 法律页面管理 ==========
async function loadLegalPages() {
    const pageTitles = ['T&C', 'Privacy & Security', 'Platform Rules'];
    
    legalPages = [];
    
    for (const title of pageTitles) {
        let { data, error } = await sb
            .from('system_content')
            .select('*')
            .eq('title', title)
            .single();
        
        if (error || !data) {
            const defaultContent = getDefaultContent(title);
            const { data: newData, error: insertError } = await sb
                .from('system_content')
                .insert([{ title: title, content: defaultContent, type: 'legal' }])
                .select()
                .single();
            
            if (!insertError && newData) {
                data = newData;
            }
        }
        
        if (data) {
            legalPages.push(data);
        }
    }
    
    renderLegalPages();
}

function getDefaultContent(title) {
    if (title === 'T&C') {
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
    } else if (title === 'Privacy & Security') {
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
    } else if (title === 'Platform Rules') {
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

function renderLegalPages() {
    const container = document.getElementById('legalPanel');
    if (!container) return;
    
    if (legalPages.length === 0) {
        container.innerHTML = '<div style="text-align:center; padding:40px; color:#aaa;">加载中...</div>';
        return;
    }
    
    container.innerHTML = '';
    
    legalPages.forEach(page => {
        const card = document.createElement('div');
        card.className = 'legal-card';
        
        card.innerHTML = `
            <div class="legal-header">
                <div class="legal-title"><i class="fas fa-file-contract"></i> ${page.title}</div>
                <button class="edit-legal-btn" data-id="${page.id}" data-title="${page.title}" style="background:#2f6b3a; border:none; padding:6px 16px; border-radius:8px; color:#fff; cursor:pointer;"><i class="fas fa-edit"></i> 编辑内容</button>
            </div>
            <div class="legal-content-preview" id="preview_${page.id}">
                ${page.content ? page.content.substring(0, 300) + (page.content.length > 300 ? '...' : '') : '<em>暂无内容</em>'}
            </div>
            <div style="font-size: 11px; color: #6a7a9a;">
                <i class="fas fa-clock"></i> 最后更新: ${new Date(page.updated_at || page.created_at).toLocaleString()}
            </div>
        `;
        container.appendChild(card);
    });
    
    document.querySelectorAll('.edit-legal-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = parseInt(btn.dataset.id);
            const page = legalPages.find(p => p.id === id);
            if (page) {
                openEditLegalModal(page);
            }
        });
    });
}

function openEditLegalModal(page) {
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
                    <button id="saveLegalBtn" class="success">保存</button>
                    <button id="previewLegalBtn" class="btn-primary">刷新预览</button>
                    <button id="closeLegalModalBtn">取消</button>
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
        await loadLegalPages();
    };
    
    document.getElementById('closeLegalModalBtn').onclick = () => {
        document.getElementById('editLegalModal').remove();
    };
}

// ========== 3. 系统内容管理（原有功能） ==========
async function loadContentList() {
    const { data: contents } = await sb.from('system_content').select('*').eq('type', 'page').order('id');
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
    await sb.from('system_content').update({ title: title, content: content, updated_at: new Date().toISOString() }).eq('id', id);
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
            <div class="modal-card" style="width: 600px; max-width: 90%;">
                <h3><i class="fas fa-plus"></i> 添加内容</h3>
                <div><label>标题</label><input type="text" id="contentTitle" placeholder="标题" style="width:100%; margin:10px 0; padding:12px; background:#0f172a; border:1px solid #1e2a3a; border-radius:8px; color:#fff;"></div>
                <div><label>内容</label><textarea id="contentBody" rows="8" placeholder="内容" style="width:100%; margin:10px 0; padding:12px; background:#0f172a; border:1px solid #1e2a3a; border-radius:8px; color:#fff;"></textarea></div>
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
    await sb.from('system_content').insert([{ title: title, content: content, type: 'page' }]);
    showToast('添加成功', 'success');
    document.getElementById('addContentModal').remove();
    loadContentList();
}

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

window.loadContentPage = loadContentPage;