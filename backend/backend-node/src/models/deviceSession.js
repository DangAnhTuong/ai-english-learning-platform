const mongoose = require('mongoose');

const deviceSessionSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    deviceType: {
        type: String,
        required: true
    },
    browser: String,
    os: String,
    ipAddress: String,
    userAgent: String,
    isActive: {
        type: Boolean,
        default: true
    },
    lastUsed: {
        type: Date,
        default: Date.now
    },
    refreshToken: {
        type: String,
        required: true
    },
    location: {
        country: String,
        city: String,
        timezone: String
    }
}, { timestamps: true });

// Add index for faster queries
deviceSessionSchema.index({ userId: 1, isActive: 1 });
deviceSessionSchema.index({ refreshToken: 1 });

module.exports = mongoose.model('DeviceSession', deviceSessionSchema);