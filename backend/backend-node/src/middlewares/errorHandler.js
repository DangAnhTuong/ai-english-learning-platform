const AppError = require('../utils/AppError');
const Logger = require('../utils/logger');

function notFound(req, res, next) {
    if (res.headersSent) return next();
    next(AppError.notFound(`Route ${req.originalUrl} not found`));
}

function errorHandler(err, req, res, _next) {
    // Log error với Logger
    Logger.logError(err, req);

    // Mongoose validation error (not Joi validation - Joi is handled in validate middleware)
    if (err.name === 'ValidationError' && err.errors) {
        const errors = Object.values(err.errors).map(e => ({
            field: e.path,
            message: e.message
        }));
        return res.status(422).json({
            success: false,
            error: 'Dữ liệu không hợp lệ',
            code: 'VALIDATION_ERROR',
            errors
        });
    }

    // MongoDB duplicate key error
    if (err.code === 11000) {
        return res.status(409).json({
            error: 'Duplicate entry',
            code: 'DUPLICATE_ERROR'
        });
    }

    // JWT errors
    if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({
            error: 'Invalid token',
            code: 'INVALID_TOKEN'
        });
    }

    if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
            error: 'Token expired',
            code: 'TOKEN_EXPIRED'
        });
    }

    if (err instanceof AppError) {
        return res.status(err.statusCode).json(err.responseData);
    }

    // Fallback for non-AppError errors
    const status = err.statusCode || 500;
    const response = {
        error: err.message || 'Internal Server Error',
        code: 'INTERNAL_ERROR'
    };

    if (process.env.NODE_ENV !== 'production') {
        response.stack = err.stack;
    }

    res.status(status).json(response);
}

module.exports = { notFound, errorHandler };
