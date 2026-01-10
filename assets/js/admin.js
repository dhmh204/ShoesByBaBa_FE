document.addEventListener('DOMContentLoaded', function () {
    const token = localStorage.getItem('token');
    if (!token) {
        alert("Bạn cần đăng nhập để truy cập trang quản trị!");
        window.location.href = "login.html";
        return;
    }

    loadMetadata().then(() => {
        loadProducts();
    });
    setupTabSwitching();
});

let productModal, categoryModal, brandModal;
let selectedFiles = [];

// TAB SWITCHING
function setupTabSwitching() {
    const navLinks = document.querySelectorAll('.sidebar .nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', function (e) {
            const tabId = this.getAttribute('data-tab');
            if (!tabId) return;

            e.preventDefault();
            
            navLinks.forEach(l => l.classList.remove('active'));
            this.classList.add('active');

            document.querySelectorAll('.admin-tab').forEach(tab => {
                tab.classList.add('d-none');
            });
            document.getElementById(`tab-${tabId}`).classList.remove('d-none');

            // Load data based on tab
            switch(tabId) {
                case 'products': loadProducts(); break;
                case 'categories': loadCategories(); break;
                case 'brands': loadBrands(); break;
                case 'orders': loadOrders(); break;
                case 'reviews': loadReviews(); break;
            }
        });
    });
}

// ---------------- ORDER MANAGEMENT ----------------
async function loadOrders() {
    try {
        const statusFilter = document.getElementById('order-status-filter').value;
        const result = await AdminService.getAllOrders(1, 50, statusFilter);
        const orders = result.orders || result.data?.items || result.data || [];
        const body = document.getElementById('order-list-body');

        if (!body) return;

        body.innerHTML = orders.map(order => {
            const date = new Date(order.order_date).toLocaleDateString('vi-VN', {
                year: 'numeric', month: '2-digit', day: '2-digit',
                hour: '2-digit', minute: '2-digit'
            });
            
            const total = (order.total_amount || 0).toLocaleString('vi-VN') + ' ₫';
            const itemsSummary = (order.items || []).map(item => 
                `${item.product_name} (${item.size}, ${item.color}) x${item.quantity}`
            ).join('<br>');

            return `
            <tr>
                <td>#${order.id}</td>
                <td>
                    <div class="fw-bold">${order.user_full_name || 'Khách hàng #' + order.user_id}</div>
                    <small class="text-muted">Người nhận: ${order.delivery_address?.recipient_name || 'N/A'}</small>
                </td>
                <td><small>${date}</small></td>
                <td class="text-danger fw-bold">${total}</td>
                <td>
                    <span class="badge ${getPaymentStatusClass(order.payment_status)}">
                        ${formatPaymentStatus(order.payment_status)}
                    </span>
                </td>
                <td>
                    <select class="form-select form-select-sm" 
                        onchange="changeOrderStatus(${order.id}, this.value)"
                        style="width: 140px; border-color: ${getOrderStatusColor(order.status)}">
                        <option value="pending" ${order.status === 'pending' ? 'selected' : ''}>Chờ xử lý</option>
                        <option value="processing" ${order.status === 'processing' ? 'selected' : ''}>Đang xử lý</option>
                        <option value="shipped" ${order.status === 'shipped' ? 'selected' : ''}>Đang giao hàng</option>
                        <option value="delivered" ${order.status === 'delivered' ? 'selected' : ''}>Đã giao hàng</option>
                        <option value="cancelled" ${order.status === 'cancelled' ? 'selected' : ''}>Đã hủy</option>
                    </select>
                </td>
                <td>
                    <button class="btn btn-sm btn-outline-info" onclick="showOrderDetail(${order.id})"><i class="fas fa-eye"></i></button>
                    <div id="order-items-${order.id}" class="d-none mt-2 small p-2 bg-light rounded border">
                        ${itemsSummary}
                        <hr class="my-1">
                        <strong>Địa chỉ:</strong> ${order.delivery_address?.street_address}, ${order.delivery_address?.ward || ''}, ${order.delivery_address?.province_city}
                        <br>
                        <strong>SĐT:</strong> ${order.delivery_address?.recipient_phone || 'N/A'}
                    </div>
                </td>
            </tr>`;
        }).join('');
    } catch (error) {
        console.error("Load Orders Error:", error);
    }
}

