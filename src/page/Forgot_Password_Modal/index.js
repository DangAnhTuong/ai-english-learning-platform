import React, { useState } from 'react';
import { Modal, Steps, Form, Input, Button, message, Result } from 'antd';
import { UserOutlined, SafetyCertificateOutlined, LockOutlined, SmileOutlined } from '@ant-design/icons';
import { authService } from '../../services/authService';

const { Step } = Steps;

function ForgotPasswordModal({ isVisible, onClose }) {
    const [currentStep, setCurrentStep] = useState(0);
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState(''); // Lưu email để hiển thị
    const [resetToken, setResetToken] = useState(''); // Lưu token từ email

    // Form instances để reset khi cần
    const [formEmail] = Form.useForm();
    const [formPassword] = Form.useForm();

    // --- XỬ LÝ BƯỚC 1: GỬI EMAIL RESET PASSWORD ---
    const handleCheckEmail = async (values) => {
        setLoading(true);
        try {
            const response = await authService.forgotPassword(values.email);
            
            if (response.success) {
                setEmail(values.email);
                message.success('Email khôi phục mật khẩu đã được gửi! Vui lòng kiểm tra hộp thư của bạn.');
                // Chuyển thẳng sang bước đặt mật khẩu mới (vì backend gửi link với token)
                setCurrentStep(1);
            } else {
                throw new Error(response.error || 'Gửi email thất bại');
            }
        } catch (error) {
            console.error('Forgot password error:', error);
            const errorMessage = error.response?.data?.error || error.message || 'Có lỗi xảy ra. Vui lòng thử lại!';
            message.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    // --- XỬ LÝ BƯỚC 2: ĐẶT MẬT KHẨU MỚI VỚI TOKEN ---
    const handleResetPassword = async (values) => {
        setLoading(true);
        try {
            // Lấy token từ URL nếu có (khi user click link từ email)
            const urlParams = new URLSearchParams(window.location.search);
            const token = urlParams.get('token') || resetToken;
            
            if (!token) {
                message.error('Token không hợp lệ. Vui lòng sử dụng link từ email!');
                setLoading(false);
                return;
            }

            const response = await authService.resetPassword(token, values.password);
            
            if (response.success) {
                message.success('Đổi mật khẩu thành công! Vui lòng đăng nhập lại.');
                handleClose(); // Đóng modal
            } else {
                throw new Error(response.error || 'Đổi mật khẩu thất bại');
            }
        } catch (error) {
            console.error('Reset password error:', error);
            const errorMessage = error.response?.data?.error || error.message || 'Có lỗi xảy ra. Vui lòng thử lại!';
            
            if (errorMessage.includes('Token không hợp lệ') || errorMessage.includes('hết hạn')) {
                message.error('Link khôi phục đã hết hạn. Vui lòng yêu cầu lại!');
                setCurrentStep(0); // Quay lại bước đầu
            } else {
                message.error(errorMessage);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        // Reset lại toàn bộ trạng thái khi tắt popup
        setCurrentStep(0);
        setEmail('');
        setResetToken('');
        formEmail.resetFields();
        formPassword.resetFields();
        onClose();
    };

    // Kiểm tra token từ URL khi component mount
    React.useEffect(() => {
        if (isVisible) {
            const urlParams = new URLSearchParams(window.location.search);
            const token = urlParams.get('token');
            if (token) {
                setResetToken(token);
                setCurrentStep(1); // Chuyển thẳng sang bước đặt mật khẩu
            }
        }
    }, [isVisible]);

    return (
        <Modal
            title="Khôi Phục Mật Khẩu"
            open={isVisible}
            onCancel={handleClose}
            footer={null} // Tắt nút mặc định để dùng nút trong form
            maskClosable={false} // Bắt buộc bấm X mới tắt
        >
            {/* THANH TIẾN TRÌNH */}
            <Steps current={currentStep} style={{ marginBottom: 30 }} size="small">
                <Step title="Gửi Email" icon={<UserOutlined />} />
                <Step title="Đặt Mật Khẩu" icon={<LockOutlined />} />
            </Steps>

            {/* --- NỘI DUNG TỪNG BƯỚC --- */}
            
            {/* BƯỚC 1: NHẬP EMAIL */}
            {currentStep === 0 && (
                <Form form={formEmail} layout="vertical" onFinish={handleCheckEmail}>
                    <p>Vui lòng nhập email bạn đã đăng ký để nhận link khôi phục mật khẩu.</p>
                    <Form.Item 
                        name="email" 
                        label="Email" 
                        rules={[
                            { required: true, message: 'Vui lòng nhập email!' },
                            { type: 'email', message: 'Email không hợp lệ!' }
                        ]}
                    >
                        <Input prefix={<UserOutlined />} placeholder="your-email@example.com" size="large" />
                    </Form.Item>
                    <Button type="primary" htmlType="submit" block loading={loading} size="large">
                        Gửi Email Khôi Phục
                    </Button>
                </Form>
            )}

            {/* BƯỚC 2: ĐẶT MẬT KHẨU MỚI */}
            {currentStep === 1 && (
                <Form form={formPassword} layout="vertical" onFinish={handleResetPassword}>
                    {email && <p style={{ marginBottom: 16 }}>Email: <strong>{email}</strong></p>}
                    <Form.Item 
                        name="password" 
                        label="Mật khẩu mới" 
                        rules={[
                            { required: true, message: 'Vui lòng nhập mật khẩu mới!' },
                            { min: 6, message: 'Mật khẩu phải có ít nhất 6 ký tự!' }
                        ]}
                    >
                        <Input.Password prefix={<LockOutlined />} placeholder="Nhập mật khẩu mới (tối thiểu 6 ký tự)" size="large" />
                    </Form.Item>
                    
                    <Form.Item 
                        name="confirmPassword" 
                        label="Nhập lại mật khẩu" 
                        dependencies={['password']}
                        rules={[
                            { required: true, message: 'Vui lòng nhập lại mật khẩu!' },
                            ({ getFieldValue }) => ({
                                validator(_, value) {
                                    if (!value || getFieldValue('password') === value) {
                                        return Promise.resolve();
                                    }
                                    return Promise.reject(new Error('Mật khẩu không khớp!'));
                                },
                            }),
                        ]}
                    >
                        <Input.Password prefix={<LockOutlined />} placeholder="Xác nhận mật khẩu" size="large" />
                    </Form.Item>

                    <Button type="primary" htmlType="submit" block loading={loading} size="large">
                        Đổi mật khẩu
                    </Button>
                    {!resetToken && (
                        <div style={{ marginTop: 10, textAlign: 'center' }}>
                            <Button type="link" onClick={() => setCurrentStep(0)}>Gửi lại email?</Button>
                        </div>
                    )}
                </Form>
            )}
        </Modal>
    );
}

export default ForgotPasswordModal;