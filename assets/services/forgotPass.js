let userEmail = "";
let userOTP = "";
const API_BASE_URL = "http://127.0.0.1:8000";

// --- 1. BƯỚC 1: GỬI EMAIL ---
const recoverForm = document.querySelector('.customers_accountForm form');
if (recoverForm) {
    recoverForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        userEmail = document.getElementById('recover-email').value.trim();

        if (!userEmail) {
            alert("Vui lòng nhập email");
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/forgot-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: userEmail })
            });

            const result = await response.json();

            if (response.ok || result.code === "200") {
                alert("Mã OTP đã được gửi!");
                showStep(2); // Chuyển sang bước 2
            } else {
                alert("Lỗi: " + (result.message || "Không thể gửi mã"));
            }
        } catch (error) {
            console.error("Error:", error);
            alert("Lỗi kết nối đến server.");
        }
    });
}

// --- 2. BƯỚC 2: XÁC THỰC OTP ---
const btnVerifyOtp = document.querySelector('.btn-auth');
if (btnVerifyOtp) {
    btnVerifyOtp.addEventListener('click', function() {
        const inputs = document.querySelectorAll('.otp-inputs input');
        userOTP = Array.from(inputs).map(i => i.value).join('');

        if (userOTP.length < 6) {
            alert("Vui lòng nhập đủ 6 số OTP");
            return;
        }
        showStep(3); // Chuyển sang bước 3
    });
}

// --- 3. BƯỚC 3: ĐỔI MẬT KHẨU ---
const resetPassForm = document.getElementById('recoverPass');
if (resetPassForm) {
    resetPassForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const newPass = document.getElementById('current_pass').value;
        const confirmPass = document.getElementById('new_pass').value;

        if (newPass !== confirmPass) {
            alert("Mật khẩu xác nhận không khớp!");
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/reset-password-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: userEmail,
                    otp: userOTP,
                    new_password: newPass
                })
            });

            const result = await response.json();
            if (result.code === "200") {
                alert("Đổi mật khẩu thành công!");
                window.location.href = "login.html";
            } else {
                alert("Lỗi: " + result.message);
                if (result.message.toLowerCase().includes("otp")) showStep(2);
            }
        } catch (error) {
            console.error("Error:", error);
        }
    });
}

/**
 * HÀM ĐIỀU KHIỂN HIỂN THỊ (FIX THEO CSS CỦA BẠN)
 * Bước 1 dùng .hidden
 * Bước 2, 3 dùng .active
 */
function showStep(step) {
    const step1Box = document.querySelector('.customers_accountForm');
    const step2Box = document.querySelector('.auth-container');
    const step3Box = document.querySelector('.update_account');

    // 1. Reset trạng thái
    if (step1Box) step1Box.classList.remove('hidden');
    if (step2Box) step2Box.classList.remove('active');
    if (step3Box) step3Box.classList.remove('active');

    // 2. Kích hoạt đúng box theo bước
    if (step === 1) {
        // Mặc định hiện step 1
    } else if (step === 2) {
        if (step1Box) step1Box.classList.add('hidden'); // Ẩn bước 1
        if (step2Box) step2Box.classList.add('active'); // Hiện bước 2
    } else if (step === 3) {
        if (step1Box) step1Box.classList.add('hidden'); // Ẩn bước 1
        if (step3Box) step3Box.classList.add('active'); // Hiện bước 3
    }

    // 3. Cập nhật Stepper (Dấu chấm tiến trình)
    const steps = document.querySelectorAll('.stepper-container .step');
    steps.forEach((s, index) => {
        if (index < step) s.classList.add('active');
        else s.classList.remove('active');
    });

    // 4. Cập nhật thanh line chạy
const progressLine = document.querySelector('.stepper-line-progress');
if (progressLine) {
    // Nếu ở bước 1 thì 0%, bước 2 thì 50%, bước 3 thì 100%
    const totalSteps = steps.length;
    let percent = 0;
    
    if (step > 1) {
        percent = ((step - 1) / (totalSteps - 1)) * 100;
    }

    progressLine.style.width = percent + "%";
}
}
// ====================================
const otpInputs = document.querySelectorAll('.otp-inputs input');

otpInputs.forEach((input, index) => {
    // 1. Nhấn Enter để sang ô tiếp theo
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            if (index < otpInputs.length - 1) {
                otpInputs[index + 1].focus();
            } else {
                // Nếu là ô cuối cùng thì kích hoạt nút xác nhận
                document.querySelector('.btn-auth').click();
            }
        }
        
        // Nhấn Backspace để quay lại ô trước
        if (e.key === 'Backspace' && !input.value && index > 0) {
            otpInputs[index - 1].focus();
        }
    });

    // 2. Tự động nhảy ô khi nhập số
    input.addEventListener('input', (e) => {
        if (e.target.value && index < otpInputs.length - 1) {
            otpInputs[index + 1].focus();
        }
    });

    // 3. Xử lý DÁN MÃ (PASTE)
    input.addEventListener('paste', (e) => {
        e.preventDefault();
        const data = e.clipboardData.getData('text').trim();
        if (!/^\d+$/.test(data)) return; // Chỉ nhận số

        const chars = data.split('');
        chars.forEach((char, i) => {
            if (otpInputs[index + i]) {
                otpInputs[index + i].value = char;
            }
        });

        // Focus vào ô tiếp theo sau khi dán hoặc ô cuối cùng
        const nextFocus = Math.min(index + chars.length, otpInputs.length - 1);
        otpInputs[nextFocus].focus();
    });
});

