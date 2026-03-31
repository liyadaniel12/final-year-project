import express from 'express';
import { getBranches, createBranch, updateBranch } from '../controllers/branchController.js';
import { authenticateAdmin } from '../middleware/auth.js';

const router = express.Router();

// Allow all authenticated users to get branches (or change to authenticateAdmin if strictly admin only)
// Based on typical use cases, getting branches might be used by multiple roles implicitly.
router.get('/', getBranches);

// Only admins can create a new branch
router.post('/', authenticateAdmin, createBranch);

// Only admins can update a branch
router.put('/:id', authenticateAdmin, updateBranch);

export default router;
