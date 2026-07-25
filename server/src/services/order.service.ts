import mongoose from 'mongoose';
import { Variant } from '../models/variant.model';
import { Cart } from '../models/cart.model';
import { Order } from '../models/order.model';
import { Payment } from '../models/payment.model';
import { User } from '../models/user.model';
import { Voucher } from '../models/voucher.model';
import { computeLoyaltyPoints } from '../utils/pricing';
import { FlashSale } from '../models/flashSale.model';
import { FlashSaleUsage } from '../models/flashSaleUsage.model';
import { VoucherCounter } from '../models/voucherCounter.model';
import {
  pricingCustomerKey,
  PricingQuote,
  quoteOrder,
  resolveVariantPrices,
} from './pricing-engine.service';
import { logger } from '../utils/logger';
import { env } from '../config/env';
import { assertValidContact, normalizeEmail, normalizePhone } from '../utils/contactValidation';
import { normalizeOrderStatus } from '../utils/orderStatus';
import { sendOrderNotification } from './notification.service';
import { claimGuestOrdersForUser } from './auth.service';
import '../models/product.model';

export type StockItem = { variant: string; quantity: number };

export interface OrderAddressInput {
  fullName?: string;
  email?: string;
  phone?: string;
  line?: string;
  detail?: string;
  ward?: string;
  district?: string;
  province?: string;
  city?: string;
}

export interface CreateOrderOptions {
  method?: 'cod' | 'bank_qr';
  shippingMethod?: 'standard' | 'express';
  address?: OrderAddressInput;
  note?: string;
  items?: StockItem[];
  voucherCode?: string;
}

/**
 * Kiem tra ton kho cho 1 danh sach item. Chi doc, khong thay doi du lieu.
 */
export async function checkStock(items: StockItem[]) {
  const problems: any[] = [];
  const detailed: any[] = [];

  for (const it of items) {
    const qty = Number(it.quantity);
    const v: any = await Variant.findById(it.variant).populate({
      path: 'product',
      populate: { path: 'category' },
    });

    if (!v) {
      problems.push({ variant: it.variant, reason: 'not_found' });
      continue;
    }
    if (!qty || qty < 1) {
      problems.push({ variant: it.variant, reason: 'invalid_quantity' });
      continue;
    }
    const available = Number(v.stock) || 0;
    if (available < qty) {
      problems.push({
        variant: it.variant,
        reason: 'out_of_stock',
        available,
        requested: qty,
      });
    }

    detailed.push({
      _doc: v,
      variant: String(v._id),
      name: v.product?.name,
      volume: v.volume,
      price: Number(v.basePrice ?? v.price),
      costPrice: Number(v.costPrice || 0),
      quantity: qty,
      lineTotal: Number(v.basePrice ?? v.price) * qty,
      available,
    });
  }

  const prices = await resolveVariantPrices(detailed.map((item) => item._doc));
  const pricedItems = detailed.map(({ _doc, ...item }) => {
    const resolved = prices.get(item.variant)!;
    const available =
      resolved.flashRemaining == null
        ? item.available
        : Math.min(item.available, resolved.flashRemaining);
    if (
      available < item.quantity &&
      !problems.some((problem) => problem.variant === item.variant)
    ) {
      problems.push({
        variant: item.variant,
        reason: 'out_of_stock',
        available,
        requested: item.quantity,
      });
    }
    return {
      ...item,
      available,
      basePrice: resolved.basePrice,
      price: resolved.finalPrice,
      finalPrice: resolved.finalPrice,
      discountAmount: resolved.discountAmount,
      discountPercent: resolved.discountPercent,
      promotionType: resolved.promotionType,
      promotionName: resolved.promotionName,
      lineTotal: resolved.finalPrice * item.quantity,
    };
  });
  const total = pricedItems.reduce((sum, item) => sum + item.lineTotal, 0);
  const originalTotal = pricedItems.reduce((sum, item) => sum + item.basePrice * item.quantity, 0);
  return {
    ok: problems.length === 0,
    problems,
    items: pricedItems,
    total,
    originalTotal,
    productLevelDiscount: originalTotal - total,
  };
}

/**
 * TRU ton kho an toan (chong race condition) bang dieu kien { stock: { $gte: qty } }.
 * Neu 1 item that bai -> tu HOAN LAI cac item da tru truoc do.
 */
