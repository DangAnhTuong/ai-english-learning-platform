const ProgressService = require('../services/progress.service');

// Wrapper function to handle async errors
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

const ProgressController = {
    completeLesson: asyncHandler(async (req, res) => {
        const { courseId, lessonId } = req.body;
        const userId = req.user._id || req.user.id;

        const result = await ProgressService.completeLesson(userId, courseId, lessonId);

        res.status(200).json({
            success: true,
            message: result.message,
            data: {
                progress: result.progress,
                enrollment: result.enrollment
            }
        });
    }),

    getCourseProgress: asyncHandler(async (req, res) => {
        const { courseId } = req.params;
        const userId = req.user._id || req.user.id;

        const result = await ProgressService.getCourseProgress(userId, courseId);

        res.status(200).json({
            success: true,
            data: result
        });
    })
};

module.exports = ProgressController;
