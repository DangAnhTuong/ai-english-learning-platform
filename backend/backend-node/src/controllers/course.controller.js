const CourseService = require('../services/course.service');
const AppError = require('../utils/AppError');
const ErrorCodes = require('../constants/errorCodes');

// Wrapper function to handle async errors
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

const CourseController = {
    createCourse: asyncHandler(async (req, res) => {
        const course = await CourseService.createCourse(req.body, req.user.id);

        res.status(201).json({
            success: true,
            message: 'Tạo khóa học thành công',
            data: { course }
        });
    }),

    getCourses: asyncHandler(async (req, res) => {
        const filters = {
            category: req.query.category,
            level: req.query.level,
            difficulty: req.query.difficulty,
            enrollmentType: req.query.enrollmentType,
            tags: req.query.tags ? req.query.tags.split(',') : undefined,
            search: req.query.search,
            creatorId: req.query.creatorId,
            status: req.query.status
        };

        const pagination = {
            page: parseInt(req.query.page) || 1,
            limit: parseInt(req.query.limit) || 10,
            sortBy: req.query.sortBy,
            sortOrder: req.query.sortOrder
        };

        const result = await CourseService.getCourses(filters, pagination, req.user?.id);

        res.json({
            success: true,
            data: result
        });
    }),

    getCourseById: asyncHandler(async (req, res) => {
        const { courseId } = req.params;
        const result = await CourseService.getCourseById(courseId, req.user?.id);

        res.json({
            success: true,
            data: result
        });
    }),

    updateCourse: asyncHandler(async (req, res) => {
        const { courseId } = req.params;
        const course = await CourseService.updateCourse(courseId, req.body, req.user.id);

        res.json({
            success: true,
            message: 'Cập nhật khóa học thành công',
            data: { course }
        });
    }),

    deleteCourse: asyncHandler(async (req, res) => {
        const { courseId } = req.params;
        const result = await CourseService.deleteCourse(courseId, req.user.id);

        res.json({
            success: true,
            message: result.message
        });
    }),

    enrollInCourse: asyncHandler(async (req, res) => {
        const { courseId } = req.params;
        const enrollment = await CourseService.enrollInCourse(courseId, req.user.id);

        res.status(201).json({
            success: true,
            message: 'Đăng ký khóa học thành công',
            data: { enrollment }
        });
    }),

    unenrollFromCourse: asyncHandler(async (req, res) => {
        const { courseId } = req.params;
        const result = await CourseService.unenrollFromCourse(courseId, req.user.id);

        res.json({
            success: true,
            message: result.message
        });
    }),

    publishCourse: asyncHandler(async (req, res) => {
        const { courseId } = req.params;
        const course = await CourseService.publishCourse(courseId, req.user.id);

        res.json({
            success: true,
            message: 'Xuất bản khóa học thành công',
            data: { course }
        });
    }),

    unpublishCourse: asyncHandler(async (req, res) => {
        const { courseId } = req.params;
        const course = await CourseService.updateCourse(
            courseId,
            { status: 'draft' },
            req.user.id
        );

        res.json({
            success: true,
            message: 'Hủy xuất bản khóa học thành công',
            data: { course }
        });
    }),

    getCourseAnalytics: asyncHandler(async (req, res) => {
        const { courseId } = req.params;
        const analytics = await CourseService.getCourseAnalytics(courseId, req.user.id);

        res.json({
            success: true,
            data: { analytics }
        });
    }),

    // Get courses created by current user
    getMyCourses: asyncHandler(async (req, res) => {
        const filters = {
            ...req.query,
            creatorId: req.user.id
        };

        const pagination = {
            page: parseInt(req.query.page) || 1,
            limit: parseInt(req.query.limit) || 10,
            sortBy: req.query.sortBy || 'createdAt',
            sortOrder: req.query.sortOrder || 'desc'
        };

        const result = await CourseService.getCourses(filters, pagination, req.user.id);

        res.json({
            success: true,
            data: result
        });
    }),

    // Get courses user is enrolled in
    getEnrolledCourses: asyncHandler(async (req, res) => {
        const Enrollment = require('../models/enrollment');

        const enrollments = await Enrollment.find({ userId: req.user.id })
            .populate({
                path: 'courseId',
                populate: {
                    path: 'creator',
                    select: 'name email avatar'
                }
            })
            .sort({ enrollmentDate: -1 });

        const courses = enrollments.map(enrollment => ({
            course: enrollment.courseId,
            enrollment: {
                status: enrollment.status,
                progress: enrollment.progress,
                enrollmentDate: enrollment.enrollmentDate,
                lastAccessDate: enrollment.lastAccessDate
            }
        }));

        res.json({
            success: true,
            data: { courses }
        });
    }),

    // Get featured/recommended courses
    getFeaturedCourses: asyncHandler(async (req, res) => {
        const filters = {
            status: 'published',
            isPublic: true
        };

        const pagination = {
            page: 1,
            limit: 6,
            sortBy: 'averageRating',
            sortOrder: 'desc'
        };

        const result = await CourseService.getCourses(filters, pagination, req.user?.id);

        res.json({
            success: true,
            data: result
        });
    }),

    // Get course categories and statistics
    getCourseCategories: asyncHandler(async (req, res) => {
        const Course = require('../models/course');

        const categories = await Course.aggregate([
            { $match: { status: 'published', isPublic: true } },
            {
                $group: {
                    _id: '$category',
                    count: { $sum: 1 },
                    averageRating: { $avg: '$averageRating' },
                    totalEnrollments: { $sum: '$enrolledStudents' }
                }
            },
            { $sort: { count: -1 } }
        ]);

        res.json({
            success: true,
            data: { categories }
        });
    })
};

module.exports = CourseController;