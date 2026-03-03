import api from './api';

/**
 * Course Service
 * Xử lý tất cả các API calls liên quan đến courses
 */

export const courseService = {
  /**
   * Lấy danh sách courses với filter và pagination
   * @param {Object} filters - { category, level, difficulty, enrollmentType, tags, search, status }
   * @param {Object} pagination - { page, limit, sortBy, sortOrder }
   */
  async getCourses(filters = {}, pagination = {}) {
    const params = {
      ...filters,
      page: pagination.page || 1,
      limit: pagination.limit || 12,
      sortBy: pagination.sortBy || 'createdAt',
      sortOrder: pagination.sortOrder || 'desc',
    };

    // Remove empty or invalid values to avoid validation errors
    Object.keys(params).forEach(key => {
      if (params[key] === '' || params[key] === null || params[key] === undefined) {
        delete params[key];
      }
    });

    // Convert array to comma-separated string for tags
    if (params.tags && Array.isArray(params.tags)) {
      params.tags = params.tags.join(',');
    }

    const response = await api.get('/courses', { params });
    return response.data;
  },

  /**
   * Lấy course theo ID
   * @param {string} courseId - Course ID
   */
  async getCourseById(courseId) {
    const response = await api.get(`/courses/${courseId}`);
    return response.data;
  },

  /**
   * Lấy featured courses (recommended)
   */
  async getFeaturedCourses() {
    const response = await api.get('/courses/featured');
    return response.data;
  },

  /**
   * Lấy danh sách categories với statistics
   */
  async getCategories() {
    const response = await api.get('/courses/categories');
    return response.data;
  },

  /**
   * Đăng ký vào course
   * @param {string} courseId - Course ID
   */
  async enrollInCourse(courseId) {
    const response = await api.post(`/courses/${courseId}/enroll`);
    return response.data;
  },

  /**
   * Hủy đăng ký course
   * @param {string} courseId - Course ID
   */
  async unenrollFromCourse(courseId) {
    const response = await api.delete(`/courses/${courseId}/enroll`);
    return response.data;
  },

  /**
   * Lấy danh sách courses user đã đăng ký
   */
  async getEnrolledCourses() {
    const response = await api.get('/courses/user/enrolled');
    return response.data;
  },

  /**
   * Lấy danh sách courses user đã tạo (cho teacher)
   */
  async getMyCreatedCourses() {
    const response = await api.get('/courses/user/created');
    return response.data;
  },

  /**
   * Tạo course mới (cho teacher/admin)
   * @param {Object} courseData - Course data
   */
  async createCourse(courseData) {
    const response = await api.post('/courses', courseData);
    return response.data;
  },

  /**
   * Cập nhật course (cho teacher/admin)
   * @param {string} courseId - Course ID
   * @param {Object} courseData - Updated course data
   */
  async updateCourse(courseId, courseData) {
    const response = await api.put(`/courses/${courseId}`, courseData);
    return response.data;
  },

  /**
   * Lấy analytics của course (cho teacher/admin)
   * @param {string} courseId - Course ID
   */
  async getCourseAnalytics(courseId) {
    const response = await api.get(`/courses/${courseId}/analytics`);
    return response.data;
  },

  /**
   * Xuất bản course (cho teacher/admin)
   * @param {string} courseId - Course ID
   */
  async publishCourse(courseId) {
    const response = await api.post(`/courses/${courseId}/publish`);
    return response.data;
  },

  /**
   * Hủy xuất bản course (cho teacher/admin)
   * @param {string} courseId - Course ID
   */
  async unpublishCourse(courseId) {
    const response = await api.post(`/courses/${courseId}/unpublish`);
    return response.data;
  },
};

export default courseService;
