const CART_BASE_URL = 'http://127.0.0.1:8000';

document.addEventListener('DOMContentLoaded', () => {
    loadFullCart();
});

async function loadFullCart() {
    const token = localStorage.getItem('token');
    const itemsWrapper = document.getElementById('cart-items-wrapper');
    const cartCountLabel = document.getElementById('cart-count-label');
    const subtotalEl = document.getElementById('cart-subtotal');
    const totalEl = document.getElementById('cart-total-final');

    if (!token) {
        itemsWrapper.innerHTML = `
            <div class="text-center py-5">
                <i class="fas fa-shopping-cart mb-3" style="font-size: 48px; color: #ccc;"></i>
                <p>Vui lòng đăng nhập để xem giỏ hàng</p>
                <a href="login.html" class="btn btn-dark mt-3">Đăng nhập ngay</a>
            </div>`;
        return;
    }

    try {
        const response = await fetch(`${CART_BASE_URL}/api/cart`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const result = await response.json();

        if (response.ok) {
            const items = result.items || [];
            cartCountLabel.innerText = items.length;

            if (items.length === 0) {
                itemsWrapper.innerHTML = `
                    <div class="text-center py-5">
                        <i class="fas fa-box-open mb-3" style="font-size: 48px; color: #ccc;"></i>
                        <p>Giỏ hàng của bạn đang trống</p>
                        <a href="index.html" class="btn btn-dark mt-3">Tiếp tục mua sắm</a>
                    </div>`;
                subtotalEl.innerText = '0 ₫';
                totalEl.innerText = '0 ₫';
                return;
            }

            // Render Full Cart Items
            itemsWrapper.innerHTML = items.map(item => `
                <div class="cart-item-row row align-items-center">
                    <div class="col-lg-5 col-md-5 col-12 d-flex align-items-center mb-2 mb-md-0">
                        <div class="item-img">
                            <img src="${item.product_image || 'https://theme.hstatic.net/1000230642/1001205219/14/no-image.jpg'}" 
                                 alt="${item.product_name}">
                        </div>
                        <div class="item-info">
                            <a href="productDetails.html?id=${item.product_id}" class="item-name">${item.product_name}</a>
                            <p class="item-variant">Màu: ${item.color} / Size: ${item.size}</p>
                            <span class="btn-remove" onclick="removeFromCart(${item.id})" style="cursor: pointer; color: #999; font-size: 13px;">
                                <i class="fas fa-trash-alt"></i> Xóa
                            </span>
                        </div>
                    </div>
                    <div class="col-lg-2 col-md-2 col-4 text-center">
                        <span class="item-price">${item.current_price.toLocaleString('vi-VN')} ₫</span>
                    </div>
                    <div class="col-md-3 col-4 d-flex justify-content-center align-items-center">
                        <div class="qty-control">
                            <button type="button" onclick="updateItemQty(${item.product_id}, -1, '${item.color}', ${item.size})">-</button>
                            <input type="text" value="${item.quantity}" readonly>
                            <button type="button" onclick="updateItemQty(${item.product_id}, 1, '${item.color}', ${item.size})">+</button>
                        </div>
                    </div>
                    <div class="col-lg-2 col-md-2 col-4 text-center">
                        <span class="item-total-price">${(item.subtotal || (item.current_price * item.quantity)).toLocaleString('vi-VN')} ₫</span>
                    </div>
                </div>
            `).join('');

            const total = result.total_amount || items.reduce((sum, item) => sum + (item.current_price * item.quantity), 0);
            subtotalEl.innerText = total.toLocaleString('vi-VN') + ' ₫';
            totalEl.innerText = total.toLocaleString('vi-VN') + ' ₫';

        } else {
            itemsWrapper.innerHTML = `<div class="text-center py-5 text-danger">Lỗi: ${result.message || 'Không thể tải giỏ hàng'}</div>`;
        }
    } catch (error) {
        console.error("Cart Loading Error:", error);
        itemsWrapper.innerHTML = `<div class="text-center py-5 text-danger">Lỗi kết nối Server!</div>`;
    }
}

async function updateItemQty(productId, delta, color, size) {
    const token = localStorage.getItem('token');

    // Disable all buttons to prevent double clicks during loading
    const buttons = document.querySelectorAll('.qty-control button');
    buttons.forEach(btn => btn.disabled = true);

    try {
        console.log("Adding delta to cart:", { productId, delta, color, size });
        const response = await fetch(`${CART_BASE_URL}/api/cart/items`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                product_id: parseInt(productId),
                quantity: parseInt(delta), // Send +1 or -1
                color: String(color),
                size: parseInt(size)
            })
        });

        if (response.ok) {
            await loadFullCart();
            if (typeof updateHeaderCart === 'function') updateHeaderCart();
        } else {
            const err = await response.json();
            let errMsg = err.detail || err.message || "Không thể cập nhật số lượng";
            if (errMsg.includes("Insufficient stock")) {
                const match = errMsg.match(/\d+/);
                const available = match ? match[0] : "";
                Toast.error(`Sản phẩm này hiện chỉ còn ${available} đôi trong kho!`);
            } else {
                Toast.error("Lỗi: " + errMsg);
            }
        }
    } catch (error) {
        console.error("Update Qty Error:", error);
        Toast.error("Lỗi kết nối server!");
    } finally {
        buttons.forEach(btn => btn.disabled = false);
    }
}

