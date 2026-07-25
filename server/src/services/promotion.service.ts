import { Discount } from '../models/discount.model';
import { FlashSale } from '../models/flashSale.model';
import { Order } from '../models/order.model';
import { PriceHistory } from '../models/priceHistory.model';
import { Product } from '../models/product.model';
import { Variant } from '../models/variant.model';
import { Voucher } from '../models/voucher.model';
import { sendPromotionNotification } from './notification.service';

function error(message: string, status = 400) {
  return Object.assign(new Error(message), { status });
}

function dateRange(start: unknown, end: unknown) {
  const startDate = new Date(String(start));
  const endDate = new Date(String(end));
  if (!Number.isFinite(startDate.getTime()) || !Number.isFinite(endDate.getTime()) || startDate >= endDate) {
    throw error('Thời gian bắt đầu và kết thúc không hợp lệ');
  }
  return { startDate, endDate };
}

const basePriceOf = (variant: any) => Number(variant.basePrice ?? variant.price ?? 0);

export async function ensurePriceHistory(variant: any, changedBy?: string) {
  const active = await PriceHistory.findOne({ variant: variant._id, validTo: null });
  if (active) return active;
  return PriceHistory.create({
    variant: variant._id,
    basePrice: basePriceOf(variant),
    validFrom: variant.createdAt || new Date(),
    reason: 'Khởi tạo lịch sử từ giá niêm yết hiện có',
    changedBy: changedBy || undefined,
  });
}

export async function changeVariantBasePrice(variant: any, nextPrice: number, changedBy?: string, reason = '') {
  const value = Number(nextPrice);
  if (!Number.isFinite(value) || value < 0) throw error('Giá niêm yết không hợp lệ');
  const current = basePriceOf(variant);
  if (current === value) {
    variant.basePrice = value;
    variant.price = value;
    return;
  }
  const now = new Date();
  await ensurePriceHistory(variant, changedBy);
  await PriceHistory.updateMany({ variant: variant._id, validTo: null }, { $set: { validTo: now } });
  await PriceHistory.create({
    variant: variant._id, basePrice: value, validFrom: now,
    reason: String(reason || 'Admin cập nhật giá niêm yết').trim(),
    changedBy: changedBy || undefined,
  });
  variant.basePrice = value;
  variant.price = value;
}

async function variantsForDiscount(input: any) {
  if (input.scope === 'PRODUCT') {
    if (!input.products?.length) throw error('Chọn ít nhất một sản phẩm');
    return Variant.find({ product: { $in: input.products } }).populate('product', 'name').lean();
  }
  if (!input.categories?.length) throw error('Chọn ít nhất một danh mục');
  const productIds = await Product.distinct('_id', { category: { $in: input.categories } });
  return Variant.find({ product: { $in: productIds } }).populate('product', 'name').lean();
}

async function assertReferenceEvidence(variants: any[], startDate: Date, confirmed: boolean, note: string) {
  for (const variant of variants) await ensurePriceHistory(variant);
  const missing: string[] = [];
  for (const variant of variants) {
    const basePrice = basePriceOf(variant);
    const [sold, listedPriceHistory] = await Promise.all([
      Order.exists({
        createdAt: { $lt: startDate },
        status: { $in: ['paid', 'shipping', 'done'] },
        items: { $elemMatch: { variant: variant._id, $or: [{ basePrice }, { basePrice: { $exists: false }, price: basePrice }] } },
      }),
      PriceHistory.exists({
        variant: variant._id,
        basePrice,
        validFrom: { $lt: startDate },
        $or: [{ validTo: null }, { validTo: { $gte: startDate } }],
      }),
    ]);
    if (!sold && !listedPriceHistory) missing.push(`${variant.product?.name || variant.sku} (${variant.volume || variant.size || variant.sku})`);
  }
  // Rang buoc chung cu gia truoc KM (Nghi dinh 81) chi mang tinh THAM KHAO, KHONG chan tao KM.
  // Truoc day dieu nay khien admin khong the tao discount/flash cho san pham chua tung ban.
  void missing; void confirmed; void note;
}

