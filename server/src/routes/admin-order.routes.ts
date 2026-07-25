import { Router } from 'express';
import { z } from 'zod';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import * as ctrl from '../controllers/admin-order.controller';

const router = Router();

// Tat ca route admin deu yeu cau dang nhap + quyen admin
router.use(authenticate, authorize('admin'));

router.get('/', ctrl.list);
router.get('/:id', ctrl.getOne);
router.patch(
  '/:id/status',
  validate(z.object({ status: z.enum(['pending', 'shipping', 'done', 'cancelled', 'returned']) })),
  ctrl.updateStatus,
);
router.post('/:id/confirm-payment', ctrl.confirmPayment);
router.patch(
  '/:id/payment',
  validate(z.object({ status: z.enum(['paid', 'unpaid']) })),
  ctrl.updatePayment,
);

export default router;
