const User = require('../models/userSchema');
const UserProfile = require('../models/userProfile');
const LearningProfile = require('../models/learningProfile');
const Progress = require('../models/progress');
const Subscription = require('../models/subscription');
const Order = require('../models/order');
const Password = require('../utils/password');
const AppError = require('../utils/AppError');
const ErrorCodes = require('../constants/errorCodes');
const path = require('path');
const fs = require('fs');

const ProfileService = {
    /**
     * Lấy thông tin profile đầy đủ của user
     * @param {string} userId - User ID
     */
    async getFullProfile(userId) {
        try {
            // Lấy thông tin cơ bản của user
            const user = await User.findById(userId)
                .select('-passwordHash -refreshTokens -resetPasswordToken -resetPasswordExpires -emailVerificationToken')
                .lean();

            if (!user) {
                throw new AppError('Người dùng không tồn tại', 404, ErrorCodes.USER_NOT_FOUND);
            }

            // Lấy thông tin profile chi tiết
            let userProfile = await UserProfile.findOne({ userId }).lean();
            if (!userProfile) {
                // Tạo profile mặc định nếu chưa có
                userProfile = await UserProfile.create({ userId });
                userProfile = userProfile.toObject();
            }

            // Lấy learning profile
            let learningProfile = await LearningProfile.findOne({ userId }).lean();
            if (!learningProfile) {
                // Tạo learning profile mặc định nếu chưa có
                learningProfile = await LearningProfile.create({ userId });
                learningProfile = learningProfile.toObject();
            }

            // Lấy progress
            let progress = await Progress.findOne({ userId }).lean();
            if (!progress) {
                // Tạo progress mặc định nếu chưa có
                progress = await Progress.create({ userId });
                progress = progress.toObject();
            }

            // Lấy subscription hiện tại
            const subscription = await Subscription.findOne({
                userId,
                status: { $in: ['active', 'trial'] },
                endDate: { $gt: new Date() }
            }).lean();

            // Lấy thống kê đơn hàng
            const orderStats = await Order.aggregate([
                { $match: { userId: user._id, status: 'paid' } },
                {
                    $group: {
                        _id: null,
                        totalSpent: { $sum: '$finalAmount' },
                        orderCount: { $sum: 1 }
                    }
                }
            ]);

            return {
                user: {
                    ...user,
                    ...userProfile,
                    _id: user._id,
                    userId: undefined // remove duplicate
                },
                learningProfile,
                progress,
                subscription: subscription ? {
                    plan: subscription.plan,
                    status: subscription.status,
                    startDate: subscription.startDate,
                    endDate: subscription.endDate,
                    daysLeft: Math.max(0, Math.ceil((new Date(subscription.endDate) - new Date()) / (1000 * 60 * 60 * 24))),
                    features: subscription.features,
                    billingHistory: subscription.billingHistory
                } : null,
                stats: {
                    totalSpent: orderStats[0]?.totalSpent || 0,
                    orderCount: orderStats[0]?.orderCount || 0,
                    memberSince: user.createdAt
                }
            };
        } catch (error) {
            if (error instanceof AppError) throw error;
            console.error('Get full profile error:', error);
            throw new AppError('Không thể lấy thông tin hồ sơ', 500, ErrorCodes.INTERNAL_ERROR);
        }
    },

    /**
     * Cập nhật thông tin cá nhân
     * @param {string} userId - User ID
     * @param {Object} updateData - Dữ liệu cập nhật
     */
    async updateProfile(userId, updateData) {
        try {
            const user = await User.findById(userId);
            if (!user) {
                throw new AppError('Người dùng không tồn tại', 404, ErrorCodes.USER_NOT_FOUND);
            }

            // Tách dữ liệu cho User và UserProfile
            const userFields = ['name', 'phone'];
            const profileFields = ['dateOfBirth', 'gender', 'nationality', 'nativeLanguage', 'timezone', 'bio'];

            const userData = {};
            const profileData = {};

            Object.keys(updateData).forEach(key => {
                if (userFields.includes(key)) {
                    userData[key] = updateData[key];
                } else if (profileFields.includes(key)) {
                    profileData[key] = updateData[key];
                }
            });

            // Kiểm tra phone trùng lặp nếu thay đổi
            if (userData.phone && userData.phone !== user.phone) {
                const phoneExists = await User.findOne({ phone: userData.phone, _id: { $ne: userId } });
                if (phoneExists) {
                    throw new AppError('Số điện thoại đã được sử dụng', 409, ErrorCodes.PHONE_ALREADY_EXISTS);
                }
            }

            // Cập nhật User
            if (Object.keys(userData).length > 0) {
                Object.assign(user, userData);
                await user.save();
            }

            // Cập nhật hoặc tạo UserProfile
            if (Object.keys(profileData).length > 0) {
                await UserProfile.findOneAndUpdate(
                    { userId },
                    { $set: profileData },
                    { upsert: true, new: true }
                );
            }

            return this.getFullProfile(userId);
        } catch (error) {
            if (error instanceof AppError) throw error;
            console.error('Update profile error:', error);
            throw new AppError('Không thể cập nhật hồ sơ', 500, ErrorCodes.INTERNAL_ERROR);
        }
    },

    /**
     * Upload avatar
     * @param {string} userId - User ID
     * @param {Object} file - File object từ multer
     */
    async uploadAvatar(userId, file) {
        try {
            const user = await User.findById(userId);
            if (!user) {
                throw new AppError('Người dùng không tồn tại', 404, ErrorCodes.USER_NOT_FOUND);
            }

            // Xóa avatar cũ nếu có và là file local
            if (user.avatar && user.avatar.startsWith('/uploads/')) {
                const oldPath = path.join(__dirname, '../../public', user.avatar);
                if (fs.existsSync(oldPath)) {
                    fs.unlinkSync(oldPath);
                }
            }

            // Cập nhật đường dẫn avatar mới
            const avatarUrl = `/uploads/avatars/${file.filename}`;
            user.avatar = avatarUrl;
            await user.save();

            // Cập nhật UserProfile nếu có
            await UserProfile.findOneAndUpdate(
                { userId },
                { $set: { avatarUrl } },
                { upsert: true }
            );

            return { avatar: avatarUrl };
        } catch (error) {
            if (error instanceof AppError) throw error;
            console.error('Upload avatar error:', error);
            throw new AppError('Không thể upload ảnh đại diện', 500, ErrorCodes.INTERNAL_ERROR);
        }
    },

    /**
     * Cập nhật learning profile
     * @param {string} userId - User ID
     * @param {Object} updateData - Dữ liệu cập nhật
     */
    async updateLearningProfile(userId, updateData) {
        try {
            const user = await User.findById(userId);
            if (!user) {
                throw new AppError('Người dùng không tồn tại', 404, ErrorCodes.USER_NOT_FOUND);
            }

            const allowedFields = [
                'englishLevel', 'targetLevel', 'learningGoals', 'interests',
                'preferredLearningStyle', 'weeklyStudyGoal', 'preferredTopics',
                'challengeAreas', 'skillLevels'
            ];

            const filteredData = {};
            Object.keys(updateData).forEach(key => {
                if (allowedFields.includes(key)) {
                    filteredData[key] = updateData[key];
                }
            });

            const learningProfile = await LearningProfile.findOneAndUpdate(
                { userId },
                { $set: filteredData },
                { upsert: true, new: true }
            );

            return learningProfile;
        } catch (error) {
            if (error instanceof AppError) throw error;
            console.error('Update learning profile error:', error);
            throw new AppError('Không thể cập nhật hồ sơ học tập', 500, ErrorCodes.INTERNAL_ERROR);
        }
    },

    /**
     * Lấy tiến độ học tập
     * @param {string} userId - User ID
     */
    async getLearningProgress(userId) {
        try {
            let progress = await Progress.findOne({ userId });
            
            if (!progress) {
                progress = await Progress.create({ userId });
            }

            // Tính toán thêm một số metrics
            const weeklyGoalProgress = progress.weeklyGoal > 0
                ? Math.min(100, Math.round((progress.totalStudyTime % (progress.weeklyGoal * 7)) / (progress.weeklyGoal * 7) * 100))
                : 0;

            // Lấy 7 ngày gần nhất từ streak history
            const last7Days = progress.streakHistory
                .slice(-7)
                .map(entry => ({
                    date: entry.date,
                    minutes: entry.minutesStudied,
                    activities: entry.activitiesCompleted
                }));

            return {
                ...progress.toObject(),
                weeklyGoalProgress,
                recentActivity: last7Days
            };
        } catch (error) {
            console.error('Get learning progress error:', error);
            throw new AppError('Không thể lấy tiến độ học tập', 500, ErrorCodes.INTERNAL_ERROR);
        }
    },

    /**
     * Lấy lịch sử học tập
     * @param {string} userId - User ID
     * @param {Object} pagination - { page, limit }
     */
    async getLearningHistory(userId, pagination = {}) {
        try {
            const { page = 1, limit = 10 } = pagination;

            // Tìm các conversation đã học
            const Conversation = require('../models/conversation');
            const ConversationProgress = require('../models/userProgress');

            // Lấy tiến độ conversation của user
            const conversationProgress = await ConversationProgress.find({
                userId,
                contentType: 'conversation'
            })
                .sort({ lastAccessedAt: -1 })
                .skip((page - 1) * limit)
                .limit(limit)
                .lean();

            const total = await ConversationProgress.countDocuments({
                userId,
                contentType: 'conversation'
            });

            // Lấy thông tin conversation
            const conversationIds = conversationProgress.map(cp => cp.contentId);
            const conversations = await Conversation.find({
                _id: { $in: conversationIds }
            }).select('title topic level').lean();

            const conversationMap = {};
            conversations.forEach(c => {
                conversationMap[c._id.toString()] = c;
            });

            const history = conversationProgress.map(cp => {
                const conv = conversationMap[cp.contentId?.toString()] || {};
                return {
                    id: cp._id,
                    title: conv.title || 'Bài học không xác định',
                    topic: conv.topic || 'N/A',
                    level: conv.level,
                    score: cp.score,
                    progress: cp.progress,
                    status: cp.status,
                    startedAt: cp.startedAt,
                    completedAt: cp.completedAt,
                    lastAccessedAt: cp.lastAccessedAt
                };
            });

            return {
                history,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit)
                }
            };
        } catch (error) {
            console.error('Get learning history error:', error);
            throw new AppError('Không thể lấy lịch sử học tập', 500, ErrorCodes.INTERNAL_ERROR);
        }
    },

    /**
     * Đổi mật khẩu từ Profile (yêu cầu mật khẩu cũ)
     * @param {string} userId - User ID
     * @param {string} currentPassword - Mật khẩu hiện tại
     * @param {string} newPassword - Mật khẩu mới
     */
    async changePassword(userId, currentPassword, newPassword) {
        try {
            const user = await User.findById(userId).select('+passwordHash');
            if (!user) {
                throw new AppError('Người dùng không tồn tại', 404, ErrorCodes.USER_NOT_FOUND);
            }

            // Kiểm tra nếu user đăng nhập bằng Google
            if (user.authProvider === 'google' && !user.passwordHash) {
                throw new AppError('Tài khoản đăng nhập bằng Google không có mật khẩu. Vui lòng đặt mật khẩu mới.', 400, 'GOOGLE_ACCOUNT_NO_PASSWORD');
            }

            // Xác thực mật khẩu cũ
            const isValid = await Password.verify(user.passwordHash, currentPassword);
            if (!isValid) {
                throw new AppError('Mật khẩu hiện tại không đúng', 401, 'INVALID_CURRENT_PASSWORD');
            }

            // Kiểm tra mật khẩu mới không trùng mật khẩu cũ
            const isSame = await Password.verify(user.passwordHash, newPassword);
            if (isSame) {
                throw new AppError('Mật khẩu mới không được trùng với mật khẩu cũ', 400, 'PASSWORD_SAME_AS_OLD');
            }

            // Hash và lưu mật khẩu mới
            user.passwordHash = await Password.hash(newPassword);
            user.lastPasswordChange = new Date();
            user.tokenVersion = (user.tokenVersion || 0) + 1; // Invalidate old tokens
            await user.save();

            return { message: 'Đổi mật khẩu thành công' };
        } catch (error) {
            if (error instanceof AppError) throw error;
            console.error('Change password error:', error);
            throw new AppError('Không thể đổi mật khẩu', 500, ErrorCodes.INTERNAL_ERROR);
        }
    },

    /**
     * Đặt mật khẩu cho tài khoản Google
     * @param {string} userId - User ID
     * @param {string} newPassword - Mật khẩu mới
     */
    async setPassword(userId, newPassword) {
        try {
            const user = await User.findById(userId).select('+passwordHash');
            if (!user) {
                throw new AppError('Người dùng không tồn tại', 404, ErrorCodes.USER_NOT_FOUND);
            }

            // Chỉ cho phép nếu tài khoản Google chưa có mật khẩu
            if (user.passwordHash) {
                throw new AppError('Tài khoản đã có mật khẩu. Vui lòng sử dụng chức năng đổi mật khẩu.', 400, 'PASSWORD_ALREADY_SET');
            }

            // Hash và lưu mật khẩu
            user.passwordHash = await Password.hash(newPassword);
            user.lastPasswordChange = new Date();
            await user.save();

            return { message: 'Đặt mật khẩu thành công' };
        } catch (error) {
            if (error instanceof AppError) throw error;
            console.error('Set password error:', error);
            throw new AppError('Không thể đặt mật khẩu', 500, ErrorCodes.INTERNAL_ERROR);
        }
    },

    /**
     * Kiểm tra xem tài khoản có mật khẩu không
     * @param {string} userId - User ID
     */
    async hasPassword(userId) {
        try {
            const user = await User.findById(userId).select('passwordHash authProvider');
            if (!user) {
                throw new AppError('Người dùng không tồn tại', 404, ErrorCodes.USER_NOT_FOUND);
            }

            return {
                hasPassword: !!user.passwordHash,
                authProvider: user.authProvider
            };
        } catch (error) {
            if (error instanceof AppError) throw error;
            console.error('Has password check error:', error);
            throw new AppError('Không thể kiểm tra thông tin', 500, ErrorCodes.INTERNAL_ERROR);
        }
    }
};

module.exports = ProfileService;
