import express from 'express';
import { getProducts, createProduct } from '../controllers/productController.js';
import { authenticateAdmin } from '../middleware/auth.js';

const router = express.Router();

router.get('/', getProducts);
router.post('/', authenticateAdmin, createProduct);

export default router;
