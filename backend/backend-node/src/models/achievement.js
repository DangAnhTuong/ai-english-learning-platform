const mongoose = require('mongoose');

const achievementSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: ['certificate', 'badge', 'milestone'], required: true },
    name: { type: String, required: true },
    description: String,
    earnedAt: { type: Date, default: Date.now },
    imageUrl: String,
    criteria: {
        type: { type: String, enum: ['study_time', 'lesson_completion', 'streak', 'skill_level'] },
        value: Number,
        skillType: String
    },
    metadata: mongoose.Schema.Types.Mixed
}, { timestamps: true });

module.exports = mongoose.model('Achievement', achievementSchema);