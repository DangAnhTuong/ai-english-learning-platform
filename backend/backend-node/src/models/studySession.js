const mongoose = require('mongoose');

const studySessionSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    activityType: {
        type: String,
        enum: ['lesson', 'exercise', 'conversation', 'test', 'practice'],
        required: true
    },
    contentId: { type: mongoose.Schema.Types.ObjectId, refPath: 'activityType' },
    startTime: { type: Date, required: true },
    endTime: Date,
    duration: Number, // minutes
    score: Number,
    mistakes: [{
        type: { type: String, enum: ['grammar', 'pronunciation', 'vocabulary', 'spelling'] },
        detail: String,
        correction: String
    }],
    feedback: {
        rating: { type: Number, min: 1, max: 5 },
        comment: String,
        improvements: [String]
    },
    skillsProgress: {
        listening: Number,
        speaking: Number,
        reading: Number,
        writing: Number,
        vocabulary: Number,
        grammar: Number
    }
}, { timestamps: true });

module.exports = mongoose.model('StudySession', studySessionSchema);