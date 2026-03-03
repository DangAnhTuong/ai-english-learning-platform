import api from './api';
import { courseService } from './courseService';
import { orderService } from './orderService';

/**
 * Admin Service
 * Xử lý tất cả các API calls cho admin panel
 * Sử dụng lại courseService và conversationService khi có thể
 */

export const adminService = {
  // ========== COURSE MANAGEMENT ==========
  // Sử dụng lại courseService
  ...courseService,

  // ========== CONVERSATION MANAGEMENT ==========
  /**
   * Lấy danh sách conversations
   */
  async getConversations(filters = {}, pagination = {}) {
    const params = {
      ...filters,
      page: pagination.page || 1,
      limit: pagination.limit || 10,
      sortBy: pagination.sortBy || 'createdAt',
      sortOrder: pagination.sortOrder || 'desc',
      _t: Date.now(), // Cache buster - force fresh data
    };

    // Remove empty values
    Object.keys(params).forEach(key => {
      if (params[key] === '' || params[key] === null || params[key] === undefined) {
        delete params[key];
      }
    });

    const response = await api.get('/conversations', { params });
    return response.data;
  },

  /**
   * Lấy conversation theo ID
   */
  async getConversationById(id) {
    const response = await api.get(`/conversations/${id}`);
    return response.data;
  },

  /**
   * Tạo conversation mới
   */
  async createConversation(data) {
    const response = await api.post('/conversations', data);
    return response.data;
  },

  /**
   * Cập nhật conversation
   */
  async updateConversation(id, data) {
    const response = await api.put(`/conversations/${id}`, data);
    return response.data;
  },

  /**
   * Xóa conversation (soft delete)
   */
  async deleteConversation(id) {
    const response = await api.delete(`/conversations/${id}`);
    return response.data;
  },

  /**
   * Xóa vĩnh viễn conversation (admin only)
   */
  async permanentDeleteConversation(id) {
    const response = await api.delete(`/conversations/${id}/permanent`);
    return response.data;
  },

  /**
   * Khôi phục conversation đã xóa
   */
  async restoreConversation(id) {
    const response = await api.post(`/conversations/${id}/restore`);
    return response.data;
  },

  /**
   * Lấy conversation statistics
   */
  async getConversationStats() {
    const response = await api.get('/conversations/stats');
    return response.data;
  },

  /**
   * Lấy danh sách topics
   */
  async getConversationTopics() {
    const response = await api.get('/conversations/topics');
    return response.data;
  },

  async getConversationTopicsAdmin(includeInactive = true) {
    const response = await api.get('/conversations/topics/admin', {
      params: { includeInactive },
    });
    return response.data;
  },

  async createConversationTopic(payload) {
    const response = await api.post('/conversations/topics', payload);
    return response.data;
  },

  async updateConversationTopic(topicId, payload) {
    const response = await api.put(`/conversations/topics/${topicId}`, payload);
    return response.data;
  },

  async deleteConversationTopic(topicId) {
    const response = await api.delete(`/conversations/topics/${topicId}`);
    return response.data;
  },

  /**
   * Lấy danh sách levels từ conversation endpoint (legacy)
   */
  async getConversationLevels() {
    const response = await api.get('/conversations/levels');
    return response.data;
  },

  /**
   * Lấy cấu hình conversation
   */
  async getConversationConfig() {
    const response = await api.get('/conversations/config');
    return response.data;
  },

  /**
   * Generate audio cho conversation
   */
  async generateConversationAudio(conversationId, voiceSettings = null, useQueue = true) {
    const response = await api.post(`/conversations/${conversationId}/generate-audio`, {
      voiceSettings,
      useQueue
    });
    return response.data;
  },

  /**
   * Lấy trạng thái audio generation
   */
  async getConversationAudioStatus(conversationId) {
    const response = await api.get(`/conversations/${conversationId}/audio-status`);
    return response.data;
  },

  /**
   * Lấy danh sách voices có sẵn
   */
  async getAvailableVoices() {
    const response = await api.get('/conversations/voices');
    return response.data;
  },

  // ========== LEVEL MANAGEMENT ==========
  /**
   * Lấy danh sách levels
   */
  async getLevels(filters = {}, pagination = {}) {
    const params = {
      ...filters,
      page: pagination.page || 1,
      limit: pagination.limit || 100,
      sortBy: pagination.sortBy || 'order',
      sortOrder: pagination.sortOrder || 'asc',
    };

    Object.keys(params).forEach(key => {
      if (params[key] === '' || params[key] === null || params[key] === undefined) {
        delete params[key];
      }
    });

    const response = await api.get('/levels', { params });
    return response.data;
  },

  /**
   * Lấy level theo ID
   */
  async getLevelById(id) {
    const response = await api.get(`/levels/${id}`);
    return response.data;
  },

  /**
   * Tạo level mới
   */
  async createLevel(data) {
    const response = await api.post('/levels', data);
    return response.data;
  },

  /**
   * Cập nhật level
   */
  async updateLevel(id, data) {
    const response = await api.put(`/levels/${id}`, data);
    return response.data;
  },

  /**
   * Xóa level (soft delete)
   */
  async deleteLevel(id) {
    const response = await api.delete(`/levels/${id}`);
    return response.data;
  },

  /**
   * Tìm kiếm conversations
   */
  async searchConversations(keyword, filters = {}) {
    const params = {
      q: keyword,
      ...filters,
    };

    const response = await api.get('/conversations/search', { params });
    return response.data;
  },

  // ========== USER MANAGEMENT ==========
  /**
   * Lấy danh sách users với filter và pagination
   */
  async getUsers(filters = {}, pagination = {}) {
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

    // Convert array to comma-separated string for roles
    if (params.roles && Array.isArray(params.roles)) {
      params.roles = params.roles.join(',');
    }

    const response = await api.get('/admin/users', { params });
    return response.data;
  },

  /**
   * Lấy user theo ID
   */
  async getUserById(userId) {
    const response = await api.get(`/admin/users/${userId}`);
    return response.data;
  },

  /**
   * Tạo user mới
   */
  async createUser(userData) {
    const response = await api.post('/admin/users', userData);
    return response.data;
  },

  /**
   * Cập nhật user
   */
  async updateUser(userId, userData) {
    const response = await api.put(`/admin/users/${userId}`, userData);
    return response.data;
  },

  /**
   * Xóa user
   */
  async deleteUser(userId) {
    const response = await api.delete(`/admin/users/${userId}`);
    return response.data;
  },

  /**
   * Ban user
   */
  async banUser(userId) {
    const response = await api.post(`/admin/users/${userId}/ban`);
    return response.data;
  },

  /**
   * Unban user
   */
  async unbanUser(userId) {
    const response = await api.post(`/admin/users/${userId}/unban`);
    return response.data;
  },

  /**
   * Cập nhật roles của user
   */
  async updateUserRoles(userId, roles) {
    const response = await api.put(`/admin/users/${userId}/roles`, { roles });
    return response.data;
  },

  /**
   * Lấy user statistics
   */
  async getUserStats() {
    const response = await api.get('/admin/users/stats');
    return response.data;
  },

  // ========== ORDER MANAGEMENT ==========
  /**
   * Lấy danh sách orders (Admin)
   */
  async getOrders(filters = {}, pagination = {}) {
    return orderService.getOrders(filters, pagination);
  },

  /**
   * Lấy order theo ID
   */
  async getOrderById(orderId) {
    return orderService.getOrderById(orderId);
  },

  /**
   * Cập nhật trạng thái order
   */
  async updateOrderStatus(orderId, status, transactionId = null) {
    return orderService.updateOrderStatus(orderId, status, transactionId);
  },

  /**
   * Xác nhận thanh toán
   */
  async verifyPayment(orderId, transactionId = null) {
    return orderService.verifyPayment(orderId, transactionId);
  },

  /**
   * Lấy thống kê orders
   */
  async getOrderStats(filters = {}) {
    return orderService.getOrderStats(filters);
  },

  // ========== VOCABULARY MANAGEMENT ==========
  /**
   * Lấy danh sách vocabularies
   */
  async getVocabularies(filters = {}, pagination = {}) {
    const params = {
      ...filters,
      page: pagination.page || 1,
      limit: pagination.limit || 20,
      sortBy: pagination.sortBy || 'createdAt',
      sortOrder: pagination.sortOrder || 'desc',
    };

    // Remove empty values
    Object.keys(params).forEach(key => {
      if (params[key] === '' || params[key] === null || params[key] === undefined) {
        delete params[key];
      }
    });

    const response = await api.get('/vocabulary', { params });
    return response.data;
  },

  /**
   * Lấy vocabulary theo ID
   */
  async getVocabularyById(id) {
    const response = await api.get(`/vocabulary/${id}`);
    return response.data;
  },

  /**
   * Tạo vocabulary mới
   */
  async createVocabulary(data) {
    const response = await api.post('/vocabulary', data);
    return response.data;
  },

  /**
   * Cập nhật vocabulary
   */
  async updateVocabulary(id, data) {
    const response = await api.put(`/vocabulary/${id}`, data);
    return response.data;
  },

  /**
   * Xóa vocabulary (soft delete)
   */
  async deleteVocabulary(id) {
    const response = await api.delete(`/vocabulary/${id}`);
    return response.data;
  },

  /**
   * Lấy danh sách word types
   */
  async getWordTypes() {
    const response = await api.get('/vocabulary/types');
    return response.data;
  },

  /**
   * Lấy danh sách levels
   */
  async getVocabularyLevels() {
    const response = await api.get('/vocabulary/levels');
    return response.data;
  },

  /**
   * Tìm kiếm vocabularies
   */
  async searchVocabularies(keyword, filters = {}) {
    const params = {
      q: keyword,
      ...filters,
    };

    const response = await api.get('/vocabulary/search', { params });
    return response.data;
  },

  /**
   * Lấy vocabulary statistics
   */
  async getVocabularyStats() {
    const response = await api.get('/vocabulary/stats');
    return response.data;
  },

  // ==================== ADMIN DASHBOARD ====================

  /**
   * Lấy thống kê dashboard
   */
  async getDashboardStats() {
    const response = await api.get('/admin/dashboard');
    return response.data;
  },

  // ==================== TEACHER MANAGEMENT ====================

  /**
   * Lấy thống kê giáo viên
   */
  async getTeacherStats() {
    const response = await api.get('/admin/teachers/stats');
    return response.data;
  },

  /**
   * Lấy danh sách giáo viên chờ duyệt
   */
  async getPendingTeachers() {
    const response = await api.get('/admin/teachers/pending');
    return response.data;
  },

  /**
   * Lấy hồ sơ chi tiết giáo viên
   */
  async getTeacherProfile(teacherId) {
    const response = await api.get(`/admin/teachers/${teacherId}/profile`);
    return response.data;
  },

  /**
   * Duyệt giáo viên
   */
  async approveTeacher(teacherId) {
    const response = await api.post(`/admin/teachers/${teacherId}/approve`);
    return response.data;
  },

  /**
   * Từ chối giáo viên
   */
  async rejectTeacher(teacherId, reason) {
    const response = await api.post(`/admin/teachers/${teacherId}/reject`, { reason });
    return response.data;
  },

  // ==================== STUDENT MANAGEMENT ====================

  /**
   * Lấy thống kê học viên
   */
  async getStudentStats() {
    const response = await api.get('/admin/students/stats');
    return response.data;
  },

  /**
   * Lấy hồ sơ chi tiết học viên
   */
  async getStudentProfile(studentId) {
    const response = await api.get(`/admin/students/${studentId}/profile`);
    return response.data;
  },

  /**
   * Cập nhật level học viên
   */
  async updateStudentLevel(studentId, level) {
    const response = await api.put(`/admin/students/${studentId}/level`, { level });
    return response.data;
  },

  /**
   * Cập nhật gói học cho học viên
   */
  async updateStudentSubscription(studentId, subscriptionData) {
    const response = await api.put(`/admin/students/${studentId}/subscription`, subscriptionData);
    return response.data;
  },
};

export default adminService;