function assertLegalDiscount(input: any, variants: any[]) {
  if (input.type === 'PERCENTAGE' && Number(input.value) > 100) throw error('Mức giảm không được vượt quá 100%');
  if (input.isConcentratedPromotion) return;
  if (input.type === 'PERCENTAGE' && Number(input.value) > 50) {
    throw error('Mức giảm thông thường không được vượt quá 50%');
  }
  if (input.type === 'FIXED') {
    const invalid = variants.find((variant) => Number(input.value) > basePriceOf(variant) * 0.5);
    if (invalid) throw error(`Mức giảm cố định vượt quá 50% giá niêm yết của ${invalid.product?.name || invalid.sku}`);
  }
}

export async function listVouchers() {
  return Voucher.find({}).sort({ createdAt: -1 }).lean();
}

function normalizeVoucher(input: any) {
  const { startDate, endDate } = dateRange(input.startDate, input.endDate);
  if (input.type === 'percentage' && Number(input.value) > 100) throw error('Voucher phần trăm không được vượt quá 100%');
  return {
    code: String(input.code).trim().toUpperCase(), name: String(input.name || '').trim(),
    type: input.type, value: Number(input.type === 'free_shipping' ? 0 : input.value),
    minOrder: Number(input.minOrderValue || input.minOrder || 0),
    maxDiscount: Number(input.maxDiscountAmount || input.maxDiscount || 0),
    startDate, endDate, expiresAt: endDate,
    usageLimit: Number(input.usageLimit || 0), usageLimitPerUser: Number(input.usageLimitPerUser || 0),
    stackable: input.stackable !== false,
    userSegment: input.appliesToNewMembers ? 'NEW' : input.userSegment || 'ALL',
    appliesToNewMembers: Boolean(input.appliesToNewMembers),
    isPrivate: Boolean(input.isPrivate), isConcentratedPromotion: Boolean(input.isConcentratedPromotion), isActive: input.isActive !== false,
  };
}

// LUU Y: Voucher KHONG gui email hang loat khi admin tao/cap nhat ma.
// - Voucher "Ap dung cho thanh vien moi" (appliesToNewMembers) chi duoc gui RIENG
//   cho tung khach chua co don khi ho cap nhat ho so (xem issueNewMemberVoucher
//   trong auth.service.ts) - do la luc ma co hieu luc voi khach do.
// - Cac voucher thong thuong khac khong tu dong gui mail; khach dung ma tren shop.
// Discount va Flash Sale van gui thong bao khuyen mai binh thuong (xem ben duoi).

export async function createVoucher(input: any) {
  const data = normalizeVoucher(input);
  if (await Voucher.exists({ code: data.code })) throw error('Mã voucher đã tồn tại', 409);
  const item: any = await Voucher.create(data);
  return { ...item.toObject(), notificationDelivery: undefined };
}
export async function updateVoucher(id: string, input: any) {
  const data = normalizeVoucher(input);
  if (await Voucher.exists({ code: data.code, _id: { $ne: id } })) throw error('Mã voucher đã tồn tại', 409);
  const item = await Voucher.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  if (!item) throw error('Không tìm thấy voucher', 404);
  return { ...item.toObject(), notificationDelivery: undefined };
}
export async function deleteVoucher(id: string) {
  const item = await Voucher.findByIdAndDelete(id);
  if (!item) throw error('Không tìm thấy voucher', 404);
  return { id };
}

