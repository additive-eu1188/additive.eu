// admin-content.js - 内容管理页面（使用自定义弹窗）
let systemContents = [];

async function loadContentPage() {
    const container = document.getElementById('page_content');
    if (!container) return;
    container.innerHTML = `
        <div class="card">
            <div class="search-bar" style="justify-content: space-between;">
                <h3><i class="fas fa-file-contract"></i> 法律内容管理</h3>
                <button id="addContentBtn" class="success"><i class="fas fa-plus"></i> 添加内容</button>
            </div>
            <div id="contentListContainer"></div>
        </div>
    `;
    await loadContentList();
    document.getElementById('addContentBtn')?.addEventListener('click', openAddContentModal);
}

async function loadContentList() {
    const { data: contents } = await sb.from('system_content').select('*').order('id');
    systemContents = contents || [];
    renderContentList();
}

function renderContentList() {
    const container = document.getElementById('contentListContainer');
    if (!container) return;
    if (systemContents.length === 0) {
        container.innerHTML = '<div style="text-align:center; padding:40px; color:#aaa;">暂无内容，点击"添加内容"开始</div>';
        return;
    }
    container.innerHTML = '';
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
        container.appendChild(div);
    });
    document.querySelectorAll('.save-content-btn').forEach(btn => btn.addEventListener('click', () => saveContentItem(btn.dataset.id)));
    document.querySelectorAll('.delete-content-btn').forEach(btn => btn.addEventListener('click', () => deleteContentItem(btn.dataset.id)));
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

window.loadContentPage = loadContentPage;