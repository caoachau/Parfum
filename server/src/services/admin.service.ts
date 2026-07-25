// =============================================================================
//  ADMIN SERVICE
//  Toan bo nghiep vu quan tri: thong ke, san pham, bien the, thuong hieu,
//  danh muc, don hang, nguoi dung, danh gia.
//  Chi duoc goi tu cac route da qua authenticate + authorize('admin').
// =============================================================================
import { Product } from '../models/product.model';
import { Variant } from '../models/variant.model';
import Brand from '../models/brand.model';
import Category from '../models/category.model';
import { Order } from '../models/order.model';
import { Payment } from '../models/payment.model';
import { User } from '../models/user.model';
import { Review } from '../models/review.model';
import { BlogArticle } from '../models/blogArticle.model';
import { SupportRequest } from '../models/supportRequest.model';
import { releaseOrderPromotionReservations, restoreStock } from './order.service';
import { normalizeOrderStatus } from '../utils/orderStatus';
import { changeVariantBasePrice, ensurePriceHistory } from './promotion.service';
import { sendOrderNotification } from './notification.service';

// ------------------------------------------------------------------ helpers --
const ORDER_STATUSES = ['pending', 'shipping', 'done', 'cancelled', 'returned'] as const;
const PAYMENT_STATUSES = ['unpaid', 'paid'] as const;
type OrderStatus = (typeof ORDER_STATUSES)[number];
type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

function httpError(message: string, status = 400) {
  return Object.assign(new Error(message), { status });
}

function toInt(value: unknown, fallback: number) {
  const n = Number(value);
  return Number.isFinite(n) ? Math.floor(n) : fallback;
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function slugify(input: string) {
  return String(input)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'd')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

async function uniqueSlug(name: string, ignoreId?: string) {
  const base = slugify(name) || 'san-pham';
  let slug = base;
  let i = 1;
  // Tim slug chua duoc dung (bo qua chinh no khi update)
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const existed: any = await Product.findOne({ slug }).select('_id').lean();
    if (!existed || (ignoreId && String(existed._id) === String(ignoreId))) break;
    slug = `${base}-${i++}`;
  }
  return slug;
}

// Sinh slug duy nhat cho mot Model bat ky (Brand, Category, ...).
async function uniqueSlugFor(Model: any, name: string, ignoreId?: string) {
  const base = slugify(name) || 'muc';
  let slug = base;
  let i = 1;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const existed: any = await Model.findOne({ slug }).select('_id').lean();
    if (!existed || (ignoreId && String(existed._id) === String(ignoreId))) break;
    slug = `${base}-${i++}`;
  }
  return slug;
}

function paginate(page?: unknown, limit?: unknown) {
  const p = Math.max(1, toInt(page, 1));
  const l = Math.min(100, Math.max(1, toInt(limit, 20)));
  return { page: p, limit: l, skip: (p - 1) * l };
}

