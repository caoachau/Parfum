import { Router } from 'express';
import { z } from 'zod';
import { optionalAuthenticate } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import * as controller from '../controllers/support.controller';

const router = Router();
router.post(
  '/',
  optionalAuthenticate,
  validate(
    z.object({
      name: z.string().trim().min(2).max(100),
      email: z.string().trim().email(),
      subject: z.string().trim().min(1).max(150),
      message: z.string().trim().min(5).max(5000),
      type: z.enum(['general', 'product', 'order', 'returns', 'press', 'other']).optional(),
      orderId: z
        .string()
        .trim()
        .regex(/^[0-9a-fA-F]{24}$/, 'Mã đơn hàng không hợp lệ')
        .optional(),
    }),
  ),
  controller.create,
);
export default router;
