/**
 * Payment Stripe JS
 * Handles Stripe Elements and Backend Order Confirmation
 */

const BASE_URL = 'http://127.0.0.1:8000';
const STRIPE_PUBLISHABLE_KEY = 'pk_test_51SmAIzHXiTh7LX3CiPzv2l1gLUdOMdp3qGZAQwTudwBh9JDoS8X3NDR9YwyKsFaR1iNPmVKN1nGiLW45qaqpHYpL00iKX0tapL'; // Replace with your actual key

let stripe;
let elements;

document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const clientSecret = urlParams.get('client_secret');
    const type = urlParams.get('type'); // 'buy-now' or 'cart'

    if (!clientSecret) {
        showMessage("Không tìm thấy thông tin thanh toán. Vui lòng thử lại.");
        document.getElementById('submit').disabled = true;
        return;
    }

    // Initialize Stripe
    stripe = Stripe(STRIPE_PUBLISHABLE_KEY);

    // Mount Elements
    const options = {
        clientSecret: clientSecret,
        appearance: {
            theme: 'stripe',
            variables: {
                colorPrimary: '#ec1c24',
                colorBackground: '#ffffff',
                colorText: '#30313d',
                colorDanger: '#df1b41',
                fontFamily: 'futura-REGULAR, sans-serif',
            }
        },
    };

    elements = stripe.elements(options);
    const paymentElement = elements.create('payment');
    paymentElement.mount('#payment-element');

    // Render Summary
    renderOrderSummary(type);

    // Handle Form Submission
    const form = document.getElementById('payment-form');
    form.addEventListener('submit', handleSubmit);
});

async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);

    const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
            // No redirect if success, handle manually or using return_url
            // return_url: window.location.origin + '/payment-stripe.html?success=true',
        },
        redirect: 'if_required'
    });

    if (error) {
        if (error.type === "card_error" || error.type === "validation_error") {
            showMessage(error.message);
        } else {
            showMessage("Đã xảy ra lỗi không xác định. Vui lòng thử lại.");
        }
        setLoading(false);
    } else {
        // Payment successful (or requires no further action)
        await handleSuccessfulPayment();
    }
}

async function handleSuccessfulPayment() {
    const urlParams = new URLSearchParams(window.location.search);
    const type = urlParams.get('type');
    const paymentIntentId = await getPaymentIntentId();

    const token = localStorage.getItem('token');
    const orderData = JSON.parse(sessionStorage.getItem('pending_order_payload'));

    if (!orderData) {
        showMessage("Lỗi: Không tìm thấy dữ liệu đơn hàng. Vui lòng liên hệ hỗ trợ.");
        setLoading(false);
        return;
    }

    // Add movement intent ID to payload
    orderData.payment_intent_id = paymentIntentId;

    const endpoint = type === 'buy-now' ? '/api/payments/confirm-from-products' : '/api/payments/confirm-from-cart';

    try {
        const response = await fetch(`${BASE_URL}${endpoint}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(orderData)
        });

        const result = await response.json();

        if (response.ok) {
            // Success
            sessionStorage.removeItem('pending_order_payload');
            alert("Thanh toán và đặt hàng thành công!");
            window.location.href = 'historyOrder.html';
        } else {
            showMessage("Lỗi khi tạo đơn hàng: " + (result.detail || "Không rõ nguyên nhân"));
            setLoading(false);
        }
    } catch (err) {
        console.error("Order Confirmation Error:", err);
        showMessage("Lỗi kết nối máy chủ. Đơn hàng của bạn có thể đã được thanh toán nhưng chưa được ghi nhận. Vui lòng kiểm tra lịch sử đơn hàng.");
        setLoading(false);
    }
}

async function getPaymentIntentId() {
    // Stripe.js doesn't easily give the ID back if we don't redirect
    // But we can extract it from the clientSecret
    const urlParams = new URLSearchParams(window.location.search);
    const clientSecret = urlParams.get('client_secret');
    return clientSecret.split('_secret_')[0];
}

function renderOrderSummary(type) {
    const orderData = JSON.parse(sessionStorage.getItem('pending_order_payload'));
    const summaryContainer = document.getElementById('summary-items');
    const totalEl = document.getElementById('summary-total');

    if (!orderData) return;

    let itemsHtml = '';
    let total = 0;

    if (type === 'buy-now') {
        const item = orderData.items[0];
        // We might need to fetch product name if not in orderData helper
        // For now let's assume we stored enough info or just show generic
        itemsHtml = `
            <div class="order-row">
                <span>Sản phẩm #${item.product_id} (x${item.quantity})</span>
                <span>Màu: ${item.color}, Size: ${item.size}</span>
            </div>
        `;
    } else {
        itemsHtml = `<div class="order-row"><span>Đơn hàng từ giỏ hàng</span></div>`;
    }

    summaryContainer.innerHTML = itemsHtml;
    // Total is harder to get without re-calculating or storing it
    // Let's rely on what the user saw on the previous page
    const storedTotal = sessionStorage.getItem('pending_order_total');
    totalEl.innerText = storedTotal ? parseInt(storedTotal).toLocaleString('vi-VN') + ' ₫' : '--- ₫';
}

// UI Helpers
function showMessage(messageText) {
    const messageContainer = document.querySelector("#payment-message");
    messageContainer.classList.remove("hidden");
    messageContainer.textContent = messageText;

    setTimeout(function () {
        messageContainer.classList.add("hidden");
        messageContainer.textContent = "";
    }, 4000);
}

function setLoading(isLoading) {
    const submitBtn = document.querySelector("#submit");
    const spinner = document.querySelector("#spinner");
    const buttonText = document.querySelector("#button-text");

    if (isLoading) {
        submitBtn.disabled = true;
        spinner.style.display = "inline-block";
        buttonText.textContent = "Đang xử lý...";
    } else {
        submitBtn.disabled = false;
        spinner.style.display = "none";
        buttonText.textContent = "Thanh toán ngay";
    }
}
