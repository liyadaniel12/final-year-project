import express from 'express';
import { lookupBatch } from '../controllers/batchController.js';

const router = express.Router();

// Public route for customer verifying product using batch number
router.get('/lookup', lookupBatch);

export default router;