async function changeOrderStatus(orderId, newStatus) {
    if (!confirm(`Bạn có chắc muốn chuyển đơn hàng #${orderId} sang trạng thái "${newStatus}"?`)) {
        loadOrders();
        return;
    }
    try {
        await AdminService.updateOrderStatus(orderId, newStatus);
        alert(`Cập nhật thành công!`);
        loadOrders();
    } catch (error) {
        alert("Lỗi: " + (error.detail || "Không thể cập nhật"));
        loadOrders();
    }
}

function showOrderDetail(orderId) {
    document.getElementById(`order-items-${orderId}`)?.classList.toggle('d-none');
}

function getPaymentStatusClass(status) {
    return status === 'completed' ? 'bg-success' : (status === 'pending' ? 'bg-warning text-dark' : 'bg-danger');
}
function formatPaymentStatus(status) {
    return status === 'completed' ? 'Đã thanh toán' : (status === 'pending' ? 'Chờ thanh toán' : 'Thất bại');
}
function getOrderStatusColor(status) {
    const colors = { pending: '#ffc107', processing: '#0dcaf0', shipped: '#0d6efd', delivered: '#198754', cancelled: '#dc3545' };
    return colors[status] || '#6c757d';
}

// ---------------- METADATA & REVIEWS ----------------
let categoryMap = {}, brandMap = {};

async function loadMetadata() {
    try {
        const [catsRes, brandsRes] = await Promise.all([AdminService.getCategories(), AdminService.getBrands()]);
        const cats = catsRes.data?.items || catsRes.data || catsRes || [];
        const brands = brandsRes.data?.items || brandsRes.data || brandsRes || [];
        
        cats.forEach(c => categoryMap[c.id] = c.name);
        brands.forEach(b => brandMap[b.id] = b.brand_name || b.name);

        const catSelect = document.getElementById('prodCategory');
        const brandSelect = document.getElementById('prodBrand');
        if (catSelect) catSelect.innerHTML = '<option value="">-- Danh mục --</option>' + cats.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
        if (brandSelect) brandSelect.innerHTML = '<option value="">-- Thương hiệu --</option>' + brands.map(b => `<option value="${b.id}">${b.brand_name || b.name}</option>`).join('');
    } catch (e) { console.error("Metadata load error", e); }
}

// ---------------- CATEGORY MANAGEMENT ----------------
async function loadCategories() {
    try {
        const res = await AdminService.getCategories();
        const cats = res.data?.items || res.data || res || [];
        const body = document.getElementById('category-list-body');
        if (!body) return;

        body.innerHTML = cats.map(c => `
            <tr>
                <td>#${c.id}</td>
                <td class="fw-bold">${c.name}</td>
                <td>${c.description || ''}</td>
                <td><small>${new Date(c.created_at).toLocaleDateString('vi-VN')}</small></td>
                <td>
                    <button class="btn btn-sm btn-outline-primary" onclick='editCategory(${JSON.stringify(c)})'><i class="fas fa-edit"></i></button>
                    <button class="btn btn-sm btn-outline-danger" onclick="deleteCategory(${c.id})"><i class="fas fa-trash"></i></button>
                </td>
            </tr>
        `).join('');
    } catch(e) { console.error(e); }
}

window.openCategoryModal = function() {
    document.getElementById('categoryForm').reset();
    document.getElementById('catId').value = '';
    document.getElementById('categoryModalTitle').innerText = 'Thêm Danh Mục Mới';
    if (!categoryModal) categoryModal = new bootstrap.Modal(document.getElementById('categoryModal'));
    categoryModal.show();
}

window.editCategory = function(c) {
    window.openCategoryModal();
    document.getElementById('categoryModalTitle').innerText = 'Sửa Danh Mục #' + c.id;
    document.getElementById('catId').value = c.id;
    document.getElementById('catName').value = c.name;
    document.getElementById('catDesc').value = c.description || '';
}

