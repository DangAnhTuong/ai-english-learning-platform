const winston = require('winston');
const path = require('path');

// Define log format
const logFormat = winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
);

// Create loggers
const securityLogger = winston.createLogger({
    format: logFormat,
    transports: [
        new winston.transports.File({
            filename: path.join(__dirname, '../../logs/security.log'),
            level: 'info'
        })
    ]
});

// Add console transport in development
if (process.env.NODE_ENV !== 'production') {
    securityLogger.add(new winston.transports.Console({
        format: winston.format.simple()
    }));
}

const SecurityLogger = {
    logLoginAttempt({ userId, email, success, ip }) {
        securityLogger.info('Login attempt', {
            event: 'login_attempt',
            userId,
            email,
            success,
            ip
        });
    },

    logPasswordChange({ userId, method }) {
        securityLogger.info('Password change', {
            event: 'password_change',
            userId,
            method // 'reset' or 'change'
        });
    },

    logAccountLocked({ userId, reason }) {
        securityLogger.warn('Account locked', {
            event: 'account_locked',
            userId,
            reason
        });
    },

    logEmailVerification({ userId, success }) {
        securityLogger.info('Email verification', {
            event: 'email_verification',
            userId,
            success
        });
    },

    logSuspiciousActivity({ userId, activity, ip }) {
        securityLogger.warn('Suspicious activity', {
            event: 'suspicious_activity',
            userId,
            activity,
            ip
        });
    }
};

module.exports = SecurityLogger;