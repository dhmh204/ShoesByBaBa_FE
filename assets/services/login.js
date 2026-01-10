document.addEventListener('DOMContentLoaded', function () {
    const loginForm = document.getElementById('login-form');
    const errorDiv = document.getElementById('error');
    const errorText = document.getElementById('error-text');

    if (!loginForm) return;

    loginForm.addEventListener('submit', async function (e) {
        e.preventDefault();

        const email = document.getElementById('customer_email').value.trim();
        const password = document.getElementById('customer_password').value;

        if (errorDiv) errorDiv.classList.add('d-none');

        try {
            const response = await fetch('http://127.0.0.1:8000/login', {
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

                if (role === "admin") {
                    window.location.href = "admin.html";
                } else if (role === "user") {
                    window.location.href = "index.html";
                } else {
                    showError("Vai trò không hợp lệ!");
                }
            } 
           
            else {
                showError(result.message || "Email hoặc mật khẩu không đúng!");
            }

        } catch (error) {
            console.error("Lỗi kết nối:", error);
            showError("Không thể kết nối tới server!");
        }
    });

    function showError(message) {
        if (errorDiv && errorText) {
            errorText.textContent = message;
            errorDiv.classList.remove('d-none');
            errorDiv.style.display = "flex";
        } else {
            alert(message);
        }
    }
});

// -------------------------LOGIN BY GOOGLE---------------------------
// document.addEventListener('DOMContentLoaded', function () {
//     const googleLoginBtn = document.getElementById('btn-google-login');

//     if (googleLoginBtn) {
//         googleLoginBtn.addEventListener('click', function () {
//             window.location.href = 'http://localhost:8000/login/google';
//         });
//     }
//     handleGoogleCallback();
// });

// async function handleGoogleCallback() {
//     const urlParams = new URLSearchParams(window.location.search);
//     const code = urlParams.get('code');

//     if (code) {
//         console.log("Đã nhận code từ Google, đang gửi sang Backend...");
        
//         try {
//             const response = await fetch(`http://localhost:8000/login/oauth2/code/google?code=${code}`, {
//                 method: 'GET',
//                 headers: {
//                     'Accept': 'application/json'
//                 }
//             });

//             const result = await response.json();

//             if (response.ok && (result.code === "200" || result.status === "success")) {
//                 const data = result.data;
//                 localStorage.setItem('token', data.access_token);
//                 window.history.replaceState({}, document.title, window.location.pathname);
//                 alert("Đăng nhập thành công!");
//                 window.location.href = "index.html"; 
//             } else {
//                 alert("Lỗi từ server: " + (result.message || "Xác thực thất bại"));
//             }
//         } catch (error) {
//             console.error("Lỗi kết nối:", error);
//         }
//     }
// }