window.saveCategory = async function() {
    const id = document.getElementById('catId').value;
    const data = { name: document.getElementById('catName').value, description: document.getElementById('catDesc').value };
    try {
        if (id) await AdminService.updateCategory(id, data);
        else await AdminService.createCategory(data);
        alert("Thành công!");
        categoryModal.hide();
        loadCategories();
        loadMetadata();
    } catch (e) { alert("Lỗi: " + (e.detail || "Không thể lưu")); }
}

window.deleteCategory = async function(id) {
    if (!confirm("Xác nhận xóa danh mục này?")) return;
    try {
        await AdminService.deleteCategory(id);
        loadCategories();
    } catch (e) { alert("Lỗi: " + (e.detail || "Không thể xóa")); }
}

// ---------------- BRAND MANAGEMENT ----------------
async function loadBrands() {
    try {
        const res = await AdminService.getBrands();
        const brands = res.data?.items || res.data || res || [];
        const body = document.getElementById('brand-list-body');
        if (!body) return;

        body.innerHTML = brands.map(b => `
            <tr>
                <td>#${b.id}</td>
                <td class="fw-bold">${b.brand_name || b.name}</td>
                <td>${b.description || ''}</td>
                <td><small>${new Date(b.created_at).toLocaleDateString('vi-VN')}</small></td>
                <td>
                    <button class="btn btn-sm btn-outline-primary" onclick='editBrand(${JSON.stringify(b)})'><i class="fas fa-edit"></i></button>
                    <button class="btn btn-sm btn-outline-danger" onclick="deleteBrand(${b.id})"><i class="fas fa-trash"></i></button>
                </td>
            </tr>
        `).join('');
    } catch(e) { console.error(e); }
}

window.openBrandModal = function() {
    document.getElementById('brandForm').reset();
    document.getElementById('brandId').value = '';
    document.getElementById('brandModalTitle').innerText = 'Thêm Thương Hiệu Mới';
    if (!brandModal) brandModal = new bootstrap.Modal(document.getElementById('brandModal'));
    brandModal.show();
}

window.editBrand = function(b) {
    window.openBrandModal();
    document.getElementById('brandModalTitle').innerText = 'Sửa Thương Hiệu #' + b.id;
    document.getElementById('brandId').value = b.id;
    document.getElementById('brand_name').value = b.brand_name || b.name;
    document.getElementById('brandDesc').value = b.description || '';
}

window.saveBrand = async function() {
    const id = document.getElementById('brandId').value;
    const data = { brand_name: document.getElementById('brand_name').value, description: document.getElementById('brandDesc').value };
    try {
        if (id) await AdminService.updateBrand(id, data);
        else await AdminService.createBrand(data);
        alert("Thành công!");
        brandModal.hide();
        loadBrands();
        loadMetadata();
    } catch (e) { alert("Lỗi: " + (e.detail || "Không thể lưu")); }
}

window.deleteBrand = async function(id) {
    if (!confirm("Xác nhận xóa thương hiệu này?")) return;
    try {
        await AdminService.deleteBrand(id);
        loadBrands();
    } catch (e) { alert("Lỗi: " + (e.detail || "Không thể xóa")); }
}

// ---------------- REVIEWS MANAGEMENT ----------------
async function loadReviews() {
    try {
        const res = await AdminService.getAllReviews(1, 100);
        const reviews = res.data || [];
        const body = document.getElementById('review-list-body');
        if (!body) return;

        body.innerHTML = reviews.map(r => `
            <tr>
                <td>#${r.id}</td>
                <td><small class="fw-bold">${r.product_name || 'N/A'}</small><br><small class="text-muted">ID: ${r.product_id}</small></td>
                <td>${r.user_name || 'User #' + r.user_id}</td>
                <td><span class="text-warning"><i class="fas fa-star"></i> ${r.rating}</span></td>
                <td><small>${r.comment || ''}</small></td>
                <td><small>${new Date(r.created_at).toLocaleDateString('vi-VN')}</small></td>
                <td>
                    <button class="btn btn-sm btn-outline-danger" onclick="deleteReview(${r.id})"><i class="fas fa-trash"></i></button>
                </td>
            </tr>
        `).join('');
    } catch (e) { console.error("Review load error", e); }
}

