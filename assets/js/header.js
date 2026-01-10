const HEADER_BASE_URL = 'http://127.0.0.1:8000';

document.addEventListener('DOMContentLoaded', () => {
    // Inject Search Styles
    const style = document.createElement('style');
    style.textContent = `
        .ajaxSearchResults {
            position: absolute;
            top: 100%;
            left: 0;
            right: 0;
            background: white;
            border: 1px solid #ddd;
            border-top: none;
            z-index: 1000;
            box-shadow: 0 4px 10px rgba(0,0,0,0.1);
            max-height: 400px;
            overflow-y: auto;
            border-radius: 0 0 8px 8px;
        }
        .search-result-item:hover {
            background-color: #f5f5f5;
        }
        .search-result-item img {
            border-radius: 4px;
        }
    `;
    document.head.appendChild(style);

    updateHeaderCart();
    checkLoginStatus();
    fetchBrands();
    
    // Toggle Account Dropdown
    const accountHandle = document.getElementById('site-account-handle');
    const accountDropdown = document.querySelector('.header-action_account .header-action__dropdown');
    
    if (accountHandle && accountDropdown) {
        accountHandle.addEventListener('click', (e) => {
            e.preventDefault();
            accountDropdown.classList.toggle('d-none');
        });

        // Close when clicking outside
        document.addEventListener('click', (e) => {
            if (!accountHandle.contains(e.target) && !accountDropdown.contains(e.target)) {
                accountDropdown.classList.add('d-none');
            }
        });
    }

    const cartLinks = document.querySelectorAll('.linktocart');
    cartLinks.forEach(link => {
        link.href = 'cart.html';
    });

    // Search Functionality & Suggestions
    const searchForms = document.querySelectorAll('.ultimate-search');
    searchForms.forEach(form => {
        const input = form.querySelector('.input-search');
        const resultsWrapper = form.closest('.search-box')?.querySelector('.ajaxSearchResults');
        const resultsContent = resultsWrapper?.querySelector('.resultsContent');

        if (input) {
            // Handle form submission
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                if (input.value.trim()) {
                    const keyword = encodeURIComponent(input.value.trim());
                    window.location.href = `collections.html?keyword=${keyword}`;
                }
            });

            // Handle live suggestions
            let debounceTimer;
            input.addEventListener('input', () => {
                clearTimeout(debounceTimer);
                const query = input.value.trim();

                if (query.length < 2) {
                    if (resultsWrapper) resultsWrapper.style.display = 'none';
                    return;
                }

                debounceTimer = setTimeout(async () => {
                    try {
                        const response = await fetch(`${HEADER_BASE_URL}/products?keyword=${encodeURIComponent(query)}&limit=5`);
                        const result = await response.json();

                        if (response.ok && result.data && result.data.items && result.data.items.length > 0) {
                            renderSearchSuggestions(resultsContent, result.data.items, query);
                            if (resultsWrapper) resultsWrapper.style.display = 'block';
                        } else {
                            if (resultsWrapper) resultsWrapper.style.display = 'none';
                        }
                    } catch (error) {
                        console.error("Search Error:", error);
                    }
                }, 300);
            });
        }
    });

    // Navigation Menu Logic
    const menuLinks = document.querySelectorAll('.navbar-mainmenu a, .menuList-submain a, .header-search-mobile a');
    menuLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (href && (href.startsWith('/collections/') || href.startsWith('/pages/'))) {
            link.addEventListener('click', (e) => {
                // If it's a real page like corporate or something, let it be.
                // But if it's a collection, redirect to our collections.html
                if (href.startsWith('/collections/')) {
                    e.preventDefault();
                    const parts = href.split('/');
                    const slug = parts[parts.length - 1];
                    
                    // Convert slug to a readable keyword or use ID if available
                    // For now, let's use the text content as keyword for better accuracy in this setup
                    const keyword = link.innerText.trim();
                    window.location.href = `collections.html?keyword=${encodeURIComponent(keyword)}`;
                }
            });
        }
    });

    // Close search results when clicking outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.search-box')) {
            document.querySelectorAll('.ajaxSearchResults').forEach(el => el.style.display = 'none');
        }
    });
});

function renderSearchSuggestions(container, products, query) {
    if (!container) return;
    
    container.innerHTML = products.map(product => `
        <div class="search-result-item" style="padding: 10px; border-bottom: 1px solid #eee; display: flex; align-items: center; cursor: pointer;" onclick="window.location.href='productDetails.html?id=${product.id}'">
            <img src="${product.image_url || (product.image_urls && product.image_urls[0]?.url) || 'https://theme.hstatic.net/1000230642/1001205219/14/no-image.jpg'}" style="width: 50px; height: 50px; object-fit: cover; margin-right: 10px;">
            <div>
                <div style="font-weight: bold; font-size: 14px; color: #333;">${product.name}</div>
                <div style="color: #ec1c24; font-size: 13px;">${product.price ? product.price.toLocaleString('vi-VN') : '0'} ₫</div>
            </div>
        </div>
    `).join('') + `
        <div style="padding: 10px; text-align: center; background: #f9f9f9;">
            <a href="collections.html?keyword=${encodeURIComponent(query)}" style="color: #666; font-size: 13px; text-decoration: none; font-weight: bold;">Xem tất cả kết quả cho "${query}"</a>
        </div>
    `;
}

