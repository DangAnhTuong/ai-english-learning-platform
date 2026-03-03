const mongoose = require('mongoose');

const enrollmentSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    courseId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course',
        required: true
    },

    // Enrollment details
    status: {
        type: String,
        enum: ['active', 'completed', 'dropped', 'suspended', 'expired'],
        default: 'active'
    },
    enrollmentDate: {
        type: Date,
        default: Date.now
    },
    completionDate: Date,
    expiryDate: Date,

    // Progress tracking
    progress: {
        completedLessons: {
            type: Number,
            default: 0
        },
        totalLessons: {
            type: Number,
            default: 0
        },
        completedModules: {
            type: Number,
            default: 0
        },
        totalModules: {
            type: Number,
            default: 0
        },
        completionPercentage: {
            type: Number,
            default: 0
        }
    },

    // Performance metrics
    averageScore: {
        type: Number,
        default: 0
    },
    totalTimeSpent: {
        type: Number, // in minutes
        default: 0
    },
    lastAccessDate: Date,
    currentLesson: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Lesson'
    },
    currentModule: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Module'
    },

    // Learning path customization
    learningPath: [{
        moduleId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Module'
        },
        isCompleted: {
            type: Boolean,
            default: false
        },
        completedAt: Date,
        score: Number
    }],

    // Certificate and achievements
    certificateIssued: {
        type: Boolean,
        default: false
    },
    certificateUrl: String,
    certificateIssuedAt: Date,
    achievements: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Achievement'
    }],

    // Payment and access
    paymentStatus: {
        type: String,
        enum: ['free', 'paid', 'trial', 'scholarship'],
        default: 'free'
    },
    paymentDetails: {
        amount: Number,
        currency: String,
        transactionId: String,
        paymentDate: Date,
        paymentMethod: String
    },

    // Preferences
    notifications: {
        email: {
            type: Boolean,
            default: true
        },
        push: {
            type: Boolean,
            default: true
        },
        reminders: {
            type: Boolean,
            default: true
        }
    },
    studyReminders: {
        enabled: {
            type: Boolean,
            default: false
        },
        frequency: {
            type: String,
            enum: ['daily', 'weekly', 'custom'],
            default: 'daily'
        },
        time: String, // HH:MM format
        days: [Number] // 0-6 for Sunday-Saturday
    },

    // Analytics data
    analytics: {
        sessionCount: {
            type: Number,
            default: 0
        },
        averageSessionDuration: {
            type: Number,
            default: 0
        },
        strugglingAreas: [String],
        strongAreas: [String],
        studyPattern: {
            preferredTime: String,
            averageStudyDuration: Number,
            consistencyScore: Number
        }
    },

    // Feedback and rating
    courseRating: {
        rating: {
            type: Number,
            min: 1,
            max: 5
        },
        review: String,
        ratedAt: Date
    },

    // Notes and bookmarks
    notes: [{
        lessonId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Lesson'
        },
        content: String,
        timestamp: Number, // for video/audio content
        createdAt: {
            type: Date,
            default: Date.now
        }
    }],
    bookmarks: [{
        lessonId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Lesson'
        },
        timestamp: Number,
        note: String,
        createdAt: {
            type: Date,
            default: Date.now
        }
    }]
}, {
    timestamps: true,
    toJSON: { virtuals: true }
});

// Compound indexes
enrollmentSchema.index({ userId: 1, courseId: 1 }, { unique: true });
enrollmentSchema.index({ userId: 1, status: 1 });
enrollmentSchema.index({ courseId: 1, status: 1 });
enrollmentSchema.index({ enrollmentDate: -1 });
enrollmentSchema.index({ lastAccessDate: -1 });

// Virtual for completion status
enrollmentSchema.virtual('isCompleted').get(function () {
    return this.status === 'completed' || this.progress.completionPercentage >= 100;
});

// Virtual for days since enrollment
enrollmentSchema.virtual('daysSinceEnrollment').get(function () {
    return Math.floor((Date.now() - this.enrollmentDate) / (1000 * 60 * 60 * 24));
});

// Virtual for days since last access
enrollmentSchema.virtual('daysSinceLastAccess').get(function () {
    if (!this.lastAccessDate) return null;
    return Math.floor((Date.now() - this.lastAccessDate) / (1000 * 60 * 60 * 24));
});

// Methods
enrollmentSchema.methods.updateProgress = async function () {
    const UserProgress = mongoose.model('UserProgress');
    const Course = mongoose.model('Course');

    // Get course details
    const course = await Course.findById(this.courseId);
    if (!course) return;

    // Calculate completed lessons
    const completedLessons = await UserProgress.countDocuments({
        userId: this.userId,
        courseId: this.courseId,
        type: 'lesson',
        status: 'completed'
    });

    // Calculate completed modules
    const completedModules = await UserProgress.countDocuments({
        userId: this.userId,
        courseId: this.courseId,
        type: 'module',
        status: 'completed'
    });

    // Calculate average score
    const scoreAgg = await UserProgress.aggregate([
        {
            $match: {
                userId: this.userId,
                courseId: this.courseId,
                score: { $exists: true, $ne: null }
            }
        },
        {
            $group: {
                _id: null,
                averageScore: { $avg: '$score' }
            }
        }
    ]);

    // Update progress
    this.progress.completedLessons = completedLessons;
    this.progress.totalLessons = course.totalLessons;
    this.progress.completedModules = completedModules;
    this.progress.totalModules = course.modules.length;
    this.progress.completionPercentage = course.totalLessons > 0
        ? Math.round((completedLessons / course.totalLessons) * 100)
        : 0;

    if (scoreAgg.length > 0) {
        this.averageScore = Math.round(scoreAgg[0].averageScore);
    }

    // Check if course is completed
    if (this.progress.completionPercentage >= 100 && this.status === 'active') {
        this.status = 'completed';
        this.completionDate = new Date();
    }

    this.lastAccessDate = new Date();
    await this.save();
};

enrollmentSchema.methods.addNote = function (lessonId, content, timestamp = null) {
    this.notes.push({
        lessonId,
        content,
        timestamp
    });
    return this.save();
};

enrollmentSchema.methods.addBookmark = function (lessonId, timestamp = null, note = '') {
    this.bookmarks.push({
        lessonId,
        timestamp,
        note
    });
    return this.save();
};

enrollmentSchema.methods.rateC9ourse = function (rating, review = '') {
    this.courseRating = {
        rating,
        review,
        ratedAt: new Date()
    };
    return this.save();
};

// Pre-save middleware
enrollmentSchema.pre('save', function (next) {
    // Update analytics
    if (this.isModified('lastAccessDate')) {
        this.analytics.sessionCount += 1;
    }

    next();
});

// Static methods
enrollmentSchema.statics.getEnrollmentStats = async function (courseId) {
    const stats = await this.aggregate([
        { $match: { courseId: new mongoose.Types.ObjectId(courseId) } },
        {
            $group: {
                _id: '$status',
                count: { $sum: 1 }
            }
        }
    ]);

    const result = {
        total: 0,
        active: 0,
        completed: 0,
        dropped: 0,
        suspended: 0
    };

    stats.forEach(stat => {
        result[stat._id] = stat.count;
        result.total += stat.count;
    });

    return result;
};

module.exports = mongoose.model('Enrollment', enrollmentSchema);