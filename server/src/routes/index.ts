import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { rateLimit } from '../middlewares/rateLimit.middleware';

import authRoutes from './auth.routes';
import categoryRoutes from './category.routes';
import brandRoutes from './brand.routes';
import productRoutes from './product.routes';
import variantRoutes from './variant.routes';
import reviewRoutes from './review.routes';
import cartRoutes from './cart.routes';
import orderRoutes from './order.routes';
import accountRoutes from './account.routes';
import uploadRoutes from './upload.routes';
import adminRoutes from './admin.routes';
import adminOrderRoutes from './admin-order.routes';
import blogRoutes from './blog.routes';
import siteContentRoutes from './siteContent.routes';
import paymentWebhookRoutes from './payment-webhook.routes';
import supportRoutes from './support.routes';
import scentFamilyCardRoutes from './scentFamilyCard.routes';

const router = Router();

// gioi han so request de chong spam / brute-force (chung cho toan API)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  message: 'Too many API requests, please try again later',
});

router.get('/health', (_req, res) => res.json({ status: 'ok' }));

router.use(apiLimiter);
router.use('/auth', authRoutes);
router.use('/categories', categoryRoutes);
router.use('/brands', brandRoutes);
router.use('/products', productRoutes);
router.use('/variants', variantRoutes);
router.use('/reviews', reviewRoutes);
router.use('/cart', cartRoutes);
router.use('/orders', orderRoutes);
router.use('/payment-webhooks', paymentWebhookRoutes);
router.use('/account', accountRoutes);
router.use('/blog', blogRoutes);
router.use('/site-content', siteContentRoutes);
router.use('/support', supportRoutes);
router.use('/scent-family-cards', scentFamilyCardRoutes);
router.use('/', uploadRoutes);

// Khu vuc quan tri. /admin/orders phai dat TRUOC /admin de khong bi nuot route.
router.use('/admin/orders', adminOrderRoutes);
router.use('/admin', adminRoutes);

router.get('/admin-only', authenticate, authorize('admin'), (_req, res) =>
  res.json({ message: 'Admin only' }),
);

export default router;