export async function decrementStock(items: StockItem[]) {
  const done: StockItem[] = [];

  for (const it of items) {
    const qty = Number(it.quantity);
    const result = await Variant.updateOne(
      { _id: it.variant, stock: { $gte: qty } },
      { $inc: { stock: -qty } },
    );

    if (result.modifiedCount !== 1) {
      await restoreStock(done);
      throw Object.assign(new Error('Sản phẩm không đủ tồn kho'), {
        status: 409,
        variant: it.variant,
      });
    }
    done.push({ variant: it.variant, quantity: qty });
  }

  return done;
}

/** TRU ton kho trong pham vi 1 transaction (session). Neu loi -> withTransaction tu rollback. */
async function decrementStockSession(items: StockItem[], session: mongoose.ClientSession) {
  for (const it of items) {
    const qty = Number(it.quantity);
    const result = await Variant.updateOne(
      { _id: it.variant, stock: { $gte: qty } },
      { $inc: { stock: -qty } },
      { session },
    );
    if (result.modifiedCount !== 1) {
      throw Object.assign(new Error('Sản phẩm không đủ tồn kho'), {
        status: 409,
        variant: it.variant,
      });
    }
  }
}

/** HOAN lai ton kho (dung khi huy don hoac thanh toan that bai). */
export async function restoreStock(items: StockItem[]) {
  for (const it of items) {
    await Variant.updateOne({ _id: it.variant }, { $inc: { stock: Number(it.quantity) } });
  }
}

/**
 * CHUAN BI CHECKOUT: lay gio hang cua user, kiem tra ton kho, tinh tong tien.
 */
export async function prepareCheckout(userId: string) {
  const cart: any = await Cart.findOne({ user: userId });
  if (!cart || cart.items.length === 0) {
    throw Object.assign(new Error('Gio hang trong'), { status: 400 });
  }

  const items: StockItem[] = cart.items.map((i: any) => ({
    variant: String(i.variant),
    quantity: i.quantity,
  }));

  return quoteOrder(items, { userId });
}

/** Chuan hoa dia chi giao hang ve 1 shape thong nhat. */
function normalizeOrderAddress(a: OrderAddressInput = {}) {
  const email = normalizeEmail(a.email || '');
  const phone = normalizePhone(a.phone || '');
  assertValidContact(email, phone);

  return {
    fullName: (a.fullName || '').trim() || undefined,
    email,
    phone,
    line: (a.line || a.detail || '').trim(),
    ward: (a.ward || '').trim() || undefined,
    district: (a.district || '').trim() || undefined,
    province: (a.province || '').trim() || undefined,
    city: (a.city || '').trim() || undefined,
  };
}

/**
 * Khách đã có tài khoản nhưng checkout khi chưa đăng nhập:
 * chỉ gắn đơn khi CẢ email và số điện thoại khớp chính xác tài khoản customer.
 * Điều kiện kép tránh gắn nhầm đơn chỉ vì người khác nhập nhầm một email.
 */
async function resolveOrderUserId(
  authenticatedUserId: string | undefined,
  address: ReturnType<typeof normalizeOrderAddress>,
) {
  if (authenticatedUserId) return authenticatedUserId;
  if (!address.email || !address.phone) return undefined;

  const existingUser: any = await User.findOne({
    role: 'customer',
    email: address.email,
    phone: address.phone,
  })
    .select('_id')
    .lean();

  return existingUser?._id ? String(existingUser._id) : undefined;
}

async function incrementCustomerCounter(
  Model: any,
  query: any,
  field: string,
  amount: number,
  limit: number,
  session?: mongoose.ClientSession,
) {
  const options: any = { new: true, session };
  if (limit <= 0) {
    return Model.findOneAndUpdate(
      query,
      { $inc: { [field]: amount } },
      { ...options, upsert: true, setDefaultsOnInsert: true },
    );
  }
  let item = await Model.findOneAndUpdate(
    { ...query, [field]: { $lte: limit - amount } },
    { $inc: { [field]: amount } },
    options,
  );
  if (item) return item;
  try {
    const docs = await Model.create(
      [{ ...query, [field]: amount }],
      session ? { session } : undefined,
    );
    return docs[0];
  } catch (cause: any) {
    if (cause?.code !== 11000) throw cause;
    item = await Model.findOneAndUpdate(
      { ...query, [field]: { $lte: limit - amount } },
      { $inc: { [field]: amount } },
      options,
    );
    if (item) return item;
    throw Object.assign(new Error('Bạn đã sử dụng hết số lượng ưu đãi cho phép'), { status: 409 });
  }
}

