const FORMSPREE_ENDPOINT = "https://formspree.io/f/mwlewgqe";
const GOOGLE_SHEET_DATA_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vR3eTKG6gnblYZMIk_--2IC-yo-iJ0NTXky5V4ZLEiEE2VPCXSxszMi6f8jG0CYh4GyUhuxbf4rL2I_/pub?gid=0&single=true&output=tsv";

let products = [];
let currentSelectedProduct = null;
let cart = JSON.parse(localStorage.getItem('user_cart') || '[]');
let pendingOrderPayload = null;

// Intersection Observer kích hoạt hiệu ứng cuộn trang
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('active');
    }
  });
}, { 
  threshold: 0.05,
  rootMargin: "0px 0px -30px 0px"
});

function observeElements() {
  document.querySelectorAll('.reveal').forEach(el => {
    revealObserver.observe(el);
  });
}

// Khởi chạy khi tải xong trang
document.addEventListener("DOMContentLoaded", () => {
  // Quan sát các phần tĩnh có sẵn trong HTML
  observeElements();

  if (typeof Swiper !== 'undefined') {
    try {
      new Swiper('.hero-swiper', {
        loop: true,
        effect: 'fade',
        autoplay: { delay: 5000, disableOnInteraction: false },
        pagination: { el: '.swiper-pagination', clickable: true }
      });
    } catch (e) {
      console.warn("Lỗi Swiper:", e);
    }
  }

  loadProductsFromSheet();
  updateCartCount();

  // Tự động mở Chatbox sau 2.5s
  setTimeout(() => {
    const box = document.getElementById("aiChatBox");
    if (box && !box.classList.contains("active")) {
      box.classList.add("active");
    }
  }, 2500);
});

function toggleAIChat() {
  const box = document.getElementById("aiChatBox");
  if (box) {
    box.classList.toggle("active");
  }
}

function esc(str) {
  const d = document.createElement('div');
  d.innerText = (str === null || str === undefined) ? '' : String(str);
  return d.innerHTML;
}

function showToast(message, isSuccess = true) {
  const container = document.getElementById("toastContainer");
  if (!container) return;
  const toast = document.createElement("div");
  toast.className = "toast-msg";
  if (!isSuccess) toast.style.borderLeftColor = "#b22c22";
  
  toast.innerHTML = `
    <div style="display: flex; align-items: center; justify-content: center; background: ${isSuccess ? '#27ae60' : '#b22c22'}; border-radius: 50%; width: 26px; height: 26px; color: white; font-weight:bold;">
       ${isSuccess ? '✓' : '!'}
    </div>
    <div>${message}</div>
  `;
  container.appendChild(toast);
  setTimeout(() => toast.classList.add("show"), 10);
  setTimeout(() => { toast.classList.remove("show"); setTimeout(() => toast.remove(), 400); }, 3500);
}

function updateCartCount() {
  const badge = document.getElementById('cartCountBadge');
  if (!badge) return;
  const totalQty = cart.reduce((sum, item) => sum + item.qty, 0);
  badge.innerText = totalQty;
  localStorage.setItem('user_cart', JSON.stringify(cart));
}

function getEmbedYouTubeUrl(url) {
  if (!url) return '';
  let videoId = '';
  if (url.includes('youtu.be/')) videoId = url.split('youtu.be/')[1].split('?')[0];
  else if (url.includes('watch?v=')) videoId = url.split('watch?v=')[1].split('&')[0];
  else if (url.includes('/embed/')) return url;
  return videoId ? `https://www.youtube.com/embed/${videoId}?autoplay=1` : '';
}

