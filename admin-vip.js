// admin-vip.js - VIP配置页面（增加 Trial Bonus 配置）
async function loadVipPage() {
    const container = document.getElementById('page_vip');
    if (!container) return;
    container.innerHTML = `
        <div class="card">
            <h3><i class="fas fa-crown text-gold"></i> VIP 等级配置</h3>
            <div id="vipSettingsDiv"></div>
        </div>
    `;
    await loadVipSettings();
}

async function loadVipSettings() {
    const { data: vips, error } = await sb.from('vip_settings').select('*').order('level');
    const div = document.getElementById('vipSettingsDiv');
    if (div) {
        div.innerHTML = '';
        for (let v of vips || []) {
            const trialLimit = v.trial_orders_limit !== undefined && v.trial_orders_limit !== null ? v.trial_orders_limit : 30;
            const trialRate = v.trial_commission_rate !== undefined && v.trial_commission_rate !== null ? v.trial_commission_rate : 0.35;
            
            div.innerHTML += `
            <div style="background:#0f172a; border-radius:20px; padding:20px; margin-bottom:20px; border:1px solid rgba(74,124,255,0.15);">
                <h3 style="color:#4a7cff; margin-bottom:16px;">
                    ${v.rank_name} 
                    <span class="badge" style="background:rgba(74,124,255,0.2);padding:2px 12px;border-radius:12px;font-size:11px;">Lv.${v.level}</span>
                </h3>
                
                <!-- VIP 配置区域 -->
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px;padding-bottom:16px;border-bottom:1px solid rgba(74,124,255,0.1);">
                    <div>
                        <label style="font-size:11px;color:#8a9abb;">每日订单上限</label>
                        <input type="number" id="limit_${v.level}" value="${v.orders_limit}" style="width:100%;background:#0f172a;border:1px solid #1e2a3a;border-radius:8px;padding:6px 10px;color:#fff;">
                    </div>
                    <div>
                        <label style="font-size:11px;color:#8a9abb;">VIP 佣金率 (%)</label>
                        <input type="number" id="rate_${v.level}" value="${v.commission_rate}" step="0.01" style="width:100%;background:#0f172a;border:1px solid #1e2a3a;border-radius:8px;padding:6px 10px;color:#fff;">
                    </div>
                    <div>
                        <label style="font-size:11px;color:#8a9abb;">需充值金额 (€)</label>
                        <input type="number" id="deposit_${v.level}" value="${v.required_deposit || 0}" step="0.01" style="width:100%;background:#0f172a;border:1px solid #1e2a3a;border-radius:8px;padding:6px 10px;color:#fff;">
                    </div>
                </div>
                
                <!-- Trial Bonus 配置区域（金色边框，不显示在前端） -->
                <div style="background:rgba(255,184,77,0.05);border:1px solid rgba(255,184,77,0.3);border-radius:12px;padding:16px;margin-bottom:12px;">
                    <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;">
                        <i class="fas fa-gift" style="color:#ffb84d;"></i>
                        <span style="font-size:14px;font-weight:600;color:#ffb84d;">🎯 Trial Bonus 配置</span>
                        <span style="font-size:10px;color:#6a7a9a;background:rgba(0,0,0,0.3);padding:2px 10px;border-radius:10px;">仅后台可见</span>
                    </div>
                    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
                        <div>
                            <label style="font-size:11px;color:#8a9abb;">体验金订单上限</label>
                            <input type="number" id="trial_limit_${v.level}" value="${trialLimit}" style="width:100%;background:#0f172a;border:1px solid #ffb84d;border-radius:8px;padding:6px 10px;color:#ffb84d;">
                            <div style="font-size:9px;color:#6a7a9a;margin-top:2px;">完成此数量订单后触发结算</div>
                        </div>
                        <div>
                            <label style="font-size:11px;color:#8a9abb;">体验金佣金率 (%)</label>
                            <input type="number" id="trial_rate_${v.level}" value="${trialRate}" step="0.01" min="0" max="100" style="width:100%;background:#0f172a;border:1px solid #ffb84d;border-radius:8px;padding:6px 10px;color:#ffb84d;">
                            <div style="font-size:9px;color:#6a7a9a;margin-top:2px;">体验金 × 佣金率 = 每单佣金</div>
                        </div>
                    </div>
                    <div style="font-size:10px;color:#6a7a9a;margin-top:10px;padding:8px 12px;background:rgba(0,0,0,0.2);border-radius:8px;">
                        <i class="fas fa-calculator" style="color:#ffb84d;"></i> 
                        示例：体验金 €250 × ${trialRate}% = €${(250 * trialRate / 100).toFixed(3)}/单 × ${trialLimit}单 = €${(250 * trialRate / 100 * trialLimit).toFixed(2)} 总佣金
                    </div>
                </div>
                
                <button class="save-vip" data-level="${v.level}" style="margin-top:8px;background:#4a7cff;padding:6px 20px;border-radius:20px;border:none;color:#fff;cursor:pointer;">保存配置</button>
            </div>`;
        }
        document.querySelectorAll('.save-vip').forEach(btn => btn.addEventListener('click', () => saveVip(btn.dataset.level)));
    }
}

async function saveVip(level) {
    const limit = parseInt(document.getElementById(`limit_${level}`).value);
    const rate = parseFloat(document.getElementById(`rate_${level}`).value);
    const deposit = parseFloat(document.getElementById(`deposit_${level}`).value) || 0;
    const trialLimit = parseInt(document.getElementById(`trial_limit_${level}`).value) || 30;
    const trialRate = parseFloat(document.getElementById(`trial_rate_${level}`).value) || 0.35;
    
    const { error } = await sb.from('vip_settings').update({ 
        orders_limit: limit, 
        commission_rate: rate, 
        required_deposit: deposit,
        trial_orders_limit: trialLimit,
        trial_commission_rate: trialRate
    }).eq('level', level);
    
    if (error) {
        showToast('保存失败: ' + error.message, 'error');
    } else {
        showToast('VIP参数已更新', 'success');
        loadVipSettings();
    }
}

window.loadVipPage = loadVipPage;