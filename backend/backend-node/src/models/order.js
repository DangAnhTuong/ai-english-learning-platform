const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    // Order identification
    orderNumber: {
        type: String,
        required: true
    },

    // User information
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },

    // Package information
    package: {
        name: {
            type: String,
            required: true
        },
        duration: {
            type: Number, // in days
            required: true
        },
        plan: {
            type: String,
            enum: ['free', 'basic', 'premium', 'vip'],
            default: 'basic'
        }
    },

    // Pricing
    amount: {
        type: Number,
        required: true,
        min: 0
    },
    currency: {
        type: String,
        default: 'VND'
    },
    discount: {
        type: Number,
        default: 0
    },
    finalAmount: {
        type: Number,
        required: true
    },

    // Payment information
    paymentMethod: {
        type: String,
        enum: ['bank_transfer', 'qr_code', 'cash', 'other'],
        default: 'bank_transfer'
    },
    paymentStatus: {
        type: String,
        enum: ['pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded'],
        default: 'pending',
        index: true
    },
    transactionId: {
        type: String
    },
    transferContent: {
        type: String // Nội dung chuyển khoản để verify
    },

    // Bank information (for verification)
    bankInfo: {
        bankName: String,
        accountNo: String,
        accountName: String
    },

    // Status tracking
    status: {
        type: String,
        enum: ['pending', 'paid', 'failed', 'cancelled'],
        default: 'pending',
        index: true
    },

    // Verification
    verifiedAt: Date,
    verifiedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },

    // Subscription link
    subscriptionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Subscription'
    },

    // Notes
    notes: String,
    adminNotes: String,

    // Metadata
    metadata: {
        ipAddress: String,
        userAgent: String,
        referrer: String
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Indexes for performance
orderSchema.index({ userId: 1, createdAt: -1 });
orderSchema.index({ status: 1, paymentStatus: 1 });
orderSchema.index({ orderNumber: 1 }, { unique: true });
orderSchema.index({ transactionId: 1 }, { sparse: true });
orderSchema.index({ createdAt: -1 });

// Pre-save middleware to generate order number and calculate final amount
orderSchema.pre('save', async function (next) {
    try {
        // Calculate final amount
        if (this.amount !== undefined && this.discount !== undefined) {
            this.finalAmount = Math.max(0, this.amount - this.discount);
        }

        // Generate order number if new and not set (backup in case service doesn't set it)
        if (this.isNew && !this.orderNumber) {
            const timestamp = Date.now().toString().slice(-8);
            const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
            let orderNumber = `ORD${timestamp}${random}`;

            // Check for uniqueness (retry if needed)
            let exists = await mongoose.model('Order').findOne({ orderNumber });
            let retries = 0;
            while (exists && retries < 5) {
                const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
                orderNumber = `ORD${timestamp}${random}`;
                exists = await mongoose.model('Order').findOne({ orderNumber });
                retries++;
            }

            this.orderNumber = orderNumber;
        }

        next();
    } catch (error) {
        next(error);
    }
});

// Methods
orderSchema.methods.markAsPaid = async function (verifiedBy) {
    this.status = 'paid';
    this.paymentStatus = 'completed';
    this.verifiedAt = new Date();
    if (verifiedBy) {
        this.verifiedBy = verifiedBy;
    }
    await this.save();
};

orderSchema.methods.markAsFailed = async function () {
    this.status = 'failed';
    this.paymentStatus = 'failed';
    await this.save();
};

orderSchema.methods.cancel = async function () {
    this.status = 'cancelled';
    this.paymentStatus = 'cancelled';
    await this.save();
};

// Virtual for formatted order number
orderSchema.virtual('formattedOrderNumber').get(function () {
    return this.orderNumber;
});

module.exports = mongoose.model('Order', orderSchema);
