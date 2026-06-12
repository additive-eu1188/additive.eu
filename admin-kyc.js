// admin-kyc.js - 完整版（使用自定义弹窗）
let activeTab = 'pending';

async function loadKycPage() {
    const container = document.getElementById('page_kyc');
    if (!container) return;
    container.innerHTML = `
        <div class="card">
            <div class="search-bar" style="justify-content: space-between; flex-wrap: wrap;">
                <h3 style="margin:0;"><i class="fas fa-id-card"></i> KYC Verification</h3>
                <div style="display: flex; gap: 12px;">
                    <button id="tabPending" class="tab-kyc-btn active" data-tab="pending">📋 待审核</button>
                    <button id="tabVerified" class="tab-kyc-btn" data-tab="verified">✅ 已验证记录</button>
                    <button id="refreshKycBtn" class="btn-primary"><i class="fas fa-sync-alt"></i> 刷新</button>
                </div>
            </div>
            <div id="kycPendingContainer" class="kyc-container"></div>
            <div id="kycVerifiedContainer" class="kyc-container" style="display: none;"></div>
        </div>
    `;
    
    const style = document.createElement('style');
    style.textContent = `
        .tab-kyc-btn { background: rgba(74,124,255,0.1); border: 1px solid rgba(74,124,255,0.2); border-radius: 30px; padding: 6px 16px; color: #8a9abb; cursor: pointer; transition: all 0.2s; }
        .tab-kyc-btn.active { background: #4a7cff; color: #fff; border-color: #4a7cff; }
        .kyc-card { background: rgba(15, 25, 40, 0.7); border-radius: 20px; padding: 20px; margin-bottom: 20px; border: 1px solid rgba(74,124,255,0.15); }
        .kyc-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; padding-bottom: 12px; border-bottom: 1px solid rgba(74,124,255,0.1); }
        .kyc-user { font-size: 16px; font-weight: 600; color: #4a7cff; }
        .kyc-uid { font-size: 12px; color: #8a9abb; margin-left: 12px; }
        .kyc-images { display: flex; gap: 20px; flex-wrap: wrap; margin-bottom: 16px; }
        .kyc-image-box { flex: 1; min-width: 150px; text-align: center; }
        .kyc-image-box img { width: 100%; max-width: 200px; height: auto; border-radius: 12px; border: 1px solid rgba(74,124,255,0.2); cursor: pointer; }
        .kyc-image-label { font-size: 11px; color: #8a9abb; margin-top: 8px; }
        .kyc-time { font-size: 11px; color: #6a7a9a; margin-top: 8px; }
        .kyc-status { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: 600; }
        .status-pending { background: rgba(255,184,77,0.15); color: #ffb84d; }
        .status-approved { background: rgba(46,209,90,0.15); color: #2ed15a; }
        .status-rejected { background: rgba(255,90,90,0.15); color: #ff5a5a; }
        .btn-sm { padding: 6px 14px; font-size: 12px; margin-right: 8px; }
    `;
    document.head.appendChild(style);
    
    document.getElementById('tabPending')?.addEventListener('click', () => switchTab('pending'));
    document.getElementById('tabVerified')?.addEventListener('click', () => switchTab('verified'));
    document.getElementById('refreshKycBtn')?.addEventListener('click', () => { loadKycPending(); loadKycVerified(); });
    
    await loadKycPending();
    await loadKycVerified();
}

function switchTab(tab) {
    activeTab = tab;
    document.getElementById('tabPending').classList.toggle('active', tab === 'pending');
    document.getElementById('tabVerified').classList.toggle('active', tab === 'verified');
    document.getElementById('kycPendingContainer').style.display = tab === 'pending' ? 'block' : 'none';
    document.getElementById('kycVerifiedContainer').style.display = tab === 'verified' ? 'block' : 'none';
}

async function getUsername(uid) {
    try {
        const { data } = await sb.from('users').select('username').eq('uid', uid).single();
        return data?.username || uid;
    } catch (e) {
        return uid;
    }
}

