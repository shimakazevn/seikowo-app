import React from 'react';

const PrivacyPolicy = () => (
  <div style={{ maxWidth: 800, margin: '0 auto', padding: 24 }}>
    <h1>Chính sách quyền riêng tư</h1>
    <p>Cập nhật lần cuối: {new Date().toLocaleDateString('vi-VN')}</p>
    <p>
      Ứng dụng <b>Seikowo-react</b> cam kết bảo vệ quyền riêng tư của bạn. Chúng tôi chỉ thu thập các thông tin cần thiết để cung cấp dịch vụ và không chia sẻ dữ liệu cá nhân của bạn với bên thứ ba, trừ khi được pháp luật yêu cầu.
    </p>
    <h2>1. Thông tin chúng tôi thu thập</h2>
    <ul>
      <li>Thông tin tài khoản Google (tên, email, ảnh đại diện) khi bạn đăng nhập bằng Google.</li>
      <li>Dữ liệu lịch sử đọc, theo dõi, bookmark để đồng bộ với Google Drive của bạn.</li>
    </ul>
    <h2>2. Mục đích sử dụng thông tin</h2>
    <ul>
      <li>Đồng bộ dữ liệu cá nhân của bạn giữa các thiết bị thông qua Google Drive.</li>
      <li>Cải thiện trải nghiệm người dùng.</li>
    </ul>
    <h2>3. Bảo mật thông tin</h2>
    <p>
      Chúng tôi sử dụng các biện pháp bảo mật tiêu chuẩn để bảo vệ dữ liệu của bạn. Bạn có thể xóa dữ liệu bất cứ lúc nào trong phần cài đặt tài khoản.
    </p>
    <h2>4. Liên hệ</h2>
    <p>Nếu bạn có bất kỳ câu hỏi nào về chính sách này, vui lòng liên hệ: <a href="mailto:shimakazevn@gmail.com">shimakazevn@gmail.com</a></p>
  </div>
);

export default PrivacyPolicy; 