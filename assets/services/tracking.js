function updateProgressUI(status) {
    const statusSteps = ['pending', 'processing', 'shipped', 'delivered'];
    const currentIndex = statusSteps.indexOf(status.toLowerCase());
    
    console.log("Cập nhật trạng thái giao diện sang:", status);
}

async function trackOrder() {
    const orderIdInput = document.getElementById('orderId').value.trim();
    const resultSection = document.getElementById('resultSection');
    const token = localStorage.getItem('token');

    if (!token) {
        Toast.error("Vui lòng đăng nhập để tra cứu!");
        return;
    }

    const orderId = orderIdInput.replace('#', '');
    if (!orderId) {
        Toast.error("Vui lòng nhập mã đơn hàng");
        return;
    }

    try {
        const response = await fetch(`http://127.0.0.1:8000/api/orders/${orderId}`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            const errorData = await response.json();
            Toast.error(errorData.detail || "Không tìm thấy đơn hàng.");
            return;
        }

        const order = await response.json();
        resultSection.style.display = 'block';

        // --- XỬ LÝ ĐỊA CHỈ ---
        let addressInfo = {};
        try {
            addressInfo = typeof order.delivery_address === 'string' 
                ? JSON.parse(order.delivery_address) 
                : (order.delivery_address || {});
        } catch (e) {
            console.error("Lỗi parse địa chỉ:", e);
        }

        const addressParts = [
            addressInfo.street_address,
            addressInfo.ward,
            addressInfo.province_city
        ].filter(part => part && part !== "string" && part.trim() !== "");

        const fullAddress = addressParts.length > 0 ? addressParts.join(", ") : "N/A";

        const detailCards = document.querySelectorAll('.detail-card');
        
       detailCards[0].innerHTML = `
            <h3>Thông tin nhận hàng</h3>
            <p><strong>Người nhận:</strong> ${addressInfo.recipient_name || 'N/A'}</p>
            <p><strong>Điện thoại:</strong> ${addressInfo.recipient_phone || 'N/A'}</p>
            <p><strong>Địa chỉ:</strong> ${fullAddress}</p>
            <p><strong>Trạng thái:</strong> <span class="status-badge">${order.status}</span></p>
        `;

        let itemsHtml = '<h3>Sản phẩm</h3>';
        if (order.items && Array.isArray(order.items)) {
            order.items.forEach(item => {
                const price = parseFloat(item.price) || 0; 
                itemsHtml += `
                    <div class="item-mini" style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                        <span>x${item.quantity} ${item.product_name}</span>
                        <span class="price">${item.price_at_purchase.toLocaleString()} VNĐ</span>
                    </div>`;
            });
        }

        const totalAmount = parseFloat(order.total_amount) || 0;
        itemsHtml += `
            <div class="divider" style="border-top: 1px solid #eee; margin: 10px 0;"></div>
            <div class="total-row" style="display: flex; justify-content: space-between;">
                <strong>Tổng tiền:</strong>
                <strong class="total-price" style="color: red;">${totalAmount.toLocaleString()} VNĐ</strong>
            </div>`;
        
        detailCards[1].innerHTML = itemsHtml;

        updateProgressUI(order.status);

    } catch (error) {
        console.error("Lỗi kết nối:", error);
        Toast.error("Có lỗi xảy ra khi kết nối máy chủ.");
    }
}