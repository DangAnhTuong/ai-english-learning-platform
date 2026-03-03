const mongoose = require('mongoose');

const refreshTokenSchema = new mongoose.Schema({
    jti: String,
    expiresAt: Date,
    deviceInfo: {
        deviceType: String,
        browser: String,
        os: String,
        ip: String
    }
}, { _id: false });

const userSchema = new mongoose.Schema({
    // Basic Information
    email: {
        type: String,
        required: true,
        lowercase: true,
        trim: true
    },
    passwordHash: {
        type: String,
        required: function () {
            return !this.googleId; // Password not required if using Google OAuth
        },
        select: false
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    username: {
        type: String,
        required: function() {
            return !this.googleId; // Not required for Google OAuth users
        },
        trim: true,
        lowercase: true
    },
    phone: {
        type: String,
        required: function() {
            return !this.googleId; // Not required for Google OAuth users
        },
        trim: true
    },
    roles: {
        type: [String],
        enum: ['student', 'teacher', 'admin'],
        default: ['student'],
        required: true
    },
    status: {
        type: String,
        enum: ['active', 'inactive', 'banned', 'pending'],
        default: 'pending',
        required: true
    },

    // Authentication & Security
    tokenVersion: { type: Number, default: 0 },
    refreshTokens: [refreshTokenSchema],
    isEmailVerified: { type: Boolean, default: false },
    emailVerificationToken: String,
    emailVerificationExpires: Date,
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    lastPasswordChange: Date,
    failedLoginAttempts: { type: Number, default: 0 },
    lockUntil: Date,

    // Google OAuth
    googleId: {
        type: String
    },
    authProvider: {
        type: String,
        enum: ['local', 'google'],
        default: 'local'
    },
    avatar: String,

    // Usage Statistics
    lastActiveAt: Date,
    lastLoginAt: Date,
    totalLogins: { type: Number, default: 0 },

    // References to other collections
    profileId: { type: mongoose.Schema.Types.ObjectId, ref: 'UserProfile' },
    learningProfileId: { type: mongoose.Schema.Types.ObjectId, ref: 'LearningProfile' },
    progressId: { type: mongoose.Schema.Types.ObjectId, ref: 'Progress' },
    notificationSettingsId: { type: mongoose.Schema.Types.ObjectId, ref: 'NotificationSettings' },
    activeSubscriptionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subscription' }
}, {
    timestamps: true
});

// Indexes for performance
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ username: 1 }, { unique: true });
userSchema.index({ phone: 1 }, { unique: true });
userSchema.index({ googleId: 1 }, { unique: true, sparse: true });
userSchema.index({ status: 1 });
userSchema.index({ roles: 1 });

module.exports = mongoose.model('User', userSchema);
