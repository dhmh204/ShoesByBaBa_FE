document.addEventListener('DOMContentLoaded', function () {
    const changePasswordForm = document.getElementById('extraInfo');
    const errorDiv = document.getElementById('error');
    const infoDiv = document.getElementById('info');

    if (changePasswordForm) {
        changePasswordForm.addEventListener('submit', async function (e) {
            e.preventDefault();

            // 1. Lấy dữ liệu từ input
            const currentPassword = document.getElementById('current_pass').value;
            const newPassword = document.getElementById('new_pass').value;
            const verifyNewPassword = document.getElementById('verify_new_pass').value;
            const token = localStorage.getItem('token');

            // Reset trạng thái thông báo
            errorDiv.classList.add('d-none');
            infoDiv.classList.add('d-none');

            // 2. Kiểm tra logic Client
            if (!token) {
                showError("Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.");
                return;
            }

            if (newPassword !== verifyNewPassword) {
                showError("Xác thực mật khẩu mới không khớp!");
                return;
            }

            try {
                // Lưu ý: Kiểm tra URL này có cần /auth/ phía trước không (ví dụ: http://localhost:8000/auth/change-password)
                const response = await fetch('http://localhost:8000/change-password', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        current_password: currentPassword, 
                        new_password: newPassword
                    })
                });

                const result = await response.json();

                // Kiểm tra mã code trả về từ Backend (result.code)
                if (result.code === "200") {
                    // --- THAY ĐỔI TẠI ĐÂY ---
                    showInfo("Đổi mật khẩu thành công!");
                    
                    // Giữ nguyên Token, chỉ chuyển hướng trang sau 2 giây
                    setTimeout(() => {
                        window.location.href = "settingAccount.html";
                    }, 2000);
                } else {
                    // Nếu lỗi (Ví dụ: sai mật khẩu cũ)
                    showError(result.message || "Đổi mật khẩu không thành công.");
                }

            } catch (error) {
                console.error("Lỗi:", error);
                showError("Không thể kết nối tới máy chủ.");
            }
        });
    }

    function showError(message) {
        errorDiv.textContent = message;
        errorDiv.classList.remove('d-none');
        infoDiv.classList.add('d-none');
    }

    function showInfo(message) {
        infoDiv.textContent = message;
        infoDiv.classList.remove('d-none');
        errorDiv.classList.add('d-none');
        // Thêm màu xanh cho thông báo thành công (nếu cần)
        infoDiv.style.backgroundColor = "#d4edda";
        infoDiv.style.color = "#3FFF00";
        infoDiv.style.borderColor = "#c3e6cb";
    }
});