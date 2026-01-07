// 1. Logic thay đổi ảnh khi click vào Thumbnail
function changeImage(element) {
    // Đổi nguồn ảnh chính
    document.getElementById('mainImage').src = element.src;

    // Xử lý active class cho thumbnail
    let thumbs = document.querySelectorAll('.thumb');
    thumbs.forEach(t => t.classList.remove('active'));
    element.classList.add('active');
}

// 2. Logic chọn Màu Sắc (Quan trọng: Trong video, click màu sẽ đổi ảnh chính)
function selectColor(element) {
    // Xóa active cũ
    document.querySelectorAll('.color-item').forEach(item => item.classList.remove('active'));
    
    // Thêm active mới
    element.classList.add('active');

    // Cập nhật tên màu hiển thị
    let colorName = element.getAttribute('data-name');
    document.getElementById('colorName').innerText = colorName;

    // ĐỔI ẢNH CHÍNH THEO MÀU (Giống video)
    let colorImg = element.getAttribute('data-img');
    if(colorImg) {
        document.getElementById('mainImage').src = colorImg;
    }
}

// 3. Logic chọn Size
function selectSize(element) {
    let sizes = document.querySelectorAll('.size-btn');
    sizes.forEach(s => s.classList.remove('active'));
    element.classList.add('active');
}

// 4. Logic tăng giảm số lượng
const qtyInput = document.getElementById('qtyInput');

function increaseQty() {
    let currentQty = parseInt(qtyInput.value);
    qtyInput.value = currentQty + 1;
}

function decreaseQty() {
    let currentQty = parseInt(qtyInput.value);
    if (currentQty > 1) {
        qtyInput.value = currentQty - 1;
    }
}

function toggleDesc() {
    let content = document.getElementById('descContent');
    let btn = document.querySelector('.btn-view-more');
    
    if (content.classList.contains('open')) {
        content.classList.remove('open');
        btn.innerText = "+ Xem thêm";
    } else {
        content.classList.add('open');
        btn.innerText = "- Thu gọn";
    }
}