async function removeFromCart(itemId) {
    if (!await showConfirm("Bạn có chắc chắn muốn xóa sản phẩm này khỏi giỏ hàng?")) return;
    const token = localStorage.getItem('token');

    try {
        const response = await fetch(`${CART_BASE_URL}/api/cart/items/${itemId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            await loadFullCart();
            if (typeof updateHeaderCart === 'function') updateHeaderCart();
            Toast.success("Đã xóa sản phẩm khỏi giỏ hàng!");
        } else {
            Toast.error("Không thể xóa sản phẩm này!");
        }
    } catch (error) {
        console.error("Remove Item Error:", error);
    }
}

async function handleCheckout() {
    const token = localStorage.getItem('token');
    const name = document.getElementById('customerName').value.trim();
    const phone = document.getElementById('customerPhone').value.trim();
    const address = document.getElementById('customerAddress').value.trim();
    const ward = document.getElementById('customerWard').value.trim();
    const city = document.getElementById('customerCity').value.trim();

    if (!name || !phone || !address) {
        Toast.error("Vui lòng điền đầy đủ thông tin giao hàng (Tên, SĐT, Địa chỉ)!");
        return;
    }

    // Get Total Amount
    const cartTotalStr = document.getElementById('cart-total-final').innerText;
    const amount = parseInt(cartTotalStr.replace(/\D/g, ''));

    if (!amount || amount <= 0) {
        Toast.error("Giỏ hàng trống hoặc có lỗi về giá tiền!");
        return;
    }

    // UI Loading state
    const checkoutBtn = document.querySelector('.btn-checkout-final');
    if (checkoutBtn) {
        checkoutBtn.disabled = true;
        checkoutBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang xử lý...';
    }

    try {
        // STEP 1: Create Payment Intent
        const intentRes = await fetch(`${CART_BASE_URL}/api/payments/create-intent?amount=${amount}`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const intentData = await intentRes.json();
        if (!intentRes.ok) throw new Error(intentData.detail || "Không thể tạo mã thanh toán");

        const clientSecret = intentData.client_secret;

        // STEP 2: Store Order Data in Session for later confirmation
        const orderPayload = {
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
        window.location.href = `payment-stripe.html?client_secret=${clientSecret}&type=cart`;

    } catch (error) {
        console.error("Checkout error:", error);
        Toast.error("Lỗi: " + error.message);
    } finally {
        if (checkoutBtn) {
            checkoutBtn.disabled = false;
            checkoutBtn.innerText = 'THANH TOÁN';
        }
    }
}

// Expose functions globally explicitly
window.updateItemQty = updateItemQty;
window.removeFromCart = removeFromCart;
window.handleCheckout = handleCheckout;
window.loadFullCart = loadFullCart;
