// admin-content.js - 内容管理页面（包含法律页面和系统内容管理）
let systemContents = [];
let legalPages = [];
let currentContentTab = 'legal';

async function loadContentPage() {
    const container = document.getElementById('page_content');
    if (!container) return;
    
    container.innerHTML = `
        <div class="card">
            <div class="search-bar" style="justify-content: space-between;">
                <h3><i class="fas fa-file-contract"></i> 内容管理</h3>
                <div style="display: flex; gap: 12px;">
                    <button id="tabLegalBtn" class="tab-content-btn active" data-tab="legal"><i class="fas fa-gavel"></i> 法律页面</button>
                    <button id="tabContentsBtn" class="tab-content-btn" data-tab="contents"><i class="fas fa-file-alt"></i> 系统内容</button>
                </div>
            </div>
            <div id="legalPanel" class="content-panel"></div>
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
    `;
    document.head.appendChild(style);
    
    await loadLegalPages();
    await loadContentList();
    
    document.getElementById('tabLegalBtn').addEventListener('click', () => switchContentTab('legal'));
    document.getElementById('tabContentsBtn').addEventListener('click', () => switchContentTab('contents'));
}

function switchContentTab(tab) {
    currentContentTab = tab;
    document.getElementById('tabLegalBtn').classList.toggle('active', tab === 'legal');
    document.getElementById('tabContentsBtn').classList.toggle('active', tab === 'contents');
    document.getElementById('legalPanel').style.display = tab === 'legal' ? 'block' : 'none';
    document.getElementById('contentsPanel').style.display = tab === 'contents' ? 'block' : 'none';
    
    if (tab === 'legal') {
        renderLegalPages();
    } else if (tab === 'contents') {
        renderContentList();
    }
}

// ========== 法律页面管理（T&C, Privacy & Security, Platform Rules） ==========
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
        
        let displayTitle = page.title;
        if (displayTitle === 'Privacy & Security') displayTitle = 'Privacy & Security';
        
        card.innerHTML = `
            <div class="legal-header">
                <div class="legal-title"><i class="fas fa-file-contract"></i> ${displayTitle}</div>
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

// ========== 系统内容管理 ==========
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