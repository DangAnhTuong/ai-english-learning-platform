@echo off
chcp 65001 > nul
title English AI Learning Platform - Startup
echo ========================================================
echo   🚀 KHỞI ĐỘNG ENGLISH AI LEARNING PLATFORM
echo ========================================================
echo.

echo [1/3] Đang khởi động Backend Node.js (Port 3001)...
start "Node.js Backend (Port 3001)" cmd /k "cd /d a:\frontend\web_learn_english_main\English-App-Clean\backend\backend-node && node src/server.js"

timeout /t 2 /nobreak > nul

echo [2/3] Đang khởi động Backend Python AI (Port 8000)...
start "Python AI Backend (Port 8000)" cmd /k "cd /d a:\frontend\web_learn_english_main\English-App-Clean\backend\backend-python && python -u run_server.py"

timeout /t 3 /nobreak > nul

echo [3/3] Đang khởi động Frontend React (Port 3005)...
start "React Frontend (Port 3005)" cmd /k "cd /d a:\frontend\web_learn_english_main\English-App-Clean\frontend && node start.js"

echo.
echo ========================================================
echo   ✅ TẤT CẢ SERVER ĐÃ ĐƯỢC KHỞI ĐỘNG THÀNH CÔNG!
echo   🌐 Truy cập Web tại: http://localhost:3005
echo ========================================================
echo.
timeout /t 4 /nobreak > nul
start http://localhost:3005
