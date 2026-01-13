const API_BASE_URL = 'http://127.0.0.1:8000';

document.addEventListener('DOMContentLoaded', function () {
    const loginForm = document.getElementById('login-form');
    const googleLoginBtn = document.getElementById('btn-google-login');
    const errorDiv = document.getElementById('error');
    const errorText = document.getElementById('error-text');

    async function handleRefreshToken() {
        const refreshToken = localStorage.getItem('refresh_token');
        if (!refreshToken) return null;

        try {
            const response = await fetch(`${API_BASE_URL}/refresh-token?refresh_token=${refreshToken}`, {
                method: 'POST',
                headers: { 'Accept': 'application/json' }
            });

            const result = await response.json();
            if (response.ok && result.code === "200") {
                localStorage.setItem('token', result.data.access_token);
                if (result.data.refresh_token) {
                    localStorage.setItem('refresh_token', result.data.refresh_token);
                }
                return result.data.access_token;
            } else {
                logout();
                return null;
            }
        } catch (error) {
            console.error("Lỗi refresh token:", error);
            return null;
        }
    }

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
                    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                    body: JSON.stringify({ email, password })
                });

                const result = await response.json();

                if (response.ok && result.code === "200" && result.data) {
                    const { access_token, refresh_token, role } = result.data;
                    
                    localStorage.setItem('token', access_token);
                    if (refresh_token) localStorage.setItem('refresh_token', refresh_token);
                    localStorage.setItem('role', role);
                    
                    Toast.success("Đăng nhập thành công!");
                    setTimeout(() => {
                        window.location.href = (role === "admin") ? "admin.html" : "index.html";
                    }, 1000);
                } else {
                    showError(result.message || "Email hoặc mật khẩu không đúng!");
                }
            } catch (error) {
                showError("Không thể kết nối tới server!");
            }
        });
    }

    // 2. Handle Google Login Initiation
    if (googleLoginBtn) {
        googleLoginBtn.addEventListener('click', function () {
            window.location.href = `${API_BASE_URL}/login/google`;
        });
    }

    // 3. Handle Google Redirect Callback
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    if (code) {
        handleGoogleCallback(code);
    }

    async function handleGoogleCallback(code) {
        try {
            const response = await fetch(`${API_BASE_URL}/login/oauth2/code/google?code=${code}`, {
                method: 'GET',
                headers: { 'Accept': 'application/json' }
            });

            const result = await response.json();

            if (response.ok && result.code === "200" && result.data) {
                const { access_token, refresh_token, role } = result.data;
                localStorage.setItem('token', access_token);
                if (refresh_token) localStorage.setItem('refresh_token', refresh_token);
                localStorage.setItem('role', role || 'user');
                
                window.history.replaceState({}, document.title, window.location.pathname);
                
                if (typeof Toast !== 'undefined') Toast.success("Đăng nhập Google thành công!");
                
                setTimeout(() => {
                    window.location.href = (role === "admin") ? "admin.html" : "index.html";
                }, 1000);
            } else {
                showError(result.message || "Xác thực Google thất bại!");
            }
        } catch (error) {
            showError("Lỗi kết nối khi xác thực Google!");
        }
    }

    function logout() {
        localStorage.clear();
        window.location.href = "login.html";
    }

    function showError(message) {
        if (errorDiv && errorText) {
            errorText.textContent = message;
            errorDiv.classList.remove('d-none');
            errorDiv.style.display = "flex";
            errorText.style.color = "#FE0000";
        }
    }
});