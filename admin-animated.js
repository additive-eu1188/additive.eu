// admin-animated.js - 动画/视频设置页面（使用自定义弹窗）
let featuredHotels = [];
let uploadedImageUrl = '';
let dashboardProducts = [];

async function loadAnimatedPage() {
    const container = document.getElementById('page_animated');
    if (!container) return;
    container.innerHTML = `
        <div class="card">
            <h3><i class="fas fa-video"></i> 动态视频设置</h3>
            <div><label>视频 / GIF URL</label><input type="text" id="videoUrl" placeholder="https://example.com/video.mp4" class="search-input" style="width:100%;"></div>
            <div style="display: flex; gap: 12px; margin-top: 12px;"><button id="saveVideoBtn" class="success">保存视频</button><button id="previewVideoBtn" class="btn-primary">预览</button></div>
            <div id="videoPreview" style="margin-top: 20px; background:#0a0f1a; border-radius:12px; padding:20px; text-align:center; min-height:150px;"><p style="color:#aaa;">点击预览查看效果</p></div>
        </div>
        <div class="card">
            <h3><i class="fas fa-hotel"></i> 精选酒店轮播图</h3>
            <div class="search-bar"><input type="text" id="hotelNameInput" class="search-input" placeholder="酒店名称"><input type="text" id="hotelImageInput" class="search-input" placeholder="图片 URL"><button id="uploadImageBtn" class="btn-primary">上传图片</button><input type="file" id="hotelImageFile" accept="image/*" style="display:none;"><button id="addHotelBtn" class="success">添加酒店</button></div>
            <div id="hotelPreviewImg" style="display:none;"><img id="previewUploadImg" style="max-width:200px; border-radius:12px;"></div>
            <div id="hotelsListContainer" style="max-height:400px; overflow-y:auto;"></div>
            <button id="saveHotelsBtn" class="btn-primary" style="margin-top:15px;">保存所有酒店</button>
        </div>
        <div class="card">
            <h3><i class="fas fa-box-open"></i> Dashboard Product Sample</h3>
            <div class="search-bar"><input type="text" id="productNameInput" class="search-input" placeholder="产品名称"><input type="text" id="productPriceInput" class="search-input" placeholder="价格 (USD)" style="width:120px;"><input type="text" id="productImageInput" class="search-input" placeholder="图片 URL"><button id="uploadProductImageBtn" class="btn-primary">上传图片</button><input type="file" id="productImageFile" accept="image/*" style="display:none;"></div>
            <div class="search-bar"><input type="text" id="productVideoInput" class="search-input" placeholder="视频 URL"><select id="productStatusSelect" style="width:120px;"><option value="active">显示</option><option value="inactive">隐藏</option></select><button id="addProductBtn" class="success">添加产品</button><button id="refreshProductsBtn" class="btn-primary">刷新列表</button></div>
            <div id="productPreviewImg" style="display:none;"><img id="previewProductImg" style="max-width:200px; border-radius:12px;"></div>
            <div id="productsListContainer" style="max-height:400px; overflow-y:auto;"></div>
            <button id="saveProductsOrderBtn" class="btn-primary">保存排序</button>
        </div>
    `;
    await loadAnimatedSettings();
    await loadDashboardProducts();
    document.getElementById('saveVideoBtn')?.addEventListener('click', saveVideo);
    document.getElementById('previewVideoBtn')?.addEventListener('click', previewVideo);
    document.getElementById('addHotelBtn')?.addEventListener('click', addHotel);
    document.getElementById('saveHotelsBtn')?.addEventListener('click', saveHotels);
    document.getElementById('addProductBtn')?.addEventListener('click', addProduct);
    document.getElementById('refreshProductsBtn')?.addEventListener('click', loadDashboardProducts);
    document.getElementById('saveProductsOrderBtn')?.addEventListener('click', saveProductsOrder);
    document.getElementById('uploadProductImageBtn')?.addEventListener('click', () => document.getElementById('productImageFile').click());
    document.getElementById('uploadImageBtn')?.addEventListener('click', () => document.getElementById('hotelImageFile').click());
    document.getElementById('hotelImageFile')?.addEventListener('change', uploadHotelImage);
    document.getElementById('productImageFile')?.addEventListener('change', uploadProductImage);
}

async function uploadHotelImage(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(event) {
        document.getElementById('previewUploadImg').src = event.target.result;
        document.getElementById('hotelPreviewImg').style.display = 'block';
    };
    reader.readAsDataURL(file);
    const fileName = `hotels/${Date.now()}_${file.name}`;
    const { error } = await sb.storage.from('hotel-images').upload(fileName, file);
    if (error) {
        showToast('上传失败: ' + error.message, 'error');
        return;
    }
    const { data: urlData } = sb.storage.from('hotel-images').getPublicUrl(fileName);
    uploadedImageUrl = urlData.publicUrl;
    document.getElementById('hotelImageInput').value = uploadedImageUrl;
    showToast('图片上传成功！', 'success');
}

