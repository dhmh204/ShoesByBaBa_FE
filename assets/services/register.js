
const inputs = document.querySelectorAll('.otp-inputs input');

inputs.forEach((input, index) => {
    input.addEventListener('paste', (e) => {
        e.preventDefault(); 
        const data = e.clipboardData.getData('text');
        const digits = data.replace(/\D/g, '').split(''); 
        digits.forEach((digit, i) => {
            if (index + i < inputs.length) {
                inputs[index + i].value = digit;
            }
        });
        const nextIndex = Math.min(index + digits.length, inputs.length - 1);
        inputs[nextIndex].focus();
    });

    input.addEventListener('input', (e) => {
        const value = e.target.value;
        if (!/^\d+$/.test(value)) {
            e.target.value = '';
        } else if (value && index < inputs.length - 1) {
        }
    });

    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            if (index < inputs.length - 1) {
                inputs[index + 1].focus();
            } else {
                document.querySelector('.btn-auth').click(); 
            }
        }
        if (e.key === 'Backspace' && !input.value && index > 0) {
            inputs[index - 1].focus();
        }
    });
});
// ---------------------------------------------

document.addEventListener('DOMContentLoaded', function () {
    const registerForm = document.getElementById('create_customer');
    const authContainer = document.querySelector('.auth-container');
    const registerBox = document.querySelector('.customers_accountForm');
    const successContainer = document.querySelector('.success-container'); 
    const otpInputs = document.querySelectorAll('.otp-inputs input');
    const btnAuth = document.querySelector('.btn-auth');
    const progressLine = document.querySelector('.stepper-line-progress');
    const steps = document.querySelectorAll('.step');

    let userEmail = ""; 
    let userPassword = "";

    otpInputs.forEach((input, index) => {
        input.addEventListener('input', (e) => {
            if (e.target.value.length > 0 && index < otpInputs.length - 1) {
                otpInputs[index + 1].focus();
            }
        });
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Backspace' && e.target.value === '' && index > 0) {
                otpInputs[index - 1].focus();
            }
        });
    });

    if (registerForm) {
        registerForm.addEventListener('submit', async function (e) {
            e.preventDefault();
            userEmail = document.getElementById('email').value;
            userPassword = document.getElementById('password').value;

            const registerData = {
                full_name: document.getElementById('last_name').value,
                email: userEmail,
                password: userPassword,
                gender: document.querySelector('input[name="customer[gender]"]:checked')?.value || "Other",
                phone_number: document.getElementById('phone').value
            };

            try {
                const response = await fetch('http://localhost:8000/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(registerData)
                });
                const result = await response.json();

                if (result.code === "201") {
                    registerBox.style.display = 'none';
                    authContainer.style.display = 'block';

                    steps[0].classList.remove('active');
                    steps[0].classList.add('completed');
                    steps[0].querySelector('.step-circle').innerHTML = '<span class="check-icon"></span>';
                    steps[1].classList.add('active');

                    alert("Mã OTP đã được gửi đến email của bạn.");
                } else {
                    alert("Lỗi: " + result.message);
                }
            } catch (error) {
                alert("Không thể kết nối tới máy chủ.");
            }
        });
    }

    if (btnAuth) {
        btnAuth.addEventListener('click', async function () {
            const otpValue = Array.from(otpInputs).map(input => input.value).join('');

            if (otpValue.length < 6) {
                alert("Vui lòng nhập đủ 6 số OTP.");
                return;
            }

            try {
                const verifyRes = await fetch('http://localhost:8000/verify-otp', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: userEmail, otp: otpValue })
                });
                const verifyResult = await verifyRes.json();

                if (verifyResult.code === "200") {
                    authContainer.style.display = 'none'; 
                    if (successContainer) successContainer.style.display = 'block'; 

                    steps[1].classList.remove('active');
                    steps[1].classList.add('completed');
                    steps[1].querySelector('.step-circle').innerHTML = '<span class="check-icon"></span>';
                    steps[2].classList.add('completed');
                    steps[2].querySelector('.step-circle').innerHTML = '<span class="check-icon"></span>';

                    const loginRes = await fetch('http://localhost:8000/login', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ email: userEmail, password: userPassword })
                    });
                    const loginResult = await loginRes.json();

                    if (loginResult.code === "200") {
                        localStorage.setItem('token', loginResult.data.access_token);
                        localStorage.setItem('role', loginResult.data.role);
                        
                        setTimeout(() => {
                            window.location.href = "index.html";
                        }, 2000);
                    }
                } else {
                    alert("Mã OTP không hợp lệ.");
                }
            } catch (error) {
                alert("Lỗi hệ thống xác thực.");
            }
        });
    }
});