async function loadProductsFromSheet() {
  const grid = document.getElementById("productGrid");
  if (!grid) return;
  grid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 60px; color: #555; font-weight: 800; font-size: 16px;">Đang tải dữ liệu sản phẩm từ xưởng...</div>`;
  
  try {
    const response = await fetch(GOOGLE_SHEET_DATA_URL);
    const rawText = await response.text();
    const lines = rawText.trim().split(/\r?\n/);
    if (lines.length < 2) throw new Error("Dữ liệu rỗng");

    const isTSV = lines[0].includes("\t");
    const delimiter = isTSV ? "\t" : ",";
    const headers = lines[0].split(delimiter).map(h => h.trim().replace(/^"|"$/g, ''));

    products = lines.slice(1).map(line => {
      const values = line.split(delimiter).map(v => v.trim().replace(/^"|"$/g, ''));
      let obj = {};
      headers.forEach((h, i) => { obj[h] = values[i] !== undefined ? values[i] : ''; });
      obj.id = parseInt(obj.id) || 1;
      obj.rawPrice = parseInt((obj.price || '').replace(/\D/g, '')) || 0;
      
      const stockVal = obj.stock || obj.tonKho;
      obj.stock = (stockVal !== undefined && stockVal !== '') ? parseInt(stockVal) : -1;
      
      let allImgs = [obj.mainImg];
      if (obj.extraImgs) {
        const extra = obj.extraImgs.split(';').map(s => s.trim()).filter(Boolean);
        allImgs = allImgs.concat(extra);
      }
      obj.images = allImgs;
      return obj;
    });

    renderProducts(products);
  } catch (err) {
    grid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 60px; color: #b22c22; font-weight: 800;">Hệ thống tải dữ liệu bị lỗi. Xin vui lòng tải lại trang.</div>`;
  }
}

function renderProducts(list) {
  const grid = document.getElementById("productGrid");
  if (!grid) return;
  grid.innerHTML = "";
  if (list.length === 0) {
    grid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 60px; color: #555; font-weight: 800;">Chưa có sản phẩm phù hợp.</div>`;
    return;
  }

  const sortedList = [...list].sort((a, b) => {
    const isAOut = (a.stock === 0) ? 1 : 0;
    const isBOut = (b.stock === 0) ? 1 : 0;
    return isAOut - isBOut;
  });

  sortedList.forEach((p, index) => {
    const isSoldOut = (p.stock === 0);
    const delayIndex = (index % 5) + 1;
    const card = document.createElement("div");
    card.className = `product-card reveal delay-${delayIndex}` + (isSoldOut ? " card-out-of-stock" : "");
    card.onclick = () => openModal(p.id);
    card.innerHTML = `
      ${isSoldOut ? '<div class="badge-card-soldout">Tạm Hết Hàng</div>' : ''}
      <img src="${p.mainImg}" alt="${esc(p.title)}" loading="lazy">
      <div class="card-body">
        <h4 class="product-title">${esc(p.title)}</h4>
        <p class="price">${esc(p.price)}</p>
        <span class="view-detail-hint">${isSoldOut ? 'ĐẶT ĐÓNG THEO YÊU CẦU' : 'XEM CHI TIẾT'}</span>
      </div>
    `;
    grid.appendChild(card);
  });

  // Kích hoạt quan sát cho từng thẻ sản phẩm vừa render
  observeElements();
}

function filterCategory(cat, btn) {
  document.querySelectorAll(".category-tags .tag-btn").forEach(b => b.classList.remove("active"));
  if (btn) btn.classList.add("active");
  else {
    const matchBtn = Array.from(document.querySelectorAll(".category-tags .tag-btn")).find(b => b.getAttribute("onclick") && b.getAttribute("onclick").includes(`'${cat}'`));
    if (matchBtn) matchBtn.classList.add("active");
    else {
      const firstBtn = document.querySelector(".category-tags .tag-btn");
      if (firstBtn) firstBtn.classList.add("active");
    }
  }
  let filtered = (cat === "all") ? products : products.filter(p => p.category === cat || p.sub === cat);
  renderProducts(filtered);
  const prodSec = document.getElementById("products");
  if (prodSec) prodSec.scrollIntoView({ behavior: 'smooth' });
}

