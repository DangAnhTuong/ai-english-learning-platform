const Course = require('../models/course');
const Module = require('../models/module');
const Lesson = require('../models/lesson');
const Enrollment = require('../models/enrollment');
const UserProgress = require('../models/userProgress');
const Progress = require('../models/progress');
const AppError = require('../utils/AppError');
const ErrorCodes = require('../constants/errorCodes');
const slugify = require('slugify');

const CourseService = {
    async createCourse(courseData, creatorId) {
        try {
            // Generate slug from title
            courseData.slug = slugify(courseData.title, {
                lower: true,
                strict: true,
                remove: /[*+~.()'"!:@]/g
            });

            // Check for duplicate slug
            const existingCourse = await Course.findOne({ slug: courseData.slug });
            if (existingCourse) {
                courseData.slug = `${courseData.slug}-${Date.now()}`;
            }

            courseData.creator = creatorId;
            courseData.instructors = [creatorId];

            const course = await Course.create(courseData);
            return course;
        } catch (error) {
            console.error('Create course error:', error);
            throw new AppError('Không thể tạo khóa học', 500, ErrorCodes.INTERNAL_ERROR);
        }
    },

    async getCourses(filters = {}, pagination = {}, userId = null) {
        try {
            const {
                category,
                level,
                difficulty,
                enrollmentType,
                tags,
                search,
                creatorId,
                status = 'published'
            } = filters;

            const {
                page = 1,
                limit = 10,
                sortBy = 'createdAt',
                sortOrder = 'desc'
            } = pagination;

            // Build query
            const query = { status };

            if (category) query.category = category;
            if (level) query.level = level;
            if (difficulty) query.difficulty = difficulty;
            if (enrollmentType) query.enrollmentType = enrollmentType;
            if (creatorId) query.creator = creatorId;
            if (tags && tags.length > 0) query.tags = { $in: tags };

            // Search functionality
            if (search) {
                query.$or = [
                    { title: { $regex: search, $options: 'i' } },
                    { description: { $regex: search, $options: 'i' } },
                    { tags: { $regex: search, $options: 'i' } }
                ];
            }

            // Public courses only unless user has special permissions
            if (!userId || status === 'published') {
                query.isPublic = true;
            }

            const skip = (page - 1) * limit;
            const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

            const [courses, total] = await Promise.all([
                Course.find(query)
                    .populate('creator', 'name email avatar')
                    .populate('instructors', 'name email avatar')
                    .sort(sort)
                    .skip(skip)
                    .limit(limit)
                    .lean(),
                Course.countDocuments(query)
            ]);

            // Add enrollment status if user is provided
            if (userId) {
                const enrollments = await Enrollment.find({
                    userId,
                    courseId: { $in: courses.map(c => c._id) }
                }).lean();

                const enrollmentMap = enrollments.reduce((acc, enrollment) => {
                    acc[enrollment.courseId.toString()] = enrollment;
                    return acc;
                }, {});

                courses.forEach(course => {
                    course.enrollmentStatus = enrollmentMap[course._id.toString()] || null;
                });
            }

            return {
                courses,
                pagination: {
                    currentPage: page,
                    totalPages: Math.ceil(total / limit),
                    totalCourses: total,
                    hasNext: page < Math.ceil(total / limit),
                    hasPrev: page > 1
                }
            };
        } catch (error) {
            console.error('Get courses error:', error);
            throw new AppError('Không thể lấy danh sách khóa học', 500, ErrorCodes.INTERNAL_ERROR);
        }
    },

    async getCourseById(courseId, userId = null) {
        try {
            const course = await Course.findById(courseId)
                .populate('creator', 'name email avatar')
                .populate('instructors', 'name email avatar')
                .populate({
                    path: 'modules',
                    populate: {
                        path: 'lessons',
                        select: 'title order duration type isPreview'
                    }
                });

            if (!course) {
                throw new AppError('Không tìm thấy khóa học', 404, ErrorCodes.COURSE_NOT_FOUND);
            }

            // Check access permissions
            if (!course.canUserAccess({ id: userId })) {
                throw new AppError('Không có quyền truy cập khóa học này', 403, ErrorCodes.AUTH_INSUFFICIENT_PERMISSIONS);
            }

            // Get enrollment status and progress if user is logged in
            let enrollmentStatus = null;
            let userProgress = null;

            if (userId) {
                enrollmentStatus = await Enrollment.findOne({
                    userId,
                    courseId: course._id
                });

                if (enrollmentStatus) {
                    userProgress = await UserProgress.getUserCourseProgress(userId, course._id);
                }
            }

            return {
                course: course.toObject(),
                enrollmentStatus,
                userProgress
            };
        } catch (error) {
            if (error instanceof AppError) throw error;
            console.error('Get course by ID error:', error);
            throw new AppError('Không thể lấy thông tin khóa học', 500, ErrorCodes.INTERNAL_ERROR);
        }
    },

    async updateCourse(courseId, updateData, userId) {
        try {
            const course = await Course.findById(courseId);

            if (!course) {
                throw new AppError('Không tìm thấy khóa học', 404, ErrorCodes.COURSE_NOT_FOUND);
            }

            // Check permissions
            if (course.creator.toString() !== userId.toString()) {
                throw new AppError('Không có quyền chỉnh sửa khóa học này', 403, ErrorCodes.AUTH_INSUFFICIENT_PERMISSIONS);
            }

            // Update slug if title changed
            if (updateData.title && updateData.title !== course.title) {
                updateData.slug = slugify(updateData.title, {
                    lower: true,
                    strict: true,
                    remove: /[*+~.()'"!:@]/g
                });

                // Check for duplicate slug
                const existingCourse = await Course.findOne({
                    slug: updateData.slug,
                    _id: { $ne: courseId }
                });

                if (existingCourse) {
                    updateData.slug = `${updateData.slug}-${Date.now()}`;
                }
            }

            const updatedCourse = await Course.findByIdAndUpdate(
                courseId,
                updateData,
                { new: true, runValidators: true }
            ).populate('creator', 'name email avatar')
             .populate('instructors', 'name email avatar');

            return updatedCourse;
        } catch (error) {
            if (error instanceof AppError) throw error;
            console.error('Update course error:', error);
            throw new AppError('Không thể cập nhật khóa học', 500, ErrorCodes.INTERNAL_ERROR);
        }
    },

    async deleteCourse(courseId, userId) {
        try {
            const course = await Course.findById(courseId);

            if (!course) {
                throw new AppError('Không tìm thấy khóa học', 404, ErrorCodes.COURSE_NOT_FOUND);
            }

            // Check permissions
            if (course.creator.toString() !== userId.toString()) {
                throw new AppError('Không có quyền xóa khóa học này', 403, ErrorCodes.AUTH_INSUFFICIENT_PERMISSIONS);
            }

            // Check if course has enrollments
            const enrollmentCount = await Enrollment.countDocuments({ courseId });
            if (enrollmentCount > 0) {
                throw new AppError('Không thể xóa khóa học đã có học viên đăng ký', 400, ErrorCodes.COURSE_HAS_ENROLLMENTS);
            }

            // Delete related data
            await Promise.all([
                Module.deleteMany({ courseId }),
                Lesson.deleteMany({ courseId }),
                UserProgress.deleteMany({ courseId }),
                Course.findByIdAndDelete(courseId)
            ]);

            return { message: 'Xóa khóa học thành công' };
        } catch (error) {
            if (error instanceof AppError) throw error;
            console.error('Delete course error:', error);
            throw new AppError('Không thể xóa khóa học', 500, ErrorCodes.INTERNAL_ERROR);
        }
    },

    async enrollInCourse(courseId, userId) {
        try {
            const course = await Course.findById(courseId);

            if (!course) {
                throw new AppError('Không tìm thấy khóa học', 404, ErrorCodes.COURSE_NOT_FOUND);
            }

            if (course.status !== 'published') {
                throw new AppError('Khóa học chưa được xuất bản', 400, ErrorCodes.COURSE_NOT_PUBLISHED);
            }

            // Check if already enrolled
            const existingEnrollment = await Enrollment.findOne({
                userId,
                courseId
            });

            if (existingEnrollment) {
                throw new AppError('Bạn đã đăng ký khóa học này rồi', 409, ErrorCodes.ALREADY_ENROLLED);
            }

            // Create enrollment
            const enrollment = await Enrollment.create({
                userId,
                courseId,
                progress: {
                    totalLessons: course.totalLessons,
                    totalModules: course.modules.length
                }
            });

            // Update course enrollment count
            await Course.findByIdAndUpdate(courseId, {
                $inc: { enrolledStudents: 1 }
            });

            // Update user's overall progress
            const userProgress = await Progress.findOne({ userId });
            if (userProgress) {
                userProgress.coursesEnrolled += 1;
                await userProgress.save();
            }

            return enrollment;
        } catch (error) {
            if (error instanceof AppError) throw error;
            console.error('Enroll in course error:', error);
            throw new AppError('Không thể đăng ký khóa học', 500, ErrorCodes.INTERNAL_ERROR);
        }
    },

    async unenrollFromCourse(courseId, userId) {
        try {
            const enrollment = await Enrollment.findOne({
                userId,
                courseId
            });

            if (!enrollment) {
                throw new AppError('Bạn chưa đăng ký khóa học này', 404, ErrorCodes.NOT_ENROLLED);
            }

            if (enrollment.status === 'completed') {
                throw new AppError('Không thể hủy đăng ký khóa học đã hoàn thành', 400, ErrorCodes.COURSE_ALREADY_COMPLETED);
            }

            // Delete enrollment and related progress
            await Promise.all([
                Enrollment.findByIdAndDelete(enrollment._id),
                UserProgress.deleteMany({ userId, courseId })
            ]);

            // Update course enrollment count
            await Course.findByIdAndUpdate(courseId, {
                $inc: { enrolledStudents: -1 }
            });

            // Update user's overall progress
            const userProgress = await Progress.findOne({ userId });
            if (userProgress) {
                userProgress.coursesEnrolled = Math.max(0, userProgress.coursesEnrolled - 1);
                await userProgress.save();
            }

            return { message: 'Hủy đăng ký khóa học thành công' };
        } catch (error) {
            if (error instanceof AppError) throw error;
            console.error('Unenroll from course error:', error);
            throw new AppError('Không thể hủy đăng ký khóa học', 500, ErrorCodes.INTERNAL_ERROR);
        }
    },

    async publishCourse(courseId, userId) {
        try {
            const course = await Course.findById(courseId);

            if (!course) {
                throw new AppError('Không tìm thấy khóa học', 404, ErrorCodes.COURSE_NOT_FOUND);
            }

            // Check permissions
            if (course.creator.toString() !== userId.toString()) {
                throw new AppError('Không có quyền xuất bản khóa học này', 403, ErrorCodes.AUTH_INSUFFICIENT_PERMISSIONS);
            }

            const requireContentForPublish = process.env.REQUIRE_COURSE_CONTENT_FOR_PUBLISH === 'true';
            if (requireContentForPublish) {
                const moduleCount = await Module.countDocuments({ courseId });
                if (moduleCount === 0) {
                    throw new AppError('Khoa hoc phai co it nhat 1 module de xuat ban', 400, ErrorCodes.COURSE_INCOMPLETE);
                }

                const lessonCount = await Lesson.countDocuments({ courseId });
                if (lessonCount === 0) {
                    throw new AppError('Khoa hoc phai co it nhat 1 bai hoc de xuat ban', 400, ErrorCodes.COURSE_INCOMPLETE);
                }
            }

            course.status = 'published';
            course.publishedAt = new Date();
            await course.save();

            return course;
        } catch (error) {
            if (error instanceof AppError) throw error;
            console.error('Publish course error:', error);
            throw new AppError('Không thể xuất bản khóa học', 500, ErrorCodes.INTERNAL_ERROR);
        }
    },

    async getCourseAnalytics(courseId, userId) {
        try {
            const course = await Course.findById(courseId);

            if (!course) {
                throw new AppError('Không tìm thấy khóa học', 404, ErrorCodes.COURSE_NOT_FOUND);
            }

            // Check permissions
            if (course.creator.toString() !== userId.toString()) {
                throw new AppError('Không có quyền xem phân tích khóa học này', 403, ErrorCodes.AUTH_INSUFFICIENT_PERMISSIONS);
            }

            const [
                enrollmentStats,
                completionStats,
                revenueStats,
                ratingStats
            ] = await Promise.all([
                Enrollment.getEnrollmentStats(courseId),
                this.getCourseCompletionStats(courseId),
                this.getCourseRevenueStats(courseId),
                this.getCourseRatingStats(courseId)
            ]);

            return {
                course: {
                    id: course._id,
                    title: course.title,
                    createdAt: course.createdAt
                },
                enrollments: enrollmentStats,
                completion: completionStats,
                revenue: revenueStats,
                ratings: ratingStats
            };
        } catch (error) {
            if (error instanceof AppError) throw error;
            console.error('Get course analytics error:', error);
            throw new AppError('Không thể lấy phân tích khóa học', 500, ErrorCodes.INTERNAL_ERROR);
        }
    },

    async getCourseCompletionStats(courseId) {
        const stats = await UserProgress.aggregate([
            { $match: { courseId: new mongoose.Types.ObjectId(courseId), type: 'course' } },
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 },
                    averageScore: { $avg: '$score' },
                    averageTime: { $avg: '$timeSpent' }
                }
            }
        ]);

        return stats;
    },

    async getCourseRevenueStats(courseId) {
        const stats = await Enrollment.aggregate([
            { $match: { courseId: new mongoose.Types.ObjectId(courseId), paymentStatus: 'paid' } },
            {
                $group: {
                    _id: null,
                    totalRevenue: { $sum: '$paymentDetails.amount' },
                    totalPaidEnrollments: { $sum: 1 }
                }
            }
        ]);

        return stats[0] || { totalRevenue: 0, totalPaidEnrollments: 0 };
    },

    async getCourseRatingStats(courseId) {
        const stats = await Enrollment.aggregate([
            {
                $match: {
                    courseId: new mongoose.Types.ObjectId(courseId),
                    'courseRating.rating': { $exists: true }
                }
            },
            {
                $group: {
                    _id: null,
                    averageRating: { $avg: '$courseRating.rating' },
                    totalRatings: { $sum: 1 },
                    ratingDistribution: {
                        $push: '$courseRating.rating'
                    }
                }
            }
        ]);

        return stats[0] || { averageRating: 0, totalRatings: 0, ratingDistribution: [] };
    }
};

module.exports = CourseService;