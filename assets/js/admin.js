document.addEventListener('DOMContentLoaded', function () {
    // Kiểm tra Token trước khi vào trang Admin
    const token = localStorage.getItem('token');
    if (!token) {
        alert("Bạn cần đăng nhập để truy cập trang quản trị!");
        window.location.href = "login.html";
        return;
    }

    // Load metadata trước để có Mapping ID -> Tên, sau đó mới load sản phẩm
    loadMetadata().then(() => {
        loadProducts();
    });
    setupTabSwitching();
});

let productModal;

// TAB SWITCHING
function setupTabSwitching() {
    const navLinks = document.querySelectorAll('.sidebar .nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', function (e) {
            const tabId = this.getAttribute('data-tab');
            if (!tabId) return;

            e.preventDefault();
            
            // UI Update
            navLinks.forEach(l => l.classList.remove('active'));
            this.classList.add('active');

            document.querySelectorAll('.admin-tab').forEach(tab => {
                tab.classList.add('d-none');
            });
            document.getElementById(`tab-${tabId}`).classList.remove('d-none');

            // Load specifically for orders tab
            if (tabId === 'orders') {
                loadOrders();
            }
        });
    });
}

// ORDER MANAGEMENT
async function loadOrders() {
    try {
        const statusFilter = document.getElementById('order-status-filter').value;
        const result = await AdminService.getAllOrders(1, 50, statusFilter);
        const orders = result.orders || [];
        const body = document.getElementById('order-list-body');

        if (!body) return;

        body.innerHTML = orders.map(order => {
            const date = new Date(order.order_date).toLocaleDateString('vi-VN', {
                year: 'numeric', month: '2-digit', day: '2-digit',
                hour: '2-digit', minute: '2-digit'
            });
            
            const total = order.total_amount.toLocaleString('vi-VN') + ' ₫';
            
            // Format order items summary
            const itemsSummary = order.items.map(item => 
                `${item.product_name} (${item.size}, ${item.color}) x${item.quantity}`
            ).join('<br>');

            return `
            <tr>
                <td>#${order.id}</td>
                <td>
                    <div class="fw-bold">${order.user_full_name || 'Khách hàng #' + order.user_id}</div>
                    <small class="text-muted">Người nhận: ${order.delivery_address.recipient_name || 'N/A'}</small>
                </td>
                <td><small>${date}</small></td>
                <td class="text-danger fw-bold">${total}</td>
                <td>
                    <span class="badge ${getPaymentStatusClass(order.payment_status)}">
                        ${formatPaymentStatus(order.payment_status)}
                    </span>
                </td>
                <td>
                    <select class="form-select form-select-sm status-select" 
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
                    <button class="btn btn-sm btn-outline-info" title="Xem chi tiết" 
                        onclick="showOrderDetail(${order.id})">
                        <i class="fas fa-eye"></i>
                    </button>
                    <div id="order-items-${order.id}" class="d-none mt-2 small p-2 bg-light rounded border">
                        ${itemsSummary}
                        <hr class="my-1">
                        <strong>Địa chỉ:</strong> ${order.delivery_address.street_address}, ${order.delivery_address.ward || ''}, ${order.delivery_address.province_city}
                        <br>
                        <strong>SĐT:</strong> ${order.delivery_address.recipient_phone || 'N/A'}
                    </div>
                </td>
            </tr>
            `;
        }).join('');
    } catch (error) {
        console.error("Load Orders Error:", error);
    }
}

async function changeOrderStatus(orderId, newStatus) {
    try {
        await AdminService.updateOrderStatus(orderId, newStatus);
        alert(`Cập nhật trạng thái đơn hàng #${orderId} thành công!`);
        loadOrders();
    } catch (error) {
        console.error("Update Order Status Error:", error);
        alert("Lỗi khi cập nhật trạng thái đơn hàng!");
        loadOrders(); // Refresh to reset select
    }
}

