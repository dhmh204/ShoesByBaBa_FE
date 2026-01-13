async function loadUserProfile() {
    let token = localStorage.getItem("token"); 
    const sidebar = document.getElementById("customer_sidebar");

    if (!token || token === "undefined" || token === "null") {
        window.location.href = "./login.html";
        return;
    }

    try {
        const response = await fetch("http://localhost:8000/profile", { 
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            }
        });

        if (response.status === 401 || response.status === 403) {
            localStorage.removeItem("token");
            window.location.href = "./login.html";
            return;
        }

        const result = await response.json();

        if (response.ok && result.data) {
            const userData = result.data;

            // 1. Xử lý địa chỉ
            const fullAddress = userData.province_city 
                ? `${userData.street_address || ''}, ${userData.ward || ''}, ${userData.province_city}`.replace(/^, /, '')
                : "Chưa cập nhật";

            // 2. Vẽ lại toàn bộ HTML vào trong sidebar
            sidebar.innerHTML = `
                <h2 class="title-detail">Thông tin tài khoản</h2>
                <p class="name_account"><span>Họ và tên: </span><span id="fullName">${userData.full_name}</span></p>
                <p class="email"><span>Email: </span><span id="email">${userData.email}</span></p>
                <div class="address">
                    <p><span>Điện thoại: </span><span id="phoneNumber">${userData.phone_number || "Chưa cập nhật"}</span></p>
                    <p><span>Địa chỉ: </span><span id="address">${fullAddress}</span></p>
                </div>
                <span class="btn btn-update">
                    <i class="bi bi-pencil-square"></i>
                    <a href="./updateInforAccount.html">Cập nhật thông tin</a>
                </span>
            `;

            // 3. Cập nhật Avatar (nếu phần tử này nằm ngoài sidebar)
         
            const avatarBox = document.querySelector(".AccountAvatar");
            if (avatarBox && userData.full_name) {
                avatarBox.innerText = userData.full_name.split(" ").pop().substring(0, 2).toUpperCase();
            }


            // 4. Cập nhật userName ở nơi khác (ví dụ Header)
            const userNameEl = document.getElementById("userName");
            if (userNameEl) userNameEl.innerText = userData.full_name;

        } else {
            notify(result.message || "Không thể tải thông tin cá nhân", "error");
        }
    } catch (error) {
        console.error("Lỗi:", error);
        if (sidebar) sidebar.innerHTML = "<p>Lỗi khi tải dữ liệu...</p>";
    }
}

document.addEventListener("DOMContentLoaded", loadUserProfile);

