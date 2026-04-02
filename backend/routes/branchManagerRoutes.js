import express from 'express';
import { authenticateBranchManager } from '../middleware/auth.js';
import { 
  getBranchDashboard, 
  getBranchStock, 
  addBranchStock, 
  getBranchSales, 
  recordBranchSale, 
  getBranchTransfers,
  createBranchTransfer,
  updateBranchTransfer,
  getTransferOptions
} from '../controllers/branchManagerController.js';

const router = express.Router();

router.use(authenticateBranchManager);

router.get('/dashboard', getBranchDashboard);
router.get('/stock', getBranchStock);
router.post('/stock', addBranchStock);
router.get('/sales', getBranchSales);
router.post('/sales', recordBranchSale);
router.get('/transfers', getBranchTransfers);
router.get('/transfer-options', getTransferOptions);
router.post('/transfers', createBranchTransfer);
router.put('/transfers/:id', updateBranchTransfer);

export default router;