async function loadKycPending() {
    const container = document.getElementById('kycPendingContainer');
    if (!container) return;
    container.innerHTML = '<div style="text-align:center; padding:40px;">加载中... <i class="fas fa-spinner fa-spin"></i></div>';
    
    const { data: kycList } = await sb.from('kyc_verifications').select('*').in('status', ['pending', 'rejected']).order('uploaded_at', { ascending: false });
    
    if (!kycList || kycList.length === 0) {
        container.innerHTML = '<div style="text-align:center; padding:40px; color:#6a7a9a;">暂无待审核KYC申请</div>';
        return;
    }
    
    const userMap = {};
    for (const item of kycList) {
        if (!userMap[item.uid]) {
            userMap[item.uid] = await getUsername(item.uid);
        }
    }
    
    const userGroups = {};
    for (const item of kycList) {
        if (!userGroups[item.uid]) userGroups[item.uid] = [];
        userGroups[item.uid].push(item);
    }
    
    container.innerHTML = '';
    for (const [uid, items] of Object.entries(userGroups)) {
        const username = userMap[uid] || uid;
        const nationalIdFront = items.find(i => i.document_type === 'national_id_front');
        const nationalIdBack = items.find(i => i.document_type === 'national_id_back');
        const otherDocs = items.filter(i => i.document_type !== 'national_id_front' && i.document_type !== 'national_id_back');
        
        const card = document.createElement('div');
        card.className = 'kyc-card';
        
        let imagesHtml = '';
        if (nationalIdFront || nationalIdBack) {
            imagesHtml += `<div class="kyc-images">`;
            if (nationalIdFront) {
                imagesHtml += `<div class="kyc-image-box"><img src="${nationalIdFront.image_url}" onclick="window.open('${nationalIdFront.image_url}','_blank')"><div class="kyc-image-label">身份证正面</div></div>`;
            }
            if (nationalIdBack) {
                imagesHtml += `<div class="kyc-image-box"><img src="${nationalIdBack.image_url}" onclick="window.open('${nationalIdBack.image_url}','_blank')"><div class="kyc-image-label">身份证背面</div></div>`;
            }
            imagesHtml += `</div>`;
        }
        
        for (const doc of otherDocs) {
            let docName = doc.document_type === 'passport' ? '护照' : doc.document_type === 'resident_permit' ? '居留证' : doc.document_type;
            imagesHtml += `<div class="kyc-images"><div class="kyc-image-box"><img src="${doc.image_url}" onclick="window.open('${doc.image_url}','_blank')"><div class="kyc-image-label">${docName}</div></div></div>`;
        }
        
        const hasPending = items.some(i => i.status === 'pending');
        const statusHtml = hasPending ? '<span class="kyc-status status-pending">⏳ 待审核</span>' : '<span class="kyc-status status-rejected">❌ 已拒绝</span>';
        
        card.innerHTML = `
            <div class="kyc-header">
                <div><span class="kyc-user">${escapeHtml(username)}</span><span class="kyc-uid">UID: ${uid}</span></div>
                <div>${statusHtml}</div>
            </div>
            ${imagesHtml}
            <div class="kyc-time">提交时间: ${new Date(items[0].uploaded_at).toLocaleString()}</div>
            <div style="margin-top: 16px;">
                <button class="btn-sm success approve-kyc" data-uid="${uid}" style="background:#2f6b3a; border:none; padding:6px 16px; border-radius:20px; color:#fff; cursor:pointer;">✓ 批准</button>
                <button class="btn-sm danger reject-kyc" data-uid="${uid}" style="background:#7a2f2f; border:none; padding:6px 16px; border-radius:20px; color:#fff; cursor:pointer;">✗ 拒绝</button>
            </div>
        `;
        container.appendChild(card);
    }
    
    document.querySelectorAll('.approve-kyc').forEach(btn => btn.addEventListener('click', async () => {
        const uid = btn.dataset.uid;
        await sb.from('kyc_verifications').update({ status: 'approved' }).eq('uid', uid);
        await sb.from('user_kyc_status').upsert({ uid: uid, is_verified: true });
        loadKycPending();
        loadKycVerified();
        if (window.loadDashboardPage) window.loadDashboardPage(currentDays);
        showToast(`用户 ${uid} 的KYC已批准`, 'success');
    }));
    
    document.querySelectorAll('.reject-kyc').forEach(btn => btn.addEventListener('click', async () => {
        const uid = btn.dataset.uid;
        await sb.from('kyc_verifications').update({ status: 'rejected' }).eq('uid', uid);
        loadKycPending();
        showToast(`已拒绝用户 ${uid} 的KYC申请`, 'info');
    }));
}