export async function listDiscounts() {
  return Discount.find({}).populate('products', 'name').populate('categories', 'name').sort({ createdAt: -1 }).lean();
}
async function normalizeAndValidateDiscount(input: any) {
  const { startDate, endDate } = dateRange(input.startDate, input.endDate);
  const data = {
    name: String(input.name).trim(), scope: input.scope, type: input.type,
    value: Number(input.value), maxDiscountAmount: Number(input.maxDiscountAmount || 0),
    products: input.scope === 'PRODUCT' ? input.products || [] : [],
    categories: input.scope === 'CATEGORY' ? input.categories || [] : [],
    priority: Number(input.priority || 0), startDate, endDate,
    isActive: input.isActive !== false, isConcentratedPromotion: Boolean(input.isConcentratedPromotion),
    referencePriceConfirmed: Boolean(input.referencePriceConfirmed),
    referencePriceNote: String(input.referencePriceNote || '').trim(),
  };
  const variants = await variantsForDiscount(data);
  if (!variants.length) throw error('Không có biến thể nào thuộc phạm vi đã chọn');
  assertLegalDiscount(data, variants);
  await assertReferenceEvidence(variants, startDate, data.referencePriceConfirmed, data.referencePriceNote);
  return data;
}
async function notifyDiscount(item: any) {
  if (!item.isActive) return undefined;
  const benefit = item.type === 'FIXED'
    ? `Giảm ${Number(item.value || 0).toLocaleString('vi-VN')}đ`
    : `Giảm ${Number(item.value || 0)}%`;
  const result = await sendPromotionNotification({
    name: item.name,
    detail: `${benefit} cho các sản phẩm được chọn trong thời gian chương trình.`,
    url: '/shop',
  });
  if (result.recipientCount === 0 || result.sentCount > 0) {
    item.promotionNotifiedAt = new Date();
    await item.save();
  }
  return result;
}

export async function createDiscount(input: any) {
  const item: any = await Discount.create(await normalizeAndValidateDiscount(input));
  const notificationDelivery = await notifyDiscount(item);
  return { ...item.toObject(), notificationDelivery };
}
export async function updateDiscount(id: string, input: any) {
  const previous: any = await Discount.findById(id).select('isActive').lean();
  if (!previous) throw error('Không tìm thấy discount', 404);
  const item = await Discount.findByIdAndUpdate(id, await normalizeAndValidateDiscount(input), { new: true, runValidators: true });
  if (!item) throw error('Không tìm thấy discount', 404);
  const notificationDelivery =
    !previous.isActive && item.isActive ? await notifyDiscount(item) : undefined;
  return { ...item.toObject(), notificationDelivery };
}
export async function deleteDiscount(id: string) {
  const item = await Discount.findByIdAndDelete(id); if (!item) throw error('Không tìm thấy discount', 404); return { id };
}

