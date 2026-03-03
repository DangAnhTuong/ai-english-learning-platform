const mongoose = require('mongoose');

const conversationTopicSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100
    },
    description: {
        type: String,
        trim: true,
        maxlength: 500,
        default: ''
    },
    icon: {
        type: String,
        trim: true,
        maxlength: 10,
        default: '💬'
    },
    color: {
        type: String,
        trim: true,
        maxlength: 20,
        default: '#1890ff'
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

conversationTopicSchema.index({ name: 1 }, { unique: true });
conversationTopicSchema.index({ isActive: 1, order: 1 });

module.exports = mongoose.model('ConversationTopic', conversationTopicSchema);

