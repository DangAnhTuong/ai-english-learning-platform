import { createSlice } from '@reduxjs/toolkit';

// 1. Tối ưu: Lấy dữ liệu ngay khi khởi tạo để F5 không bị mất login
const userFromStorage = localStorage.getItem('user');
const userParsed = userFromStorage ? JSON.parse(userFromStorage) : null;
const accessToken = localStorage.getItem('accessToken');
const refreshToken = localStorage.getItem('refreshToken');

const initialState = {
  isLogin: !!(userParsed && accessToken), // true nếu có user và token
  user: userParsed,
  accessToken: accessToken,
  refreshToken: refreshToken,
  loading: false,
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    loginSuccess: (state, action) => {
      state.loading = false;
      state.isLogin = true;
      state.user = action.payload.user;
      state.accessToken = action.payload.accessToken;
      state.refreshToken = action.payload.refreshToken;

      // Lưu vào localStorage
      localStorage.setItem('user', JSON.stringify(action.payload.user));
      localStorage.setItem('accessToken', action.payload.accessToken);
      localStorage.setItem('refreshToken', action.payload.refreshToken);
    },
    loginFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
      state.isLogin = false;
    },
    login: (state, action) => {
      // Legacy support - giữ lại cho backward compatibility
      state.isLogin = true;
      state.user = action.payload;
      localStorage.setItem('user', JSON.stringify(action.payload));
    },
    logout: (state) => {
      state.isLogin = false;
      state.user = null;
      state.accessToken = null;
      state.refreshToken = null;
      state.error = null;

      // Xóa khỏi localStorage
      localStorage.removeItem('user');
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
    },
    checkAuth: (state) => {
      const user = localStorage.getItem('user');
      const token = localStorage.getItem('accessToken');
      if (user && token) {
        state.isLogin = true;
        state.user = JSON.parse(user);
        state.accessToken = token;
        state.refreshToken = localStorage.getItem('refreshToken');
      } else {
        state.isLogin = false;
        state.user = null;
        state.accessToken = null;
        state.refreshToken = null;
      }
    },
    updateUser: (state, action) => {
      // Gộp thông tin cũ (email, id...) với thông tin mới (avatar, name...)
      state.user = { ...state.user, ...action.payload };
      // Lưu lại vào LocalStorage để F5 vẫn giữ thông tin mới
      localStorage.setItem('user', JSON.stringify(state.user));
    },
    updateTokens: (state, action) => {
      state.accessToken = action.payload.accessToken;
      if (action.payload.refreshToken) {
        state.refreshToken = action.payload.refreshToken;
        localStorage.setItem('refreshToken', action.payload.refreshToken);
      }
      localStorage.setItem('accessToken', action.payload.accessToken);
    },
    clearError: (state) => {
      state.error = null;
    },
  },
});

// --- QUAN TRỌNG: PHẢI CÓ 'updateUser' Ở DÒNG DƯỚI NÀY THÌ PROFILE MỚI DÙNG ĐƯỢC ---
export const {
  login,
  logout,
  checkAuth,
  updateUser,
  loginStart,
  loginSuccess,
  loginFailure,
  updateTokens,
  clearError
} = authSlice.actions;

export default authSlice.reducer;