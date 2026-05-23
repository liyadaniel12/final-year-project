import express from 'express';
import { submitFeedback, getAllFeedback, resolveFeedback, exportFeedbackCSV } from '../controllers/feedbackController.js';
import { authenticateMainManager } from '../middleware/auth.js';

const router = express.Router();

// Public route for customer submitting feedback
router.post('/', submitFeedback);

// Protected routes for managers
router.get('/', authenticateMainManager, getAllFeedback);
router.patch('/:id/resolve', authenticateMainManager, resolveFeedback);
router.get('/export', authenticateMainManager, exportFeedbackCSV);

export default router;
