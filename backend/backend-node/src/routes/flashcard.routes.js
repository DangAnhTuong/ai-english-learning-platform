const express = require('express');
const router = express.Router();
const FlashcardController = require('../controllers/flashcard.controller');
const AuthGuard = require('../middlewares/auth.guard');

// Require authentication for all flashcard routes
router.use(AuthGuard.guard);

// Get flashcards due for review
router.get('/review', FlashcardController.getDueFlashcards);

// Add a new flashcard
router.post('/', FlashcardController.addFlashcard);

// Get all flashcards
router.get('/', FlashcardController.getAllFlashcards);

// Submit review result for a flashcard
router.post('/:id/review', FlashcardController.reviewFlashcard);

// Delete a flashcard
router.delete('/:id', FlashcardController.deleteFlashcard);

module.exports = router;
