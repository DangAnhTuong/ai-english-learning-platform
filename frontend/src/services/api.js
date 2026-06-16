import axios from 'axios';

// Base URL cho API - có thể lấy từ env hoặc hardcode
// Frontend: port 3000, Backend Node.js: port 3001
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api/v1';

// Tạo axios instance
const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 30000, // 30 seconds
});

// Request interceptor - thêm access token vào header
api.interceptors.request.use(
    (config) => {
        const accessToken = localStorage.getItem('accessToken');
        if (accessToken) {
            config.headers.Authorization = `Bearer ${accessToken}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor - xử lý token refresh tự động
api.interceptors.response.use(
    (response) => {
        return response;
    },
    async (error) => {
        const originalRequest = error.config;

        // Nếu lỗi 403 - tài khoản bị khóa hoặc không có quyền
        if (error.response?.status === 403) {
            const errorCode = error.response?.data?.code;

            // Tài khoản bị khóa/vô hiệu hóa -> logout và redirect
            if (errorCode === 'AUTH_ACCOUNT_DISABLED' ||
                error.response?.data?.error?.includes('khóa') ||
                error.response?.data?.error?.includes('kích hoạt')) {
                localStorage.removeItem('accessToken');
                localStorage.removeItem('refreshToken');
                localStorage.removeItem('user');

                // Lưu thông báo để hiển thị ở trang login
                localStorage.setItem('logoutReason', 'Tài khoản của bạn đã bị khóa hoặc vô hiệu hóa.');

                window.location.href = '/login';
                return Promise.reject(error);
            }
        }

        // Nếu lỗi 401 và chưa retry
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                const refreshToken = localStorage.getItem('refreshToken');
                if (!refreshToken) {
                    // Không có refresh token -> logout
                    localStorage.removeItem('accessToken');
                    localStorage.removeItem('refreshToken');
                    localStorage.removeItem('user');
                    window.location.href = '/login';
                    return Promise.reject(error);
                }

                // Gọi API refresh token
                const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
                    refreshToken: refreshToken,
                });

                const { accessToken: newAccessToken, refreshToken: newRefreshToken } = response.data.data;

                // Lưu tokens mới
                localStorage.setItem('accessToken', newAccessToken);
                if (newRefreshToken) {
                    localStorage.setItem('refreshToken', newRefreshToken);
                }

                // Retry request với token mới
                originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
                return api(originalRequest);
            } catch (refreshError) {
                // Refresh token hết hạn -> logout
                localStorage.removeItem('accessToken');
                localStorage.removeItem('refreshToken');
                localStorage.removeItem('user');
                window.location.href = '/login';
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);

export default api;