async function reservePromotions(
  quote: PricingQuote,
  customerKey: string,
  session?: mongoose.ClientSession,
) {
  const reservedFlash: Array<{ id: string; quantity: number }> = [];
  let voucherReserved = false;
  try {
    if (quote.voucher) {
      const voucher: any = await Voucher.findById(quote.voucher.id).session(session || null);
      if (!voucher || !voucher.isActive)
        throw Object.assign(new Error('Voucher không còn khả dụng'), { status: 409 });
      const filter: any = { _id: voucher._id, isActive: true };
      if (Number(voucher.usageLimit || 0) > 0)
        filter.usedCount = { $lt: Number(voucher.usageLimit) };
      const result = await Voucher.updateOne(filter, { $inc: { usedCount: 1 } }, { session });
      if (result.modifiedCount !== 1)
        throw Object.assign(new Error('Voucher vừa hết lượt sử dụng'), { status: 409 });
      voucherReserved = true;
      await incrementCustomerCounter(
        VoucherCounter,
        { voucher: voucher._id, customerKey },
        'count',
        1,
        Number(voucher.usageLimitPerUser || 0),
        session,
      );
    }

    for (const item of quote.items) {
      if (!item.flashSaleId) continue;
      const flash: any = await FlashSale.findById(item.flashSaleId).session(session || null);
      if (!flash) throw Object.assign(new Error('Flash sale không còn khả dụng'), { status: 409 });
      const now = new Date();
      const result = await FlashSale.updateOne(
        {
          _id: flash._id,
          isActive: true,
          startTime: { $lte: now },
          endTime: { $gt: now },
          $expr: { $lte: [{ $add: ['$soldCount', item.quantity] }, '$stockAllocated'] },
        },
        { $inc: { soldCount: item.quantity } },
        { session },
      );
      if (result.modifiedCount !== 1)
        throw Object.assign(new Error('Số lượng flash sale vừa hết'), { status: 409 });
      reservedFlash.push({ id: String(flash._id), quantity: item.quantity });
      await incrementCustomerCounter(
        FlashSaleUsage,
        { flashSale: flash._id, customerKey },
        'quantity',
        item.quantity,
        Number(flash.maxPerUser || 0),
        session,
      );
    }
    return { reservedFlash, voucherReserved };
  } catch (cause) {
    // Mongo transaction tu rollback. Fallback khong co transaction nen phai tra lai
    // dung nhung quota da reserve thanh cong truoc khi gap loi.
    if (!session) {
      if (voucherReserved && quote.voucher) {
        await Voucher.updateOne(
          { _id: quote.voucher.id, usedCount: { $gt: 0 } },
          { $inc: { usedCount: -1 } },
        );
        await VoucherCounter.updateOne(
          { voucher: quote.voucher.id, customerKey, count: { $gt: 0 } },
          { $inc: { count: -1 } },
        );
      }
      for (const reserved of reservedFlash) {
        await FlashSale.updateOne(
          { _id: reserved.id, soldCount: { $gte: reserved.quantity } },
          { $inc: { soldCount: -reserved.quantity } },
        );
        await FlashSaleUsage.updateOne(
          { flashSale: reserved.id, customerKey, quantity: { $gte: reserved.quantity } },
          { $inc: { quantity: -reserved.quantity } },
        );
      }
    }
    throw cause;
  }
}

async function releasePromotions(quote: PricingQuote, customerKey: string) {
  if (quote.voucher) {
    await Voucher.updateOne(
      { _id: quote.voucher.id, usedCount: { $gt: 0 } },
      { $inc: { usedCount: -1 } },
    );
    await VoucherCounter.updateOne(
      { voucher: quote.voucher.id, customerKey, count: { $gt: 0 } },
      { $inc: { count: -1 } },
    );
  }
  for (const item of quote.items)
    if (item.flashSaleId) {
      await FlashSale.updateOne(
        { _id: item.flashSaleId, soldCount: { $gte: item.quantity } },
        { $inc: { soldCount: -item.quantity } },
      );
      await FlashSaleUsage.updateOne(
        { flashSale: item.flashSaleId, customerKey, quantity: { $gte: item.quantity } },
        { $inc: { quantity: -item.quantity } },
      );
    }
}

