const http = require('http');
const WebSocket = require('ws');
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');

function checkHttp(url) {
    return new Promise((resolve) => {
        const u = new URL(url);
        const req = http.get({
            hostname: u.hostname,
            port: u.port,
            path: u.pathname + u.search,
            timeout: 5000
        }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve({ status: res.statusCode, ok: res.statusCode >= 200 && res.statusCode < 400, data }));
        });
        req.on('error', (err) => resolve({ ok: false, error: err.message }));
        req.on('timeout', () => { req.destroy(); resolve({ ok: false, error: 'Timeout' }); });
    });
}

function checkWebSocket(url) {
    return new Promise((resolve) => {
        try {
            const ws = new WebSocket(url);
            const timeout = setTimeout(() => {
                ws.terminate();
                resolve({ ok: false, error: 'WebSocket connection timeout (5s)' });
            }, 5000);

            ws.on('open', () => {
                clearTimeout(timeout);
                ws.send(JSON.stringify({ type: 'ping' }));
                setTimeout(() => {
                    ws.close();
                    resolve({ ok: true });
                }, 500);
            });

            ws.on('error', (err) => {
                clearTimeout(timeout);
                resolve({ ok: false, error: err.message });
            });
        } catch (e) {
            resolve({ ok: false, error: e.message });
        }
    });
}

async function runHealthChecks() {
    console.log('========================================================');
    console.log('🔍 KIỂM TRA TOÀN DIỆN HỆ THỐNG (FULL HEALTH CHECK)');
    console.log('========================================================\n');

    let allPass = true;

    // 1. Check Node.js
    const nodeRes = await checkHttp('http://127.0.0.1:3001/api/v1/conversations/topics');
    if (nodeRes.ok) {
        console.log('✅ [1/5] Node.js Backend (Port 3001) & MongoDB: HOẠT ĐỘNG TỐT (HTTP 200)');
    } else {
        console.log('❌ [1/5] Node.js Backend (Port 3001): THẤT BẠI -', nodeRes.error || nodeRes.status);
        allPass = false;
    }

    // 2. Check Python Health
    const pyRes = await checkHttp('http://127.0.0.1:8000/health');
    if (pyRes.ok) {
        console.log('✅ [2/5] Python AI Backend (Port 8000): HOẠT ĐỘNG TỐT (HTTP 200)');
    } else {
        console.log('❌ [2/5] Python AI Backend (Port 8000): THẤT BẠI -', pyRes.error || pyRes.status);
        allPass = false;
    }

    // 3. Check Audio Serving Endpoint
    const audioRes = await checkHttp('http://127.0.0.1:8000/api/v1/conversation/audio/6a8fabbb13cbed1310b63585/line_1_6a8fabbb13cbed1310b63586.mp3');
    if (audioRes.ok) {
        console.log('✅ [3/5] Audio Streaming Service (MP3): HOẠT ĐỘNG TỐT (HTTP 200)');
    } else {
        console.log('❌ [3/5] Audio Streaming Service: THẤT BẠI -', audioRes.error || audioRes.status);
        allPass = false;
    }

    // 4. Check WebSocket
    const wsRes = await checkWebSocket('ws://127.0.0.1:8000/ws/conversation/health_check_conn');
    if (wsRes.ok) {
        console.log('✅ [4/5] Real-time WebSocket Service (/ws/conversation): KẾT NỐI THÀNH CÔNG');
    } else {
        console.log('❌ [4/5] Real-time WebSocket Service: THẤT BẠI -', wsRes.error);
        allPass = false;
    }

    // 5. Check React Frontend
    const feRes = await checkHttp('http://127.0.0.1:3005');
    if (feRes.ok) {
        console.log('✅ [5/5] React Frontend App (Port 3005): ĐANG CHẠY MƯỢT MÀ (HTTP 200)');
    } else {
        console.log('❌ [5/5] React Frontend App (Port 3005): THẤT BẠI -', feRes.error || feRes.status);
        allPass = false;
    }

    console.log('\n========================================================');
    if (allPass) {
        console.log('🎉 TẤT CẢ CÁC THÀNH PHẦN ĐỀU VẬN HÀNH 100% HOÀN HẢO!');
        console.log('👉 Ngày mai bạn chỉ cần mở máy và chạy "start_all.bat" là web hoạt động ngay lập tức!');
    } else {
        console.log('⚠️ Có một vài dịch vụ cần kiểm tra lại!');
    }
    console.log('========================================================');
}

runHealthChecks();
