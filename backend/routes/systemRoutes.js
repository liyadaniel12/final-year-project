import express from 'express';
import { getSystemOverview, getManagerDashboard } from '../controllers/systemController.js';
import { authenticateAdmin, authenticateMainManager } from '../middleware/auth.js';

const router = express.Router();

// Only return overview of system stats for admins
router.get('/overview', authenticateAdmin, getSystemOverview);
router.get('/manager-dashboard', authenticateMainManager, getManagerDashboard);

export default router;