async function uploadProductImage(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(event) {
        document.getElementById('previewProductImg').src = event.target.result;
        document.getElementById('productPreviewImg').style.display = 'block';
    };
    reader.readAsDataURL(file);
    const fileName = `products/${Date.now()}_${file.name}`;
    const { error } = await sb.storage.from('product-images').upload(fileName, file);
    if (error) {
        showToast('上传失败: ' + error.message, 'error');
        return;
    }
    const { data: urlData } = sb.storage.from('product-images').getPublicUrl(fileName);
    document.getElementById('productImageInput').value = urlData.publicUrl;
    showToast('图片上传成功！', 'success');
}

async function loadAnimatedSettings() {
    try {
        const { data } = await sb.from('animated_settings').select('*').eq('id', 1).single();
        if (data) {
            document.getElementById('videoUrl').value = data.video_url || '';
            featuredHotels = data.featured_hotels || [];
        } else {
            await sb.from('animated_settings').insert([{ id: 1, video_url: '', featured_hotels: [] }]);
            featuredHotels = [];
        }
        renderHotelsList();
    } catch (e) { console.error(e); }
}

function renderHotelsList() {
    const container = document.getElementById('hotelsListContainer');
    if (!container) return;
    if (featuredHotels.length === 0) {
        container.innerHTML = '<div style="text-align:center; padding:40px; color:#aaa;">暂无精选酒店，点击"添加酒店"开始</div>';
        return;
    }
    container.innerHTML = '';
    featuredHotels.forEach((hotel, index) => {
        const div = document.createElement('div');
        div.className = 'hotel-item';
        div.innerHTML = `<div><img src="${hotel.image || ''}" style="width:100px;height:70px;object-fit:cover;border-radius:12px;" onerror="this.src='https://placehold.co/100x70/0f172a/4a7cff?text=No+Image'"></div>
                        <div><input type="text" class="hotel-name-edit" data-index="${index}" value="${escapeHtml(hotel.name || '')}" placeholder="酒店名称" style="background:#0f172a;border:1px solid #1e2a3a;border-radius:8px;padding:8px;color:#fff;width:200px;"></div>
                        <div><input type="text" class="hotel-image-edit" data-index="${index}" value="${escapeHtml(hotel.image || '')}" placeholder="图片 URL" style="background:#0f172a;border:1px solid #1e2a3a;border-radius:8px;padding:8px;color:#fff;width:300px;"></div>
                        <div><button class="delete-hotel-btn" data-index="${index}" style="background:#7a2f2f;padding:6px 12px;border-radius:8px;">删除</button></div>`;
        container.appendChild(div);
    });
    document.querySelectorAll('.hotel-name-edit').forEach(input => input.addEventListener('change', () => { featuredHotels[parseInt(input.dataset.index)].name = input.value; }));
    document.querySelectorAll('.hotel-image-edit').forEach(input => input.addEventListener('change', () => { featuredHotels[parseInt(input.dataset.index)].image = input.value; }));
    document.querySelectorAll('.delete-hotel-btn').forEach(btn => btn.addEventListener('click', () => { featuredHotels.splice(parseInt(btn.dataset.index), 1); renderHotelsList(); }));
}

async function saveVideo() {
    const videoUrl = document.getElementById('videoUrl').value.trim();
    await sb.from('animated_settings').update({ video_url: videoUrl }).eq('id', 1);
    showToast('视频已保存', 'success');
}

function previewVideo() {
    const videoUrl = document.getElementById('videoUrl').value.trim();
    const previewDiv = document.getElementById('videoPreview');
    if (videoUrl) {
        if (videoUrl.endsWith('.mp4') || videoUrl.includes('.mp4')) {
            previewDiv.innerHTML = `<video src="${videoUrl}" controls style="max-width:100%; border-radius:12px;"></video>`;
        } else {
            previewDiv.innerHTML = `<img src="${videoUrl}" style="max-width:100%; border-radius:12px;" onerror="this.parentElement.innerHTML='<p>无法加载图片</p>'">`;
        }
    } else {
        previewDiv.innerHTML = '<p style="color:#aaa;">暂无视频/图片</p>';
    }
}

async function addHotel() {
    const name = document.getElementById('hotelNameInput').value.trim();
    const image = document.getElementById('hotelImageInput').value.trim() || uploadedImageUrl || '';
    if (!name) {
        showToast('请输入酒店名称', 'error');
        return;
    }
    featuredHotels.push({ name: name, image: image });
    renderHotelsList();
    document.getElementById('hotelNameInput').value = '';
    document.getElementById('hotelImageInput').value = '';
    document.getElementById('hotelPreviewImg').style.display = 'none';
    uploadedImageUrl = '';
}

async function saveHotels() {
    await sb.from('animated_settings').update({ featured_hotels: featuredHotels }).eq('id', 1);
    showToast('精选酒店已保存', 'success');
}

async function loadDashboardProducts() {
    const { data, error } = await sb.from('dashboard_products').select('*').order('sort_order', { ascending: true });
    if (error) return;
    dashboardProducts = data || [];
    renderProductsList();
}

