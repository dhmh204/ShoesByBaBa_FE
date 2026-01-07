const API_BASE_URL = "http://localhost:8080/api";
let uploadedImageUrls = [];

document.addEventListener("DOMContentLoaded", () => {
  loadCategories();
  loadBrands();
  addVariantRow();
});

async function loadCategories() {
  try {
    const res = await fetch(`${API_BASE_URL}/categories`);
    const categories = await res.json();

    const select = document.getElementById("danhMucId");
    select.innerHTML = '<option value="">-- Chọn danh mục --</option>';

    const list = document.getElementById("existing-categories");
    list.innerHTML = "";

    categories.forEach((c) => {
      const opt = document.createElement("option");
      opt.value = c.id;
      opt.textContent = c.ten;
      select.appendChild(opt);

      const li = document.createElement("li");
      li.className = "list-group-item";
      li.textContent = c.ten;
      list.appendChild(li);
    });
  } catch (err) {
    console.error(err);
  }
}

document
  .getElementById("categoryForm")
  .addEventListener("submit", async (e) => {
    e.preventDefault();
    const name = document.getElementById("catName").value;
    const desc = document.getElementById("catDesc").value;

    try {
      const res = await fetch(`${API_BASE_URL}/categories`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ten: name, moTa: desc }),
      });

      if (res.ok) {
        alert("Đã thêm danh mục: " + name);
        document.getElementById("categoryForm").reset();
        loadCategories(); 
      } else {
        alert(" Lỗi khi thêm danh mục");
      }
    } catch (err) {
      console.error(err);
    }
  });

async function loadBrands() {
  try {
    const res = await fetch(`${API_BASE_URL}/brands`);
    const brands = await res.json();

    const select = document.getElementById("thuongHieuId");
    select.innerHTML = '<option value="">-- Chọn thương hiệu --</option>';

    const list = document.getElementById("existing-brands");
    list.innerHTML = "";

    brands.forEach((b) => {
      // Fill Select
      const opt = document.createElement("option");
      opt.value = b.id;
      opt.textContent = b.tenThuongHieu;
      select.appendChild(opt);

      // Fill List
      const li = document.createElement("li");
      li.className = "list-group-item";
      li.textContent = b.tenThuongHieu;
      list.appendChild(li);
    });
  } catch (err) {
    console.error(err);
  }
}

document.getElementById("brandForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const name = document.getElementById("brandName").value;

  try {
    const res = await fetch(`${API_BASE_URL}/brands`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tenThuongHieu: name }),
    });

    if (res.ok) {
      alert("✅ Đã thêm thương hiệu: " + name);
      document.getElementById("brandForm").reset();
      loadBrands();
    } else {
      alert("Lỗi khi thêm thương hiệu");
    }
  } catch (err) {
    console.error(err);
  }
});

async function uploadImage() {
  const fileInput = document.getElementById("imageInput");
  const files = fileInput.files;
  const status = document.getElementById("uploadStatus");
  const container = document.getElementById("imagePreviewContainer");

  if (files.length === 0) {
    alert("Chưa chọn ảnh!");
    return;
  }

  status.innerText = `Đang tải lên ${files.length} ảnh...`;

  const uploadPromises = Array.from(files).map((file) => {
    const formData = new FormData();
    formData.append("file", file);
    return fetch(`${API_BASE_URL}/upload`, {
      method: "POST",
      body: formData,
    }).then((res) => (res.ok ? res.text() : null));
  });

  try {
    const results = await Promise.all(uploadPromises);
    results.forEach((url) => {
      if (url) {
        uploadedImageUrls.push(url);
        const imgDiv = document.createElement("div");
        imgDiv.innerHTML = `<img src="${url}" class="img-thumbnail" style="width: 80px; height: 80px; object-fit: cover;">`;
        container.appendChild(imgDiv);
      }
    });
    status.innerText = "Upload xong!";
    fileInput.value = "";
  } catch (err) {
    status.innerText = "Lỗi upload!";
  }
}

function addVariantRow() {
  const container = document.getElementById("variantContainer");
  const id = Date.now();
  const html = `
        <div class="row g-2 mb-2 variant-row" id="row-${id}">
            <div class="col-4"><input type="text" class="form-control inp-color" placeholder="Màu (Trắng)"></div>
            <div class="col-3"><input type="number" class="form-control inp-size" placeholder="Size (40)"></div>
            <div class="col-3"><input type="number" class="form-control inp-stock" placeholder="SL tồn"></div>
            <div class="col-2"><button type="button" class="btn btn-danger w-100" onclick="document.getElementById('row-${id}').remove()">Xóa</button></div>
        </div>`;
  container.insertAdjacentHTML("beforeend", html);
}

document.getElementById("productForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const variants = [];
  document.querySelectorAll(".variant-row").forEach((row) => {
    const color = row.querySelector(".inp-color").value;
    const size = row.querySelector(".inp-size").value;
    const stock = row.querySelector(".inp-stock").value;
    if (color && size && stock) {
      variants.push({
        color: color,
        size: parseInt(size),
        soLuongTon: parseInt(stock),
      });
    }
  });

  const productData = {
    tenGiay: document.getElementById("tenGiay").value,
    gia: parseFloat(document.getElementById("gia").value),
    moTa: document.getElementById("moTa").value,
    danhMucId: document.getElementById("danhMucId").value,
    thuongHieuId: document.getElementById("thuongHieuId").value,
    imageUrls: uploadedImageUrls,
    variants: variants,
    tinhTrang: "NEW",
  };

  try {
    const res = await fetch(`${API_BASE_URL}/products`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(productData),
    });

    if (res.ok) {
      alert(" Đã thêm sản phẩm thành công!");
      window.location.reload();
    } else {
      alert(" Lỗi server!");
    }
  } catch (err) {
    alert(" Không kết nối được server!");
  }
});

