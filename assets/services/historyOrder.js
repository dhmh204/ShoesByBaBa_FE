<<<<<<< HEAD
const ORDERS_BASE_URL = 'http://127.0.0.1:8000';

document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('token');
    if (!token) {
        alert("Vui lòng đăng nhập để xem lịch sử đơn hàng!");
        window.location.href = 'login.html';
        return;
    }

    try {
        const response = await fetch(`${ORDERS_BASE_URL}/api/orders`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        const result = await response.json();

        if (response.ok) {
            renderOrders(result.items || []);
            // Update sidebar name
            const userInfo = JSON.parse(localStorage.getItem('user_info') || '{}');
            const nameEl = document.getElementById('userName');
            if (nameEl && userInfo.full_name) {
                nameEl.innerText = userInfo.full_name;
            }
        } else if (response.status === 401) {
            alert("Phiên đăng nhập hết hạn!");
            localStorage.removeItem('token');
            window.location.href = 'login.html';
        } else {
            console.error("Lỗi tải đơn hàng:", result);
        }
    } catch (error) {
        console.error("Fetch orders error:", error);
    }
});

function renderOrders(orders) {
    const tableBody = document.querySelector('.table-customers tbody');
    if (!tableBody) return;

    if (orders.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="5" class="text-center">Bạn chưa có đơn hàng nào.</td></tr>';
        return;
    }

    tableBody.innerHTML = orders.map(order => `
        <tr class="order-row">
            <td class="text-center">
                <a href="#" onclick="showOrderDetail(${order.id}); return false;">#${order.id}</a>
            </td>
            <td class="text-center">
                <span>${new Date(order.created_at).toLocaleString('vi-VN')}</span>
            </td>
            <td class="text-right">
                <span class="total money">${order.total_amount.toLocaleString('vi-VN')} ₫</span>
            </td>
            <td class="text-center">
                <span class="status status-${order.payment_status.toLowerCase()}">${formatPaymentStatus(order.payment_status)}</span>
            </td>
            <td class="text-center">
                <span class="delivery status-${order.status.toLowerCase()}">${formatOrderStatus(order.status)}</span>
                ${order.status.toLowerCase() === 'delivered' ? 
                    `<br><a href="reviews.html?product_id=${order.items[0]?.product_id}" class="btn-rate-mini">Đánh giá</a>` : ''}
            </td>
        </tr>
    `).join('');
}

function formatPaymentStatus(status) {
    const map = {
        'pending': 'Chờ thanh toán',
        'paid': 'Đã thanh toán',
        'failed': 'Thanh toán lỗi'
    };
    return map[status.toLowerCase()] || status;
}

function formatOrderStatus(status) {
    const map = {
        'pending': 'Đang xử lý',
        'confirmed': 'Đã xác nhận',
        'shipping': 'Đang giao hàng',
        'delivered': 'Đã giao hàng',
        'cancelled': 'Đã hủy'
    };
    return map[status.toLowerCase()] || status;
}

async function showOrderDetail(orderId) {
    // Basic implementation - can be expanded later
    alert("Chi tiết đơn hàng #" + orderId + " đang được phát triển.");
}
=======
document.addEventListener('DOMContentLoaded', function () {
    const tableBody = document.querySelector('.table-customers tbody');
    const token = localStorage.getItem('token'); // Lấy token từ localStorage

    // Kiểm tra nếu chưa đăng nhập thì chuyển hướng hoặc báo lỗi
    if (!token) {
        console.error("Người dùng chưa đăng nhập!");
        // window.location.href = "login.html"; 
        return;
    }

    async function fetchOrderHistory() {
        try {
            const response = await fetch('http://localhost:8000/api/orders?page=1&limit=10', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`, // Gửi token theo chuẩn Bearer
                    'Content-Type': 'application/json'
                }
            });

            const result = await response.json();

            if (response.ok) {
                renderOrders(result.orders); // Giả sử API trả về object có field 'orders'
            } else {
                console.error("Lỗi lấy dữ liệu:", result.message);
            }
        } catch (error) {
            console.error("Lỗi kết nối API:", error);
        }
    }

    function renderOrders(orders) {
        // Xóa dữ liệu mẫu hiện có trong bảng
        tableBody.innerHTML = '';

        if (orders.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="5" class="text-center">Bạn chưa có đơn hàng nào.</td></tr>';
            return;
        }

        orders.forEach(order => {
            const row = `
                <tr data-id="${order.id}">
                    <td class="text-center"><span class="id_order">#${order.order_number}</span></td>
                    <td class="text-center"><span class="date_order">${formatDate(order.created_at)}</span></td>
                    <td class="text-right"><span class="total_money">${formatCurrency(order.total_amount)}</span></td>
                    <td class="text-center"><span class="status">${order.payment_status}</span></td>
                    <td class="text-center"><span class="delivery">${order.shipping_status}</span></td>
                </tr>
            `;
            tableBody.insertAdjacentHTML('beforeend', row);
        });
    }

    // Hàm hỗ trợ định dạng tiền tệ (Ví dụ: 1295000 -> 1,295,000 ₫)
    function formatCurrency(amount) {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
    }

    // Hàm hỗ trợ định dạng ngày tháng
    function formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleString('vi-VN');
    }

    fetchOrderHistory();
});
>>>>>>> 1dd9b37 (update)