function renderProductsList() {
    const container = document.getElementById('productsListContainer');
    if (!container) return;
    if (dashboardProducts.length === 0) {
        container.innerHTML = '<div style="text-align:center; padding:40px; color:#aaa;">暂无产品</div>';
        return;
    }
    container.innerHTML = '';
    dashboardProducts.forEach((product) => {
        const div = document.createElement('div');
        div.className = 'hotel-item';
        div.setAttribute('data-id', product.id);
        div.innerHTML = `<div><img src="${product.image_url || ''}" style="width:80px;height:60px;object-fit:cover;border-radius:12px;"></div>
                        <div><input type="text" class="product-name-edit" data-id="${product.id}" value="${escapeHtml(product.name || '')}" placeholder="产品名称" style="background:#0f172a;border:1px solid #1e2a3a;border-radius:8px;padding:8px;color:#fff;width:200px;"></div>
                        <div><input type="number" step="0.01" class="product-price-edit" data-id="${product.id}" value="${product.price || 0}" placeholder="价格" style="width:100px;background:#0f172a;border:1px solid #1e2a3a;border-radius:8px;padding:8px;color:#fff;"></div>
                        <div><input type="text" class="product-image-edit" data-id="${product.id}" value="${escapeHtml(product.image_url || '')}" placeholder="图片 URL" style="width:200px;background:#0f172a;border:1px solid #1e2a3a;border-radius:8px;padding:8px;color:#fff;"></div>
                        <div><input type="text" class="product-video-edit" data-id="${product.id}" value="${escapeHtml(product.video_url || '')}" placeholder="视频 URL" style="width:200px;background:#0f172a;border:1px solid #1e2a3a;border-radius:8px;padding:8px;color:#fff;"></div>
                        <div><select class="product-status-edit" data-id="${product.id}" style="background:#0f172a;border:1px solid #1e2a3a;border-radius:8px;padding:8px;color:#fff;"><option value="active" ${product.status === 'active' ? 'selected' : ''}>显示</option><option value="inactive" ${product.status === 'inactive' ? 'selected' : ''}>隐藏</option></select></div>
                        <div><button class="delete-product-btn" data-id="${product.id}" style="background:#7a2f2f;padding:6px 12px;border-radius:8px;">删除</button></div>`;
        container.appendChild(div);
    });
    document.querySelectorAll('.product-name-edit').forEach(input => input.addEventListener('change', () => updateProductField(input.dataset.id, 'name', input.value)));
    document.querySelectorAll('.product-price-edit').forEach(input => input.addEventListener('change', () => updateProductField(input.dataset.id, 'price', parseFloat(input.value) || 0)));
    document.querySelectorAll('.product-image-edit').forEach(input => input.addEventListener('change', () => updateProductField(input.dataset.id, 'image_url', input.value)));
    document.querySelectorAll('.product-video-edit').forEach(input => input.addEventListener('change', () => updateProductField(input.dataset.id, 'video_url', input.value)));
    document.querySelectorAll('.product-status-edit').forEach(select => select.addEventListener('change', () => updateProductField(select.dataset.id, 'status', select.value)));
    document.querySelectorAll('.delete-product-btn').forEach(btn => btn.addEventListener('click', () => deleteProduct(btn.dataset.id)));
}

async function updateProductField(id, field, value) {
    await sb.from('dashboard_products').update({ [field]: value }).eq('id', parseInt(id));
    loadDashboardProducts();
}

async function deleteProduct(id) {
    showConfirm('确认删除', '确定删除此产品吗？', async () => {
        await sb.from('dashboard_products').delete().eq('id', parseInt(id));
        loadDashboardProducts();
        showToast('已删除', 'success');
    });
}

async function addProduct() {
    const name = document.getElementById('productNameInput').value.trim();
    const price = parseFloat(document.getElementById('productPriceInput').value) || 0;
    const image_url = document.getElementById('productImageInput').value.trim();
    const video_url = document.getElementById('productVideoInput').value.trim();
    const status = document.getElementById('productStatusSelect').value;
    if (!name) {
        showToast('请输入产品名称', 'error');
        return;
    }
    if (!image_url) {
        showToast('请填写图片URL或上传图片', 'error');
        return;
    }
    const sort_order = dashboardProducts.length;
    await sb.from('dashboard_products').insert([{ name, price, image_url, video_url: video_url || null, status, sort_order }]);
    showToast('添加成功', 'success');
    document.getElementById('productNameInput').value = '';
    document.getElementById('productPriceInput').value = '';
    document.getElementById('productImageInput').value = '';
    document.getElementById('productVideoInput').value = '';
    document.getElementById('productPreviewImg').style.display = 'none';
    loadDashboardProducts();
}

async function saveProductsOrder() {
    const items = document.querySelectorAll('#productsListContainer .hotel-item');
    for (let i = 0; i < items.length; i++) {
        const id = items[i].getAttribute('data-id');
        if (id) await sb.from('dashboard_products').update({ sort_order: i }).eq('id', parseInt(id));
    }
    showToast('排序已保存', 'success');
    loadDashboardProducts();
}

window.loadAnimatedPage = loadAnimatedPage;