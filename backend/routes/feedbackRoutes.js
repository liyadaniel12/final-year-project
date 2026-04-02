import express from 'express';
import { submitFeedback } from '../controllers/feedbackController.js';

const router = express.Router();

// Public route for customer submitting feedback
router.post('/', submitFeedback);

export default router;
