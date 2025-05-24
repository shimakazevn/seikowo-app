import React from 'react';

const TermsOfService = () => (
  <div style={{ maxWidth: 800, margin: '0 auto', padding: 24 }}>
    <h1>Điều khoản dịch vụ</h1>
    <p>Cập nhật lần cuối: {new Date().toLocaleDateString('vi-VN')}</p>
    <h2>1. Chấp nhận điều khoản</h2>
    <p>Bằng việc sử dụng ứng dụng <b>Seikowo-react</b>, bạn đồng ý với các điều khoản dưới đây.</p>
    <h2>2. Quyền và trách nhiệm của người dùng</h2>
    <ul>
      <li>Không sử dụng ứng dụng cho mục đích vi phạm pháp luật.</li>
      <li>Chịu trách nhiệm về dữ liệu cá nhân được đồng bộ lên Google Drive của bạn.</li>
    </ul>
    <h2>3. Quyền và trách nhiệm của chúng tôi</h2>
    <ul>
      <li>Chúng tôi có quyền thay đổi, tạm ngưng hoặc ngừng cung cấp dịch vụ bất cứ lúc nào.</li>
      <li>Chúng tôi không chịu trách nhiệm cho các thiệt hại phát sinh do việc sử dụng ứng dụng.</li>
    </ul>
    <h2>4. Thay đổi điều khoản</h2>
    <p>Chúng tôi có thể cập nhật điều khoản này bất cứ lúc nào. Bạn nên kiểm tra lại thường xuyên.</p>
    <h2>5. Liên hệ</h2>
    <p>Nếu bạn có bất kỳ câu hỏi nào về điều khoản này, vui lòng liên hệ: <a href="mailto:shimakazevn@gmail.com">shimakazevn@gmail.com</a></p>
  </div>
);

export default TermsOfService; 