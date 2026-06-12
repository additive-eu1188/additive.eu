// admin-vip.js - VIP配置页面（使用自定义弹窗）
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
    const { data: vips } = await sb.from('vip_settings').select('*').order('level');
    const div = document.getElementById('vipSettingsDiv');
    if (div) {
        div.innerHTML = '';
        for (let v of vips || []) {
            div.innerHTML += `<div style="background:#0f172a; border-radius:20px; padding:20px; margin-bottom:20px;">
                <h3>${v.rank_name} <span class="badge">Lv.${v.level}</span></h3>
                <div>每日订单上限: <input type="number" id="limit_${v.level}" value="${v.orders_limit}" style="width:130px; background:#0f172a; border:1px solid #1e2a3a; border-radius:8px; padding:4px 8px; color:#fff;"></div>
                <div>佣金比率(%): <input type="number" id="rate_${v.level}" value="${v.commission_rate}" step="0.01" style="width:110px; background:#0f172a; border:1px solid #1e2a3a; border-radius:8px; padding:4px 8px; color:#fff;"></div>
                <div>需充值金额(€): <input type="number" id="deposit_${v.level}" value="${v.required_deposit || 0}" step="0.01" style="width:130px; background:#0f172a; border:1px solid #1e2a3a; border-radius:8px; padding:4px 8px; color:#fff;"></div>
                <button class="save-vip" data-level="${v.level}" style="margin-top:10px; background:#4a7cff; padding:6px 16px; border-radius:20px;">保存配置</button>
            </div>`;
        }
        document.querySelectorAll('.save-vip').forEach(btn => btn.addEventListener('click', () => saveVip(btn.dataset.level)));
    }
}

async function saveVip(level) {
    const limit = parseInt(document.getElementById(`limit_${level}`).value);
    const rate = parseFloat(document.getElementById(`rate_${level}`).value);
    const deposit = parseFloat(document.getElementById(`deposit_${level}`).value) || 0;
    await sb.from('vip_settings').update({ orders_limit: limit, commission_rate: rate, required_deposit: deposit }).eq('level', level);
    showToast('VIP参数已更新', 'success');
    loadVipSettings();
}

window.loadVipPage = loadVipPage;