export async function releaseOrderPromotionReservations(order: any) {
  const key = pricingCustomerKey(order.user ? String(order.user) : undefined, order.address?.email);
  if (order.voucherCode) {
    const voucher: any = await Voucher.findOne({ code: order.voucherCode });
    if (voucher) {
      await Voucher.updateOne(
        { _id: voucher._id, usedCount: { $gt: 0 } },
        { $inc: { usedCount: -1 } },
      );
      if (key)
        await VoucherCounter.updateOne(
          { voucher: voucher._id, customerKey: key, count: { $gt: 0 } },
          { $inc: { count: -1 } },
        );
    }
  }
  for (const item of order.items || []) {
    if (item.promotionType !== 'FLASH_SALE' || !item.promotionId) continue;
    await FlashSale.updateOne(
      { _id: item.promotionId, soldCount: { $gte: item.quantity } },
      { $inc: { soldCount: -Number(item.quantity) } },
    );
    if (key)
      await FlashSaleUsage.updateOne(
        { flashSale: item.promotionId, customerKey: key, quantity: { $gte: item.quantity } },
        { $inc: { quantity: -Number(item.quantity) } },
      );
  }
}

/**
 * TAO DON HANG THAT (checkout).
 * Luong: kiem tra ton kho -> tinh tien (voucher/ship/thue/diem) -> TRU kho -> tao Order + Payment
 * -> cong loyalty points -> xoa gio. Uu tien dung Mongo transaction; neu DB khong ho tro
 * (khong phai replica set) thi fallback ve co che rollback thu cong.
 */
export async function createOrder(userId: string | undefined, opts: CreateOrderOptions = {}) {
  const cart: any = userId ? await Cart.findOne({ user: userId }) : null;
  const explicitItems = Array.isArray(opts.items) && opts.items.length > 0;

  const stockItems: StockItem[] = explicitItems
    ? (opts.items || []).map((item) => ({
        variant: String(item.variant),
        quantity: Number(item.quantity),
      }))
    : (cart?.items || []).map((i: any) => ({ variant: String(i.variant), quantity: i.quantity }));

  if (!stockItems.length) {
    throw Object.assign(new Error('Gio hang trong'), { status: 400 });
  }

  const address = normalizeOrderAddress(opts.address);
  const orderUserId = await resolveOrderUserId(userId, address);
  // Server resolve lai tat ca gia tu DB. Khong doc gia/discount do client gui.
  const quote = await quoteOrder(stockItems, {
    voucherCode: opts.voucherCode,
    shippingMethod: opts.shippingMethod,
    userId: orderUserId,
    email: address.email,
  });
  const totals = {
    subtotal: quote.subtotal,
    discount: quote.voucherDiscount,
    shippingFee: quote.shippingFee,
    tax: quote.tax,
    total: quote.finalTotal,
    pointsEarned: computeLoyaltyPoints(quote.finalTotal),
    originalTotal: quote.originalTotal,
    productLevelDiscount: quote.productLevelDiscount,
    voucherDiscount: quote.voucherDiscount,
    shippingDiscount: quote.shippingDiscount,
  };
  const method = opts.method === 'bank_qr' ? 'bank_qr' : 'cod';
  const customerKey = pricingCustomerKey(orderUserId, address.email);
  const orderItems = quote.items.map((x) => ({
    variant: x.variant,
    name: x.name,
    volume: x.volume,
    price: x.finalPrice,
    basePrice: x.basePrice,
    finalPrice: x.finalPrice,
    productDiscountAmount: x.discountAmount,
    promotionType: x.promotionType,
    promotionId: x.promotionId || undefined,
    promotionName: x.promotionName,
    costPrice: x.costPrice,
    quantity: x.quantity,
  }));

  const buildDoc = () => ({
    ...(orderUserId ? { user: orderUserId } : {}),
    items: orderItems,
    subtotal: totals.subtotal,
    originalTotal: totals.originalTotal,
    productLevelDiscount: totals.productLevelDiscount,
    voucherDiscount: totals.voucherDiscount,
    shippingDiscount: totals.shippingDiscount,
    discount: totals.discount,
    shippingFee: totals.shippingFee,
    tax: totals.tax,
    total: totals.total,
    voucherCode: quote.voucher?.code,
    voucherSnapshot: quote.voucher
      ? {
          code: quote.voucher.code,
          name: quote.voucher.name,
          type: quote.voucher.type,
          value: quote.voucher.value,
          stackable: quote.voucher.stackable,
          userSegment: quote.voucher.userSegment,
        }
      : undefined,
    pointsEarned: totals.pointsEarned,
    status: 'pending' as const,
    statusHistory: [{ status: 'pending', at: new Date() }],
    address,
    note: opts.note,
  });

  let created: any = null;
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      await decrementStockSession(stockItems, session);
      await reservePromotions(quote, customerKey, session);
      const docs = await Order.create([buildDoc()], { session });
      created = docs[0];
      await Payment.create(
        [{ order: created._id, method, status: 'unpaid', amount: totals.total }],
        { session },
      );
      if (orderUserId && totals.pointsEarned) {
        await User.updateOne(
          { _id: orderUserId },
          { $inc: { loyaltyPoints: totals.pointsEarned } },
          { session },
        );
      }
      if (cart && !explicitItems) {
        cart.items = [];
        await cart.save({ session });
      }
    });
  } catch (txnErr: any) {
    const msg = String(txnErr?.message || '');
    const unsupported =
      txnErr?.code === 20 ||
      txnErr?.codeName === 'IllegalOperation' ||
      /Transaction numbers|replica set|not support|Transactions are not/i.test(msg);
    if (!unsupported) throw txnErr;
    logger.warn('[order] Mongo không hỗ trợ transaction -> dùng fallback rollback thủ công');
    created = await createOrderFallback({
      userId: orderUserId,
      cart,
      stockItems,
      doc: buildDoc(),
      method,
      totals,
      quote,
      customerKey,
      explicitItems,
    });
  } finally {
    await session.endSession();
  }

  void sendOrderNotification(String(created._id), 'created').catch((error) => {
    logger.error('[order] Gửi email xác nhận đơn hàng thất bại', error);
  });

  return {
    orderId: String(created._id),
    total: totals.total,
    status: created.status,
    method,
    totals,
  };
}