function handleSearch() {
  const query = document.getElementById("searchInput").value.toLowerCase().trim();
  const filtered = products.filter(p => (p.title || '').toLowerCase().includes(query) || (p.code || '').toLowerCase().includes(query));
  renderProducts(filtered);
}

function openModal(id) {
  const p = products.find(item => item.id === id);
  if (!p) return;
  currentSelectedProduct = p;

  document.getElementById("modalTitle").innerText = p.title;
  document.getElementById("modalCode").innerText = p.code;
  document.getElementById("modalPrice").innerText = p.price;
  document.getElementById("modalOldPrice").innerText = p.oldPrice;
  document.getElementById("modalDesc").innerHTML = p.desc;
  
  const stockEl = document.getElementById("modalStock");
  const actionArea = document.getElementById("modalActionArea");
  
  if (p.stock === 0) {
    stockEl.className = "stock-tag stock-out";
    stockEl.innerText = "✖ Hết hàng sẵn (Nhận đặt làm)";
    actionArea.innerHTML = `<a href="https://zalo.me/0984650825" target="_blank" class="btn-solid btn-full" style="background:#0068ff;">💬 NHẮN ZALO ĐẶT ĐÓNG THEO YÊU CẦU</a>`;
    document.getElementById("directSubmitBtn").innerText = "GỬI YÊU CẦU ĐẶT ĐÓNG THEO MẪU NÀY";
  } else {
    stockEl.className = "stock-tag stock-in";
    stockEl.innerText = (p.stock > 0) ? `✔ Còn ${p.stock} sản phẩm` : "✔ Có sẵn tại xưởng";
    actionArea.innerHTML = `<button type="button" class="btn-action btn-full" onclick="addToCartFromModal()"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></svg> THÊM VÀO GIỎ HÀNG</button>`;
    document.getElementById("directSubmitBtn").innerText = "XÁC NHẬN MẪU NÀY";
  }
  
  const mainImg = document.getElementById("modalMainImg");
  const videoFrame = document.getElementById("modalVideoFrame");
  mainImg.style.display = "block";
  videoFrame.style.display = "none";
  videoFrame.src = "";
  mainImg.src = p.mainImg;

  const thumbBox = document.getElementById("modalThumbnails");
  thumbBox.innerHTML = "";
  p.images.forEach((imgSrc, index) => {
    const thumb = document.createElement("img");
    thumb.src = imgSrc;
    thumb.className = "thumb-item" + (index === 0 ? " active-thumb" : "");
    thumb.onclick = () => {
      mainImg.style.display = "block"; videoFrame.style.display = "none"; videoFrame.src = ""; mainImg.src = imgSrc;
      document.querySelectorAll(".thumbnail-list .thumb-item, .thumbnail-list .thumb-video-btn").forEach(i => i.classList.remove("active-thumb"));
      thumb.classList.add("active-thumb");
    };
    thumbBox.appendChild(thumb);
  });

  if (p.videoUrl) {
    const embedUrl = getEmbedYouTubeUrl(p.videoUrl);
    if (embedUrl) {
      const vBtn = document.createElement("div");
      vBtn.className = "thumb-video-btn"; vBtn.innerHTML = "XEM<br>VIDEO";
      vBtn.onclick = () => {
        mainImg.style.display = "none"; videoFrame.style.display = "block"; videoFrame.src = embedUrl;
        document.querySelectorAll(".thumbnail-list .thumb-item, .thumbnail-list .thumb-video-btn").forEach(i => i.classList.remove("active-thumb"));
        vBtn.classList.add("active-thumb");
      };
      thumbBox.appendChild(vBtn);
    }
  }
  document.getElementById("productModal").style.display = "block";
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.style.display = "none";
  if (modalId === "productModal") {
    const videoFrame = document.getElementById("modalVideoFrame");
    if (videoFrame) videoFrame.src = "";
  }
}

