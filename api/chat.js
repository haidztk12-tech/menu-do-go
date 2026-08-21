// File: api/chat.js
module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let bodyData = req.body;
  if (typeof bodyData === 'string') {
    try { bodyData = JSON.parse(bodyData); } catch (e) { bodyData = {}; }
  }

  const { message, catalog } = bodyData || {};
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'Chưa cấu hình GEMINI_API_KEY' });
  }

  const systemInstruction = `Bạn là nhân viên tư vấn bán hàng của xưởng Đồ Gỗ Điện Ngọc (Hotline/Zalo: 0984650825, Trực Ninh, Nam Định).
Dữ liệu sản phẩm xưởng:
${catalog || 'Hiện có giường, tủ quần áo, bàn ghế ăn, sofa...'}

Quy tắc:
- Xưng "em", gọi "quý khách" hoặc "anh/chị".
- Báo giá chính xác, ngắn gọn dưới 3 câu.
- Nhắc: Freeship, lắp đặt tận nơi, nhận hàng kiểm tra mới thanh toán.
- Đóng theo kích thước riêng thì liên hệ Zalo 0984650825.`;

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: {
          parts: [{ text: systemInstruction }]
        },
        contents: [
          { role: 'user', parts: [{ text: message }] }
        ],
        generationConfig: {
          maxOutputTokens: 250, // Ép AI trả lời ngắn gọn, sinh câu siêu nhanh
          temperature: 0.5
        }
      })
    });

    const data = await response.json();

    if (!response.ok || data.error) {
      return res.status(response.status || 500).json({ error: data.error?.message || 'Lỗi AI' });
    }

    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Xin lỗi, em chưa rõ câu hỏi. Quý khách vui lòng gọi Hotline 0984650825 để được tư vấn nhanh!';
    return res.status(200).json({ reply });
  } catch (err) {
    return res.status(500).json({ error: 'Timeout hoặc lỗi kết nối' });
  }
};
