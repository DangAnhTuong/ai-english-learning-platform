/**
 * Script để tạo admin user
 * Chạy: node scripts/create-admin.js
 */

const mongoose = require('mongoose');
const User = require('../src/models/userSchema');
const Password = require('../src/utils/password');
require('dotenv').config();

const createAdmin = async () => {
    try {
        // Kết nối MongoDB - dùng cùng connection string như backend
        const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/englishdb_nodejs';
        await mongoose.connect(mongoUri, {
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
            family: 4,
            maxPoolSize: 10,
            minPoolSize: 3,
            retryWrites: true,
            retryReads: true,
        });
        console.log('✅ Đã kết nối MongoDB');

        // Kiểm tra xem đã có admin chưa
        const existingAdmin = await User.findOne({ roles: 'admin' });
        if (existingAdmin) {
            console.log('⚠️  Đã có admin user:', existingAdmin.email);
            console.log('   Bạn có thể dùng tài khoản này hoặc tạo mới');
        }

        // Tạo admin mới
        const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';
        const adminPassword = process.env.ADMIN_PASSWORD || 'admin123456';
        const adminName = process.env.ADMIN_NAME || 'Admin User';

        // Kiểm tra email đã tồn tại
        const existingUser = await User.findOne({ email: adminEmail });
        if (existingUser) {
            // Update thành admin nếu chưa phải admin
            if (!existingUser.roles.includes('admin')) {
                existingUser.roles.push('admin');
                existingUser.status = 'active';
                existingUser.isEmailVerified = true;
                await existingUser.save();
                console.log('✅ Đã cập nhật user thành admin:', adminEmail);
            } else {
                console.log('✅ User đã là admin:', adminEmail);
            }
        } else {
            // Tạo admin mới
            const passwordHash = await Password.hash(adminPassword);
            const admin = await User.create({
                email: adminEmail,
                passwordHash,
                name: adminName,
                username: adminEmail.split('@')[0] + '_admin',
                phone: '0000000000',
                roles: ['admin'],
                status: 'active',
                isEmailVerified: true,
            });

            console.log('✅ Đã tạo admin user thành công!');
            console.log('📧 Email:', adminEmail);
            console.log('🔑 Password:', adminPassword);
            console.log('👤 Name:', adminName);
        }

        await mongoose.disconnect();
        console.log('✅ Đã đóng kết nối MongoDB');
    } catch (error) {
        console.error('❌ Lỗi:', error.message);
        process.exit(1);
    }
};

createAdmin();
