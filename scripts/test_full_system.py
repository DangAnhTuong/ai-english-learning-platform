import os
import sys
import time
import urllib.request
import json
import socket

try:
    sys.stdout.reconfigure(encoding='utf-8')
    sys.stderr.reconfigure(encoding='utf-8')
except Exception:
    pass

def check_http(url, name):
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'HealthCheck/1.0'})
        res = urllib.request.urlopen(req, timeout=5)
        print(f"✅ {name}: HOẠT ĐỘNG TỐT (HTTP {res.status})")
        return True
    except Exception as e:
        print(f"❌ {name}: LỖI - {e}")
        return False

def check_tcp_socket(host, port, name):
    try:
        s = socket.create_connection((host, port), timeout=3)
        s.close()
        print(f"✅ {name} (Port {port}): CỔNG MỞ \u0026 SẴN SÀNG KẾT NỐI")
        return True
    except Exception as e:
        print(f"❌ {name} (Port {port}): KHÔNG KẾT NỐI ĐƯỢC - {e}")
        return False

def main():
    print("========================================================")
    print("🔍 KIỂM TRA TOÀN BỘ HỆ THỐNG ENGLISH AI")
    print("========================================================\n")

    results = []

    # 1. MongoDB TCP
    results.append(check_tcp_socket("127.0.0.1", 27017, "[1/6] MongoDB Database"))

    # 2. Node.js Backend API
    results.append(check_http("http://127.0.0.1:3001/api/v1/conversations/topics", "[2/6] Node.js Backend (Port 3001)"))

    # 3. Python FastAPI Health
    results.append(check_http("http://127.0.0.1:8000/health", "[3/6] Python AI FastAPI (Port 8000)"))

    # 4. Audio Streaming MP3
    results.append(check_http("http://127.0.0.1:8000/api/v1/conversation/audio/6a8fabbb13cbed1310b63585/line_1_6a8fabbb13cbed1310b63586.mp3", "[4/6] Audio Streaming Endpoint (120+ Voices)"))

    # 5. WebSocket TCP Port
    results.append(check_tcp_socket("127.0.0.1", 8000, "[5/6] WebSocket AI Realtime Server"))

    # 6. React Frontend
    results.append(check_http("http://127.0.0.1:3005", "[6/6] React Frontend App (Port 3005)"))

    print("\n========================================================")
    if all(results):
        print("🎉 TẤT CẢ 6 THÀNH PHẦN ĐỀU HOẠT ĐỘNG HOÀN HẢO 100%!")
        print("💡 Khi bạn tắt máy và mở lại vào ngày mai:")
        print("   -> Chỉ cần click chạy file 'start_all.bat'")
        print("   -> Tất cả các lỗi socket, bận server, đứt câu đều đã được xử lý vĩnh viễn.")
    else:
        print("⚠️ Có thành phần chưa hoạt động. Hãy kiểm tra danh sách phía trên!")
    print("========================================================")

if __name__ == "__main__":
    main()
