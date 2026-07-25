import { Router } from 'express';
import { z } from 'zod';
import { authenticate } from '../middlewares/auth.middleware';
import { validate, validateParams } from '../middlewares/validate.middleware';
import * as ctrl from '../controllers/account.controller';

const router = Router();
const productParamsSchema = z.object({
  productId: z
    .string()
    .trim()
    .regex(/^[0-9a-fA-F]{24}$/),
});
const scentProfileSchema = z.object({
  families: z.array(z.string().trim().min(1)).max(50).default([]),
  preferredNotes: z.array(z.string().trim().min(1)).max(600).default([]),
  dislikedNotes: z.array(z.string().trim().min(1)).max(600).default([]),
});

router.use(authenticate);
router.get('/orders', ctrl.getOrders);
router.get('/wishlist', ctrl.getWishlist);
router.post('/wishlist/:productId', validateParams(productParamsSchema), ctrl.addWishlistItem);
router.delete('/wishlist/:productId', validateParams(productParamsSchema), ctrl.removeWishlistItem);
router.get('/scent-profile', ctrl.getScentProfile);
router.put('/scent-profile', validate(scentProfileSchema), ctrl.updateScentProfile);

export default router;
