const express = require('express');
const router = express.Router();
const ProgressController = require('../controllers/progress.controller');
const AuthGuard = require('../middlewares/auth.guard');

// Apply auth middleware to all progress routes
router.use(AuthGuard.guard);

// Complete a lesson
router.post('/lesson/complete', ProgressController.completeLesson);

// Get course progress
router.get('/course/:courseId', ProgressController.getCourseProgress);

module.exports = router;
