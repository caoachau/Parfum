import { Router } from 'express';
import { z } from 'zod';
import { authenticate, optionalAuthenticate } from '../middlewares/auth.middleware';
import { validate, validateParams, validateQuery } from '../middlewares/validate.middleware';
import { rateLimit } from '../middlewares/rateLimit.middleware';
import {
  checkoutPreview,
  checkStock,
  createOrder,
  cancelOrder,
  cancelPendingQrOrder,
  myOrders,
  lookupOrders,
  orderDetail,
  paymentInfo,
  pricePreview,
} from '../controllers/order.controller';

const router = Router();

const lookupLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: 'Qua nhieu lan tra cuu, vui long thu lai sau 15 phut',
});

// Dia chi giao hang BAT BUOC co line + phone; cac truong khac tuy chon.
const orderAddressSchema = z.object({
  fullName: z.string().trim().min(1).optional(),
  email: z.string().trim().email('Email không hợp lệ'),
  phone: z
    .string()
    .trim()
    .regex(/^0\d{9}$/, 'Số điện thoại không hợp lệ'),
  line: z.string().trim().min(1, 'Thieu dia chi giao hang'),
  ward: z.string().trim().min(1, 'Thieu xa hoac phuong'),
  district: z.string().trim().optional(),
  province: z.string().trim().min(1, 'Thieu thanh pho hoac tinh'),
  city: z.string().trim().optional(),
});

const createOrderSchema = z.object({
  method: z.enum(['cod', 'bank_qr']).optional(),
  shippingMethod: z.enum(['standard', 'express']).optional(),
  address: orderAddressSchema,
  note: z.string().trim().max(500).optional(),
  items: z
    .array(z.object({ variant: z.string().trim().min(1), quantity: z.number().int().positive() }))
    .optional(),
  voucherCode: z.string().trim().min(1).optional(),
});

const pricePreviewSchema = z.object({
  items: z
    .array(z.object({ variant: z.string().trim().min(1), quantity: z.number().int().positive() }))
    .min(1),
  voucherCode: z.string().trim().optional(),
  shippingMethod: z.enum(['standard', 'express']).optional(),
  email: z.string().trim().email().optional(),
});

router.get('/checkout-preview', authenticate, checkoutPreview);
router.post('/check-stock', checkStock);
router.post('/price-preview', optionalAuthenticate, validate(pricePreviewSchema), pricePreview);
router.get(
  '/lookup',
  lookupLimiter,
  validateQuery(z.object({ q: z.string().trim().min(3).max(120) })),
  lookupOrders,
);

router.get('/', authenticate, myOrders);
// Tao don: validate dia chi bat buoc; cho phep khach vang lai (optionalAuthenticate)
router.post('/', optionalAuthenticate, validate(createOrderSchema), createOrder);
router.post(
  '/:id/cancel-pending-qr',
  optionalAuthenticate,
  validateParams(z.object({ id: z.string().regex(/^[a-f\d]{24}$/i, 'Mã đơn không hợp lệ') })),
  cancelPendingQrOrder,
);
// Huy don + hoan kho (chi user so huu, phai dang nhap)
router.post('/:id/cancel', authenticate, cancelOrder);
router.get('/:id/payment', optionalAuthenticate, paymentInfo);
router.get('/:id', optionalAuthenticate, orderDetail);

export default router;
