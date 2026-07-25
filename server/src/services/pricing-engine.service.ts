import { Types } from 'mongoose';
import { LOYAL_MIN_ORDERS, isVipCustomer } from '../constants/customerSegment';
import { Discount } from '../models/discount.model';
import { FlashSale } from '../models/flashSale.model';
import { Order } from '../models/order.model';
import { Payment } from '../models/payment.model';
import { Variant } from '../models/variant.model';
import { Voucher } from '../models/voucher.model';
import { VoucherCounter } from '../models/voucherCounter.model';
import { User } from '../models/user.model';
import { mayStackVoucher, productPromotionPrice, voucherDiscountAmount } from '../utils/promotionPricing';

export type PromotionType = 'FLASH_SALE' | 'PRODUCT_DISCOUNT' | 'CATEGORY_DISCOUNT' | null;

export type ResolvedUnitPrice = {
  variant: string;
  basePrice: number;
  finalPrice: number;
  discountAmount: number;
  discountPercent: number;
  promotionType: PromotionType;
  promotionId: string | null;
  promotionName: string;
  flashSaleId: string | null;
  flashRemaining: number | null;
};

export type PricingQuote = {
  items: Array<ResolvedUnitPrice & {
    name: string;
    volume: string;
    costPrice: number;
    quantity: number;
    available: number;
    lineOriginal: number;
    lineTotal: number;
  }>;
  count: number;
  originalTotal: number;
  productLevelDiscount: number;
  subtotal: number;
  voucherDiscount: number;
  shippingFeeBeforeDiscount: number;
  shippingDiscount: number;
  shippingFee: number;
  tax: number;
  finalTotal: number;
  voucher: null | {
    id: string;
    code: string;
    name: string;
    type: string;
    value: number;
    stackable: boolean;
    userSegment: string;
    usageLimitPerUser: number;
  };
};

function idOf(value: any) {
  return value?._id ? String(value._id) : value ? String(value) : '';
}

function currentBasePrice(variant: any) {
  const value = variant.basePrice ?? variant.price ?? 0;
  return Math.max(0, Number(value) || 0);
}

function discountPrice(basePrice: number, discount: any) {
  return productPromotionPrice(basePrice, discount.type, Number(discount.value || 0), Number(discount.maxDiscountAmount || 0)).finalPrice;
}

/** Resolve gia cho ca batch de trang shop/cart khong phat sinh N+1 query. */
export async function resolveVariantPrices(variants: any[], now = new Date()) {
  const variantIds = variants.map((variant) => variant._id).filter(Boolean);
  const productIds = variants.map((variant) => idOf(variant.product)).filter(Boolean);
  const categoryIds = variants.map((variant) => idOf(variant._categoryId || variant.product?.category)).filter(Boolean);

  const [flashSales, discounts]: any[][] = await Promise.all([
    FlashSale.find({
      variant: { $in: variantIds }, isActive: true,
      startTime: { $lte: now }, endTime: { $gt: now },
      $expr: { $lt: ['$soldCount', '$stockAllocated'] },
    }).sort({ flashPrice: 1, createdAt: 1 }).lean(),
    Discount.find({
      isActive: true, startDate: { $lte: now }, endDate: { $gt: now },
      $or: [
        { scope: 'PRODUCT', products: { $in: productIds } },
        { scope: 'CATEGORY', categories: { $in: categoryIds } },
      ],
    }).sort({ priority: -1, createdAt: 1 }).lean(),
  ]);

  const flashByVariant = new Map<string, any>();
  for (const flash of flashSales) {
    const key = String(flash.variant);
    if (!flashByVariant.has(key)) flashByVariant.set(key, flash);
  }

  const result = new Map<string, ResolvedUnitPrice>();
  for (const variant of variants) {
    const variantId = String(variant._id);
    const basePrice = currentBasePrice(variant);
    const flash = flashByVariant.get(variantId);
    if (flash) {
      const referencePrice = Number(flash.originalPrice || basePrice);
      const finalPrice = Math.max(0, Math.min(referencePrice, Number(flash.flashPrice || 0)));
      result.set(variantId, {
        variant: variantId,
        basePrice: referencePrice,
        finalPrice,
        discountAmount: referencePrice - finalPrice,
        discountPercent: referencePrice ? Math.round((referencePrice - finalPrice) / referencePrice * 100) : 0,
        promotionType: 'FLASH_SALE',
        promotionId: String(flash._id),
        promotionName: flash.name,
        flashSaleId: String(flash._id),
        flashRemaining: Math.max(0, Number(flash.stockAllocated) - Number(flash.soldCount || 0)),
      });
      continue;
    }

    const productId = idOf(variant.product);
    const categoryId = idOf(variant._categoryId || variant.product?.category);
    const discount = discounts.find((item) =>
      item.scope === 'PRODUCT'
        ? (item.products || []).some((id: any) => String(id) === productId)
        : (item.categories || []).some((id: any) => String(id) === categoryId),
    );
    if (discount) {
      const finalPrice = discountPrice(basePrice, discount);
      result.set(variantId, {
        variant: variantId, basePrice, finalPrice,
        discountAmount: basePrice - finalPrice,
        discountPercent: basePrice ? Math.round((basePrice - finalPrice) / basePrice * 100) : 0,
        promotionType: discount.scope === 'PRODUCT' ? 'PRODUCT_DISCOUNT' : 'CATEGORY_DISCOUNT',
        promotionId: String(discount._id), promotionName: discount.name,
        flashSaleId: null, flashRemaining: null,
      });
      continue;
    }

    result.set(variantId, {
      variant: variantId, basePrice, finalPrice: basePrice, discountAmount: 0,
      discountPercent: 0, promotionType: null, promotionId: null,
      promotionName: '', flashSaleId: null, flashRemaining: null,
    });
  }
  return result;
}

