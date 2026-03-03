/**
 * Seed demo published/public courses for frontend.
 * Run: node scripts/seed-demo-courses.js
 */

const mongoose = require('mongoose');
const User = require('../src/models/userSchema');
const Course = require('../src/models/course');
require('dotenv').config();

const DEMO_COURSES = [
    {
        title: 'Tiếng Anh Giao Tiếp Cơ Bản A1',
        description: 'Khóa học giúp người mới bắt đầu xây nền tảng giao tiếp tiếng Anh với tình huống thực tế hằng ngày.',
        shortDescription: 'Nền tảng giao tiếp A1 cho người mới bắt đầu.',
        category: 'conversation',
        level: 'A1',
        difficulty: 'beginner',
        enrollmentType: 'free',
        price: 0,
        currency: 'VND',
        isPublic: true,
        status: 'published',
        averageRating: 4.8,
        totalRatings: 126,
        enrolledStudents: 980,
        tags: ['giao tiep', 'co ban', 'beginner'],
        language: 'vi'
    },
    {
        title: 'Business English B1: Email va Hop Truc Tuyen',
        description: 'Khóa học tập trung vào viết email chuyên nghiệp, trình bày trong cuộc họp và phản xạ giao tiếp nơi công sở.',
        shortDescription: 'Business English B1 cho môi trường công sở.',
        category: 'business',
        level: 'B1',
        difficulty: 'intermediate',
        enrollmentType: 'paid',
        price: 299000,
        currency: 'VND',
        isPublic: true,
        status: 'published',
        averageRating: 4.7,
        totalRatings: 84,
        enrolledStudents: 420,
        tags: ['business', 'email', 'meeting'],
        language: 'vi'
    }
];

async function seedDemoCourses() {
    let connectionOpened = false;
    try {
        const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/englishdb_nodejs';
        await mongoose.connect(mongoUri, {
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
            family: 4,
            maxPoolSize: 10,
            minPoolSize: 3,
            retryWrites: true,
            retryReads: true
        });
        connectionOpened = true;
        console.log('✅ Connected MongoDB');

        const adminUser = await User.findOne({ roles: 'admin', status: 'active' });
        if (!adminUser) {
            throw new Error('Không tìm thấy admin active. Hãy chạy node scripts/create-admin.js trước.');
        }

        let created = 0;
        let updated = 0;

        for (const courseData of DEMO_COURSES) {
            const existing = await Course.findOne({ title: courseData.title });
            if (existing) {
                existing.description = courseData.description;
                existing.shortDescription = courseData.shortDescription;
                existing.category = courseData.category;
                existing.level = courseData.level;
                existing.difficulty = courseData.difficulty;
                existing.enrollmentType = courseData.enrollmentType;
                existing.price = courseData.price;
                existing.currency = courseData.currency;
                existing.isPublic = true;
                existing.status = 'published';
                existing.publishedAt = new Date();
                existing.averageRating = courseData.averageRating;
                existing.totalRatings = courseData.totalRatings;
                existing.enrolledStudents = courseData.enrolledStudents;
                existing.tags = courseData.tags;
                existing.language = courseData.language;
                await existing.save();
                updated += 1;
            } else {
                await Course.create({
                    ...courseData,
                    creator: adminUser._id,
                    instructors: [adminUser._id],
                    publishedAt: new Date()
                });
                created += 1;
            }
        }

        const publishedPublicCount = await Course.countDocuments({ status: 'published', isPublic: true });

        console.log(`✅ Seed completed: created=${created}, updated=${updated}`);
        console.log(`📚 Published + public courses total: ${publishedPublicCount}`);
    } catch (error) {
        console.error('❌ Seed demo courses failed:', error.message);
        process.exitCode = 1;
    } finally {
        if (connectionOpened) {
            await mongoose.disconnect();
            console.log('✅ Disconnected MongoDB');
        }
    }
}

seedDemoCourses();

