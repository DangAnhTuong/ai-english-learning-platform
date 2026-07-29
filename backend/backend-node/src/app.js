// dotenv is already loaded in server.js, no need to load again
const express = require('express');
const morgan = require('morgan');
const helmet = require('helmet');
const compression = require('compression');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const passport = require('passport');
// Session removed - using JWT tokens instead, Google OAuth uses session: false
// const session = require('express-session');
const fs = require('fs');
const path = require('path');
const rfs = require('rotating-file-stream');

const routes = require('./routes'); // tự động gom các route
const { notFound, errorHandler } = require('./middlewares/errorHandler');
const { getMongoDBStatus } = require('./config/database.config');
const apiLogger = require('./middlewares/apiLogger');
const Logger = require('./utils/logger');

// Initialize Passport configuration
require('./config/passport')();

const app = express();

app.disable('x-powered-by');
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    crossOriginOpenerPolicy: { policy: "unsafe-none" }
}));
app.use(compression());

// Setup Morgan với file logging
const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
}

// Morgan access log với rotation
const accessLogStream = rfs.createStream('access.log', {
    interval: '1d', // Rotate daily
    path: logsDir,
    maxFiles: 30, // Giữ 30 ngày
    compress: 'gzip' // Compress old files
});

// Morgan format cho file (chi tiết)
const morganFormat = ':remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent" :response-time ms';

// Morgan cho file
app.use(morgan(morganFormat, {
    stream: accessLogStream,
    skip: (req, res) => {
        // Skip health check trong file log (vẫn log trong apiLogger)
        return req.path === '/health';
    }
}));

// Morgan cho console (development)
if (process.env.NODE_ENV !== 'production') {
    app.use(morgan('dev'));
}

// API Logger middleware (log chi tiết vào api-access.log)
app.use(apiLogger);

// CORS Configuration
// Development: Cho phép frontend (port 3000) và tất cả localhost origins
// Production: Chỉ cho phép các domain trong CORS_ALLOWLIST
const corsAllowlist = (process.env.CORS_ALLOWLIST || '').trim();
const isDevelopment = process.env.NODE_ENV !== 'production';

// Default allowed origins cho development
const defaultDevOrigins = [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:3001'
];

let corsOptions = {
    credentials: true,
    optionsSuccessStatus: 200,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

if (isDevelopment || !corsAllowlist || corsAllowlist === '*') {
    // Development mode: Cho phép tất cả localhost origins
    corsOptions.origin = (origin, cb) => {
        // Cho phép requests không có origin (mobile apps, Postman, etc.)
        if (!origin) return cb(null, true);

        // Cho phép tất cả localhost origins
        if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
            return cb(null, true);
        }

        // Cho phép các origins trong defaultDevOrigins
        if (defaultDevOrigins.includes(origin)) {
            return cb(null, true);
        }

        return cb(null, true); // Development: cho phép tất cả
    };
} else {
    // Production mode: Chỉ cho phép các domain trong allowlist
    const allowlist = corsAllowlist
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);

    corsOptions.origin = (origin, cb) => {
        // Cho phép requests không có origin (mobile apps, Postman, etc.)
        if (!origin) return cb(null, true);

        if (allowlist.length === 0 || allowlist.includes(origin)) {
            return cb(null, true);
        }

        return cb(new Error('Not allowed by CORS'));
    };
}

app.use(cors(corsOptions));
app.use(cookieParser()); // Parse cookies để đọc oauth_state

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files for uploads (avatars, etc.)
const publicDir = path.join(__dirname, '../public');
if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
}
const uploadsDir = path.join(publicDir, 'uploads/avatars');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(path.join(publicDir, 'uploads')));

// Session removed - not needed (using JWT tokens, Google OAuth uses session: false)
// This prevents memory leaks from MemoryStore

// Initialize passport (only initialize, no session needed)
app.use(passport.initialize());

// Health check endpoint with MongoDB status
app.get('/health', (_req, res) => {
    const mongoStatus = getMongoDBStatus();
    const isHealthy = mongoStatus.isConnected;

    res.status(isHealthy ? 200 : 503).json({
        status: isHealthy ? 'healthy' : 'degraded',
        service: 'gateway',
        uptime: process.uptime(),
        mongodb: mongoStatus,
        timestamp: new Date().toISOString()
    });
});

const rateLimit = require('express-rate-limit');

// Rate limiting cho toàn bộ API
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // Giới hạn 1000 request / 15 phút / IP
    standardHeaders: true, 
    legacyHeaders: false, 
    message: { success: false, message: 'Bạn đã gửi quá nhiều yêu cầu. Vui lòng thử lại sau 15 phút.' }
});

// Routes
app.use(process.env.API_PREFIX || '/api/v1', apiLimiter, routes); // Fallback to /api if API_PREFIX is not set

// 404 + Error handler
app.use(notFound);
app.use(errorHandler);

module.exports = app;
