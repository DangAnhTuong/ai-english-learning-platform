const Flashcard = require('../models/flashcard');

const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

const FlashcardController = {
    // 1. Thêm Flashcard mới
    addFlashcard: asyncHandler(async (req, res) => {
        const { word, meaning, example, courseId, lessonId } = req.body;
        const userId = req.user._id || req.user.id;

        // Check duplicate
        const existing = await Flashcard.findOne({ userId, word: word.trim() });
        if (existing) {
            return res.status(400).json({ success: false, error: 'Từ này đã có trong Flashcard' });
        }

        const flashcard = await Flashcard.create({
            userId,
            word,
            meaning,
            example,
            courseId,
            lessonId
        });

        res.status(201).json({ success: true, data: flashcard });
    }),

    // 2. Lấy danh sách Flashcard CẦN ÔN TẬP HÔM NAY
    getDueFlashcards: asyncHandler(async (req, res) => {
        const userId = req.user._id || req.user.id;
        
        const now = new Date();
        const flashcards = await Flashcard.find({
            userId,
            nextReviewDate: { $lte: now }
        }).sort({ nextReviewDate: 1 }).limit(50); // Get up to 50 cards to review

        res.status(200).json({ success: true, count: flashcards.length, data: flashcards });
    }),

    // 3. Gửi kết quả ôn tập (Thuật toán SM-2)
    reviewFlashcard: asyncHandler(async (req, res) => {
        const { id } = req.params;
        const { quality } = req.body; // quality: 0-5 (0=quên sạch, 5=nhớ hoàn hảo)
        const userId = req.user._id || req.user.id;

        const card = await Flashcard.findOne({ _id: id, userId });
        if (!card) {
            return res.status(404).json({ success: false, error: 'Không tìm thấy thẻ' });
        }

        let { interval, repetition, easeFactor } = card;

        if (quality >= 3) {
            // Đúng
            if (repetition === 0) {
                interval = 1;
            } else if (repetition === 1) {
                interval = 6;
            } else {
                interval = Math.round(interval * easeFactor);
            }
            repetition += 1;
        } else {
            // Sai
            repetition = 0;
            interval = 1;
        }

        easeFactor = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
        if (easeFactor < 1.3) easeFactor = 1.3;

        card.interval = interval;
        card.repetition = repetition;
        card.easeFactor = easeFactor;
        
        // Tính ngày ôn tập tiếp theo
        const nextDate = new Date();
        nextDate.setDate(nextDate.getDate() + interval);
        card.nextReviewDate = nextDate;

        await card.save();

        res.status(200).json({ success: true, data: card });
    }),

    // 4. Lấy tất cả flashcards (để quản lý)
    getAllFlashcards: asyncHandler(async (req, res) => {
        const userId = req.user._id || req.user.id;
        const flashcards = await Flashcard.find({ userId }).sort({ createdAt: -1 });
        res.status(200).json({ success: true, count: flashcards.length, data: flashcards });
    }),

    // 5. Xóa flashcard
    deleteFlashcard: asyncHandler(async (req, res) => {
        const { id } = req.params;
        const userId = req.user._id || req.user.id;
        
        const card = await Flashcard.findOneAndDelete({ _id: id, userId });
        if (!card) {
            return res.status(404).json({ success: false, error: 'Không tìm thấy thẻ' });
        }
        res.status(200).json({ success: true, message: 'Đã xóa thẻ' });
    })
};

module.exports = FlashcardController;
