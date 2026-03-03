================================================================================
MANUAL TEST CHECKLIST - PAYMENT & ORDER SYSTEM
================================================================================

CHUẨN BỊ:
1. ✅ Backend đang chạy: cd backend/backend-node && npm start
2. ✅ Frontend đang chạy: npm start
3. ✅ MongoDB đang chạy
4. ✅ Có tài khoản admin: admin@example.com / admin123456
5. ✅ Có tài khoản student: student@example.com / student123456

================================================================================
TEST 1: TẠO ĐƠN HÀNG (USER)
================================================================================
1. Đăng nhập với tài khoản student
2. Vào http://localhost:3000/payment
3. Kiểm tra:
   - [ ] QR code hiển thị
   - [ ] Thông tin gói hiển thị đúng
   - [ ] Thông tin ngân hàng hiển thị
4. Click "Xác nhận đã chuyển khoản"
5. Kiểm tra:
   - [ ] Hiển thị success message
   - [ ] Order được tạo trong database
   - [ ] Order có status = 'pending'

================================================================================
TEST 2: QUẢN LÝ ĐƠN HÀNG (ADMIN)
================================================================================
1. Đăng nhập với tài khoản admin
2. Vào http://localhost:3000/admin/orders
3. Kiểm tra:
   - [ ] Danh sách orders hiển thị
   - [ ] Order mới tạo có status 'pending'
   - [ ] Thông tin order đầy đủ (mã đơn, user, gói, giá, ngày)
4. Click "Duyệt" trên order pending
5. Kiểm tra:
   - [ ] Order status → 'paid'
   - [ ] Subscription được tạo trong database
   - [ ] User có activeSubscriptionId
6. Test Filter:
   - [ ] Filter theo status (paid, pending, failed)
   - [ ] Filter theo date range
   - [ ] Search theo order number
7. Test Export:
   - [ ] Export CSV → File tải xuống
   - [ ] Export PDF → File tải xuống

================================================================================
TEST 3: XEM PROFILE & SUBSCRIPTION (USER)
================================================================================
1. Đăng nhập với tài khoản student (đã có order được duyệt)
2. Vào http://localhost:3000/profile
3. Kiểm tra:
   - [ ] Subscription info hiển thị (plan, days left, expiry date)
   - [ ] Order history hiển thị
   - [ ] Member tier hiển thị đúng
   - [ ] Tier progress hiển thị đúng

================================================================================
TEST 4: API ENDPOINTS (Sử dụng Postman hoặc curl)
================================================================================

1. TẠO ĐƠN HÀNG:
POST http://localhost:3001/api/v1/orders
Headers: Authorization: Bearer {student_token}
Body:
{
  "package": {
    "name": "Gói 1 Tháng",
    "duration": 30,
    "plan": "basic"
  },
  "amount": 199000,
  "currency": "VND",
  "paymentMethod": "bank_transfer"
}
Expected: 201 Created, order với status 'pending'

2. LẤY DANH SÁCH ORDERS:
GET http://localhost:3001/api/v1/orders?page=1&limit=10
Headers: Authorization: Bearer {student_token}
Expected: 200 OK, danh sách orders của user

3. XÁC NHẬN THANH TOÁN (ADMIN):
POST http://localhost:3001/api/v1/orders/{orderId}/verify
Headers: Authorization: Bearer {admin_token}
Body: { "transactionId": "TXN123456" }
Expected: 200 OK, order status = 'paid', subscription created

4. LẤY SUBSCRIPTION HIỆN TẠI:
GET http://localhost:3001/api/v1/subscriptions/active
Headers: Authorization: Bearer {student_token}
Expected: 200 OK, subscription object hoặc null

5. LẤY LỊCH SỬ SUBSCRIPTION:
GET http://localhost:3001/api/v1/subscriptions/history
Headers: Authorization: Bearer {student_token}
Expected: 200 OK, danh sách subscriptions

6. THỐNG KÊ ĐƠN HÀNG (ADMIN):
GET http://localhost:3001/api/v1/orders/stats
Headers: Authorization: Bearer {admin_token}
Expected: 200 OK, stats object

================================================================================
TEST 5: VALIDATION & ERROR HANDLING
================================================================================

1. TẠO ĐƠN HÀNG THIẾU THÔNG TIN:
POST /api/v1/orders
Body: { "amount": 199000 } // Thiếu package
Expected: 422 Validation Error

2. TẠO ĐƠN HÀNG VỚI AMOUNT < 0:
POST /api/v1/orders
Body: { "package": {...}, "amount": -100 }
Expected: 422 Validation Error

3. XEM ORDER CỦA USER KHÁC:
GET /api/v1/orders/{other_user_order_id}
Headers: Authorization: Bearer {student_token}
Expected: 403 Forbidden hoặc 404 Not Found

4. STUDENT VERIFY PAYMENT:
POST /api/v1/orders/{orderId}/verify
Headers: Authorization: Bearer {student_token}
Expected: 403 Forbidden

5. VERIFY ORDER ĐÃ PAID:
POST /api/v1/orders/{paid_order_id}/verify
Headers: Authorization: Bearer {admin_token}
Expected: 400 Bad Request (Order already processed)

================================================================================
TEST 6: EDGE CASES
================================================================================

1. [ ] Tạo 2 orders → Duyệt order 1 → Subscription created
2. [ ] Duyệt order 2 → Subscription extended (nếu còn active) hoặc tạo mới
3. [ ] Hủy order (status = 'failed') → Subscription không được tạo
4. [ ] Subscription expired → Status = 'expired'
5. [ ] Cancel subscription → activeSubscriptionId = null

================================================================================
KẾT QUẢ TEST:
================================================================================
- [ ] Tất cả test cases PASSED
- [ ] Không có lỗi trong console
- [ ] Database data đúng
- [ ] Frontend hiển thị đúng
- [ ] API responses đúng format