async function loadKycVerified() {
    const container = document.getElementById('kycVerifiedContainer');
    if (!container) return;
    container.innerHTML = '<div style="text-align:center; padding:40px;">加载中... <i class="fas fa-spinner fa-spin"></i></div>';
    
    const { data: kycList } = await sb.from('kyc_verifications').select('*').eq('status', 'approved').order('uploaded_at', { ascending: false });
    
    if (!kycList || kycList.length === 0) {
        container.innerHTML = '<div style="text-align:center; padding:40px; color:#6a7a9a;">暂无已验证的KYC记录</div>';
        return;
    }
    
    const userMap = {};
    for (const item of kycList) {
        if (!userMap[item.uid]) {
            userMap[item.uid] = await getUsername(item.uid);
        }
    }
    
    const userGroups = {};
    for (const item of kycList) {
        if (!userGroups[item.uid]) userGroups[item.uid] = [];
        userGroups[item.uid].push(item);
    }
    
    container.innerHTML = '';
    for (const [uid, items] of Object.entries(userGroups)) {
        const username = userMap[uid] || uid;
        const nationalIdFront = items.find(i => i.document_type === 'national_id_front');
        const nationalIdBack = items.find(i => i.document_type === 'national_id_back');
        const otherDocs = items.filter(i => i.document_type !== 'national_id_front' && i.document_type !== 'national_id_back');
        
        const card = document.createElement('div');
        card.className = 'kyc-card';
        
        let imagesHtml = '';
        if (nationalIdFront || nationalIdBack) {
            imagesHtml += `<div class="kyc-images">`;
            if (nationalIdFront) {
                imagesHtml += `<div class="kyc-image-box"><img src="${nationalIdFront.image_url}" onclick="window.open('${nationalIdFront.image_url}','_blank')"><div class="kyc-image-label">身份证正面</div></div>`;
            }
            if (nationalIdBack) {
                imagesHtml += `<div class="kyc-image-box"><img src="${nationalIdBack.image_url}" onclick="window.open('${nationalIdBack.image_url}','_blank')"><div class="kyc-image-label">身份证背面</div></div>`;
            }
            imagesHtml += `</div>`;
        }
        
        for (const doc of otherDocs) {
            let docName = doc.document_type === 'passport' ? '护照' : doc.document_type === 'resident_permit' ? '居留证' : doc.document_type;
            imagesHtml += `<div class="kyc-images"><div class="kyc-image-box"><img src="${doc.image_url}" onclick="window.open('${doc.image_url}','_blank')"><div class="kyc-image-label">${docName}</div></div></div>`;
        }
        
        card.innerHTML = `
            <div class="kyc-header">
                <div><span class="kyc-user">${escapeHtml(username)}</span><span class="kyc-uid">UID: ${uid}</span></div>
                <div><span class="kyc-status status-approved">✅ 已验证</span></div>
            </div>
            ${imagesHtml}
            <div class="kyc-time">验证时间: ${new Date(items[0].approved_at || items[0].uploaded_at).toLocaleString()}</div>
            <div style="margin-top: 16px;">
                <button class="btn-sm delete-kyc" data-uid="${uid}" style="background:#7a2f2f; border:none; padding:6px 16px; border-radius:20px; color:#fff; cursor:pointer;"><i class="fas fa-trash"></i> 删除记录</button>
            </div>
        `;
        container.appendChild(card);
    }
    
    document.querySelectorAll('.delete-kyc').forEach(btn => btn.addEventListener('click', async () => {
        const uid = btn.dataset.uid;
        showConfirm('确认删除', `确定删除用户 ${uid} 的所有KYC记录吗？此操作不可恢复。`, async () => {
            await sb.from('kyc_verifications').delete().eq('uid', uid);
            await sb.from('user_kyc_status').upsert({ uid: uid, is_verified: false });
            loadKycVerified();
            loadKycPending();
            if (window.loadDashboardPage) window.loadDashboardPage(currentDays);
            showToast(`已删除用户 ${uid} 的KYC记录`, 'success');
        });
    }));
}

window.loadKycPage = loadKycPage;