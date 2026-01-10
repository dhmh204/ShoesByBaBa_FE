const BASE_URL = 'http://127.0.0.1:8000';
let currentProduct = null;
let selectedColor = null;
let selectedSize = null;

document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id');

    if (!productId) {
        alert("Không tìm thấy ID sản phẩm!");
        window.location.href = 'index.html';
        return;
    }

    try {
        const response = await fetch(`${BASE_URL}/products/${productId}`);
        const result = await response.json();

        if (response.ok && (result.code === "200" || result.status === "success" || result.id)) {
            currentProduct = result.data || result; 
            renderProductDetail(currentProduct);
        } else {
            console.error("Lỗi API:", result);
            alert("Không thể tải thông tin sản phẩm!");
        }
    } catch (error) {
        console.error("Fetch Error:", error);
        alert("Lỗi kết nối Server!");
    }
});

function renderProductDetail(product) {
    // 1. Basic Info
    document.getElementById('detail-title').innerText = product.name;
    document.getElementById('detail-price').innerText = product.price.toLocaleString('vi-VN') + ' ₫';
    document.getElementById('detail-code').innerText = product.id;
    document.getElementById('detail-description').innerHTML = product.description || '<p>Đang cập nhật...</p>';
    
    // 1.5 Update Review Link
    const reviewBtn = document.getElementById('btn-write-review');
    if (reviewBtn) {
        reviewBtn.href = `reviews.html?product_id=${product.id}`;
    }

    // 2. Images
    const mainImg = document.getElementById('detail-main-image');
    const thumbList = document.getElementById('detail-thumb-list');
    
    // Primary image
    const images = product.image_urls || product.images || [];
    const primaryImage = images.length > 0 
        ? images[0].url || images[0].image_url 
        : (product.image_url || 'https://theme.hstatic.net/1000230642/1001205219/14/no-image.jpg');
    
    mainImg.src = primaryImage;

    // Thumbnails
    thumbList.innerHTML = '';
    if (images.length > 0) {
        images.forEach((img, index) => {
            const imgSrc = img.url || img.image_url;
            const thumb = document.createElement('div');
            thumb.className = `thumb-item ${index === 0 ? 'active' : ''}`;
            thumb.innerHTML = `<img src="${imgSrc}" onclick="changeMainImage('${imgSrc}', this)">`;
            thumbList.appendChild(thumb);
        });
    }

    // 3. Variants (Colors & Sizes)
    const colorContainer = document.getElementById('detail-color-container');
    const sizeContainer = document.getElementById('detail-size-container');
    
    if (!product.variants || product.variants.length === 0) {
        colorContainer.innerHTML = 'N/A';
        sizeContainer.innerHTML = 'N/A';
        return;
    }

    const colors = [...new Set(product.variants.map(v => v.color))].filter(Boolean);
    const sizes = [...new Set(product.variants.map(v => v.size))].filter(Boolean).sort((a,b) => a-b);

    colorContainer.innerHTML = colors.map(color => `
        <div class="color-text-item" onclick="selectDetailColor('${color}', this)">${color}</div>
    `).join('');

    sizeContainer.innerHTML = sizes.map(size => `
        <div class="size-item" onclick="selectDetailSize('${size}', this)">${size}</div>
    `).join('');
}

// UI Helpers
function changeMainImage(src, el) {
    document.getElementById('detail-main-image').src = src;
    document.querySelectorAll('.thumb-item').forEach(t => t.classList.remove('active'));
    el.parentElement.classList.add('active');
}

function selectDetailColor(color, el) {
    selectedColor = color;
    document.getElementById('selected-color-name').innerText = color;
    document.querySelectorAll('.color-text-item').forEach(c => c.classList.remove('active'));
    el.classList.add('active');
}

function selectDetailSize(size, el) {
    selectedSize = size;
    document.querySelectorAll('.size-item').forEach(s => s.classList.remove('active'));
    el.classList.add('active');
}

function updateQty(delta) {
    const input = document.getElementById('qtyInput');
    let val = parseInt(input.value) + delta;
    if (val < 1) val = 1;
    input.value = val;
}

function getColorHex(colorName) {
    const map = {
        'Đen': '#000000',
        'Trắng': '#FFFFFF',
        'Xám': '#808080',
        'Đỏ': '#FF0000',
        'Xanh': '#0000FF',
        'Vàng': '#FFFF00',
        'Hồng': '#FFC0CB'
    };
    return map[colorName] || '#ccc';
}

