document.querySelector('.btn-cancel-mail').addEventListener('click', function () {
    window.location.href = 'login.html';
});
document.querySelector('.btn-cancel-change').addEventListener('click', function () {
    window.location.href = 'login.html';
});

document.querySelector('.btn-cancel-otp').addEventListener('click', function () {
    window.location.href = 'login.html';
});

// Lấy danh sách các ô input OTP
const otpInputs = document.querySelectorAll('.otp-inputs input');

otpInputs.forEach((input, index) => {
    // 1. Xử lý khi dán (Paste)
    input.addEventListener('paste', (e) => {
        e.preventDefault(); // Chặn hành động dán mặc định của trình duyệt
        
        const data = e.clipboardData.getData('text').trim(); // Lấy dữ liệu từ clipboard
        if (!/^\d+$/.test(data)) return; // Nếu không phải là số thì bỏ qua

        const chars = data.split(''); // Chia chuỗi thành mảng các ký tự

        // Điền ký tự vào các ô input bắt đầu từ vị trí hiện tại
        chars.forEach((char, i) => {
            const targetIndex = index + i;
            if (otpInputs[targetIndex]) {
                otpInputs[targetIndex].value = char;
            }
        });

        // Tự động focus vào ô cuối cùng sau khi dán hoặc ô tiếp theo còn trống
        const nextFocusIndex = Math.min(index + chars.length, otpInputs.length - 1);
        otpInputs[nextFocusIndex].focus();
    });

    // 2. Xử lý khi gõ phím (Tự động nhảy ô)
    input.addEventListener('input', (e) => {
        if (input.value && index < otpInputs.length - 1) {
            otpInputs[index + 1].focus(); // Nhảy sang ô tiếp theo
        }
    });

    // 3. Xử lý khi xóa (Backspace)
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Backspace' && !input.value && index > 0) {
            otpInputs[index - 1].focus(); // Quay lại ô trước đó
        }
        
        // Nhấn Enter để xác nhận nhanh
        if (e.key === 'Enter') {
            document.querySelector('.btn-confirm')?.click();
        }
    });
});