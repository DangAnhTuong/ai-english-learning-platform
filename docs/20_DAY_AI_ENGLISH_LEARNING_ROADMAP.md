# 🎓 Kế Hoạch 20 Ngày Luyện Tập & Làm Chủ Toàn Bộ Kiến Thức Dự Án AI English Learning Platform

> **Dự án:** AI-Powered English Learning Platform ([danganhtuong.dev](https://danganhtuong.dev))  
> **Tác giả / Học viên:** Đặng Anh Tường  
> **Kiến trúc:** Microservices (React 19 SPA + Node.js Express Gateway + Python FastAPI AI Microservice + MongoDB + Redis + Nginx + Docker)

---

## 🗺️ TỔNG QUAN LỘ TRÌNH 20 NGÀY

```mermaid
gantt
    title Lộ trình 20 Ngày Master AI English Learning Platform
    dateFormat  YYYY-MM-DD
    axisFormat %d/%m
    section Phase 1: Core & Frontend
    Tổng quan Kiến trúc Microservices     :a1, 2026-08-01, 1d
    React 19 & React Router v7 Core       :a2, 2026-08-02, 1d
    Redux Toolkit State Management        :a3, 2026-08-03, 1d
    UI Engineering & Ant Design SASS      :a4, 2026-08-04, 1d
    section Phase 2: Node.js Gateway
    Express.js & Middleware Security       :a5, 2026-08-05, 1d
    Auth: JWT, Refresh Token & Google OAuth:a6, 2026-08-06, 1d
    MongoDB & Mongoose Data Modeling      :a7, 2026-08-07, 1d
    Upload, Cron, Nodemailer & Swagger    :a8, 2026-08-08, 1d
    section Phase 3: Python AI Microservice
    Python Async IO & FastAPI Architecture:a9, 2026-08-09, 1d
    Async Data: Motor (Mongo) & Redis     :a10, 2026-08-10, 1d
    OpenAI LLM Integration & Prompts      :a11, 2026-08-11, 1d
    Deepgram STT & Scoring Algorithms     :a12, 2026-08-12, 1d
    section Phase 4: WebSockets & Real-time
    Web Audio API & Browser MediaRecorder :a13, 2026-08-13, 1d
    Socket.IO & FastAPI WebSockets        :a14, 2026-08-14, 1d
    End-to-End Realtime AI Voice Practice :a15, 2026-08-15, 1d
    section Phase 5: DevOps & Nginx
    Docker & Multi-Container Docker Compose:a16, 2026-08-16, 1d
    Nginx Reverse Proxy & Zero-Cache SPA  :a17, 2026-08-17, 1d
    Production Deployment & GitHub Actions:a18, 2026-08-18, 1d
    section Phase 6: Testing & Review
    Testing, Debugging & Performance      :a19, 2026-08-19, 1d
    Tổng kết & Thực hành Capstone         :a20, 2026-08-20, 1d
```

---

## 📌 PHẦN CHI TIẾT LỘ TRÌNH 20 NGÀY

---

### 🟢 PHẦN 1: KIẾN TRÚC TỔNG QUAN & FRONTEND REACT 19 (NGÀY 1 - 4)

#### 📅 Ngày 1: Đọc & Thấu Hiểu Kiến Trúc Microservices Dự Án
- **🎯 Mục tiêu:** Hiểu rõ bức tranh tổng thể hệ thống, luồng di chuyển dữ liệu (Data Flow) giữa Client Browser, Nginx Proxy, Node.js Gateway, Python AI Service, MongoDB và Redis.
- **📚 Kiến thức cốt lõi:**
  1. Mô hình Microservices vs Monolith: Ưu/nhược điểm trong bài toán AI Realtime.
  2. Luồng HTTP Request/Response vs Luồng WebSocket duplex communication.
  3. Phân chia trách nhiệm: Node.js (Auth, Business Logic, CRUD) vs Python (AI Inference, STT, Realtime Voice).
- **💻 File thực hành trong dự án:**
  - [README.md](file:///a:/frontend/web_learn_english_main/English-App-Clean/README.md)
  - [docker-compose.dev.yml](file:///a:/frontend/web_learn_english_main/English-App-Clean/docker/docker-compose.dev.yml)
- **📝 Bài tập trong ngày:** Vẽ lại sơ đồ Sequence Diagram mô tả hành trình từ khi người dùng bấm nút "Bắt đầu hội thoại với AI" trên giao diện đến khi nhận phản hồi âm thanh/văn bản.

---

#### 📅 Ngày 2: Master React 19 Core & React Router v7 Navigation
- **🎯 Mục tiêu:** Hiểu sâu cách React 19 Render UI, các Custom Hooks và tổ chức routing đa tầng (Nested / Protected Routes).
- **📚 Kiến thức cốt lõi:**
  1. React 19 Core: Hooks (`useState`, `useEffect`, `useCallback`, `useMemo`, `useRef`, `useContext`).
  2. React Router v7: `createBrowserRouter`, `RouterProvider`, `<Outlet />`, `useNavigate`, `useLocation`.
  3. Route Guards: Bảo vệ các trang cá nhân/admin bằng HOC hoặc Custom Component (`ProtectedRoute`).
- **💻 File thực hành trong dự án:**
  - [frontend/package.json](file:///a:/frontend/web_learn_english_main/English-App-Clean/frontend/package.json)
  - Thư mục [frontend/src](file:///a:/frontend/web_learn_english_main/English-App-Clean/frontend/src)
- **📝 Bài tập trong ngày:** Viết 1 Custom Hook `useAuthGuard` tự động kiểm tra token hợp lệ và tự động điều hướng về `/login` nếu token hết hạn.

---

#### 📅 Ngày 3: State Management với Redux Toolkit (RTK)
- **🎯 Mục tiêu:** Quản lý State toàn cục phức tạp (User Session, Current Lesson, Chat History, Audio Settings).
- **📚 Kiến thức cốt lõi:**
  1. `configureStore`, `createSlice`, `createAsyncThunk`.
  2. Redux Data Flow: `Dispatch Action -> ExtraReducers -> Update State -> UI Re-render`.
  3. Tổ chức Slices mô-đun hóa: `authSlice`, `courseSlice`, `chatSlice`, `userSlice`.
- **💻 File thực hành trong dự án:**
  - Soi các file trong `frontend/src/redux/` hoặc `frontend/src/store/`.
- **📝 Bài tập trong ngày:** Tạo 1 Redux Slice mới `vocabularySlice` quản lý danh sách từ vựng yêu thích (thêm, xóa, lưu trạng thái vào `localStorage`).

---

#### 📅 Ngày 4: UI Engineering: Ant Design 5, Custom SASS & Hiệu Ứng Động
- **🎯 Mục tiêu:** Thiết kế giao diện hiện đại, chuẩn UI/UX, hỗ trợ responsive và hiệu ứng mượt mà.
- **📚 Kiến thức cốt lõi:**
  1. Component library: Ant Design 5 (`Table`, `Form`, `Modal`, `Drawer`, `Avatar`, `Tag`, `Tooltip`).
  2. SASS/SCSS Variables, Nesting & Mixins.
  3. Hiệu ứng động: **AOS** (Scroll Animations), **Lenis** (Smooth Scroll).
  4. Xuất file báo cáo: **html2canvas** + **jspdf** (chụp Mindmap & lưu dưới dạng PDF).
- **💻 File thực hành trong dự án:**
  - UI components tại `frontend/src/components/` & `frontend/src/pages/`.
- **📝 Bài tập trong ngày:** Xây dựng một UI Card hiển thị Mindmap từ vựng tiếng Anh với nút "Tải PDF" sử dụng `html2canvas` & `jspdf`.

---

### 🟡 PHẦN 2: NODE.JS EXPRESS GATEWAY & AUTHENTICATION ENGINE (NGÀY 5 - 8)

#### 📅 Ngày 5: Express.js Architecture, Middleware Stack & Joi Validation
- **🎯 Mục tiêu:** Xây dựng khung chuẩn cho API Gateway xử lý Auth, Courses và Users.
- **📚 Kiến thức cốt lõi:**
  1. Mô hình MVC / Layered Architecture: `Route -> Controller -> Service -> Model`.
  2. Middleware pipeline: `express.json()`, `cors()`, `helmet()`, `express-rate-limit`, `cookie-parser`.
  3. Validate dữ liệu đầu vào bằng `Joi` hoặc `validator`.
  4. Logging hệ thống chuyên nghiệp với `Winston` & `Morgan` (Rotating File Stream).
- **💻 File thực hành trong dự án:**
  - [backend/backend-node/package.json](file:///a:/frontend/web_learn_english_main/English-App-Clean/backend/backend-node/package.json)
  - [backend/backend-node/src/app.js](file:///a:/frontend/web_learn_english_main/English-App-Clean/backend/backend-node/src/app.js)
  - [backend/backend-node/src/server.js](file:///a:/frontend/web_learn_english_main/English-App-Clean/backend/backend-node/src/server.js)
- **📝 Bài tập trong ngày:** Viết một Custom Error Handler Middleware tập trung bắt mọi ngoại lệ (uncaught errors) và ghi log vào thư mục `logs/error.log`.

---

#### 📅 Ngày 6: Authentication & Authorization: JWT, Refresh Token & Google OAuth2
- **🎯 Mục tiêu:** Đăng nhập bảo mật cao, phân quyền người dùng (RBAC: Admin / Instructor / Learner).
- **📚 Kiến thức cốt lõi:**
  1. Access Token (Ngắn hạn) vs Refresh Token (Dài hạn, lưu HTTP-Only Cookie).
  2. Hashing mật khẩu an toàn bằng `argon2` hoặc `bcryptjs`.
  3. Đăng nhập Google OAuth2 với Passport.js (`passport-google-oauth20`) & `google-auth-library`.
  4. Middleware phân quyền RBAC (`checkRole(['admin'])`).
- **💻 File thực hành trong dự án:**
  - Thư mục auth & middleware tại `backend/backend-node/src/controllers/auth.controller.js` & `src/middlewares/auth.middleware.js`.
- **📝 Bài tập trong ngày:** Viết endpoint `/api/v1/auth/refresh-token` cấp lại Access Token mới khi client gửi Refresh Token hợp lệ.

---

#### 📅 Ngày 7: Data Modeling với MongoDB & Mongoose ORM
- **🎯 Mục tiêu:** Làm chủ thiết kế Database NoSQL cho ứng dụng học tập (Users, Courses, Lessons, Quizzes, History).
- **📚 Kiến thức cốt lõi:**
  1. Schema, Models, Types, Virtuals, Pre/Post Hooks trong Mongoose.
  2. Quan hệ tài liệu (Referencing `.populate()` vs Embedding Subdocuments).
  3. Đánh Index tối ưu hóa truy vấn (`unique`, `compound index`).
  4. Mongoose Aggregation Pipeline (`$match`, `$group`, `$lookup`, `$unwind`, `$project`).
- **💻 File thực hành trong dự án:**
  - Thư mục Models tại `backend/backend-node/src/models/`.
- **📝 Bài tập trong ngày:** Viết 1 truy vấn Aggregation tính tổng số bài học đã hoàn thành và điểm trung bình Quiz của từng User.

---

#### 📅 Ngày 8: File Uploads, Cron Jobs, Nodemailer & Swagger API Docs
- **🎯 Mục tiêu:** Hoàn thiện các tính năng phụ trợ quan trọng cho API Gateway.
- **📚 Kiến thức cốt lõi:**
  1. Up ảnh đại diện / tài liệu: `Multer` (MemoryStorage) + `Sharp` (Nén & resize ảnh) + `Cloudinary` SDK.
  2. Gửi Email thông báo/OTP: `Nodemailer` với SMTP server.
  3. Lập lịch tự động: `node-cron` (ví dụ: tự động dọn dẹp file tạm, gửi mail nhắc học).
  4. Viết Tài liệu API tự động: `swagger-jsdoc` & `swagger-ui-express`.
- **💻 File thực hành trong dự án:**
  - Các module upload, mail, cron trong `backend/backend-node/src/`.
- **📝 Bài tập trong ngày:** Tạo route `POST /api/v1/users/avatar` cho phép nén ảnh qua `Sharp` thành kích thước `200x200` định dạng `.webp` trước khi lưu.

---

### 🟠 PHẦN 3: PYTHON FASTAPI & AI ENGINE MICROSERVICE (NGÀY 9 - 12)

#### 📅 Ngày 9: Python Async IO & FastAPI Core Architecture
- **🎯 Mục tiêu:** Hiểu lý do vì sao dự án chọn Python FastAPI làm AI Microservice (Hiệu năng Async, tích hợp sinh thái AI).
- **📚 Kiến thức cốt lõi:**
  1. Python Asynchronous Programming: `async/await`, `asyncio` event loop.
  2. FastAPI Fundamentals: Path parameters, Query parameters, Request Body, Dependency Injection (`Depends`).
  3. Data validation & Settings với `pydantic` v2 & `pydantic-settings`.
  4. Chạy server Uvicorn / Gunicorn cho môi trường Production.
- **💻 File thực hành trong dự án:**
  - [backend/backend-python/requirements.txt](file:///a:/frontend/web_learn_english_main/English-App-Clean/backend/backend-python/requirements.txt)
  - Code Python trong `backend/backend-python/main.py` hoặc `app/`.
- **📝 Bài tập trong ngày:** Viết 1 route `GET /api/v1/health` trả về trạng thái CPU, Memory (sử dụng package `psutil`) dưới dạng JSON chuẩn hóa Pydantic.

---

#### 📅 Ngày 10: Async MongoDB (Motor) & Redis Caching trong Python
- **🎯 Mục tiêu:** Kết nối và thao tác với Database không bất đồng bộ trong Python.
- **📚 Kiến thức cốt lõi:**
  1. Async MongoDB Driver: `Motor` + `pymongo`.
  2. Thao tác CRUD bất đồng bộ trong Python: `await db.collection.find_one()`.
  3. Caching với Redis (`redis-py` async): Cache token, lưu transient session state của cuộc hội thoại AI.
  4. Quản lý Rate Limiting với `slowapi`.
- **💻 File thực hành trong dự án:**
  - File kết nối DB & Cache tại `backend/backend-python/app/db/` hoặc `app/core/`.
- **📝 Bài tập trong ngày:** Viết hàm async cache đoạn văn bản chỉnh sửa ngữ pháp vào Redis trong 10 phút, nếu gọi lại cùng 1 input thì đọc ngay từ Redis.

---

#### 📅 Ngày 11: Integration OpenAI LLM & Advanced Prompt Engineering
- **🎯 Mục tiêu:** Tích hợp mô hình ngôn ngữ lớn (OpenAI GPT-4o / GPT-3.5-turbo) vào ứng dụng để tạo trợ lý giao tiếp tiếng Anh.
- **📚 Kiến thức cốt lõi:**
  1. OpenAI Async SDK Python (`openai.AsyncOpenAI`).
  2. Prompt Engineering: System Prompts định hình nhân vật AI Teacher (sửa lỗi dịu dàng, gợi ý từ vựng phù hợp trình độ).
  3. Dynamic Function Calling & Structured JSON Output (nhận kết quả JSON chuẩn gồm: `ai_response`, `grammar_corrections`, `score`).
  4. Streaming Response (`stream=True`) giúp tạo trải nghiệm chữ gõ realtime.
- **💻 File thực hành trong dự án:**
  - Thư mục AI Service tại `backend/backend-python/app/services/openai_service.py`.
- **📝 Bài tập trong ngày:** Xây dựng hàm `generate_feedback(user_text, level)` sử dụng OpenAI API trả về điểm chấm câu và 3 cách diễn đạt tự nhiên hơn theo chuẩn JSON.

---

#### 📅 Ngày 12: Speech-to-Text (STT) với Deepgram SDK & Thuật Toán Chấm Điểm
- **🎯 Mục tiêu:** Biến giọng nói tiếng Anh của học viên thành văn bản và đánh giá độ chính xác phát âm.
- **📚 Kiến thức cốt lõi:**
  1. Deepgram Python SDK v2/v3 (Prerecorded Audio Transcription & Nova-2 model).
  2. Xử lý các định dạng Audio Buffer (MP3, WAV, WebM).
  3. Thuật toán so sánh văn bản & phát âm: **Levenshtein Distance** (`fast-levenshtein` / Python `Levenshtein`).
  4. Phân tích Phoneme / Confidence score để chỉ ra từ nào người dùng đọc sai.
- **💻 File thực hành trong dự án:**
  - Module Deepgram tại `backend/backend-python/app/services/deepgram_service.py`.
- **📝 Bài tập trong ngày:** Viết một script kiểm tra độ tương đồng giữa văn bản gốc "I want to learn English" và văn bản STT nhận được "I wanna learn English" bằng Levenshtein Ratio.

---

### 🔵 PHẦN 4: WEBSOCKETS & REALTIME AUDIO STREAMING (NGÀY 13 - 15)

#### 📅 Ngày 13: Web Audio API & MediaRecorder phía Browser Frontend
- **🎯 Mục tiêu:** Thu âm giọng nói người dùng trực tiếp từ Microphone trình duyệt và gửi các Audio Chunks dưới dạng Binary Stream.
- **📚 Kiến thức cốt lõi:**
  1. HTML5 `navigator.mediaDevices.getUserMedia()`.
  2. `MediaRecorder` API: Event `dataavailable`, cấu hình timeslice (ví dụ: gửi chunk mỗi 250ms).
  3. Web Audio API (`AudioContext`, `AnalyserNode` tạo hiệu ứng sóng âm Waveform visualizer).
  4. Xử lý Blob, ArrayBuffer và base64 encoding.
- **💻 File thực hành trong dự án:**
  - Component voice recorder tại `frontend/src/components/VoiceChat/` hoặc tương đương.
- **📝 Bài tập trong ngày:** Tạo 1 React Component hiển thị độ lớn âm thanh (Volume Visualizer bar) theo thời gian thực khi người dùng nói vào Mic.

---

#### 📅 Ngày 14: WebSocket Protocols: Socket.IO Server & FastAPI WebSockets
- **🎯 Mục tiêu:** Hiểu sâu cơ chế giao tiếp 2 chiều Full-Duplex thời gian thực.
- **📚 Kiến thức cốt lõi:**
  1. Khác biệt giữa HTTP Long-Polling vs Native WebSocket (`ws://` & `wss://`).
  2. Socket.IO trên Node.js (`socket.io` server & `socket.io-client` frontend): Rooms, Namespaces, Event Emitters.
  3. Native WebSockets trên FastAPI (`from fastapi import WebSocket`).
  4. Handshake, Auth Token qua WebSocket Query Param/Headers và Heartbeat Ping/Pong.
- **💻 File thực hành trong dự án:**
  - File kết nối socket tại `backend/backend-python/app/routers/websocket.py` & `frontend/src/services/websocket.js`.
- **📝 Bài tập trong ngày:** Tạo 1 router FastAPI WebSocket `/ws/test` cho phép gửi tin nhắn từ client và server lập tức "echo" phản hồi lại.

---

#### 📅 Ngày 15: Ghép Nối Luồng Realtime AI Voice Practice End-to-End
- **🎯 Mục tiêu:** Kết nối 5 mắt xích: Browser Mic -> WebSocket Stream -> FastAPI -> Deepgram STT -> OpenAI -> Phản hồi Client.
- **📚 Kiến thức cốt lõi:**
  1. Quản lý trạng thái cuộc gọi Realtime (Listening -> Processing -> Speaking -> Idle).
  2. Xử lý độ trễ (Latency Optimization): Stream dữ liệu audio ngay khi thu âm, không đợi thu toàn bộ file.
  3. Xử lý sự cố đứt kết nối (Reconnection logic, Error handling khi ngắt mạng).
- **💻 File thực hành trong dự án:**
  - [DEPLOYMENT_LESSONS.md](file:///a:/frontend/web_learn_english_main/English-App-Clean/DEPLOYMENT_LESSONS.md) (Xem lại bài học WebSocket).
  - Code trong `frontend/src/pages/AiVoicePractice/` hoặc tương tự.
- **📝 Bài tập trong ngày:** Chạy và trace (print logs) toàn bộ chu trình 1 câu nói từ lúc mở Mic đến khi AI trả lời trên giao diện web.

---

### 🟣 PHẦN 5: DEVOPS, DOCKER & NGINX PRODUCTION (NGÀY 16 - 18)

#### 📅 Ngày 16: Containerization với Docker & Docker Compose
- **🎯 Mục tiêu:** Đóng gói toàn bộ các dịch vụ (Frontend, Node, Python, Mongo, Redis) thành các Container chạy độc lập, nhất quán.
- **📚 Kiến thức cốt lõi:**
  1. Concepts: Image, Container, Volume, Network, Environment Variables.
  2. Viết `Dockerfile` tối ưu hóa Multi-stage build cho React (Build HTML/JS static) và Python/Node (Dependencies caching).
  3. Docker Compose (`docker-compose.dev.yml` vs `docker-compose.prod.yml`).
  4. Quản lý kết nối giữa các Container qua Docker Network (`http://backend-python:8000`).
- **💻 File thực hành trong dự án:**
  - [docker/Dockerfile.frontend.prod](file:///a:/frontend/web_learn_english_main/English-App-Clean/docker/Dockerfile.frontend.prod)
  - [docker/docker-compose.dev.yml](file:///a:/frontend/web_learn_english_main/English-App-Clean/docker/docker-compose.dev.yml)
- **📝 Bài tập trong ngày:** Chạy lệnh `docker compose -f docker/docker-compose.dev.yml up --build` và kiểm tra tất cả container đều `healthy`.

---

#### 📅 Ngày 17: Nginx Reverse Proxy, WebSockets Forwarding & SPA Zero-Cache
- **🎯 Mục tiêu:** Cấu hình Web Server Nginx làm Reverse Proxy điều hướng traffic và xử lý vấn đề Caching/WebSocket sản xuất.
- **📚 Kiến thức cốt lõi:**
  1. Nginx Directives: `server`, `location`, `proxy_pass`, `upstream`.
  2. Proxy WebSocket header bắt buộc:
     ```nginx
     proxy_http_version 1.1;
     proxy_set_header Upgrade $http_upgrade;
     proxy_set_header Connection "upgrade";
     ```
  3. Tránh lỗi mất URI do trailing slash (`proxy_pass http://backend-python:8000/ws/;` -> Xóa `/` cuối).
  4. Cấu hình **Zero-Cache SPA Delivery** cho `index.html` nhằm tránh trình duyệt cache JS cũ.
- **💻 File thực hành trong dự án:**
  - File Nginx config trong [docker/nginx/](file:///a:/frontend/web_learn_english_main/English-App-Clean/docker/nginx/)
  - Mục 2, 3, 4 trong [DEPLOYMENT_LESSONS.md](file:///a:/frontend/web_learn_english_main/English-App-Clean/DEPLOYMENT_LESSONS.md).
- **📝 Bài tập trong ngày:** Viết 1 file `nginx.conf` hoàn chỉnh phục vụ SPA React ở `/` và proxy `/api/v1` sang Node, `/ws` sang Python.

---

#### 📅 Ngày 18: Deployment VPS (DigitalOcean) & CI/CD GitHub Actions
- **🎯 Mục tiêu:** Tự động hóa quy trình Deploy dự án lên Cloud Server Linux.
- **📚 Kiến thức cốt lõi:**
  1. DigitalOcean Ubuntu VPS Management: SSH Keys, Firewall (UFW), Systemd.
  2. Multi-layer Nginx (Host Nginx Proxy -> Docker Nginx Proxy -> Application).
  3. Cấu hình SSL/TLS với Certbot / Let's Encrypt.
  4. GitHub Actions Workflow (`.github/workflows/deploy.yml`): Auto SSH, Pull code, Rebuild Docker Containers khi push `main`.
- **💻 File thực hành trong dự án:**
  - Thư mục `.github/workflows/` (nếu có).
  - [DEPLOYMENT_LESSONS.md](file:///a:/frontend/web_learn_english_main/English-App-Clean/DEPLOYMENT_LESSONS.md).
- **📝 Bài tập trong ngày:** Kiểm tra file Workflow GitHub Actions và mô phỏng từng bước deploy qua terminal local SSH.

---

### 🔴 PHẦN 6: TESTING, OPTIMIZATION & CAPSTONE MASTERY (NGÀY 19 - 20)

#### 📅 Ngày 19: Testing, Profiling & Debugging Multi-Service Applications
- **🎯 Mục tiêu:** Đảm bảo hệ thống chạy ổn định, không memory leak, bắt lỗi chính xác.
- **📚 Kiến thức cốt lõi:**
  1. Frontend Unit / Integration Test: Jest, React Testing Library (`@testing-library/react`).
  2. Backend Node Test: `Jest` + `Supertest` (API Integration Testing).
  3. Backend Python Test: `pytest` + `pytest-asyncio` + `httpx.AsyncClient`.
  4. Đọc Logs & Tracing: Theo dõi Docker logs (`docker compose logs -f`), đọc file log quay vòng (`rotating-file-stream`).
- **💻 File thực hành trong dự án:**
  - Các file test trong `backend/backend-node/` và `backend/backend-python/`.
- **📝 Bài tập trong ngày:** Viết 1 file test `pytest` kiểm tra endpoint FastAPI trả về HTTP 200 và đúng schema JSON khi mock OpenAI call.

---

#### 📅 Ngày 20: Tổng Kết, Bảo Mật System & Thực Hành Capstone Project
- **🎯 Mục tiêu:** Rà soát lỗ hổng bảo mật, tối ưu hóa performance toàn ứng dụng và sẵn sàng phỏng vấn Full-stack / AI Engineer.
- **📚 Kiến thức cốt lõi:**
  1. Check-list Bảo mật: CORS Domain list, Rate Limiting, Hide API Keys, JWT Expiration, Non-root Docker User.
  2. Tối ưu hóa Performance: React Code-splitting (`React.lazy`), Database Indexing, Redis Caching hit-rate.
  3. Chuẩn bị Kịch bản Demo & Giải trình Kiến trúc (System Architecture Walkthrough) cho Nhà tuyển dụng.
- **💻 File thực hành trong dự án:**
  - Toàn bộ codebase [English-App-Clean](file:///a:/frontend/web_learn_english_main/English-App-Clean).
- **📝 Bài tập cuối khóa:** Thực hiện bài thuyết trình (hoặc tự quay video 5 phút) trình bày trôi chảy từ Kiến trúc Microservices, Luồng Realtime Voice WebSocket đến các bài học Deployment thực tế trên `danganhtuong.dev`.

---

## 📊 TỔNG KẾT BẢNG CÔNG CỤ & CÔNG NGHỆ BẠN SẼ MASTER

| Hạng mục | Công nghệ / Thuật ngữ chính |
| :--- | :--- |
| **Frontend** | React 19, React Router v7, Redux Toolkit, Ant Design 5, SASS, Axios, Web Audio API, MediaRecorder, AOS, Lenis, html2canvas, jspdf |
| **Node Backend** | Node.js, Express.js, JWT, Argon2/Bcrypt, Passport Google OAuth2, Mongoose (MongoDB), Joi, Winston, Multer, Sharp, Nodemailer, node-cron, Swagger |
| **Python AI** | Python AsyncIO, FastAPI, Uvicorn, Pydantic v2, Motor (Async Mongo), Redis, OpenAI SDK, Deepgram STT SDK, Levenshtein, slowapi, structlog |
| **Database & Cache** | MongoDB (Aggregation, Indexing), Redis (Session, Cache, Rate Limit) |
| **DevOps & Deploy** | Docker, Docker Compose, Nginx (Reverse Proxy, WebSockets, Zero-cache), DigitalOcean VPS, SSL/TLS, GitHub Actions CI/CD |

---

> 💡 **Lời khuyên thực hành:** Hãy kiên trì học từng ngày theo lộ trình trên. Mỗi ngày dành **2 - 3 tiếng** đọc code thực tế trong dự án [English-App-Clean](file:///a:/frontend/web_learn_english_main/English-App-Clean), viết lại 1 mô-đun nhỏ và làm bài tập thực hành tương ứng!
