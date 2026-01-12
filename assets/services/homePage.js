const BASE_URL = 'http://127.0.0.1:8000';

document.addEventListener('DOMContentLoaded', async function () {
    const container = document.getElementById('dynamic-sections-container');
    if (!container) return;

    try {
        container.innerHTML = '<div style="text-align:center; padding: 50px;">Đang tải sản phẩm...</div>';
        
        let allSectionsHtml = '';

        // 1. Fetch Newest Products
        const newestRes = await fetch(`${BASE_URL}/products?page=1&limit=8`);
        const newestData = await newestRes.json();
        
        if (newestRes.ok && newestData.data) {
            const products = newestData.data.items || [];
            const activeProducts = products.filter(p => p.status === 'active');
            if (activeProducts.length > 0) {
                allSectionsHtml += renderSection("SẢN PHẨM MỚI NHẤT", activeProducts);
            }
        }

        // 2. Fetch Categories
        const categoriesRes = await fetch(`${BASE_URL}/categories?limit=50`);
        const categoriesData = await categoriesRes.json();
        
        if (categoriesRes.ok && categoriesData.data) {
            const categories = categoriesData.data.items || [];
            
            // 3. For each category, fetch up to 4 products and ALWAYS render the section
            for (const cat of categories) {
                const catProdRes = await fetch(`${BASE_URL}/products?page=1&limit=4&keyword=${cat.id}&search_type=category`);
                const catProdData = await catProdRes.json();
                
                let activeProducts = [];
                if (catProdRes.ok && catProdData.data) {
                    const products = catProdData.data.items || [];
                    activeProducts = products.filter(p => p.status === 'active');
                }
                
                // Always add the section, even if empty
                allSectionsHtml += renderSection(cat.name.toUpperCase(), activeProducts);
            }
        }

        if (allSectionsHtml) {
            container.innerHTML = allSectionsHtml;
            setupWishlistToggles(container);
        } else {
            container.innerHTML = `<div style="text-align:center; padding: 50px;">Hiện chưa có sản phẩm nào.</div>`;
        }

    } catch (error) {
        console.error('Lỗi khi tải trang chủ:', error);
        container.innerHTML = `<div style="text-align:center; padding: 50px;">Không thể kết nối tới Server. Vui lòng kiểm tra lại!</div>`;
    }
});

function renderSection(title, products) {
    let html = `
    <section class="section-bestseller">
        <div class="container">
            <div class="section-header">
                <h2 class="title-decoration">${title}</h2>
            </div>
    `;

    if (products && products.length > 0) {
        html += `<div class="product-list-grid">`;
        products.forEach(product => {
            const price = product.price ? product.price.toLocaleString('vi-VN') : 'Liên hệ';
            const image = product.image_url || (product.image_urls && product.image_urls[0]?.url) || 'https://theme.hstatic.net/1000230642/1001205219/14/no-image.jpg';
            const image2 = (product.image_urls && product.image_urls.length > 1) ? product.image_urls[1].url : null;
            
            const categoryName = product.category_name || "";
            const brand = "ShoesByBaBa";

            html += `
                <a href="productDetails.html?id=${product.id}" class="product-item-link">
                    <div class="product-item">
                        <div class="prod-image-wrap">
                            <img class="img-front" src="${image}" alt="${product.name}" onerror="this.onerror=null; this.src='https://theme.hstatic.net/1000230642/1001205219/14/no-image.jpg'">
                            ${image2 ? `<img class="img-back" src="${image2}" alt="${product.name}" onerror="this.onerror=null; this.style.display='none'">` : ''}
                            <div class="btn-wishlist"><i class="fa-regular fa-heart"></i></div>
                        </div>
                        <div class="prod-details">
                            <div class="prod-meta">
                                <span>${brand}</span>
                                ${categoryName ? `<span>${categoryName}</span>` : ''}
                            </div>
                            <h3 class="prod-title">${product.name}</h3>
                            <div class="prod-price">
                                <span class="curr-price">${price} ₫</span>
                            <span class="sold-count">Đã bán ${product.sold_count ?? 0}</span>
                            </div>
                        </div>
                    </div>
                </a>
            `;
        });
        html += `</div>`;
    } else {
        // Hiển thị thông báo nếu không có sản phẩm trong danh mục này
        html += `<div style="text-align:center; padding: 40px 0; color: #888; font-style: italic;">Hiện chưa có sản phẩm.</div>`;
    }

    html += `
        </div>
    </section>
    `;
    return html;
}

function setupWishlistToggles(container) {
    const wishButtons = container.querySelectorAll('.btn-wishlist');
    wishButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation(); 
            const icon = btn.querySelector('i');
            if (icon.classList.contains('fa-regular')) {
                icon.classList.replace('fa-regular', 'fa-solid');
                btn.style.color = '#d72128';
            } else {
                icon.classList.replace('fa-solid', 'fa-regular');
                btn.style.color = '#333';
            }
        });
    });
}
