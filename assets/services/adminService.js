const BASE_URL = 'http://127.0.0.1:8000';

const AdminService = {
    getHeaders(isFormData = false) {
        const token = localStorage.getItem('token');
        const headers = {
            'Accept': 'application/json'
        };
        
        if (!isFormData) {
            headers['Content-Type'] = 'application/json';
        }

        if (token && token !== 'undefined' && token !== 'null') {
            headers['Authorization'] = `Bearer ${token}`;
        }
        
        return headers;
    },

    async handleResponse(response) {
        const text = await response.text();
        let data;
        try {
            data = text ? JSON.parse(text) : {};
        } catch (e) {
            data = { detail: text || `Mã lỗi ${response.status}` };
        }

        if (!response.ok) {
            throw data;
        }
        return data;
    },

    // PRODUCTS
    async getProducts(page = 1, pageSize = 20) {
        try {
            const response = await fetch(`${BASE_URL}/products?page=${page}&page_size=${pageSize}`);
            return await response.json();
        } catch (e) {
            return { data: { items: [] } };
        }
    },

    async createProduct(productData) {
        const isFormData = productData instanceof FormData;
        try {
            console.log("Sending POST to:", `${BASE_URL}/products`);
            const response = await fetch(`${BASE_URL}/products`, {
                method: 'POST',
                headers: this.getHeaders(isFormData),
                body: isFormData ? productData : JSON.stringify(productData)
            });
            return await this.handleResponse(response);
        } catch (error) {
            console.error(">>> DEBUG FETCH ERROR:", error);
            if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
                console.error("Lỗi này thường do: 1. Server sập, 2. Thiếu 'python-multipart' ở Backend, hoặc 3. File quá lớn bị Server ngắt kết nối.");
                throw { detail: "Lỗi kết nối hoặc CORS (Vui lòng kiểm tra Console/Backend Terminal)" };
            }
            throw error;
        }
    },

    async updateProduct(id, productData) {
        const isFormData = productData instanceof FormData;
        const response = await fetch(`${BASE_URL}/products/${id}`, {
            method: 'PUT',
            headers: this.getHeaders(isFormData),
            body: isFormData ? productData : JSON.stringify(productData)
        });
        return await this.handleResponse(response);
    },

    async updateProductStatus(id, status) {
        const response = await fetch(`${BASE_URL}/products/${id}`, {
            method: 'PUT',
            headers: this.getHeaders(false),
            body: JSON.stringify({ status: status })
        });
        return await this.handleResponse(response);
    },

    async deleteProduct(id) {
        const response = await fetch(`${BASE_URL}/products/${id}`, {
            method: 'DELETE',
            headers: this.getHeaders(false)
        });
        return await this.handleResponse(response);
    },

    // CATEGORIES
    async getCategories() {
        const response = await fetch(`${BASE_URL}/categories`);
        return await response.json();
    },

    async createCategory(catData) {
        const response = await fetch(`${BASE_URL}/categories`, {
            method: 'POST',
            headers: this.getHeaders(false),
            body: JSON.stringify(catData)
        });
        return await this.handleResponse(response);
    },

    // BRANDS
    async getBrands() {
        const response = await fetch(`${BASE_URL}/brands`);
        return await response.json();
    },

    async createBrand(brandData) {
        const response = await fetch(`${BASE_URL}/brands`, {
            method: 'POST',
            headers: this.getHeaders(false),
            body: JSON.stringify(brandData)
        });
        return await this.handleResponse(response);
    },

    // UPLOAD
    async uploadFiles(formData) {
        try {
            const response = await fetch(`${BASE_URL}/upload`, {
                method: 'POST',
                headers: this.getHeaders(true),
                body: formData
            });
            return await this.handleResponse(response);
        } catch (error) {
            console.error("Upload error:", error);
            throw error;
        }
    },

    // ORDERS
    async getAllOrders(page = 1, pageSize = 20, status = '', paymentStatus = '') {
        const params = new URLSearchParams({
            page: page,
            limit: pageSize
        });
        if (status) params.append('status', status);
        if (paymentStatus) params.append('payment_status', paymentStatus);

        const response = await fetch(`${BASE_URL}/api/orders/admin/all?${params.toString()}`, {
            headers: this.getHeaders()
        });
        return await this.handleResponse(response);
    },

    async updateOrderStatus(orderId, status) {
        const response = await fetch(`${BASE_URL}/api/orders/admin/${orderId}/status`, {
            method: 'PUT',
            headers: this.getHeaders(),
            body: JSON.stringify({ status: status })
        });
        return await this.handleResponse(response);
    }
};
