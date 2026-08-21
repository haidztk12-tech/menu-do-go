// File: api/chat.js
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Chỉ chấp nhận phương thức POST' });
  }

  const { message, catalog } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'Chưa cấu hình GEMINI_API_KEY trên Vercel' });
  }

  const systemPrompt = `Bạn là nhân viên tư vấn bán hàng của xưởng Đồ Gỗ Điện Ngọc (Hotline/Zalo: 0984650825, địa chỉ: Trực Ninh, Nam Định).

Danh mục sản phẩm hiện có tại xưởng (lấy trực tiếp từ hệ thống):
${catalog || 'Hiện chưa tải được danh mục, hãy tư vấn chung về dịch vụ của xưởng.'}

Quy tắc tư vấn:
1. Luôn giữ thái độ thân thiện, lịch sự, xưng hô "em" và gọi khách là "quý khách" hoặc "anh/chị".
2. Báo đúng giá và tình trạng theo danh mục được cung cấp ở trên.
3. Giải thích ưu điểm sản phẩm: Gỗ MDF lõi xanh chống ẩm bền đẹp, gỗ tự nhiên chắc chắn.
4. Nhấn mạnh chính sách: Miễn phí vận chuyển & lắp đặt tận nơi, kiểm tra hàng ưng ý mới thanh toán (không cần cọc trước với hàng sẵn).
5. Nếu khách muốn đóng theo kích thước riêng hoặc xem thêm ảnh thật, hướng dẫn khách liên hệ Hotline/Zalo 0984650825.
6. Trả lời ngắn gọn, súc tích, đi thẳng vào câu hỏi của khách.`;

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

    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Xin lỗi, em chưa nắm rõ câu hỏi. Quý khách vui lòng liên hệ Hotline 0984650825 để được tư vấn trực tiếp ạ!';
    return res.status(200).json({ reply });
  } catch (err) {
    return res.status(500).json({ error: 'Lỗi kết nối máy chủ AI' });
  }
}
