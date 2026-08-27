# Deployment and Debugging Lessons for English AI Web App

Whenever working on this project (English-App-Clean), AI agents MUST adhere to the following rules and be aware of these historical production issues to avoid repeating them.

## 1. Environment Variables vs Hardcoded URLs
- **Issue**: Previously, the frontend code (`conversationService.js`) had hardcoded `ws://localhost:8000` and `http://localhost:8000`. In production, the client's browser tried to connect to their own local machine instead of the server, causing instant connection failures.
- **Rule**: NEVER hardcode `localhost` URLs in the frontend code. ALWAYS use environment variables like `process.env.REACT_APP_PYTHON_API_URL` or `process.env.REACT_APP_API_URL`. Ensure fallbacks correctly identify the production environment.

## 2. Nginx WebSocket Proxying (Docker Layer)
- **Issue**: In `docker/nginx/frontend.conf`, the `proxy_pass` directive was set to `http://backend-python:8000/ws/;` (with a trailing slash). This caused Nginx to rewrite the URI, stripping the path, leading to `404 Not Found` on the FastAPI backend.
- **Rule**: When proxying WebSockets, avoid trailing slashes in `proxy_pass` if you intend to preserve the exact URI. Always include the standard WebSocket headers:
  ```nginx
  proxy_http_version 1.1;
  proxy_set_header Upgrade $head_upgrade;
  proxy_set_header Connection "upgrade";
  ```

## 3. Host Nginx Stripping WebSocket Headers (VPS Layer)
- **Issue**: The DigitalOcean VPS has a multi-layer proxy setup. A Host Nginx (`/etc/nginx/sites-enabled/default`) proxies traffic from `danganhtuong.dev` (port 80/443) to the Docker frontend container on port `127.0.0.1:3000`. The Host Nginx was missing the `Upgrade` and `Connection` headers. This caused it to strip WebSocket headers before they even reached Docker, making FastAPI return 404 because it received a standard HTTP request instead of a WebSocket upgrade request.
- **Rule**: If diagnosing WebSocket issues in production, remember the multi-layer architecture (Host Nginx -> Docker Nginx -> Uvicorn/FastAPI). EVERY layer in the chain MUST forward the `Upgrade` and `Connection` headers.

## 4. Aggressive SPA Browser Caching
- **Issue**: After fixing the backend and Nginx, the user's browser still showed the old UI and attempted to connect to `localhost`. This was because the React SPA `index.html` was permanently cached by the browser. React Router navigation doesn't fetch a new `index.html`, so the old JS bundle kept running.
- **Rule**: Always configure the production Nginx (`docker/nginx/frontend.conf`) to serve `index.html` with NO CACHE to ensure users receive new updates immediately:
  ```nginx
  location = /index.html {
      add_header Cache-Control "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0";
      add_header Pragma "no-cache";
      add_header Expires "0";
  }
  ```

---

# 🤖 MANDATORY AI WORKFLOW & BEHAVIOR RULES 🤖

## 5. Onboarding & Context Gathering
- **Rule**: When the user opens a new chat and issues a command like "đọc hết toàn bộ dự án" (read the whole project), the AI MUST immediately scan and understand the entire project. This includes:
  - Reading `README.md`, `package.json`, structural directories (frontend, backend-node, backend-python).
  - Understanding the tech stack, languages, and core features.
  - Reviewing past deployment lessons and bugs (Rules 1-4).
  - Reviewing Section 8: USER PROFILE & PORTFOLIO PROJECTS MEMORY below.

## 6. Strict Autonomous Coding Loop (NO INTERRUPTIONS)
- **Rule**: When the user requests to build a feature, create a page, or fix a bug, the AI MUST strictly follow this autonomous loop:
  1. **CODE**: Write the implementation.
  2. **SELF-REVIEW (INNER LOOP)**: Analyze the written code strictly against the user's original request. **If it does not match 100%, go back to step 1 (CODE)**. Do NOT proceed to testing until the code is completely aligned with the requirements.
  3. **TEST**: Only after passing the Self-Review, run tests (or write automated test scripts) to verify functionality.
  4. **FIX**: If any test fails or errors occur, the AI MUST auto-correct the backend/frontend code immediately.
  5. **REPEAT**: Loop steps 1-4 continuously.
