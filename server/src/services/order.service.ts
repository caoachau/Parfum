import mongoose from 'mongoose';
import { createHash, randomBytes } from 'node:crypto';
import { Variant } from '../models/variant.model';
import { Cart } from '../models/cart.model';
import { Order } from '../models/order.model';
import { Payment } from '../models/payment.model';
import { User } from '../models/user.model';
import { Voucher } from '../models/voucher.model';
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
import {
  assertValidContact,
  isLikelyValidEmail,
  isLikelyValidVietnamPhone,
  normalizeEmail,
  normalizePhone,
} from '../utils/contactValidation';
import { normalizeOrderStatus } from '../utils/orderStatus';
import { bankTransferNeedsRefund } from '../utils/payment';
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

const hashGuestOrderToken = (token: string) =>
  createHash('sha256').update(token, 'utf8').digest('hex');

function orderAccessFilter(userId: string | undefined, orderId: string, token?: string) {
  if (userId) return { _id: orderId, user: userId };
  if (!token) {
    throw Object.assign(new Error('Cần mã truy cập đơn hàng'), { status: 401 });
  }
  return { _id: orderId, guestAccessTokenHash: hashGuestOrderToken(token) };
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
export async function restoreStock(items: StockItem[], session?: mongoose.ClientSession) {
  for (const it of items) {
    await Variant.updateOne(
      { _id: it.variant },
      { $inc: { stock: Number(it.quantity) } },
      { session },
    );
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

export async function releaseOrderPromotionReservations(
  order: any,
  session?: mongoose.ClientSession,
) {
  const key = pricingCustomerKey(order.user ? String(order.user) : undefined, order.address?.email);
  if (order.voucherCode) {
    const voucher: any = await Voucher.findOne({ code: order.voucherCode }).session(
      session || null,
    );
    if (voucher) {
      await Voucher.updateOne(
        { _id: voucher._id, usedCount: { $gt: 0 } },
        { $inc: { usedCount: -1 } },
        { session },
      );
      if (key)
        await VoucherCounter.updateOne(
          { voucher: voucher._id, customerKey: key, count: { $gt: 0 } },
          { $inc: { count: -1 } },
          { session },
        );
    }
  }
  for (const item of order.items || []) {
    if (item.promotionType !== 'FLASH_SALE' || !item.promotionId) continue;
    await FlashSale.updateOne(
      { _id: item.promotionId, soldCount: { $gte: item.quantity } },
      { $inc: { soldCount: -Number(item.quantity) } },
      { session },
    );
    if (key)
      await FlashSaleUsage.updateOne(
        { flashSale: item.promotionId, customerKey: key, quantity: { $gte: item.quantity } },
        { $inc: { quantity: -Number(item.quantity) } },
        { session },
      );
  }
}

function transactionUnsupported(error: any) {
  const message = String(error?.message || '');
  return (
    error?.code === 20 ||
    error?.codeName === 'IllegalOperation' ||
    /Transaction numbers|replica set|not support|Transactions are not/i.test(message)
  );
}

/**
 * TAO DON HANG THAT (checkout).
 * Luong: kiem tra ton kho -> tinh tien (voucher/ship/VAT da gom trong gia) -> TRU kho -> tao Order + Payment
 * -> xoa gio. Uu tien dung Mongo transaction; neu DB khong ho tro
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
  const guestOrderToken = userId ? undefined : randomBytes(32).toString('base64url');
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
    vatRate: quote.vatRate,
    vatIncluded: quote.vatIncluded,
    pricesIncludeVat: quote.pricesIncludeVat,
    total: quote.finalTotal,
    originalTotal: quote.originalTotal,
    productLevelDiscount: quote.productLevelDiscount,
    voucherDiscount: quote.voucherDiscount,
    shippingDiscount: quote.shippingDiscount,
  };
  const method = opts.method === 'bank_qr' ? 'bank_qr' : 'cod';
  const qrCreatedAt = new Date();
  const paymentExpiresAt = new Date(qrCreatedAt.getTime() + env.qrPayment.ttlMinutes * 60_000);
  const paymentCancellationAt = new Date(
    paymentExpiresAt.getTime() + env.qrPayment.reconciliationGraceMinutes * 60_000,
  );
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
    ...(guestOrderToken ? { guestAccessTokenHash: hashGuestOrderToken(guestOrderToken) } : {}),
    items: orderItems,
    subtotal: totals.subtotal,
    originalTotal: totals.originalTotal,
    productLevelDiscount: totals.productLevelDiscount,
    voucherDiscount: totals.voucherDiscount,
    shippingDiscount: totals.shippingDiscount,
    discount: totals.discount,
    shippingFee: totals.shippingFee,
    vatRate: totals.vatRate,
    vatIncluded: totals.vatIncluded,
    pricesIncludeVat: totals.pricesIncludeVat,
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
    status: 'pending' as const,
    statusHistory: [{ status: 'pending', at: new Date() }],
    address,
    note: opts.note,
    ...(method === 'bank_qr' ? { paymentExpiresAt, paymentCancellationAt } : {}),
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
        [
          {
            order: created._id,
            method,
            status: 'unpaid',
            amount: totals.total,
            receivedAmount: 0,
            reconciliationStatus: method === 'bank_qr' ? 'awaiting_payment' : undefined,
          },
        ],
        { session },
      );
      if (cart && !explicitItems) {
        cart.items = [];
        await cart.save({ session });
      }
    });
  } catch (txnErr: any) {
    if (!transactionUnsupported(txnErr)) throw txnErr;
    logger.warn('[order] Mongo không hỗ trợ transaction -> dùng fallback rollback thủ công');
    created = await createOrderFallback({
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
    ...(method === 'bank_qr' ? { paymentExpiresAt, paymentCancellationAt } : {}),
    totals,
    ...(guestOrderToken ? { guestOrderToken } : {}),
  };
}

async function createOrderFallback(p: {
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
  let createdOrderId: mongoose.Types.ObjectId | undefined;
  let createdPaymentId: mongoose.Types.ObjectId | undefined;
  try {
    await reservePromotions(p.quote, p.customerKey);
    promotionsReserved = true;
    const order: any = await Order.create(p.doc);
    createdOrderId = order._id;
    const payment: any = await Payment.create({
      order: order._id,
      method: p.method,
      status: 'unpaid',
      amount: p.totals.total,
      receivedAmount: 0,
      reconciliationStatus: p.method === 'bank_qr' ? 'awaiting_payment' : undefined,
    });
    createdPaymentId = payment._id;
    if (p.cart && !p.explicitItems) {
      p.cart.items = [];
      await p.cart.save();
    }
    return order;
  } catch (err) {
    const cleanupResults = await Promise.allSettled([
      createdPaymentId ? Payment.deleteOne({ _id: createdPaymentId }) : Promise.resolve(),
      createdOrderId ? Order.deleteOne({ _id: createdOrderId }) : Promise.resolve(),
      restoreStock(p.stockItems),
      promotionsReserved ? releasePromotions(p.quote, p.customerKey) : Promise.resolve(),
    ]);
    if (cleanupResults.some((result) => result.status === 'rejected')) {
      logger.error('[order] Fallback rollback khong hoan tat', cleanupResults);
    }
    throw err;
  }
}

/** HUY DON cua user: chi cho phep khi don dang pending/paid; hoan kho. */
export async function cancelOrder(userId: string, orderId: string, reason?: string) {
  let order: any = null;
  const cancelledAt = new Date();
  try {
    order = await Order.findOneAndUpdate(
      { _id: orderId, user: userId, status: { $in: ['pending', 'paid'] } },
      {
        $set: {
          status: 'cancelled',
          cancelledBy: 'customer',
          cancelledAt,
          inventoryReleasedAt: cancelledAt,
          ...(reason ? { cancelReason: String(reason).trim().slice(0, 300) } : {}),
        },
        $push: { statusHistory: { status: 'cancelled', at: cancelledAt } },
      },
      { new: false },
    );
  } catch {
    throw Object.assign(new Error('Không tìm thấy đơn hàng'), { status: 404 });
  }
  if (!order) throw Object.assign(new Error('Không tìm thấy đơn hàng'), { status: 404 });
  await releaseOrderPromotionReservations(order);
  await restoreStock(
    (order.items || []).map((it: any) => ({ variant: String(it.variant), quantity: it.quantity })),
  );
  const cancelPayment: any = await Payment.findOne({ order: order._id });
  if (cancelPayment) {
    // Co bang chung ngan hang da nhan tien -> luon dua vao hang cho hoan tien,
    // ke ca khi admin chua kip bam xac nhan thanh toan.
    if (bankTransferNeedsRefund(cancelPayment)) {
      cancelPayment.status = 'refund_pending';
      cancelPayment.refundStatus = 'pending';
      cancelPayment.refundAmount = Number(
        cancelPayment.receivedAmount || cancelPayment.amount || 0,
      );
      cancelPayment.refundReason = 'order_cancelled';
    } else {
      cancelPayment.status = 'unpaid';
      cancelPayment.paidAt = undefined;
    }
    await cancelPayment.save();
  }
  void sendOrderNotification(String(order._id), 'status').catch(() => null);

  return { orderId: String(order._id), status: 'cancelled' };
}

/** Huy don QR chua thanh toan tu popup checkout, ap dung cho guest va user. */
export async function cancelPendingQrOrder(
  orderId: string,
  userId?: string,
  guestOrderToken?: string,
) {
  let order: any = null;
  const access = orderAccessFilter(userId, orderId, guestOrderToken);
  try {
    order = await Order.findOne(access);
  } catch {
    throw Object.assign(new Error('Không tìm thấy đơn hàng'), { status: 404 });
  }
  if (!order) throw Object.assign(new Error('Không tìm thấy đơn hàng'), { status: 404 });

  const payment: any = await Payment.findOne({ order: order._id });
  if (
    !payment ||
    payment.method !== 'bank_qr' ||
    !['unpaid', 'partial'].includes(payment.status) ||
    order.status !== 'pending'
  ) {
    throw Object.assign(new Error('Chi co the huy giao dich QR chua thanh toan'), { status: 400 });
  }

  const cancelledAt = new Date();
  order = await Order.findOneAndUpdate(
    { ...access, status: 'pending' },
    {
      $set: {
        status: 'cancelled',
        cancelledBy: 'customer',
        cancelledAt,
        inventoryReleasedAt: cancelledAt,
      },
      $push: { statusHistory: { status: 'cancelled', at: cancelledAt } },
    },
    { new: false },
  );
  if (!order) {
    throw Object.assign(new Error('Đơn không còn có thể hủy'), { status: 409 });
  }

  await releaseOrderPromotionReservations(order);
  await restoreStock(
    (order.items || []).map((it: any) => ({ variant: String(it.variant), quantity: it.quantity })),
  );
  if (bankTransferNeedsRefund(payment)) {
    payment.status = 'refund_pending';
    payment.refundStatus = 'pending';
    payment.refundAmount = Number(payment.receivedAmount || payment.amount || 0);
    payment.refundReason = 'order_cancelled';
    await payment.save();
  }
  void sendOrderNotification(String(order._id), 'status').catch(() => null);

  return { orderId: String(order._id), status: 'cancelled' };
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
      paymentExpiresAt: o.paymentExpiresAt || null,
      paymentCancellationAt: o.paymentCancellationAt || null,
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
  const rawPhone = normalizePhone(query);
  const phone =
    rawPhone.startsWith('84') && rawPhone.length === 11 ? `0${rawPhone.slice(2)}` : rawPhone;
  const isEmail = isLikelyValidEmail(email);
  const isPhone = isLikelyValidVietnamPhone(phone) && /^[\d\s.+()-]+$/.test(query);
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
      { $limit: 50 },
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
      .limit(50)
      .lean();
  } else if (isPhone) {
    orders = await Order.find({ 'address.phone': phone }).sort({ createdAt: -1 }).limit(50).lean();
  } else {
    const message = query.includes('@')
      ? 'Email khong dung dinh dang'
      : /^[\d\s.+()-]+$/.test(query)
        ? 'So dien thoai Viet Nam phai gom 10 chu so va bat dau bang 0'
        : 'Ma don phai gom 6 hoac 24 ky tu hexadecimal';
    throw Object.assign(new Error(message), { status: 400 });
  }

  if (!orders.length) return [];

  const payments: any[] = await Payment.find({
    order: { $in: orders.map((order) => order._id) },
  }).lean();
  const paymentMap = new Map(payments.map((payment) => [String(payment.order), payment]));

  return orders.map((order) => {
    const payment = paymentMap.get(String(order._id));
    return {
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
      statusHistory: (order.statusHistory || []).map((event: any) => ({
        status: normalizeOrderStatus(event.status),
        at: event.at,
      })),
    };
  });
}

/** Chi tiet 1 don cua user (chan xem don nguoi khac bang dieu kien { _id, user }). */
export async function getOrderById(
  userId: string | undefined,
  orderId: string,
  guestOrderToken?: string,
) {
  let order: any = null;
  const access = orderAccessFilter(userId, orderId, guestOrderToken);
  try {
    order = await Order.findOne(access).lean();
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
    statusHistory: (order.statusHistory || []).map((event: any) => ({
      status: normalizeOrderStatus(event.status),
      at: event.at,
    })),
    // Khach chi tu huy duoc khi don dang cho xu ly / da thanh toan va la chu don (da dang nhap).
    canCancel: Boolean(userId) && ['pending', 'paid'].includes(String(order.status)),
    cancelReason: order.cancelReason || '',
    cancelledBy: order.cancelledBy || null,
    cancelledAt: order.cancelledAt || null,
    paymentExpiresAt: order.paymentExpiresAt || null,
    paymentCancellationAt: order.paymentCancellationAt || null,
    subtotal: order.subtotal ?? order.total,
    originalTotal: order.originalTotal ?? order.subtotal ?? order.total,
    productLevelDiscount: order.productLevelDiscount ?? 0,
    voucherDiscount: order.voucherDiscount ?? order.discount ?? 0,
    shippingDiscount: order.shippingDiscount ?? 0,
    discount: order.discount ?? 0,
    shippingFee: order.shippingFee ?? 0,
    vatRate: order.vatRate,
    vatIncluded: order.vatIncluded,
    pricesIncludeVat: order.pricesIncludeVat,
    total: order.total,
    voucherCode: order.voucherCode || '',
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
      ? {
          method: payment.method,
          status: payment.status,
          amount: payment.amount,
          receivedAmount: payment.receivedAmount || 0,
          remainingAmount: Math.max(
            0,
            Number(payment.amount || 0) - Number(payment.receivedAmount || 0),
          ),
          excessAmount: payment.excessAmount || 0,
          reconciliationStatus: payment.reconciliationStatus || '',
          refundStatus: payment.refundStatus || 'none',
          refundAmount: payment.refundAmount || 0,
        }
      : null,
  };
}

/** Thong tin thanh toan cho 1 don (COD hoac VietQR). */
export async function getPaymentInfo(
  userId: string | undefined,
  orderId: string,
  guestOrderToken?: string,
) {
  let order: any = null;
  const access = orderAccessFilter(userId, orderId, guestOrderToken);
  try {
    order = await Order.findOne(access).lean();
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
    receivedAmount: Number(payment?.receivedAmount || 0),
    remainingAmount: Math.max(0, Number(amount) - Number(payment?.receivedAmount || 0)),
    excessAmount: Number(payment?.excessAmount || 0),
    reconciliationStatus: payment?.reconciliationStatus || '',
    paymentExpiresAt: order.paymentExpiresAt || null,
    paymentCancellationAt: order.paymentCancellationAt || null,
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
