const mongoose = require('mongoose');
require('dotenv').config({ path: '../.env' }); 
const User = require('./models/userSchema'); 
const Password = require('./utils/password');

const seedDatabase = async () => {
    try {
        console.log('⏳ Đang kết nối tới MongoDB...');
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/english-learning');
        console.log('✅ Đã kết nối Database thành công!');

        // Delete existing users from previous seeds to ensure new hashes
        await User.deleteMany({ email: { $in: ['admin@example.com', 'student@example.com'] } });

        const adminEmail = 'admin@example.com';
        console.log('⚙️ Đang tạo tài khoản Admin gốc...');
        
        const hashedPassword = await Password.hash('admin123456');
        
        await User.create({
            name: 'System Admin',
            username: 'admin',  
            phone: '0123456789',
            email: adminEmail,
            passwordHash: hashedPassword,
            roles: ['admin', 'teacher', 'student'], 
            status: 'active',
            isEmailVerified: true,
            tokenVersion: 0
        });
        console.log('🎉 XONG! Đã tạo Admin: admin@example.com | Pass: admin123456');

        const studentEmail = 'student@example.com';
        console.log('⚙️ Đang tạo tài khoản Student gốc...');
        const hashedPass = await Password.hash('student123456');
        await User.create({
            name: 'Test Student',
            username: 'student',  
            phone: '0987654321',
            email: studentEmail,
            passwordHash: hashedPass,
            roles: ['student'], 
            status: 'active',
            isEmailVerified: true,
            tokenVersion: 0
        });
        console.log('🎉 XONG! Đã tạo Student: student@example.com | Pass: student123456');

        process.exit(0);
    } catch (error) {
        console.error('❌ Lỗi:', error);
        process.exit(1);
    }
};

seedDatabase();