import { Router } from 'express';

import {
  getVariants,
  getProductVariants,
  createNewVariant,
  updateVariantById,
  deleteVariantById,
} from '../controllers/variant.controller';

import { authenticate, authorize } from '../middlewares/auth.middleware';

const router = Router();

router.get('/', getVariants);
router.get('/product/:productId', getProductVariants);

router.post('/', authenticate, authorize('admin'), createNewVariant);
router.put('/:id', authenticate, authorize('admin'), updateVariantById);
router.delete('/:id', authenticate, authorize('admin'), deleteVariantById);

export default router;
