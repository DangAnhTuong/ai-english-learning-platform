================================================================================
TÀI LIỆU CHI TIẾT VỀ CÁC TÍNH NĂNG XÁC THỰC (AUTHENTICATION)
Backend Node.js - English Learning System
================================================================================

BASE URL: /api/v1/auth
(hoặc theo cấu hình API_PREFIX trong environment variable)

================================================================================
1. ĐĂNG KÝ TÀI KHOẢN (REGISTER)
================================================================================

Endpoint: POST /api/v1/auth/register

Request Headers:
- Content-Type: application/json

Request Body (JSON):
{
    "email": "string (bắt buộc, định dạng email hợp lệ)",
    "password": "string (bắt buộc, tối thiểu 6 ký tự, phải có chữ hoa, chữ thường và số)",
    "name": "string (bắt buộc, từ 2-50 ký tự)",
    "username": "string (bắt buộc, từ 3-30 ký tự, chỉ chứa chữ cái, số và dấu gạch dưới)",
    "phone": "string (bắt buộc, từ 10-15 ký tự, chỉ chứa số và ký tự +-() và khoảng trắng)"
}

Ví dụ Request:
{
    "email": "user@example.com",
    "password": "Password123",
    "name": "Nguyễn Văn A",
    "username": "nguyenvana",
    "phone": "0123456789"
}

Response Thành Công (201 Created):
{
    "user": {
        "_id": "ObjectId",
        "email": "user@example.com",
        "name": "Nguyễn Văn A",
        "username": "nguyenvana",
        "phone": "0123456789",
        "roles": ["student"],
        "status": "pending",
        "tokenVersion": 0,
        "isEmailVerified": false,
        "emailVerificationToken": "string (token để xác thực email)",
        "emailVerificationExpires": "ISO Date",
        "authProvider": "local",
        "failedLoginAttempts": 0,
        "lastActiveAt": "ISO Date hoặc null",
        "lastLoginAt": "ISO Date hoặc null",
        "totalLogins": 0,
        "profileId": "ObjectId hoặc null",
        "learningProfileId": "ObjectId hoặc null",
        "progressId": "ObjectId hoặc null",
        "notificationSettingsId": "ObjectId hoặc null",
        "activeSubscriptionId": "ObjectId hoặc null",
        "createdAt": "ISO Date",
        "updatedAt": "ISO Date"
    },
    "accessToken": "JWT access token string",
    "refreshToken": "JWT refresh token string"
}

Response Lỗi (409 Conflict - Email đã tồn tại):
{
    "success": false,
    "error": "Email đã được đăng ký",
    "code": "409"
}

Response Lỗi (409 Conflict - Username đã tồn tại):
{
    "success": false,
    "error": "Tên người dùng đã được sử dụng",
    "code": "409"
}

Response Lỗi (409 Conflict - Phone đã tồn tại):
{
    "success": false,
    "error": "Số điện thoại đã được đăng ký",
    "code": "409"
}

Response Lỗi (400 Bad Request - Validation):
{
    "success": false,
    "error": "Chi tiết lỗi validation",
    "code": "VALIDATION_ERROR"
}

Lưu ý:
- Sau khi đăng ký thành công, hệ thống sẽ gửi email xác thực đến địa chỉ email đã đăng ký
- Token xác thực email có thời hạn 24 giờ
- Tài khoản mới có status là "pending" cho đến khi email được xác thực
- Rate limiting: Giới hạn số lần đăng ký (xem createAccountLimiter)

================================================================================
2. ĐĂNG NHẬP (LOGIN)
================================================================================

Endpoint: POST /api/v1/auth/login

Request Headers:
- Content-Type: application/json

Request Body (JSON):
{
    "email": "string (bắt buộc, định dạng email hợp lệ)",
    "password": "string (bắt buộc)"
}

Ví dụ Request:
{
    "email": "user@example.com",
    "password": "Password123"
}