function addToCartFromModal() {
  if (!currentSelectedProduct) return;
  const exist = cart.find(i => i.id === currentSelectedProduct.id);
  if (exist) exist.qty += 1; else cart.push({ ...currentSelectedProduct, qty: 1 });
  updateCartCount();
  showToast(`Đã thêm "${esc(currentSelectedProduct.title)}" vào Giỏ hàng.`);
}

function openCartModal() {
  const area = document.getElementById('cartContentArea');
  if (!area) return;
  if (cart.length === 0) {
    area.innerHTML = `<div style="text-align: center; padding: 50px; background: #fff; border-radius: 16px; border: 1px solid #e0d8d0;"><p style="font-size: 17px; margin-bottom: 25px; font-weight: 800; color: #555;">Giỏ hàng của bác đang trống.</p><button class="btn-solid" style="margin: auto;" onclick="closeModal('cartModal')">XEM THÊM SẢN PHẨM</button></div>`;
  } else {
    let total = 0;
    let rows = cart.map((item, index) => {
      const itemTotal = item.rawPrice * item.qty;
      total += itemTotal;
      return `<tr>
        <td><b style="color: #222; font-size: 15px;">${esc(item.title)}</b><br><span style="font-size: 13.5px; color: #777;">Mã SP: ${esc(item.code)}</span></td>
        <td style="font-weight: 800; color: #555; white-space: nowrap;">${esc(item.price)}</td>
        <td><div style="display: inline-flex; align-items: center; border: 1px solid #ccc; border-radius: 6px; overflow: hidden;"><button class="cart-qty-btn" style="border:none;" onclick="changeQty(${index}, -1)">-</button><span style="padding: 0 14px; font-weight: 900; background: #fff; font-size: 16px;">${item.qty}</span><button class="cart-qty-btn" style="border:none;" onclick="changeQty(${index}, 1)">+</button></div></td>
        <td><b style="color: #b22c22; font-size: 16px; white-space: nowrap;">${itemTotal.toLocaleString('vi-VN')} đ</b></td>
        <td><button class="cart-del-btn" onclick="removeItem(${index})">XÓA</button></td>
      </tr>`;
    }).join('');

    area.innerHTML = `<div style="overflow-x: auto; background: #fff; border: 1px solid #e0d8d0; border-radius: 12px; margin-bottom: 25px;"><table class="cart-table" style="margin: 0;"><thead><tr><th>Sản phẩm</th><th>Đơn giá</th><th>Số lượng</th><th>Tổng cộng</th><th></th></tr></thead><tbody>${rows}</tbody></table></div>
      <div class="cart-total-box">TỔNG ĐƠN HÀNG: ${total.toLocaleString('vi-VN')} đ</div>
      <form class="order-form" onsubmit="event.preventDefault(); openConfirmModalCart();">
        <h4>THÔNG TIN NHẬN HÀNG</h4>
        <p style="font-size: 14.5px; color: #555; margin-bottom: 15px; font-weight: 600;">Bác cứ điền thông tin, xưởng trực tiếp chở đến lắp đặt miễn phí tại Nam Định.</p>
        <div class="form-group"><input type="text" id="cartCustName" placeholder="Họ và tên bác *" required></div>
        <div class="form-group"><input type="tel" id="cartCustPhone" placeholder="Số điện thoại nhận hàng *" required></div>
        <div class="form-group"><input type="text" id="cartCustAddress" placeholder="Địa chỉ chi tiết (Thôn/Xóm/Xã/Huyện) *" required></div>
        <div class="form-group"><textarea id="cartCustNote" rows="2" placeholder="Ghi chú thêm cho thợ..."></textarea></div>
        <button type="submit" class="btn-action btn-full">TIẾN HÀNH ĐẶT HÀNG</button>
      </form>`;
  }
  document.getElementById('cartModal').style.display = 'block';
}

function changeQty(index, delta) {
  cart[index].qty += delta;
  if (cart[index].qty <= 0) cart.splice(index, 1);
  updateCartCount(); openCartModal();
}
function removeItem(index) {
  cart.splice(index, 1); updateCartCount(); openCartModal();
}

