// =============================================================================
//  ADMIN ROUTES  ->  mount tai /api/admin
//  TAT CA route deu yeu cau: authenticate + authorize('admin').
//  Gom toan bo nghiep vu quan tri vao 1 khu vuc rieng, tach khoi API public.
// =============================================================================
import { Router } from 'express';
import { z } from 'zod';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import { scopedUpload, upload } from '../middlewares/upload.middleware';
import { isAdminMediaFolder } from '../config/cloudinary';
import { uploadImage, uploadImages } from '../controllers/upload.controller';
import * as ctrl from '../controllers/admin.controller';
import * as media from '../controllers/media.controller';
import * as blog from '../controllers/blog.controller';
import * as siteContent from '../controllers/siteContent.controller';
import * as reports from '../controllers/report.controller';
import * as promotion from '../controllers/promotion.controller';
import * as scentFamilyCard from '../controllers/scentFamilyCard.controller';

const r = Router();

// Chan cong: chi admin da dang nhap moi vao duoc moi route ben duoi
r.use(authenticate, authorize('admin'));

// ------------------------------------------------------------------ schemas --
const notesSchema = z
  .object({
    top: z.array(z.string()).optional(),
    middle: z.array(z.string()).optional(),
    base: z.array(z.string()).optional(),
  })
  .optional();

const productCreateSchema = z.object({
  name: z.string().min(1, 'Ten san pham la bat buoc'),
  slug: z.string().optional(),
  description: z.string().optional(),
  brand: z.string().optional().nullable(),
  category: z.string().optional().nullable(),
  images: z.array(z.string()).optional(),
  gender: z.string().optional(),
  fragranceFamily: z.string().optional(),
  concentration: z.string().optional(),
  season: z.array(z.string()).optional(),
  notes: notesSchema,
  isActive: z.boolean().optional(),
});
const productUpdateSchema = productCreateSchema.partial();

const variantCreateSchema = z.object({
  product: z.string().min(1),
  sku: z.string().min(1),
  volume: z.string().optional(),
  price: z.number().min(0),
  costPrice: z.number().min(0).optional(),
  stock: z.number().min(0).optional(),
  images: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
  priceHistoryReason: z.string().trim().max(300).optional(),
});
const variantUpdateSchema = variantCreateSchema.partial();