async function updateHeaderCart() {
    const token = localStorage.getItem('token');
    const cartCountEl = document.querySelector('.header-action_cart .count');
    const cartViewBody = document.querySelector('#cart-view tbody');
    const totalViewPrice = document.getElementById('total-view-cart');

    if (!token) {
        if (cartCountEl) cartCountEl.innerText = '0';
        if (cartViewBody) {
            cartViewBody.innerHTML = `
                <tr class="mini-cart__empty">
                    <td>
                        <div class="svgico-mini-cart">
                            <i class="fas fa-shopping-cart" style="font-size: 50px; color: #ccc; margin-bottom: 10px;"></i>
                        </div>
                        Vui lòng đăng nhập
                    </td>
                </tr>`;
        }
        return;
    }

    try {
        const response = await fetch(`${HEADER_BASE_URL}/api/cart`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        const result = await response.json();

        if (response.ok) {
            const items = result.items || [];
            if (cartCountEl) cartCountEl.innerText = items.length;

            if (items.length === 0) {
                if (cartViewBody) {
                    cartViewBody.innerHTML = `
                        <tr class="mini-cart__empty">
                            <td>Hiện chưa có sản phẩm</td>
                        </tr>`;
                }
                
                if (totalViewPrice) totalViewPrice.innerText = '0 ₫';
                return;
            }

            // Render items in mini cart
            if (cartViewBody) {
                cartViewBody.innerHTML = items.map(item => `
                    <tr class="mini-cart__item">
                        <td class="mini-cart__left">
                            <a class="mnc-link" href="productDetails.html?id=${item.product_id}">
                                <img src="${item.product_image || 'https://theme.hstatic.net/1000230642/1001205219/14/no-image.jpg'}" alt="${item.product_name}">
                            </a>
                        </td>
                        <td class="mini-cart__right">
                            <p class="mini-cart__title">
                                <a class="mnc-title mnc-link" href="productDetails.html?id=${item.product_id}">${item.product_name}</a>
                                <span class="mnc-variant">${item.color} / ${item.size}</span>
                            </p>
                            <div class="mini-cart__quantity">
                                <span class="qty-label">SL: ${item.quantity}</span>
                            </div>
                            <div class="mini-cart__price">
                                <span class="mnc-price">${(item.subtotal || (item.current_price * item.quantity)).toLocaleString('vi-VN')} ₫</span>
                            </div>
                        </td>
                    </tr>
                `).join('');
            }

            if (totalViewPrice) {
                const total = result.total_amount || items.reduce((sum, item) => sum + (item.current_price * item.quantity), 0);
                totalViewPrice.innerText = total.toLocaleString('vi-VN') + ' ₫';
            }
        }
    } catch (error) {
        console.error("Header Cart Error:", error);
    }
}

async function fetchBrands() {
    try {
        const response = await fetch(`${HEADER_BASE_URL}/brands?limit=10`);
        const result = await response.json();
        
        if (response.ok && (result.code === "200" || result.status === "success")) {
            const brands = result.data.items || [];
            renderBrandMenu(brands);
        }
    } catch (error) {
        console.error("Error fetching brands:", error);
    }
}

function renderBrandMenu(brands) {
    // Find the "NHÃN HIỆU" menu item - identifying by the span text
    const allMenuSpans = document.querySelectorAll('.navbar-mainmenu span');
    let brandSubmenu = null;
    
    allMenuSpans.forEach(span => {
        if (span.innerText.trim() === 'NHÃN HIỆU') {
            const parentLi = span.closest('li');
            brandSubmenu = parentLi?.querySelector('.menuList-submain');
        }
    });

    if (brandSubmenu && brands.length > 0) {
        brandSubmenu.innerHTML = brands.map(brand => `
            <li class="">
                <a href="collections.html?brand=${brand.id}">
                    ${brand.brand_name.toUpperCase()}
                </a>
            </li>
        `).join('');
    }
}

function checkLoginStatus() {
    const token = localStorage.getItem('token');
    const accountInner = document.querySelector('.site_account_inner');
    const accountTitle = document.querySelector('.site_account_title');

    if (!accountInner) return;

    if (token) {
        let user = {};
        try {
            user = JSON.parse(localStorage.getItem('user_info')) || {};
        } catch(e) {}

        if (accountTitle) accountTitle.innerText = `Chào, ${user.full_name || 'Khách'}`;
        
        accountInner.innerHTML = `
            <ul>
                <li><a href="./settingAccount.html">Tài khoản của tôi</a></li>
                <li><a href="./historyOrder.html">Lịch sử đặt hàng</a></li>
                ${user.role === 'admin' ? '<li><a href="./admin.html" style="color: #d72128; font-weight: bold;">Trang Quản Trị</a></li>' : ''}
                <li><a href="#" id="btn-logout">Đăng xuất</a></li>
            </ul>
        `;

        document.getElementById('btn-logout')?.addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.removeItem('token');
            localStorage.removeItem('user_info');
            alert("Đã đăng xuất!");
            window.location.reload();
        });
    } else {
        if (accountTitle) accountTitle.innerText = 'Tài khoản';
        accountInner.innerHTML = `
            <ul>
                <li><a href="./login.html">Đăng nhập</a></li>
                <li><a href="./register.html">Đăng ký</a></li>
            </ul>
        `;
    }
}