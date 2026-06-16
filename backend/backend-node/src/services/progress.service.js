const UserProgress = require('../models/userProgress');
const Enrollment = require('../models/enrollment');
const AppError = require('../utils/AppError');

class ProgressService {
    /**
     * Mark a lesson as completed and update course progress
     */
    static async completeLesson(userId, courseId, lessonId) {
        // 1. Ensure user is enrolled
        const enrollment = await Enrollment.findOne({ userId, courseId });
        if (!enrollment) {
            throw new AppError({
                error: 'Bạn chưa đăng ký khóa học này',
                code: 'NOT_ENROLLED'
            }, 403);
        }

        // 2. Find or create UserProgress for this lesson
        let progress = await UserProgress.findOne({ userId, courseId, lessonId, type: 'lesson' });
        
        if (!progress) {
            progress = new UserProgress({
                userId,
                courseId,
                lessonId,
                type: 'lesson',
                status: 'completed',
                startedAt: new Date(),
                completedAt: new Date(),
                score: 100 // Default score for just completing
            });
        } else {
            if (progress.status === 'completed') {
                return { message: 'Bài học đã được hoàn thành từ trước', progress, enrollment };
            }
            progress.status = 'completed';
            progress.completedAt = new Date();
        }

        await progress.save();

        // 3. Trigger course progress recalculation
        await enrollment.updateProgress();

        // 4. Update User Streak
        const User = require('../models/userSchema');
        const user = await User.findById(userId);
        if (user) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const lastStudyDate = user.lastStudyDate ? new Date(user.lastStudyDate) : null;
            if (lastStudyDate) {
                lastStudyDate.setHours(0, 0, 0, 0);
            }

            const diffTime = lastStudyDate ? Math.abs(today - lastStudyDate) : -1;
            const diffDays = lastStudyDate ? Math.ceil(diffTime / (1000 * 60 * 60 * 24)) : -1;

            if (diffDays === 1) {
                // Studied yesterday, increment streak
                user.currentStreak += 1;
            } else if (diffDays > 1 || diffDays === -1) {
                // Missed a day or first time studying
                user.currentStreak = 1;
            }
            // If diffDays === 0, already studied today, do nothing

            if (user.currentStreak > user.longestStreak) {
                user.longestStreak = user.currentStreak;
            }
            user.lastStudyDate = new Date();
            await user.save();
        }

        return { message: 'Đã hoàn thành bài học', progress, enrollment, streak: user?.currentStreak };
    }

    /**
     * Get user progress for a specific course
     */
    static async getCourseProgress(userId, courseId) {
        const enrollment = await Enrollment.findOne({ userId, courseId });
        if (!enrollment) {
            throw new AppError({
                error: 'Bạn chưa đăng ký khóa học này',
                code: 'NOT_ENROLLED'
            }, 403);
        }

        const completedLessonsData = await UserProgress.find({
            userId,
            courseId,
            type: 'lesson',
            status: 'completed'
        }).select('lessonId completedAt score');

        return {
            enrollment,
            completedLessons: completedLessonsData.map(p => p.lessonId)
        };
    }
}

module.exports = ProgressService;