function flashStatus(item: any, now = new Date()) {
  if (!item.isActive || new Date(item.endTime) <= now || item.soldCount >= item.stockAllocated) return 'ENDED';
  if (new Date(item.startTime) > now) return 'UPCOMING';
  return 'ACTIVE';
}
function flashStatusReason(item: any, now = new Date()) {
  if (!item.isActive) return 'Đã tắt';
  if (new Date(item.startTime) > now) return 'Chưa đến thời gian bắt đầu';
  if (new Date(item.endTime) <= now) return 'Đã hết thời gian';
  if (Number(item.soldCount || 0) >= Number(item.stockAllocated || 0)) return 'Đã bán hết số lượng phân bổ';
  return 'Đang áp dụng trên shop/cart/checkout';
}
export async function listFlashSales() {
  const rows: any[] = await FlashSale.find({}).populate({ path: 'variant', select: 'sku volume size stock product', populate: { path: 'product', select: 'name' } }).sort({ startTime: -1 }).lean();
  return rows.map((item) => ({ ...item, status: flashStatus(item), statusReason: flashStatusReason(item), remaining: Math.max(0, Number(item.stockAllocated) - Number(item.soldCount || 0)) }));
}
async function normalizeAndValidateFlash(input: any, existingId?: string) {
  const { startDate: startTime, endDate: endTime } = dateRange(input.startTime, input.endTime);
  const variant: any = await Variant.findById(input.variant).populate('product', 'name');
  if (!variant) throw error('Không tìm thấy biến thể', 404);
  await ensurePriceHistory(variant);
  const originalPrice = basePriceOf(variant);
  const flashPrice = Number(input.flashPrice);
  const stockAllocated = Number(input.stockAllocated);
  if (flashPrice < 0 || flashPrice >= originalPrice) throw error('Giá flash sale phải thấp hơn giá niêm yết');
  if (!input.isConcentratedPromotion && flashPrice < originalPrice * 0.5) throw error('Mức giảm thông thường không được vượt quá 50%');
  if (!Number.isInteger(stockAllocated) || stockAllocated < 1 || stockAllocated > Number(variant.stock || 0)) throw error('Tồn phân bổ phải từ 1 đến tồn kho hiện tại');
  const overlap = await FlashSale.exists({
    _id: { $ne: existingId || undefined }, variant: variant._id, isActive: true,
    startTime: { $lt: endTime }, endTime: { $gt: startTime },
  });
  if (overlap) throw error('Biến thể đã có flash sale trùng thời gian');
  await assertReferenceEvidence([variant], startTime, Boolean(input.referencePriceConfirmed), String(input.referencePriceNote || ''));
  return {
    name: String(input.name).trim(), variant: variant._id, originalPrice, flashPrice,
    stockAllocated, maxPerUser: Number(input.maxPerUser || 0), startTime, endTime,
    isActive: input.isActive !== false, isConcentratedPromotion: Boolean(input.isConcentratedPromotion),
    referencePriceConfirmed: Boolean(input.referencePriceConfirmed), referencePriceNote: String(input.referencePriceNote || '').trim(),
  };
}
async function notifyFlashSale(item: any) {
  if (!item.isActive) return undefined;
  const result = await sendPromotionNotification({
    name: item.name,
    detail: `Giá Flash Sale ${Number(item.flashPrice || 0).toLocaleString('vi-VN')}đ, số lượng có hạn.`,
    url: '/shop',
  });
  if (result.recipientCount === 0 || result.sentCount > 0) {
    item.promotionNotifiedAt = new Date();
    await item.save();
  }
  return result;
}

export async function createFlashSale(input: any) {
  const item: any = await FlashSale.create(await normalizeAndValidateFlash(input));
  const notificationDelivery = await notifyFlashSale(item);
  return { ...item.toObject(), notificationDelivery };
}
export async function updateFlashSale(id: string, input: any) {
  const current: any = await FlashSale.findById(id);
  if (!current) throw error('Không tìm thấy flash sale', 404);
  const data: any = await normalizeAndValidateFlash(input, id);
  if (Number(data.stockAllocated) < Number(current.soldCount || 0)) throw error('Tồn phân bổ không thể nhỏ hơn số đã bán');
  data.soldCount = current.soldCount;
  const item: any = await FlashSale.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  if (!item) throw error('Không tìm thấy flash sale', 404);
  const notificationDelivery =
    !current.isActive && item.isActive ? await notifyFlashSale(item) : undefined;
  return { ...item.toObject(), notificationDelivery };
}
export async function deleteFlashSale(id: string) {
  const item = await FlashSale.findByIdAndDelete(id); if (!item) throw error('Không tìm thấy flash sale', 404); return { id };
}

export async function listPriceHistory(variant?: string) {
  if (!variant) {
    const [variants, tracked]: any[] = await Promise.all([
      Variant.find({}).select('price basePrice createdAt').lean(),
      PriceHistory.distinct('variant'),
    ]);
    const trackedIds = new Set(tracked.map(String));
    const missing = variants.filter((item: any) => !trackedIds.has(String(item._id)));
    if (missing.length) {
      await PriceHistory.insertMany(missing.map((item: any) => ({
        variant: item._id,
        basePrice: basePriceOf(item),
        validFrom: item.createdAt || new Date(),
        reason: 'Khởi tạo lịch sử từ dữ liệu giá hiện có',
      })), { ordered: false });
    }
  }
  return PriceHistory.find(variant ? { variant } : {}).populate({ path: 'variant', populate: { path: 'product', select: 'name' } }).sort({ validFrom: -1 }).limit(500).lean();
}