function showOrderDetail(orderId) {
    const detailDiv = document.getElementById(`order-items-${orderId}`);
    if (detailDiv) {
        detailDiv.classList.toggle('d-none');
    }
}

function getPaymentStatusClass(status) {
    switch(status) {
        case 'completed': return 'bg-success';
        case 'pending': return 'bg-warning text-dark';
        case 'failed': return 'bg-danger';
        default: return 'bg-secondary';
    }
}

function formatPaymentStatus(status) {
    switch(status) {
        case 'completed': return 'Đã thanh toán';
        case 'pending': return 'Chờ thanh toán';
        case 'failed': return 'Thất bại';
        default: return status;
    }
}

function getOrderStatusColor(status) {
    switch(status) {
        case 'pending': return '#ffc107';
        case 'processing': return '#0dcaf0';
        case 'shipped': return '#0d6efd';
        case 'delivered': return '#198754';
        case 'cancelled': return '#dc3545';
        default: return '#6c757d';
    }
}

// Local Cache for mapping IDs to names
let categoryMap = {};
let brandMap = {};

// METADATA (Category, Brand)
async function loadMetadata(selectedCatId = null, selectedBrandId = null) {
    try {
        const [catsResult, brandsResult] = await Promise.all([
            AdminService.getCategories(),
            AdminService.getBrands()
        ]);

        const catSelect = document.getElementById('prodCategory');
        const brandSelect = document.getElementById('prodBrand');

        const cats = catsResult.data?.items || catsResult.data || catsResult || [];
        const brands = brandsResult.data?.items || brandsResult.data || brandsResult || [];

        // Update Maps
        cats.forEach(c => categoryMap[c.id] = c.name);
        brands.forEach(b => brandMap[b.id] = b.brand_name || b.name);

        catSelect.innerHTML = '<option value="">-- Chọn danh mục --</option>' + 
            cats.map(c => `<option value="${c.id}" ${selectedCatId == c.id ? 'selected' : ''}>${c.name}</option>`).join('');
            
        brandSelect.innerHTML = '<option value="">-- Chọn thương hiệu --</option>' + 
            brands.map(b => `<option value="${b.id}" ${selectedBrandId == b.id ? 'selected' : ''}>${b.brand_name || b.name}</option>`).join('');

        // Render danh sách trong các Tab khác
        const catContainer = document.getElementById('category-list-container');
        const brandContainer = document.getElementById('brand-list-container');

        if(catContainer) {
            catContainer.innerHTML = `
                <div class="card"><div class="card-body p-0">
                    <table class="table table-hover mb-0">
                        <thead class="table-light"><tr><th>ID</th><th>Tên Danh Mục</th><th>Mô Tả</th></tr></thead>
                        <tbody>${cats.map(c => `<tr><td>${c.id}</td><td>${c.name}</td><td>${c.description || ''}</td></tr>`).join('')}</tbody>
                    </table>
                </div></div>`;
        }
        if(brandContainer) {
            brandContainer.innerHTML = `
                <div class="card"><div class="card-body p-0">
                    <table class="table table-hover mb-0">
                        <thead class="table-light"><tr><th>ID</th><th>Tên Thương Hiệu</th></tr></thead>
                        <tbody>${brands.map(b => `<tr><td>${b.id}</td><td>${b.brand_name || b.name}</td></tr>`).join('')}</tbody>
                    </table>
                </div></div>`;
        }
    } catch (error) {
        console.error("Lỗi tải metadata:", error);
    }
}

// CATEGORY & BRAND OPERATIONS
let categoryModal, brandModal;

function openCategoryModal() {
    document.getElementById('categoryForm').reset();
    if (!categoryModal) categoryModal = new bootstrap.Modal(document.getElementById('categoryModal'));
    categoryModal.show();
}

