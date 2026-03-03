const mongoose = require('mongoose');

const moduleSchema = new mongoose.Schema({
    courseId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course',
        required: true,
        index: true
    },
    title: {
        type: String,
        required: true,
        trim: true,
        maxlength: 200
    },
    description: {
        type: String,
        maxlength: 1000
    },

    // Module ordering
    order: {
        type: Number,
        required: true,
        default: 0
    },

    // Module content
    lessons: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Lesson'
    }],
    totalLessons: {
        type: Number,
        default: 0
    },
    estimatedDuration: {
        type: Number, // in minutes
        default: 0
    },

    // Module settings
    isLocked: {
        type: Boolean,
        default: false
    },
    unlockConditions: {
        requirePreviousModule: {
            type: Boolean,
            default: true
        },
        minimumScore: {
            type: Number,
            default: 0
        },
        requiredLessons: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Lesson'
        }]
    },

    // Learning objectives
    learningObjectives: [String],
    skills: [{
        type: String,
        enum: ['listening', 'speaking', 'reading', 'writing', 'vocabulary', 'grammar', 'pronunciation']
    }],

    // Module type
    type: {
        type: String,
        enum: ['lesson', 'quiz', 'assignment', 'project', 'discussion'],
        default: 'lesson'
    },

    // Status
    status: {
        type: String,
        enum: ['draft', 'published', 'archived'],
        default: 'draft'
    },

    // Resources
    resources: [{
        title: String,
        type: {
            type: String,
            enum: ['pdf', 'video', 'audio', 'link', 'image']
        },
        url: String,
        size: Number, // in bytes
        description: String
    }]
}, {
    timestamps: true,
    toJSON: { virtuals: true }
});

// Indexes
moduleSchema.index({ courseId: 1, order: 1 });
moduleSchema.index({ courseId: 1, status: 1 });

// Virtual for completion tracking
moduleSchema.virtual('completionRate').get(function() {
    // This will be calculated when populated with user progress
    return this._completionRate || 0;
});

// Pre-save middleware to update lesson count
moduleSchema.pre('save', function(next) {
    this.totalLessons = this.lessons.length;
    next();
});

// Methods
moduleSchema.methods.isUnlockedForUser = async function(userId) {
    if (!this.isLocked) return true;

    const UserProgress = mongoose.model('UserProgress');
    const Module = mongoose.model('Module');

    // Check if previous module is completed (if required)
    if (this.unlockConditions.requirePreviousModule) {
        const previousModule = await Module.findOne({
            courseId: this.courseId,
            order: { $lt: this.order }
        }).sort({ order: -1 });

        if (previousModule) {
            const progress = await UserProgress.findOne({
                userId,
                moduleId: previousModule._id,
                status: 'completed'
            });

            if (!progress) return false;

            // Check minimum score if required
            if (this.unlockConditions.minimumScore > 0) {
                if (progress.averageScore < this.unlockConditions.minimumScore) {
                    return false;
                }
            }
        }
    }

    // Check required lessons
    if (this.unlockConditions.requiredLessons.length > 0) {
        const completedLessons = await UserProgress.countDocuments({
            userId,
            lessonId: { $in: this.unlockConditions.requiredLessons },
            status: 'completed'
        });

        if (completedLessons < this.unlockConditions.requiredLessons.length) {
            return false;
        }
    }

    return true;
};

module.exports = mongoose.model('Module', moduleSchema);