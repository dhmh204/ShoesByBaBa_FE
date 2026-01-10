async function loadUserProfile() {
    // 1. SỬA LẠI KEY: Phải là 'token' mới khớp với file Login của bạn
    let token = localStorage.getItem("token"); 
    
    console.log("Token lấy được từ Storage:", token);

    if (!token || token === "undefined" || token === "null") {
        console.warn("Không tìm thấy token, yêu cầu đăng nhập.");
        // Nếu không có token thì mới redirect về login
        window.location.href = "./login.html";
        return;
    }

    try {
        // 2. Gọi API (Lưu ý: URL phải khớp với Backend, ví dụ /profile hoặc /users/profile)
        const response = await fetch("http://localhost:8000/profile", { 
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json",
                "Accept": "application/json"
            }
        });

        console.log("Trạng thái phản hồi API:", response.status);

        if (response.status === 401 || response.status === 403) {
            console.error("Token hết hạn hoặc không hợp lệ.");
            localStorage.removeItem("token");
            window.location.href = "./login.html";
            return;
        }

        const result = await response.json();
        console.log("Dữ liệu nhận về:", result);

        // API của bạn trả về { code: "200", data: { ... } }
        if (response.ok && result.data) {
            const userData = result.data;

            // 3. Hiển thị dữ liệu lên HTML
            // Lời chào Sidebar
            const userNameEl = document.getElementById("userName");
            if (userNameEl) userNameEl.innerText = userData.full_name;

            // Chi tiết thông tin
            const fullNameEl = document.getElementById("fullName");
            if (fullNameEl) fullNameEl.innerText = userData.full_name;

            const emailEl = document.getElementById("email");
            if (emailEl) emailEl.innerText = userData.email;

            const phoneEl = document.getElementById("phoneNumber");
            if (phoneEl) phoneEl.innerText = userData.phone_number || "Chưa cập nhật";

            const addressEl = document.getElementById("address");
            if (addressEl) {
                // Nếu có địa chỉ trong data, bạn cộng chuỗi lại
                if (userData.province_city) {
                    addressEl.innerText = `${userData.street_address || ''}, ${userData.ward || ''}, ${userData.province_city}`;
                } else {
                    addressEl.innerText = "Chưa cập nhật";
                }
            }

            // Xử lý Avatar (Chữ cái đầu)
            const avatarBox = document.querySelector(".AccountAvatar");
            if (avatarBox && userData.full_name) {
                avatarBox.innerText = userData.full_name.split(" ").pop().substring(0, 2).toUpperCase();
            }

        } else {
            console.error("Lỗi dữ liệu từ server:", result.message);
        }
    } catch (error) {
        console.error("Lỗi kết nối API Profile:", error);
    }
}

// Chạy khi trang load xong
document.addEventListener("DOMContentLoaded", loadUserProfile);