Response Thành Công (200 OK):
{
    "user": {
        "_id": "ObjectId",
        "email": "user@example.com",
        "name": "Nguyễn Văn A",
        "username": "nguyenvana",
        "phone": "0123456789",
        "roles": ["student"],
        "status": "active",
        "tokenVersion": 0,
        "isEmailVerified": true,
        "authProvider": "local",
        "failedLoginAttempts": 0,
        "lastActiveAt": "ISO Date hoặc null",
        "lastLoginAt": "ISO Date",
        "totalLogins": 1,
        "profileId": "ObjectId hoặc null",
        "learningProfileId": "ObjectId hoặc null",
        "progressId": "ObjectId hoặc null",
        "notificationSettingsId": "ObjectId hoặc null",
        "activeSubscriptionId": "ObjectId hoặc null",
        "createdAt": "ISO Date",
        "updatedAt": "ISO Date"
    },
    "accessToken": "JWT access token string",
    "refreshToken": "JWT refresh token string"
}

Response Lỗi (401 Unauthorized - Sai thông tin đăng nhập):
{
    "success": false,
    "error": "Email hoặc mật khẩu không đúng",
    "code": "INVALID_CREDENTIALS"
}

Response Lỗi (423 Locked - Tài khoản bị khóa):
{
    "success": false,
    "error": "Tài khoản tạm thời bị khóa. Vui lòng thử lại sau.",
    "code": "ACCOUNT_LOCKED"
}

Response Lỗi (400 Bad Request - Validation):
{
    "success": false,
    "error": "Chi tiết lỗi validation",
    "code": "VALIDATION_ERROR"
}

Bảo mật:
- Sau 5 lần đăng nhập sai, tài khoản sẽ bị khóa trong 30 phút
- Mỗi lần đăng nhập sai sẽ tăng số lần thử (failedLoginAttempts)
- Đăng nhập thành công sẽ reset số lần thử sai
- Hệ thống log tất cả các lần đăng nhập (thành công và thất bại)
- Rate limiting: Giới hạn số lần đăng nhập (xem loginLimiter)

================================================================================
3. ĐỔI MẬT KHẨU (CHANGE PASSWORD)
================================================================================

Endpoint: POST /api/v1/auth/change-password

Request Headers:
- Content-Type: application/json
- Authorization: Bearer {accessToken} (BẮT BUỘC - phải đăng nhập)

Request Body (JSON):
{
    "oldPass": "string (bắt buộc - mật khẩu hiện tại)",
    "newPass": "string (bắt buộc, tối thiểu 6 ký tự, phải có chữ hoa, chữ thường và số, không được giống oldPass)"
}

Ví dụ Request:
{
    "oldPass": "Password123",
    "newPass": "NewPassword456"
}

Response Thành Công (200 OK):
{
    "success": true,
    "message": "Đổi mật khẩu thành công"
}

Response Lỗi (400 Bad Request - Mật khẩu cũ sai):
{
    "success": false,
    "error": "Mật khẩu cũ không đúng",
    "code": "INVALID_OLD_PASSWORD"
}

Response Lỗi (400 Bad Request - Validation):
{
    "success": false,
    "error": "Chi tiết lỗi validation",
    "code": "VALIDATION_ERROR"
}

Response Lỗi (401 Unauthorized - Chưa đăng nhập):
{
    "success": false,
    "error": "Unauthorized",
    "code": "UNAUTHORIZED"
}

Lưu ý:
- Sau khi đổi mật khẩu thành công:
  + Token version sẽ được tăng lên (vô hiệu hóa tất cả các token cũ)
  + Tất cả refresh tokens sẽ bị xóa (yêu cầu đăng nhập lại trên tất cả thiết bị)
  + lastPasswordChange sẽ được cập nhật
- Hệ thống log tất cả các lần đổi mật khẩu (thành công và thất bại)
- Mật khẩu mới phải khác mật khẩu cũ

================================================================================
4. QUÊN MẬT KHẨU (FORGOT PASSWORD)
================================================================================

Endpoint: POST /api/v1/auth/forgot-password

Request Headers:
- Content-Type: application/json

Request Body (JSON):
{
    "email": "string (bắt buộc, định dạng email hợp lệ)"
}

