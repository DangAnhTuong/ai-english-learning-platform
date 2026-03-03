const mongoose = require('mongoose');

// Individual lesson/module/course progress tracking
const userProgressSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    // Content identification
    courseId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course',
        required: true,
    },
    moduleId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Module',
    },
    lessonId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Lesson',
    },

    // Progress type
    type: {
        type: String,
        enum: ['lesson', 'module', 'course', 'exercise', 'quiz', 'assignment'],
        required: true
    },

    // Progress status
    status: {
        type: String,
        enum: ['not_started', 'in_progress', 'completed', 'failed', 'skipped'],
        default: 'not_started'
    },

    // Time tracking
    startedAt: Date,
    completedAt: Date,
    timeSpent: {
        type: Number, // in minutes
        default: 0
    },
    lastAccessedAt: {
        type: Date,
        default: Date.now
    },

    // Performance metrics
    score: {
        type: Number,
        min: 0,
        max: 100
    },
    maxScore: {
        type: Number,
        default: 100
    },
    attempts: {
        type: Number,
        default: 0
    },
    bestScore: {
        type: Number,
        min: 0,
        max: 100
    },

    // Detailed exercise results
    exerciseResults: [{
        exerciseId: String,
        userAnswer: mongoose.Schema.Types.Mixed,
        correctAnswer: mongoose.Schema.Types.Mixed,
        isCorrect: Boolean,
        points: Number,
        timeSpent: Number, // in seconds
        attempts: Number,
        hint: String
    }],

    // Learning data
    skillsImproved: [{
        skill: {
            type: String,
            enum: ['listening', 'speaking', 'reading', 'writing', 'vocabulary', 'grammar', 'pronunciation']
        },
        improvementPoints: Number
    }],
    wordsLearned: [String],
    grammarPointsLearned: [String],

    // Progress checkpoints for long content
    checkpoints: [{
        position: Number, // percentage of content
        timestamp: Date,
        note: String
    }],

    // Video/Audio specific progress
    mediaProgress: {
        currentPosition: {
            type: Number, // in seconds
            default: 0
        },
        totalDuration: Number,
        playbackSpeed: {
            type: Number,
            default: 1.0
        },
        watchedSegments: [{
            start: Number,
            end: Number
        }]
    },

    // Difficulty and adaptivity
    perceivedDifficulty: {
        type: String,
        enum: ['very_easy', 'easy', 'medium', 'hard', 'very_hard']
    },
    suggestedNextLevel: {
        type: String,
        enum: ['easier', 'same', 'harder']
    },

    // User interactions
    interactions: {
        paused: {
            type: Number,
            default: 0
        },
        replayed: {
            type: Number,
            default: 0
        },
        skipped: {
            type: Number,
            default: 0
        },
        hintUsed: {
            type: Number,
            default: 0
        }
    },

    // Feedback
    userFeedback: {
        rating: {
            type: Number,
            min: 1,
            max: 5
        },
        comment: String,
        reportedIssues: [String],
        submittedAt: Date
    },

    // Metadata for analytics
    metadata: {
        deviceType: String,
        platform: String,
        userAgent: String,
        sessionId: String,
        studyMode: {
            type: String,
            enum: ['focused', 'review', 'practice', 'exam']
        }
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true }
});

// Compound indexes for performance
userProgressSchema.index({ userId: 1, courseId: 1, type: 1 });
userProgressSchema.index({ userId: 1, lessonId: 1 }, { unique: true, sparse: true });
userProgressSchema.index({ userId: 1, moduleId: 1, type: 1 });
userProgressSchema.index({ userId: 1, status: 1 });
userProgressSchema.index({ courseId: 1, status: 1 });
userProgressSchema.index({ completedAt: -1 });
userProgressSchema.index({ score: -1 });

// Virtual for completion percentage
userProgressSchema.virtual('completionPercentage').get(function () {
    if (this.type === 'lesson' && this.mediaProgress.totalDuration) {
        return Math.round((this.mediaProgress.currentPosition / this.mediaProgress.totalDuration) * 100);
    }
    return this.status === 'completed' ? 100 : 0;
});

// Virtual for pass/fail status
userProgressSchema.virtual('passed').get(function () {
    if (this.score === null || this.score === undefined) return null;
    return this.score >= 70; // Default passing score
});

// Virtual for time efficiency
userProgressSchema.virtual('timeEfficiency').get(function () {
    if (!this.timeSpent || !this.score) return null;
    return Math.round(this.score / this.timeSpent); // Points per minute
});

