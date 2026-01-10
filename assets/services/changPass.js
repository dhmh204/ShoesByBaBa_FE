document.querySelector('.btn-cancel').addEventListener('click', function () {
    window.location.href = 'login.html';
});
// ==============================

document.addEventListener('DOMContentLoaded', function () {
    const changePasswordForm = document.getElementById('extraInfo');
    const errorDiv = document.getElementById('error');
    const infoDiv = document.getElementById('info');

    if (changePasswordForm) {
        changePasswordForm.addEventListener('submit', async function (e) {
            e.preventDefault();

            const currentPassword = document.getElementById('current_pass').value;
            const newPassword = document.getElementById('new_pass').value;
            const verifyNewPassword = document.getElementById('verify_new_pass').value;
            const token = localStorage.getItem('token');

            errorDiv.classList.add('d-none');
            infoDiv.classList.add('d-none');

            if (!token) {
                showError("Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.");
                return;
            }

            if (newPassword !== verifyNewPassword) {
                showError("Xác thực mật khẩu mới không khớp!");
                return;
            }

            try {
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

                 if (result.code === "200") {
                    showInfo("Đổi mật khẩu thành công!");
                    setTimeout(() => {
                        window.location.href = "settingAccount.html";
                    }, 2000);
                } else {
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
        infoDiv.style.backgroundColor = "#d4edda";
        infoDiv.style.color = "#3FFF00";
        infoDiv.style.borderColor = "#c3e6cb";
    }
});