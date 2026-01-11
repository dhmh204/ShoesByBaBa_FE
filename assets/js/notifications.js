const Toast = {
    _container: null,
    _getContainer() {
        if (!this._container) {
            this._container = document.createElement('div');
            this._container.className = 'toast-container';
            document.body.appendChild(this._container);
        }
        return this._container;
    },
    show(title, message, type = 'info') {
        const container = this._getContainer();
        const toast = document.createElement('div');
        toast.className = `custom-toast ${type}`;
        
        const icons = {
            success: 'fa-check-circle',
            error: 'fa-times-circle',
            info: 'fa-info-circle'
        };

        toast.innerHTML = `
            <i class="fas ${icons[type]}"></i>
            <div class="toast-content">
                <div class="toast-title">${title}</div>
                <div class="toast-message">${message}</div>
            </div>
            <div class="toast-progress">
                <div class="toast-progress-bar"></div>
            </div>
        `;

        container.appendChild(toast);

        setTimeout(() => {
            toast.style.animation = 'toastFadeOut 0.3s ease-in forwards';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    },
    success(msg) { this.show('Thành công', msg, 'success'); },
    error(msg) { this.show('Lỗi', msg, 'error'); },
    info(msg) { this.show('Thông báo', msg, 'info'); }
};

// Custom showConfirm modal
const showConfirm = (message, title = 'Xác nhận') => {
    return new Promise((resolve) => {
        let overlay = document.querySelector('.confirm-overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.className = 'confirm-overlay';
            overlay.innerHTML = `
                <div class="confirm-modal">
                    <div class="confirm-icon">
                        <i class="fas fa-exclamation-triangle"></i>
                    </div>
                    <div class="confirm-title">${title}</div>
                    <div class="confirm-message">${message}</div>
                    <div class="confirm-buttons">
                        <button class="confirm-btn confirm-btn-cancel">Hủy bỏ</button>
                        <button class="confirm-btn confirm-btn-confirm">Đồng ý</button>
                    </div>
                </div>
            `;
            document.body.appendChild(overlay);
        } else {
            overlay.querySelector('.confirm-title').innerText = title;
            overlay.querySelector('.confirm-message').innerText = message;
        }

        const confirmBtn = overlay.querySelector('.confirm-btn-confirm');
        const cancelBtn = overlay.querySelector('.confirm-btn-cancel');

        const handleAction = (result) => {
            overlay.classList.remove('active');
            // Clean up listeners for next use
            confirmBtn.onclick = null;
            cancelBtn.onclick = null;
            resolve(result);
        };

        confirmBtn.onclick = () => handleAction(true);
        cancelBtn.onclick = () => handleAction(false);

        // Show with a tiny delay to trigger CSS transition
        setTimeout(() => overlay.classList.add('active'), 10);
    });
};
