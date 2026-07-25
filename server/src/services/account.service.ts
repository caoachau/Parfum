import { Order } from '../models/order.model';
import { Payment } from '../models/payment.model';
import { Wishlist } from '../models/wishlist.model';
import { User } from '../models/user.model';
import '../models/product.model';
import { Variant } from '../models/variant.model';
import { normalizeOrderStatus } from '../utils/orderStatus';
import { claimGuestOrdersForUser, issueNewMemberVoucher } from './auth.service';

export async function getOrders(userId: string) {
  // Đồng bộ cả các đơn cũ đã đặt lúc chưa đăng nhập trước khi trả lịch sử.
  const user: any = await User.findById(userId).select('email phone').lean();
  if (user?.email && user?.phone) {
    await claimGuestOrdersForUser(user, String(user.email), String(user.phone));
  }

  const orders: any[] = await Order.find({ user: userId }).sort({ createdAt: -1 }).lean();
  const payments: any[] = await Payment.find({
    order: { $in: orders.map((order) => order._id) },
  })
    .select('order method status paidAt')
    .lean();
  const paymentByOrder = new Map(
    payments.map((payment) => [String(payment.order), payment]),
  );

  const variantIds = Array.from(
    new Set(
      orders.flatMap((order) =>
        (order.items || [])
          .map((item: any) => (item.variant ? String(item.variant) : ''))
          .filter(Boolean),
      ),
    ),
  );
  const variantDocs: any[] = variantIds.length
    ? await Variant.find({ _id: { $in: variantIds } })
        .select('images product')
        .populate('product', 'images')
        .lean()
    : [];
  const imageByVariant = new Map<string, string>();
  for (const variant of variantDocs) {
    const image = variant.images?.[0] || variant.product?.images?.[0] || '';
    if (image) imageByVariant.set(String(variant._id), image);
  }

  return orders.map((order) => {
    const payment = paymentByOrder.get(String(order._id));

    return {
      id: String(order._id),
      createdAt: order.createdAt,
      status: normalizeOrderStatus(order.status),
      displayStatus: normalizeOrderStatus(order.status),
      payment: payment
        ? {
            method: payment.method,
            status: payment.status,
            paidAt: payment.paidAt || null,
          }
        : null,
      total: order.total || 0,
      itemCount: (order.items || []).reduce(
        (sum: number, item: any) => sum + (item.quantity || 0),
        0,
      ),
      firstItemName: order.items?.[0]?.name || 'Đơn hàng',
      address: order.address || null,
      items: (order.items || []).map((item: any) => ({
        variant: item.variant ? String(item.variant) : '',
        name: item.name || 'Sản phẩm',
        image:
          (item.variant && imageByVariant.get(String(item.variant))) || null,
        price: item.price || 0,
        quantity: item.quantity || 0,
        lineTotal: (item.price || 0) * (item.quantity || 0),
      })),
    };
  });
}

export async function getWishlist(userId: string) {
  const wishlist: any = await Wishlist.findOne({ user: userId })
    .populate({
      path: 'products',
      select: 'name slug description images brand category',
      populate: [
        { path: 'brand', select: 'name' },
        { path: 'category', select: 'name' },
      ],
    })
    .lean();

  return (wishlist?.products || []).map((product: any) => ({
    id: String(product._id),
    slug: product.slug,
    name: product.name,
    description: product.description || '',
    brand: product.brand?.name || '',
    category: product.category?.name || '',
    image: product.images?.[0] || null,
    images: product.images || [],
  }));
}

export async function addWishlistItem(userId: string, productId: string) {
  await Wishlist.findOneAndUpdate(
    { user: userId },
    { $addToSet: { products: productId } },
    { upsert: true, new: true },
  );
  return getWishlist(userId);
}

export async function removeWishlistItem(userId: string, productId: string) {
  await Wishlist.findOneAndUpdate(
    { user: userId },
    { $pull: { products: productId } },
    { new: true },
  );
  return getWishlist(userId);
}

export async function getScentProfile(userId: string) {
  const user: any = await User.findById(userId).select('scentProfile').lean();
  const profile = user?.scentProfile;
  if (!profile) {
    return {
      families: [],
      preferredNotes: [],
      dislikedNotes: [],
    };
  }

  return {
    families: Array.isArray(profile.families) ? profile.families : [],
    preferredNotes: Array.isArray(profile.preferredNotes) ? profile.preferredNotes : [],
    dislikedNotes: Array.isArray(profile.dislikedNotes) ? profile.dislikedNotes : [],
  };
}

export async function updateScentProfile(
  userId: string,
  profile: { families: string[]; preferredNotes: string[]; dislikedNotes: string[] },
) {
  const user: any = await User.findByIdAndUpdate(
    userId,
    { $set: { scentProfile: profile } },
    { new: true },
  )
    .select('scentProfile')
    .lean();

  const issuance = await issueNewMemberVoucher(userId);
  return {
    ...(user?.scentProfile || profile),
    newMemberVoucherIssued: issuance.voucherIssued,
    profileCompletionVoucherCode: issuance.user?.profileCompletionVoucherCode,
  };
}
