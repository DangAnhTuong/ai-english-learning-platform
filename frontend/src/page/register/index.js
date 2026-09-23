import React, { useState } from 'react';
import { Form, Input, Button, message, Divider } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined, PhoneOutlined, GoogleOutlined, FacebookFilled } from '@ant-design/icons';
import { NavLink, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { loginSuccess, loginStart, loginFailure } from '../../redux/authSlice';
import { authService } from '../../services/authService';
import { useGoogleLogin } from '@react-oauth/google';
import './style.css'; 
import registerImg from '../../img/brainn.jpg';
import defaultUserAvatar from '../../img/avatar.jpg';

function Register() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState(false);

  const handleLoginSuccess = (response) => {
    const data = response.data || response;
    
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
        isEmailVerified: user.isEmailVerified || false,
      };

      dispatch(loginSuccess({
        user: userData,
        accessToken,
        refreshToken,
      }));

      message.success('Đăng ký tài khoản thành công!');
      navigate('/');
    } else {
      throw new Error(response.error || data.error || 'Thao tác thất bại');
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
      if (values.password.length < 6) {
        throw new Error('Mật khẩu phải có ít nhất 6 ký tự');
      }

      const response = await authService.register({
        name: values.fullName,
        username: values.email.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '') + Math.floor(Math.random() * 10000),
        email: values.email,
        phone: values.phone,
        password: values.password,
      });

      handleLoginSuccess(response);
      message.info('Vui lòng kiểm tra email để xác thực tài khoản của bạn.');
    } catch (error) {
      console.error('Register error:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Đăng ký thất bại. Vui lòng thử lại!';
      dispatch(loginFailure(errorMessage));
      
      if (errorMessage.includes('Email đã được đăng ký')) {
        message.error('Email này đã được sử dụng. Vui lòng đăng nhập hoặc dùng email khác!');
      } else if (errorMessage.includes('Tên người dùng đã được sử dụng')) {
        message.error('Tên người dùng này đã tồn tại. Vui lòng chọn tên khác!');
      } else if (errorMessage.includes('Số điện thoại đã được đăng ký')) {
        message.error('Số điện thoại này đã được sử dụng!');
      } else {
        message.error(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      
      {/* CỘT TRÁI */}
      <div className="auth-left">
        <div className="auth-left-content">
          <img src={registerImg} alt="English AI" className="hero-img" />
          <div className="auth-left-badge">✨ NỀN TẢNG TIẾNG ANH AI THÔNG MINH</div>
          <h2>Tham gia cộng đồng English AI</h2>
          <p>Học tập không giới hạn - Kết nối toàn cầu và tự tin giao tiếp cùng AI</p>
          <div className="auth-feature-list">
            <div className="auth-feature-item">
              <span style={{ fontSize: '18px' }}>🎙️</span>
              <span>Luyện nói phản xạ 1:1 cùng trợ lý AI bản ngữ</span>
            </div>
            <div className="auth-feature-item">
              <span style={{ fontSize: '18px' }}>⚡</span>
              <span>Chấm phát âm thời gian thực chính xác từng âm tiết</span>
            </div>
            <div className="auth-feature-item">
              <span style={{ fontSize: '18px' }}>🎯</span>
              <span>Lộ trình cá nhân hóa theo mục tiêu nghề nghiệp</span>
            </div>
          </div>
        </div>
      </div>

      {/* CỘT PHẢI */}
      <div className="auth-right">
        <div className="auth-form-container">
          <h1 className="auth-title">Tạo tài khoản mới</h1>
          <span className="auth-subtitle">Điền thông tin bên dưới để bắt đầu hành trình.</span>

          <Form layout="vertical" onFinish={onFinish} size="large">
            <Form.Item
              name="fullName"
              rules={[{ required: true, message: 'Vui lòng nhập họ tên!' }]}
            >
              <Input prefix={<UserOutlined />} placeholder="Họ và tên" />
            </Form.Item>

            <Form.Item
              name="phone"
              rules={[{ required: true, message: 'Vui lòng nhập SĐT!' }]}
            >
              <Input prefix={<PhoneOutlined />} placeholder="Số điện thoại" />
            </Form.Item>

            <Form.Item
              name="email"
              rules={[{ required: true, type: 'email', message: 'Email sai định dạng!' }]}
            >
              <Input prefix={<MailOutlined />} placeholder="Email" />
            </Form.Item>

            <Form.Item
              name="password"
              rules={[
                { required: true, message: 'Vui lòng tạo mật khẩu!' },
                { min: 6, message: 'Mật khẩu phải có ít nhất 6 ký tự!' }
              ]}
            >
              <Input.Password prefix={<LockOutlined />} placeholder="Mật khẩu (tối thiểu 6 ký tự)" />
            </Form.Item>

            <Form.Item
              name="confirmPassword"
              dependencies={['password']}
              rules={[
                { required: true, message: 'Vui lòng xác nhận mật khẩu!' },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue('password') === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error('Mật khẩu xác nhận không khớp!'));
                  },
                }),
              ]}
            >
              <Input.Password prefix={<LockOutlined />} placeholder="Xác nhận mật khẩu" />
            </Form.Item>

            <Button type="primary" htmlType="submit" block className="btn-auth" loading={loading}>
              Đăng ký tài khoản
            </Button>
          </Form>

          <Divider style={{ color: '#999', fontSize: 13 }}>Hoặc tiếp tục với</Divider>
          
          <div className="social-btn-group">
            <Button 
              block 
              className="btn-google"
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
            Đã có tài khoản? <NavLink to="/login" className="link-bold">Đăng nhập ngay</NavLink>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Register;