// =============================================================== DASHBOARD ===
export async function getStats() {
  const now = new Date();
  const trendStart = new Date(now.getFullYear(), now.getMonth() - 5, 1);
  const last30Days = new Date(now);
  last30Days.setDate(last30Days.getDate() - 30);

  const [
    productCount,
    activeProductCount,
    variantCount,
    brandCount,
    categoryCount,
    userCount,
    adminCount,
    orderCount,
    pendingReviews,
    newCustomerCount,
  ] = await Promise.all([
    Product.countDocuments({}),
    Product.countDocuments({ isActive: true }),
    Variant.countDocuments({}),
    Brand.countDocuments({}),
    Category.countDocuments({}),
    User.countDocuments({}),
    User.countDocuments({ role: 'admin' }),
    Order.countDocuments({}),
    Review.countDocuments({ approved: false }),
    User.countDocuments({ role: 'customer', createdAt: { $gte: last30Days } }),
  ]);

  // Doanh thu = tong cac don da thanh toan / hoan tat (khong tinh don huy)
  const revenueAgg: any[] = await Order.aggregate([
    { $match: { status: { $in: ['paid', 'shipping', 'done'] } } },
    { $group: { _id: null, total: { $sum: '$total' } } },
  ]);
  const revenue = revenueAgg[0]?.total || 0;

  // Thong ke don theo trang thai
  const byStatusAgg: any[] = await Order.aggregate([
    { $group: { _id: '$status', count: { $sum: 1 } } },
  ]);
  const ordersByStatus: Record<string, number> = {};
  for (const status of ORDER_STATUSES) ordersByStatus[status] = 0;
  for (const row of byStatusAgg) {
    const status = normalizeOrderStatus(row._id);
    ordersByStatus[status] = (ordersByStatus[status] || 0) + row.count;
  }

  const [
    lowStockCount,
    recentOrdersRaw,
    salesSummaryAgg,
    revenueTrendAgg,
    topProductsAgg,
    revenueByBrandAgg,
    revenueByCategoryAgg,
    lowStockItemsRaw,
    recentReviewsRaw,
    newCustomersRaw,
    paymentMethodsAgg,
  ]: any[] = await Promise.all([
    Variant.countDocuments({ stock: { $lte: 5 }, isActive: { $ne: false } }),
    Order.find({}).sort({ createdAt: -1 }).limit(5).populate('user', 'name email').lean(),
    Order.aggregate([
      { $match: { status: { $in: ['paid', 'shipping', 'done'] } } },
      { $unwind: '$items' },
      { $group: { _id: null, quantity: { $sum: '$items.quantity' } } },
    ]),
    Order.aggregate([
      {
        $match: {
          status: { $in: ['paid', 'shipping', 'done'] },
          createdAt: { $gte: trendStart },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
          revenue: { $sum: '$total' },
        },
      },
      { $sort: { _id: 1 } },
    ]),
    Order.aggregate([
      { $match: { status: { $ne: 'cancelled' } } },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.name',
          quantity: { $sum: '$items.quantity' },
          revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
        },
      },
      { $sort: { quantity: -1 } },
      { $limit: 5 },
    ]),
    Order.aggregate([
      { $match: { status: { $in: ['paid', 'shipping', 'done'] } } },
      { $unwind: '$items' },
      {
        $lookup: {
          from: 'variants',
          localField: 'items.variant',
          foreignField: '_id',
          as: 'variant',
        },
      },
      { $unwind: { path: '$variant', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'products',
          localField: 'variant.product',
          foreignField: '_id',
          as: 'product',
        },
      },
      { $unwind: { path: '$product', preserveNullAndEmptyArrays: true } },
      {
        $lookup: { from: 'brands', localField: 'product.brand', foreignField: '_id', as: 'brand' },
      },
      { $unwind: { path: '$brand', preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: { $ifNull: ['$brand.name', 'Khác'] },
          value: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
        },
      },
      { $sort: { value: -1 } },
      { $limit: 4 },
    ]),
    Order.aggregate([
      { $match: { status: { $in: ['paid', 'shipping', 'done'] } } },
      { $unwind: '$items' },
      {
        $lookup: {
          from: 'variants',
          localField: 'items.variant',
          foreignField: '_id',
          as: 'variant',
        },
      },
      { $unwind: { path: '$variant', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'products',
          localField: 'variant.product',
          foreignField: '_id',
          as: 'product',
        },
      },
      { $unwind: { path: '$product', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'categories',
          localField: 'product.category',
          foreignField: '_id',
          as: 'category',
        },
      },
      { $unwind: { path: '$category', preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: { $ifNull: ['$category.name', 'Khác'] },
          value: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
        },
      },
      { $sort: { value: -1 } },
      { $limit: 5 },
    ]),
    Variant.find({ stock: { $lte: 5 }, isActive: { $ne: false } })
      .sort({ stock: 1 })
      .limit(5)
      .populate('product', 'name')
      .lean(),
    Review.find({ approved: true })
      .sort({ createdAt: -1 })
      .limit(3)
      .populate('user', 'name')
      .populate('product', 'name')
      .lean(),
    User.aggregate([
      { $match: { role: 'customer' } },
      { $sort: { createdAt: -1 } },
      { $limit: 4 },
      { $lookup: { from: 'orders', localField: '_id', foreignField: 'user', as: 'orders' } },
      { $project: { name: 1, createdAt: 1, orderCount: { $size: '$orders' } } },
    ]),
    Payment.aggregate([
      { $match: { method: { $in: ['cod', 'bank_qr'] } } },
      { $group: { _id: '$method', count: { $sum: 1 }, amount: { $sum: '$amount' } } },
      { $sort: { count: -1 } },
    ]),
  ]);

  const recentOrders = recentOrdersRaw.map((o: any) => ({
    id: String(o._id),
    customer: o.user?.name || o.address?.fullName || 'Khach vang lai',
    total: o.total || 0,
    status: o.status,
    createdAt: o.createdAt,
    itemCount: (o.items || []).reduce((s: number, it: any) => s + (it.quantity || 0), 0),
  }));

  const revenueByMonth = new Map(revenueTrendAgg.map((row: any) => [row._id, row.revenue]));
  const revenueTrend = Array.from({ length: 6 }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - 5 + index, 1);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    return { key, label: `T${date.getMonth() + 1}`, revenue: Number(revenueByMonth.get(key) || 0) };
  });

  const totalPaymentCount = paymentMethodsAgg.reduce((sum: number, row: any) => sum + row.count, 0);

  return {
    productCount,
    activeProductCount,
    variantCount,
    brandCount,
    categoryCount,
    userCount,
    adminCount,
    orderCount,
    pendingReviews,
    newCustomerCount,
    revenue,
    productsSold: salesSummaryAgg[0]?.quantity || 0,
    lowStockCount,
    ordersByStatus,
    recentOrders,
    revenueTrend,
    topProducts: topProductsAgg.map((row: any) => ({
      name: row._id || 'Sản phẩm',
      quantity: row.quantity || 0,
      revenue: row.revenue || 0,
    })),
    revenueByBrand: revenueByBrandAgg.map((row: any) => ({ name: row._id, value: row.value || 0 })),
    revenueByCategory: revenueByCategoryAgg.map((row: any) => ({
      name: row._id,
      value: row.value || 0,
    })),
    lowStockItems: lowStockItemsRaw.map((variant: any) => ({
      id: String(variant._id),
      name: variant.product?.name || variant.sku,
      volume: variant.volume || variant.size || '',
      stock: variant.stock || 0,
    })),
    recentReviews: recentReviewsRaw.map((review: any) => ({
      id: String(review._id),
      userName: review.user?.name || review.guestName || 'Khách hàng',
      productName: review.product?.name || '',
      rating: review.rating,
      comment: review.comment,
      createdAt: review.createdAt,
    })),
    newCustomers: newCustomersRaw.map((customer: any) => ({
      id: String(customer._id),
      name: customer.name,
      createdAt: customer.createdAt,
      orderCount: customer.orderCount || 0,
    })),
    paymentMethods: paymentMethodsAgg.map((row: any) => ({
      method: row._id || 'other',
      count: row.count,
      amount: row.amount || 0,
      percentage: totalPaymentCount > 0 ? Math.round((row.count / totalPaymentCount) * 100) : 0,
    })),
  };
}

