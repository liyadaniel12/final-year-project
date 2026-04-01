import express from 'express';
import { getManagerStock, getManagerSales, getManagerTransfers } from '../controllers/managerController.js';
import { authenticateMainManager } from '../middleware/auth.js';

const router = express.Router();

// Apply auth middleware to all routes in this file
router.use(authenticateMainManager);

router.get('/stock', getManagerStock);
router.get('/sales', getManagerSales);
router.get('/transfers', getManagerTransfers);

export default router;
