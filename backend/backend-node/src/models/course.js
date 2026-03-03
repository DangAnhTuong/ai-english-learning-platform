const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true,
        maxlength: 200
    },
    description: {
        type: String,
        required: true,
        maxlength: 2000
    },
    shortDescription: {
        type: String,
        maxlength: 500
    },
    thumbnail: {
        type: String,
        default: null
    },

    // Course categorization
    category: {
        type: String,
        enum: ['grammar', 'vocabulary', 'listening', 'speaking', 'reading', 'writing', 'pronunciation', 'business', 'ielts', 'toefl', 'conversation'],
        required: true
    },
    subcategory: String,
    tags: [String],

    // Difficulty and level
    level: {
        type: String,
        enum: ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'],
        required: true
    },
    difficulty: {
        type: String,
        enum: ['beginner', 'elementary', 'intermediate', 'upper_intermediate', 'advanced', 'proficient'],
        required: true
    },

    // Course structure
    modules: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Module'
    }],
    totalLessons: {
        type: Number,
        default: 0
    },
    totalDuration: {
        type: Number, // in minutes
        default: 0
    },

    // Creator and permissions
    creator: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    instructors: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],

    // Publication status
    status: {
        type: String,
        enum: ['draft', 'published', 'archived', 'under_review'],
        default: 'draft'
    },
    publishedAt: Date,

    // Enrollment and pricing
    enrollmentType: {
        type: String,
        enum: ['free', 'paid', 'premium'],
        default: 'free'
    },
    price: {
        type: Number,
        default: 0
    },
    currency: {
        type: String,
        default: 'VND'
    },

    // Course settings
    isPublic: {
        type: Boolean,
        default: true
    },
    allowComments: {
        type: Boolean,
        default: true
    },
    allowDownloads: {
        type: Boolean,
        default: false
    },
    certificateEnabled: {
        type: Boolean,
        default: false
    },

    // Statistics
    enrolledStudents: {
        type: Number,
        default: 0
    },
    completedStudents: {
        type: Number,
        default: 0
    },
    averageRating: {
        type: Number,
        default: 0
    },
    totalRatings: {
        type: Number,
        default: 0
    },
    totalViews: {
        type: Number,
        default: 0
    },

    // Learning objectives
    learningObjectives: [String],
    prerequisites: [String],
    targetAudience: [String],

    // Content metadata
    language: {
        type: String,
        default: 'vi'
    },
    subtitles: [String], // Available subtitle languages

    // SEO and discoverability
    slug: {
        type: String
    },
    metaTitle: String,
    metaDescription: String,

    // Scheduling
    startDate: Date,
    endDate: Date,
    isScheduled: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Indexes for performance
courseSchema.index({ category: 1, level: 1, status: 1 });
courseSchema.index({ creator: 1, status: 1 });
courseSchema.index({ enrollmentType: 1, isPublic: 1 });
courseSchema.index({ tags: 1 });
courseSchema.index({ slug: 1 }, { unique: true, sparse: true });
courseSchema.index({ createdAt: -1 });
courseSchema.index({ publishedAt: -1 });

// Virtual for average completion rate
courseSchema.virtual('completionRate').get(function() {
    if (this.enrolledStudents === 0) return 0;
    return Math.round((this.completedStudents / this.enrolledStudents) * 100);
});

// Pre-save middleware to generate slug
courseSchema.pre('save', function(next) {
    if (this.isModified('title') && !this.slug) {
        this.slug = this.title
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .trim('-');
    }
    next();
});

// Methods
courseSchema.methods.updateStatistics = async function() {
    const Enrollment = mongoose.model('Enrollment');

    const stats = await Enrollment.aggregate([
        { $match: { courseId: this._id } },
        {
            $group: {
                _id: null,
                enrolled: { $sum: 1 },
                completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } }
            }
        }
    ]);

    if (stats.length > 0) {
        this.enrolledStudents = stats[0].enrolled;
        this.completedStudents = stats[0].completed;
        await this.save();
    }
};

courseSchema.methods.canUserAccess = function(user) {
    if (this.status !== 'published') {
        return user && (
            user.roles.includes('admin') ||
            user.roles.includes('teacher') ||
            this.creator.toString() === user.id.toString()
        );
    }

    if (!this.isPublic) {
        return user !== null;
    }

    return true;
};

module.exports = mongoose.model('Course', courseSchema);