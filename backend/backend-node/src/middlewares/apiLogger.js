const Logger = require('../utils/logger');

/**
 * Middleware để log tất cả API requests và responses
 */
const apiLogger = (req, res, next) => {
    const startTime = Date.now();

    // Log request khi bắt đầu
    Logger.info('API Request Started', {
        method: req.method,
        url: req.originalUrl || req.url,
        path: req.path,
        ip: req.ip || req.connection.remoteAddress,
        userAgent: req.get('user-agent'),
        timestamp: new Date().toISOString()
    });

    // Capture response khi kết thúc
    const originalSend = res.send;
    res.send = function (data) {
        const responseTime = Date.now() - startTime;
        
        // Log request với response
        Logger.logRequest(req, res, responseTime);

        // Gọi original send
        return originalSend.call(this, data);
    };

    next();
};

module.exports = apiLogger;



