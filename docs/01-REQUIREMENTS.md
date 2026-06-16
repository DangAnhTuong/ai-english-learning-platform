# 01 - Yêu cầu Dự án (Project Requirements)

## Tổng quan
Nền tảng học tiếng Anh full-stack với kiến trúc nhiều service: web app cho người học/admin, backend nghiệp vụ Node.js, backend AI Python realtime.

## Tính năng cốt lõi

### Dành cho Người học (Learner)
- Đăng ký / Đăng nhập / Đăng xuất
- Quản lý hồ sơ cá nhân (Profile)
- Luyện hội thoại theo chủ đề/cấp độ có hỗ trợ audio
- Sơ đồ tư duy (Mindmap) hỗ trợ từ vựng
- AI chatbox tích hợp voice workflows (chuyển giọng nói thành văn bản, phản hồi phát âm)
- Xem danh sách khóa học public & chi tiết khóa học
- Quản lý các khóa học đã tham gia (My enrolled courses)

### Dành cho Quản trị viên (Admin)
- Admin dashboard tổng quan
- Quản lý người dùng (Users)
- Quản lý giáo viên / Teacher modules
- Quản lý ngữ cảnh (Context management: plans/topics)
- Quản lý khóa học (Courses)
- Quản lý đơn hàng (Orders)

### AI Features (Python)
- Chat realtime (`/api/v1/realtime/chat`)
- Ghi âm và dịch (Whisper) (`/api/v1/realtime/whisper`)
- Đánh giá phát âm (`/api/v1/realtime/feedback`)
- Text-to-Speech (TTS) và Deepgram endpoints
- Tích hợp WebSockets (`/ws/chat`, `/ws/voice-chat`)