function switchToTab(tabId) {
  const triggerEl = document.querySelector(`#${tabId}`);
  const tab = new bootstrap.Tab(triggerEl);
  tab.show();
}

async function loadOrders() {
  const tbody = document.getElementById("order-table-body");
  tbody.innerHTML =
    '<tr><td colspan="7" class="text-center">Đang tải...</td></tr>';

  try {
    const res = await fetch(`${API_BASE_URL}/orders`);
    if (!res.ok) throw new Error("Lỗi tải đơn hàng");
    const orders = await res.json();

    tbody.innerHTML = "";

    orders.sort(
      (a, b) =>
        new Date(b.createdDate || b.ngayOrder) -
        new Date(a.createdDate || a.ngayOrder)
    );

    if (orders.length === 0) {
      tbody.innerHTML =
        '<tr><td colspan="7" class="text-center">Chưa có đơn hàng nào</td></tr>';
      return;
    }

    orders.forEach((order) => {
      const dateStr = order.createdDate || order.ngayOrder;
      const dateDisplay = dateStr
        ? new Date(dateStr).toLocaleString("vi-VN")
        : "N/A";

      let itemsHtml =
        '<ul class="list-unstyled mb-0" style="font-size: 0.85rem;">';
      if (order.items && order.items.length > 0) {
        order.items.forEach((item) => {
          itemsHtml += `<li>- <b>${item.productName}</b> (${item.color}/${item.size}) x${item.quantity}</li>`;
        });
      }
      itemsHtml += "</ul>";

      const totalMoney = new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
      }).format(order.totalPrice || order.tongTien);

      const status = order.status || order.trangThai || "PENDING";

      const tr = document.createElement("tr");
      tr.innerHTML = `
                <td><span class="badge bg-secondary">#${(order.id || order._id)
                  .toString()
                  .slice(-6)}</span></td>
                <td>${dateDisplay}</td>
                <td>
                    <b>${order.customerName}</b><br>
                    <small>${order.phone}</small><br>
                    <small class="text-muted" style="font-size:11px">${
                      order.address
                    }</small>
                </td>
                <td>${itemsHtml}</td>
                <td class="fw-bold text-danger">${totalMoney}</td>
                <td>
                    <select class="form-select form-select-sm status-select" 
                            style="width: 140px; font-weight:bold;"
                            onchange="updateOrderStatus('${
                              order.id || order._id
                            }', this.value, this)">
                        <option value="PENDING" ${
                          status === "PENDING" || status === "Đang xử lý"
                            ? "selected"
                            : ""
                        } class="text-warning">Đang xử lý</option>
                        <option value="CONFIRMED" ${
                          status === "CONFIRMED" || status === "Đã xác nhận"
                            ? "selected"
                            : ""
                        } class="text-info">Đã xác nhận</option>
                        <option value="SHIPPING" ${
                          status === "SHIPPING" || status === "Đang giao"
                            ? "selected"
                            : ""
                        } class="text-primary">Đang giao</option>
                        <option value="COMPLETED" ${
                          status === "COMPLETED" || status === "Hoàn thành"
                            ? "selected"
                            : ""
                        } class="text-success">Hoàn thành</option>
                        <option value="CANCELLED" ${
                          status === "CANCELLED" || status === "Đã hủy"
                            ? "selected"
                            : ""
                        } class="text-danger">Đã hủy</option>
                    </select>
                </td>
                <td>
                    <button class="btn btn-sm btn-outline-danger" onclick="deleteOrder('${
                      order.id || order._id
                    }')" title="Xóa đơn"><i class="fa-solid fa-trash"></i></button>
                </td>
            `;

      colorizeSelect(tr.querySelector(".status-select"));

      tbody.appendChild(tr);
    });
  } catch (error) {
    console.error(error);
    tbody.innerHTML =
      '<tr><td colspan="7" class="text-center text-danger">Lỗi kết nối server!</td></tr>';
  }
}

async function updateOrderStatus(orderId, newStatus, selectElement) {
  const originalValue = selectElement.getAttribute("data-prev-val");

  colorizeSelect(selectElement);

  if (!confirm(`Bạn muốn đổi trạng thái đơn hàng thành "${newStatus}"?`)) {
    selectElement.value = originalValue || newStatus;
    return;
  }

  try {
    const res = await fetch(`${API_BASE_URL}/orders/${orderId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });

    if (res.ok) {
      alert("Cập nhật trạng thái thành công!");
    } else {
      alert("Cập nhật thất bại!");
    }
  } catch (error) {
    console.error(error);
    alert("Lỗi kết nối!");
  }
}

function colorizeSelect(select) {
  select.className = "form-select form-select-sm status-select";
  const val = select.value;
  if (val === "PENDING") select.classList.add("text-warning", "border-warning");
  else if (val === "CONFIRMED")
    select.classList.add("text-info", "border-info");
  else if (val === "SHIPPING")
    select.classList.add("text-primary", "border-primary");
  else if (val === "COMPLETED")
    select.classList.add("text-success", "border-success");
  else if (val === "CANCELLED")
    select.classList.add("text-danger", "border-danger");

  select.setAttribute("data-prev-val", val);
}

async function deleteOrder(orderId) {
  if (!confirm("Bạn chắc chắn muốn xóa vĩnh viễn đơn hàng này?")) return;

  try {
    const res = await fetch(`${API_BASE_URL}/orders/${orderId}`, {
      method: "DELETE",
    });
    if (res.ok) {
      alert("Đã xóa đơn hàng!");
      loadOrders();
    } else {
      alert("Không thể xóa đơn hàng này.");
    }
  } catch (err) {
    alert("Lỗi server");
  }
}
