const mongoose = require('mongoose');

const flashcardSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    word: {
        type: String,
        required: true,
        trim: true
    },
    meaning: {
        type: String,
        required: true
    },
    example: {
        type: String,
        default: ''
    },
    courseId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course'
    },
    lessonId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Lesson'
    },
    // SuperMemo-2 Fields
    interval: {
        type: Number,
        default: 0 // In days
    },
    repetition: {
        type: Number,
        default: 0
    },
    easeFactor: {
        type: Number,
        default: 2.5
    },
    nextReviewDate: {
        type: Date,
        default: Date.now,
        index: true
    }
}, { timestamps: true });

flashcardSchema.index({ userId: 1, nextReviewDate: 1 });

module.exports = mongoose.model('Flashcard', flashcardSchema);
