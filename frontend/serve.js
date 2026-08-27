const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3005;
const BUILD_DIR = path.join(__dirname, 'build');
const PUBLIC_INDEX = path.join(__dirname, 'public', 'index.html');

const MIME_TYPES = {
  '.html': 'text/html; charset=UTF-8',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.eot': 'application/vnd.ms-fontobject',
  '.map': 'application/json'
};

const server = http.createServer((req, res) => {
  let urlPath = req.url.split('?')[0];
  let filePath = path.join(BUILD_DIR, urlPath);

  // If path doesn't have an extension or is root, try serve index.html (SPA Fallback)
  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      filePath = path.join(BUILD_DIR, 'index.html');
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    fs.readFile(filePath, (readErr, content) => {
      if (!readErr) {
        res.writeHead(200, {
          'Content-Type': contentType,
          'Access-Control-Allow-Origin': '*'
        });
        res.end(content);
        return;
      }

      // If build/index.html is not ready yet, fallback to public or loading
      if (fs.existsSync(PUBLIC_INDEX)) {
        const publicHtml = fs.readFileSync(PUBLIC_INDEX, 'utf-8');
        res.writeHead(200, { 'Content-Type': 'text/html; charset=UTF-8' });
        res.end(publicHtml);
        return;
      }

      res.writeHead(200, { 'Content-Type': 'text/html; charset=UTF-8' });
      res.end('<html><head><meta http-equiv="refresh" content="3"><title>Đang khởi tạo...</title></head><body style="display:flex;justify-content:center;align-items:center;height:100vh;font-family:sans-serif;background:#0f172a;color:#fff;"><h2>🚀 Đang biên dịch bundle, tự động tải lại sau giây lát...</h2></body></html>');
    });
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Frontend is running at http://localhost:${PORT}`);
});
