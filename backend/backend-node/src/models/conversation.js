const mongoose = require('mongoose');
const conversationConfig = require('../config/conversation.config');
// Unicode NFC normalization for Vietnamese text support

// Schema cho từng câu trong hội thoại
const conversationLineSchema = new mongoose.Schema({
    speaker: {
        type: String,
        required: true,
        trim: true,
        maxlength: 10,  // Speaker ID: 'A', 'B', 'C'...
        uppercase: true
    },
    speakerName: {
        type: String,
        trim: true,
        maxlength: 50  // Display name: 'Người A', 'John', etc.
    },
    content: {
        type: String,
        required: true,
        trim: true,
        maxlength: 500
    },
    translation: {
        type: String,
        trim: true,
        maxlength: 500
    },
    // Audio URL sau khi generate
    audioUrl: {
        type: String,
        trim: true,
        default: null
    },
    // Trạng thái audio generation
    audioStatus: {
        type: String,
        enum: ['pending', 'generating', 'completed', 'failed'],
        default: 'pending'
    },
    // Metadata audio
    audioMetadata: {
        duration: {
            type: Number, // seconds
            default: 0
        },
        fileSize: {
            type: Number, // bytes
            default: 0
        },
        format: {
            type: String,
            default: 'mp3'
        },
        generatedAt: {
            type: Date
        }
    },
    order: {
        type: Number,
        required: true,
        min: 1
    }
}, { _id: true }); // Cần _id để reference khi generate audio

// Schema chính cho hội thoại
const conversationSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true,
        maxlength: 200
    },
    description: {
        type: String,
        trim: true,
        maxlength: 1000
    },
    topic: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100
    },
    level: {
        type: String,
        required: true,
        enum: ['beginner', 'intermediate', 'advanced'],
        default: 'beginner'
    },
    lines: {
        type: [conversationLineSchema],
        required: true,
        validate: {
            validator: function (lines) {
                return lines.length >= conversationConfig.minLines &&
                    lines.length <= conversationConfig.maxLines;
            },
            message: `Hội thoại phải có từ ${conversationConfig.minLines} đến ${conversationConfig.maxLines} câu`
        }
    },
    // Danh sách người tham gia hội thoại
    participants: [{
        id: {
            type: String,
            required: true,
            trim: true
        },
        name: {
            type: String,
            required: true,
            trim: true,
            maxlength: 50
        }
    }],
    totalLines: {
        type: Number,
        required: true,
        min: conversationConfig.minLines,
        max: conversationConfig.maxLines,
        default: conversationConfig.maxLines
    },
    duration: {
        type: Number, // Thời gian ước tính (phút)
        min: 1,
        max: 60
    },
    tags: [{
        type: String,
        trim: true,
        maxlength: 50
    }],
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
    },
    usageCount: {
        type: Number,
        default: 0
    },
    difficulty: {
        type: Number,
        min: 1,
        max: 5,
        default: 1
    },
    // Trạng thái audio generation cho toàn bộ conversation
    audioGenerationStatus: {
        type: String,
        enum: ['pending', 'queued', 'in_progress', 'generating', 'completed', 'failed', 'partial'],
        default: 'pending'
    },
    audioGenerationProgress: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
    },
    audioGeneratedAt: {
        type: Date
    },
    // Voice settings cho conversation
    voiceSettings: {
        speakerA: {
            provider: {
                type: String,
                enum: ['openai', 'deepgram'],
                default: 'openai'
            },
            voice: {
                type: String,
                default: 'alloy' // OpenAI: alloy, echo, fable, onyx, nova, shimmer
            },
            speed: {
                type: Number,
                default: 1.0,
                min: 0.25,
                max: 4.0
            }
        }
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Indexes cho performance
conversationSchema.index({ title: 1 }, { unique: true });
conversationSchema.index({ topic: 1 });
conversationSchema.index({ level: 1 });
conversationSchema.index({ isActive: 1 });
conversationSchema.index({ createdBy: 1 });
conversationSchema.index({ tags: 1 });
conversationSchema.index({ createdAt: -1 });

// Virtual để lấy thông tin người tạo
conversationSchema.virtual('creator', {
    ref: 'User',
    localField: 'createdBy',
    foreignField: '_id',
    justOne: true
});

// Virtual để lấy thông tin người sửa cuối
conversationSchema.virtual('lastModifier', {
    ref: 'User',
    localField: 'lastModifiedBy',
    foreignField: '_id',
    justOne: true
});

// Pre-save middleware để tự động cập nhật totalLines và normalize Unicode
conversationSchema.pre('save', function (next) {
    // Normalize Unicode NFC cho topic và title (fix lỗi tiếng Việt)
    if (this.topic) {
        this.topic = this.topic.normalize('NFC');
    }
    if (this.title) {
        this.title = this.title.normalize('NFC');
    }
    if (this.description) {
        this.description = this.description.normalize('NFC');
    }

    if (this.lines && this.lines.length > 0) {
        this.totalLines = this.lines.length;

        // Sắp xếp lines theo order
        this.lines.sort((a, b) => a.order - b.order);

        // Cập nhật order nếu cần
        this.lines.forEach((line, index) => {
            line.order = index + 1;
        });
    }
    next();
});

// Pre-save middleware để kiểm tra trùng lặp nội dung
conversationSchema.pre('save', async function (next) {
    if (this.isModified('lines')) {
        const contentSet = new Set();
        for (const line of this.lines) {
            const content = line.content.toLowerCase().trim();
            if (contentSet.has(content)) {
                return next(new Error('Nội dung hội thoại bị trùng lặp'));
            }
            contentSet.add(content);
        }
    }
    next();
});

// Static method để tìm kiếm hội thoại
conversationSchema.statics.findByFilters = function (filters = {}) {
    const query = {};

    if (filters.topic) {
        // Normalize Unicode NFC để so sánh chuẩn (fix lỗi tiếng Việt NFC vs NFD)
        const normalizedTopic = filters.topic.normalize('NFC');
        query.topic = new RegExp(normalizedTopic, 'i');
    }

    if (filters.level) {
        query.level = filters.level;
    }

    if (filters.isActive !== undefined) {
        query.isActive = filters.isActive;
    }

    if (filters.tags && filters.tags.length > 0) {
        query.tags = { $in: filters.tags };
    }

    if (filters.search) {
        const normalizedSearch = filters.search.normalize('NFC');
        query.$or = [
            { title: new RegExp(normalizedSearch, 'i') },
            { description: new RegExp(normalizedSearch, 'i') }
        ];
    }

    return this.find(query);
};

// Instance method để cập nhật usage count
conversationSchema.methods.incrementUsage = function () {
    this.usageCount += 1;
    return this.save();
};

// Instance method để kiểm tra quyền chỉnh sửa
conversationSchema.methods.canEdit = function (userId, userRoles) {
    return userRoles.includes('admin') ||
        (userRoles.includes('teacher') && this.createdBy.toString() === userId.toString());
};

module.exports = mongoose.model('Conversation', conversationSchema);