Ví dụ Request:
{
    "email": "user@example.com"
}

Response Thành Công (200 OK):
{
    "success": true,
    "message": "Nếu email tồn tại trong hệ thống, bạn sẽ nhận được hướng dẫn đặt lại mật khẩu."
}

Lưu ý:
- Hệ thống luôn trả về thành công (để bảo mật, không tiết lộ email có tồn tại hay không)
- Nếu email tồn tại, hệ thống sẽ gửi email chứa token reset mật khẩu
- Token reset mật khẩu có thời hạn 1 giờ (3600000 milliseconds)
- Rate limiting: Giới hạn số lần yêu cầu (xem forgotPasswordLimiter)

================================================================================
5. ĐẶT LẠI MẬT KHẨU (RESET PASSWORD)
================================================================================

Endpoint: POST /api/v1/auth/reset-password

Request Headers:
- Content-Type: application/json

Request Body (JSON):
{
    "token": "string (bắt buộc - token từ email reset password)",
    "newPassword": "string (bắt buộc, tối thiểu 6 ký tự, phải có chữ hoa, chữ thường và số)"
}

Ví dụ Request:
{
    "token": "abc123def456...",
    "newPassword": "NewPassword789"
}

Response Thành Công (200 OK):
{
    "success": true,
    "message": "Mật khẩu đã được đặt lại thành công."
}

Response Lỗi (400 Bad Request - Token không hợp lệ hoặc hết hạn):
{
    "success": false,
    "error": "Token không hợp lệ hoặc đã hết hạn",
    "code": "INVALID_RESET_TOKEN"
}

Response Lỗi (400 Bad Request - Validation):
{
    "success": false,
    "error": "Chi tiết lỗi validation",
    "code": "VALIDATION_ERROR"
}

Lưu ý:
- Token reset password chỉ có hiệu lực trong 1 giờ
- Sau khi đặt lại mật khẩu thành công:
  + Token version sẽ được tăng lên (vô hiệu hóa tất cả các token cũ)
  + Tất cả refresh tokens sẽ bị xóa (yêu cầu đăng nhập lại trên tất cả thiết bị)
  + lastPasswordChange sẽ được cập nhật
  + resetPasswordToken và resetPasswordExpires sẽ bị xóa
- Hệ thống log tất cả các lần đặt lại mật khẩu

================================================================================
6. XÁC THỰC EMAIL (VERIFY EMAIL)
================================================================================

Endpoint: POST /api/v1/auth/verify-email

Request Headers:
- Content-Type: application/json

Request Body (JSON):
{
    "token": "string (bắt buộc - token từ email xác thực)"
}

Ví dụ Request:
{
    "token": "abc123def456..."
}

Response Thành Công (200 OK):
{
    "success": true,
    "message": "Email đã được xác thực thành công."
}

Response Lỗi (400 Bad Request - Token không hợp lệ hoặc hết hạn):
{
    "success": false,
    "error": "Token xác thực không hợp lệ hoặc đã hết hạn",
    "code": "INVALID_VERIFICATION_TOKEN"
}

Lưu ý:
- Token xác thực email có thời hạn 24 giờ
- Sau khi xác thực thành công:
  + isEmailVerified = true
  + status = "active"
  + emailVerificationToken và emailVerificationExpires sẽ bị xóa

================================================================================
7. GỬI LẠI EMAIL XÁC THỰC (RESEND VERIFICATION)
================================================================================

Endpoint: POST /api/v1/auth/resend-verification

Request Headers:
- Content-Type: application/json
- Authorization: Bearer {accessToken} (BẮT BUỘC - phải đăng nhập)

Request Body: Không cần (hoặc empty JSON {})

Response Thành Công (200 OK):
{
    "success": true,
    "message": "Email xác thực đã được gửi lại."
}

Response Lỗi (400 Bad Request - Email đã được xác thực):
{
    "success": false,
    "error": "Email đã được xác thực",
    "code": "EMAIL_ALREADY_VERIFIED"
}

Response Lỗi (401 Unauthorized - Chưa đăng nhập):
{
    "success": false,
    "error": "Unauthorized",
    "code": "UNAUTHORIZED"
}

