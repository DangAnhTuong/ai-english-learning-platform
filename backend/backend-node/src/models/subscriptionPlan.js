const mongoose = require('mongoose');

const subscriptionPlanSchema = new mongoose.Schema({
    code: {
        type: String,
        required: true,
        trim: true,
        uppercase: true
    },
    name: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100
    },
    type: {
        type: String,
        required: true,
        trim: true,
        lowercase: true,
        enum: ['free', 'basic', 'premium', 'vip']
    },
    price: {
        type: Number,
        required: true,
        min: 0
    },
    currency: {
        type: String,
        default: 'VND',
        trim: true,
        uppercase: true
    },
    duration: {
        type: Number,
        required: true,
        min: 1 // days
    },
    durationLabel: {
        type: String,
        trim: true,
        maxlength: 50
    },
    features: [{
        type: String,
        trim: true,
        maxlength: 200
    }],
    discount: {
        type: Number,
        min: 0,
        max: 100,
        default: null
    },
    isPopular: {
        type: Boolean,
        default: false
    },
    color: {
        type: String,
        trim: true,
        maxlength: 20,
        default: '#597ef7'
    },
    order: {
        type: Number,
        default: 0,
        min: 0
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

subscriptionPlanSchema.index({ code: 1 }, { unique: true });
subscriptionPlanSchema.index({ type: 1 });
subscriptionPlanSchema.index({ isActive: 1, order: 1 });

module.exports = mongoose.model('SubscriptionPlan', subscriptionPlanSchema);

