import { Cart } from '../models/cart.model';
import { Variant } from '../models/variant.model';
import { resolveVariantPrices } from './pricing-engine.service';

// Populate giỏ -> lấy kèm thông tin variant + product (tên, ảnh, slug)
const populateOpt = {
  path: 'items.variant',
  populate: { path: 'product', select: 'name slug description images category' },
};

// Chuẩn hóa dữ liệu giỏ trả về cho FE: tính giá dòng, tổng tiền, tổng số lượng
async function serialize(cart: any) {
  const rawItems = cart?.items ?? [];
  const priceMap = await resolveVariantPrices(rawItems.map((item: any) => item.variant).filter(Boolean));
  const items = rawItems
    .filter((i: any) => i.variant) // bỏ item mà variant đã bị xóa khỏi DB
    .map((i: any) => {
      const v: any = i.variant;
      const product: any = v.product || {};
      const pricing = priceMap.get(String(v._id));
      const finalPrice = pricing?.finalPrice ?? Number(v.basePrice ?? v.price);
      return {
        variant: String(v._id),
        product: product._id ? String(product._id) : undefined,
        name: product.name,
        slug: product.slug,
        description: product.description || '',
        image: (product.images && product.images[0]) || (v.images && v.images[0]) || null,
        volume: v.volume,
        price: finalPrice,
        basePrice: pricing?.basePrice ?? Number(v.basePrice ?? v.price),
        discountAmount: pricing?.discountAmount || 0,
        discountPercent: pricing?.discountPercent || 0,
        promotionType: pricing?.promotionType || null,
        promotionName: pricing?.promotionName || '',
        stock: v.stock,
        quantity: i.quantity,
        lineTotal: finalPrice * i.quantity,
      };
    });

  const total = items.reduce((s: number, x: any) => s + x.lineTotal, 0);
  const count = items.reduce((s: number, x: any) => s + x.quantity, 0);
  return { items, total, count };
}

async function loadPopulated(userId: string) {
  return Cart.findOne({ user: userId }).populate(populateOpt as any);
}

async function findOrCreate(userId: string) {
  let cart = await Cart.findOne({ user: userId });
  if (!cart) cart = await Cart.create({ user: userId, items: [] });
  return cart;
}

export async function getCart(userId: string) {
  const cart = await loadPopulated(userId);
  return serialize(cart);
}

export async function addItem(userId: string, variantId: string, quantity = 1) {
  const v: any = await Variant.findById(variantId);
  if (!v) throw Object.assign(new Error('Không tìm thấy biến thể'), { status: 404 });

  const stock = Number(v.stock) || 0;
  if (stock <= 0) throw Object.assign(new Error('Sản phẩm đã hết hàng'), { status: 409 });

  const qty = Math.max(1, Math.floor(Number(quantity) || 1));
  const cart: any = await findOrCreate(userId);
  const line = cart.items.find((i: any) => String(i.variant) === String(variantId));

  let next = (line ? line.quantity : 0) + qty;
  if (next > stock) next = stock; // không cho vượt tồn kho

  if (line) line.quantity = next;
  else cart.items.push({ variant: variantId, quantity: next });

  await cart.save();
  return getCart(userId);
}

export async function updateItem(userId: string, variantId: string, quantity: number) {
  const cart: any = await findOrCreate(userId);
  const line = cart.items.find((i: any) => String(i.variant) === String(variantId));
  if (!line) throw Object.assign(new Error('Sản phẩm không có trong giỏ'), { status: 404 });

  const qty = Math.floor(Number(quantity));
  if (!qty || qty <= 0) {
    // số lượng <= 0 => xóa khỏi giỏ
    cart.items = cart.items.filter((i: any) => String(i.variant) !== String(variantId));
  } else {
    const v: any = await Variant.findById(variantId);
    const stock = Number(v?.stock) || 0;
    line.quantity = stock > 0 ? Math.min(qty, stock) : qty;
  }

  await cart.save();
  return getCart(userId);
}

export async function removeItem(userId: string, variantId: string) {
  const cart: any = await findOrCreate(userId);
  cart.items = cart.items.filter((i: any) => String(i.variant) !== String(variantId));
  await cart.save();
  return getCart(userId);
}

export async function clearCart(userId: string) {
  const cart: any = await findOrCreate(userId);
  cart.items = [];
  await cart.save();
  return getCart(userId);
}

/**
 * ĐỒNG BỘ giỏ localStorage (khách vãng lai) -> DB khi đăng nhập.
 * Quy tắc: CỘNG DỒN số lượng vào giỏ trên DB (không ghi đè).
 * Item lỗi (variant không tồn tại) sẽ bị bỏ qua để không chặn cả quá trình.
 */
export async function mergeCart(
  userId: string,
  localItems: { variant: string; quantity: number }[],
) {
  if (Array.isArray(localItems)) {
    for (const it of localItems) {
      if (!it || !it.variant) continue;
      try {
        await addItem(userId, it.variant, it.quantity || 1);
      } catch {
        // bỏ qua item lỗi
      }
    }
  }
  return getCart(userId);
}
