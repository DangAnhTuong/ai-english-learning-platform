# 02 - Kiến trúc Hệ thống (Architecture & Tech Stack)

## 1. Cấu trúc Monorepo
Dự án được cấu trúc theo dạng Monorepo để đảm bảo tính rõ ràng và hiệu quả cho Vibe Coding:

```text
web_learn_english_main/English-App-Clean/
├─ frontend/                 # Ứng dụng React
│  ├─ src/                   # Source code chính
│  ├─ public/                # Static files
│  └─ package.json           # Frontend dependencies
├─ backend/                  # Các service backend
│  ├─ backend-node/          # Node.js Express API
│  └─ backend-python/        # FastAPI AI Service
├─ docker/                   # Cấu hình Infrastructure
│  ├─ docker-compose.dev.yml
│  ├─ docker-compose.prod.yml
│  ├─ Dockerfile.frontend.dev
│  ├─ Dockerfile.frontend.prod
│  └─ nginx/                 # Cấu hình Nginx
├─ docs/                     # Tài liệu định hướng cho AI (Vibe Coding Docs)
├─ CLAUDE.md                 # Bộ luật tối cao cho AI
└─ .gitignore
```

## 2. Technology Stack

### 2.1. Frontend
- **Framework**: React 19, CRA (Create React App)
- **Routing**: React Router
- **State Management**: Redux Toolkit
- **UI Library**: Ant Design
- **API Client**: Axios

### 2.2. Backend Node.js (Core Business Logic)
- **Framework**: Node.js, Express
- **Database**: MongoDB (thông qua Mongoose)
- **Caching**: Redis
- **Authentication**: JWT, Passport Google OAuth
- **Validation**: Joi
- **Logging**: Winston

### 2.3. Backend Python (AI & Realtime)
- **Framework**: FastAPI, Uvicorn/Gunicorn
- **Database**: Motor (MongoDB Asynchronous Driver)
- **AI Integration**: OpenAI SDK, Deepgram SDK
- **WebSockets**: Xử lý kết nối realtime (voice, chat)

### 2.4. Infrastructure
- **Containerization**: Docker, Docker Compose
- **Reverse Proxy**: Nginx
- **Database Services**: MongoDB, Redis

## 3. Luồng Giao Tiếp (Communication Flow)
- **Frontend** gọi API tới cả **Node Backend** (các logic nghiệp vụ thông thường) và **Python Backend** (các logic liên quan tới AI realtime).
- **Node Backend** quản lý Auth, Profile, Courses, Data. Giao tiếp với MongoDB và Redis. Gọi đến **Python Backend** khi cần đồng bộ logic.
- **Python Backend** đảm nhiệm WebSockets, xử lý model AI, transcription và text-to-speech. Nó cũng lưu dữ liệu xuống MongoDB thông qua Motor.
