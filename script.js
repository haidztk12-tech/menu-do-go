// Thay thế hàm handleAISend trong script.js
async function handleAISend() {
  const input = document.getElementById("aiInput");
  const text = input.value.trim();
  if (!text) return;

  const body = document.getElementById("aiChatBody");

  // 1. Hiển thị tin nhắn người dùng
  const userMsg = document.createElement("div");
  userMsg.className = "msg msg-user";
  userMsg.innerText = text;
  body.appendChild(userMsg);
  input.value = "";
  body.scrollTop = body.scrollHeight;

  // 2. Tạo khung tin nhắn AI chờ
  const aiMsg = document.createElement("div");
  aiMsg.className = "msg msg-ai";
  aiMsg.innerText = "Đang soạn câu trả lời...";
  body.appendChild(aiMsg);
  body.scrollTop = body.scrollHeight;

  // 3. Tối ưu dữ liệu: Chỉ trích xuất thông tin siêu ngắn gọn để giảm dung lượng
  const catalogContext = products.slice(0, 30).map(p => `${p.title}: ${p.price}`).join(' | ');

  // 4. Gửi về /api/chat
  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: text,
        catalog: catalogContext
      })
    });

    const data = await res.json();
    if (res.ok && data.reply) {
      aiMsg.innerHTML = data.reply.replace(/\n/g, "<br>");
    } else {
      aiMsg.innerText = "Hệ thống tư vấn đang bận. Quý khách vui lòng liên hệ Hotline/Zalo 0984650825 để được hỗ trợ nhanh nhất!";
    }
  } catch (error) {
    aiMsg.innerText = "Lỗi kết nối. Quý khách vui lòng liên hệ Hotline/Zalo 0984650825 để được hỗ trợ ngay!";
  }
  body.scrollTop = body.scrollHeight;
}