const nameSchema = z.object({ name: z.string().min(1) });
const brandSchema = z.object({
  name: z.string().trim().min(1),
  slug: z.string().trim().optional(),
  description: z.string().trim().optional(),
  image: z.string().trim().optional(),
  logo: z.string().trim().optional(),
  heroImage: z.string().trim().optional(),
  viewCollectionUrl: z.string().trim().optional(),
  journalUrl: z.string().trim().optional(),
  isPublished: z.boolean().optional(),
  country: z.string().trim().optional(),
  website: z.union([z.string().trim().url(), z.literal('')]).optional(),
  foundedYear: z.number().int().min(1000).max(3000).nullable().optional(),
  isFeatured: z.boolean().optional(),
});
const scentFamilyCardSchema = z.object({
  name: z.string().trim().min(1).max(80),
  image: z.string().trim().url(),
  description: z.string().trim().max(500).optional(),
  displayOrder: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
});
const orderStatusSchema = z.object({
  status: z.enum(['pending', 'shipping', 'done', 'cancelled', 'returned']),
});
const paymentStatusSchema = z.object({ status: z.enum(['unpaid', 'paid']) });
const roleSchema = z.object({ role: z.enum(['admin', 'customer']) });
const blogSectionSchema = z.object({
  heading: z.string().trim().optional(),
  body: z.string().trim().min(1),
  image: z.string().trim().optional(),
  imageCaption: z.string().trim().optional(),
});
const blogSchema = z.object({
  title: z.string().trim().min(1),
  slug: z.string().trim().optional(),
  category: z.string().trim().min(1),
  description: z.string().trim().min(1),
  image: z.string().trim().min(1),
  heroImage: z.string().trim().optional(),
  date: z.string().trim().optional(),
  readTime: z.string().trim().optional(),
  author: z.string().trim().optional(),
  sections: z.array(blogSectionSchema).optional(),
  relatedSlugs: z.array(z.string()).optional(),
  status: z.enum(['draft', 'published']).optional(),
});
const siteContentSchema = z.object({
  key: z.string().trim().min(1),
  url: z.string().trim().min(1),
});
const expenseSchema = z.object({
  type: z.enum(['shipping', 'marketing', 'returns', 'operations', 'other']),
  amount: z.number().min(0),
  date: z.string().or(z.date()),
  note: z.string().trim().max(500).optional(),
});
const promotionEvidence = {
  isConcentratedPromotion: z.boolean().optional(),
  referencePriceConfirmed: z.boolean().optional(),
  referencePriceNote: z.string().trim().max(1000).optional(),
};
const voucherSchema = z.object({
  code: z.string().trim().min(2).max(40),
  name: z.string().trim().max(120).optional(),
  type: z.enum(['percentage', 'fixed', 'free_shipping']),
  value: z.number().min(0),
  minOrderValue: z.number().min(0).optional(),
  maxDiscountAmount: z.number().min(0).optional(),
  startDate: z.string(),
  endDate: z.string(),
  usageLimit: z.number().int().min(0).optional(),
  usageLimitPerUser: z.number().int().min(0).optional(),
  stackable: z.boolean().optional(),
  userSegment: z.enum(['ALL', 'NEW', 'RETURNING', 'LOYAL', 'VIP']).optional(),
  appliesToNewMembers: z.boolean().optional(),
  isPrivate: z.boolean().optional(),
  isConcentratedPromotion: z.boolean().optional(),
  isActive: z.boolean().optional(),
});
const discountSchema = z.object({
  name: z.string().trim().min(2),
  scope: z.enum(['PRODUCT', 'CATEGORY']),
  type: z.enum(['PERCENTAGE', 'FIXED']),
  value: z.number().min(0),
  maxDiscountAmount: z.number().min(0).optional(),
  products: z.array(z.string()).optional(),
  categories: z.array(z.string()).optional(),
  priority: z.number().int().optional(),
  startDate: z.string(),
  endDate: z.string(),
  isActive: z.boolean().optional(),
  ...promotionEvidence,
});
const flashSaleSchema = z.object({
  name: z.string().trim().min(2),
  variant: z.string().min(1),
  flashPrice: z.number().min(0),
  stockAllocated: z.number().int().min(1),
  maxPerUser: z.number().int().min(0).optional(),
  startTime: z.string(),
  endTime: z.string(),
  isActive: z.boolean().optional(),
  ...promotionEvidence,
});

// ------------------------------------------------------------------- routes --
// Dashboard
r.get('/stats', ctrl.getStats);
r.get('/search', ctrl.search);
r.get('/notifications', ctrl.notifications);
r.patch('/notifications/:id/seen', ctrl.markNotificationSeen);
r.get('/reports', reports.reports);
r.post('/expenses', validate(expenseSchema), reports.createExpense);
r.delete('/expenses/:id', reports.deleteExpense);
r.patch(
  '/support/:id/status',
  validate(z.object({ status: z.enum(['open', 'in_progress', 'resolved', 'closed']) })),
  reports.updateSupport,
);

// Voucher, discount, flash sale va lich su gia niem yet
r.get('/promotions/vouchers', promotion.listVouchers);
r.post('/promotions/vouchers', validate(voucherSchema), promotion.createVoucher);
r.put('/promotions/vouchers/:id', validate(voucherSchema), promotion.updateVoucher);
r.delete('/promotions/vouchers/:id', promotion.deleteVoucher);
r.get('/promotions/discounts', promotion.listDiscounts);
r.post('/promotions/discounts', validate(discountSchema), promotion.createDiscount);
r.put('/promotions/discounts/:id', validate(discountSchema), promotion.updateDiscount);
r.delete('/promotions/discounts/:id', promotion.deleteDiscount);
r.get('/promotions/flash-sales', promotion.listFlashSales);
r.post('/promotions/flash-sales', validate(flashSaleSchema), promotion.createFlashSale);
r.put('/promotions/flash-sales/:id', validate(flashSaleSchema), promotion.updateFlashSale);
r.delete('/promotions/flash-sales/:id', promotion.deleteFlashSale);
r.get('/promotions/price-history', promotion.priceHistory);

