/**
 * Script để tạo test users (student và admin)
 * Chạy: node scripts/create-test-users.js
 */

const mongoose = require('mongoose');
const User = require('../src/models/userSchema');
const Password = require('../src/utils/password');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/englishdb_nodejs';

async function createTestUsers() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // Test Student
        const studentEmail = 'student@example.com';
        let student = await User.findOne({ email: studentEmail });

        if (!student) {
            const studentPasswordHash = await Password.hash('student123456');
            // Find unique phone
            let phone = '0123456789';
            let phoneExists = await User.findOne({ phone });
            let counter = 1;
            while (phoneExists) {
                phone = `012345678${counter}`;
                phoneExists = await User.findOne({ phone });
                counter++;
            }
            
            student = new User({
                email: studentEmail,
                passwordHash: studentPasswordHash,
                name: 'Test Student',
                username: 'teststudent',
                phone: phone,
                roles: ['student'],
                status: 'active',
                isEmailVerified: true
            });
            await student.save();
            console.log('✅ Created test student:', studentEmail);
        } else {
            // Update password if exists
            const studentPasswordHash = await Password.hash('student123456');
            student.passwordHash = studentPasswordHash;
            student.status = 'active';
            student.isEmailVerified = true;
            await student.save();
            console.log('✅ Updated test student:', studentEmail);
        }

        // Test Admin
        const adminEmail = 'admin@example.com';
        let admin = await User.findOne({ email: adminEmail });

        if (!admin) {
            const adminPasswordHash = await Password.hash('admin123456');
            // Find unique phone
            let phone = '0987654321';
            let phoneExists = await User.findOne({ phone });
            let counter = 1;
            while (phoneExists) {
                phone = `098765432${counter}`;
                phoneExists = await User.findOne({ phone });
                counter++;
            }
            
            admin = new User({
                email: adminEmail,
                passwordHash: adminPasswordHash,
                name: 'Test Admin',
                username: 'testadmin',
                phone: phone,
                roles: ['admin'],
                status: 'active',
                isEmailVerified: true
            });
            await admin.save();
            console.log('✅ Created test admin:', adminEmail);
        } else {
            // Update password and ensure admin role
            const adminPasswordHash = await Password.hash('admin123456');
            admin.passwordHash = adminPasswordHash;
            if (!admin.roles.includes('admin')) {
                admin.roles.push('admin');
            }
            admin.status = 'active';
            admin.isEmailVerified = true;
            await admin.save();
            console.log('✅ Updated test admin:', adminEmail);
        }

        console.log('\n✅ Test users ready!');
        console.log('   Student: student@example.com / student123456');
        console.log('   Admin: admin@example.com / admin123456');

    } catch (error) {
        console.error('❌ Error:', error.message);
        throw error;
    } finally {
        await mongoose.disconnect();
        console.log('✅ Disconnected from MongoDB');
    }
}

createTestUsers();
