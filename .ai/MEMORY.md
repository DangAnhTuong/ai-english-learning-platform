# PROJECT MEMORY & BUG LOG
// FILE NÀY DÙNG ĐỂ LƯU TRỮ TRÍ NHỚ DÀI HẠN CHO AI.
// KHÔNG ĐƯỢC XÓA FILE NÀY ĐỂ TRÁNH MẤT CONTEXT GIỮA CÁC LẦN MỞ MÁY LÀM VIỆC.

## 1. Trạng thái dự án hiện tại (Current State)
- Dự án English-App-Clean (Monorepo).
- Đã thiết lập xong môi trường Vibe Coding tự động.
- Đã quy hoạch lại file `.md` gọn gàng vào thư mục `docs/` và `.ai/`.

## 2. Công việc vừa hoàn thành (Done)
- Triển khai thành công dự án lên Server Ubuntu (Fix lỗi Nginx port 80, Fix lỗi Python path).
- Chuyển đổi dữ liệu MongoDB từ máy Local lên Server qua `mongorestore`.
- Khắc phục lỗi Timeout 30 giây khi đăng ký tài khoản (chuyển tính năng gửi email thành chạy bất đồng bộ).
- Tối ưu Frontend & SEO (Code splitting bằng React.lazy, thêm Error Boundary, NotFound page, react-helmet-async cho SEO meta tags).
- Tăng cường Bảo mật Backend (Cài đặt express-rate-limit 1000req/15m/IP).
- Tự động hóa Kinh doanh (Thêm SePay Webhook tự động duyệt đơn hàng, thêm CronJob quét thu hồi gói cước hết hạn lúc 00:00 hằng ngày).
- Khắc phục lỗi sập Backend do sai cú pháp export MongoDB config.
- Fix lỗi thiếu thư viện react-helmet-async trong docker frontend container.

## 3. Các Bug & Vấn đề tồn đọng (Known Issues)
- (Hiện tại chưa ghi nhận bug mới. Bất kỳ bug nào phát sinh và cách giải quyết sẽ được AI tự động ghi vào đây).

## 4. Công việc đang làm dở (In Progress)
- Đang chờ người dùng (User) giao nhiệm vụ mới qua khung chat.