Lưu ý:
- Chỉ có thể gửi lại email xác thực nếu email chưa được xác thực
- Token mới sẽ được tạo với thời hạn 24 giờ

================================================================================
8. LÀM MỚI TOKEN (REFRESH TOKEN)
================================================================================

Endpoint: POST /api/v1/auth/refresh

Request Headers:
- Content-Type: application/json

Request Body (JSON):
{
    "refreshToken": "string (bắt buộc - refresh token hiện tại)"
}

Ví dụ Request:
{
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}

Response Thành Công (200 OK):
{
    "success": true,
    "data": {
        "user": {
            "_id": "ObjectId",
            "email": "user@example.com",
            "name": "Nguyễn Văn A",
            "username": "nguyenvana",
            "phone": "0123456789",
            "roles": ["student"],
            "status": "active",
            "tokenVersion": 0,
            "isEmailVerified": true,
            "authProvider": "local",
            "failedLoginAttempts": 0,
            "lastActiveAt": "ISO Date hoặc null",
            "lastLoginAt": "ISO Date hoặc null",
            "totalLogins": 0,
            "profileId": "ObjectId hoặc null",
            "learningProfileId": "ObjectId hoặc null",
            "progressId": "ObjectId hoặc null",
            "notificationSettingsId": "ObjectId hoặc null",
            "activeSubscriptionId": "ObjectId hoặc null",
            "createdAt": "ISO Date",
            "updatedAt": "ISO Date"
        },
        "accessToken": "JWT access token mới",
        "refreshToken": "JWT refresh token mới"
    }
}

Response Lỗi (401 Unauthorized - Token không hợp lệ):
{
    "success": false,
    "error": "Token không hợp lệ",
    "code": "INVALID_REFRESH_TOKEN"
}

Response Lỗi (401 Unauthorized - Token đã hết hạn):
{
    "success": false,
    "error": "Token đã hết hạn hoặc đã được sử dụng",
    "code": "REFRESH_TOKEN_EXPIRED"
}

Lưu ý:
- Refresh token sử dụng cơ chế rotation (token cũ sẽ bị vô hiệu sau khi refresh)
- Refresh token có thời hạn 7 ngày
- Mỗi refresh token có một jti (JWT ID) duy nhất

================================================================================
9. ĐĂNG XUẤT (LOGOUT)
================================================================================

Endpoint: POST /api/v1/auth/logout

Request Headers:
- Content-Type: application/json
- Authorization: Bearer {accessToken} (BẮT BUỘC - phải đăng nhập)

Request Body (JSON):
{
    "refreshToken": "string (bắt buộc - refresh token cần đăng xuất)"
}

Ví dụ Request:
{
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}

Response Thành Công (200 OK):
{
    "success": true,
    "message": "Đăng xuất thành công"
}

Response Lỗi (400 Bad Request - Thiếu refresh token):
{
    "success": false,
    "error": "Refresh token is required",
    "code": "REFRESH_TOKEN_REQUIRED"
}

Response Lỗi (401 Unauthorized - Chưa đăng nhập):
{
    "success": false,
    "error": "Unauthorized",
    "code": "UNAUTHORIZED"
}

Lưu ý:
- Chỉ đăng xuất khỏi thiết bị hiện tại (refresh token được gửi lên)
- Refresh token sẽ bị xóa khỏi danh sách refresh tokens của user

================================================================================
10. ĐĂNG XUẤT TẤT CẢ THIẾT BỊ (LOGOUT ALL)
================================================================================

Endpoint: POST /api/v1/auth/logout-all

Request Headers:
- Content-Type: application/json
- Authorization: Bearer {accessToken} (BẮT BUỘC - phải đăng nhập)

Request Body: Không cần (hoặc empty JSON {})

Response Thành Công (200 OK):
{
    "success": true,
    "message": "Đã đăng xuất khỏi tất cả các thiết bị."
}

Response Lỗi (401 Unauthorized - Chưa đăng nhập):
{
    "success": false,
    "error": "Unauthorized",
    "code": "UNAUTHORIZED"
}

