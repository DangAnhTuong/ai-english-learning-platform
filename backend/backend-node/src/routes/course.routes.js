const { Router } = require('express');
const CourseController = require('../controllers/course.controller');
const AuthGuard = require('../middlewares/auth.guard');
const validate = require('../middlewares/validate');
const courseValidation = require('../validations/course.validation');
const { Permissions } = require('../constants/permissions');

const router = Router();

// Public routes
router.get('/',
    AuthGuard.optionalAuth,
    validate(courseValidation.getCourses),
    CourseController.getCourses
);

router.get('/featured',
    AuthGuard.optionalAuth,
    CourseController.getFeaturedCourses
);

router.get('/categories',
    CourseController.getCourseCategories
);

router.get('/:courseId',
    AuthGuard.optionalAuth,
    validate(courseValidation.getCourseById),
    CourseController.getCourseById
);

// Protected routes - Student level
router.post('/:courseId/enroll',
    AuthGuard.guard,
    AuthGuard.requirePermissions([Permissions.COURSE_ENROLL]),
    validate(courseValidation.enrollInCourse),
    CourseController.enrollInCourse
);

router.delete('/:courseId/enroll',
    AuthGuard.guard,
    AuthGuard.requirePermissions([Permissions.COURSE_UNENROLL]),
    validate(courseValidation.enrollInCourse),
    CourseController.unenrollFromCourse
);

router.get('/user/enrolled',
    AuthGuard.guard,
    CourseController.getEnrolledCourses
);

// Protected routes - Teacher level
router.post('/',
    AuthGuard.guard,
    AuthGuard.requirePermissions([Permissions.COURSE_CREATE]),
    validate(courseValidation.createCourse),
    CourseController.createCourse
);

router.put('/:courseId',
    AuthGuard.guard,
    AuthGuard.requirePermissions([Permissions.COURSE_EDIT]),
    validate(courseValidation.updateCourse),
    CourseController.updateCourse
);

router.post('/:courseId/publish',
    AuthGuard.guard,
    AuthGuard.requirePermissions([Permissions.COURSE_PUBLISH]),
    validate(courseValidation.getCourseById),
    CourseController.publishCourse
);

router.post('/:courseId/unpublish',
    AuthGuard.guard,
    AuthGuard.requirePermissions([Permissions.COURSE_UNPUBLISH]),
    validate(courseValidation.getCourseById),
    CourseController.unpublishCourse
);

router.get('/user/created',
    AuthGuard.guard,
    AuthGuard.requirePermissions([Permissions.COURSE_VIEW]),
    CourseController.getMyCourses
);

router.get('/:courseId/analytics',
    AuthGuard.guard,
    AuthGuard.requirePermissions([Permissions.ANALYTICS_VIEW]),
    validate(courseValidation.getCourseById),
    CourseController.getCourseAnalytics
);

// Protected routes - Admin level
router.delete('/:courseId',
    AuthGuard.guard,
    AuthGuard.requirePermissions([Permissions.COURSE_DELETE]),
    validate(courseValidation.getCourseById),
    CourseController.deleteCourse
);

module.exports = router;