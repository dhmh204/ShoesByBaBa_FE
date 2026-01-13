document.addEventListener("DOMContentLoaded", () => {
    let userEmail = "";
    let tempOTP = ""; 
    const API_BASE_URL = "http://127.0.0.1:8000";

    const notify = (msg, type = "success") => {
        if (typeof Toast !== 'undefined') {
            type === "success" ? Toast.success(msg) : Toast.error(msg);
        } else {
            alert(msg);
        }
    };

    /* ================= BƯỚC 1: GỬI EMAIL QUÊN MẬT KHẨU ================= */
    const recoverForm = document.querySelector('.customers_accountForm form');
    if (recoverForm) {
        recoverForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            userEmail = document.getElementById('recover-email').value.trim();
            if (!userEmail) return notify("Vui lòng nhập email", "error");

            try {
                const response = await fetch(`${API_BASE_URL}/forgot-password`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: userEmail })
                });
                const result = await response.json();

                if (result.code === "200") {
                    notify("Mã OTP đã được gửi!");
                    showStep(2);
                } else {
                    notify(result.message, "error");
                }
            } catch (err) { notify("Lỗi kết nối server", "error"); }
        });
    }

    /* ================= BƯỚC 2: XÁC THỰC OTP (PHÙ HỢP VỚI API MỚI) ================= */
    const btnVerifyOtp = document.querySelector('.btn-confirm') || document.querySelector('.btn-auth');
    if (btnVerifyOtp) {
        btnVerifyOtp.addEventListener('click', async function() {
            const inputs = document.querySelectorAll('.otp-inputs input');
            const currentOTP = Array.from(inputs).map(i => i.value).join('');

            if (currentOTP.length < 6) {
                return notify("Vui lòng nhập đủ 6 số", "error");
            }

            try {
                const response = await fetch(`${API_BASE_URL}/verify-otp?is_register=false`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        email: userEmail, 
                        otp: currentOTP 
                    })
                });
                const result = await response.json();

                if (result.code === "200") {
                    tempOTP = currentOTP; 
                    notify("Xác thực OTP thành công!");
                    showStep(3); 
                } else {
                    notify(result.message || "Mã OTP không chính xác!", "error");
                }
            } catch (err) {
                notify("Lỗi kết nối khi xác thực OTP", "error");
            }
        });
    }

    /* ================= BƯỚC 3: ĐỔI MẬT KHẨU ================= */
    const resetPassForm = document.getElementById('recoverPass');
    if (resetPassForm) {
        resetPassForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const newPass = document.getElementById('current_pass').value;
            const confirmPass = document.getElementById('new_pass').value;

            if (newPass !== confirmPass) return notify("Mật khẩu xác nhận không khớp", "error");
            if (!tempOTP) return notify("OTP chưa được xác thực", "error");

            try {
                const response = await fetch(`${API_BASE_URL}/reset-password-otp`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        email: userEmail,
                        otp: tempOTP, 
                        new_password: newPass
                    })
                });
                const result = await response.json();

                if (result.code === "200") {
                    notify("🎉 Mật khẩu đã được cập nhật!");
                    setTimeout(() => window.location.href = "login.html", 2000);
                } else {
                    notify(result.message || "Lỗi cập nhật mật khẩu", "error");
                }
            } catch (err) { 
                notify("Lỗi kết nối máy chủ", "error"); 
            }
        });
    }

    const otpInputs = document.querySelectorAll('.otp-inputs input');
    otpInputs.forEach((input, index) => {
        input.addEventListener('input', () => {
            if (input.value && index < otpInputs.length - 1) otpInputs[index + 1].focus();
        });
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Backspace' && !input.value && index > 0) otpInputs[index - 1].focus();
        });
    });
});

function showStep(step) {
    const s1 = document.querySelector('.customers_accountForm');
    const s2 = document.querySelector('.auth-container');
    const s3 = document.querySelector('.update_account');

    if (s1) s1.style.display = (step === 1) ? 'block' : 'none';
    if (s2) s2.style.display = (step === 2) ? 'block' : 'none';
    if (s3) s3.style.display = (step === 3) ? 'block' : 'none';

    const steps = document.querySelectorAll('.stepper-container .step');
    steps.forEach((s, i) => s.classList.toggle('active', i < step));
    
    const progress = document.querySelector('.stepper-line-progress');
    if (progress) progress.style.width = ((step - 1) / (steps.length - 1)) * 100 + "%";
}