Lưu ý:
- Xóa tất cả refresh tokens của user
- Tăng token version (vô hiệu hóa tất cả access tokens hiện tại)
- Hệ thống log hoạt động này như một hoạt động đáng ngờ (suspicious activity)

================================================================================
11. LẤY THÔNG TIN NGƯỜI DÙNG HIỆN TẠI (ME)
================================================================================

Endpoint: GET /api/v1/auth/me

Request Headers:
- Authorization: Bearer {accessToken} (BẮT BUỘC - phải đăng nhập)

Request Body: Không cần

Response Thành Công (200 OK):
{
    "success": true,
    "data": {
        "user": {
            "_id": "ObjectId",
            "email": "user@example.com",
            "name": "Nguyễn Văn A",
            "username": "nguyenvana",
            "phone": "0123456789",
            "roles": ["student"],
            "status": "active",
            "tokenVersion": 0,
            "isEmailVerified": true,
            "authProvider": "local",
            "failedLoginAttempts": 0,
            "lastActiveAt": "ISO Date hoặc null",
            "lastLoginAt": "ISO Date hoặc null",
            "totalLogins": 0,
            "profileId": "ObjectId hoặc null",
            "learningProfileId": "ObjectId hoặc null",
            "progressId": "ObjectId hoặc null",
            "notificationSettingsId": "ObjectId hoặc null",
            "activeSubscriptionId": "ObjectId hoặc null",
            "createdAt": "ISO Date",
            "updatedAt": "ISO Date"
        }
    }
}

Response Lỗi (401 Unauthorized - Chưa đăng nhập):
{
    "success": false,
    "error": "Unauthorized",
    "code": "UNAUTHORIZED"
}

================================================================================
12. DANH SÁCH PHIÊN ĐĂNG NHẬP (LIST SESSIONS)
================================================================================

Endpoint: GET /api/v1/auth/sessions

Request Headers:
- Authorization: Bearer {accessToken} (BẮT BUỘC - phải đăng nhập)

Request Body: Không cần

Response Thành Công (200 OK):
{
    "sessions": [
        {
            "id": "jti của refresh token",
            "createdAt": "ISO Date",
            "expiresAt": "ISO Date"
        },
        ...
    ]
}

Response Lỗi (401 Unauthorized - Chưa đăng nhập):
{
    "success": false,
    "error": "Unauthorized",
    "code": "UNAUTHORIZED"
}

================================================================================
13. KẾT THÚC PHIÊN ĐĂNG NHẬP (TERMINATE SESSION)
================================================================================

Endpoint: DELETE /api/v1/auth/sessions/:sessionId

Request Headers:
- Authorization: Bearer {accessToken} (BẮT BUỘC - phải đăng nhập)

URL Parameters:
- sessionId: string (bắt buộc - jti của refresh token cần kết thúc)

Request Body: Không cần

Response Thành Công (200 OK):
{
    "success": true,
    "message": "Phiên đăng nhập đã được kết thúc."
}

Response Lỗi (401 Unauthorized - Chưa đăng nhập):
{
    "success": false,
    "error": "Unauthorized",
    "code": "UNAUTHORIZED"
}

Ví dụ Request:
DELETE /api/v1/auth/sessions/550e8400-e29b-41d4-a716-446655440000

================================================================================
14. ĐĂNG NHẬP BẰNG GOOGLE OAUTH (GOOGLE AUTH)
================================================================================

Endpoint: GET /api/v1/auth/google

Request Headers: Không cần

Request Body: Không cần

Response: Redirect đến Google OAuth consent screen

Lưu ý:
- Đây là endpoint khởi tạo quá trình đăng nhập Google
- Sau khi người dùng xác thực với Google, họ sẽ được redirect đến callback URL

================================================================================
15. CALLBACK GOOGLE OAUTH (GOOGLE CALLBACK)
================================================================================

Endpoint: GET /api/v1/auth/google/callback

Request Headers: Không cần (được xử lý bởi Passport.js)

Request Body: Không cần