// Cart Operations
async function handleAddToCart() {
    const token = localStorage.getItem('token');
    if (!token) {
        showToast("Vui lòng đăng nhập để thêm vào giỏ hàng!", "error");
        setTimeout(() => window.location.href = 'login.html', 1500);
        return;
    }

    if (!selectedColor || !selectedSize) {
        showToast("Vui lòng chọn màu sắc và kích thước!", "error");
        return;
    }

    const qty = parseInt(document.getElementById('qtyInput').value);
    
    const cartData = {
        product_id: parseInt(currentProduct.id),
        quantity: qty,
        size: parseInt(selectedSize),
        color: String(selectedColor)
    };

    try {
        const response = await fetch(`${BASE_URL}/api/cart/items`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(cartData)
        });

        const result = await response.json();

        if (response.ok) {
            showToast("Đã thêm vào giỏ hàng thành công!", "success");
            if (typeof updateHeaderCart === 'function') updateHeaderCart();
        } else {
            showToast(result.detail || result.message || "Không thể thêm vào giỏ hàng!", "error");
        }
    } catch (error) {
        console.error("Add to cart error:", error);
        showToast("Lỗi kết nối Server!", "error");
    }
}

function handleBuyNow() {
    const token = localStorage.getItem('token');
    if (!token) {
        showToast("Vui lòng đăng nhập để thực hiện mua hàng!", "error");
        setTimeout(() => window.location.href = 'login.html', 1500);
        return;
    }

    if (!selectedColor || !selectedSize) {
        showToast("Vui lòng chọn màu sắc và kích thước trước khi mua!", "error");
        return;
    }

    // Show modal for customer info
    document.getElementById('buyNowModal').style.display = 'flex';
}

function closeBuyNowModal() {
    document.getElementById('buyNowModal').style.display = 'none';
}

async function confirmBuyNowOrder() {
    const token = localStorage.getItem('token');
    const name = document.getElementById('bn-name').value.trim();
    const phone = document.getElementById('bn-phone').value.trim();
    const address = document.getElementById('bn-address').value.trim();
    const ward = document.getElementById('bn-ward').value.trim();
    const city = document.getElementById('bn-city').value.trim();

    if (!name || !phone || !address) {
        alert("Vui lòng điền đầy đủ thông tin giao hàng!");
        return;
    }

    const qty = parseInt(document.getElementById('qtyInput').value);
    const amount = qty * (currentProduct.price || 0);

    // Dynamic UI state
    const confirmBtn = document.querySelector('.btn-confirm-order');
    if (confirmBtn) {
        confirmBtn.disabled = true;
        confirmBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang xử lý...';
    }

    try {
        // STEP 1: Create Intent
        const intentRes = await fetch(`${BASE_URL}/api/payments/create-intent?amount=${amount}`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const intentData = await intentRes.json();
        if (!intentRes.ok) throw new Error(intentData.detail || "Không thể khởi tạo thanh toán");

        const paymentIntentId = intentData.payment_intent_id;

        // STEP 2: Test Confirm
        const confirmRes = await fetch(`${BASE_URL}/api/payments/test-confirm/${paymentIntentId}`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const confirmData = await confirmRes.json();
        if (!confirmRes.ok) throw new Error(confirmData.detail || "Xác nhận thanh toán thất bại");

        // STEP 3: Create Order
        const payload = {
            payment_intent_id: paymentIntentId,
            items: [{
                product_id: parseInt(currentProduct.id),
                quantity: qty,
                size: parseInt(selectedSize),
                color: String(selectedColor)
            }],
            delivery_address: {
                street_address: address,
                ward: ward,
                province_city: city,
                recipient_name: name,
                recipient_phone: phone
            }
        };

        const response = await fetch(`${BASE_URL}/api/payments/confirm-from-products`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        const result = await response.json();

        if (response.ok) {
            alert("Đặt hàng thành công! Cảm ơn bạn đã tin dùng Biti's.");
            window.location.href = 'index.html';
        } else {
            alert("Lỗi đặt hàng: " + (result.detail || result.message || "Không thể xử lý"));
        }
    } catch (error) {
        console.error("Buy now error:", error);
        alert("Lỗi: " + error.message);
    } finally {
        if (confirmBtn) {
            confirmBtn.disabled = false;
            confirmBtn.innerText = 'XÁC NHẬN ĐẶT HÀNG';
        }
    }
}

function showToast(message, type = "success") {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast-msg ${type}`;
    toast.innerHTML = `
        <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
        <span>${message}</span>
    `;
    container.appendChild(toast);

    setTimeout(() => {
        toast.remove();
    }, 3000);
}

function toggleWishlist() {
    const icon = document.getElementById('wishlist-icon');
    if (icon.classList.contains('fa-regular')) {
        icon.classList.replace('fa-regular', 'fa-solid');
        icon.style.color = '#d72128';
    } else {
        icon.classList.replace('fa-solid', 'fa-regular');
        icon.style.color = 'inherit';
    }
}

// Global exposure
window.handleBuyNow = handleBuyNow;
window.handleAddToCart = handleAddToCart;
window.closeBuyNowModal = closeBuyNowModal;
window.confirmBuyNowOrder = confirmBuyNowOrder;
window.toggleWishlist = toggleWishlist;
window.updateQty = updateQty;
window.selectDetailColor = selectDetailColor;
window.selectDetailSize = selectDetailSize;