export async function globalSearch(rawQuery: unknown) {
  const query = String(rawQuery || '')
    .trim()
    .slice(0, 80);
  if (query.length < 2) return { query, groups: [], total: 0 };
  const regex = new RegExp(escapeRegExp(query), 'i');

  const [
    orders,
    users,
    products,
    variants,
    brands,
    categories,
    reviews,
    articles,
    supportRequests,
  ]: any[] = await Promise.all([
    Order.aggregate([
      { $addFields: { searchId: { $toString: '$_id' } } },
      {
        $match: {
          $or: [
            { searchId: regex },
            { 'address.fullName': regex },
            { 'address.email': regex },
            { 'address.phone': regex },
            { note: regex },
          ],
        },
      },
      { $sort: { createdAt: -1 } },
      { $limit: 5 },
      { $lookup: { from: 'users', localField: 'user', foreignField: '_id', as: 'userDoc' } },
      { $unwind: { path: '$userDoc', preserveNullAndEmptyArrays: true } },
    ]),
    User.find({ $or: [{ name: regex }, { email: regex }, { phone: regex }] })
      .sort({ createdAt: -1 })
      .limit(5)
      .lean(),
    Product.find({ $or: [{ name: regex }, { slug: regex }, { description: regex }] })
      .sort({ updatedAt: -1 })
      .limit(5)
      .populate('brand', 'name')
      .lean(),
    Variant.find({ $or: [{ sku: regex }, { volume: regex }, { size: regex }] })
      .sort({ updatedAt: -1 })
      .limit(5)
      .populate('product', 'name')
      .lean(),
    Brand.find({ $or: [{ name: regex }, { slug: regex }, { description: regex }] })
      .sort({ name: 1 })
      .limit(5)
      .lean(),
    Category.find({ $or: [{ name: regex }, { slug: regex }] })
      .sort({ name: 1 })
      .limit(5)
      .lean(),
    Review.find({
      $or: [{ title: regex }, { comment: regex }, { guestName: regex }, { guestEmail: regex }],
    })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('product', 'name')
      .lean(),
    BlogArticle.find({
      $or: [
        { title: regex },
        { description: regex },
        { category: regex },
        { author: regex },
        { slug: regex },
      ],
    })
      .sort({ updatedAt: -1 })
      .limit(5)
      .lean(),
    SupportRequest.find({
      $or: [{ name: regex }, { email: regex }, { subject: regex }, { message: regex }],
    })
      .sort({ createdAt: -1 })
      .limit(5)
      .lean(),
  ]);

  const groups = [
    {
      key: 'orders',
      label: 'Đơn hàng',
      items: orders.map((order: any) => ({
        id: String(order._id),
        type: 'order',
        title: `#${String(order._id).slice(-6).toUpperCase()} · ${order.address?.fullName || order.userDoc?.name || 'Khách vãng lai'}`,
        subtitle: `${order.address?.phone || order.address?.email || ''} · ${Number(order.total || 0).toLocaleString('vi-VN')}đ`,
        to: `/admin/orders?open=${order._id}`,
      })),
    },
    {
      key: 'users',
      label: 'Người dùng',
      items: users.map((user: any) => ({
        id: String(user._id),
        type: 'user',
        title: user.name,
        subtitle: [user.email, user.phone].filter(Boolean).join(' · '),
        to: '/admin/users',
      })),
    },
    {
      key: 'products',
      label: 'Sản phẩm',
      items: products.map((product: any) => ({
        id: String(product._id),
        type: 'product',
        title: product.name,
        subtitle: product.brand?.name || product.slug,
        to: '/admin/products',
      })),
    },
    {
      key: 'variants',
      label: 'Biến thể',
      items: variants.map((variant: any) => ({
        id: String(variant._id),
        type: 'variant',
        title: `${variant.product?.name || 'Biến thể'} · ${variant.volume || variant.size || ''}`,
        subtitle: `${variant.sku} · Tồn ${variant.stock || 0}`,
        to: '/admin/variants',
      })),
    },
    {
      key: 'brands',
      label: 'Thương hiệu',
      items: brands.map((brand: any) => ({
        id: String(brand._id),
        type: 'brand',
        title: brand.name,
        subtitle: brand.country || brand.website || brand.slug || '',
        to: '/admin/brands',
      })),
    },
    {
      key: 'categories',
      label: 'Danh mục',
      items: categories.map((category: any) => ({
        id: String(category._id),
        type: 'category',
        title: category.name,
        subtitle: category.slug || '',
        to: '/admin/categories',
      })),
    },
    {
      key: 'reviews',
      label: 'Đánh giá',
      items: reviews.map((review: any) => ({
        id: String(review._id),
        type: 'review',
        title: review.title || review.comment.slice(0, 70),
        subtitle: `${review.product?.name || 'Sản phẩm'} · ${review.rating}/5 sao`,
        to: '/admin/reviews',
      })),
    },
    {
      key: 'articles',
      label: 'Tin tức',
      items: articles.map((article: any) => ({
        id: String(article._id),
        type: 'article',
        title: article.title,
        subtitle: `${article.category} · ${article.status === 'published' ? 'Đã xuất bản' : 'Bản nháp'}`,
        to: '/admin/blog',
      })),
    },
    {
      key: 'support',
      label: 'Yêu cầu hỗ trợ',
      items: supportRequests.map((request: any) => ({
        id: String(request._id),
        type: 'support',
        title: request.subject,
        subtitle: `${request.name} · ${request.email}`,
        to: '/admin/reports/operations',
      })),
    },
  ].filter((group) => group.items.length > 0);

  return { query, groups, total: groups.reduce((sum, group) => sum + group.items.length, 0) };
}

