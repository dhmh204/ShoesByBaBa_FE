const API_BASE_URL = 'http://127.0.0.1:8000';

document.addEventListener('DOMContentLoaded', function () {
    const loginForm = document.getElementById('login-form');
    const googleLoginBtn = document.getElementById('btn-google-login');
    const errorDiv = document.getElementById('error');
    const errorText = document.getElementById('error-text');

    // 1. Handle regular login
    if (loginForm) {
        loginForm.addEventListener('submit', async function (e) {
            e.preventDefault();
            const email = document.getElementById('customer_email').value.trim();
            const password = document.getElementById('customer_password').value;

            if (errorDiv) errorDiv.classList.add('d-none');

            try {
                const response = await fetch(`${API_BASE_URL}/login`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    body: JSON.stringify({ email, password })
                });

                const result = await response.json();

                if (response.ok && result.code === "200" && result.data) {
                    const { access_token, role } = result.data;
                    if (!access_token) {
                        showError("Dữ liệu đăng nhập không hợp lệ!");
                        return;
                    }

                    localStorage.setItem('token', access_token);
                    localStorage.setItem('role', role);
                    
                    Toast.success("Đăng nhập thành công!");
                    setTimeout(() => {
                        window.location.href = (role === "admin") ? "admin.html" : "index.html";
                    }, 1000);
                } else {
                    showError(result.message || "Email hoặc mật khẩu không đúng!");
                }
            } catch (error) {
                console.error("Lỗi kết nối:", error);
                showError("Không thể kết nối tới server!");
            }
        });
    }

    // 2. Handle Google Login Initiation
    if (googleLoginBtn) {
        googleLoginBtn.addEventListener('click', function () {
            // Redirect to backend endpoint that initiates Google OAuth
            window.location.href = `${API_BASE_URL}/login/google`;
        });
    }

    // 3. Handle Google Redirect Callback (if redirected here with ?code=...)
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    if (code) {
        handleGoogleCallback(code);
    }

    async function handleGoogleCallback(code) {
        try {
            if (errorDiv && errorText) {
                errorText.textContent = "Đang xác thực với Google...";
                errorDiv.classList.remove('d-none');
                errorDiv.style.display = "flex";
                errorText.style.color = "#034ea1"; 
            }

            const response = await fetch(`${API_BASE_URL}/login/oauth2/code/google?code=${code}`, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json'
                }
            });

            const result = await response.json();

            if (response.ok && result.code === "200" && result.data) {
                const { access_token, role } = result.data;
                localStorage.setItem('token', access_token);
                localStorage.setItem('role', role || 'user');
                
                // Remove code from URL
                window.history.replaceState({}, document.title, window.location.pathname);
                
                if (typeof Toast !== 'undefined') {
                    Toast.success("Đăng nhập Google thành công!");
                }
                
                setTimeout(() => {
                    window.location.href = (role === "admin") ? "admin.html" : "index.html";
                }, 1000);
            } else {
                if (errorDiv && errorText) {
                    errorText.textContent = result.message || "Xác thực Google thất bại!";
                    errorText.style.color = "#FE0000";
                }
            }
        } catch (error) {
            console.error("Lỗi Google Login:", error);
            if (errorDiv && errorText) {
                errorText.textContent = "Lỗi kết nối khi xác thực Google!";
                errorText.style.color = "#FE0000";
            }
        }
    }

    function showError(message) {
        if (errorDiv && errorText) {
            errorText.textContent = message;
            errorDiv.classList.remove('d-none');
            errorDiv.style.display = "flex";
            errorText.style.color = "#FE0000";
        } else if (typeof Toast !== 'undefined') {
            Toast.error(message);
        }
    }
});