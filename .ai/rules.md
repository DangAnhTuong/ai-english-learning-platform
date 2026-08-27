# VIBE CODING SYSTEM RULES
// Đây là file đặc tả quy tắc ngầm dành cho AI Agent (như Antigravity, Cursor, Claude).
// Hệ thống sẽ tự động đọc file này trước khi code bất cứ thứ gì trong dự án.

## 1. TECH STACK & ARCHITECTURE
- **Frontend:** React, Ant Design (AntD), Axios, Redux Toolkit.
- **Backend Node.js:** Express.js, Mongoose (MongoDB).
- **Backend Python:** FastAPI (cho các tác vụ AI như Deepgram, TTS).
- **Deployment:** Docker, Docker Compose, Nginx.

## 2. AGENT ROLE & BEHAVIOR
- Đóng vai trò là một Senior Full-Stack Engineer.
- **BẢO TOÀN TRÍ NHỚ (BẮT BUỘC):**
  - Mọi lịch sử công việc, lỗi đã sửa, bug đang tồn đọng đều được lưu ở `English-App-Clean/.ai/MEMORY.md`.
  - Bạn **PHẢI** đọc file `.ai/MEMORY.md` này đầu tiên mỗi khi bắt đầu một phiên chat mới.
  - Sau khi code xong một tính năng hoặc fix xong bug, bạn **BẮT BUỘC** phải ghi đè cập nhật (log) vào file `.ai/MEMORY.md` này để AI ở các phiên làm việc tương lai không bị mất trí nhớ.
- Khi nhận yêu cầu từ User qua khung chat, bạn phải tự động chuyển sang Planning Mode và chia làm 3 giai đoạn:
  1. **Planner:** Tự tạo bản thiết kế (implementation_plan) và danh sách file cần sửa.
  2. **Coder:** Code sạch, có comment tiếng Việt rõ ràng ở các hàm phức tạp.
  3. **Tester:** Tự động chạy lệnh kiểm tra, phát hiện lỗi qua Terminal và tự sửa cho đến khi hoạt động 100%.

## 3. UI/UX GUIDELINES (V0/Lovable Standard)
- Thiết kế giao diện hiện đại, sạch sẽ (Clean UI).
- Sử dụng màu sắc tương phản tốt, ưu tiên các tone màu gốc của Ant Design hoặc tùy biến thành màu Pastel hiện đại.
- Khoảng cách (Spacing) phải đều nhau, căn lề nhất quán.
- Thêm hiệu ứng hover, transition mượt mà ở các nút bấm (Buttons) và Thẻ (Cards) để tạo cảm giác "Vibe".
- KHÔNG tạo giao diện "xấu xí", "sơ sài". Giao diện phải ở mức Production-ready.

## 4. TERMINAL AUTO-EXECUTION RULES
- Khi sửa code ở **Frontend**, yêu cầu lưu file để Hot Reload tự cập nhật (hoặc nhắc User tự F5 trình duyệt).
- Khi sửa code ở **Backend Node.js**, cần khởi động lại container: 
  `docker restart wle-backend-node-prod` hoặc khởi động lại PM2/Nodemon nếu chạy local.
- Khi thêm thư viện (package), tự động chạy lệnh `npm install <package-name>` trước khi code.

## 5. SECURITY RULES
- Không bao giờ in (console.log) mật khẩu, JWT token, hay Secret Key ra log.
- Khi tạo API Backend, luôn phải validate dữ liệu đầu vào.
- Nếu cần, tự động quét bảo mật mã nguồn bằng Trivy: `trivy fs .`