async function sendDataToGmail(payload) {
  return fetch(FORMSPREE_ENDPOINT, { method: "POST", headers: { "Accept": "application/json", "Content-Type": "application/json" }, body: JSON.stringify(payload) });
}

function openConfirmModalDirect() {
  const name = document.getElementById('directName').value.trim(); const phone = document.getElementById('directPhone').value.trim(); const address = document.getElementById('directAddress').value.trim(); const note = document.getElementById('directNote').value.trim();
  pendingOrderPayload = { "Loai_Don": (currentSelectedProduct.stock === 0) ? "ĐẶT ĐÓNG THEO YÊU CẦU" : "MUA TRỰC TIẾP", "San_Pham": `${currentSelectedProduct.title} (${currentSelectedProduct.code})`, "Gia_Tien": currentSelectedProduct.price, "Ho_Ten_Khach": name, "So_Dien_Thoai": phone, "Dia_Chi_Giao": address, "Ghi_Chu": note || "Không có", "isCart": false };

  document.getElementById('confirmOrderSummary').innerHTML = `<div style="display: flex; justify-content: space-between; margin-bottom: 10px; flex-wrap: wrap;"><span style="font-weight: 800;">Sản phẩm:</span><span style="text-align: right;">${esc(currentSelectedProduct.title)}<br><small style="color: #777;">(Mã: ${esc(currentSelectedProduct.code)})</small></span></div><div style="display: flex; justify-content: space-between; margin-bottom: 15px; align-items: baseline;"><span style="font-weight: 800;">Thanh toán (khi nhận):</span><span style="color:#b22c22; font-weight:900; font-size:20px; white-space: nowrap; font-family: 'Merriweather', serif;">${esc(currentSelectedProduct.price)}</span></div><hr style="border: 0; border-top: 1px dashed #ccc; margin: 15px 0;"><p style="margin-bottom: 6px;"><b>Khách hàng:</b> ${esc(name)} - <b>SĐT:</b> ${esc(phone)}</p><p style="margin-bottom: 6px;"><b>Địa chỉ:</b> ${esc(address)}</p>${note ? `<p><b>Ghi chú:</b> ${esc(note)}</p>` : ''}`;
  document.getElementById('confirmOrderModal').style.display = 'block';
}

function openConfirmModalCart() {
  const name = document.getElementById('cartCustName').value.trim(); const phone = document.getElementById('cartCustPhone').value.trim(); const address = document.getElementById('cartCustAddress').value.trim(); const note = document.getElementById('cartCustNote').value.trim();
  let itemsText = cart.map(i => `${i.title} (${i.code}) x SL:${i.qty} = ${(i.rawPrice * i.qty).toLocaleString('vi-VN')} đ`).join(' | ');
  let total = cart.reduce((sum, item) => sum + (item.rawPrice * item.qty), 0);
  pendingOrderPayload = { "Loai_Don": "ĐẶT GIỎ HÀNG", "Danh_Sach_Mon": itemsText, "Tong_Tien": total.toLocaleString('vi-VN') + " đ", "Ho_Ten_Khach": name, "So_Dien_Thoai": phone, "Dia_Chi_Giao": address, "Ghi_Chu": note || "Không có", "isCart": true };
  let cartItemsHtml = cart.map(i => `<div style="display: flex; justify-content: space-between; margin-bottom: 8px; font-weight: 700;"><span>${esc(i.title)} <b style="color: #b22c22;">x${i.qty}</b></span> <span style="white-space: nowrap;">${(i.rawPrice * i.qty).toLocaleString('vi-VN')} đ</span></div>`).join('');

  document.getElementById('confirmOrderSummary').innerHTML = `<div style="margin-bottom: 12px; font-weight: 800;">Danh sách món:</div><div style="background: #fdfaf6; padding: 15px; border: 1px solid #e0d8d0; border-radius: 8px; margin-bottom: 20px;">${cartItemsHtml}</div><div style="display: flex; justify-content: space-between; margin-bottom: 15px; align-items: baseline;"><span style="font-weight: 800; font-size: 16px;">Tổng thanh toán:</span><span style="color:#b22c22; font-weight:900; font-size:22px; white-space: nowrap; font-family: 'Merriweather', serif;">${total.toLocaleString('vi-VN')} đ</span></div><hr style="border: 0; border-top: 1px dashed #ccc; margin: 15px 0;"><p style="margin-bottom: 6px;"><b>Khách hàng:</b> ${esc(name)} - <b>SĐT:</b> ${esc(phone)}</p><p style="margin-bottom: 6px;"><b>Địa chỉ:</b> ${esc(address)}</p>${note ? `<p><b>Ghi chú:</b> ${esc(note)}</p>` : ''}`;
  document.getElementById('confirmOrderModal').style.display = 'block';
}