export async function getNotifications() {
  const [pendingOrders, lowStock, pendingReviews, draftArticles, unpaidQr, openSupport] =
    await Promise.all([
      Order.countDocuments({ status: { $in: ['pending', 'paid'] } }),
      Variant.countDocuments({ stock: { $lte: 5 }, isActive: { $ne: false } }),
      Review.countDocuments({ approved: false }),
      BlogArticle.countDocuments({ status: 'draft' }),
      Payment.countDocuments({ method: 'bank_qr', status: 'unpaid' }),
      SupportRequest.countDocuments({ status: { $in: ['open', 'in_progress'] } }),
    ]);
  const items = [
    {
      id: 'pending-orders',
      count: pendingOrders,
      severity: 'warning',
      title: 'Đơn hàng chờ xử lý',
      description: `${pendingOrders} đơn cần được kiểm tra`,
      to: '/admin/orders?status=pending',
    },
    {
      id: 'low-stock',
      count: lowStock,
      severity: 'danger',
      title: 'Sản phẩm sắp hết hàng',
      description: `${lowStock} biến thể còn tối đa 5 sản phẩm`,
      to: '/admin/variants?lowStock=true',
    },
    {
      id: 'pending-reviews',
      count: pendingReviews,
      severity: 'info',
      title: 'Đánh giá chờ duyệt',
      description: `${pendingReviews} đánh giá cần kiểm duyệt`,
      to: '/admin/reviews?status=pending',
    },
    {
      id: 'draft-articles',
      count: draftArticles,
      severity: 'neutral',
      title: 'Bài viết chưa xuất bản',
      description: `${draftArticles} bài đang ở trạng thái nháp`,
      to: '/admin/blog',
    },
    {
      id: 'unpaid-qr',
      count: unpaidQr,
      severity: 'warning',
      title: 'Thanh toán QR chưa hoàn tất',
      description: `${unpaidQr} giao dịch đang chờ đối soát`,
      to: '/admin/orders?payment=unpaid&method=bank_qr',
    },
    {
      id: 'open-support',
      count: openSupport,
      severity: 'info',
      title: 'Yêu cầu hỗ trợ',
      description: `${openSupport} yêu cầu đang chờ xử lý`,
      to: '/admin/reports/operations',
    },
  ].filter((item) => item.count > 0);
  return { items, total: items.reduce((sum, item) => sum + item.count, 0), updatedAt: new Date() };
}

export async function markNotificationSeen(id: string) {
  return getNotifications();
}

// ================================================================ PRODUCTS ===
function normalizeProduct(product: any, variants: any[] = []) {
  const prices = variants.map((v) => v.price).filter((p) => typeof p === 'number');
  const stock = variants.reduce((s, v) => s + (v.stock || 0), 0);
  return {
    id: String(product._id),
    name: product.name,
    slug: product.slug,
    description: product.description || '',
    brand: product.brand
      ? { id: String(product.brand._id || product.brand), name: product.brand.name }
      : null,
    category: product.category
      ? { id: String(product.category._id || product.category), name: product.category.name }
      : null,
    images: product.images || [],
    gender: product.gender || '',
    fragranceFamily: product.fragranceFamily || '',
    concentration: product.concentration || '',
    season: product.season || [],
    notes: product.notes || { top: [], middle: [], base: [] },
    isActive: product.isActive !== false,
    variantCount: variants.length,
    minPrice: prices.length ? Math.min(...prices) : null,
    stock,
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
  };
}