async function saveCategory() {
    const data = {
        name: document.getElementById('catName').value,
        description: document.getElementById('catDesc').value
    };

    try {
        const res = await AdminService.createCategory(data);
        alert("Thêm danh mục thành công!");
        if (categoryModal) categoryModal.hide();
        
        const newId = res.data?.id || null;
        loadMetadata(newId, document.getElementById('prodBrand').value); 
    } catch (error) {
        console.error("Save Category Error:", error);
        const msg = error.detail || error.message || JSON.stringify(error);
        alert("Lỗi thêm danh mục: " + (typeof msg === 'object' ? JSON.stringify(msg) : msg));
    }
}

function openBrandModal() {
    document.getElementById('brandForm').reset();
    if (!brandModal) brandModal = new bootstrap.Modal(document.getElementById('brandModal'));
    brandModal.show();
}

async function saveBrand() {
    const data = { 
        brand_name: document.getElementById('brand_name').value,
        description: document.getElementById('brandDesc').value
    };

    try {
        const res = await AdminService.createBrand(data);
        alert("Thêm thương hiệu thành công!");
        if (brandModal) brandModal.hide();
        
        const newId = res.data?.id || null;
        loadMetadata(document.getElementById('prodCategory').value, newId);
    } catch (error) {
        console.error("Save Brand Error:", error);
        const msg = error.detail || error.message || JSON.stringify(error);
        alert("Lỗi thêm thương hiệu: " + (typeof msg === 'object' ? JSON.stringify(msg) : msg));
    }
}

// LOAD PRODUCTS
async function loadProducts() {
    const result = await AdminService.getProducts();
    const products = result.data.items || result.data || [];
    const body = document.getElementById('product-list-body');

    body.innerHTML = products.map(p => {
        const isLocked = p.status !== 'active';
        
        // 1. Lấy tên Danh mục (Thử Map trước, sau đó thử các trường khác)
        let catName = categoryMap[p.category_id] || 'N/A';
        if (catName === 'N/A') {
            if (p.category) {
                catName = typeof p.category === 'object' ? (p.category.name || p.category.category_name) : p.category;
            } else if (p.category_name) {
                catName = p.category_name;
            }
        }
        
        // 2. Lấy tên Thương hiệu
        let brandName = brandMap[p.brand_id] || 'N/A';
        if (brandName === 'N/A') {
            if (p.brand) {
                brandName = typeof p.brand === 'object' ? (p.brand.brand_name || p.brand.name) : p.brand;
            } else if (p.brand_name) {
                brandName = p.brand_name;
            }
        }
        
        // 3. Tóm tắt biến thể
        const variantSummary = p.variants && p.variants.length > 0 
            ? p.variants.map(v => `${v.color}-${v.size}(${v.stock_quantity})`).join(', ')
            : 'N/A';

        return `
        <tr>
            <td>#${p.id}</td>
            <td><img src="${p.image_url || (p.image_urls && p.image_urls[0]?.url) || 'https://theme.hstatic.net/1000230642/1001205219/14/no-image.jpg'}" alt=""></td>
            <td class="fw-semibold">${p.name}</td>
            <td>${catName}</td>
            <td>${brandName}</td>
            <td><small class="text-muted" style="font-size: 11px;">${variantSummary}</small></td>
            <td class="text-danger fw-bold">${p.price.toLocaleString('vi-VN')} ₫</td>
            <td><span class="badge ${!isLocked ? 'badge-active' : 'badge-inactive'}">${!isLocked ? 'Kinh doanh' : 'Khóa'}</span></td>
            <td>
                <button class="btn btn-sm btn-outline-primary me-1" title="Sửa" onclick='editProduct(${JSON.stringify(p).replace(/'/g, "&apos;")})'><i class="fas fa-edit"></i></button>
                <button class="btn btn-sm ${isLocked ? 'btn-outline-success' : 'btn-outline-warning'}" 
                    title="${isLocked ? 'Mở khóa' : 'Khóa'}" 
                    onclick="toggleProductStatus(${p.id}, '${p.status}')">
                    <i class="fas ${isLocked ? 'fa-unlock' : 'fa-lock'}"></i>
                </button>
            </td>
        </tr>
    `}).join('');
}