async function customerSegment(userId?: string) {
  if (!userId || !Types.ObjectId.isValid(userId)) return 'GUEST';
  const orderIds = await Order.distinct('_id', { user: userId });
  if (!orderIds.length) return 'NEW';
  const paid: any[] = await Payment.find({ order: { $in: orderIds }, status: 'paid' }).select('amount').lean();
  const count = paid.length;
  const spend = paid.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  if (isVipCustomer(count, spend)) return 'VIP';
  if (count >= LOYAL_MIN_ORDERS) return 'LOYAL';
  return count >= 1 ? 'RETURNING' : 'NEW';
}

function segmentMatches(required: string, actual: string) {
  if (!required || required === 'ALL') return true;
  if (required === 'RETURNING') return ['RETURNING', 'LOYAL', 'VIP'].includes(actual);
  if (required === 'LOYAL') return ['LOYAL', 'VIP'].includes(actual);
  return required === actual;
}

function customerKey(userId?: string, email?: string) {
  return userId ? `user:${userId}` : email?.trim().toLowerCase() ? `email:${email.trim().toLowerCase()}` : '';
}

async function resolveVoucher(code: string | undefined, subtotal: number, hasProductPromotion: boolean, userId?: string, email?: string) {
  if (!code?.trim()) return null;
  const now = new Date();
  const normalizedCode = code.trim().toUpperCase();
  const voucher: any = await Voucher.findOne({ code: normalizedCode, isActive: true }).lean();
  if (!voucher) throw Object.assign(new Error('Mã ưu đãi không tồn tại hoặc đã tắt'), { status: 400 });
  const start = voucher.startDate ? new Date(voucher.startDate) : null;
  const end = voucher.endDate || voucher.expiresAt ? new Date(voucher.endDate || voucher.expiresAt) : null;
  if (start && start > now) throw Object.assign(new Error('Mã ưu đãi chưa đến thời gian sử dụng'), { status: 400 });
  if (end && end <= now) throw Object.assign(new Error('Mã ưu đãi đã hết hạn'), { status: 400 });
  const minOrder = Number(voucher.minOrder ?? voucher.minOrderValue ?? 0);
  if (subtotal < minOrder) throw Object.assign(new Error(`Đơn hàng cần đạt tối thiểu ${minOrder.toLocaleString('vi-VN')}đ`), { status: 400 });
  if (voucher.usageLimit > 0 && voucher.usedCount >= voucher.usageLimit) {
    throw Object.assign(new Error('Mã ưu đãi đã hết lượt sử dụng'), { status: 400 });
  }
  if (!mayStackVoucher(voucher.stackable !== false, hasProductPromotion ? 1 : 0)) {
    throw Object.assign(new Error('Mã này không thể dùng chung với ưu đãi sản phẩm hiện có'), { status: 400 });
  }
  const actualSegment = await customerSegment(userId);
  if (voucher.appliesToNewMembers) {
    if (!userId || !Types.ObjectId.isValid(userId)) {
      throw Object.assign(new Error('Vui lòng đăng nhập để dùng voucher dành cho thành viên mới'), { status: 400 });
    }
    const [assignedUser, existingOrder] = await Promise.all([
      User.exists({
        _id: userId,
        role: 'customer',
        profileCompletionVoucherCode: normalizedCode,
      }),
      Order.exists({ user: userId }),
    ]);
    if (!assignedUser || existingOrder) {
      throw Object.assign(new Error('Voucher này chỉ dành cho tài khoản mới chưa có đơn hàng và đã cập nhật hồ sơ'), { status: 400 });
    }
  }
  if (actualSegment === 'GUEST' && voucher.userSegment && voucher.userSegment !== 'ALL') {
    throw Object.assign(new Error('Vui lòng đăng ký hoặc đăng nhập để dùng mã ưu đãi thành viên mới'), { status: 400 });
  }
  if (!segmentMatches(voucher.userSegment, actualSegment)) {
    throw Object.assign(new Error('Mã ưu đãi không áp dụng cho nhóm khách hàng của bạn'), { status: 400 });
  }
  const key = customerKey(userId, email);
  if (voucher.usageLimitPerUser > 0 && key) {
    const counter: any = await VoucherCounter.findOne({ voucher: voucher._id, customerKey: key }).lean();
    if (Number(counter?.count || 0) >= voucher.usageLimitPerUser) {
      throw Object.assign(new Error('Bạn đã sử dụng hết số lượt của mã ưu đãi này'), { status: 400 });
    }
  }
  return voucher;
}

