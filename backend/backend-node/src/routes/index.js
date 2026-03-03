const { Router } = require('express');
const authRoutes = require('./auth.routes');
const courseRoutes = require('./course.routes');
const conversationRoutes = require('./conversation.routes');
const userRoutes = require('./user.routes');
const orderRoutes = require('./order.routes');
const subscriptionRoutes = require('./subscription.routes');
const vocabularyRoutes = require('./vocabulary.routes');
const levelRoutes = require('./level.routes');
const adminRoutes = require('./admin.routes');
const profileRoutes = require('./profile.routes');

const router = Router();

// Authentication routes
router.use('/auth', authRoutes);

// Profile routes - User's own profile management
router.use('/profile', profileRoutes);

// Learning platform routes
router.use('/courses', courseRoutes);

// Conversation management routes
router.use('/conversations', conversationRoutes);

// Order & Payment routes
router.use('/orders', orderRoutes);

// Subscription routes
router.use('/subscriptions', subscriptionRoutes);

// Vocabulary routes
router.use('/vocabulary', vocabularyRoutes);

// Level management routes
router.use('/levels', levelRoutes);

// Admin routes - User management
router.use('/admin/users', userRoutes);

// Admin routes - Dashboard, Teachers, Students management
router.use('/admin', adminRoutes);

module.exports = router;
