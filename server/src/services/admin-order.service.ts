import { Order } from '../models/order.model';
import { Payment } from '../models/payment.model';
import { User } from '../models/user.model';
import { releaseOrderPromotionReservations, restoreStock } from './order.service';
import { OrderStatus } from '../types/dto';
import { normalizeOrderStatus } from '../utils/orderStatus';
import { sendOrderNotification } from './notification.service';

// So do chuyen trang thai hop le
const FLOW: Record<OrderStatus, OrderStatus[]> = {
  pending: ['shipping', 'cancelled'],
  paid: ['shipping', 'cancelled'],
  shipping: ['done', 'cancelled'],
  done: ['returned'],
  cancelled: [],
  returned: [],
};

export interface AdminOrderQuery {
  page?: number | string;
  limit?: number | string;
  status?: string;
  sort?: string;
  order?: string;
  paymentStatus?: string;
  paymentMethod?: string;
}

/** Danh sach don co phan trang / loc / sap xep chuan cho admin. */
export async function listOrders(query: AdminOrderQuery = {}) {
  const page = Math.max(1, parseInt(String(query.page), 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(String(query.limit), 10) || 20));
  const filter: Record<string, unknown> = {};
  if (query.status === 'pending') filter.status = { $in: ['pending', 'paid'] };
  else if (['shipping', 'done', 'cancelled', 'returned'].includes(String(query.status))) {
    filter.status = query.status;
  }

  const paymentFilter: Record<string, unknown> = {};
  if (['paid', 'unpaid'].includes(String(query.paymentStatus))) {
    paymentFilter.status = query.paymentStatus;
  }
  if (['cod', 'bank_qr'].includes(String(query.paymentMethod))) {
    paymentFilter.method = query.paymentMethod;
  }
  if (Object.keys(paymentFilter).length > 0) {
    filter._id = { $in: await Payment.distinct('order', paymentFilter) };
  }

  const sortField = ['createdAt', 'total', 'status'].includes(String(query.sort))
    ? String(query.sort)
    : 'createdAt';
  const dir = query.order === 'asc' ? 1 : -1;

  const [items, total] = await Promise.all([
    Order.find(filter)
      .sort({ [sortField]: dir })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('user', 'name email')
      .lean(),
    Order.countDocuments(filter),
  ]);

  const ids = items.map((o: any) => o._id);
  const payments: any[] = await Payment.find({ order: { $in: ids } }).lean();
  const pm = new Map(payments.map((p) => [String(p.order), p]));

  return {
    // FIX: dung key `data` (dong bo voi Paginated<T> phia client va cac endpoint admin khac).
    // Trước đây trả về `items` khiến client đọc list.data = undefined rồi crash "reading 'length'".
    data: items.map((o: any) => {
      const pay = pm.get(String(o._id));
      return {
        id: String(o._id),
        createdAt: o.createdAt,
        status: normalizeOrderStatus(o.status),
        total: o.total,
        customer: o.user ? { name: o.user.name, email: o.user.email } : null,
        itemCount: (o.items || []).reduce((s: number, it: any) => s + (it.quantity || 0), 0),
        payment: pay
          ? {
              method: pay.method,
              status: pay.status,
              receivedAmount: pay.receivedAmount ?? null,
              bankReference: pay.bankReference || '',
              providerTransactionId: pay.providerTransactionId || '',
            }
          : null,
      };
    }),
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit) || 1,
  };
}

export async function getOrder(id: string) {
  let order: any = null;
  try {
    order = await Order.findById(id).populate('user', 'name email').lean();
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
    customer: order.user ? { name: order.user.name, email: order.user.email } : null,
    subtotal: order.subtotal ?? order.total,
    discount: order.discount ?? 0,
    originalTotal: order.originalTotal ?? order.subtotal ?? order.total,
    productLevelDiscount: order.productLevelDiscount ?? 0,
    voucherDiscount: order.voucherDiscount ?? order.discount ?? 0,
    shippingDiscount: order.shippingDiscount ?? 0,
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
      promotionType: it.promotionType || null,
      promotionName: it.promotionName || '',
      quantity: it.quantity,
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

/** Admin cap nhat trang thai don. Don COD hoan tat thi tu dong ghi nhan da thanh toan. */
export async function updateStatus(id: string, next: OrderStatus) {
  const order: any = await Order.findById(id);
  if (!order) throw Object.assign(new Error('Không tìm thấy đơn hàng'), { status: 404 });

  const allowed = FLOW[order.status as OrderStatus] || [];
  if (!allowed.includes(next)) {
    throw Object.assign(new Error(`Không thể chuyển từ ${order.status} sang ${next}`), {
      status: 400,
    });
  }

  if (next === 'cancelled') {
    await releaseOrderPromotionReservations(order);
    await restoreStock(
      (order.items || []).map((it: any) => ({
        variant: String(it.variant),
        quantity: it.quantity,
      })),
    );
    if (order.user && order.pointsEarned) {
      await User.updateOne({ _id: order.user }, { $inc: { loyaltyPoints: -order.pointsEarned } });
    }
    await Payment.updateOne(
      { order: order._id },
      { $set: { status: 'unpaid' }, $unset: { paidAt: 1 } },
    );
  }
  if (next === 'returned') {
    await restoreStock(
      (order.items || []).map((it: any) => ({
        variant: String(it.variant),
        quantity: it.quantity,
      })),
    );
    await Payment.updateOne(
      { order: order._id, status: 'paid' },
      { $set: { status: 'refunded', refundedAt: new Date() } },
    );
  }
  if (next === 'done') {
    await Payment.updateOne(
      {
        order: order._id,
        method: 'cod',
        $or: [{ status: { $ne: 'paid' } }, { paidAt: null }],
      },
      { $set: { status: 'paid', paidAt: new Date() } },
    );
  }

  order.status = next;
  const now = new Date();
  order.statusHistory.push({ status: next, at: now });
  if (next === 'shipping') {
    order.processedAt ||= now;
    order.shippedAt ||= now;
  }
  if (next === 'done') order.completedAt ||= now;
  if (next === 'cancelled') order.cancelledAt ||= now;
  if (next === 'returned') order.returnedAt ||= now;
  await order.save();
  const notificationDelivery = await sendOrderNotification(String(order._id), 'status');
  // FIX: tra ve DAY DU don hang (getOrder) thay vi chi { id, status }.
  // Trước đây client setDetail(updated) -> detail.items = undefined rồi modal crash "reading 'map'".
  return {
    ...(await getOrder(String(order._id))),
    notificationDelivery,
  };
}

/** Quản trị viên xác nhận đã nhận tiền. Trạng thái giao nhận của đơn được giữ nguyên. */
export async function confirmPayment(id: string) {
  const payment: any = await Payment.findOneAndUpdate(
    { order: id },
    { $set: { status: 'paid', paidAt: new Date() } },
    { new: true },
  );
  if (!payment)
    throw Object.assign(new Error('Không tìm thấy thanh toán cho đơn này'), { status: 404 });
  return getOrder(id);
}

/** Admin dat trang thai thanh toan doc lap voi trang thai giao nhan. */
export async function setPaymentStatus(id: string, status: 'paid' | 'unpaid') {
  const order: any = await Order.findById(id);
  if (!order) throw Object.assign(new Error('Không tìm thấy đơn hàng'), { status: 404 });
  await Payment.updateOne(
    { order: order._id },
    status === 'paid'
      ? { $set: { status: 'paid', paidAt: new Date() } }
      : { $set: { status: 'unpaid' }, $unset: { paidAt: 1 } },
  );
  return getOrder(String(order._id));
}
