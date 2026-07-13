import api from './api';

/**
 * Authentication Service
 * Xử lý tất cả các API calls liên quan đến authentication
 */

export const authService = {
  /**
   * Đăng ký tài khoản mới
   */
  async register(data) {
    const response = await api.post('/auth/register', {
      email: data.email,
      password: data.password,
      name: data.name,
      username: data.username || data.email.split('@')[0],
      phone: data.phone,
    });
    return response.data;
  },

  /**
   * Đăng nhập
   */
  async login(email, password) {
    const response = await api.post('/auth/login', {
      email,
      password,
    });
    return response.data;
  },

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken) {
    const response = await api.post('/auth/refresh', {
      refreshToken,
    });
    return response.data;
  },

  /**
   * Đăng xuất
   */
  async logout(refreshToken) {
    try {
      await api.post('/auth/logout', {
        refreshToken,
      });
    } catch (error) {
      // Vẫn xóa local storage dù API call fail
      console.error('Logout API error:', error);
    }
    // Xóa tokens và user data
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
  },

  /**
   * Lấy thông tin user hiện tại
   */
  async getCurrentUser() {
    const response = await api.get('/auth/me');
    return response.data;
  },

  /**
   * Quên mật khẩu - gửi email reset
   */
  async forgotPassword(email) {
    const response = await api.post('/auth/forgot-password', {
      email,
    });
    return response.data;
  },

  /**
   * Reset mật khẩu với token
   */
  async resetPassword(token, newPassword) {
    const response = await api.post('/auth/reset-password', {
      token,
      newPassword,
    });
    return response.data;
  },

  /**
   * Xác thực email
   */
  async verifyEmail(token) {
    const response = await api.post('/auth/verify-email', {
      token,
    });
    return response.data;
  },

  /**
   * Gửi lại email xác thực
   */
  async resendVerification() {
    const response = await api.post('/auth/resend-verification');
    return response.data;
  },

  /**
   * Đổi mật khẩu
   */
  async changePassword(oldPassword, newPassword) {
    const response = await api.post('/auth/change-password', {
      oldPass: oldPassword,
      newPass: newPassword,
    });
    return response.data;
  },

  /**
   * Lấy danh sách sessions đang active
   */
  async getSessions() {
    const response = await api.get('/auth/sessions');
    return response.data;
  },

  /**
   * Đăng xuất khỏi tất cả thiết bị
   */
  async logoutAll() {
    const response = await api.post('/auth/logout-all');
    return response.data;
  },

  /**
   * Kết thúc một session cụ thể
   */
  async terminateSession(sessionId) {
    const response = await api.delete(`/auth/sessions/${sessionId}`);
    return response.data;
  },

  /**
   * Exchange OAuth code for tokens (secure token exchange)
   */
  async exchangeOAuthCode(code) {
    const response = await api.post('/auth/oauth/exchange', { code });
    return response.data;
  },

  /**
   * Verify Google ID token and login
   */
  async loginWithGoogle(token) {
    const response = await api.post('/auth/google/verify', { token });
    return response.data;
  },
};

export default authService;
