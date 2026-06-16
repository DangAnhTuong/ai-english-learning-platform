import api from './api';

/**
 * Subscription Service
 * Xử lý tất cả các API calls liên quan đến subscriptions
 */

export const subscriptionService = {
  /**
   * Lấy danh sách gói cước (public)
   * @returns {Promise<Object>} { success: true, data: [{ id, name, price, duration, features, ... }] }
   */
  async getPlans() {
    const response = await api.get('/subscriptions/plans');
    return response.data;
  },

  async getPlansAdmin(includeInactive = true) {
    const response = await api.get('/subscriptions/plans', {
      params: { includeInactive },
    });
    return response.data;
  },

  async createPlan(payload) {
    const response = await api.post('/subscriptions/plans', payload);
    return response.data;
  },

  async updatePlan(planId, payload) {
    const response = await api.put(`/subscriptions/plans/${planId}`, payload);
    return response.data;
  },

  async deletePlan(planId) {
    const response = await api.delete(`/subscriptions/plans/${planId}`);
    return response.data;
  },

  /**
   * Tạo subscription mới
   * @param {Object} subscriptionData - { plan, duration, paymentMethod, autoRenew }
   */
  async createSubscription(subscriptionData) {
    const response = await api.post('/subscriptions', subscriptionData);
    return response.data;
  },

  /**
   * Lấy subscription hiện tại
   */
  async getActiveSubscription() {
    const response = await api.get('/subscriptions/active');
    return response.data;
  },

  /**
   * Lấy lịch sử subscription
   */
  async getSubscriptionHistory() {
    const response = await api.get('/subscriptions/history');
    return response.data;
  },

  /**
   * Hủy subscription
   * @param {string} subscriptionId - Subscription ID
   */
  async cancelSubscription(subscriptionId) {
    const response = await api.put(`/subscriptions/${subscriptionId}/cancel`);
    return response.data;
  },

  /**
   * Gia hạn subscription (Admin)
   * @param {string} subscriptionId - Subscription ID
   * @param {number} additionalDays - Số ngày thêm vào
   */
  async extendSubscription(subscriptionId, additionalDays) {
    const response = await api.put(`/subscriptions/${subscriptionId}/extend`, {
      additionalDays,
    });
    return response.data;
  },
};

export default subscriptionService;
