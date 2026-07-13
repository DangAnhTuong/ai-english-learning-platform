const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Password = require('../src/utils/password');
const User = require('../src/models/userSchema');

dotenv.config({ path: '../.env' }); // Adjust if needed
const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://admin:adminpassword@localhost:27017/englishdb_nodejs?authSource=admin';

async function seedDemoUsers() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to MongoDB');

        // Create Admin
        const adminEmail = 'admin@example.com';
        const adminPassword = await Password.hash('admin123456');
        await User.findOneAndUpdate(
            { email: adminEmail },
            {
                email: adminEmail,
                passwordHash: adminPassword,
                name: 'Demo Admin',
                username: 'demoadmin',
                phone: '0999999999',
                roles: ['admin', 'teacher', 'student'],
                status: 'active',
                isEmailVerified: true
            },
            { upsert: true, new: true }
        );
        console.log(`Upserted admin: ${adminEmail}`);

        // Create Student
        const studentEmail = 'student@example.com';
        const studentPassword = await Password.hash('student123456');
        await User.findOneAndUpdate(
            { email: studentEmail },
            {
                email: studentEmail,
                passwordHash: studentPassword,
                name: 'Demo Student',
                username: 'demostudent',
                phone: '0888888888',
                roles: ['student'],
                status: 'active',
                isEmailVerified: true,
                activeSubscriptionId: new mongoose.Types.ObjectId()
            },
            { upsert: true, new: true }
        );
        console.log(`Upserted student: ${studentEmail}`);

        console.log('Seed completed successfully');
        process.exit(0);
    } catch (error) {
        console.error('Error seeding users:', error);
        process.exit(1);
    }
}

seedDemoUsers();
