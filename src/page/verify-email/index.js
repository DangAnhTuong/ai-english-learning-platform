import React, { useEffect, useState } from 'react';
import { Result, Button, Spin, message } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined, LoadingOutlined } from '@ant-design/icons';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { authService } from '../../services/authService';

function VerifyEmail() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('loading'); // loading, success, error
  const [messageText, setMessageText] = useState('Đang xác thực email...');

  useEffect(() => {
    const verifyEmail = async () => {
      const token = searchParams.get('token');
      
      if (!token) {
        setStatus('error');
        setMessageText('Token xác thực không hợp lệ!');
        return;
      }

      try {
        const response = await authService.verifyEmail(token);
        
        if (response.success) {
          setStatus('success');
          setMessageText('Email đã được xác thực thành công!');
          message.success('Xác thực email thành công!');
          
          // Redirect sau 2 giây
          setTimeout(() => {
            navigate('/login');
          }, 2000);
        } else {
          throw new Error(response.error || 'Xác thực thất bại');
        }
      } catch (error) {
        console.error('Verify email error:', error);
        const errorMessage = error.response?.data?.error || error.message || 'Xác thực email thất bại!';
        setStatus('error');
        setMessageText(errorMessage);
        message.error(errorMessage);
      }
    };

    verifyEmail();
  }, [searchParams, navigate]);

  if (status === 'loading') {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '60vh',
        flexDirection: 'column'
      }}>
        <Spin indicator={<LoadingOutlined style={{ fontSize: 48 }} spin />} />
        <p style={{ marginTop: 20, fontSize: 16 }}>{messageText}</p>
      </div>
    );
  }

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: '80vh',
      padding: '20px'
    }}>
      <Result
        status={status === 'success' ? 'success' : 'error'}
        icon={status === 'success' ? <CheckCircleOutlined /> : <CloseCircleOutlined />}
        title={status === 'success' ? 'Xác thực thành công!' : 'Xác thực thất bại'}
        subTitle={messageText}
        extra={[
          <Button type="primary" key="login" onClick={() => navigate('/login')}>
            Đăng nhập
          </Button>,
          status === 'error' && (
            <Button key="resend" onClick={async () => {
              try {
                await authService.resendVerification();
                message.success('Email xác thực đã được gửi lại!');
              } catch (error) {
                message.error('Không thể gửi lại email. Vui lòng thử lại sau!');
              }
            }}>
              Gửi lại email
            </Button>
          ),
        ].filter(Boolean)}
      />
    </div>
  );
}

export default VerifyEmail;
