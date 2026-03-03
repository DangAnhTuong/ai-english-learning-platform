import React, { useEffect, useState } from 'react';
import { Spin, message } from 'antd';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { loginSuccess } from '../../redux/authSlice';
import { LoadingOutlined } from '@ant-design/icons';
import defaultUserAvatar from '../../img/avatar.jpg';
import api from '../../services/api';
import { authService } from '../../services/authService';

function AuthCallback() {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const [searchParams] = useSearchParams();
    const [status, setStatus] = useState('loading');

    useEffect(() => {
        const handleCallback = async () => {
            const code = searchParams.get('code');
            const accessToken = searchParams.get('accessToken'); // Legacy support
            const refreshToken = searchParams.get('refreshToken'); // Legacy support
            const error = searchParams.get('error');

            if (error) {
                setStatus('error');
                message.error(decodeURIComponent(error));
                setTimeout(() => navigate('/login'), 2000);
                return;
            }

            try {
                let finalAccessToken, finalRefreshToken, userData;

                // Method 1: Exchange code for tokens (modern, secure)
                if (code) {
                    try {
                        const response = await authService.exchangeOAuthCode(code);
                        // Backend trả về: { success: true, data: { accessToken, refreshToken, user } }
                        const responseData = response.data || response;
                        const tokenData = responseData.data || responseData;

                        if (tokenData.accessToken && tokenData.refreshToken && tokenData.user) {
                            finalAccessToken = tokenData.accessToken;
                            finalRefreshToken = tokenData.refreshToken;
                            userData = tokenData.user;
                        } else {
                            throw new Error('Invalid response from token exchange');
                        }
                    } catch (exchangeError) {
                        console.error('Token exchange error:', exchangeError);
                        // Fallback to legacy method if exchange fails
                        if (accessToken && refreshToken) {
                            finalAccessToken = accessToken;
                            finalRefreshToken = refreshToken;
                        } else {
                            throw new Error('Không thể trao đổi mã xác thực');
                        }
                    }
                }
                // Method 2: Legacy - tokens in URL (for backward compatibility)
                else if (accessToken && refreshToken) {
                    finalAccessToken = accessToken;
                    finalRefreshToken = refreshToken;
                } else {
                    throw new Error('Thiếu thông tin xác thực!');
                }

                // Lưu tokens
                if (finalAccessToken && finalRefreshToken) {
                    localStorage.setItem('accessToken', finalAccessToken);
                    localStorage.setItem('refreshToken', finalRefreshToken);

                    // Nếu chưa có user data, lấy từ API
                    if (!userData) {
                        const response = await api.get('/auth/me');
                        const responseData = response.data.data || response.data;
                        userData = responseData.user || responseData;
                    }

                    // Format user data
                    const formattedUser = {
                        id: userData._id || userData.id,
                        name: userData.name,
                        email: userData.email,
                        phone: userData.phone,
                        avatar: userData.avatar || defaultUserAvatar,
                        roles: userData.roles || ['student'],
                        status: userData.status,
                        isEmailVerified: userData.isEmailVerified || false,
                    };

                    // Dispatch success với tokens
                    dispatch(loginSuccess({
                        user: formattedUser,
                        accessToken: finalAccessToken,
                        refreshToken: finalRefreshToken,
                    }));

                    message.success('Đăng nhập thành công!');

                    // Clean URL - redirect dựa trên role
                    window.history.replaceState({}, '', '/');
                    if (formattedUser.roles && formattedUser.roles.includes('admin')) {
                        navigate('/admin/dashboard', { replace: true });
                    } else {
                        navigate('/', { replace: true });
                    }
                } else {
                    throw new Error('Thiếu tokens xác thực!');
                }
            } catch (error) {
                console.error('Auth callback error:', error);
                setStatus('error');
                const errorMessage = error.response?.data?.error || error.message || 'Đăng nhập thất bại. Vui lòng thử lại!';
                message.error(errorMessage);
                setTimeout(() => navigate('/login'), 2000);
            }
        };

        handleCallback();
    }, [searchParams, navigate, dispatch]);

    if (status === 'loading') {
        return (
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: '80vh',
                flexDirection: 'column'
            }}>
                <Spin indicator={<LoadingOutlined style={{ fontSize: 48 }} spin />} />
                <p style={{ marginTop: 20, fontSize: 16 }}>Đang xử lý đăng nhập...</p>
            </div>
        );
    }

    return null;
}

export default AuthCallback;
