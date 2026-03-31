import express from 'express';
import { getSystemOverview } from '../controllers/systemController.js';
import { authenticateAdmin } from '../middleware/auth.js';

const router = express.Router();

// Only return overview of system stats for admins
router.get('/overview', authenticateAdmin, getSystemOverview);

export default router;
