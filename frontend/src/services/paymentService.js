import api from './api';

export const paymentService = {
  /**
   * Lấy danh sách gói cước VIP
   */
  async getPlans() {
    const res = await api.get('/payment/plans');
    return res.data;
  },

  /**
   * Lấy trạng thái VIP của người dùng hiện tại
   */
  async getMyStatus() {
    const res = await api.get('/payment/my-status');
    return res.data;
  },

  /**
   * Tạo đơn hàng thanh toán VietQR
   * @param {Object} data { planId, courseId }
   */
  async createOrder(data) {
    const res = await api.post('/payment/create-order', data);
    return res.data;
  },

  /**
   * Kiểm tra trạng thái đơn hàng (Polling)
   * @param {string} orderCode Mã đơn hàng (e.g. ENG12345)
   */
  async checkOrderStatus(orderCode) {
    const res = await api.get(`/payment/check-status/${orderCode}`);
    return res.data;
  },

  /**
   * Giả lập thanh toán tức thì (Demo Mode / Tuyển dụng test)
   * @param {string} orderCode Mã đơn hàng
   */
  async simulatePayment(orderCode) {
    const res = await api.post(`/payment/simulate/${orderCode}`);
    return res.data;
  }
};

export default paymentService;
