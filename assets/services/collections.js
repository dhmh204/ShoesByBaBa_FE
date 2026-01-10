const COLLECTIONS_BASE_URL = 'http://127.0.0.1:8000';

document.addEventListener('DOMContentLoaded', async () => {
    // Parse URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const keyword = urlParams.get('keyword');
    const categoryId = urlParams.get('category');
    const brandId = urlParams.get('brand');
    
    // Update UI based on search/filter
    const pageHeading = document.getElementById('page-heading');
    const collectionTitle = document.getElementById('collection-title');
    
    if (keyword) {
        if (pageHeading) pageHeading.innerText = `KẾT QUẢ TÌM KIẾM: "${keyword}"`;
        if (collectionTitle) collectionTitle.innerText = `Tìm kiếm: ${keyword}`;
    } else if (brandId) {
        // Fetch brand name for heading
        try {
            const bResp = await fetch(`${COLLECTIONS_BASE_URL}/brands?limit=100`);
            const bResult = await bResp.json();
            if (bResp.ok && bResult.data && bResult.data.items) {
                const brand = bResult.data.items.find(b => b.id == brandId);
                if (brand) {
                    if (pageHeading) pageHeading.innerText = brand.brand_name.toUpperCase();
                    if (collectionTitle) collectionTitle.innerText = brand.brand_name;
                }
            }
        } catch (e) {}
    }

    // Initialize sidebar
    await fetchAndRenderCategories(categoryId);

    // Initial fetch of products
    fetchAndRenderProducts(1, keyword, categoryId, 'default', brandId);
});

async function fetchAndRenderCategories(activeCategoryId) {
    const sidebar = document.getElementById('sidebar-categories');
    if (!sidebar) return;

    try {
        const response = await fetch(`${COLLECTIONS_BASE_URL}/categories?limit=50`);
        const result = await response.json();

        if (response.ok && (result.code === "200" || result.status === "success")) {
            const categories = result.data.items || [];
            
            let html = `<li><a href="collections.html" style="text-decoration:none; color:${!activeCategoryId ? '#ec1c24; font-weight:bold' : '#333'};">Tất cả sản phẩm</a></li>`;
            
            categories.forEach(cat => {
                const isActive = activeCategoryId == cat.id;
                if (isActive) {
                    const pageHeading = document.getElementById('page-heading');
                    const collectionTitle = document.getElementById('collection-title');
                    if (pageHeading) pageHeading.innerText = cat.name.toUpperCase();
                    if (collectionTitle) collectionTitle.innerText = cat.name;
                }
                html += `<li><a href="collections.html?category=${cat.id}" style="text-decoration:none; color:${isActive ? '#ec1c24; font-weight:bold' : '#333'};">${cat.name}</a></li>`;
            });
            
            sidebar.innerHTML = html;
        }
    } catch (error) {
        console.error("Error fetching categories:", error);
    }
}

async function fetchAndRenderProducts(page = 1, keyword = null, categoryId = null, sort = 'default', brandId = null) {
    const container = document.getElementById('collection-product-container');
    if (!container) return;

    container.innerHTML = '<p style="text-align:center; width:100%;">Đang tải dữ liệu...</p>';

    try {
        let url = `${COLLECTIONS_BASE_URL}/products?page=${page}&limit=12`;
        
        if (keyword) {
            url += `&keyword=${encodeURIComponent(keyword)}&search_type=title`;
        } else if (brandId) {
            url += `&keyword=${brandId}&search_type=brand`;
        } else if (categoryId) {
            url += `&keyword=${categoryId}&search_type=category`;
        }

        if (sort !== 'default') {
            url += `&sort_by=${sort}`;
        }

        const response = await fetch(url);
        const result = await response.json();

        if (response.ok && (result.code === "200" || result.status === "success")) {
            const products = result.data.items || [];
            renderProductGrid(container, products);
            renderPagination(result.data.total_pages, page, keyword, categoryId, sort, brandId);
        } else {
            container.innerHTML = `<p style="text-align:center; width:100%;">Không thể tải sản phẩm. ${result.message || ''}</p>`;
        }
    } catch (error) {
        console.error("Error fetching products:", error);
        container.innerHTML = '<p style="text-align:center; width:100%;">Lỗi kết nối máy chủ.</p>';
    }
}

function renderProductGrid(container, products) {
    if (!products || products.length === 0) {
        container.innerHTML = '<p style="text-align:center; width:100%; padding: 50px 0;">Không tìm thấy sản phẩm nào phù hợp.</p>';
        return;
    }

    let html = '';
    products.forEach(product => {
        const price = product.price ? product.price.toLocaleString('vi-VN') : 'Liên hệ';
        const image = product.image_url || (product.image_urls && product.image_urls[0]?.url) || product.thumbnail || product.image || 'https://theme.hstatic.net/1000230642/1001205219/14/no-image.jpg';
        const image2 = (product.image_urls && product.image_urls.length > 1) ? product.image_urls[1].url : null;
        
        const category = product.category_name || "Sản phẩm";
        const brand = product.brand_name || "ShoesByBaBa";

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

    container.innerHTML = html;
}

function renderPagination(totalPages, currentPage, keyword, categoryId, sort, brandId) {
    const paginationContainer = document.getElementById('pagination');
    if (!paginationContainer) return;
    
    if (totalPages <= 1) {
        paginationContainer.innerHTML = '';
        return;
    }

    let html = '';
    for (let i = 1; i <= totalPages; i++) {
        const isActive = i === currentPage;
        // Escape keyword for JS string
        const escapedKeyword = keyword ? keyword.replace(/'/g, "\\'") : null;
        
        html += `<button onclick="fetchAndRenderProducts(${i}, ${escapedKeyword ? `'${escapedKeyword}'` : 'null'}, ${categoryId || 'null'}, '${sort}', ${brandId || 'null'})" 
                 style="margin: 0 5px; padding: 5px 12px; border: 1px solid #ddd; background: ${isActive ? '#ec1c24' : '#fff'}; color: ${isActive ? '#fff' : '#333'}; cursor: pointer; border-radius: 4px;">
                 ${i}
                 </button>`;
    }
    paginationContainer.innerHTML = html;
}

function handleSort() {
    const sortValue = document.getElementById('sort-select').value;
    const urlParams = new URLSearchParams(window.location.search);
    const keyword = urlParams.get('keyword');
    const categoryId = urlParams.get('category');
    const brandId = urlParams.get('brand');
    
    fetchAndRenderProducts(1, keyword, categoryId, sortValue, brandId);
}