// Products
r.get('/products', ctrl.listProducts);
r.get('/products/:id', ctrl.getProduct);
r.post('/products', validate(productCreateSchema), ctrl.createProduct);
r.put('/products/:id', validate(productUpdateSchema), ctrl.updateProduct);
r.delete('/products/:id', ctrl.deleteProduct);

// Variants
r.get('/variants', ctrl.listVariants);
r.post('/variants', validate(variantCreateSchema), ctrl.createVariant);
r.put('/variants/:id', validate(variantUpdateSchema), ctrl.updateVariant);
r.delete('/variants/:id', ctrl.deleteVariant);

// Brands
r.get('/brands', ctrl.listBrands);
r.get('/brands/:id', ctrl.getBrand);
r.post(
  '/brands/import-defaults',
  validate(z.object({ brands: z.array(brandSchema).max(200) })),
  ctrl.importDefaultBrands,
);
r.post('/brands', validate(brandSchema), ctrl.createBrand);
r.put('/brands/:id', validate(brandSchema), ctrl.updateBrand);
r.delete('/brands/:id', ctrl.deleteBrand);

// Scent family cards on /brand
r.get('/scent-family-cards', scentFamilyCard.listAdmin);
r.post('/scent-family-cards', validate(scentFamilyCardSchema), scentFamilyCard.create);
r.put('/scent-family-cards/:id', validate(scentFamilyCardSchema), scentFamilyCard.update);
r.delete('/scent-family-cards/:id', scentFamilyCard.remove);

// Categories
r.get('/categories', ctrl.listCategories);
r.post('/categories', validate(nameSchema), ctrl.createCategory);
r.put('/categories/:id', validate(nameSchema), ctrl.updateCategory);
r.delete('/categories/:id', ctrl.deleteCategory);

// Orders
r.get('/orders', ctrl.listOrders);
r.get('/orders/:id', ctrl.getOrder);
r.patch('/orders/:id/status', validate(orderStatusSchema), ctrl.updateOrderStatus);
r.patch('/orders/:id/payment', validate(paymentStatusSchema), ctrl.updatePaymentStatus);

// Users
r.get('/users', ctrl.listUsers);
r.patch('/users/:id/role', validate(roleSchema), ctrl.updateUserRole);
r.delete('/users/:id', ctrl.deleteUser);

// Reviews
r.get('/reviews', ctrl.listReviews);
r.patch('/reviews/:id/approve', ctrl.approveReview);
r.patch('/reviews/:id/reject', ctrl.rejectReview);
r.delete('/reviews/:id', ctrl.deleteReview);

// Blog / Tin tuc
r.get('/blog', blog.listAdmin);
r.post('/blog', validate(blogSchema), blog.createAdmin);
r.post(
  '/blog/import-defaults',
  validate(z.object({ articles: z.array(blogSchema).max(200) })),
  blog.importDefaultsAdmin,
);
r.put('/blog/:id', validate(blogSchema), blog.updateAdmin);
r.delete('/blog/:id', blog.deleteAdmin);

// Noi dung trang
r.get('/site-content', siteContent.adminList);
r.put('/site-content', validate(siteContentSchema), siteContent.adminUpdate);
r.post(
  '/site-content/reset',
  validate(z.object({ key: z.string().trim().min(1) })),
  siteContent.adminReset,
);

// Upload anh (tra ve URL de dinh kem san pham / bien the)
r.post('/upload', upload.single('image'), uploadImage);
r.post(
  '/upload/:folder',
  (req, res, next) =>
    isAdminMediaFolder(req.params.folder)
      ? next()
      : res.status(400).json({ success: false, message: 'Thư mục ảnh không hợp lệ' }),
  scopedUpload.single('image'),
  uploadImage,
);

// Media / Cloudinary — quan ly anh toan he thong
r.get('/media/status', media.status);
r.get('/media', media.list);
r.post('/media/upload', upload.array('images', 10), uploadImages);
r.post(
  '/media/upload/:folder',
  (req, res, next) =>
    isAdminMediaFolder(req.params.folder)
      ? next()
      : res.status(400).json({ success: false, message: 'Thư mục ảnh không hợp lệ' }),
  scopedUpload.array('images', 10),
  uploadImages,
);
r.post('/media/delete', media.remove);

export default r;