- **CRITICAL**: The AI is **FORBIDDEN** from stopping mid-way or asking the user clarifying questions unless absolutely blocked. The AI MUST NOT return the final response until the request is 100% complete, fully verified, and error-free.

## 7. Automated E2E Testing Script Generation
- **Rule**: After completing a feature, the AI MUST proactively write Headless Test Scripts (e.g., using Playwright) to simulate the user flow. 
- **Auto-Fixing**: The AI must run these scripts via the terminal. If it encounters a `Fail`, it must automatically trace the bug, fix the backend/frontend code, and re-run the test until it `Passes` completely.

---

# 📌 USER PROFILE & PORTFOLIO PROJECTS MEMORY (PERMANENT CONTEXT)

## 8. Candidate Profile & Education
- **Full Name**: Dang Anh Tuong (Đặng Anh Tường)
- **Email**: danganhtuongg@gmail.com
- **Mobile**: 0335847674
- **Education**: 4th-year Student at Thuyloi University (Ho Chi Minh City Campus), Bachelor of Science in Information Technology (Expected Graduation: 2027).
- **Target Role**: Full-stack / Frontend Software Engineer Internship.
- **Skills**: React 19, Next.js, Three.js (@react-three/fiber), Node.js (Express), Python (FastAPI), MongoDB, Redis, MySQL, PostgreSQL, WebSockets, Deepgram STT, OpenAI API, Docker, Docker Compose, Nginx, VS Code, Cursor (Vibe Coding ~1 year), Vercel, Netlify.

## 9. Key Portfolio Projects & Repositories
1. **AI-Powered English Learning Platform**
   - **GitHub Repo**: `https://github.com/DangAnhTuong/ai-english-learning-platform`
   - **Live Production URL**: `https://danganhtuong.dev`
   - **Local Path**: `a:\frontend\web_learn_english_main\English-App-Clean`
   - **Tech Stack**: React 19, Node.js (Express), Python (FastAPI), MongoDB, Redis, WebSockets, Deepgram STT, OpenAI API, Docker, Nginx.
   - **Highlights**: Microservice architecture, real-time voice streaming (<1.5s latency), JWT + Google OAuth2, zero-cache SPA headers.

2. **Tuong Hotel - 3D Showcase & Reservation System**
   - **GitHub Repo**: `https://github.com/DangAnhTuong/tuong-hotel`
   - **Live Production URL**: `https://khson.netlify.app/`
   - **Local Path**: `a:\frontend\projectminilove\reactjs`
   - **Project Period**: June 2025 -- Aug. 2025 (~2 months)
   - **Tech Stack**: React 19, Three.js (@react-three/fiber), Ant Design 5, HTML5, CSS3, i18next (Multi-language), Netlify.
   - **Highlights**: 3D interactive graphics, room showcases, dining & tour booking flows, responsive layout, zero ESLint warnings.

## 10. Server & DigitalOcean Billing Memory
- **DigitalOcean Credit**: GitHub Student Developer Pack credit ($200 initial, $152.24 remaining) expires on **August 01, 2026**.
- **Action**: User must Destroy the $32/mo Droplet (`ubuntu-s-2vcpu-4gb-intel-sgp1`) before August 01, 2026 to prevent automatic billing on Visa card ending in 7093.

## 11. Local Development Port Rules & One-Click Startup
- **Port Allocation**:
  - React Frontend: **PORT `3005`** (`http://localhost:3005`) - NEVER use port 3000 locally as port 3000 is reserved for the user's second project ("TƯỜNG TẬN TOEIC").
  - Node.js Backend: **PORT `3001`** (`http://localhost:3001`).
  - Python FastAPI AI Backend: **PORT `8000`** (`http://localhost:8000`).
- **1-Click Startup**: Use `start_all.bat` (or `npm start` at root `English-App-Clean`) to start all 3 services concurrently.
- **WebSocket Resilience**: In `useConversation.js`, ALWAYS use silent exponential backoff (1s, 2s, 4s, 8s) for WebSocket connections instead of firing disruptive red error modals on temporary disconnections.
- **Continuous Speech Recognition**: In `chatbox/index.js`, iterate over `event.results` from `i = 0` to preserve the complete sentence, and use a 2.2s silence debounce that dynamically resets on every spoken word to avoid cutting off user mid-sentence.
