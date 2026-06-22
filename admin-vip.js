// admin-vip.js - VIP配置页面 + Trial Bonus 独立配置
async function loadVipPage() {
    const container = document.getElementById('page_vip');
    if (!container) return;
    container.innerHTML = `
        <div class="card">
            <h3><i class="fas fa-crown text-gold"></i> VIP 等级配置</h3>
            <div id="vipSettingsDiv"></div>
        </div>
        <div class="card" style="margin-top: 24px; border: 1px solid rgba(255,184,77,0.3);">
            <h3 style="color: #ffb84d;"><i class="fas fa-gift"></i> Trial Bonus 独立配置</h3>
            <p style="color: #8a9abb; font-size: 12px; margin-bottom: 16px;">此配置独立于VIP等级，所有用户使用同一套 Trial Bonus 设置</p>
            <div id="trialBonusConfigDiv"></div>
        </div>
    `;
    await loadVipSettings();
    await loadTrialBonusConfig();
}

async function loadVipSettings() {
    const { data: vips, error } = await sb.from('vip_settings').select('*').order('level');
    const div = document.getElementById('vipSettingsDiv');
    if (div) {
        div.innerHTML = '';
        for (let v of vips || []) {
            div.innerHTML += `
            <div style="background:#0f172a; border-radius:20px; padding:20px; margin-bottom:20px; border:1px solid rgba(74,124,255,0.15);">
                <h3 style="color:#4a7cff; margin-bottom:16px;">
                    ${v.rank_name} 
                    <span class="badge" style="background:rgba(74,124,255,0.2);padding:2px 12px;border-radius:12px;font-size:11px;">Lv.${v.level}</span>
                </h3>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
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
                <button class="save-vip" data-level="${v.level}" style="margin-top:14px;background:#4a7cff;padding:6px 20px;border-radius:20px;border:none;color:#fff;cursor:pointer;">保存配置</button>
            </div>`;
        }
        document.querySelectorAll('.save-vip').forEach(btn => btn.addEventListener('click', () => saveVip(btn.dataset.level)));
    }
}

async function saveVip(level) {
    const limit = parseInt(document.getElementById(`limit_${level}`).value);
    const rate = parseFloat(document.getElementById(`rate_${level}`).value);
    const deposit = parseFloat(document.getElementById(`deposit_${level}`).value) || 0;
    
    const { error } = await sb.from('vip_settings').update({ 
        orders_limit: limit, 
        commission_rate: rate, 
        required_deposit: deposit
    }).eq('level', level);
    
    if (error) {
        showToast('保存失败: ' + error.message, 'error');
    } else {
        showToast('VIP参数已更新', 'success');
        loadVipSettings();
    }
}

// ============================================================
// Trial Bonus 独立配置
// ============================================================
async function loadTrialBonusConfig() {
    const div = document.getElementById('trialBonusConfigDiv');
    if (!div) return;
    
    const { data, error } = await sb.from('trial_bonus_config')
        .select('*')
        .eq('id', 1)
        .single();
    
    if (error && error.code !== 'PGRST116') {
        console.error('加载 Trial Bonus 配置失败:', error);
        div.innerHTML = '<div style="color:#ff8888;">加载失败，请确保数据库表存在</div>';
        return;
    }
    
    const config = data || { orders_limit: 30, commission_rate: 0.35, trial_amount: 250 };
    
    div.innerHTML = `
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px;">
            <div>
                <label style="font-size:11px;color:#8a9abb;">体验金金额 (€)</label>
                <input type="number" id="trial_amount" value="${config.trial_amount || 250}" step="0.01" style="width:100%;background:#0f172a;border:1px solid #ffb84d;border-radius:8px;padding:8px 12px;color:#ffb84d;">
            </div>
            <div>
                <label style="font-size:11px;color:#8a9abb;">体验金订单上限</label>
                <input type="number" id="trial_limit" value="${config.orders_limit || 30}" style="width:100%;background:#0f172a;border:1px solid #ffb84d;border-radius:8px;padding:8px 12px;color:#ffb84d;">
                <div style="font-size:9px;color:#6a7a9a;margin-top:2px;">完成此数量订单后结算</div>
            </div>
            <div>
                <label style="font-size:11px;color:#8a9abb;">体验金佣金率 (%)</label>
                <input type="number" id="trial_rate" value="${config.commission_rate || 0.35}" step="0.01" min="0" max="100" style="width:100%;background:#0f172a;border:1px solid #ffb84d;border-radius:8px;padding:8px 12px;color:#ffb84d;">
                <div style="font-size:9px;color:#6a7a9a;margin-top:2px;">体验金 × 佣金率 = 每单佣金</div>
            </div>
        </div>
        <div style="font-size:11px;color:#6a7a9a;margin-top:12px;padding:10px 14px;background:rgba(0,0,0,0.2);border-radius:8px;">
            <i class="fas fa-calculator" style="color:#ffb84d;"></i> 
            当前配置：€<span id="calcTrialAmount">${config.trial_amount || 250}</span> × <span id="calcRate">${config.commission_rate || 0.35}</span>% = €<span id="calcPerOrder">${((config.trial_amount || 250) * (config.commission_rate || 0.35) / 100).toFixed(3)}</span>/单 × <span id="calcLimit">${config.orders_limit || 30}</span>单 = €<span id="calcTotal">${((config.trial_amount || 250) * (config.commission_rate || 0.35) / 100 * (config.orders_limit || 30)).toFixed(2)}</span> 总佣金
        </div>
        <button id="saveTrialBonusBtn" style="margin-top:14px;background:#ffb84d;padding:8px 24px;border-radius:20px;border:none;color:#0A122B;font-weight:600;cursor:pointer;">保存 Trial Bonus 配置</button>
    `;
    
    // 实时计算预览
    ['trial_amount', 'trial_limit', 'trial_rate'].forEach(id => {
        document.getElementById(id)?.addEventListener('input', function() {
            updateTrialPreview();
        });
    });
    
    document.getElementById('saveTrialBonusBtn')?.addEventListener('click', saveTrialBonusConfig);
}

function updateTrialPreview() {
    const amount = parseFloat(document.getElementById('trial_amount')?.value) || 250;
    const limit = parseInt(document.getElementById('trial_limit')?.value) || 30;
    const rate = parseFloat(document.getElementById('trial_rate')?.value) || 0.35;
    
    const perOrder = amount * rate / 100;
    const total = perOrder * limit;
    
    document.getElementById('calcTrialAmount').textContent = amount;
    document.getElementById('calcRate').textContent = rate;
    document.getElementById('calcPerOrder').textContent = perOrder.toFixed(3);
    document.getElementById('calcLimit').textContent = limit;
    document.getElementById('calcTotal').textContent = total.toFixed(2);
}

async function saveTrialBonusConfig() {
    const amount = parseFloat(document.getElementById('trial_amount').value) || 250;
    const limit = parseInt(document.getElementById('trial_limit').value) || 30;
    const rate = parseFloat(document.getElementById('trial_rate').value) || 0.35;
    
    if (amount <= 0 || limit <= 0 || rate <= 0) {
        showToast('所有值必须大于0', 'error');
        return;
    }
    
    const { error } = await sb.from('trial_bonus_config')
        .upsert({
            id: 1,
            trial_amount: amount,
            orders_limit: limit,
            commission_rate: rate,
            updated_at: new Date().toISOString()
        });
    
    if (error) {
        showToast('保存失败: ' + error.message, 'error');
    } else {
        showToast('✅ Trial Bonus 配置已保存', 'success');
        loadTrialBonusConfig();
    }
}

window.loadVipPage = loadVipPage;