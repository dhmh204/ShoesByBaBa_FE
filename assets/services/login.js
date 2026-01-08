document.addEventListener('DOMContentLoaded', function () {
    const loginForm = document.getElementById('login-form');

    if (loginForm) {
        loginForm.addEventListener('submit', async function (e) {
            e.preventDefault();

            const emailInput = document.getElementById('customer_email');
            const passwordInput = document.getElementById('customer_password');

            const loginData = {
                email: emailInput.value.trim(),
                password: passwordInput.value
            };
            try {
                const response = await fetch('http://localhost:8000/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    body: JSON.stringify(loginData)
                });

                if (!response.ok) {
                    const errorDetail = await response.text();
                    alert("Lỗi hệ thống: " + response.status);
                    return;
                }

                const result = await response.json();

                if (result.code === "200") {
                    console.log("Dữ liệu nhận được:", result.data);
                    
                    if (result.data && result.data.access_token) {
                        
                        localStorage.setItem('token', result.data.access_token);

                        const tokenType = result.data.token_type || 'Bearer';
                        localStorage.setItem('token_type', tokenType);
                        
                        if (result.data.user) {
                            localStorage.setItem('user_info', JSON.stringify(result.data.user));
                        }
                        
                        alert("Đăng nhập thành công!");
                      
                        window.location.href = "index.html"; 
                    } else {
                        alert("Đăng nhập thành công nhưng không nhận được token từ Server.");
                    }
                } else {
                     alert("Lỗi: " + result.message);
                }

            } catch (error) {
                console.error('Lỗi kết nối:', error);
                alert("Không thể kết nối tới Server. Kiểm tra lại CORS và trạng thái Backend!");
            }
        });
    }
});

// -------------------------LOGIN BY GOOGLE---------------------------
document.addEventListener('DOMContentLoaded', function () {
    const googleLoginBtn = document.getElementById('btn-google-login');

    if (googleLoginBtn) {
        googleLoginBtn.addEventListener('click', function () {
            window.location.href = 'http://localhost:8000/login/google';
        });
    }
    handleGoogleCallback();
});

async function handleGoogleCallback() {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');

    if (code) {
        console.log("Đã nhận code từ Google, đang gửi sang Backend...");
        
        try {
            const response = await fetch(`http://localhost:8000/login/oauth2/code/google?code=${code}`, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json'
                }
            });

            const result = await response.json();

            if (response.ok && (result.code === "200" || result.status === "success")) {
                const data = result.data;
                localStorage.setItem('token', data.access_token);
                window.history.replaceState({}, document.title, window.location.pathname);
                alert("Đăng nhập thành công!");
                window.location.href = "index.html"; 
            } else {
                alert("Lỗi từ server: " + (result.message || "Xác thực thất bại"));
            }
        } catch (error) {
            console.error("Lỗi kết nối:", error);
        }
    }
}