async function createOrderFallback(p: {
  userId?: string;
  cart: any;
  stockItems: StockItem[];
  doc: any;
  method: 'cod' | 'bank_qr';
  totals: any;
  quote: PricingQuote;
  customerKey: string;
  explicitItems?: boolean;
}) {
  await decrementStock(p.stockItems);
  let promotionsReserved = false;
  try {
    await reservePromotions(p.quote, p.customerKey);
    promotionsReserved = true;
    const order: any = await Order.create(p.doc);
    await Payment.create({
      order: order._id,
      method: p.method,
      status: 'unpaid',
      amount: p.totals.total,
    });
    if (p.userId && p.totals.pointsEarned) {
      await User.updateOne({ _id: p.userId }, { $inc: { loyaltyPoints: p.totals.pointsEarned } });
    }
    if (p.cart && !p.explicitItems) {
      p.cart.items = [];
      await p.cart.save();
    }
    return order;
  } catch (err) {
    await restoreStock(p.stockItems);
    if (promotionsReserved) await releasePromotions(p.quote, p.customerKey);
    throw err;
  }
}

/** HUY DON cua user: chi cho phep khi don dang pending/paid; hoan kho + tru diem da cong. */
export async function cancelOrder(userId: string, orderId: string) {
  let order: any = null;
  try {
    order = await Order.findOne({ _id: orderId, user: userId });
  } catch {
    throw Object.assign(new Error('Không tìm thấy đơn hàng'), { status: 404 });
  }
  if (!order) throw Object.assign(new Error('Không tìm thấy đơn hàng'), { status: 404 });
  if (!['pending', 'paid'].includes(order.status)) {
    throw Object.assign(new Error('Không thể hủy đơn ở trạng thái này'), { status: 400 });
  }

  await releaseOrderPromotionReservations(order);
  await restoreStock(
    (order.items || []).map((it: any) => ({ variant: String(it.variant), quantity: it.quantity })),
  );
  order.status = 'cancelled';
  await order.save();
  void sendOrderNotification(String(order._id), 'status').catch(() => null);
  if (userId && order.pointsEarned) {
    await User.updateOne({ _id: userId }, { $inc: { loyaltyPoints: -order.pointsEarned } });
  }
  await Payment.updateOne({ order: order._id }, { status: 'unpaid' });

  return { orderId: String(order._id), status: order.status };
}

