document.addEventListener('DOMContentLoaded', function() {
    const accountHandle = document.getElementById('site-account-handle');
    const dropdownMenu = document.querySelector('.header-action__dropdown');

    accountHandle.addEventListener('click', function(e) {
        e.preventDefault(); 
        dropdownMenu.classList.toggle('d-none'); 
    });

    // 2. (Tùy chọn) Click ra ngoài để đóng menu
    document.addEventListener('click', function(e) {
        if (!accountHandle.contains(e.target) && !dropdownMenu.contains(e.target)) {
            dropdownMenu.classList.add('d-none');
        }
    });
});