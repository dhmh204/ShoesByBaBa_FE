const REVIEWS_BASE_URL = 'http://127.0.0.1:8000';

document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('product_id');

    if (!productId) {
        if (typeof Toast !== 'undefined') Toast.error("Không tìm thấy ID sản phẩm để đánh giá!");
        window.location.href = 'index.html';
        return;
    }

    // 1. Fetch Product Detail
    await fetchAndRenderProductInfo(productId);

    // 2. Check if user can review
    await checkReviewEligibility(productId);

    // 3. Fetch and render existing reviews
    await fetchAndRenderReviews(productId);

    // 3. Handle rating selection
    const stars = document.querySelectorAll('.star-rating i');
    let selectedRating = 0;

    stars.forEach(star => {
        star.addEventListener('click', () => {
            selectedRating = parseInt(star.getAttribute('data-value'));
            updateStars(selectedRating);
        });
        star.addEventListener('mouseover', () => {
            updateStars(parseInt(star.getAttribute('data-value')), true);
        });
        star.addEventListener('mouseout', () => {
            updateStars(selectedRating);
        });
    });

    function updateStars(rating, isHover = false) {
        stars.forEach(s => {
            const val = parseInt(s.getAttribute('data-value'));
            if (val <= rating) {
                s.className = 'fa-solid fa-star';
            } else {
                s.className = 'fa-regular fa-star';
            }
        });
    }

    // 4. Handle Submit Review
    const reviewForm = document.getElementById('review-form');
    if (reviewForm) {
        reviewForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const token = localStorage.getItem('token');
            if (!token) {
                Toast.error("Vui lòng đăng nhập để gửi đánh giá!");
                window.location.href = 'login.html';
                return;
            }

            const comment = document.getElementById('review-comment').value.trim();
            if (selectedRating === 0) {
                Toast.error("Vui lòng chọn mức độ đánh giá (sao)!");
                return;
            }

            try {
                const response = await fetch(`${REVIEWS_BASE_URL}/reviews`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        product_id: parseInt(productId),
                        rating: parseFloat(selectedRating),
                        comment: comment
                    })
                });

                const result = await response.json();
                if (response.ok && (result.code === "201" || result.status === "success")) {
                    Toast.success("Cảm ơn bạn đã đánh giá!");
                    setTimeout(() => {
                        window.location.href = `productDetails.html?id=${productId}`;
                    }, 1500);
                } else {
                    Toast.error("Lỗi: " + (result.message || result.detail || "Không thể gửi đánh giá"));
                }
            } catch (error) {
                console.error("Submit Review Error:", error);
                Toast.error("Lỗi kết nối máy chủ.");
            }
        });
    }
});

async function fetchAndRenderProductInfo(productId) {
    try {
        const response = await fetch(`${REVIEWS_BASE_URL}/products/${productId}`);
        const result = await response.json();
        
        if (response.ok) {
            const product = result.data || result;
            const img = document.getElementById('product-img');
            const name = document.getElementById('product-name');
            const price = document.getElementById('product-price');

            if (img) img.src = product.image_url || (product.image_urls && product.image_urls[0]?.url) || 'https://theme.hstatic.net/1000230642/1001205219/14/no-image.jpg';
            if (name) name.innerText = product.name;
            if (price) price.innerText = product.price.toLocaleString('vi-VN') + ' ₫';
            
            const backBtn = document.getElementById('back-to-product');
            if (backBtn) backBtn.href = `productDetails.html?id=${productId}`;
        }
    } catch (e) {
        console.error("Error fetching product info:", e);
    }
}

async function fetchAndRenderReviews(productId) {
    const listContainer = document.getElementById('reviews-list');
    if (!listContainer) return;

    try {
        const response = await fetch(`${REVIEWS_BASE_URL}/reviews?product_id=${productId}`);
        const result = await response.json();

        if (response.ok && result.data) {
            const reviews = result.data;
            if (reviews.length === 0) {
                listContainer.innerHTML = '<p class="no-reviews">Chưa có đánh giá nào cho sản phẩm này.</p>';
                return;
            }

            listContainer.innerHTML = reviews.map(rev => `
                <div class="review-item">
                    <div class="review-header">
                        <strong>Khách hàng #${rev.user_id}</strong>
                        <span>${new Date(rev.created_at).toLocaleDateString('vi-VN')}</span>
                    </div>
                    <div class="review-rating">
                        ${renderStars(rev.rating)}
                    </div>
                    <div class="review-comment">
                        ${rev.comment || 'Không có nhận xét.'}
                    </div>
                </div>
            `).join('');
        }
    } catch (e) {
        console.error("Error fetching reviews:", e);
        listContainer.innerHTML = '<p class="error-text">Lỗi tải đánh giá.</p>';
    }
}

function renderStars(rating) {
    let html = '';
    for (let i = 1; i <= 5; i++) {
        if (i <= rating) {
            html += '<i class="fa-solid fa-star"></i>';
        } else {
            html += '<i class="fa-regular fa-star"></i>';
        }
    }
    return html;
}

async function checkReviewEligibility(productId) {
    const ratingSection = document.querySelector('.rating-section');
    if (!ratingSection) return;

    const token = localStorage.getItem('token');
    if (!token) {
        const currentUrl = encodeURIComponent(window.location.href);
        ratingSection.innerHTML = `<p class="info-msg">Vui lòng <a href="login.html?redirect=${currentUrl}">đăng nhập</a> để đánh giá sản phẩm.</p>`;
        return;
    }

    try {
        const response = await fetch(`${REVIEWS_BASE_URL}/reviews/check-eligibility?product_id=${productId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.status === 401 || response.status === 403) {
            console.warn("Invalid or expired token. Clearing storage.");
            localStorage.removeItem('token');
            localStorage.removeItem('user_info');
            const currentUrl = encodeURIComponent(window.location.href);
            ratingSection.innerHTML = `<p class="info-msg">Phiên đăng nhập đã hết hạn. Vui lòng <a href="login.html?redirect=${currentUrl}">đăng nhập lại</a> để đánh giá sản phẩm.</p>`;
            return;
        }

        const result = await response.json();

        if (response.ok && result.data) {
            const { can_review, has_purchased, already_reviewed } = result.data;
            if (!can_review) {
                if (already_reviewed) {
                    ratingSection.innerHTML = '<p class="info-msg">Bạn đã đánh giá sản phẩm này rồi. Cảm ơn bạn!</p>';
                } else if (!has_purchased) {
                    ratingSection.innerHTML = '<p class="info-msg">Bạn chỉ có thể đánh giá sản phẩm sau khi đơn hàng đã được <b>giao thành công</b>.</p>';
                }
            }
        } else {
            console.error("Eligibility check failed:", result);
        }
    } catch (e) {
        console.error("Error checking eligibility:", e);
    }
}
