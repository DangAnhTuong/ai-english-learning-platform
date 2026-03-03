const mongoose = require('mongoose');

const exerciseSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ['multiple_choice', 'fill_blank', 'true_false', 'matching', 'ordering', 'listening', 'speaking', 'writing', 'drag_drop', 'pronunciation'],
        required: true
    },
    question: {
        type: String,
        required: true
    },
    options: [{
        text: String,
        isCorrect: Boolean,
        explanation: String
    }],
    correctAnswer: String,
    explanation: String,
    points: {
        type: Number,
        default: 10
    },
    difficulty: {
        type: String,
        enum: ['easy', 'medium', 'hard'],
        default: 'medium'
    },
    skills: [{
        type: String,
        enum: ['listening', 'speaking', 'reading', 'writing', 'vocabulary', 'grammar', 'pronunciation']
    }],
    audioUrl: String,
    imageUrl: String,
    hints: [String],
    timeLimit: Number, // in seconds
    metadata: {
        wordCount: Number,
        audioLength: Number, // in seconds
        imageAltText: String
    }
}, { _id: true });

const lessonSchema = new mongoose.Schema({
    moduleId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Module',
        required: true,
        index: true
    },
    courseId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course',
        required: true,
        index: true
    },

    // Basic information
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
    content: {
        type: String,
        required: true
    },

    // Lesson ordering
    order: {
        type: Number,
        required: true,
        default: 0
    },

    // Lesson type and format
    type: {
        type: String,
        enum: ['video', 'audio', 'text', 'interactive', 'quiz', 'assignment', 'live'],
        required: true
    },
    format: {
        type: String,
        enum: ['lesson', 'exercise', 'quiz', 'assessment', 'project'],
        default: 'lesson'
    },

    // Media content
    videoUrl: String,
    audioUrl: String,
    thumbnailUrl: String,
    attachments: [{
        name: String,
        url: String,
        type: String,
        size: Number
    }],

    // Lesson metadata
    duration: {
        type: Number, // in minutes
        default: 0
    },
    difficulty: {
        type: String,
        enum: ['easy', 'medium', 'hard'],
        default: 'medium'
    },
    skills: [{
        type: String,
        enum: ['listening', 'speaking', 'reading', 'writing', 'vocabulary', 'grammar', 'pronunciation']
    }],

    // Learning content
    vocabulary: [{
        word: String,
        pronunciation: String,
        meaning: String,
        example: String,
        audioUrl: String
    }],
    grammarPoints: [{
        rule: String,
        explanation: String,
        examples: [String]
    }],
    exercises: [exerciseSchema],

    // Lesson settings
    isPreview: {
        type: Boolean,
        default: false
    },
    isRequired: {
        type: Boolean,
        default: true
    },
    passingScore: {
        type: Number,
        default: 70
    },

    // Unlock conditions
    unlockConditions: {
        previousLesson: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Lesson'
        },
        minimumScore: Number,
        requireCompletion: {
            type: Boolean,
            default: false
        }
    },

    // Status and publication
    status: {
        type: String,
        enum: ['draft', 'published', 'archived'],
        default: 'draft'
    },
    publishedAt: Date,

    // Creator
    creator: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    // Learning objectives
    objectives: [String],
    notes: String,

    // Interaction settings
    allowComments: {
        type: Boolean,
        default: true
    },
    allowQuestions: {
        type: Boolean,
        default: true
    },

    // Analytics
    totalViews: {
        type: Number,
        default: 0
    },
    averageCompletionTime: {
        type: Number,
        default: 0
    },
    averageScore: {
        type: Number,
        default: 0
    },
    totalAttempts: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true }
});

// Indexes for performance
lessonSchema.index({ moduleId: 1, order: 1 });
lessonSchema.index({ courseId: 1, status: 1 });
lessonSchema.index({ creator: 1, status: 1 });
lessonSchema.index({ type: 1, status: 1 });
lessonSchema.index({ skills: 1 });

// Virtual for total exercises
lessonSchema.virtual('totalExercises').get(function() {
    return this.exercises.length;
});

// Virtual for total points
lessonSchema.virtual('totalPoints').get(function() {
    return this.exercises.reduce((total, exercise) => total + exercise.points, 0);
});

// Methods
lessonSchema.methods.isUnlockedForUser = async function(userId) {
    if (this.isPreview) return true;

    // Check if previous lesson requirement is met
    if (this.unlockConditions.previousLesson) {
        const UserProgress = mongoose.model('UserProgress');
        const progress = await UserProgress.findOne({
            userId,
            lessonId: this.unlockConditions.previousLesson,
            status: 'completed'
        });

        if (!progress) return false;

        // Check minimum score requirement
        if (this.unlockConditions.minimumScore &&
            progress.score < this.unlockConditions.minimumScore) {
            return false;
        }
    }

    return true;
};

lessonSchema.methods.getUserProgress = async function(userId) {
    const UserProgress = mongoose.model('UserProgress');
    return await UserProgress.findOne({
        userId,
        lessonId: this._id
    });
};

lessonSchema.methods.calculateScore = function(userAnswers) {
    let totalPoints = 0;
    let earnedPoints = 0;

    this.exercises.forEach((exercise, index) => {
        totalPoints += exercise.points;

        const userAnswer = userAnswers[index];
        if (this.isAnswerCorrect(exercise, userAnswer)) {
            earnedPoints += exercise.points;
        }
    });

    return totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;
};

lessonSchema.methods.isAnswerCorrect = function(exercise, userAnswer) {
    switch (exercise.type) {
        case 'multiple_choice':
            return exercise.options.find(opt => opt.isCorrect)?.text === userAnswer;
        case 'true_false':
            return exercise.correctAnswer === userAnswer;
        case 'fill_blank':
            return exercise.correctAnswer.toLowerCase().trim() === userAnswer.toLowerCase().trim();
        default:
            return false;
    }
};

// Pre-save middleware
lessonSchema.pre('save', function(next) {
    if (this.isModified('exercises')) {
        this.totalAttempts = this.exercises.length;
    }
    next();
});

module.exports = mongoose.model('Lesson', lessonSchema);