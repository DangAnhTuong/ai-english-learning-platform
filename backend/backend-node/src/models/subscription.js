const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    plan: {
        type: String,
        enum: ['free', 'basic', 'premium', 'vip'],
        default: 'free',
        required: true
    },
    startDate: { type: Date, required: true },
    endDate: Date,
    autoRenew: { type: Boolean, default: false },
    paymentMethod: String,
    status: {
        type: String,
        enum: ['active', 'cancelled', 'expired', 'pending'],
        default: 'active'
    },
    billingHistory: [{
        amount: Number,
        currency: String,
        date: Date,
        status: String,
        transactionId: String
    }],
    features: [String]
}, { timestamps: true });

module.exports = mongoose.model('Subscription', subscriptionSchema);