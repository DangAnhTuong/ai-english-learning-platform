import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Checkbox, message, Divider, Alert } from 'antd';
import { UserOutlined, LockOutlined, GoogleOutlined, FacebookFilled } from '@ant-design/icons';
import { NavLink, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { loginSuccess, loginFailure, loginStart } from '../../redux/authSlice';
import { authService } from '../../services/authService';
import ForgotPasswordModal from '../Forgot_Password_Modal';
import { useGoogleLogin } from '@react-oauth/google';
import './style.css';
import loginImg from '../../img/brainn.jpg';
import defaultUserAvatar from '../../img/avatar.jpg';

function Login() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [form] = Form.useForm();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState(false);
  const [logoutReason, setLogoutReason] = useState(null);

  useEffect(() => {
    const reason = localStorage.getItem('logoutReason');
    if (reason) {
      setLogoutReason(reason);
      localStorage.removeItem('logoutReason');
    }
  }, []);

  const handleLoginSuccess = (response) => {
    const data = response;
    if (data.user && data.accessToken && data.refreshToken) {
      const { user, accessToken, refreshToken } = data;
      const userData = {
        id: user._id || user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        avatar: user.avatar || defaultUserAvatar,
        roles: user.roles || ['student'],
        status: user.status,
      };

      dispatch(loginSuccess({
        user: userData,
        accessToken,
        refreshToken,
      }));

      message.success('Đăng nhập thành công!');

      if (!user.isEmailVerified) {
        message.warning('Vui lòng xác thực email để sử dụng đầy đủ tính năng!');
      }

      if (userData.roles && userData.roles.includes('admin')) {
        navigate('/admin/dashboard');
      } else {
        navigate('/');
      }
    } else {
      throw new Error(response.error || data.error || 'Đăng nhập thất bại');
    }
  };

  const handleGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setSocialLoading(true);
      try {
        const response = await authService.loginWithGoogle(tokenResponse.access_token);
        handleLoginSuccess(response);
      } catch (error) {
        console.error('Google login error:', error);
        message.error('Đăng nhập Google thất bại từ máy chủ.');
      } finally {
        setSocialLoading(false);
      }
    },
    onError: () => {
      message.error('Đăng nhập Google thất bại');
    }
  });

  const onFinish = async (values) => {
    setLoading(true);
    dispatch(loginStart());

    try {
      const response = await authService.login(values.email, values.password);
      handleLoginSuccess(response);
    } catch (error) {
      console.error('Login error:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Đăng nhập thất bại. Vui lòng thử lại!';
      dispatch(loginFailure(errorMessage));
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">

      {/* CỘT TRÁI */}
      <div className="auth-left">
        <div className="auth-left-content">
          <img src={loginImg} alt="English AI" className="hero-img" />
          <h2>Học tiếng Anh cùng AI</h2>
          <p>Lộ trình cá nhân hóa - Bứt phá mọi kỹ năng</p>
        </div>
      </div>

      {/* CỘT PHẢI */}
      <div className="auth-right">
        <div className="auth-form-container">
          <h1 className="auth-title">Đăng nhập</h1>
          <span className="auth-subtitle">Chào mừng bạn quay trở lại!</span>

          {logoutReason && (
            <Alert
              message="Thông báo"
              description={logoutReason}
              type="warning"
              showIcon
              closable
              onClose={() => setLogoutReason(null)}
              style={{ marginTop: 16, marginBottom: 8 }}
            />
          )}

          <Form
            form={form}
            layout="vertical"
            initialValues={{ remember: true }}
            onFinish={onFinish}
            size="large"
            style={{ marginTop: 20 }}
          >
            <Form.Item
              name="email"
              rules={[
                { required: true, message: 'Vui lòng nhập email!' },
                { type: 'email', message: 'Email không hợp lệ!' }
              ]}
            >
              <Input prefix={<UserOutlined />} placeholder="Email" />
            </Form.Item>

            <Form.Item
              name="password"
              rules={[{ required: true, message: 'Vui lòng nhập mật khẩu!' }]}
            >
              <Input.Password prefix={<LockOutlined />} placeholder="Mật khẩu" />
            </Form.Item>

            <Form.Item>
              <div className="auth-options">
                <Form.Item name="remember" valuePropName="checked" noStyle>
                  <Checkbox>Ghi nhớ tôi</Checkbox>
                </Form.Item>
                <a className="forgot-pass-link" onClick={() => setIsModalOpen(true)}>
                  Quên mật khẩu?
                </a>
              </div>
            </Form.Item>

            <Button type="primary" htmlType="submit" block className="btn-auth" loading={loading}>
              Đăng nhập
            </Button>
          </Form>

          <Divider style={{ color: '#999', fontSize: 13 }}>Dành cho Nhà tuyển dụng (Demo)</Divider>
          
          <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
            <Button 
              block 
              onClick={() => {
                form.setFieldsValue({ email: 'admin@example.com', password: 'admin123456' });
                onFinish({ email: 'admin@example.com', password: 'admin123456' });
              }}
            >
              Quyền Admin
            </Button>
            <Button 
              block 
              onClick={() => {
                form.setFieldsValue({ email: 'student@example.com', password: 'student123456' });
                onFinish({ email: 'student@example.com', password: 'student123456' });
              }}
            >
              Quyền Học viên
            </Button>
          </div>

          <Divider style={{ color: '#999', fontSize: 13 }}>Hoặc tiếp tục với</Divider>

          <div className="social-btn-group">
            <Button
              block
              icon={<GoogleOutlined />}
              loading={socialLoading}
              onClick={handleGoogleLogin}
            >
              Google
            </Button>
            <Button
              block
              icon={<FacebookFilled style={{ color: '#3b5998' }} />}
              disabled
              onClick={() => message.info('Tính năng đang phát triển')}
            >
              Facebook
            </Button>
          </div>

          <div className="auth-action-footer">
            Chưa có tài khoản? <NavLink to="/register" className="link-bold">Đăng ký ngay</NavLink>
          </div>
        </div>
      </div>

      <ForgotPasswordModal isVisible={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}

export default Login;