import api from './api';

/**
 * Profile Service
 * Xử lý tất cả các API calls liên quan đến hồ sơ cá nhân
 */

export const profileService = {
    /**
     * Lấy thông tin profile đầy đủ
     */
    async getFullProfile() {
        const response = await api.get('/profile');
        return response.data;
    },

    /**
     * Cập nhật thông tin cá nhân
     * @param {Object} data - { name, phone, dateOfBirth, gender, bio, etc. }
     */
    async updateProfile(data) {
        const response = await api.put('/profile', data);
        return response.data;
    },

    /**
     * Upload ảnh đại diện
     * @param {File} file - File ảnh
     */
    async uploadAvatar(file) {
        const formData = new FormData();
        formData.append('avatar', file);

        const response = await api.post('/profile/avatar', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
        return response.data;
    },

    /**
     * Cập nhật learning profile
     * @param {Object} data - { englishLevel, targetLevel, learningGoals, etc. }
     */
    async updateLearningProfile(data) {
        const response = await api.put('/profile/learning', data);
        return response.data;
    },

    /**
     * Lấy tiến độ học tập
     */
    async getLearningProgress() {
        const response = await api.get('/profile/progress');
        return response.data;
    },

    /**
     * Lấy lịch sử học tập
     * @param {Object} params - { page, limit }
     */
    async getLearningHistory(params = {}) {
        const response = await api.get('/profile/history', { params });
        return response.data;
    },

    /**
     * Đổi mật khẩu
     * @param {string} currentPassword - Mật khẩu hiện tại
     * @param {string} newPassword - Mật khẩu mới
     */
    async changePassword(currentPassword, newPassword) {
        const response = await api.post('/profile/change-password', {
            currentPassword,
            newPassword
        });
        return response.data;
    },

    /**
     * Đặt mật khẩu cho tài khoản Google
     * @param {string} password - Mật khẩu mới
     */
    async setPassword(password) {
        const response = await api.post('/profile/set-password', { password });
        return response.data;
    },

    /**
     * Kiểm tra xem tài khoản có mật khẩu không
     */
    async hasPassword() {
        const response = await api.get('/profile/has-password');
        return response.data;
    }
};

export default profileService;