/** Huy don QR chua thanh toan tu popup checkout, ap dung cho guest va user. */
export async function cancelPendingQrOrder(orderId: string, userId?: string) {
  let order: any = null;
  try {
    order = await Order.findOne(userId ? { _id: orderId, user: userId } : { _id: orderId });
  } catch {
    throw Object.assign(new Error('Không tìm thấy đơn hàng'), { status: 404 });
  }
  if (!order) throw Object.assign(new Error('Không tìm thấy đơn hàng'), { status: 404 });

  const payment: any = await Payment.findOne({ order: order._id });
  if (
    !payment ||
    payment.method !== 'bank_qr' ||
    payment.status !== 'unpaid' ||
    order.status !== 'pending'
  ) {
    throw Object.assign(new Error('Chi co the huy giao dich QR chua thanh toan'), { status: 400 });
  }

  await releaseOrderPromotionReservations(order);
  await restoreStock(
    (order.items || []).map((it: any) => ({ variant: String(it.variant), quantity: it.quantity })),
  );
  order.status = 'cancelled';
  await order.save();
  void sendOrderNotification(String(order._id), 'status').catch(() => null);

  if (order.user && order.pointsEarned) {
    await User.updateOne({ _id: order.user }, { $inc: { loyaltyPoints: -order.pointsEarned } });
  }

  return { orderId: String(order._id), status: order.status };
}

/** Danh sach don cua 1 user (moi nhat truoc). */
export async function getMyOrders(userId: string) {
  const user: any = await User.findById(userId).select('email phone').lean();
  if (user?.email && user?.phone) {
    await claimGuestOrdersForUser(user, String(user.email), String(user.phone));
  }

  const orders: any[] = await Order.find({ user: userId }).sort({ createdAt: -1 }).lean();

  const ids = orders.map((o) => o._id);
  const payments: any[] = await Payment.find({ order: { $in: ids } }).lean();
  const payMap = new Map(payments.map((p) => [String(p.order), p]));

  return orders.map((o) => {
    const pay = payMap.get(String(o._id));
    const itemCount = (o.items || []).reduce((s: number, it: any) => s + (it.quantity || 0), 0);
    return {
      id: String(o._id),
      createdAt: o.createdAt,
      total: o.total,
      status: normalizeOrderStatus(o.status),
      itemCount,
      firstItemName: o.items?.[0]?.name || '',
      payment: pay
        ? { method: pay.method, status: pay.status }
        : { method: 'cod', status: 'unpaid' },
    };
  });
}

/** Tra cuu cong khai theo ma don, so dien thoai hoac email; khong tra du lieu dia chi nhay cam. */
export async function lookupOrders(rawQuery: string) {
  const query = String(rawQuery || '').trim();
  const email = normalizeEmail(query);
  const phone = normalizePhone(query);
  const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const isPhone = /^0\d{9}$/.test(phone) && /^[\d\s.+()-]+$/.test(query);
  const isFullId = /^[a-f\d]{24}$/i.test(query) && mongoose.isValidObjectId(query);
  const isShortCode = /^[a-f\d]{6}$/i.test(query);

  let orders: any[] = [];

  if (isFullId) {
    const order = await Order.findById(query).lean();
    if (order) orders = [order];
  } else if (isShortCode) {
    orders = await Order.aggregate([
      {
        $match: {
          $expr: {
            $eq: [
              { $toUpper: { $substrBytes: [{ $toString: '$_id' }, 18, 6] } },
              query.toUpperCase(),
            ],
          },
        },
      },
      { $sort: { createdAt: -1 } },
      { $limit: 10 },
    ]);
  } else if (isEmail) {
    const escapedEmail = email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    orders = await Order.find({
      $or: [
        { 'address.email': email },
        {
          'address.email': { $in: [null, ''] },
          note: { $regex: `Email:\\s*${escapedEmail}`, $options: 'i' },
        },
      ],
    })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();
  } else if (isPhone) {
    orders = await Order.find({ 'address.phone': phone }).sort({ createdAt: -1 }).limit(10).lean();
  } else {
    throw Object.assign(new Error('Nhap ma don, so dien thoai hoac email hop le'), { status: 400 });
  }

  if (!orders.length) return [];

  const payments: any[] = await Payment.find({
    order: { $in: orders.map((order) => order._id) },
  }).lean();
  const paymentMap = new Map(payments.map((payment) => [String(payment.order), payment]));

  return orders.map((order) => {
    const payment = paymentMap.get(String(order._id));
    return {
      id: String(order._id),
      code: String(order._id).slice(-6).toUpperCase(),
      createdAt: order.createdAt,
      status: normalizeOrderStatus(order.status),
      total: order.total,
      itemCount: (order.items || []).reduce(
        (sum: number, item: any) => sum + Number(item.quantity || 0),
        0,
      ),
      items: (order.items || []).map((item: any) => ({
        name: item.name || '',
        volume: item.volume || '',
        quantity: item.quantity || 0,
      })),
      payment: payment
        ? { method: payment.method, status: payment.status }
        : { method: 'cod', status: 'unpaid' },
    };
  });
}