// IMAGE PREVIEW & SELECTION
let selectedFiles = [];

function previewImages(input) {
    const files = Array.from(input.files);
    // Accumulate files instead of replacing
    files.forEach(file => {
        if (!selectedFiles.some(f => f.name === file.name && f.size === file.size)) {
            selectedFiles.push(file);
        }
    });
    
    // Clear input so onchange triggers even if same file is picked again
    input.value = ''; 
    renderPreviews();
}

function removeSelectedFile(index) {
    selectedFiles.splice(index, 1);
    renderPreviews();
}

function renderPreviews() {
    const container = document.getElementById('image-previews');
    container.innerHTML = '';
    
    selectedFiles.forEach((file, index) => {
        const reader = new FileReader();
        reader.onload = function (e) {
            const div = document.createElement('div');
            div.className = 'position-relative';
            div.style.width = '100px';
            div.style.height = '100px';
            div.innerHTML = `
                <img src="${e.target.result}" class="img-thumbnail w-100 h-100" style="object-fit:cover;">
                <span class="position-absolute top-0 end-0 badge rounded-pill bg-danger" 
                    onclick="removeSelectedFile(${index})" style="cursor:pointer; transform: translate(30%, -30%);">
                    <i class="fas fa-times"></i>
                </span>
            `;
            container.appendChild(div);
        }
        reader.readAsDataURL(file);
    });
}

// PRODUCT OPERATIONS
function openProductModal() {
    document.getElementById('productForm').reset();
    document.getElementById('productId').value = '';
    document.getElementById('modalTitle').innerText = 'Thêm Sản Phẩm Mới';
    document.getElementById('variant-inputs').innerHTML = ''; 
    document.getElementById('image-previews').innerHTML = '';
    selectedFiles = [];

    if (!productModal) productModal = new bootstrap.Modal(document.getElementById('productModal'));
    productModal.show();
}

function addVariantField(variant = null) {
    const container = document.getElementById('variant-inputs');
    const div = document.createElement('div');
    div.className = 'row g-2 mb-2 p-3 variant-row align-items-center';
    div.innerHTML = `
        <div class="col-md-4"><input type="text" class="form-control var-color" placeholder="Màu sắc" value="${variant?.color || ''}"></div>
        <div class="col-md-3"><input type="number" class="form-control var-size" placeholder="Size" value="${variant?.size || ''}"></div>
        <div class="col-md-3"><input type="number" class="form-control var-stock" placeholder="Số lượng" value="${variant?.stock_quantity || ''}"></div>
        <div class="col-md-2 text-end"><button class="btn btn-sm btn-danger" type="button" onclick="this.closest('.variant-row').remove()"><i class="fas fa-times"></i></button></div>
    `;
    container.appendChild(div);
}

