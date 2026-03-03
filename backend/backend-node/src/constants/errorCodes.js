/**
 * Định nghĩa các mã lỗi được sử dụng trong hệ thống
 * Format: ERROR_TYPE_SPECIFIC_ERROR
 */
const ErrorCodes = {
    // Lỗi xác thực (401)
    AUTH_INVALID_CREDENTIALS: 'AUTH_INVALID_CREDENTIALS',        // Email hoặc mật khẩu không đúng
    AUTH_TOKEN_EXPIRED: 'AUTH_TOKEN_EXPIRED',                   // Token hết hạn
    AUTH_TOKEN_INVALID: 'AUTH_TOKEN_INVALID',                  // Token không hợp lệ
    AUTH_TOKEN_MISSING: 'AUTH_TOKEN_MISSING',                  // Thiếu token
    AUTH_SESSION_EXPIRED: 'AUTH_SESSION_EXPIRED',              // Phiên đăng nhập hết hạn

    // Lỗi phân quyền (403)
    AUTH_INSUFFICIENT_PERMISSIONS: 'AUTH_INSUFFICIENT_PERMISSIONS', // Không đủ quyền
    AUTH_ACCOUNT_DISABLED: 'AUTH_ACCOUNT_DISABLED',            // Tài khoản bị vô hiệu hóa

    // Lỗi đăng ký (409, 400)
    REGISTER_EMAIL_EXISTS: 'REGISTER_EMAIL_EXISTS',            // Email đã tồn tại
    REGISTER_INVALID_PASSWORD: 'REGISTER_INVALID_PASSWORD',    // Mật khẩu không đủ mạnh
    REGISTER_INVALID_EMAIL: 'REGISTER_INVALID_EMAIL',         // Email không hợp lệ

    // Lỗi người dùng (404, 400, 409)
    USER_NOT_FOUND: 'USER_NOT_FOUND',                         // Không tìm thấy người dùng
    USER_ALREADY_VERIFIED: 'USER_ALREADY_VERIFIED',           // Email đã được xác thực
    USER_ACCOUNT_LOCKED: 'USER_ACCOUNT_LOCKED',               // Tài khoản bị khóa
    EMAIL_ALREADY_EXISTS: 'EMAIL_ALREADY_EXISTS',             // Email đã tồn tại
    USERNAME_ALREADY_EXISTS: 'USERNAME_ALREADY_EXISTS',       // Username đã tồn tại
    PHONE_ALREADY_EXISTS: 'PHONE_ALREADY_EXISTS',            // Phone đã tồn tại
    INVALID_ROLES: 'INVALID_ROLES',                          // Vai trò không hợp lệ
    INVALID_INPUT: 'INVALID_INPUT',                          // Dữ liệu đầu vào không hợp lệ

    // Lỗi mật khẩu (400)
    PASSWORD_RESET_TOKEN_INVALID: 'PASSWORD_RESET_TOKEN_INVALID', // Token reset mật khẩu không hợp lệ
    PASSWORD_RESET_TOKEN_EXPIRED: 'PASSWORD_RESET_TOKEN_EXPIRED', // Token reset mật khẩu hết hạn
    PASSWORD_SAME_AS_OLD: 'PASSWORD_SAME_AS_OLD',             // Mật khẩu mới giống mật khẩu cũ
    PASSWORD_RECENTLY_CHANGED: 'PASSWORD_RECENTLY_CHANGED',    // Mật khẩu vừa được đổi

    // Lỗi session (401)
    SESSION_INVALID: 'SESSION_INVALID',                       // Phiên không hợp lệ
    SESSION_EXPIRED: 'SESSION_EXPIRED',                       // Phiên hết hạn
    SESSION_DEVICE_CHANGED: 'SESSION_DEVICE_CHANGED',         // Phát hiện thiết bị mới

    // Lỗi validation (422)
    VALIDATION_ERROR: 'VALIDATION_ERROR',                     // Lỗi validation chung
    VALIDATION_REQUIRED_FIELD: 'VALIDATION_REQUIRED_FIELD',   // Thiếu trường bắt buộc
    VALIDATION_INVALID_FORMAT: 'VALIDATION_INVALID_FORMAT',   // Sai định dạng

    // Lỗi giới hạn request (429)
    RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',              // Vượt quá số lần yêu cầu cho phép

    // Lỗi server (500)
    INTERNAL_ERROR: 'INTERNAL_ERROR',                        // Lỗi server chung
    DATABASE_ERROR: 'DATABASE_ERROR',                        // Lỗi database
    NETWORK_ERROR: 'NETWORK_ERROR',                          // Lỗi mạng

    // Lỗi tính năng đặc biệt (400)
    FEATURE_DISABLED: 'FEATURE_DISABLED',                    // Tính năng bị tắt
    FEATURE_MAINTENANCE: 'FEATURE_MAINTENANCE',              // Tính năng đang bảo trì

    // Lỗi file (400)
    FILE_TOO_LARGE: 'FILE_TOO_LARGE',                       // File quá lớn
    FILE_INVALID_TYPE: 'FILE_INVALID_TYPE',                 // Loại file không hợp lệ
    FILE_UPLOAD_FAILED: 'FILE_UPLOAD_FAILED',               // Upload file thất bại

    // Lỗi khóa học (400, 404, 409)
    COURSE_NOT_FOUND: 'COURSE_NOT_FOUND',                   // Không tìm thấy khóa học
    COURSE_NOT_PUBLISHED: 'COURSE_NOT_PUBLISHED',           // Khóa học chưa được xuất bản
    COURSE_INCOMPLETE: 'COURSE_INCOMPLETE',                 // Khóa học chưa đầy đủ để xuất bản
    COURSE_HAS_ENROLLMENTS: 'COURSE_HAS_ENROLLMENTS',       // Khóa học đã có học viên đăng ký
    COURSE_ALREADY_COMPLETED: 'COURSE_ALREADY_COMPLETED',   // Khóa học đã hoàn thành
    ALREADY_ENROLLED: 'ALREADY_ENROLLED',                   // Đã đăng ký khóa học
    NOT_ENROLLED: 'NOT_ENROLLED',                           // Chưa đăng ký khóa học

    // Lỗi bài học (400, 404)
    LESSON_NOT_FOUND: 'LESSON_NOT_FOUND',                   // Không tìm thấy bài học
    LESSON_LOCKED: 'LESSON_LOCKED',                         // Bài học bị khóa
    LESSON_ALREADY_COMPLETED: 'LESSON_ALREADY_COMPLETED',   // Bài học đã hoàn thành

    // Lỗi module (400, 404)
    MODULE_NOT_FOUND: 'MODULE_NOT_FOUND',                   // Không tìm thấy module
    MODULE_LOCKED: 'MODULE_LOCKED',                         // Module bị khóa

    // Lỗi tiến độ học tập (400)
    PROGRESS_INVALID: 'PROGRESS_INVALID',                   // Tiến độ không hợp lệ
    PROGRESS_NOT_FOUND: 'PROGRESS_NOT_FOUND',               // Không tìm thấy tiến độ

    // Lỗi social (403, 404, 409)
    FRIENDSHIP_EXISTS: 'FRIENDSHIP_EXISTS',                 // Đã kết bạn
    FRIENDSHIP_NOT_FOUND: 'FRIENDSHIP_NOT_FOUND',           // Không tìm thấy quan hệ bạn bè
    CANNOT_FOLLOW_SELF: 'CANNOT_FOLLOW_SELF',              // Không thể follow chính mình
    ALREADY_FOLLOWING: 'ALREADY_FOLLOWING',                // Đã follow
    NOT_FOLLOWING: 'NOT_FOLLOWING',                        // Chưa follow

    // Lỗi nhóm học tập (403, 404, 409)
    GROUP_NOT_FOUND: 'GROUP_NOT_FOUND',                     // Không tìm thấy nhóm
    GROUP_FULL: 'GROUP_FULL',                              // Nhóm đã đầy
    ALREADY_IN_GROUP: 'ALREADY_IN_GROUP',                  // Đã ở trong nhóm
    NOT_IN_GROUP: 'NOT_IN_GROUP',                          // Không ở trong nhóm
    NOT_GROUP_ADMIN: 'NOT_GROUP_ADMIN',                    // Không phải admin nhóm

    // Lỗi AI và tính năng nâng cao (429, 503)
    AI_SERVICE_UNAVAILABLE: 'AI_SERVICE_UNAVAILABLE',      // Dịch vụ AI không khả dụng
    AI_QUOTA_EXCEEDED: 'AI_QUOTA_EXCEEDED',                // Vượt quá quota AI
    VOICE_PROCESSING_FAILED: 'VOICE_PROCESSING_FAILED',    // Xử lý giọng nói thất bại
};

module.exports = ErrorCodes;