window.deleteReview = async function(id) {
    if (!confirm("Xác nhận xóa đánh giá này?")) return;
    try {
        await AdminService.deleteReview(id);
        alert("Đã xóa!");
        loadReviews();
    } catch (e) { alert("Lỗi khi xóa đánh giá"); }
}

// ---------------- PRODUCT MANAGEMENT ----------------
async function loadProducts() {
    try {
        const result = await AdminService.getProducts(1, 100);
        const products = result.data.items || result.data || [];
        const body = document.getElementById('product-list-body');
        if (!body) return;

        body.innerHTML = products.map(p => {
            const isLocked = p.status !== 'active';
            const variantSummary = (p.variants || []).map(v => `${v.color}-${v.size}(${v.stock_quantity})`).join(', ');

            return `
            <tr>
                <td>#${p.id}</td>
                <td><img src="${p.image_url || (p.image_urls?.[0]?.url) || 'https://via.placeholder.com/50'}" style="width:50px; height:50px; object-fit:cover; border-radius:4px;"></td>
                <td class="fw-semibold">${p.name}</td>
                <td>${categoryMap[p.category_id] || 'N/A'}</td>
                <td>${brandMap[p.brand_id] || 'N/A'}</td>
                <td><small class="text-muted" style="font-size: 11px;">${variantSummary}</small></td>
                <td class="text-danger fw-bold">${(p.price || 0).toLocaleString('vi-VN')} ₫</td>
                <td><span class="badge ${isLocked ? 'bg-secondary' : 'bg-success'}">${isLocked ? 'Khóa' : 'Kinh doanh'}</span></td>
                <td>
                    <button class="btn btn-sm btn-outline-primary" onclick='editProduct(${JSON.stringify(p).replace(/'/g, "&apos;")})'><i class="fas fa-edit"></i></button>
                    <button class="btn btn-sm ${isLocked ? 'btn-outline-success' : 'btn-outline-warning'}" onclick="toggleProductStatus(${p.id}, '${p.status}')">
                        <i class="fas ${isLocked ? 'fa-unlock' : 'fa-lock'}"></i>
                    </button>
                </td>
            </tr>`;
        }).join('');
    } catch(e) { console.error(e); }
}

window.openProductModal = function() {
    document.getElementById('productForm').reset();
    document.getElementById('productId').value = '';
    document.getElementById('modalTitle').innerText = 'Thêm Sản Phẩm Mới';
    document.getElementById('variant-inputs').innerHTML = ''; 
    document.getElementById('image-previews').innerHTML = '';
    selectedFiles = [];
    addVariantField();
    if (!productModal) productModal = new bootstrap.Modal(document.getElementById('productModal'));
    productModal.show();
}

window.addVariantField = function(v = null) {
    const container = document.getElementById('variant-inputs');
    const div = document.createElement('div');
    div.className = 'row g-2 mb-2 p-2 variant-row align-items-center bg-light rounded';
    div.innerHTML = `
        <div class="col-md-4"><input type="text" class="form-control form-control-sm var-color" placeholder="Màu" value="${v?.color || ''}"></div>
        <div class="col-md-3"><input type="number" class="form-control form-control-sm var-size" placeholder="Size" value="${v?.size || ''}"></div>
        <div class="col-md-3"><input type="number" class="form-control form-control-sm var-stock" placeholder="Kho" value="${v?.stock_quantity || ''}"></div>
        <div class="col-md-2 text-end"><button class="btn btn-sm btn-link text-danger" type="button" onclick="this.closest('.variant-row').remove()"><i class="fas fa-times"></i></button></div>
    `;
    container.appendChild(div);
}

// IMAGE HANDLING
window.previewImages = function(input) {
    const files = Array.from(input.files);
    files.forEach(file => {
        if (!selectedFiles.some(f => f.name === file.name && f.size === file.size)) {
            selectedFiles.push(file);
        }
    });
    input.value = ''; 
    renderPreviews();
}

window.removeSelectedFile = function(index) {
    selectedFiles.splice(index, 1);
    renderPreviews();
}

