const winston = require('winston');
const path = require('path');
const fs = require('fs');

// Đảm bảo thư mục logs tồn tại
const logsDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
}

// Custom format cho console (dễ đọc)
const consoleFormat = winston.format.combine(
    winston.format.colorize(),
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.printf(({ timestamp, level, message, ...meta }) => {
        let msg = `${timestamp} [${level}]: ${message}`;
        if (Object.keys(meta).length > 0) {
            msg += ` ${JSON.stringify(meta, null, 2)}`;
        }
        return msg;
    })
);

// Custom format cho file (JSON structured)
const fileFormat = winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
);

// Tạo logger chính
const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: fileFormat,
    defaultMeta: { service: 'backend-api' },
    transports: [
        // Error logs
        new winston.transports.File({
            filename: path.join(logsDir, 'error.log'),
            level: 'error',
            maxsize: 5242880, // 5MB
            maxFiles: 5,
            format: fileFormat
        }),
        // Combined logs (tất cả)
        new winston.transports.File({
            filename: path.join(logsDir, 'combined.log'),
            maxsize: 5242880, // 5MB
            maxFiles: 5,
            format: fileFormat
        })
    ],
    exceptionHandlers: [
        new winston.transports.File({
            filename: path.join(logsDir, 'exceptions.log')
        })
    ],
    rejectionHandlers: [
        new winston.transports.File({
            filename: path.join(logsDir, 'rejections.log')
        })
    ]
});

// API Access Logger (riêng cho API requests)
const apiLogger = winston.createLogger({
    level: 'info',
    format: fileFormat,
    defaultMeta: { service: 'api-access' },
    transports: [
        new winston.transports.File({
            filename: path.join(logsDir, 'api-access.log'),
            maxsize: 10485760, // 10MB
            maxFiles: 10,
            format: fileFormat
        })
    ]
});

// Console transport cho development
if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
        format: consoleFormat
    }));

    apiLogger.add(new winston.transports.Console({
        format: consoleFormat
    }));
}

// Helper functions
const Logger = {
    // General logging
    info: (message, meta = {}) => logger.info(message, meta),
    error: (message, meta = {}) => logger.error(message, meta),
    warn: (message, meta = {}) => logger.warn(message, meta),
    debug: (message, meta = {}) => logger.debug(message, meta),

    // API request logging
    logRequest: (req, res, responseTime) => {
        const logData = {
            method: req.method,
            url: req.originalUrl || req.url,
            path: req.path,
            statusCode: res.statusCode,
            responseTime: `${responseTime}ms`,
            ip: req.ip || req.connection.remoteAddress,
            userAgent: req.get('user-agent'),
            timestamp: new Date().toISOString()
        };

        // Thêm user info nếu có
        if (req.user) {
            logData.userId = req.user.id;
            logData.userEmail = req.user.email;
        }

        // Thêm request body (trừ password)
        if (req.body && Object.keys(req.body).length > 0) {
            const sanitizedBody = { ...req.body };
            // Ẩn password và sensitive data
            if (sanitizedBody.password) sanitizedBody.password = '***';
            if (sanitizedBody.oldPass) sanitizedBody.oldPass = '***';
            if (sanitizedBody.newPass) sanitizedBody.newPass = '***';
            if (sanitizedBody.oldPassword) sanitizedBody.oldPassword = '***';
            if (sanitizedBody.newPassword) sanitizedBody.newPassword = '***';
            logData.requestBody = sanitizedBody;
        }

        // Thêm query params
        if (req.query && Object.keys(req.query).length > 0) {
            logData.queryParams = req.query;
        }

        // Log level dựa trên status code
        if (res.statusCode >= 500) {
            apiLogger.error('API Request', logData);
        } else if (res.statusCode >= 400) {
            apiLogger.warn('API Request', logData);
        } else {
            apiLogger.info('API Request', logData);
        }
    },

    // API error logging
    logError: (error, req = null) => {
        const logData = {
            message: error.message,
            stack: error.stack,
            timestamp: new Date().toISOString()
        };

        if (req) {
            logData.method = req.method;
            logData.url = req.originalUrl || req.url;
            logData.ip = req.ip || req.connection.remoteAddress;
            if (req.user) {
                logData.userId = req.user.id;
            }
        }

        logger.error('API Error', logData);
    }
};

module.exports = Logger;