/** Chi tiet 1 don cua user (chan xem don nguoi khac bang dieu kien { _id, user }). */
export async function getOrderById(userId: string | undefined, orderId: string) {
  let order: any = null;
  try {
    order = await Order.findOne(userId ? { _id: orderId, user: userId } : { _id: orderId }).lean();
  } catch {
    throw Object.assign(new Error('Không tìm thấy đơn hàng'), { status: 404 });
  }
  if (!order) throw Object.assign(new Error('Không tìm thấy đơn hàng'), { status: 404 });

  const payment: any = await Payment.findOne({ order: order._id }).lean();

  return {
    id: String(order._id),
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
    status: normalizeOrderStatus(order.status),
    subtotal: order.subtotal ?? order.total,
    originalTotal: order.originalTotal ?? order.subtotal ?? order.total,
    productLevelDiscount: order.productLevelDiscount ?? 0,
    voucherDiscount: order.voucherDiscount ?? order.discount ?? 0,
    shippingDiscount: order.shippingDiscount ?? 0,
    discount: order.discount ?? 0,
    shippingFee: order.shippingFee ?? 0,
    tax: order.tax ?? 0,
    total: order.total,
    voucherCode: order.voucherCode || '',
    pointsEarned: order.pointsEarned ?? 0,
    address: order.address || null,
    note: order.note || '',
    items: (order.items || []).map((it: any) => ({
      variant: String(it.variant),
      name: it.name,
      volume: it.volume,
      price: it.price,
      basePrice: it.basePrice ?? it.price,
      finalPrice: it.finalPrice ?? it.price,
      productDiscountAmount: it.productDiscountAmount || 0,
      promotionName: it.promotionName || '',
      quantity: it.quantity,
      lineTotal: (it.price || 0) * (it.quantity || 0),
    })),
    payment: payment
      ? { method: payment.method, status: payment.status, amount: payment.amount }
      : null,
  };
}

/** Thong tin thanh toan cho 1 don (COD hoac VietQR). */
export async function getPaymentInfo(userId: string | undefined, orderId: string) {
  let order: any = null;
  try {
    order = await Order.findOne(userId ? { _id: orderId, user: userId } : { _id: orderId }).lean();
  } catch {
    throw Object.assign(new Error('Không tìm thấy đơn hàng'), { status: 404 });
  }
  if (!order) throw Object.assign(new Error('Không tìm thấy đơn hàng'), { status: 404 });

  const payment: any = await Payment.findOne({ order: order._id }).lean();
  const method = payment?.method || 'cod';
  const status = payment?.status || 'unpaid';
  const amount = payment?.amount ?? order.total ?? 0;

  const transferContent = 'HOC' + String(order._id).toUpperCase();

  const result = {
    orderId: String(order._id),
    method,
    status,
    amount,
    bank: {
      bin: env.vietqr.bankBin,
      accountNo: env.vietqr.accountNo,
      accountName: env.vietqr.accountName,
    },
    transferContent,
    qrUrl: '',
  };

  if (method === 'bank_qr') {
    if (!env.vietqr.bankBin || !env.vietqr.accountNo || !env.vietqr.accountName) {
      throw Object.assign(new Error('Chua cau hinh tai khoan VietQR that'), { status: 503 });
    }
    result.qrUrl =
      'https://img.vietqr.io/image/' +
      env.vietqr.bankBin +
      '-' +
      env.vietqr.accountNo +
      '-compact2.png' +
      '?amount=' +
      encodeURIComponent(String(Math.round(amount))) +
      '&addInfo=' +
      encodeURIComponent(transferContent) +
      '&accountName=' +
      encodeURIComponent(env.vietqr.accountName);
  }

  return result;
}