async function saveProduct() {
    const id = document.getElementById('productId').value;
    const name = document.getElementById('prodName').value;
    const price = parseInt(document.getElementById('prodPrice').value) || 0;
    const description = document.getElementById('prodDesc').value;
    const category_id = parseInt(document.getElementById('prodCategory').value) || 0;
    const brand_id = parseInt(document.getElementById('prodBrand').value) || 0;
    const status = document.getElementById('prodStatus').value;
    
    // Thu thập biến thể
    const variantRows = document.querySelectorAll('.variant-row');
    const variants = Array.from(variantRows).map(row => ({
        color: row.querySelector('.var-color').value,
        size: parseInt(row.querySelector('.var-size').value) || 0,
        stock_quantity: parseInt(row.querySelector('.var-stock').value) || 0
    }));

    const saveBtn = document.getElementById('saveProductBtn');
    const originalBtnText = saveBtn.innerHTML;

    try {
        saveBtn.disabled = true;
        
        let finalImageUrls = [];
        
        // BƯỚC 1: Nếu có file mới được chọn, upload lên Cloudinary trước
        if (selectedFiles.length > 0) {
            saveBtn.innerHTML = `<span class="spinner-border spinner-border-sm me-2"></span> Đang upload ảnh lên Cloudinary...`;
            const uploadData = new FormData();
            selectedFiles.forEach(file => uploadData.append('files', file));
            
            const uploadRes = await AdminService.uploadFiles(uploadData);
            // Ánh xạ kết quả trả về từ upload_router.py (public_id, url)
            finalImageUrls = uploadRes.map(img => ({
                public_id: img.public_id,
                url: img.url
            }));
        }

        // BƯỚC 2: Gửi JSON sản phẩm (bao gồm mảng image_urls vừa lấy được)
        saveBtn.innerHTML = `<span class="spinner-border spinner-border-sm me-2"></span> Đang lưu thông tin sản phẩm...`;
        
        const productPayload = {
            name,
            description,
            price,
            category_id,
            brand_id,
            status,
            variants: variants,
            image_urls: finalImageUrls 
        };

        let response;
        if (id) {
            // Khi update, Backend có thể cần logic gộp ảnh cũ/mới, hiện tại gửi mảng ảnh mới
            response = await AdminService.updateProduct(id, productPayload);
        } else {
            response = await AdminService.createProduct(productPayload);
        }

        alert("Lưu sản phẩm thành công!");
        productModal.hide();
        loadProducts();
    } catch (error) {
        console.error("Save Product Error:", error);
        const msg = error.detail || error.message || JSON.stringify(error);
        alert("Lỗi lưu sản phẩm: " + (typeof msg === 'object' ? JSON.stringify(msg) : msg));
    } finally {
        saveBtn.disabled = false;
        saveBtn.innerHTML = originalBtnText;
    }
}

function editProduct(p) {
    document.getElementById('productId').value = p.id;
    document.getElementById('prodName').value = p.name;
    document.getElementById('prodPrice').value = p.price;
    document.getElementById('prodCategory').value = p.category_id;
    document.getElementById('prodBrand').value = p.brand_id;
    document.getElementById('prodStatus').value = p.status;
    document.getElementById('prodDesc').value = p.description || '';
    
    document.getElementById('modalTitle').innerText = 'Chỉnh Sửa Sản Phẩm #' + p.id;

    // Previews for existing images (Optional: Show them but they are not files)
    const imgContainer = document.getElementById('image-previews');
    imgContainer.innerHTML = '';
    selectedFiles = []; // Reset selected files on edit
    
    if (p.image_urls) {
        p.image_urls.forEach(img => {
            const div = document.createElement('div');
            div.style.width = '80px';
            div.innerHTML = `<img src="${img.url}" class="img-thumbnail" style="width:80px;height:80px;object-fit:cover;">`;
            imgContainer.appendChild(div);
        });
    }

    // Load Variants
    const varContainer = document.getElementById('variant-inputs');
    varContainer.innerHTML = '';
    if (p.variants && p.variants.length > 0) {
        p.variants.forEach(v => addVariantField(v));
    } else {
        addVariantField();
    }

    if (!productModal) productModal = new bootstrap.Modal(document.getElementById('productModal'));
    productModal.show();
}

async function toggleProductStatus(id, currentStatus) {
    const newStatus = currentStatus === 'active' ? 'locked' : 'active';
    const actionText = newStatus === 'active' ? 'Mở khóa' : 'Khóa';
    
    if (!confirm(`Bạn có chắc chắn muốn ${actionText.toLowerCase()} sản phẩm #${id}?`)) return;
    
    try {
        // We use a partial update or updateProduct to change status
        // Create a basic payload with only status if backend supports it, 
        // otherwise we might need the full object. Assuming partial update works or we use a custom method.
        await AdminService.updateProductStatus(id, newStatus);
        alert(`${actionText} thành công!`);
        loadProducts();
    } catch (error) {
        console.error("Toggle Status Error:", error);
        alert("Lỗi khi thay đổi trạng thái!");
    }
}
