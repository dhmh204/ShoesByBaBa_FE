document.querySelector('.btn-cancel').addEventListener('click', function () {
    window.location.href = 'settingAccount.html';
});

// ===========SHOW MODAL==================
function showModal(message) {
    document.getElementById('modalMessage').innerText = message;
    const modal = new bootstrap.Modal(document.getElementById('notifyModal'));
    modal.show();
}