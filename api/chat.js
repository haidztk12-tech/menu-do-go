// File: api/chat.js
module.exports = async (req, res) => {
  // Cho phép nhận request
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Chỉ chấp nhận phương thức POST' });
  }

  const { message, catalog } = req.body || {};
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'Chưa tìm thấy GEMINI_API_KEY trong Environment Variables của Vercel' });
  }

  const systemPrompt = `Bạn là nhân viên tư vấn bán hàng của xưởng Đồ Gỗ Điện Ngọc (Hotline/Zalo: 0984650825, địa chỉ: Trực Ninh, Nam Định).

Danh mục sản phẩm hiện có:
${catalog || 'Hiện chưa tải được danh mục.'}

Quy tắc:
- Xưng hô "em" và gọi khách là "quý khách" hoặc "anh/chị".
- Báo đúng giá, giải thích chất liệu gỗ MDF lõi xanh chống ẩm / gỗ tự nhiên.
- Nhắc chính sách: Freeship, lắp đặt tận nơi, kiểm tra hàng mới thanh toán.
- Trả lời ngắn gọn, đúng trọng tâm.`;

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [{ text: `${systemPrompt}\n\nKhách hỏi: ${message}` }]
          }
        ]
      })
    });

    const data = await response.json();

    if (data.error) {
      return res.status(500).json({ error: data.error.message });
    }

    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Xin lỗi, em chưa rõ yêu cầu. Quý khách vui lòng liên hệ Hotline/Zalo 0984650825 để được tư vấn ạ!';
    return res.status(200).json({ reply });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Lỗi kết nối máy chủ AI' });
  }
};
