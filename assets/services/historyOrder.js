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
                    <td class="text-center"><span class="id_order">#${order.id}</span></td>
                    <td class="text-center"><span class="date_order">${formatDate(order.created_at)}</span></td>
                    <td class="text-right"><span class="total_money">${formatCurrency(order.total_amount)}</span></td>
                    <td class="text-center"><span class="status">${order.payment_status}</span></td>
                    <td class="text-center"><span class="delivery">${order.status}</span></td>
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