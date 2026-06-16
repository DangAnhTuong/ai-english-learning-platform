import api from './api';

/**
 * Order Service
 * Xử lý tất cả các API calls liên quan đến orders
 */

export const orderService = {
  /**
   * Tạo đơn hàng mới
   * @param {Object} orderData - { package, amount, currency, paymentMethod, transferContent, bankInfo }
   */
  async createOrder(orderData) {
    const response = await api.post('/orders', orderData);
    return response.data;
  },

  /**
   * Lấy danh sách đơn hàng
   * @param {Object} filters - { status, paymentStatus, dateFrom, dateTo, search }
   * @param {Object} pagination - { page, limit, sortBy, sortOrder }
   */
  async getOrders(filters = {}, pagination = {}) {
    const params = {
      ...filters,
      page: pagination.page || 1,
      limit: pagination.limit || 10,
      sortBy: pagination.sortBy || 'createdAt',
      sortOrder: pagination.sortOrder || 'desc',
    };

    // Remove empty values
    Object.keys(params).forEach(key => {
      if (params[key] === '' || params[key] === null || params[key] === undefined) {
        delete params[key];
      }
    });

    const response = await api.get('/orders', { params });
    return response.data;
  },

  /**
   * Lấy đơn hàng theo ID
   * @param {string} orderId - Order ID
   */
  async getOrderById(orderId) {
    const response = await api.get(`/orders/${orderId}`);
    return response.data;
  },

  /**
   * Cập nhật trạng thái đơn hàng (Admin)
   * @param {string} orderId - Order ID
   * @param {string} status - New status (paid, failed, cancelled)
   * @param {string} transactionId - Transaction ID (optional)
   */
  async updateOrderStatus(orderId, status, transactionId = null) {
    const response = await api.put(`/orders/${orderId}/status`, {
      status,
      transactionId,
    });
    return response.data;
  },

  /**
   * Xác nhận thanh toán (Admin)
   * @param {string} orderId - Order ID
   * @param {string} transactionId - Transaction ID
   */
  async verifyPayment(orderId, transactionId = null) {
    const response = await api.post(`/orders/${orderId}/verify`, {
      transactionId,
    });
    return response.data;
  },

  /**
   * Lấy thống kê đơn hàng (Admin)
   * @param {Object} filters - { dateFrom, dateTo }
   */
  async getOrderStats(filters = {}) {
    const params = {};
    if (filters.dateFrom) params.dateFrom = filters.dateFrom;
    if (filters.dateTo) params.dateTo = filters.dateTo;

    const response = await api.get('/orders/stats', { params });
    return response.data;
  },
};

export default orderService;
