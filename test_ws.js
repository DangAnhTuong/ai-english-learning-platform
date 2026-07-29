const WebSocket = require('ws');

const ws = new WebSocket('wss://danganhtuong.dev/ws/conversation/test-id-1234');

ws.on('open', () => {
    console.log('Connected successfully!');
    ws.close();
});

ws.on('error', (err) => {
    console.error('Connection error:', err.message);
});

ws.on('close', (code, reason) => {
    console.log(`Connection closed: ${code} - ${reason}`);
});
