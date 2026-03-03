const mongoose = require('mongoose');

// Updated Progress model for overall user progress
const progressSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    // Overall statistics
    totalStudyTime: { type: Number, default: 0 }, // in minutes
    lessonsCompleted: { type: Number, default: 0 },
    exercisesCompleted: { type: Number, default: 0 },
    coursesEnrolled: { type: Number, default: 0 },
    coursesCompleted: { type: Number, default: 0 },

    // Streak tracking
    currentStreak: { type: Number, default: 0 },
    longestStreak: { type: Number, default: 0 },
    lastStudyDate: Date,
    streakHistory: [{
        date: Date,
        minutesStudied: Number,
        activitiesCompleted: Number
    }],

    // Weekly/Monthly progress
    weeklyProgress: [{
        week: String, // 'YYYY-WW' format
        totalMinutes: Number,
        completedLessons: Number,
        completedExercises: Number,
        averageScore: Number,
        studyDays: Number
    }],
    monthlyProgress: [{
        month: String, // 'YYYY-MM' format
        totalMinutes: Number,
        completedLessons: Number,
        completedExercises: Number,
        averageScore: Number,
        studyDays: Number,
        coursesCompleted: Number
    }],

    // Skill progress
    skillProgress: {
        listening: { type: Number, min: 0, max: 100, default: 0 },
        speaking: { type: Number, min: 0, max: 100, default: 0 },
        reading: { type: Number, min: 0, max: 100, default: 0 },
        writing: { type: Number, min: 0, max: 100, default: 0 },
        vocabulary: { type: Number, min: 0, max: 100, default: 0 },
        grammar: { type: Number, min: 0, max: 100, default: 0 },
        pronunciation: { type: Number, min: 0, max: 100, default: 0 }
    },

    // Overall performance
    averageScore: { type: Number, default: 0 },
    totalPoints: { type: Number, default: 0 },
    level: { type: Number, default: 1 },
    experiencePoints: { type: Number, default: 0 },

    // Goals and targets
    dailyGoal: { type: Number, default: 30 }, // minutes
    weeklyGoal: { type: Number, default: 210 }, // minutes

    // Achievements
    achievements: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Achievement',
        earnedAt: Date
    }],

    // Learning preferences derived from performance
    learningInsights: {
        preferredStudyTime: String, // 'morning', 'afternoon', 'evening'
        averageSessionLength: Number,
        mostEffectiveSkill: String,
        needsImprovementSkill: String,
        lastUpdated: Date
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true }
});

// Indexes for performance
progressSchema.index({ userId: 1 }, { unique: true });
progressSchema.index({ totalPoints: -1 });
progressSchema.index({ level: -1 });

// Virtual for current level progress
progressSchema.virtual('levelProgress').get(function () {
    const pointsForCurrentLevel = this.level * 1000; // Example: each level requires 1000 * level points
    const pointsForNextLevel = (this.level + 1) * 1000;
    const progressInLevel = this.totalPoints - pointsForCurrentLevel;
    const pointsNeededForLevel = pointsForNextLevel - pointsForCurrentLevel;

    return {
        current: progressInLevel,
        required: pointsNeededForLevel,
        percentage: Math.round((progressInLevel / pointsNeededForLevel) * 100)
    };
});

// Methods
progressSchema.methods.updateStreak = function () {
    const today = new Date();
    const lastStudy = this.lastStudyDate ? new Date(this.lastStudyDate) : null;

    if (!lastStudy) {
        this.currentStreak = 1;
    } else {
        const daysDiff = Math.floor((today - lastStudy) / (1000 * 60 * 60 * 24));

        if (daysDiff === 0) {
            // Same day, don't change streak
            return;
        } else if (daysDiff === 1) {
            // Consecutive day
            this.currentStreak += 1;
        } else {
            // Streak broken
            this.currentStreak = 1;
        }
    }

    // Update longest streak
    if (this.currentStreak > this.longestStreak) {
        this.longestStreak = this.currentStreak;
    }

    this.lastStudyDate = today;
};

progressSchema.methods.addStudyTime = function (minutes, skills = []) {
    this.totalStudyTime += minutes;
    this.updateStreak();

    // Update skill progress if skills provided
    if (skills.length > 0) {
        skills.forEach(skill => {
            if (this.skillProgress[skill] !== undefined) {
                // Increment skill progress (simple linear progression)
                this.skillProgress[skill] = Math.min(100, this.skillProgress[skill] + 1);
            }
        });
    }

    // Add to streak history
    const today = new Date().toISOString().split('T')[0];
    const existingEntry = this.streakHistory.find(entry =>
        entry.date.toISOString().split('T')[0] === today
    );

    if (existingEntry) {
        existingEntry.minutesStudied += minutes;
        existingEntry.activitiesCompleted += 1;
    } else {
        this.streakHistory.push({
            date: new Date(),
            minutesStudied: minutes,
            activitiesCompleted: 1
        });
    }

    // Keep only last 365 days of streak history
    if (this.streakHistory.length > 365) {
        this.streakHistory = this.streakHistory.slice(-365);
    }
};

progressSchema.methods.addPoints = function (points) {
    this.totalPoints += points;

    // Check for level up
    const newLevel = Math.floor(this.totalPoints / 1000) + 1;
    if (newLevel > this.level) {
        this.level = newLevel;
        // Could trigger level up achievement here
    }

    this.experiencePoints = this.totalPoints % 1000;
};

progressSchema.methods.updateWeeklyProgress = function () {
    const now = new Date();
    const currentWeek = `${now.getFullYear()}-${String(Math.ceil((now.getDate() + new Date(now.getFullYear(), 0, 1).getDay()) / 7)).padStart(2, '0')}`;

    // This would typically be called with specific metrics
    // Implementation depends on how you track weekly data
};

module.exports = mongoose.model('Progress', progressSchema);