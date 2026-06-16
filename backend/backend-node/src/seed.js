const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: '../.env' }); 
const User = require('./models/userSchema'); 

const seedDatabase = async () => {
    try {
        console.log('⏳ Đang kết nối tới MongoDB...');
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/english-learning');
        console.log('✅ Đã kết nối Database thành công!');

        const adminEmail = 'admin@gmail.com';
        const existingAdmin = await User.findOne({ email: adminEmail });

        if (existingAdmin) {
            console.log('⚠️ Tài khoản Admin đã có sẵn. Không cần tạo lại!');
        } else {
            console.log('⚙️ Đang tạo tài khoản Admin gốc...');
            
            const hashedPassword = await bcrypt.hash('Admin@123', 12);
            
            await User.create({
                name: 'System Admin',
                username: 'admin_goc',  
                phone: '0123456789',
                email: adminEmail,
                passwordHash: hashedPassword,
                roles: ['admin', 'teacher', 'student'], 
                status: 'active',
                tokenVersion: 0
            });
            console.log('🎉 XONG! Đã tạo Admin: admin@gmail.com | Pass: Admin@123');
        }

        process.exit(0);
    } catch (error) {
        console.error('❌ Lỗi:', error);
        process.exit(1);
    }
};

seedDatabase();