// Methods
userProgressSchema.methods.updateProgress = function (progressData) {
    Object.assign(this, progressData);
    this.lastAccessedAt = new Date();

    if (this.status === 'completed' && !this.completedAt) {
        this.completedAt = new Date();
    }

    if (this.status === 'in_progress' && !this.startedAt) {
        this.startedAt = new Date();
    }

    // Update best score
    if (this.score && (!this.bestScore || this.score > this.bestScore)) {
        this.bestScore = this.score;
    }

    return this.save();
};

userProgressSchema.methods.addExerciseResult = function (exerciseResult) {
    this.exerciseResults.push(exerciseResult);
    this.attempts += 1;

    // Recalculate overall score
    if (this.exerciseResults.length > 0) {
        const totalPoints = this.exerciseResults.reduce((sum, result) => sum + (result.points || 0), 0);
        const maxPoints = this.exerciseResults.length * 10; // Assuming 10 points per exercise
        this.score = Math.round((totalPoints / maxPoints) * 100);
    }

    return this.save();
};

userProgressSchema.methods.updateMediaProgress = function (position, duration = null) {
    this.mediaProgress.currentPosition = position;
    if (duration) {
        this.mediaProgress.totalDuration = duration;
    }

    // Auto-complete if watched 90% or more
    const completionThreshold = 0.9;
    if (this.mediaProgress.totalDuration &&
        position >= this.mediaProgress.totalDuration * completionThreshold &&
        this.status !== 'completed') {
        this.status = 'completed';
        this.completedAt = new Date();
    }

    this.lastAccessedAt = new Date();
    return this.save();
};

userProgressSchema.methods.addCheckpoint = function (position, note = '') {
    this.checkpoints.push({
        position,
        timestamp: new Date(),
        note
    });

    // Keep only last 10 checkpoints
    if (this.checkpoints.length > 10) {
        this.checkpoints = this.checkpoints.slice(-10);
    }

    return this.save();
};

userProgressSchema.methods.submitFeedback = function (rating, comment = '', issues = []) {
    this.userFeedback = {
        rating,
        comment,
        reportedIssues: issues,
        submittedAt: new Date()
    };

    return this.save();
};

// Static methods
userProgressSchema.statics.getUserCourseProgress = async function (userId, courseId) {
    const results = await this.aggregate([
        {
            $match: {
                userId: new mongoose.Types.ObjectId(userId),
                courseId: new mongoose.Types.ObjectId(courseId)
            }
        },
        {
            $group: {
                _id: '$type',
                total: { $sum: 1 },
                completed: {
                    $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
                },
                averageScore: { $avg: '$score' },
                totalTimeSpent: { $sum: '$timeSpent' }
            }
        }
    ]);

    return results.reduce((acc, result) => {
        acc[result._id] = result;
        return acc;
    }, {});
};

userProgressSchema.statics.getLeaderboard = async function (courseId, limit = 10) {
    return await this.aggregate([
        {
            $match: {
                courseId: new mongoose.Types.ObjectId(courseId),
                type: 'course',
                status: 'completed'
            }
        },
        {
            $lookup: {
                from: 'users',
                localField: 'userId',
                foreignField: '_id',
                as: 'user'
            }
        },
        {
            $unwind: '$user'
        },
        {
            $sort: { score: -1, completedAt: 1 }
        },
        {
            $limit: limit
        },
        {
            $project: {
                'user.name': 1,
                'user.avatar': 1,
                score: 1,
                completedAt: 1,
                timeSpent: 1
            }
        }
    ]);
};

// Pre-save middleware
userProgressSchema.pre('save', function (next) {
    // Update timestamps
    if (this.isModified('status')) {
        if (this.status === 'in_progress' && !this.startedAt) {
            this.startedAt = new Date();
        }
        if (this.status === 'completed' && !this.completedAt) {
            this.completedAt = new Date();
        }
    }

    next();
});

// Post-save middleware to update overall progress
userProgressSchema.post('save', async function (doc) {
    // Update user's overall progress
    const Progress = mongoose.model('Progress');
    const userProgress = await Progress.findOne({ userId: doc.userId });

    if (userProgress && doc.status === 'completed') {
        if (doc.type === 'lesson') {
            userProgress.lessonsCompleted += 1;
        } else if (doc.type === 'exercise') {
            userProgress.exercisesCompleted += 1;
        }

        userProgress.addStudyTime(doc.timeSpent || 0, doc.skillsImproved.map(s => s.skill));
        if (doc.score) {
            userProgress.addPoints(Math.round(doc.score));
        }

        await userProgress.save();
    }
});

module.exports = mongoose.model('UserProgress', userProgressSchema);