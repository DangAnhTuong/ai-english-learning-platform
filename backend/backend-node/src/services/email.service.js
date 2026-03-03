const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: process.env.SMTP_PORT === '465',
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
});

const EmailService = {
    async sendPasswordReset(email, resetToken) {
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}`;

        await transporter.sendMail({
            from: `"SpeakEasy" <${process.env.SMTP_USER}>`,
            to: email,
            subject: 'Đặt lại mật khẩu SpeakEasy',
            html: `
                <h1>Đặt lại mật khẩu</h1>
                <p>Bạn đã yêu cầu đặt lại mật khẩu cho tài khoản SpeakEasy.</p>
                <p>Click vào link bên dưới để đặt lại mật khẩu:</p>
                <a href="${resetUrl}">Đặt lại mật khẩu</a>
                <p>Link này sẽ hết hạn sau 1 giờ.</p>
                <p>Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.</p>
            `
        });
    },

    async sendEmailVerification(email, verifyToken) {
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        const verifyUrl = `${frontendUrl}/verify-email?token=${verifyToken}`;

        await transporter.sendMail({
            from: `"SpeakEasy" <${process.env.SMTP_USER}>`,
            to: email,
            subject: 'Xác thực email SpeakEasy',
            html: `
                <h1>Xác thực email</h1>
                <p>Cảm ơn bạn đã đăng ký tài khoản SpeakEasy.</p>
                <p>Click vào link bên dưới để xác thực email của bạn:</p>
                <a href="${verifyUrl}">Xác thực email</a>
                <p>Link này sẽ hết hạn sau 24 giờ.</p>
            `
        });
    }
};

module.exports = EmailService;