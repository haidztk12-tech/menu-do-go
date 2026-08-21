// File: api/chat.js
module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Chỉ chấp nhận phương thức POST' });
  }

  let bodyData = req.body;
  if (typeof bodyData === 'string') {
    try {
      bodyData = JSON.parse(bodyData);
    } catch (e) {
      bodyData = {};
    }
  }

  const { message, catalog } = bodyData || {};
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'Chưa cấu hình GEMINI_API_KEY trên Vercel' });
  }

  const systemPrompt = `Bạn là nhân viên tư vấn bán hàng của xưởng Đồ Gỗ Điện Ngọc (Hotline/Zalo: 0984650825, địa chỉ: Trực Ninh, Nam Định).

Danh mục sản phẩm hiện có:
${catalog || 'Hiện chưa tải được danh mục.'}

Quy tắc tư vấn:
1. Luôn xưng "em" và gọi khách là "quý khách" hoặc "anh/chị".
2. Báo đúng giá và tình trạng hàng theo danh mục ở trên.
3. Giải thích ưu điểm chất liệu gỗ MDF lõi xanh chống ẩm, gỗ tự nhiên.
4. Nhấn mạnh chính sách: Freeship, hỗ trợ lắp đặt tận nơi, kiểm tra ưng ý mới thanh toán (không cần cọc trước với hàng sẵn).
5. Trả lời ngắn gọn, đúng trọng tâm câu hỏi.`;

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
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

    if (!response.ok || data.error) {
      return res.status(response.status || 500).json({
        error: data.error?.message || 'Lỗi từ phía Google AI'
      });
    }

    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Xin lỗi, em chưa hiểu câu hỏi. Quý khách vui lòng liên hệ Hotline/Zalo 0984650825 để được hỗ trợ ạ!';
    return res.status(200).json({ reply });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Lỗi kết nối máy chủ' });
  }
};