function renderPreviews() {
    const container = document.getElementById('image-previews');
    container.innerHTML = '';
    selectedFiles.forEach((file, index) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const div = document.createElement('div');
            div.className = 'position-relative';
            div.style.width = '80px'; div.style.height = '80px';
            div.innerHTML = `
                <img src="${e.target.result}" class="img-thumbnail w-100 h-100" style="object-fit:cover;">
                <span class="position-absolute top-0 end-0 badge rounded-pill bg-danger" 
                    onclick="removeSelectedFile(${index})" style="cursor:pointer; transform: translate(30%, -30%);">
                    <i class="fas fa-times"></i>
                </span>`;
            container.appendChild(div);
        }
        reader.readAsDataURL(file);
    });
}

window.saveProduct = async function() {
    const id = document.getElementById('productId').value;
    const saveBtn = document.getElementById('saveProductBtn');
    const originalBtnText = saveBtn.innerHTML;

    try {
        saveBtn.disabled = true;
        let finalImageUrls = [];
        
        if (selectedFiles.length > 0) {
            saveBtn.innerHTML = `<span class="spinner-border spinner-border-sm me-1"></span> Đang tải ảnh...`;
            const uploadData = new FormData();
            selectedFiles.forEach(file => uploadData.append('files', file));
            const uploadRes = await AdminService.uploadFiles(uploadData);
            finalImageUrls = uploadRes.map(img => ({ public_id: img.public_id, url: img.url }));
        }

        const body = {
            name: document.getElementById('prodName').value,
            price: parseInt(document.getElementById('prodPrice').value),
            description: document.getElementById('prodDesc').value,
            category_id: parseInt(document.getElementById('prodCategory').value),
            brand_id: parseInt(document.getElementById('prodBrand').value),
            status: document.getElementById('prodStatus').value,
            variants: Array.from(document.querySelectorAll('.variant-row')).map(row => ({
                color: row.querySelector('.var-color').value,
                size: parseInt(row.querySelector('.var-size').value),
                stock_quantity: parseInt(row.querySelector('.var-stock').value)
            })),
            image_urls: finalImageUrls.length > 0 ? finalImageUrls : undefined
        };

        if (id) await AdminService.updateProduct(id, body);
        else await AdminService.createProduct(body);

        alert("Thành công!");
        productModal.hide();
        loadProducts();
    } catch (e) { alert("Lỗi: " + (e.detail || "Không thể lưu")); }
    finally {
        saveBtn.disabled = false;
        saveBtn.innerHTML = originalBtnText;
    }
}

window.editProduct = function(p) {
    window.openProductModal();
    document.getElementById('productId').value = p.id;
    document.getElementById('prodName').value = p.name;
    document.getElementById('prodPrice').value = p.price;
    document.getElementById('prodCategory').value = p.category_id;
    document.getElementById('prodBrand').value = p.brand_id;
    document.getElementById('prodStatus').value = p.status;
    document.getElementById('prodDesc').value = p.description || '';
    document.getElementById('modalTitle').innerText = 'Sửa Sản Phẩm #' + p.id;
    
    // Existing images preview
    const imgContainer = document.getElementById('image-previews');
    if (p.image_urls) {
        p.image_urls.forEach(img => {
            const div = document.createElement('div');
            div.style.width = '60px';
            div.innerHTML = `<img src="${img.url}" class="img-thumbnail" style="width:60px;height:60px;object-fit:cover;">`;
            imgContainer.appendChild(div);
        });
    }

    const varContainer = document.getElementById('variant-inputs');
    varContainer.innerHTML = '';
    if (p.variants?.length) p.variants.forEach(v => addVariantField(v));
    else addVariantField();
}

window.toggleProductStatus = async function(id, current) {
    const next = current === 'active' ? 'locked' : 'active';
    if (!confirm(`Xác nhận ${next === 'active' ? 'mở khóa' : 'khóa'} sản phẩm này?`)) return;
    try {
        await AdminService.updateProductStatus(id, next);
        loadProducts();
    } catch (e) { alert("Lỗi hệ thống"); }
}
