document.addEventListener('DOMContentLoaded', function () {
    const container = document.getElementById('order-history-container');
    const token = localStorage.getItem('token');

    if (!token) {
        if (container) {
            container.innerHTML = '<div class="text-center p-5"><p>Vui lòng đăng nhập để xem lịch sử đơn hàng.</p><a href="login.html" class="btn-action btn-primary-action">Đăng nhập ngay</a></div>';
        }
        return;
    }

    const statusMap = {
        'pending': { text: 'Chờ xác nhận', class: 'status-pending' },
        'processing': { text: 'Đang xử lý', class: 'status-processing' },
        'shipped': { text: 'Đang giao hàng', class: 'status-shipped' },
        'delivered': { text: 'Đã giao', class: 'status-delivered' },
        'cancelled': { text: 'Đã hủy', class: 'status-cancelled' }
    };

    const paymentStatusMap = {
        'pending': 'Chưa thanh toán',
        'completed': 'Đã thanh toán',
        'failed': 'Thanh toán thất bại',
        'refunded': 'Đã hoàn tiền'
    };

    async function fetchOrderHistory() {
        try {
            // Determine limit based on page
            const isProfilePage = window.location.pathname.includes('settingAccount.html');
            const limit = isProfilePage ? 5 : 20;

            const response = await fetch(`http://localhost:8000/api/orders?page=1&limit=${limit}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            const result = await response.json();

            if (response.ok) {
                renderOrders(result.orders);
            } else {
                container.innerHTML = `<div class="text-center p-5"><p class="text-danger">Lỗi: ${result.message || "Không thể tải dữ liệu"}</p></div>`;
            }
        } catch (error) {
            console.error("Lỗi kết nối API:", error);
            container.innerHTML = '<div class="text-center p-5"><p class="text-danger">Không thể kết nối tới máy chủ. Vui lòng thử lại sau.</p></div>';
        }
    }

    function renderOrders(orders) {
        if (!container) return;
        container.innerHTML = '';

        if (!orders || orders.length === 0) {
            container.innerHTML = '<div class="text-center p-5"><img src="https://cdni.iconscout.com/illustration/premium/thumb/empty-cart-2130356-1800917.png" style="width: 200px; opacity: 0.5;" /><p class="mt-3">Bạn chưa có đơn hàng nào.</p><a href="collections.html" class="btn-action btn-primary-action">Mua sắm ngay</a></div>';
            return;
        }

        orders.forEach(order => {
            const statusInfo = statusMap[order.status] || { text: order.status, class: '' };
            const paymentText = paymentStatusMap[order.payment_status] || order.payment_status;

            let itemsHtml = '';
            order.items.forEach(item => {
                const imgUrl = item.product_image || 'assets/images/no-image.png';
                itemsHtml += `
                    <div class="order-item">
                        <div class="item-image">
                            <img src="${imgUrl}" alt="${item.product_name}" onerror="this.src='https://file.hstatic.net/200000525917/file/no-image_1024x1024.png'">
                        </div>
                        <div class="item-info">
                            <div class="item-name">${item.product_name}</div>
                            <div class="item-variant">Phân loại: ${item.color || 'Mặc định'}, Size: ${item.size || 'N/A'}</div>
                            <div class="item-quantity">x${item.quantity}</div>
                        </div>
                        <div class="item-price">${formatCurrency(item.price_at_purchase)}</div>
                    </div>
                `;
            });

            const orderCard = `
                <div class="order-card" data-id="${order.id}">
                    <div class="order-header">
                        <div class="order-id-group">
                            <span class="order-id">Mã đơn hàng: #${order.id}</span>
                            <span class="order-date">| ${formatDate(order.created_at)}</span>
                        </div>
                        <div class="order-status">
                            <span class="status-badge ${statusInfo.class}">${statusInfo.text}</span>
                        </div>
                    </div>
                    <div class="order-items">
                        ${itemsHtml}
                    </div>
                    <div class="order-footer">
                        <div class="order-total">
                            <span class="total-label"><i class="fa fa-shield"></i> Thành tiền:</span>
                            <span class="total-amount">${formatCurrency(order.total_amount)}</span>
                        </div>
                        <div class="order-actions">
                            <button class="btn-action" onclick="Toast.info('Tính năng đang được phát triển!')">Liên hệ người bán</button>
                            <button class="btn-action btn-primary-action" onclick="window.location.href='productDetails.html?id=${order.items[0]?.product_id}'">Mua lại</button>
                        </div>
                    </div>
                </div>
            `;
            container.insertAdjacentHTML('beforeend', orderCard);
        });
    }

    function formatCurrency(amount) {
        return new Intl.NumberFormat('vi-VN', { 
            style: 'currency', 
            currency: 'VND' 
        }).format(amount);
    }

    function formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleString('vi-VN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    fetchOrderHistory();
});
