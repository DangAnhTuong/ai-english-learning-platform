const nodemailer = require('nodemailer');

const getTransporter = () => {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
        return null;
    }
    return nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT || '587', 10),
        secure: process.env.SMTP_PORT === '465',
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
        }
    });
};

const EmailService = {
    async sendPasswordReset(email, resetToken) {
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3005';
        const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}`;
        const transporter = getTransporter();

        if (!transporter) {
            console.warn(`[EmailService] ⚠️ SMTP_USER/PASS not configured. Simulated Password Reset URL for ${email}: ${resetUrl}`);
            return { success: true, simulated: true };
        }

        try {
            await transporter.sendMail({
                from: `"English AI" <${process.env.SMTP_USER}>`,
                to: email,
                subject: 'Đặt lại mật khẩu - English AI Learning',
                html: `
                    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; padding: 24px;">
                        <h2 style="color: #2563eb; margin-top: 0;">Đặt lại mật khẩu của bạn</h2>
                        <p>Xin chào,</p>
                        <p>Chúng tôi đã nhận được yêu cầu đặt lại mật khẩu cho tài khoản <strong>${email}</strong> trên nền tảng English AI.</p>
                        <p>Vui lòng bấm vào nút bên dưới để tạo mật khẩu mới:</p>
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="${resetUrl}" style="background-color: #2563eb; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 6px; font-weight: bold; display: inline-block;">Đặt lại mật khẩu</a>
                        </div>
                        <p style="font-size: 13px; color: #64748b;">Đường dẫn này có hiệu lực trong vòng 1 giờ. Nếu bạn không yêu cầu hành động này, vui lòng bỏ qua email.</p>
                    </div>
                `
            });
            console.log(`[EmailService] ✅ Password reset email dispatched to ${email}`);
            return { success: true };
        } catch (error) {
            console.error('[EmailService] ❌ Failed to send password reset email:', error);
            throw error;
        }
    },

    async sendEmailVerification(email, verifyToken) {
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3005';
        const verifyUrl = `${frontendUrl}/verify-email?token=${verifyToken}`;
        const transporter = getTransporter();

        if (!transporter) {
            console.warn(`[EmailService] ⚠️ SMTP_USER/PASS not configured. Simulated Email Verification URL for ${email}: ${verifyUrl}`);
            return { success: true, simulated: true };
        }

        try {
            await transporter.sendMail({
                from: `"English AI" <${process.env.SMTP_USER}>`,
                to: email,
                subject: 'Xác thực tài khoản - English AI Learning',
                html: `
                    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; padding: 24px;">
                        <h2 style="color: #10b981; margin-top: 0;">Chào mừng bạn đến với English AI!</h2>
                        <p>Xin chào,</p>
                        <p>Cảm ơn bạn đã đăng ký tài khoản học tiếng Anh thông minh cùng AI.</p>
                        <p>Vui lòng xác thực địa chỉ email bằng cách bấm vào nút bên dưới:</p>
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="${verifyUrl}" style="background-color: #10b981; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 6px; font-weight: bold; display: inline-block;">Kích hoạt tài khoản</a>
                        </div>
                        <p style="font-size: 13px; color: #64748b;">Đường dẫn có hiệu lực trong vòng 24 giờ.</p>
                    </div>
                `
            });
            console.log(`[EmailService] ✅ Verification email dispatched to ${email}`);
            return { success: true };
        } catch (error) {
            console.error('[EmailService] ❌ Failed to send verification email:', error);
            throw error;
        }
    }
};

module.exports = EmailService;
