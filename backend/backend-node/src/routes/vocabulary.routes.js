const { Router } = require('express');
const VocabularyController = require('../controllers/vocabulary.controller');
const AuthGuard = require('../middlewares/auth.guard');
const RoleGuard = require('../middlewares/role.guard');
const validate = require('../middlewares/validate');
const vocabularyValidation = require('../validations/vocabulary.validation');

const router = Router();

// Middleware xác thực cho tất cả routes
router.use(AuthGuard.guard);

// Routes công khai (cho tất cả người dùng đã đăng nhập)
router.get('/types',
    VocabularyController.getWordTypes
);

router.get('/levels',
    VocabularyController.getLevels
);

router.get('/search',
    validate(vocabularyValidation.search, 'query'),
    VocabularyController.searchVocabularies
);

router.get('/stats',
    RoleGuard.requireRoles(['admin', 'teacher']),
    VocabularyController.getVocabularyStats
);

router.get('/',
    validate(vocabularyValidation.query, 'query'),
    VocabularyController.getVocabularies
);

router.get('/:id',
    validate(vocabularyValidation.id, 'params'),
    VocabularyController.getVocabularyById
);

// Routes chỉ cho Admin và Teacher
router.post('/',
    RoleGuard.requireRoles(['admin', 'teacher']),
    validate(vocabularyValidation.create),
    VocabularyController.createVocabulary
);

router.put('/:id',
    RoleGuard.requireRoles(['admin', 'teacher']),
    validate(vocabularyValidation.id, 'params'),
    validate(vocabularyValidation.update),
    VocabularyController.updateVocabulary
);

router.delete('/:id',
    RoleGuard.requireRoles(['admin', 'teacher']),
    validate(vocabularyValidation.id, 'params'),
    VocabularyController.deleteVocabulary
);

router.delete('/:id/permanent',
    RoleGuard.requireRoles(['admin']), // Chỉ admin mới được xóa vĩnh viễn
    validate(vocabularyValidation.id, 'params'),
    VocabularyController.permanentDeleteVocabulary
);

router.post('/:id/link-conversation',
    RoleGuard.requireRoles(['admin', 'teacher']),
    validate(vocabularyValidation.id, 'params'),
    VocabularyController.linkToConversation
);

module.exports = router;
