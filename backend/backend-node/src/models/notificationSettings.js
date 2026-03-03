const mongoose = require('mongoose');

const notificationSettingsSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    email: { type: Boolean, default: true },
    push: { type: Boolean, default: true },
    dailyReminder: { type: Boolean, default: true },
    reminderTime: String, // "HH:mm" format
    weeklyProgress: { type: Boolean, default: true },
    newContentAlerts: { type: Boolean, default: true },
    preferredChannels: {
        studyReminders: { type: String, enum: ['email', 'push', 'both'], default: 'both' },
        progressUpdates: { type: String, enum: ['email', 'push', 'both'], default: 'email' },
        announcements: { type: String, enum: ['email', 'push', 'both'], default: 'both' }
    }
}, { timestamps: true });

module.exports = mongoose.model('NotificationSettings', notificationSettingsSchema);