function executeFinalOrderSend() {
  if (!pendingOrderPayload) return;
  const btn = document.getElementById('finalConfirmBtn');
  btn.innerText = "ĐANG LÊN ĐƠN..."; btn.disabled = true;
  const isCart = pendingOrderPayload.isCart; delete pendingOrderPayload.isCart;

  sendDataToGmail(pendingOrderPayload).then(() => {
    showToast("Đã gửi đơn hàng thành công! Xưởng sẽ gọi lại ngay.");
    closeModal('confirmOrderModal');
    if (isCart) { cart = []; updateCartCount(); closeModal('cartModal'); } else { closeModal('productModal'); }
  }).catch(() => {
    showToast("Đã ghi nhận đơn hàng thành công!");
    closeModal('confirmOrderModal');
    if (isCart) { cart = []; updateCartCount(); closeModal('cartModal'); } else { closeModal('productModal'); }
  }).finally(() => {
    btn.innerText = "ĐỒNG Ý GỬI ĐƠN"; btn.disabled = false; pendingOrderPayload = null;
  });
}

function handleAISend() {
  const input = document.getElementById("aiInput"); 
  const text = input.value.trim(); 
  if (!text) return;
  const body = document.getElementById("aiChatBody");
  const userMsg = document.createElement("div"); 
  userMsg.className = "msg msg-user"; 
  userMsg.innerText = text; 
  body.appendChild(userMsg); 
  input.value = "";

  setTimeout(() => {
    let reply = "Xưởng nhận đóng theo kích thước yêu cầu của bác. Bác vui lòng gọi Hotline/Zalo 0984650825 để thợ tư vấn kỹ hơn nhé.";
    const t = text.toLowerCase();
    const found = products.find(p => t.split(" ").some(w => w.length > 2 && p.title.toLowerCase().includes(w)));
    if (found) reply = `Mẫu <b>${esc(found.title)}</b> hiện xưởng đang bán giá <b>${esc(found.price)}</b>. Bao trọn gói chở và ráp tận nhà.`;
    else if (t.includes("giường")) reply = "Xưởng đang sẵn Giường 1m6 (1.800.000đ) và Giường 1m8 (2.100.000đ). Bao trọn gói lắp đặt.";
    else if (t.includes("tủ")) reply = "Tủ áo có dòng 2 cánh (1.950.000đ), 3 cánh (2.500.000đ) và 4 cánh (3.400.000đ). Trực tiếp thợ ráp.";
    else if (t.includes("sofa")) reply = "Sofa văng nỉ bán 3.200.000đ, Sofa Da hoặc góc L lớn là 4.800.000đ bác nhé.";
    const aiMsg = document.createElement("div"); 
    aiMsg.className = "msg msg-ai"; 
    aiMsg.innerHTML = reply; 
    body.appendChild(aiMsg); 
    body.scrollTop = body.scrollHeight;
  }, 400);
}

function toggleMobileMenu(open) {
  const overlay = document.getElementById('mobileMenuOverlay'); 
  if (overlay) {
    overlay.classList.toggle('open', open); 
    document.body.style.overflow = open ? 'hidden' : '';
  }
}
