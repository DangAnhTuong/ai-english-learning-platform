class AppError extends Error {
    /**
     * Tạo một error với các thông tin tùy chỉnh
     * @param {object} options - Các thông tin muốn trả về cho client
     * @param {number} statusCode - HTTP status code (không trả về cho client)
     * 
     * Ví dụ:
     * new AppError({
     *   error: 'Lỗi đăng nhập',
     *   code: 'LOGIN_FAILED',
     *   errorCode: 410,        // Mã lỗi tự định nghĩa
     *   data: { ... },        // Data tùy chỉnh
     *   details: [ ... ],     // Chi tiết lỗi
     *   anyField: 'anything'  // Bất kỳ field nào
     * }, 401)
     */
    constructor(options = {}, statusCode = 500, code = null) {
        // Support 2 ways: new AppError(message, statusCode, code) or new AppError({error, code}, statusCode)
        let errorMessage, errorCode, responseData;
        let finalStatusCode;
        
        if (typeof options === 'string') {
            // Called as: new AppError(message, statusCode, code)
            errorMessage = options;
            errorCode = code || 'INTERNAL_ERROR';
            finalStatusCode = statusCode || 500;
            responseData = {
                error: errorMessage,
                code: errorCode
            };
        } else {
            // Called as: new AppError({error, code, ...}, statusCode)
            errorMessage = options.error || options.message || 'Internal Error';
            finalStatusCode = statusCode || 500;
            responseData = options;
        }

        // MUST call super() before accessing 'this'
        super(errorMessage);

        // HTTP status code để set response status
        this.statusCode = finalStatusCode;

        // Lưu response data để trả về client
        this.responseData = responseData;

        // Capture stack trace
        Error.captureStackTrace(this, this.constructor);
    }

    /**
     * Tạo lỗi Bad Request (400)
     * @param {string} message - Thông báo lỗi
     * @param {string} code - Mã lỗi tùy chỉnh
     */
    static badRequest(message, code = 'BAD_REQUEST') {
        return new AppError(message, 400, code);
    }

    /**
     * Tạo lỗi Unauthorized (401)
     * @param {string} message - Thông báo lỗi
     * @param {string} code - Mã lỗi tùy chỉnh
     */
    static unauthorized(message = 'Unauthorized', code = 'UNAUTHORIZED') {
        return new AppError(message, 401, code);
    }

    /**
     * Tạo lỗi Forbidden (403)
     * @param {string} message - Thông báo lỗi
     * @param {string} code - Mã lỗi tùy chỉnh
     */
    static forbidden(message = 'Forbidden', code = 'FORBIDDEN') {
        return new AppError(message, 403, code);
    }

    /**
     * Tạo lỗi Not Found (404)
     * @param {string} message - Thông báo lỗi
     * @param {string} code - Mã lỗi tùy chỉnh
     */
    static notFound(message = 'Not Found', code = 'NOT_FOUND') {
        return new AppError(message, 404, code);
    }

    /**
     * Tạo lỗi Conflict (409)
     * @param {string} message - Thông báo lỗi
     * @param {string} code - Mã lỗi tùy chỉnh
     */
    static conflict(message, code = 'CONFLICT') {
        return new AppError(message, 409, code);
    }

    /**
     * Tạo lỗi Locked (423)
     * @param {string} message - Thông báo lỗi
     * @param {string} code - Mã lỗi tùy chỉnh
     */
    static locked(message, code = 'LOCKED') {
        return new AppError(message, 423, code);
    }

    /**
     * Tạo lỗi Validation (422)
     * @param {string} message - Thông báo lỗi
     * @param {string} code - Mã lỗi tùy chỉnh
     */
    static validation(message, code = 'VALIDATION_ERROR') {
        return new AppError(message, 422, code);
    }

    /**
     * Tạo lỗi Rate Limit (429)
     * @param {string} message - Thông báo lỗi
     * @param {string} code - Mã lỗi tùy chỉnh
     */
    static rateLimit(message = 'Too Many Requests', code = 'RATE_LIMIT') {
        return new AppError(message, 429, code);
    }

    /**
     * Chuyển đổi lỗi thành response format tùy chỉnh
     */
    toJSON() {
        return this.responseData;
    }
}

module.exports = AppError;