// Dữ liệu sản phẩm xưởng
const products = [
  {
    id: 1,
    title: "Giường Ngủ Hiện Đại MDF 1m6",
    code: "DN-G01",
    price: "1.800.000 đ",
    oldPrice: "2.100.000 đ",
    mainImg: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=600&q=80",
    images: [
      "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=600&q=80",
      "https://images.unsplash.com/photo-1540518614846-7eded433c457?w=600&q=80",
      "https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?w=600&q=80"
    ],
    desc: "▶ Kích thước: 1m6 x 2m (Cao 30cm)<br>▶ Chất liệu: Gỗ MDF phủ Melamine chống trầy<br>▶ Khuyến mãi: Miễn phí vận chuyển & LẮP ĐẶT TẬN NƠI tại Nam Định."
  },
  {
    id: 2,
    title: "Tủ Quần Áo 3 Cánh Vân Sồi",
    code: "DN-T03",
    price: "2.500.000 đ",
    oldPrice: "2.900.000 đ",
    mainImg: "https://images.unsplash.com/photo-1595428774223-ef52624120d2?w=600&q=80",
    images: [
      "https://images.unsplash.com/photo-1595428774223-ef52624120d2?w=600&q=80",
      "https://images.unsplash.com/photo-1558997519-83ea9252edf8?w=600&q=80"
    ],
    desc: "▶ Kích thước: Rộng 1m6 x Cao 2m x Sâu 55cm<br>▶ Bản lề hơi giảm chấn êm ái không kêu<br>▶ Khuyến mãi: Bao chở và thợ đến dựng hoàn thiện tận phòng ngủ."
  },
  {
    id: 3,
    title: "Bộ Bàn Ăn 4 Ghế Gọn Gàng",
    code: "DN-BA04",
    price: "2.800.000 đ",
    oldPrice: "3.200.000 đ",
    mainImg: "https://images.unsplash.com/photo-1617806118233-18e1de247200?w=600&q=80",
    images: [
      "https://images.unsplash.com/photo-1617806118233-18e1de247200?w=600&q=80",
      "https://images.unsplash.com/photo-1530018607912-eff2daa1bac4?w=600&q=80"
    ],
    desc: "▶ Gồm 1 bàn ăn chữ nhật + 4 ghế tựa êm ái<br>▶ Sơn bóng chống nước, lau chùi dầu mỡ dễ dàng<br>▶ Khuyến mãi: Miễn phí giao hàng tại Nam Định."
  },
  {
    id: 4,
    title: "Bàn Trang Điểm Gương Tròn",
    code: "DN-BTD01",
    price: "1.100.000 đ",
    oldPrice: "1.350.000 đ",
    mainImg: "https://images.unsplash.com/photo-1615066390971-03e4e1c36ddf?w=600&q=80",
    images: [
      "https://images.unsplash.com/photo-1615066390971-03e4e1c36ddf?w=600&q=80"
    ],
    desc: "▶ Gương tròn viền LED nịnh sáng, kèm 1 ghế đôn nhỏ<br>▶ Vận chuyển bằng xe máy giao nhanh trong ngày."
  },
  {
    id: 5,
    title: "Bàn Học / Làm Việc Liền Giá Sách",
    code: "DN-BH01",
    price: "850.000 đ",
    oldPrice: "1.000.000 đ",
    mainImg: "https://images.unsplash.com/photo-1538688525198-9b88f6f53126?w=600&q=80",
    images: [
      "https://images.unsplash.com/photo-1538688525198-9b88f6f53126?w=600&q=80"
    ],
    desc: "▶ Kích thước 1m x 50cm kèm hệ giá sách tiện lợi<br>▶ Phù hợp cho sinh viên, học sinh hoặc làm việc tại nhà."
  },
  {
    id: 6,
    title: "Tủ Quần Áo 2 Cánh Nhỏ Gọn",
    code: "DN-T02",
    price: "1.950.000 đ",
    oldPrice: "2.300.000 đ",
    mainImg: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&q=80",
    images: [
      "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&q=80"
    ],
    desc: "▶ Rộng 1m2 x Cao 2m. Thích hợp cho phòng ngủ diện tích vừa và nhỏ."
  }
];

// Hiển thị lưới sản phẩm
const grid = document.getElementById("productGrid");
products.forEach(p => {
  const card = document.createElement("div");
  card.className = "product-card";
  card.onclick = () => openModal(p.id);
  card.innerHTML = `
    <img src="${p.mainImg}" alt="${p.title}">
    <div class="card-body">
      <h4 class="product-title">${p.title}</h4>
      <p class="price">${p.price}</p>
      <span class="view-detail-hint">🔍 Bấm xem ảnh góc & đặt mua</span>
    </div>
  `;
  grid.appendChild(card);
});

// Bật Modal xem chi tiết
function openModal(id) {
  const p = products.find(item => item.id === id);
  if (!p) return;

  document.getElementById("modalTitle").innerText = p.title;
  document.getElementById("modalCode").innerText = p.code;
  document.getElementById("modalPrice").innerText = p.price;
  document.getElementById("modalOldPrice").innerText = p.oldPrice;
  document.getElementById("modalDesc").innerHTML = p.desc;
  
  const mainImg = document.getElementById("modalMainImg");
  mainImg.src = p.mainImg;

  // Render ảnh góc
  const thumbBox = document.getElementById("modalThumbnails");
  thumbBox.innerHTML = "";
  p.images.forEach((imgSrc, index) => {
    const thumb = document.createElement("img");
    thumb.src = imgSrc;
    if (index === 0) thumb.className = "active-thumb";
    thumb.onclick = () => {
      mainImg.src = imgSrc;
      document.querySelectorAll(".thumbnail-list img").forEach(i => i.classList.remove("active-thumb"));
      thumb.classList.add("active-thumb");
    };
    thumbBox.appendChild(thumb);
  });

  // Điền dữ liệu ẩn vào Form
  document.getElementById("orderProductName").value = p.title + " (" + p.code + ")";
  document.getElementById("orderProductPrice").value = p.price;

  document.getElementById("productModal").style.display = "block";
}

function closeModal() {
  document.getElementById("productModal").style.display = "none";
}

function handleOrderSubmit() {
  alert("Cảm ơn ông/bà đã đặt hàng! Xưởng Đồ Gỗ Điện Ngọc (Bố tôi) sẽ gọi điện thoại lại ngay để xác nhận và hẹn giờ chở đến lắp ráp tận nơi.");
}
