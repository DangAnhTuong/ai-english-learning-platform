/**
 * Test password hash và verify
 */

const mongoose = require('mongoose');
const User = require('../src/models/userSchema');
const Password = require('../src/utils/password');
require('dotenv').config();

const testPassword = async () => {
    try {
        const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/englishdb_nodejs';
        await mongoose.connect(mongoUri, {
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
            family: 4,
        });
        console.log('✅ Đã kết nối MongoDB\n');

        const email = 'admin@example.com';
        const testPassword = 'admin123456';
        
        const user = await User.findOne({ email }).select('+passwordHash');
        
        if (!user) {
            console.log('❌ User không tồn tại');
            await mongoose.disconnect();
            return;
        }

        console.log('Testing password verification...');
        console.log('Email:', user.email);
        console.log('PasswordHash exists:', !!user.passwordHash);
        console.log('PasswordHash length:', user.passwordHash?.length || 0);
        console.log('Test password:', testPassword);
        console.log('PWD_PEPPER:', process.env.PWD_PEPPER || '(empty)');
        
        const isValid = await Password.verify(user.passwordHash, testPassword);
        console.log('\n✅ Password verification result:', isValid ? 'CORRECT' : 'WRONG');
        
        if (!isValid) {
            console.log('\n⚠️  Password không khớp!');
            console.log('Có thể do:');
            console.log('1. Password đã được hash với pepper khác');
            console.log('2. Cần tạo lại user với đúng pepper');
        }

        await mongoose.disconnect();
    } catch (error) {
        console.error('❌ Lỗi:', error.message);
        process.exit(1);
    }
};

testPassword();
