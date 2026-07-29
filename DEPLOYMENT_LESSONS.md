# Deployment and Debugging Lessons for English AI Web App

This document records the critical issues encountered during the deployment of the English Learning App to the production VPS (danganhtuong.dev), and their root causes, to prevent them from recurring in the future.

## 1. Environment Variables vs Hardcoded URLs
- **Issue**: The frontend code (`conversationService.js`) had hardcoded `ws://localhost:8000` and `http://localhost:8000`. In production, the client's browser tried to connect to their own local machine instead of the server, causing instant connection failures.
- **Root Cause**: Not utilizing `process.env` properly for different deployment environments.
- **Solution**: ALWAYS use environment variables like `process.env.REACT_APP_PYTHON_API_URL` or `process.env.REACT_APP_API_URL`. Ensure fallbacks correctly identify the production environment.

## 2. Nginx WebSocket Proxying (Docker Layer)
- **Issue**: In `docker/nginx/frontend.conf`, the `proxy_pass` directive was set to `http://backend-python:8000/ws/;` (with a trailing slash). This caused Nginx to rewrite the URI, stripping the path, leading to `404 Not Found` on the FastAPI backend.
- **Solution**: When proxying WebSockets, avoid trailing slashes in `proxy_pass` if you intend to preserve the exact URI. Always include the standard WebSocket headers:
  ```nginx
  proxy_http_version 1.1;
  proxy_set_header Upgrade $http_upgrade;
  proxy_set_header Connection "upgrade";
  ```

## 3. Host Nginx Stripping WebSocket Headers (VPS Layer)
- **Issue**: The DigitalOcean VPS has a multi-layer proxy setup. A Host Nginx (`/etc/nginx/sites-enabled/default`) proxies traffic from `danganhtuong.dev` (port 80/443) to the Docker frontend container on port `127.0.0.1:3000`. The Host Nginx was missing the `Upgrade` and `Connection` headers. This caused it to strip WebSocket headers before they even reached Docker, making FastAPI return 404 because it received a standard HTTP request instead of a WebSocket upgrade request.
- **Solution**: In a multi-layer architecture (Host Nginx -> Docker Nginx -> Uvicorn/FastAPI), EVERY proxy layer in the chain MUST explicitly forward the `Upgrade` and `Connection` headers.

## 4. Aggressive SPA Browser Caching
- **Issue**: After fixing the backend and Nginx, the user's browser still showed the old UI and attempted to connect to `localhost`. This was because the React SPA `index.html` was permanently cached by the browser. React Router navigation doesn't fetch a new `index.html`, so the old JS bundle kept running. F5 would temporarily fetch it, but client-side routing would revert to the cached state.
- **Solution**: Always configure the production Nginx (`docker/nginx/frontend.conf`) to serve `index.html` with NO CACHE to ensure users receive new updates immediately:
  ```nginx
  location = /index.html {
      add_header Cache-Control "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0";
      add_header Pragma "no-cache";
      add_header Expires "0";
  }
  ```
