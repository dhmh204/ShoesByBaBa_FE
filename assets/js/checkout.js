const districts = {
    "HN": ["Quận Ba Đình", "Quận Hoàn Kiếm", "Quận Cầu Giấy", "Quận Đống Đa"],
    "HCM": ["Quận 1", "Quận 3", "Quận Bình Thạnh", "TP. Thủ Đức"],
    "DN": ["Quận Hải Châu", "Quận Thanh Khê", "Quận Sơn Trà"]
};

document.addEventListener('DOMContentLoaded', () => {

    const provinceSelect = document.getElementById('provinceSelect');
    const districtSelect = document.getElementById('districtSelect');

    provinceSelect.addEventListener('change', function() {
        const cityCode = this.value;
        
        districtSelect.innerHTML = '<option value="">Chọn Quận/Huyện</option>';
        
        if (cityCode && districts[cityCode]) {
            districts[cityCode].forEach(district => {
                const option = document.createElement('option');
                option.value = district;
                option.innerText = district;
                districtSelect.appendChild(option);
            });
        }
    });

    window.selectPayment = function(element) {
        document.querySelectorAll('.payment-item').forEach(item => {
            item.classList.remove('active');
            item.querySelector('input').checked = false;
        });

        element.classList.add('active');
        element.querySelector('input').checked = true;
    };

    document.querySelector('.btn-complete').addEventListener('click', () => {
        const name = document.querySelector('input[placeholder="Họ và tên"]').value;
        const phone = document.querySelector('input[placeholder="Số điện thoại"]').value;
        
        if(!name || !phone) {
            Toast.error("Vui lòng nhập đầy đủ Họ tên và Số điện thoại!");
            return;
        }

        Toast.success("Đặt hàng THÀNH CÔNG! Mã đơn hàng của bạn là #BITIS" + Math.floor(Math.random() * 10000));
        setTimeout(() => window.location.href = 'index.html', 2000);
    });
});
