const VocabularyService = require('../services/vocabulary.service');
const asyncHandler = require('../utils/asyncHandler');

class VocabularyController {
    /**
     * Tạo từ vựng mới
     * POST /api/v1/vocabulary
     */
    static createVocabulary = asyncHandler(async (req, res) => {
        const vocabulary = await VocabularyService.createVocabulary(
            req.body,
            req.user.id
        );

        res.status(201).json({
            success: true,
            message: 'Tạo từ vựng thành công',
            data: vocabulary
        });
    });

    /**
     * Lấy danh sách từ vựng
     * GET /api/v1/vocabulary
     */
    static getVocabularies = asyncHandler(async (req, res) => {
        const { page, limit, sortBy, sortOrder, ...filters } = req.query;

        const result = await VocabularyService.getVocabularies(
            filters,
            { page, limit, sortBy, sortOrder }
        );

        res.status(200).json({
            success: true,
            message: 'Lấy danh sách từ vựng thành công',
            data: result.vocabularies,
            pagination: result.pagination
        });
    });

    /**
     * Lấy từ vựng theo ID
     * GET /api/v1/vocabulary/:id
     */
    static getVocabularyById = asyncHandler(async (req, res) => {
        const vocabulary = await VocabularyService.getVocabularyById(req.params.id);

        res.status(200).json({
            success: true,
            message: 'Lấy thông tin từ vựng thành công',
            data: vocabulary
        });
    });

    /**
     * Cập nhật từ vựng
     * PUT /api/v1/vocabulary/:id
     */
    static updateVocabulary = asyncHandler(async (req, res) => {
        const vocabulary = await VocabularyService.updateVocabulary(
            req.params.id,
            req.body,
            req.user.id,
            req.user.roles
        );

        res.status(200).json({
            success: true,
            message: 'Cập nhật từ vựng thành công',
            data: vocabulary
        });
    });

    /**
     * Xóa từ vựng (soft delete)
     * DELETE /api/v1/vocabulary/:id
     */
    static deleteVocabulary = asyncHandler(async (req, res) => {
        await VocabularyService.deleteVocabulary(
            req.params.id,
            req.user.id,
            req.user.roles
        );

        res.status(200).json({
            success: true,
            message: 'Xóa từ vựng thành công'
        });
    });

    /**
     * Xóa vĩnh viễn từ vựng
     * DELETE /api/v1/vocabulary/:id/permanent
     */
    static permanentDeleteVocabulary = asyncHandler(async (req, res) => {
        await VocabularyService.permanentDeleteVocabulary(
            req.params.id,
            req.user.id,
            req.user.roles
        );

        res.status(200).json({
            success: true,
            message: 'Xóa vĩnh viễn từ vựng thành công'
        });
    });

    /**
     * Tìm kiếm từ vựng
     * GET /api/v1/vocabulary/search
     */
    static searchVocabularies = asyncHandler(async (req, res) => {
        const { q, type, level, limit } = req.query;

        const vocabularies = await VocabularyService.searchVocabularies(
            q,
            { type, level },
            limit
        );

        res.status(200).json({
            success: true,
            message: 'Tìm kiếm từ vựng thành công',
            data: vocabularies
        });
    });

    /**
     * Lấy danh sách loại từ
     * GET /api/v1/vocabulary/types
     */
    static getWordTypes = asyncHandler(async (req, res) => {
        const types = VocabularyService.getWordTypes();

        res.status(200).json({
            success: true,
            message: 'Lấy danh sách loại từ thành công',
            data: types
        });
    });

    /**
     * Lấy danh sách levels
     * GET /api/v1/vocabulary/levels
     */
    static getLevels = asyncHandler(async (req, res) => {
        const levels = VocabularyService.getLevels();

        res.status(200).json({
            success: true,
            message: 'Lấy danh sách cấp độ thành công',
            data: levels
        });
    });

    /**
     * Lấy thống kê từ vựng
     * GET /api/v1/vocabulary/stats
     */
    static getVocabularyStats = asyncHandler(async (req, res) => {
        const stats = await VocabularyService.getVocabularyStats();

        res.status(200).json({
            success: true,
            message: 'Lấy thống kê từ vựng thành công',
            data: stats
        });
    });

    /**
     * Liên kết từ vựng với hội thoại
     * POST /api/v1/vocabulary/:id/link-conversation
     */
    static linkToConversation = asyncHandler(async (req, res) => {
        const { conversationId } = req.body;

        const vocabulary = await VocabularyService.linkToConversation(
            req.params.id,
            conversationId
        );

        res.status(200).json({
            success: true,
            message: 'Liên kết từ vựng với hội thoại thành công',
            data: vocabulary
        });
    });
}

module.exports = VocabularyController;
