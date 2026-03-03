/**
 * Script để kiểm tra user trong database
 */

const mongoose = require('mongoose');
const User = require('../src/models/userSchema');
require('dotenv').config();

const checkUser = async () => {
    try {
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
        console.log('✅ Đã kết nối MongoDB\n');

        const email = 'admin@example.com';
        const user = await User.findOne({ email }).select('+passwordHash');
        
        if (!user) {
            console.log('❌ User không tồn tại:', email);
        } else {
            console.log('✅ User tồn tại:');
            console.log('   Email:', user.email);
            console.log('   Name:', user.name);
            console.log('   Roles:', user.roles);
            console.log('   Status:', user.status);
            console.log('   isEmailVerified:', user.isEmailVerified);
            console.log('   Has passwordHash:', !!user.passwordHash);
            console.log('   PasswordHash length:', user.passwordHash?.length || 0);
        }

        await mongoose.disconnect();
    } catch (error) {
        console.error('❌ Lỗi:', error.message);
        process.exit(1);
    }
};

checkUser();
