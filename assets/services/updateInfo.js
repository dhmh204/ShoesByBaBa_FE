document.addEventListener('DOMContentLoaded', async function() {
    try {
        const response = await fetch('http://127.0.0.1:8000/profile', { 
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (response.ok) {
            const res = await response.json();
            const userData = res.data; 

            if (userData) {
                document.getElementById('last_name').value = userData.full_name || "";
                document.getElementById('email').value = userData.email || "";
                document.getElementById('phone_ac').value = userData.phone_number || "";
                document.getElementById('city').value = userData.province_city || "";
                document.getElementById('ward').value = userData.ward || "";
                document.getElementById('address_detail').value = userData.street_address || "";
            }
        } else {
            console.error("Không thể lấy thông tin người dùng");
        }
    } catch (err) {
        console.error("Lỗi khi tải thông tin:", err);
    }
});

document.getElementById('extraInfo').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const formData = {
        full_name: document.getElementById('last_name').value,
        email: document.getElementById('email').value,
        phone_number: document.getElementById('phone_ac').value,
        province_city: document.getElementById('city').value,
        ward: document.getElementById('ward').value,
        street_address: document.getElementById('address_detail').value
    };

    try {
        const response = await fetch('http://127.0.0.1:8000/update-profile', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify(formData)
        });

        const result = await response.json();
        
        const errorDiv = document.getElementById('error');
        if (response.ok) {
            if (response.ok) {
                showModal("Cập nhật thông tin thành công!");
                errorDiv.classList.add('d-none');
            }
        } else {
            errorDiv.classList.remove('d-none');
            errorDiv.innerText = result.detail || "Có lỗi xảy ra";
        }
    } catch (err) {
        console.error("Lỗi kết nối:", err);
    }
});