export async function listProducts(query: Record<string, any> = {}) {
  const { page, limit, skip } = paginate(query.page, query.limit);
  const filter: Record<string, unknown> = {};

  if (query.search) {
    filter.$or = [
      { name: { $regex: String(query.search).trim(), $options: 'i' } },
      { slug: { $regex: String(query.search).trim(), $options: 'i' } },
    ];
  }
  if (query.brand) filter.brand = query.brand;
  if (query.category) filter.category = query.category;
  if (query.status === 'active') filter.isActive = true;
  if (query.status === 'inactive') filter.isActive = false;

  const [products, total] = await Promise.all([
    Product.find(filter)
      .populate('brand', 'name')
      .populate('category', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Product.countDocuments(filter),
  ]);

  const ids = products.map((p: any) => p._id);
  const variants: any[] = await Variant.find({ product: { $in: ids } })
    .select('product price stock')
    .lean();
  const byProduct = new Map<string, any[]>();
  for (const v of variants) {
    const key = String(v.product);
    byProduct.set(key, [...(byProduct.get(key) || []), v]);
  }

  return {
    data: products.map((p: any) => normalizeProduct(p, byProduct.get(String(p._id)) || [])),
    total,
    page,
    limit,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
}

export async function getProduct(id: string) {
  const product: any = await Product.findById(id)
    .populate('brand', 'name')
    .populate('category', 'name')
    .lean();
  if (!product) throw httpError('Không tìm thấy sản phẩm', 404);
  const variants: any[] = await Variant.find({ product: id }).sort({ price: 1 }).lean();
  return {
    ...normalizeProduct(product, variants),
    variants: variants.map((v) => ({
      id: String(v._id),
      sku: v.sku,
      volume: v.volume || v.size || '',
      price: v.price,
      stock: v.stock || 0,
      images: v.images || [],
      isActive: v.isActive !== false,
    })),
  };
}

export async function createProduct(input: any) {
  if (!input?.name?.trim()) throw httpError('Ten san pham la bat buoc');
  const slug = input.slug?.trim()
    ? await uniqueSlug(input.slug, undefined)
    : await uniqueSlug(input.name);

  const product: any = await Product.create({
    name: input.name.trim(),
    slug,
    description: input.description?.trim() || '',
    brand: input.brand || undefined,
    category: input.category || undefined,
    images: Array.isArray(input.images) ? input.images.filter(Boolean) : [],
    gender: input.gender || '',
    fragranceFamily: input.fragranceFamily || '',
    concentration: input.concentration || '',
    season: Array.isArray(input.season) ? input.season : [],
    notes: {
      top: input.notes?.top || [],
      middle: input.notes?.middle || [],
      base: input.notes?.base || [],
    },
    isActive: input.isActive !== false,
  });
  return getProduct(String(product._id));
}

export async function updateProduct(id: string, input: any) {
  const product: any = await Product.findById(id);
  if (!product) throw httpError('Không tìm thấy sản phẩm', 404);

  if (input.name !== undefined) product.name = input.name.trim();
  if (input.slug !== undefined && input.slug.trim()) {
    product.slug = await uniqueSlug(input.slug, id);
  }
  if (input.description !== undefined) product.description = input.description;
  if (input.brand !== undefined) product.brand = input.brand || undefined;
  if (input.category !== undefined) product.category = input.category || undefined;
  if (input.images !== undefined)
    product.images = Array.isArray(input.images) ? input.images.filter(Boolean) : [];
  if (input.gender !== undefined) product.gender = input.gender;
  if (input.fragranceFamily !== undefined) product.fragranceFamily = input.fragranceFamily;
  if (input.concentration !== undefined) product.concentration = input.concentration;
  if (input.season !== undefined) product.season = Array.isArray(input.season) ? input.season : [];
  if (input.notes !== undefined) {
    product.notes = {
      top: input.notes?.top || [],
      middle: input.notes?.middle || [],
      base: input.notes?.base || [],
    };
  }
  if (input.isActive !== undefined) product.isActive = Boolean(input.isActive);

  await product.save();
  return getProduct(id);
}

export async function deleteProduct(id: string) {
  const product = await Product.findById(id);
  if (!product) throw httpError('Không tìm thấy sản phẩm', 404);
  // Xoa luon cac bien the con lai de tranh du lieu mo coi
  await Variant.deleteMany({ product: id });
  await product.deleteOne();
  return { id, deleted: true };
}

// ================================================================ VARIANTS ===
export async function listVariants(query: Record<string, any> = {}) {
  const filter: Record<string, unknown> = {};
  if (query.product) filter.product = query.product;
  if (query.lowStock === 'true' || query.lowStock === true) {
    filter.stock = { $lte: 5 };
    filter.isActive = { $ne: false };
  }
  if (query.search) filter.sku = { $regex: String(query.search).trim(), $options: 'i' };

  const variants: any[] = await Variant.find(filter)
    .populate('product', 'name slug images')
    .sort({ createdAt: -1 })
    .lean();

  return variants.map((v) => ({
    id: String(v._id),
    sku: v.sku,
    volume: v.volume || v.size || '',
    price: Number(v.basePrice ?? v.price),
    costPrice: v.costPrice || 0,
    stock: v.stock || 0,
    images: v.images || [],
    isActive: v.isActive !== false,
    product: v.product
      ? { id: String(v.product._id), name: v.product.name, slug: v.product.slug }
      : null,
    createdAt: v.createdAt,
  }));
}

export async function createVariant(input: any, adminId?: string) {
  if (!input?.product) throw httpError('Thieu san pham cho bien the');
  if (!input?.sku?.trim()) throw httpError('SKU la bat buoc');
  if (input.price === undefined || input.price === null) throw httpError('Gia la bat buoc');

  const productExists = await Product.exists({ _id: input.product });
  if (!productExists) throw httpError('Sản phẩm không tồn tại', 404);

  const existed = await Variant.findOne({ sku: input.sku.trim() });
  if (existed) throw httpError('SKU da ton tai', 409);

  const variant: any = await Variant.create({
    product: input.product,
    sku: input.sku.trim(),
    volume: input.volume?.trim() || '',
    price: Number(input.price),
    basePrice: Number(input.price),
    costPrice: Number(input.costPrice || 0),
    stock: Number(input.stock || 0),
    images: Array.isArray(input.images) ? input.images.filter(Boolean) : [],
    isActive: input.isActive !== false,
  });
  await ensurePriceHistory(variant, adminId);
  return variant.toObject();
}

export async function updateVariant(id: string, input: any, adminId?: string) {
  const variant: any = await Variant.findById(id);
  if (!variant) throw httpError('Không tìm thấy biến thể', 404);

  if (input.sku !== undefined && input.sku.trim() !== variant.sku) {
    const dup = await Variant.findOne({ sku: input.sku.trim(), _id: { $ne: id } });
    if (dup) throw httpError('SKU da ton tai', 409);
    variant.sku = input.sku.trim();
  }
  if (input.product !== undefined) variant.product = input.product;
  if (input.volume !== undefined) variant.volume = input.volume;
  if (input.price !== undefined) {
    await changeVariantBasePrice(variant, Number(input.price), adminId, input.priceHistoryReason);
  }
  if (input.costPrice !== undefined) variant.costPrice = Number(input.costPrice);
  if (input.stock !== undefined) variant.stock = Number(input.stock);
  if (input.images !== undefined)
    variant.images = Array.isArray(input.images) ? input.images.filter(Boolean) : [];
  if (input.isActive !== undefined) variant.isActive = Boolean(input.isActive);

  await variant.save();
  return variant.toObject();
}

export async function deleteVariant(id: string) {
  const variant = await Variant.findByIdAndDelete(id);
  if (!variant) throw httpError('Không tìm thấy biến thể', 404);
  return { id, deleted: true };
}

// ================================================================== BRANDS ===
export async function listBrands() {
  const brands: any[] = await Brand.find().sort({ name: 1 }).lean();
  const counts: any[] = await Product.aggregate([
    { $match: { brand: { $ne: null } } },
    { $group: { _id: '$brand', count: { $sum: 1 } } },
  ]);
  const countMap = new Map(counts.map((c) => [String(c._id), c.count]));
  return brands.map((b) => ({
    id: String(b._id),
    name: b.name,
    slug: b.slug || '',
    description: b.description || '',
    logo: b.logo || '',
    heroImage: b.heroImage || '',
    viewCollectionUrl: b.viewCollectionUrl || '',
    journalUrl: b.journalUrl || '',
    isPublished: b.isPublished !== false,
    country: b.country || '',
    website: b.website || '',
    foundedYear: b.foundedYear || null,
    isFeatured: Boolean(b.isFeatured),
    productCount: countMap.get(String(b._id)) || 0,
    createdAt: b.createdAt,
  }));
}

export async function importDefaultBrands(brands: any[]) {
  let imported = 0;
  let updated = 0;

  for (const input of brands || []) {
    const name = String(input.name || '').trim();
    if (!name) continue;

    const existing: any = await Brand.findOne({
      $or: [
        { name: { $regex: `^${escapeRegExp(name)}$`, $options: 'i' } },
        ...(input.slug ? [{ slug: String(input.slug).trim().toLowerCase() }] : []),
      ],
    });

    const data = {
      name,
      description: String(input.description || '').trim(),
      logo: String(input.logo || input.image || '').trim(),
      heroImage: String(input.heroImage || input.image || '').trim(),
      viewCollectionUrl: String(input.viewCollectionUrl || '').trim(),
      journalUrl: String(input.journalUrl || '').trim(),
      isPublished: input.isPublished !== false,
      country: String(input.country || '').trim(),
      website: String(input.website || '').trim(),
      foundedYear: input.foundedYear || undefined,
      isFeatured: Boolean(input.isFeatured),
    };

    if (!existing) {
      await Brand.create({
        ...data,
        slug: await uniqueSlugFor(Brand, input.slug || name),
      });
      imported += 1;
      continue;
    }

    const patch: Record<string, unknown> = {};
    for (const field of [
      'description',
      'logo',
      'heroImage',
      'viewCollectionUrl',
      'journalUrl',
      'country',
      'website',
    ] as const) {
      if (!existing[field] && data[field]) patch[field] = data[field];
    }
    if (!existing.foundedYear && data.foundedYear) patch.foundedYear = data.foundedYear;
    if (!existing.isFeatured && data.isFeatured) patch.isFeatured = true;
    if (existing.isPublished === undefined) patch.isPublished = data.isPublished;
    if (!existing.slug)
      patch.slug = await uniqueSlugFor(Brand, input.slug || name, String(existing._id));

    if (Object.keys(patch).length) {
      await Brand.updateOne({ _id: existing._id }, { $set: patch });
      updated += 1;
    }
  }

  return { imported, updated, total: brands?.length || 0 };
}

export async function createBrand(input: any) {
  if (!input?.name?.trim()) throw httpError('Ten thuong hieu la bat buoc');
  if (!String(input.heroImage || '').trim()) throw httpError('Anh hero la bat buoc');
  if (!String(input.description || '').trim()) throw httpError('Mo ta thuong hieu la bat buoc');
  const name = input.name.trim();
  const requestedSlug = String(input.slug || name).trim();
  const slug = await uniqueSlugFor(Brand, requestedSlug || name);
  const existed = await Brand.findOne({
    $or: [{ name: { $regex: `^${escapeRegExp(name)}$`, $options: 'i' } }, { slug }],
  });
  if (existed) throw httpError('Thuong hieu da ton tai', 409);
  const brand: any = await Brand.create({
    name,
    slug,
    description: String(input.description || '').trim(),
    logo: String(input.logo || '').trim(),
    heroImage: String(input.heroImage || '').trim(),
    viewCollectionUrl: String(
      input.viewCollectionUrl || `/shop?brand=${encodeURIComponent(name)}`,
    ).trim(),
    journalUrl: String(input.journalUrl || '').trim(),
    isPublished: input.isPublished !== false,
    country: String(input.country || '').trim(),
    website: String(input.website || '').trim(),
    foundedYear: input.foundedYear || undefined,
    isFeatured: Boolean(input.isFeatured),
  });
  return { id: String(brand._id), name: brand.name, productCount: 0 };
}

export async function updateBrand(id: string, input: any) {
  if (!input?.name?.trim()) throw httpError('Ten thuong hieu la bat buoc');
  if (!String(input.heroImage || '').trim()) throw httpError('Anh hero la bat buoc');
  if (!String(input.description || '').trim()) throw httpError('Mo ta thuong hieu la bat buoc');
  const name = input.name.trim();
  const slug = await uniqueSlugFor(Brand, String(input.slug || name).trim() || name, id);
  const brand: any = await Brand.findByIdAndUpdate(
    id,
    {
      name,
      slug,
      description: String(input.description || '').trim(),
      logo: String(input.logo || '').trim(),
      heroImage: String(input.heroImage || '').trim(),
      viewCollectionUrl: String(
        input.viewCollectionUrl || `/shop?brand=${encodeURIComponent(name)}`,
      ).trim(),
      journalUrl: String(input.journalUrl || '').trim(),
      isPublished: input.isPublished !== false,
      country: String(input.country || '').trim(),
      website: String(input.website || '').trim(),
      foundedYear: input.foundedYear || null,
      isFeatured: Boolean(input.isFeatured),
    },
    { new: true, runValidators: true },
  );
  if (!brand) throw httpError('Không tìm thấy thương hiệu', 404);
  return { id: String(brand._id), name: brand.name };
}

export async function getBrand(id: string) {
  const brand: any = await Brand.findById(id).lean();
  if (!brand) throw httpError('Không tìm thấy thương hiệu', 404);
  return (
    (await listBrands()).find((item) => item.id === String(brand._id)) || {
      id: String(brand._id),
      name: brand.name,
    }
  );
}

export async function deleteBrand(id: string) {
  const inUse = await Product.countDocuments({ brand: id });
  if (inUse > 0)
    throw httpError(`Không thể xóa: còn ${inUse} sản phẩm đang dùng thương hiệu này`, 409);
  const brand = await Brand.findByIdAndDelete(id);
  if (!brand) throw httpError('Không tìm thấy thương hiệu', 404);
  return { id, deleted: true };
}

// ============================================================== CATEGORIES ===
export async function listCategories() {
  const categories: any[] = await Category.find().sort({ name: 1 }).lean();
  const counts: any[] = await Product.aggregate([
    { $match: { category: { $ne: null } } },
    { $group: { _id: '$category', count: { $sum: 1 } } },
  ]);
  const countMap = new Map(counts.map((c) => [String(c._id), c.count]));
  return categories.map((c) => ({
    id: String(c._id),
    name: c.name,
    productCount: countMap.get(String(c._id)) || 0,
    createdAt: c.createdAt,
  }));
}

export async function createCategory(input: any) {
  if (!input?.name?.trim()) throw httpError('Ten danh muc la bat buoc');
  const existed = await Category.findOne({ name: input.name.trim() });
  if (existed) throw httpError('Danh muc da ton tai', 409);
  const category: any = await Category.create({
    name: input.name.trim(),
    slug: await uniqueSlugFor(Category, input.name.trim()),
  });
  return { id: String(category._id), name: category.name, productCount: 0 };
}

export async function updateCategory(id: string, input: any) {
  if (!input?.name?.trim()) throw httpError('Ten danh muc la bat buoc');
  const category: any = await Category.findByIdAndUpdate(
    id,
    { name: input.name.trim(), slug: await uniqueSlugFor(Category, input.name.trim(), id) },
    { new: true, runValidators: true },
  );
  if (!category) throw httpError('Không tìm thấy danh mục', 404);
  return { id: String(category._id), name: category.name };
}

export async function deleteCategory(id: string) {
  const inUse = await Product.countDocuments({ category: id });
  if (inUse > 0)
    throw httpError(`Không thể xóa: còn ${inUse} sản phẩm đang dùng danh mục này`, 409);
  const category = await Category.findByIdAndDelete(id);
  if (!category) throw httpError('Không tìm thấy danh mục', 404);
  return { id, deleted: true };
}

// ================================================================== ORDERS ===
function normalizeOrder(order: any, payment?: any) {
  return {
    id: String(order._id),
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
    status: normalizeOrderStatus(order.status),
    total: order.total || 0,
    note: order.note || '',
    address: order.address || null,
    customer: order.user
      ? { id: String(order.user._id), name: order.user.name, email: order.user.email }
      : null,
    itemCount: (order.items || []).reduce((s: number, it: any) => s + (it.quantity || 0), 0),
    items: (order.items || []).map((it: any) => ({
      variant: it.variant ? String(it.variant) : '',
      name: it.name,
      volume: it.volume,
      price: it.price || 0,
      basePrice: it.basePrice ?? it.price ?? 0,
      finalPrice: it.finalPrice ?? it.price ?? 0,
      productDiscountAmount: it.productDiscountAmount || 0,
      promotionType: it.promotionType || null,
      promotionName: it.promotionName || '',
      quantity: it.quantity || 0,
      lineTotal: (it.price || 0) * (it.quantity || 0),
    })),
    payment: payment
      ? {
          method: payment.method,
          status: payment.status,
          amount: payment.amount,
          receivedAmount: payment.receivedAmount ?? null,
          bankReference: payment.bankReference || '',
          providerTransactionId: payment.providerTransactionId || '',
        }
      : null,
  };
}

export async function listOrders(query: Record<string, any> = {}) {
  const { page, limit, skip } = paginate(query.page, query.limit);
  const filter: Record<string, unknown> = {};
  if (query.status === 'pending') filter.status = { $in: ['pending', 'paid'] };
  else if (query.status && ORDER_STATUSES.includes(query.status)) filter.status = query.status;

  const paymentFilter: Record<string, unknown> = {};
  if (PAYMENT_STATUSES.includes(query.paymentStatus as PaymentStatus)) {
    paymentFilter.status = query.paymentStatus;
  }
  if (['cod', 'bank_qr'].includes(String(query.paymentMethod))) {
    paymentFilter.method = query.paymentMethod;
  }
  if (Object.keys(paymentFilter).length > 0) {
    const orderIds = await Payment.distinct('order', paymentFilter);
    filter._id = { $in: orderIds };
  }

  const [orders, total] = await Promise.all([
    Order.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('user', 'name email')
      .lean(),
    Order.countDocuments(filter),
  ]);

  const ids = orders.map((o: any) => o._id);
  const payments: any[] = await Payment.find({ order: { $in: ids } }).lean();
  const payMap = new Map(payments.map((p) => [String(p.order), p]));

  return {
    data: orders.map((o: any) => normalizeOrder(o, payMap.get(String(o._id)))),
    total,
    page,
    limit,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
}

export async function getOrder(id: string) {
  let order: any = null;
  try {
    order = await Order.findById(id).populate('user', 'name email').lean();
  } catch {
    throw httpError('Không tìm thấy đơn hàng', 404);
  }
  if (!order) throw httpError('Không tìm thấy đơn hàng', 404);
  const payment: any = await Payment.findOne({ order: order._id }).lean();
  return normalizeOrder(order, payment);
}

export async function updateOrderStatus(id: string, status: string) {
  if (!ORDER_STATUSES.includes(status as OrderStatus))
    throw httpError('Trạng thái đơn hàng không hợp lệ');
  const order: any = await Order.findById(id);
  if (!order) throw httpError('Không tìm thấy đơn hàng', 404);

  const previousStatus = normalizeOrderStatus(order.status);
  const wasCancelled = previousStatus === 'cancelled';
  const wasReturned = previousStatus === 'returned';
  order.status = status;

  // Huy don -> hoan lai ton kho (chi 1 lan) va danh dau thanh toan la unpaid
  if (status === 'cancelled' && !wasCancelled) {
    await releaseOrderPromotionReservations(order);
    const items = (order.items || []).map((it: any) => ({
      variant: String(it.variant),
      quantity: it.quantity,
    }));
    await restoreStock(items);
    await Payment.updateOne(
      { order: order._id },
      { $set: { status: 'unpaid' }, $unset: { paidAt: 1 } },
    );
  }

  if (status === 'returned' && !wasReturned) {
    const items = (order.items || []).map((it: any) => ({
      variant: String(it.variant),
      quantity: it.quantity,
    }));
    await restoreStock(items);
    await Payment.updateOne(
      { order: order._id, status: 'paid' },
      { $set: { status: 'refunded', refundedAt: new Date() } },
    );
  }

  // COD duoc xem la da thu tien khi don hoan tat.
  if (status === 'done') {
    await Payment.updateOne(
      {
        order: order._id,
        method: 'cod',
        $or: [{ status: { $ne: 'paid' } }, { paidAt: null }],
      },
      { $set: { status: 'paid', paidAt: new Date() } },
    );
  }

  const now = new Date();
  order.statusHistory.push({ status, at: now });
  if (status === 'shipping') {
    order.processedAt ||= now;
    order.shippedAt ||= now;
  }
  if (status === 'done') order.completedAt ||= now;
  if (status === 'cancelled') order.cancelledAt ||= now;
  if (status === 'returned') order.returnedAt ||= now;
  await order.save();
  if (previousStatus !== status) {
    void sendOrderNotification(String(order._id), 'status').catch(() => null);
  }

  return getOrder(id);
}

export async function updatePaymentStatus(id: string, status: string) {
  if (!PAYMENT_STATUSES.includes(status as PaymentStatus))
    throw httpError('Trạng thái thanh toán không hợp lệ');
  const order = await Order.findById(id);
  if (!order) throw httpError('Không tìm thấy đơn hàng', 404);
  const payment = await Payment.findOneAndUpdate(
    { order: id },
    status === 'paid'
      ? { $set: { status: 'paid', paidAt: new Date() } }
      : { $set: { status: 'unpaid' }, $unset: { paidAt: 1 } },
    { new: true },
  );
  if (!payment) throw httpError('Không tìm thấy bản ghi thanh toán', 404);
  return getOrder(id);
}

// =================================================================== USERS ===
function normalizeUser(user: any) {
  return {
    id: String(user._id),
    name: user.name,
    email: user.email,
    role: user.role,
    phone: user.phone || '',
    loyaltyPoints: user.loyaltyPoints || 0,
    isEmailVerified: Boolean(user.isEmailVerified),
    addressCount: (user.addresses || []).length,
    lastLoginAt: user.lastLoginAt || null,
    createdAt: user.createdAt,
  };
}

export async function listUsers(query: Record<string, any> = {}) {
  const { page, limit, skip } = paginate(query.page, query.limit);
  const filter: Record<string, unknown> = {};
  if (query.role === 'admin' || query.role === 'customer') filter.role = query.role;
  if (query.search) {
    filter.$or = [
      { name: { $regex: String(query.search).trim(), $options: 'i' } },
      { email: { $regex: String(query.search).trim(), $options: 'i' } },
    ];
  }

  const [users, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    User.countDocuments(filter),
  ]);

  // Dem so don cua tung user
  const ids = users.map((u: any) => u._id);
  const orderCounts: any[] = await Order.aggregate([
    { $match: { user: { $in: ids } } },
    { $group: { _id: '$user', count: { $sum: 1 } } },
  ]);
  const orderMap = new Map(orderCounts.map((o) => [String(o._id), o.count]));

  return {
    data: users.map((u: any) => ({
      ...normalizeUser(u),
      orderCount: orderMap.get(String(u._id)) || 0,
    })),
    total,
    page,
    limit,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
}

export async function updateUserRole(id: string, role: string, currentUserId: string) {
  if (!['admin', 'customer'].includes(role)) throw httpError('Vai trò không hợp lệ');
  if (String(id) === String(currentUserId) && role !== 'admin') {
    throw httpError('Không thể tự hạ quyền admin của chính mình', 400);
  }
  const user: any = await User.findByIdAndUpdate(id, { role }, { new: true }).lean();
  if (!user) throw httpError('Không tìm thấy người dùng', 404);
  return normalizeUser(user);
}

export async function deleteUser(id: string, currentUserId: string) {
  if (String(id) === String(currentUserId))
    throw httpError('Không thể xóa tài khoản của chính mình', 400);
  const user = await User.findByIdAndDelete(id);
  if (!user) throw httpError('Không tìm thấy người dùng', 404);
  return { id, deleted: true };
}

// ================================================================= REVIEWS ===
function normalizeReview(review: any) {
  return {
    id: String(review._id),
    product: review.product
      ? { id: String(review.product._id || review.product), name: review.product.name }
      : null,
    userName: review.user?.name || review.guestName || 'Khach hang',
    guestEmail: review.guestEmail || review.user?.email || '',
    rating: review.rating,
    comment: review.comment || '',
    images: review.images || [],
    approved: Boolean(review.approved),
    createdAt: review.createdAt,
  };
}

export async function listReviews(status?: string) {
  const filter: Record<string, unknown> = {};
  if (status === 'pending') filter.approved = false;
  if (status === 'approved') filter.approved = true;
  const reviews: any[] = await Review.find(filter)
    .populate('user', 'name email')
    .populate('product', 'name slug')
    .sort({ createdAt: -1 })
    .lean();
  return reviews.map(normalizeReview);
}

export async function setReviewApproval(id: string, approved: boolean) {
  const review: any = await Review.findByIdAndUpdate(id, { approved }, { new: true })
    .populate('user', 'name email')
    .populate('product', 'name slug');
  if (!review) throw httpError('Không tìm thấy đánh giá', 404);
  return normalizeReview(review);
}

export async function deleteReview(id: string) {
  const review = await Review.findByIdAndDelete(id);
  if (!review) throw httpError('Không tìm thấy đánh giá', 404);
  return { id, deleted: true };
}
