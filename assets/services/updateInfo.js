document.addEventListener('DOMContentLoaded', async function() {
    // 1. Gọi API để lấy thông tin cá nhân hiện tại
    try {
        const response = await fetch('http://127.0.0.1:8000/profile', { // Giả định endpoint lấy profile là /users/me
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (response.ok) {
            const res = await response.json();
            const userData = res.data; // Tùy vào cấu trúc response của bạn

            // 2. Điền dữ liệu vào các ô input
            if (userData) {
                document.getElementById('last_name').value = userData.full_name || "";
                document.getElementById('email').value = userData.email || "";
                document.getElementById('phone_ac').value = userData.phone_number || "";
                document.getElementById('city').value = userData.province_city || "";
                document.getElementById('ward').value = userData.ward || "";
                document.getElementById('address_detail').value = userData.street_address || "";
            }
        } else {
            console.error("Không thể lấy thông tin người dùng");
        }
    } catch (err) {
        console.error("Lỗi khi tải thông tin:", err);
    }
});

// 2. Phần xử lý Submit Form (Giữ nguyên logic của bạn nhưng tối ưu hơn)
document.getElementById('extraInfo').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const formData = {
        full_name: document.getElementById('last_name').value,
        email: document.getElementById('email').value,
        phone_number: document.getElementById('phone_ac').value,
        province_city: document.getElementById('city').value,
        ward: document.getElementById('ward').value,
        street_address: document.getElementById('address_detail').value
    };

    try {
        const response = await fetch('http://127.0.0.1:8000/update-profile', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify(formData)
        });

        const result = await response.json();
        
        const errorDiv = document.getElementById('error');
        if (response.ok) {
            Toast.success("Cập nhật thông tin thành công!");
            errorDiv.classList.add('d-none');
        } else {
            errorDiv.classList.remove('d-none');
            // Hiển thị lỗi chi tiết từ Backend (ví dụ: Email đã tồn tại)
            errorDiv.innerText = result.detail || "Có lỗi xảy ra";
        }
    } catch (err) {
        console.error("Lỗi kết nối:", err);
    }
});