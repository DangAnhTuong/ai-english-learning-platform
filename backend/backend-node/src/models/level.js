const mongoose = require('mongoose');

const levelSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        maxlength: 50
    },
    code: {
        type: String,
        required: true,
        trim: true,
        uppercase: true,
        maxlength: 10
    },
    description: {
        type: String,
        trim: true,
        maxlength: 500
    },
    order: {
        type: Number,
        required: true,
        default: 0
    },
    isActive: {
        type: Boolean,
        default: true
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    lastModifiedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

levelSchema.index({ code: 1 }, { unique: true });
levelSchema.index({ name: 1 }, { unique: true });
levelSchema.index({ order: 1 });
levelSchema.index({ isActive: 1 });

levelSchema.virtual('creator', {
    ref: 'User',
    localField: 'createdBy',
    foreignField: '_id',
    justOne: true
});

levelSchema.virtual('lastModifier', {
    ref: 'User',
    localField: 'lastModifiedBy',
    foreignField: '_id',
    justOne: true
});

module.exports = mongoose.model('Level', levelSchema);
