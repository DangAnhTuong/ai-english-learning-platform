const mongoose = require('mongoose');

const learningProfileSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    englishLevel: {
        type: String,
        enum: ['beginner', 'elementary', 'intermediate', 'upper_intermediate', 'advanced', 'proficient'],
        default: 'beginner'
    },
    targetLevel: {
        type: String,
        enum: ['elementary', 'intermediate', 'upper_intermediate', 'advanced', 'proficient']
    },
    learningGoals: [String],
    interests: [String],
    preferredLearningStyle: {
        type: String,
        enum: ['visual', 'auditory', 'reading', 'kinesthetic'],
        default: 'visual'
    },
    weeklyStudyGoal: { type: Number, default: 5 },
    preferredTopics: [String],
    challengeAreas: [String],
    skillLevels: {
        listening: { type: Number, min: 0, max: 100, default: 0 },
        speaking: { type: Number, min: 0, max: 100, default: 0 },
        reading: { type: Number, min: 0, max: 100, default: 0 },
        writing: { type: Number, min: 0, max: 100, default: 0 },
        vocabulary: { type: Number, min: 0, max: 100, default: 0 },
        grammar: { type: Number, min: 0, max: 100, default: 0 }
    }
}, { timestamps: true });

module.exports = mongoose.model('LearningProfile', learningProfileSchema);