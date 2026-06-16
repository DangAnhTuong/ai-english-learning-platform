const User = require('../models/userSchema');
const Password = require('../utils/password');
const AppError = require('../utils/AppError');
const ErrorCodes = require('../constants/errorCodes');

const UserService = {
    /**
     * Lấy danh sách users với filter và pagination
     * @param {Object} filters - { status, roles, search }
     * @param {Object} pagination - { page, limit, sortBy, sortOrder }
     */
    async getUsers(filters = {}, pagination = {}) {
        try {
            const {
                status,
                roles,
                search,
                email,
                isEmailVerified
            } = filters;

            const {
                page = 1,
                limit = 10,
                sortBy = 'createdAt',
                sortOrder = 'desc'
            } = pagination;

            // Build query
            const query = {};

            if (status) {
                query.status = status;
            }

            if (roles) {
                if (Array.isArray(roles)) {
                    query.roles = { $in: roles };
                } else {
                    query.roles = roles;
                }
            }

            if (email) {
                query.email = { $regex: email, $options: 'i' };
            }

            if (isEmailVerified !== undefined) {
                query.isEmailVerified = isEmailVerified === 'true' || isEmailVerified === true;
            }

            // Search functionality
            if (search) {
                query.$or = [
                    { email: { $regex: search, $options: 'i' } },
                    { name: { $regex: search, $options: 'i' } },
                    { username: { $regex: search, $options: 'i' } },
                    { phone: { $regex: search, $options: 'i' } }
                ];
            }

            const skip = (page - 1) * limit;
            const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

            const [users, total] = await Promise.all([
                User.find(query)
                    .select('-passwordHash -refreshTokens -resetPasswordToken -resetPasswordExpires -emailVerificationToken')
                    .sort(sort)
                    .skip(skip)
                    .limit(limit)
                    .lean(),
                User.countDocuments(query)
            ]);

            return {
                users,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit)
                }
            };
        } catch (error) {
            console.error('Get users error:', error);
            throw new AppError('Không thể lấy danh sách người dùng', 500, ErrorCodes.INTERNAL_ERROR);
        }
    },

    /**
     * Lấy user theo ID
     * @param {string} userId - User ID
     */
    async getUserById(userId) {
        try {
            const user = await User.findById(userId)
                .select('-passwordHash -refreshTokens -resetPasswordToken -resetPasswordExpires -emailVerificationToken')
                .lean();

            if (!user) {
                throw new AppError('Người dùng không tồn tại', 404, ErrorCodes.USER_NOT_FOUND);
            }

            return user;
        } catch (error) {
            if (error instanceof AppError) throw error;
            console.error('Get user by ID error:', error);
            throw new AppError('Không thể lấy thông tin người dùng', 500, ErrorCodes.INTERNAL_ERROR);
        }
    },

    /**
     * Tạo user mới (admin only)
     * @param {Object} userData - User data
     */
    async createUser(userData) {
        try {
            const { email, password, name, username, phone, roles, status } = userData;

            // Kiểm tra trùng lặp email
            const emailExists = await User.findOne({ email });
            if (emailExists) {
                throw new AppError('Email đã được đăng ký', 409, ErrorCodes.EMAIL_ALREADY_EXISTS);
            }

            // Kiểm tra trùng lặp username
            if (username) {
                const usernameExists = await User.findOne({ username });
                if (usernameExists) {
                    throw new AppError('Tên người dùng đã được sử dụng', 409, ErrorCodes.USERNAME_ALREADY_EXISTS);
                }
            }

            // Kiểm tra trùng lặp phone
            if (phone) {
                const phoneExists = await User.findOne({ phone });
                if (phoneExists) {
                    throw new AppError('Số điện thoại đã được đăng ký', 409, ErrorCodes.PHONE_ALREADY_EXISTS);
                }
            }

            // Hash password
            const passwordHash = password ? await Password.hash(password) : null;

            const user = await User.create({
                email,
                passwordHash,
                name,
                username: username || email.split('@')[0] + '_' + Date.now().toString().slice(-6),
                phone: phone || '',
                roles: roles || ['student'],
                status: status || 'active',
                isEmailVerified: true, // Admin created users are auto-verified
            });

            return this.getUserById(user._id);
        } catch (error) {
            if (error instanceof AppError) throw error;
            console.error('Create user error:', error);
            throw new AppError('Không thể tạo người dùng', 500, ErrorCodes.INTERNAL_ERROR);
        }
    },

    /**
     * Cập nhật user đầy đủ (Sửa lỗi đồng bộ Roles và bảo mật Token)
     * @param {string} userId - ID người dùng cần sửa
     * @param {Object} updateData - Dữ liệu cập nhật từ Admin
     */
    async updateUser(userId, updateData) {
        try {
            console.log('--- ĐANG CẬP NHẬT USER:', userId, '---');
            console.log('Dữ liệu nhận được:', JSON.stringify(updateData));

            // 1. Chuẩn hóa Role (Frontend gửi 'role' hay 'roles' đều ăn hết)
            const incomingRole = updateData.role || (updateData.roles && updateData.roles[0]);
            if (incomingRole) {
                updateData.roles = Array.isArray(incomingRole) ? incomingRole : [incomingRole];
                updateData.tokenVersion = Math.floor(Date.now() / 1000); // Tăng version để reset login
                delete updateData.role; // Xóa biến thừa
            }

            // 2. Xử lý mật khẩu (nếu có)
            if (updateData.password) {
                updateData.passwordHash = await Password.hash(updateData.password);
                delete updateData.password;
            }

            // 3. DÙNG LỆNH "ÉP" CẬP NHẬT TRỰC TIẾP (Bỏ qua save() rắc rối)
            const updatedUser = await User.findByIdAndUpdate(
                userId,
                { $set: updateData },
                { new: true, runValidators: true } // Trả về data mới nhất và vẫn check Validation
            ).select('-passwordHash -refreshTokens');

            if (!updatedUser) {
                throw new AppError('Người dùng không tồn tại', 404, ErrorCodes.USER_NOT_FOUND);
            }

            console.log('Kết quả sau khi lưu DB:', updatedUser.roles);
            return { user: updatedUser };

        } catch (error) {
            console.error('LỖI UPDATE USER:', error);
            if (error instanceof AppError) throw error;
            throw new AppError('Không thể cập nhật người dùng', 500, ErrorCodes.INTERNAL_ERROR);
        }
    },

    /**
     * Xóa user (soft delete - set status to banned)
     * @param {string} userId - User ID
     */
    async deleteUser(userId) {
        try {
            const user = await User.findById(userId);
            if (!user) {
                throw new AppError('Người dùng không tồn tại', 404, ErrorCodes.USER_NOT_FOUND);
            }

            // Soft delete: set status to banned and invalidate all tokens
            user.status = 'banned';
            user.tokenVersion = (user.tokenVersion || 0) + 1;
            await user.save();

            return { message: 'Đã xóa người dùng thành công' };
        } catch (error) {
            if (error instanceof AppError) throw error;
            console.error('Delete user error:', error);
            throw new AppError('Không thể xóa người dùng', 500, ErrorCodes.INTERNAL_ERROR);
        }
    },

    /**
     * Ban user
     * @param {string} userId - User ID
     */
    async banUser(userId) {
        try {
            const user = await User.findById(userId);
            if (!user) {
                throw new AppError('Người dùng không tồn tại', 404, ErrorCodes.USER_NOT_FOUND);
            }

            user.status = 'banned';
            user.tokenVersion = (user.tokenVersion || 0) + 1; // Invalidate all tokens
            await user.save();

            return this.getUserById(userId);
        } catch (error) {
            if (error instanceof AppError) throw error;
            console.error('Ban user error:', error);
            throw new AppError('Không thể khóa tài khoản', 500, ErrorCodes.INTERNAL_ERROR);
        }
    },

    /**
     * Unban user
     * @param {string} userId - User ID
     */
    async unbanUser(userId) {
        try {
            const user = await User.findById(userId);
            if (!user) {
                throw new AppError('Người dùng không tồn tại', 404, ErrorCodes.USER_NOT_FOUND);
            }

            user.status = 'active';
            await user.save();

            return this.getUserById(userId);
        } catch (error) {
            if (error instanceof AppError) throw error;
            console.error('Unban user error:', error);
            throw new AppError('Không thể mở khóa tài khoản', 500, ErrorCodes.INTERNAL_ERROR);
        }
    },

    /**
     * Cập nhật roles của user
     * @param {string} userId - User ID
     * @param {Array} roles - New roles
     */
    async updateUserRoles(userId, roles) {
        try {
            const user = await User.findById(userId);
            if (!user) {
                throw new AppError('Người dùng không tồn tại', 404, ErrorCodes.USER_NOT_FOUND);
            }

            // Validate roles
            const validRoles = ['student', 'teacher', 'admin'];
            const invalidRoles = roles.filter(role => !validRoles.includes(role));
            if (invalidRoles.length > 0) {
                throw new AppError(`Vai trò không hợp lệ: ${invalidRoles.join(', ')}`, 400, ErrorCodes.INVALID_ROLES);
            }

            user.roles = roles;
            user.tokenVersion = (user.tokenVersion || 0) + 1; // Invalidate tokens when roles change
            await user.save();

            return this.getUserById(userId);
        } catch (error) {
            if (error instanceof AppError) throw error;
            console.error('Update user roles error:', error);
            throw new AppError('Không thể cập nhật vai trò', 500, ErrorCodes.INTERNAL_ERROR);
        }
    },

    /**
     * Lấy user statistics
     */
    async getUserStats() {
        try {
            const stats = await User.aggregate([
                {
                    $group: {
                        _id: '$status',
                        count: { $sum: 1 }
                    }
                }
            ]);

            const roleStats = await User.aggregate([
                {
                    $unwind: '$roles'
                },
                {
                    $group: {
                        _id: '$roles',
                        count: { $sum: 1 }
                    }
                }
            ]);

            const totalUsers = await User.countDocuments();
            const activeUsers = await User.countDocuments({ status: 'active' });
            const verifiedUsers = await User.countDocuments({ isEmailVerified: true });

            return {
                total: totalUsers,
                active: activeUsers,
                verified: verifiedUsers,
                byStatus: stats.reduce((acc, stat) => {
                    acc[stat._id] = stat.count;
                    return acc;
                }, {}),
                byRole: roleStats.reduce((acc, stat) => {
                    acc[stat._id] = stat.count;
                    return acc;
                }, {})
            };
        } catch (error) {
            console.error('Get user stats error:', error);
            throw new AppError('Không thể lấy thống kê người dùng', 500, ErrorCodes.INTERNAL_ERROR);
        }
    }
};

module.exports = UserService;