export async function quoteOrder(
  items: Array<{ variant: string; quantity: number }>,
  options: { voucherCode?: string; shippingMethod?: 'standard' | 'express'; userId?: string; email?: string } = {},
): Promise<PricingQuote> {
  const grouped = new Map<string, number>();
  for (const item of items) {
    const variant = String(item.variant);
    grouped.set(variant, (grouped.get(variant) || 0) + Math.floor(Number(item.quantity)));
  }
  const clean = Array.from(grouped, ([variant, quantity]) => ({ variant, quantity }));
  if (!clean.length || clean.some((item) => !item.variant || item.quantity < 1)) {
    throw Object.assign(new Error('Giỏ hàng không hợp lệ'), { status: 400 });
  }
  const variants: any[] = await Variant.find({ _id: { $in: clean.map((item) => item.variant) }, isActive: { $ne: false } })
    .populate({ path: 'product', select: 'name category', populate: { path: 'category', select: 'name' } })
    .lean();
  if (variants.length !== new Set(clean.map((item) => item.variant)).size) {
    throw Object.assign(new Error('Một số sản phẩm không còn tồn tại'), { status: 409 });
  }
  const prices = await resolveVariantPrices(variants);
  const variantMap = new Map(variants.map((variant) => [String(variant._id), variant]));
  const quotedItems = clean.map((item) => {
    const variant: any = variantMap.get(item.variant);
    const price = prices.get(item.variant)!;
    const available = price.flashRemaining == null
      ? Number(variant.stock || 0)
      : Math.min(Number(variant.stock || 0), price.flashRemaining);
    if (available < item.quantity) {
      throw Object.assign(new Error(`Sản phẩm ${variant.product?.name || variant.sku} chỉ còn ${available}`), { status: 409, variant: item.variant });
    }
    return {
      ...price,
      name: variant.product?.name || variant.sku,
      volume: variant.volume || variant.size || '',
      costPrice: Number(variant.costPrice || 0),
      quantity: item.quantity,
      available,
      lineOriginal: price.basePrice * item.quantity,
      lineTotal: price.finalPrice * item.quantity,
    };
  });
  const originalTotal = quotedItems.reduce((sum, item) => sum + item.lineOriginal, 0);
  const subtotal = quotedItems.reduce((sum, item) => sum + item.lineTotal, 0);
  const productLevelDiscount = originalTotal - subtotal;
  const voucher: any = await resolveVoucher(options.voucherCode, subtotal, productLevelDiscount > 0, options.userId, options.email);
  const normalizedType = voucher?.type === 'percent' ? 'percentage' : voucher?.type;
  let voucherDiscount = 0;
  if (voucher && normalizedType !== 'free_shipping') {
    const cap = Number(voucher.maxDiscount ?? voucher.maxDiscountAmount ?? 0);
    voucherDiscount = voucherDiscountAmount(subtotal, normalizedType, Number(voucher.value || 0), cap);
    if (!voucher.isConcentratedPromotion) voucherDiscount = Math.min(voucherDiscount, Math.round(subtotal * 0.5));
  }
  const shippingFeeBeforeDiscount = options.shippingMethod === 'express' ? 35_000 : 0;
  const shippingDiscount = voucher && normalizedType === 'free_shipping' ? shippingFeeBeforeDiscount : 0;
  const shippingFee = shippingFeeBeforeDiscount - shippingDiscount;
  const tax = 0;
  const finalTotal = Math.max(0, subtotal - voucherDiscount + shippingFee + tax);
  return {
    items: quotedItems,
    count: quotedItems.reduce((sum, item) => sum + item.quantity, 0),
    originalTotal, productLevelDiscount, subtotal, voucherDiscount,
    shippingFeeBeforeDiscount, shippingDiscount, shippingFee, tax, finalTotal,
    voucher: voucher ? {
      id: String(voucher._id), code: voucher.code, name: voucher.name || voucher.code,
      type: normalizedType, value: Number(voucher.value || 0), stackable: voucher.stackable !== false,
      userSegment: voucher.userSegment || 'ALL', usageLimitPerUser: Number(voucher.usageLimitPerUser || 0),
    } : null,
  };
}

export const pricingCustomerKey = customerKey;
