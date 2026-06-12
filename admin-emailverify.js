// admin-emailverify.js - 邮箱验证码管理页面

// 如果没有 showToast 函数，定义一个简单的
if (typeof showToast !== 'function') {
    window.showToast = function(message, type) {
        console.log('Toast:', type, message);
        alert(message);
    };
}

async function loadEmailVerifyPage() {
    const container = document.getElementById('page_emailverify');
    if (!container) return;
    
    container.innerHTML = `
        <div class="card">
            <div class="search-bar" style="justify-content: space-between;">
                <h3><i class="fas fa-envelope"></i> 邮箱验证码管理</h3>
                <button id="refreshEmailRequestsBtn" class="btn-primary"><i class="fas fa-sync-alt"></i> 刷新</button>
            </div>
            <div style="margin-bottom: 16px; padding: 12px; background: rgba(74,124,255,0.1); border-radius: 12px;">
                <i class="fas fa-info-circle" style="color: #4a7cff;"></i> 
                用户注册时输入邮箱后，会出现在下方列表中。管理员手动发送验证码到用户邮箱后，在此处输入6位数字验证码并点击"设置"，用户即可使用该验证码完成注册。
            </div>
            <div id="emailRequestsList"></div>
        </div>
    `;
    
    await loadEmailRequests();
    
    const refreshBtn = document.getElementById('refreshEmailRequestsBtn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', () => {
            loadEmailRequests();
        });
    }
}

async function loadEmailRequests() {
    const container = document.getElementById('emailRequestsList');
    if (!container) return;
    
    container.innerHTML = '<div style="text-align:center; padding:40px;">加载中... <i class="fas fa-spinner fa-spin"></i></div>';
    
    try {
        const { data: requests, error } = await sb
            .from('email_verification_requests')
            .select('*')
            .eq('is_verified', false)
            .order('requested_at', { ascending: false });
        
        console.log('查询结果:', requests);
        
        if (error) {
            console.error('查询错误:', error);
            container.innerHTML = '<div style="text-align:center; padding:40px; color:#ff8888;">查询失败: ' + error.message + '</div>';
            return;
        }
        
        if (!requests || requests.length === 0) {
            container.innerHTML = '<div style="text-align:center; padding:40px; color:#aaa;">暂无邮箱验证请求。<br>请让用户在注册页面点击"Send"按钮提交邮箱。</div>';
            return;
        }
        
        console.log('找到 ' + requests.length + ' 条待验证记录');
        container.innerHTML = '';
        
        for (let req of requests) {
            const requestDiv = document.createElement('div');
            requestDiv.style.cssText = 'background:#0f172a; border-radius:16px; padding:15px; margin-bottom:12px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px; border:1px solid rgba(74,124,255,0.2);';
            
            const requestTime = new Date(req.requested_at).toLocaleString();
            const expiresTime = new Date(req.expires_at).toLocaleString();
            const hasCode = req.code && req.code !== null && req.code !== '';
            
            requestDiv.innerHTML = `
                <div style="flex:2;">
                    <div style="font-size:14px; font-weight:600; color:#ffb84d;">
                        <i class="fas fa-envelope"></i> ${escapeHtml(req.email)}
                    </div>
                    <div style="font-size:11px; color:#8a9abb; margin-top:4px;">
                        请求时间: ${requestTime} | 过期时间: ${expiresTime}
                    </div>
                    ${hasCode ? `<div style="font-size:11px; color:#2ed15a; margin-top:2px;">✅ 已设置验证码: ${req.code}</div>` : '<div style="font-size:11px; color:#ffb84d; margin-top:2px;">⏳ 等待设置验证码</div>'}
                </div>
                <div style="display: flex; gap: 10px; align-items: center;">
                    <input type="text" id="code_${req.id}" placeholder="6位数字" maxlength="6" value="${req.code || ''}" 
                        style="width:130px; background:#1e2a3a; border:1px solid #4a7cff; border-radius:8px; padding:10px 12px; color:#fff; text-align:center; font-size:16px; letter-spacing:2px;">
                    <button class="set-code-btn" data-id="${req.id}" data-email="${req.email}" 
                        style="background:#2f6b3a; border:none; padding:10px 24px; border-radius:8px; color:#fff; cursor:pointer; font-weight:600;">
                        设置验证码
                    </button>
                </div>
                <div>
                    <span style="padding:4px 12px; border-radius:20px; font-size:11px; background:rgba(255,184,77,0.15); color:#ffb84d;">
                        ${hasCode ? '⏳ 待验证' : '📧 待设置'}
                    </span>
                </div>
            `;
            
            container.appendChild(requestDiv);
        }
        
        document.querySelectorAll('.set-code-btn').forEach(btn => {
            btn.addEventListener('click', async () => {
                const id = btn.dataset.id;
                const email = btn.dataset.email;
                const codeInput = document.getElementById(`code_${id}`);
                const code = codeInput.value.trim();
                
                if (!code) {
                    alert('请输入6位数字验证码');
                    return;
                }
                
                if (!/^\d{6}$/.test(code)) {
                    alert('验证码必须是6位数字');
                    return;
                }
                
                const { error: updateError } = await sb
                    .from('email_verification_requests')
                    .update({ 
                        code: code,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', parseInt(id));
                
                if (updateError) {
                    console.error('更新失败:', updateError);
                    alert('设置失败: ' + updateError.message);
                    return;
                }
                
                alert(`✅ 已为 ${email} 设置验证码: ${code}`);
                
                await loadEmailRequests();
            });
        });
        
    } catch (e) {
        console.error('加载邮箱请求失败:', e);
        container.innerHTML = '<div style="text-align:center; padding:40px; color:#ff8888;">加载失败: ' + e.message + '</div>';
    }
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

window.loadEmailVerifyPage = loadEmailVerifyPage;