const User = require('../models/userSchema');
const Conversation = require('../models/conversation');
const Subscription = require('../models/subscription');
const UserProgress = require('../models/userProgress');
const LearningProfile = require('../models/learningProfile');
const Order = require('../models/order');
const mongoose = require('mongoose');
const AppError = require('../utils/AppError');

class AdminService {
    /**
     * Lấy thống kê tổng quan Dashboard
     */
    static async getDashboardStats() {
        const [
            totalUsers,
            totalStudents,
            totalTeachers,
            activeUsers,
            pendingTeachers,
            totalConversations,
            conversationsWithAudio,
            totalOrders,
            recentOrders
        ] = await Promise.all([
            User.countDocuments(),
            User.countDocuments({ roles: 'student' }),
            User.countDocuments({ roles: 'teacher' }),
            User.countDocuments({ status: 'active' }),
            User.countDocuments({ roles: 'teacher', status: 'pending' }),
            Conversation.countDocuments(),
            Conversation.countDocuments({ audioGenerationStatus: 'completed' }),
            Order.countDocuments(),
            Order.find().sort({ createdAt: -1 }).limit(5).populate('userId', 'name email')
        ]);

        // Tính doanh thu
        const revenueStats = await Order.aggregate([
            { $match: { status: 'completed' } },
            { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }
        ]);

        // Users đăng ký trong 7 ngày gần đây
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        const newUsersThisWeek = await User.countDocuments({ createdAt: { $gte: weekAgo } });

        // Thống kê theo ngày trong 30 ngày
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        const dailyStats = await User.aggregate([
            { $match: { createdAt: { $gte: thirtyDaysAgo } } },
            { 
                $group: { 
                    _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        return {
            users: {
                total: totalUsers,
                students: totalStudents,
                teachers: totalTeachers,
                active: activeUsers,
                pendingTeachers,
                newThisWeek: newUsersThisWeek
            },
            content: {
                totalConversations,
                conversationsWithAudio,
                audioPercentage: totalConversations > 0 
                    ? Math.round((conversationsWithAudio / totalConversations) * 100) 
                    : 0
            },
            revenue: {
                total: revenueStats[0]?.total || 0,
                orderCount: revenueStats[0]?.count || 0,
                totalOrders
            },
            recentOrders,
            dailyStats
        };
    }

    /**
     * Lấy hồ sơ chi tiết giáo viên
     */
    static async getTeacherProfile(teacherId) {
        const teacher = await User.findById(teacherId);
        if (!teacher || !teacher.roles.includes('teacher')) {
            throw new AppError('Giáo viên không tồn tại', 404, 'TEACHER_NOT_FOUND');
        }

        // Lấy conversations đã tạo
        const conversations = await Conversation.find({ creator: teacherId })
            .select('title topic level totalLines audioGenerationStatus createdAt isActive')
            .sort({ createdAt: -1 });

        // Thống kê theo topic
        const topicStats = await Conversation.aggregate([
            { $match: { creator: new mongoose.Types.ObjectId(teacherId) } },
            { $group: { _id: '$topic', count: { $sum: 1 } } },
            { $sort: { count: -1 } }
        ]);

        // Thống kê theo level
        const levelStats = await Conversation.aggregate([
            { $match: { creator: new mongoose.Types.ObjectId(teacherId) } },
            { $group: { _id: '$level', count: { $sum: 1 } } }
        ]);

        // Tổng số lines audio
        const audioStats = await Conversation.aggregate([
            { $match: { creator: new mongoose.Types.ObjectId(teacherId) } },
            { $unwind: '$lines' },
            { 
                $group: { 
                    _id: null, 
                    totalLines: { $sum: 1 },
                    linesWithAudio: { 
                        $sum: { $cond: [{ $ne: ['$lines.audioUrl', null] }, 1, 0] } 
                    }
                }
            }
        ]);

        return {
            teacher: {
                _id: teacher._id,
                name: teacher.name,
                email: teacher.email,
                phone: teacher.phone,
                status: teacher.status,
                avatar: teacher.avatar,
                createdAt: teacher.createdAt,
                lastLoginAt: teacher.lastLoginAt,
                totalLogins: teacher.totalLogins,
                isEmailVerified: teacher.isEmailVerified
            },
            stats: {
                totalConversations: conversations.length,
                activeConversations: conversations.filter(c => c.isActive).length,
                conversationsWithAudio: conversations.filter(c => c.audioGenerationStatus === 'completed').length,
                totalLines: audioStats[0]?.totalLines || 0,
                linesWithAudio: audioStats[0]?.linesWithAudio || 0,
                topicCount: topicStats.length
            },
            conversations,
            topicStats,
            levelStats
        };
    }

    /**
     * Lấy hồ sơ chi tiết học viên
     */
    static async getStudentProfile(studentId) {
        const student = await User.findById(studentId)
            .populate('learningProfileId')
            .populate('activeSubscriptionId');

        if (!student) {
            throw new AppError('Học viên không tồn tại', 404, 'STUDENT_NOT_FOUND');
        }

        // Learning profile
        let learningProfile = student.learningProfileId;
        if (!learningProfile) {
            learningProfile = await LearningProfile.findOne({ userId: studentId });
        }

        // Subscriptions history
        const subscriptions = await Subscription.find({ userId: studentId })
            .sort({ createdAt: -1 });

        // Orders history
        const orders = await Order.find({ userId: studentId })
            .sort({ createdAt: -1 })
            .limit(10);

        // Learning progress
        const progressStats = await UserProgress.aggregate([
            { $match: { userId: new mongoose.Types.ObjectId(studentId) } },
            { 
                $group: { 
                    _id: '$type',
                    total: { $sum: 1 },
                    completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
                    totalTime: { $sum: '$timeSpent' },
                    avgScore: { $avg: '$score' }
                }
            }
        ]);

        // Recent activity
        const recentActivity = await UserProgress.find({ userId: studentId })
            .sort({ lastAccessedAt: -1 })
            .limit(10)
            .populate('courseId', 'title')
            .populate('lessonId', 'title');

        // Login history (from user document)
        const loginHistory = [];
        if (student.lastLoginAt) {
            loginHistory.push({
                date: student.lastLoginAt,
                type: 'login'
            });
        }

        return {
            student: {
                _id: student._id,
                name: student.name,
                email: student.email,
                phone: student.phone,
                status: student.status,
                avatar: student.avatar,
                createdAt: student.createdAt,
                lastLoginAt: student.lastLoginAt,
                totalLogins: student.totalLogins,
                isEmailVerified: student.isEmailVerified
            },
            learningProfile: learningProfile || {
                englishLevel: 'beginner',
                targetLevel: null,
                skillLevels: { listening: 0, speaking: 0, reading: 0, writing: 0, vocabulary: 0, grammar: 0 }
            },
            subscriptions: {
                active: student.activeSubscriptionId || subscriptions.find(s => s.status === 'active'),
                history: subscriptions
            },
            orders,
            progress: {
                stats: progressStats,
                totalTimeSpent: progressStats.reduce((acc, p) => acc + (p.totalTime || 0), 0),
                completedItems: progressStats.reduce((acc, p) => acc + (p.completed || 0), 0)
            },
            recentActivity,
            loginHistory
        };
    }

    /**
     * Cập nhật level cho học viên
     */
    static async updateStudentLevel(studentId, newLevel) {
        let learningProfile = await LearningProfile.findOne({ userId: studentId });
        
        if (!learningProfile) {
            learningProfile = new LearningProfile({
                userId: studentId,
                englishLevel: newLevel
            });
        } else {
            learningProfile.englishLevel = newLevel;
        }

        await learningProfile.save();

        // Update reference in user
        await User.findByIdAndUpdate(studentId, { learningProfileId: learningProfile._id });

        return learningProfile;
    }

    /**
     * Duyệt giáo viên
     */
    static async approveTeacher(teacherId) {
        const teacher = await User.findById(teacherId);
        if (!teacher) {
            throw new AppError('Giáo viên không tồn tại', 404, 'TEACHER_NOT_FOUND');
        }

        if (!teacher.roles.includes('teacher')) {
            teacher.roles.push('teacher');
        }
        teacher.status = 'active';
        await teacher.save();

        return teacher;
    }

    /**
     * Từ chối giáo viên
     */
    static async rejectTeacher(teacherId, reason) {
        const teacher = await User.findById(teacherId);
        if (!teacher) {
            throw new AppError('Giáo viên không tồn tại', 404, 'TEACHER_NOT_FOUND');
        }

        teacher.status = 'inactive';
        // Có thể lưu reason vào một field khác hoặc notification
        await teacher.save();

        return teacher;
    }

    /**
     * Lấy danh sách giáo viên chờ duyệt
     */
    static async getPendingTeachers() {
        return User.find({ 
            roles: 'teacher', 
            status: 'pending' 
        }).sort({ createdAt: -1 });
    }

    /**
     * Thống kê giáo viên
     */
    static async getTeacherStats() {
        const stats = await User.aggregate([
            { $match: { roles: 'teacher' } },
            {
                $lookup: {
                    from: 'conversations',
                    localField: '_id',
                    foreignField: 'creator',
                    as: 'conversations'
                }
            },
            {
                $project: {
                    name: 1,
                    email: 1,
                    status: 1,
                    createdAt: 1,
                    lastLoginAt: 1,
                    conversationCount: { $size: '$conversations' },
                    activeConversations: {
                        $size: {
                            $filter: {
                                input: '$conversations',
                                as: 'c',
                                cond: { $eq: ['$$c.isActive', true] }
                            }
                        }
                    }
                }
            },
            { $sort: { conversationCount: -1 } }
        ]);

        return stats;
    }

    /**
     * Thống kê học viên
     */
    static async getStudentStats() {
        const stats = await User.aggregate([
            { $match: { roles: 'student' } },
            {
                $lookup: {
                    from: 'subscriptions',
                    localField: '_id',
                    foreignField: 'userId',
                    as: 'subscriptions'
                }
            },
            {
                $lookup: {
                    from: 'learningprofiles',
                    localField: '_id',
                    foreignField: 'userId',
                    as: 'learningProfile'
                }
            },
            {
                $project: {
                    name: 1,
                    email: 1,
                    status: 1,
                    createdAt: 1,
                    lastLoginAt: 1,
                    totalLogins: 1,
                    hasActiveSubscription: {
                        $gt: [{
                            $size: {
                                $filter: {
                                    input: '$subscriptions',
                                    as: 's',
                                    cond: { $eq: ['$$s.status', 'active'] }
                                }
                            }
                        }, 0]
                    },
                    englishLevel: { $arrayElemAt: ['$learningProfile.englishLevel', 0] }
                }
            },
            { $sort: { lastLoginAt: -1 } }
        ]);

        return stats;
    }

    /**
     * Cập nhật subscription cho học viên
     */
    static async updateStudentSubscription(studentId, subscriptionData) {
        const { plan, startDate, endDate, status } = subscriptionData;

        let subscription = await Subscription.findOne({ 
            userId: studentId, 
            status: 'active' 
        });

        if (subscription) {
            // Update existing
            subscription.plan = plan || subscription.plan;
            subscription.startDate = startDate || subscription.startDate;
            subscription.endDate = endDate || subscription.endDate;
            subscription.status = status || subscription.status;
        } else {
            // Create new
            subscription = new Subscription({
                userId: studentId,
                plan: plan || 'basic',
                startDate: startDate || new Date(),
                endDate,
                status: status || 'active'
            });
        }

        await subscription.save();

        // Update user reference
        if (subscription.status === 'active') {
            await User.findByIdAndUpdate(studentId, { activeSubscriptionId: subscription._id });
        }

        return subscription;
    }
}

module.exports = AdminService;