Response: Redirect đến frontend với tokens:
- Thành công: {FRONTEND_URL}/auth/callback?accessToken={token}&refreshToken={token}
- Thất bại: {FRONTEND_URL}/auth/error?message={error_message}

Lưu ý:
- Nếu user đã có tài khoản với Google ID → đăng nhập
- Nếu user đã có tài khoản với email từ Google → liên kết Google account
- Nếu user chưa có tài khoản → tạo tài khoản mới với Google
- Username tự động được tạo từ email + timestamp
- Email tự động được xác thực khi đăng nhập bằng Google

================================================================================
TÓM TẮT CÁC TRƯỜNG DỮ LIỆU QUAN TRỌNG
================================================================================

1. ĐĂNG KÝ (Register):
   - email (string, required, email format)
   - password (string, required, min 6 chars, must have uppercase, lowercase, number)
   - name (string, required, 2-50 chars)
   - username (string, required, 3-30 chars, alphanumeric + underscore only)
   - phone (string, required, 10-15 chars, numbers + +-() and spaces)

2. ĐĂNG NHẬP (Login):
   - email (string, required, email format)
   - password (string, required)

3. ĐỔI MẬT KHẨU (Change Password):
   - oldPass (string, required)
   - newPass (string, required, min 6 chars, must have uppercase, lowercase, number, must be different from oldPass)

4. QUÊN MẬT KHẨU (Forgot Password):
   - email (string, required, email format)

5. ĐẶT LẠI MẬT KHẨU (Reset Password):
   - token (string, required)
   - newPassword (string, required, min 6 chars, must have uppercase, lowercase, number)

6. XÁC THỰC EMAIL (Verify Email):
   - token (string, required)

7. GỬI LẠI XÁC THỰC (Resend Verification):
   - Không cần body (chỉ cần Authorization header)

8. LÀM MỚI TOKEN (Refresh Token):
   - refreshToken (string, required)

9. ĐĂNG XUẤT (Logout):
   - refreshToken (string, required)

10. ĐĂNG XUẤT TẤT CẢ (Logout All):
    - Không cần body (chỉ cần Authorization header)

11. THÔNG TIN NGƯỜI DÙNG (Me):
    - Không cần body (chỉ cần Authorization header)

12. DANH SÁCH PHIÊN (List Sessions):
    - Không cần body (chỉ cần Authorization header)

13. KẾT THÚC PHIÊN (Terminate Session):
    - sessionId trong URL path (string, required)

================================================================================
LƯU Ý QUAN TRỌNG
================================================================================

1. TẤT CẢ CÁC ENDPOINT YÊU CẦU ĐĂNG NHẬP đều cần:
   - Header: Authorization: Bearer {accessToken}
   - Access token được lấy từ response của login/register/refresh

2. VALIDATION:
   - Tất cả các request đều được validate trước khi xử lý
   - Nếu validation fail, sẽ trả về 400 Bad Request với thông tin lỗi chi tiết

3. RATE LIMITING:
   - Register: Giới hạn số lần đăng ký (createAccountLimiter)
   - Login: Giới hạn số lần đăng nhập (loginLimiter)
   - Forgot Password: Giới hạn số lần yêu cầu (forgotPasswordLimiter)

4. BẢO MẬT:
   - Mật khẩu được hash bằng bcrypt
   - JWT tokens với access token và refresh token
   - Token rotation khi refresh
   - Account locking sau 5 lần đăng nhập sai (30 phút)
   - Security logging cho tất cả các hoạt động quan trọng

5. ERROR CODES:
   - 400: Bad Request (validation errors, invalid input)
   - 401: Unauthorized (authentication required, invalid credentials)
   - 404: Not Found (user not found)
   - 409: Conflict (duplicate email/username/phone)
   - 423: Locked (account locked)
   - 500: Internal Server Error

6. RESPONSE FORMAT:
   - Thành công: { success: true, data/message: ... }
   - Thất bại: { success: false, error: "...", code: "..." }

================================================================================
NGÀY TẠO: [1/12/2025]
PHIÊN BẢN: 1.0
================================================================================

