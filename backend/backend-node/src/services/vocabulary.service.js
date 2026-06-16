const Vocabulary = require('../models/vocabulary');
const AppError = require('../utils/AppError');

class VocabularyService {
    /**
     * Tạo từ vựng mới
     * @param {Object} vocabularyData - Dữ liệu từ vựng
     * @param {string} userId - ID người tạo
     * @returns {Promise<Object>} Từ vựng đã tạo
     */
    static async createVocabulary(vocabularyData, userId) {
        try {
            // Kiểm tra từ đã tồn tại chưa
            const existingWord = await Vocabulary.findOne({
                word: vocabularyData.word.toLowerCase().trim()
            });

            if (existingWord) {
                throw new AppError('Từ vựng này đã tồn tại trong hệ thống', 409);
            }

            // Tạo từ mới
            const vocabulary = new Vocabulary({
                ...vocabularyData,
                createdBy: userId
            });

            await vocabulary.save();

            return vocabulary;
        } catch (error) {
            if (error instanceof AppError) throw error;
            if (error.code === 11000) {
                throw new AppError('Từ vựng đã tồn tại', 409);
            }
            throw new AppError('Lỗi khi tạo từ vựng: ' + error.message, 500);
        }
    }

    /**
     * Lấy danh sách từ vựng với filters và pagination
     * @param {Object} filters - Bộ lọc
     * @param {Object} pagination - Phân trang
     * @returns {Promise<Object>} Danh sách từ vựng và metadata
     */
    static async getVocabularies(filters = {}, pagination = {}) {
        try {
            const { page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc' } = pagination;
            const skip = (page - 1) * limit;

            // Build query
            const query = {};

            if (filters.type) query.type = filters.type;
            if (filters.level) query.level = filters.level;
            if (filters.isActive !== undefined) query.isActive = filters.isActive;
            if (filters.topic) query.topics = filters.topic;
            if (filters.search) {
                query.$or = [
                    { word: new RegExp(filters.search, 'i') },
                    { displayWord: new RegExp(filters.search, 'i') },
                    { meaning: new RegExp(filters.search, 'i') }
                ];
            }

            // Sort
            const sort = {};
            sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

            // Execute query
            const [vocabularies, total] = await Promise.all([
                Vocabulary.find(query)
                    .sort(sort)
                    .skip(skip)
                    .limit(limit)
                    .populate('createdBy', 'name email')
                    .populate('lastModifiedBy', 'name email')
                    .lean(),
                Vocabulary.countDocuments(query)
            ]);

            return {
                vocabularies,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit),
                    hasNextPage: page < Math.ceil(total / limit),
                    hasPrevPage: page > 1
                }
            };
        } catch (error) {
            throw new AppError('Lỗi khi lấy danh sách từ vựng: ' + error.message, 500);
        }
    }

    /**
     * Lấy từ vựng theo ID
     * @param {string} vocabularyId - ID từ vựng
     * @returns {Promise<Object>} Từ vựng
     */
    static async getVocabularyById(vocabularyId) {
        try {
            const vocabulary = await Vocabulary.findById(vocabularyId)
                .populate('createdBy', 'name email')
                .populate('lastModifiedBy', 'name email')
                .populate('relatedConversations', 'title topic level');

            if (!vocabulary) {
                throw new AppError('Không tìm thấy từ vựng', 404);
            }

            return vocabulary;
        } catch (error) {
            if (error instanceof AppError) throw error;
            throw new AppError('Lỗi khi lấy thông tin từ vựng: ' + error.message, 500);
        }
    }

    /**
     * Cập nhật từ vựng
     * @param {string} vocabularyId - ID từ vựng
     * @param {Object} updateData - Dữ liệu cập nhật
     * @param {string} userId - ID người cập nhật
     * @param {Array} userRoles - Vai trò người dùng
     * @returns {Promise<Object>} Từ vựng đã cập nhật
     */
    static async updateVocabulary(vocabularyId, updateData, userId, userRoles) {
        try {
            const vocabulary = await Vocabulary.findById(vocabularyId);

            if (!vocabulary) {
                throw new AppError('Không tìm thấy từ vựng', 404);
            }

            // Kiểm tra quyền
            if (!vocabulary.canEdit(userId, userRoles)) {
                throw new AppError('Bạn không có quyền chỉnh sửa từ vựng này', 403);
            }

            // Nếu cập nhật word, kiểm tra trùng lặp
            if (updateData.word && updateData.word.toLowerCase() !== vocabulary.word) {
                const existingWord = await Vocabulary.findOne({
                    word: updateData.word.toLowerCase().trim(),
                    _id: { $ne: vocabularyId }
                });

                if (existingWord) {
                    throw new AppError('Từ vựng này đã tồn tại', 409);
                }

                // CRITICAL: Explicitly update displayWord when word changes
                updateData.displayWord = updateData.word.charAt(0).toUpperCase() + updateData.word.slice(1);
            }

            // Update
            Object.assign(vocabulary, updateData);
            vocabulary.lastModifiedBy = userId;
            await vocabulary.save();

            // Reload to get full data
            const updatedVocabulary = await Vocabulary.findById(vocabularyId)
                .populate('createdBy', 'name email')
                .populate('lastModifiedBy', 'name email')
                .lean();

            return updatedVocabulary;
        } catch (error) {
            if (error instanceof AppError) throw error;
            throw new AppError('Lỗi khi cập nhật từ vựng: ' + error.message, 500);
        }
    }

    /**
     * Xóa từ vựng (soft delete)
     * @param {string} vocabularyId - ID từ vựng
     * @param {string} userId - ID người xóa
     * @param {Array} userRoles - Vai trò người dùng
     * @returns {Promise<boolean>} Kết quả xóa
     */
    static async deleteVocabulary(vocabularyId, userId, userRoles) {
        try {
            const vocabulary = await Vocabulary.findById(vocabularyId);

            if (!vocabulary) {
                throw new AppError('Không tìm thấy từ vựng', 404);
            }

            // Kiểm tra quyền
            if (!vocabulary.canEdit(userId, userRoles)) {
                throw new AppError('Bạn không có quyền xóa từ vựng này', 403);
            }

            // Hard delete - Xóa vĩnh viễn khỏi database
            await Vocabulary.findByIdAndDelete(vocabularyId);

            return true;
        } catch (error) {
            if (error instanceof AppError) throw error;
            throw new AppError('Lỗi khi xóa từ vựng: ' + error.message, 500);
        }
    }

    /**
     * Xóa vĩnh viễn từ vựng
     * @param {string} vocabularyId - ID từ vựng
     * @param {string} userId - ID người xóa
     * @param {Array} userRoles - Vai trò người dùng
     * @returns {Promise<boolean>} Kết quả xóa
     */
    static async permanentDeleteVocabulary(vocabularyId, userId, userRoles) {
        try {
            // Chỉ admin mới được xóa vĩnh viễn
            if (!userRoles.includes('admin')) {
                throw new AppError('Chỉ admin mới có quyền xóa vĩnh viễn', 403);
            }

            const result = await Vocabulary.findByIdAndDelete(vocabularyId);

            if (!result) {
                throw new AppError('Không tìm thấy từ vựng', 404);
            }

            return true;
        } catch (error) {
            if (error instanceof AppError) throw error;
            throw new AppError('Lỗi khi xóa vĩnh viễn từ vựng: ' + error.message, 500);
        }
    }

    /**
     * Tìm kiếm từ vựng
     * @param {string} keyword - Từ khóa tìm kiếm
     * @param {Object} filters - Bộ lọc bổ sung
     * @param {number} limit - Giới hạn kết quả
     * @returns {Promise<Array>} Danh sách từ vựng
     */
    static async searchVocabularies(keyword, filters = {}, limit = 10) {
        try {
            const query = {
                $or: [
                    { word: new RegExp(keyword, 'i') },
                    { displayWord: new RegExp(keyword, 'i') },
                    { meaning: new RegExp(keyword, 'i') }
                ]
            };

            if (filters.type) query.type = filters.type;
            if (filters.level) query.level = filters.level;
            if (filters.isActive !== undefined) query.isActive = filters.isActive;

            const vocabularies = await Vocabulary.find(query)
                .limit(limit)
                .sort({ usageCount: -1, createdAt: -1 })
                .select('word displayWord type meaning level wordFamily synonyms antonyms examples')
                .lean();

            return vocabularies;
        } catch (error) {
            throw new AppError('Lỗi khi tìm kiếm từ vựng: ' + error.message, 500);
        }
    }

    /**
     * Lấy danh sách loại từ
     * @returns {Array} Danh sách loại từ
     */
    static getWordTypes() {
        return [
            { value: 'noun', label: 'Noun (Danh từ)' },
            { value: 'verb', label: 'Verb (Động từ)' },
            { value: 'adjective', label: 'Adjective (Tính từ)' },
            { value: 'adverb', label: 'Adverb (Trạng từ)' },
            { value: 'phrase', label: 'Phrase (Cụm từ)' },
            { value: 'idiom', label: 'Idiom (Thành ngữ)' }
        ];
    }

    /**
     * Lấy danh sách levels
     * @returns {Array} Danh sách levels
     */
    static getLevels() {
        return [
            { value: 'beginner', label: 'Beginner (Sơ cấp)' },
            { value: 'intermediate', label: 'Intermediate (Trung cấp)' },
            { value: 'advanced', label: 'Advanced (Cao cấp)' }
        ];
    }

    /**
     * Liên kết từ vựng với hội thoại
     * @param {string} vocabularyId - ID từ vựng
     * @param {string} conversationId - ID hội thoại
     * @returns {Promise<Object>} Từ vựng đã cập nhật
     */
    static async linkToConversation(vocabularyId, conversationId) {
        try {
            const vocabulary = await Vocabulary.findById(vocabularyId);

            if (!vocabulary) {
                throw new AppError('Không tìm thấy từ vựng', 404);
            }

            // Thêm conversation vào danh sách nếu chưa có
            if (!vocabulary.relatedConversations.includes(conversationId)) {
                vocabulary.relatedConversations.push(conversationId);
                await vocabulary.save();
            }

            return vocabulary;
        } catch (error) {
            if (error instanceof AppError) throw error;
            throw new AppError('Lỗi khi liên kết từ vựng với hội thoại: ' + error.message, 500);
        }
    }

    /**
     * Lấy thống kê từ vựng
     * @returns {Promise<Object>} Thống kê
     */
    static async getVocabularyStats() {
        try {
            const [
                total,
                byType,
                byLevel,
                active,
                inactive
            ] = await Promise.all([
                Vocabulary.countDocuments(),
                Vocabulary.aggregate([
                    { $group: { _id: '$type', count: { $sum: 1 } } }
                ]),
                Vocabulary.aggregate([
                    { $group: { _id: '$level', count: { $sum: 1 } } }
                ]),
                Vocabulary.countDocuments({ isActive: true }),
                Vocabulary.countDocuments({ isActive: false })
            ]);

            return {
                total,
                active,
                inactive,
                byType: byType.reduce((acc, item) => {
                    acc[item._id] = item.count;
                    return acc;
                }, {}),
                byLevel: byLevel.reduce((acc, item) => {
                    acc[item._id] = item.count;
                    return acc;
                }, {})
            };
        } catch (error) {
            throw new AppError('Lỗi khi lấy thống kê từ vựng: ' + error.message, 500);
        }
    }
}

module.exports = VocabularyService;
