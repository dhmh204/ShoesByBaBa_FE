const BASE_URL = 'http://127.0.0.1:8000';
let currentProduct = null;
let selectedColor = null;
let selectedSize = null;

document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id');

    if (!productId) {
        Toast.error("Không tìm thấy ID sản phẩm!");
        setTimeout(() => window.location.href = 'index.html', 1500);
        return;
    }

    try {
        const response = await fetch(`${BASE_URL}/products/${productId}`);
        const result = await response.json();

        if (response.ok && (result.code === "200" || result.status === "success" || result.id)) {
            currentProduct = result.data || result;
            renderProductDetail(currentProduct);
            fetchAndRenderReviews(productId);
        } else {
            console.error("Lỗi API:", result);
            Toast.error("Không thể tải thông tin sản phẩm!");
        }
    } catch (error) {
        console.error("Fetch Error:", error);
        Toast.error("Lỗi kết nối Server!");
    }
});

function renderProductDetail(product) {
    // 1. Basic Info
    document.getElementById('detail-title').innerText = product.name;
    document.getElementById('detail-price').innerText = product.price.toLocaleString('vi-VN') + ' ₫';
    document.getElementById('detail-code').innerText = product.id;
    document.getElementById('detail-sold-count').innerText = `Đã bán ${product.sold_count ?? 0}`;
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
    

    const sizes = [...new Set(product.variants.map(v => v.size))].filter(Boolean).sort((a, b) => a - b);

    colorContainer.innerHTML = colors.map(color => `
        <div class="color-text-item" onclick="selectDetailColor('${color}', this)">${color}</div>
    `).join('');

    // Initalize: select first color and it will automatically render sizes
    if (colors.length > 0) {
        // Use a small delay to ensure DOM is updated before selecting color
        setTimeout(() => {
            const firstColorEl = colorContainer.querySelector('.color-text-item');
            if (firstColorEl) selectDetailColor(colors[0], firstColorEl);
        }, 50);
    } else {
        sizeContainer.innerHTML = 'N/A';
    }
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
    
    // Update sizes based on the selected color
    renderSizesByColor(color);
}

function renderSizesByColor(color) {
    const sizeContainer = document.getElementById('detail-size-container');
    if (!currentProduct || !currentProduct.variants) return;

    // Filter variants that have the selected color and get their unique sizes
    const availableSizes = [...new Set(currentProduct.variants
        .filter(v => v.color === color)
        .map(v => v.size))]
        .filter(Boolean)
        .sort((a, b) => a - b);

    sizeContainer.innerHTML = availableSizes.map(size => `
        <div class="size-item ${selectedSize == size ? 'active' : ''}" onclick="selectDetailSize('${size}', this)">${size}</div>
    `).join('');

    // If pre-selected size is not available in the new color, reset it
    if (selectedSize && !availableSizes.some(s => String(s) === String(selectedSize))) {
        selectedSize = null;
    }
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
        Toast.error("Vui lòng đăng nhập để thêm vào giỏ hàng!");
        setTimeout(() => window.location.href = 'login.html', 1500);
        return;
    }

    if (!selectedColor || !selectedSize) {
        Toast.error("Vui lòng chọn màu sắc và kích thước!");
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
            Toast.success("Đã thêm vào giỏ hàng thành công!");
            if (typeof updateHeaderCart === 'function') updateHeaderCart();
        } else {
            Toast.error(result.detail || result.message || "Không thể thêm vào giỏ hàng!");
        }
    } catch (error) {
        console.error("Add to cart error:", error);
        Toast.error("Lỗi kết nối Server!");
    }
}

