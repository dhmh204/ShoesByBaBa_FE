document.addEventListener('DOMContentLoaded', async function () {
    const container = document.getElementById('dynamic-sections-container');
    if (!container) return;

    try {
        // Fetch products from API
        const response = await fetch('http://127.0.0.1:8000/products?page=1&page_size=8');
        const result = await response.json();

        if (response.ok && (result.code === "200" || result.status === "success")) {
            // Assuming data is in result.data.items or result.data based on common patterns
            let products = result.data.items || result.data || [];
            
            // Chỉ hiển thị sản phẩm đang kinh doanh (active)
            const activeProducts = products.filter(p => p.status === 'active');
            
            renderProducts(container, activeProducts);
        } else {
            container.innerHTML = `<div style="text-align:center; padding: 50px;">Không thể tải sản phẩm. Lỗi: ${result.message || 'Unknown'}</div>`;
        }
    } catch (error) {
        console.error('Lỗi khi fetch sản phẩm:', error);
        container.innerHTML = `<div style="text-align:center; padding: 50px;">Không thể kết nối tới Server. Vui lòng kiểm tra lại!</div>`;
    }
});

function renderProducts(container, products) {
    if (!products || products.length === 0) {
        container.innerHTML = `<div style="text-align:center; padding: 50px;">Hiện chưa có sản phẩm nào.</div>`;
        return;
    }

    let html = `
    <section class="section-bestseller">
        <div class="container">
            <div class="section-header">
                <h2 class="title-decoration">SẢN PHẨM MỚI NHẤT</h2>
            </div>
            <div class="product-list-grid">
    `;

    products.forEach(product => {
        // Format price to Vietnamese currency
        const price = product.price ? product.price.toLocaleString('vi-VN') : 'Liên hệ';
        const image = product.image_url || (product.image_urls && product.image_urls[0]?.url) || product.thumbnail || product.image || 'https://theme.hstatic.net/1000230642/1001205219/14/no-image.jpg';
        
        const image2 = (product.image_urls && product.image_urls.length > 1) ? product.image_urls[1].url : null;
        
        // Mocking some data if not present in API result
        const category = product.category_name || product.category || "Biti's Hunter";
        const brand = "ShoesByBaBa";

        html += `
            <a href="productDetails.html?id=${product.id}" class="product-item-link">
                <div class="product-item">
                    <div class="prod-image-wrap">
                        <img class="img-front" src="${image}" alt="${product.name}" onerror="this.onerror=null; this.src='https://theme.hstatic.net/1000230642/1001205219/14/no-image.jpg'">
                        ${image2 ? `<img class="img-back" src="${image2}" alt="${product.name}" onerror="this.onerror=null; this.style.display='none'">` : ''}
                        ${product.is_new !== false ? '<div class="badge badge-new">Mới</div>' : ''}
                        ${product.discount ? `<div class="badge badge-sale">-${product.discount}%</div>` : ''}
                        <div class="btn-wishlist"><i class="fa-regular fa-heart"></i></div>
                    </div>
                    <div class="prod-details">
                        <div class="prod-meta">
                            <span>${brand}</span>
                            <span>${category}</span>
                        </div>
                        <h3 class="prod-title">${product.name}</h3>
                        <div class="prod-price">
                            <span class="curr-price">${price} ₫</span>
                            <span class="sold-count">Đã bán ${product.sold_count || Math.floor(Math.random() * 50)}</span>
                        </div>
                    </div>
                </div>
            </a>
        `;
    });

    html += `
            </div>
            <div style="text-align:center; margin-top: 40px;">
                <a href="collections.html" class="title-decoration" style="font-size: 16px; cursor: pointer;">XEM TẤT CẢ</a>
            </div>
        </div>
    </section>
    `;

    container.innerHTML = html;

    // Add wishlist toggle logic for newly rendered elements
    const wishButtons = container.querySelectorAll('.btn-wishlist');
    wishButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation(); 
            const icon = btn.querySelector('i');
            if (icon.classList.contains('fa-regular')) {
                icon.classList.remove('fa-regular');
                icon.classList.add('fa-solid');
                btn.style.color = '#d72128';
            } else {
                icon.classList.remove('fa-solid');
                icon.classList.add('fa-regular');
                btn.style.color = '#333';
            }
        });
    });
}
