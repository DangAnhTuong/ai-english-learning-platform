const mongoose = require('mongoose');

const userProfileSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    phoneNumber: String,
    dateOfBirth: Date,
    gender: { type: String, enum: ['male', 'female', 'other'] },
    nationality: String,
    nativeLanguage: String,
    timezone: String,
    bio: String,
    avatarUrl: String
}, { timestamps: true });

module.exports = mongoose.model('UserProfile', userProfileSchema);