function handleBuyNow() {
    const token = localStorage.getItem('token');
    if (!token) {
        Toast.error("Vui lòng đăng nhập để thực hiện mua hàng!");
        setTimeout(() => window.location.href = 'login.html', 1500);
        return;
    }

    if (!selectedColor || !selectedSize) {
        Toast.error("Vui lòng chọn màu sắc và kích thước trước khi mua!");
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
        Toast.error("Vui lòng điền đầy đủ thông tin giao hàng!");
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
        if (!intentRes.ok) throw new Error(intentData.detail || "Không thể tạo mã thanh toán");

        const clientSecret = intentData.client_secret;

        // STEP 2: Store Order Data in Session for later confirmation
        const orderPayload = {
            items: [{
                product_id: parseInt(currentProduct.id),
                quantity: qty,
                color: String(selectedColor),
                size: parseInt(selectedSize)
            }],
            delivery_address: {
                street_address: address,
                ward: ward,
                province_city: city,
                recipient_name: name,
                recipient_phone: phone
            }
        };
        sessionStorage.setItem('pending_order_payload', JSON.stringify(orderPayload));
        sessionStorage.setItem('pending_order_total', amount);

        // STEP 3: Redirect to Stripe Payment Page
        window.location.href = `payment-stripe.html?client_secret=${clientSecret}&type=buy-now`;

    } catch (error) {
        console.error("Buy Now Error:", error);
        alert("Lỗi: " + error.message);
    } finally {
        if (confirmBtn) {
            confirmBtn.disabled = false;
            confirmBtn.innerText = 'XÁC NHẬN ĐẶT HÀNG';
        }
    }
}

// Toast is now handled by global notifications.js

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

// --- REVIEWS LOGIC ---
async function fetchAndRenderReviews(productId, page = 1) {
    const size = 5;
    const reviewListContainer = document.getElementById('product-reviews-list');
    const reviewCountSpan = document.getElementById('review-count');
    const paginationContainer = document.getElementById('reviews-pagination');

    try {
        const response = await fetch(`${BASE_URL}/reviews?product_id=${productId}&page=${page}&size=${size}`);
        const result = await response.json();

        if (response.ok) {
            const reviews = result.data || [];
            const total = (result.pagination && result.pagination.total) || 0;

            reviewCountSpan.innerText = total;
            renderReviews(reviews, reviewListContainer);
            renderReviewPagination(total, size, page, productId, paginationContainer);
        } else {
            console.error("Reviews API error:", result);
            reviewListContainer.innerHTML = '<p class="no-reviews-msg">Không thể tải đánh giá lúc này.</p>';
        }
    } catch (error) {
        console.error("Fetch Reviews Error:", error);
        reviewListContainer.innerHTML = '<p class="no-reviews-msg">Lỗi kết nối khi tải đánh giá.</p>';
    }
}

function renderReviews(reviews, container) {
    if (reviews.length === 0) {
        container.innerHTML = '<p class="no-reviews-msg">Sản phẩm này chưa có đánh giá nào. Hãy là người đầu tiên đánh giá!</p>';
        return;
    }

    container.innerHTML = reviews.map(review => {
        const stars = Array(5).fill(0).map((_, i) =>
            `<i class="${i < review.rating ? 'fa-solid' : 'fa-regular'} fa-star"></i>`
        ).join('');

        const date = new Date(review.created_at).toLocaleDateString('vi-VN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        // Get initials for avatar
        const initials = review.user_name ? review.user_name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2) : '?';

        return `
            <div class="review-item">
                <div class="review-user-avatar">
                   ${initials}
                </div>
                <div class="review-content-main">
                    <div class="review-header">
                        <div>
                            <div class="review-username">${review.user_name || 'Khách hàng'}</div>
                            <div class="review-stars">${stars}</div>
                        </div>
                        <div class="review-date">${date}</div>
                    </div>
                    <div class="review-comment">
                        ${review.comment || 'Không có nhận xét.'}
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function renderReviewPagination(total, limit, currentPage, productId, container) {
    const totalPages = Math.ceil(total / limit);
    if (totalPages <= 1) {
        container.innerHTML = '';
        return;
    }

    let html = '';
    for (let i = 1; i <= totalPages; i++) {
        html += `<button class="pagination-btn ${i === currentPage ? 'active' : ''}" onclick="fetchAndRenderReviews(${productId}, ${i})">${i}</button>`;
    }
    container.innerHTML = html;
}

// Exposure
window.fetchAndRenderReviews = fetchAndRenderReviews;
