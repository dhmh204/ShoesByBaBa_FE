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
            Toast.error("Vui lòng nhập email");
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/forgot-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: userEmail })
            });

    messageEl.innerText = message;

            if (response.ok || result.code === "200") {
                Toast.success("Mã OTP đã được gửi đến email của bạn!");
                showStep(2); // Chuyển sang bước 2
            } else {
                Toast.error("Lỗi: " + (result.message || "Không thể gửi mã"));
            }
        } catch (error) {
            console.error("Error:", error);
            Toast.error("Lỗi kết nối đến server.");
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
            Toast.error("Vui lòng nhập đủ 6 số OTP");
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
            Toast.error("Mật khẩu xác nhận không khớp!");
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
                Toast.success("Đổi mật khẩu thành công!");
                setTimeout(() => window.location.href = "login.html", 2000);
            } else {
                Toast.error("Lỗi: " + result.message);
                if (result.message.toLowerCase().includes("otp")) showStep(2);
            }

            try {
                const response = await fetch(`${API_BASE_URL}/forgot-password`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: userEmail })
                });

                const result = await response.json();

                if (response.ok || result.code === "200") {
                    showModal("📩 Mã OTP đã được gửi đến email của bạn!", () => {
                        showStep(2);
                    });
                } else {
                    showModal("❌ " + (result.message || "Không thể gửi mã OTP"));
                }
            } catch (error) {
                console.error(error);
                showModal("⚠️ Không thể kết nối đến máy chủ");
            }
        });
    }

    // VERIFY OTP
    const btnVerifyOtp = document.querySelector('.btn-confirm');
    if (btnVerifyOtp) {
        btnVerifyOtp.addEventListener('click', function () {
            const inputs = document.querySelectorAll('.otp-inputs input');
            userOTP = Array.from(inputs).map(i => i.value).join('');

            if (userOTP.length < 6) {
                showModal("Vui lòng nhập đủ 6 số OTP");
                return;
            }

            showStep(3);
        });
    }

    // RESET PASSWORD
    const resetPassForm = document.getElementById('recoverPass');
    if (resetPassForm) {
        resetPassForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const newPass = document.getElementById('current_pass').value;
            const confirmPass = document.getElementById('new_pass').value;

            if (newPass !== confirmPass) {
                showModal("❌ Mật khẩu xác nhận không khớp!");
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

                if (response.ok || result.code === "200") {
                    showModal("🎉 Đổi mật khẩu thành công!", () => {
                        window.location.href = "login.html";
                    });
                } else {
                    showModal("❌ " + (result.message || "Đổi mật khẩu thất bại"));
                    if (result.message?.toLowerCase().includes("otp")) {
                        showStep(2);
                    }
                }
            } catch (error) {
                console.error(error);
                showModal("⚠️ Không thể kết nối đến máy chủ");
            }
        });
    }

    // OTP INPUT UX
    const otpInputs = document.querySelectorAll('.otp-inputs input');
    otpInputs.forEach((input, index) => {
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                if (index < otpInputs.length - 1) {
                    otpInputs[index + 1].focus();
                } else {
                    document.querySelector('.btn-confirm')?.click();
                }
            }

            if (e.key === 'Backspace' && !input.value && index > 0) {
                otpInputs[index - 1].focus();
            }
        });

        input.addEventListener('input', () => {
            if (input.value && index < otpInputs.length - 1) {
                otpInputs[index + 1].focus();
            }
        });

        input.addEventListener('paste', (e) => {
            e.preventDefault();
            const data = e.clipboardData.getData('text').trim();
            if (!/^\d+$/.test(data)) return;

            data.split('').forEach((char, i) => {
                if (otpInputs[index + i]) {
                    otpInputs[index + i].value = char;
                }
            });

            const nextFocus = Math.min(index + data.length, otpInputs.length - 1);
            otpInputs[nextFocus].focus();
        });
    });
});

/* ================= STEP UI ================= */
function showStep(step) {
    const step1 = document.querySelector('.customers_accountForm');
    const step2 = document.querySelector('.auth-container');
    const step3 = document.querySelector('.update_account');

    step1?.classList.add('hidden');
    step2?.classList.remove('active');
    step3?.classList.remove('active');

    if (step === 2) step2?.classList.add('active');
    if (step === 3) step3?.classList.add('active');

    const steps = document.querySelectorAll('.stepper-container .step');
    steps.forEach((s, i) => {
        s.classList.toggle('active', i < step);
    });

    const progress = document.querySelector('.stepper-line-progress');
    if (progress && steps.length > 1) {
        progress.style.width = ((step - 1) / (steps.length - 1)) * 100 + "%";
    }
}
