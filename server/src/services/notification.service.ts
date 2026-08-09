import { JournalSubscriber } from '../models/journalSubscriber.model';
import { Order } from '../models/order.model';
import { Payment } from '../models/payment.model';
import { User } from '../models/user.model';
import { isMailConfigured, sendMail } from '../utils/mailer';
import { logger } from '../utils/logger';

export type NotificationPreferences = {
  orderNotifications: boolean;
  emailNotifications: boolean;
  promotionNotifications: boolean;
  journalNotifications: boolean;
};

const DEFAULT_PREFERENCES: NotificationPreferences = {
  orderNotifications: true,
  emailNotifications: true,
  promotionNotifications: true,
  journalNotifications: true,
};

const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

function preferenceValue(value: unknown, fallback: boolean) {
  return typeof value === 'boolean' ? value : fallback;
}

function normalizePreferences(value: any): NotificationPreferences {
  return {
    orderNotifications: preferenceValue(
      value?.orderNotifications,
      DEFAULT_PREFERENCES.orderNotifications,
    ),
    emailNotifications: preferenceValue(
      value?.emailNotifications,
      DEFAULT_PREFERENCES.emailNotifications,
    ),
    promotionNotifications: preferenceValue(
      value?.promotionNotifications,
      DEFAULT_PREFERENCES.promotionNotifications,
    ),
    journalNotifications: preferenceValue(
      value?.journalNotifications,
      DEFAULT_PREFERENCES.journalNotifications,
    ),
  };
}

function escapeHtml(value: unknown) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function absoluteUrl(path: string) {
  return `${CLIENT_URL.replace(/\/+$/, '')}${path.startsWith('/') ? path : `/${path}`}`;
}

export async function getNotificationPreferences(userId: string) {
  const user: any = await User.findById(userId).select('email notificationPreferences').lean();
  if (!user) throw Object.assign(new Error('Không tìm thấy người dùng'), { status: 404 });

  const preferences = normalizePreferences(user.notificationPreferences);
  const subscriber: any = await JournalSubscriber.findOne({ email: user.email })
    .select('isActive')
    .lean();

  // JournalSubscriber la nguon gui email thuc te. Neu email da subscribe tu /blog,
  // dashboard phai hien dung trang thai ngay ca voi tai khoan cu.
  preferences.journalNotifications = subscriber
    ? subscriber.isActive !== false
    : preferences.journalNotifications;

  return preferences;
}

export async function updateNotificationPreferences(
  userId: string,
  input: Partial<NotificationPreferences>,
) {
  const user: any = await User.findById(userId).select('email notificationPreferences').lean();
  if (!user) throw Object.assign(new Error('Không tìm thấy người dùng'), { status: 404 });

  const merged = normalizePreferences({
    ...normalizePreferences(user.notificationPreferences),
    ...input,
  });
  // "Thông báo qua email" là công tắc tổng: tắt nó thì tắt tất cả các loại email khác.
  // Bat lai chi bat rieng email; 3 loai con lai giu nguyen de khach tu chon.
  const preferences: NotificationPreferences = merged.emailNotifications
    ? merged
    : {
        emailNotifications: false,
        orderNotifications: false,
        promotionNotifications: false,
        journalNotifications: false,
      };
  await User.updateOne({ _id: userId }, { $set: { notificationPreferences: preferences } });

  if (preferences.journalNotifications) {
    await JournalSubscriber.updateOne(
      { email: user.email },
      {
        $set: { isActive: true },
        $setOnInsert: { subscribedAt: new Date() },
        $unset: { adminSeenAt: '' },
      },
      { upsert: true },
    );
  } else {
    await JournalSubscriber.updateOne({ email: user.email }, { $set: { isActive: false } });
  }

  return preferences;
}

export async function activateJournalForEmail(emailInput: string) {
  const email = String(emailInput || '')
    .trim()
    .toLowerCase();
  await User.updateOne(
    { email },
    { $set: { 'notificationPreferences.journalNotifications': true } },
  );
}

export async function subscribeNewAccountToJournal(emailInput: string) {
  const email = String(emailInput || '')
    .trim()
    .toLowerCase();
  if (!email) return;

  await JournalSubscriber.updateOne(
    { email },
    {
      $set: { isActive: true },
      $setOnInsert: { subscribedAt: new Date() },
      $unset: { adminSeenAt: '' },
    },
    { upsert: true },
  );
}

export async function moveJournalSubscription(oldEmailInput: string, newEmailInput: string) {
  const oldEmail = String(oldEmailInput || '')
    .trim()
    .toLowerCase();
  const newEmail = String(newEmailInput || '')
    .trim()
    .toLowerCase();
  if (!oldEmail || !newEmail || oldEmail === newEmail) return;

  const previous: any = await JournalSubscriber.findOne({ email: oldEmail })
    .select('isActive subscribedAt')
    .lean();
  if (!previous?.isActive) return;

  await Promise.all([
    JournalSubscriber.updateOne({ email: oldEmail }, { $set: { isActive: false } }),
    JournalSubscriber.updateOne(
      { email: newEmail },
      {
        $set: { isActive: true },
        $setOnInsert: { subscribedAt: previous.subscribedAt || new Date() },
        $unset: { adminSeenAt: '' },
      },
      { upsert: true },
    ),
  ]);
}

export function userAllowsNotification(
  user: any,
  key: keyof Omit<NotificationPreferences, 'journalNotifications'>,
) {
  const preferences = normalizePreferences(user?.notificationPreferences);
  // Công tắc tổng "emailNotifications" tắt thì chặn mọi loại email.
  if (!preferences.emailNotifications) return false;
  return preferences[key];
}
/* định nghĩa nhãn cho các trạng thái đơn hàng
nội dung mail gửi về khách
*/
const ORDER_STATUS_LABELS: Record<string, string> = {
  pending: 'Đang chờ xác nhận',
  paid: 'Đã thanh toán',
  shipping: 'Đang giao hàng',
  done: 'Đã hoàn tất',
  cancelled: 'Đã hủy',
  returned: 'Đã hoàn trả',
};

export async function sendOrderNotification(
  orderId: string,
  kind: 'created' | 'status' | 'refunded',
) {
  const order: any = await Order.findById(orderId)
    .populate('user', 'name email notificationPreferences')
    .lean();
  if (!order) return { sent: false, reason: 'order_not_found' as const };

  const user = order.user && typeof order.user === 'object' ? order.user : null;
  if (user && !userAllowsNotification(user, 'orderNotifications')) {
    return { sent: false, reason: 'disabled_by_customer' as const };
  }

  const email = String(user?.email || order.address?.email || '')
    .trim()
    .toLowerCase();
  if (!email) return { sent: false, reason: 'missing_email' as const };
  if (!isMailConfigured()) {
    return { sent: false, reason: 'smtp_not_configured' as const, email };
  }

  const orderCode = String(order._id).slice(-8).toUpperCase();
  const statusLabel = ORDER_STATUS_LABELS[String(order.status)] || String(order.status);
  const isRefund = kind === 'refunded';
  const title =
    kind === 'created'
      ? `Đã nhận đơn hàng #${orderCode}`
      : isRefund
        ? `Đơn hàng #${orderCode}: Đã hoàn tiền`
        : `Đơn hàng #${orderCode}: ${statusLabel}`;
  const itemLines = (order.items || [])
    .map(
      (item: any) =>
        `<li>${escapeHtml(item.name)}${item.volume ? ` · ${escapeHtml(item.volume)}` : ''} × ${Number(item.quantity || 0)}</li>`,
    )
    .join('');
  const url = absoluteUrl(`/orders/${order._id}`);

  // Khi don da bi HUY: bo sung khoi thong tin rieng (ly do, nguoi huy, hoan tien).
  const isCancelled = String(order.status) === 'cancelled';
  const cancelPayment: any = await Payment.findOne({ order: order._id })
    .select('method receivedAmount refundAmount refundReason')
    .lean();
  const paidByBank = cancelPayment?.method === 'bank_qr';
  const cancelledByLabel =
    order.cancelledBy === 'admin'
      ? 'cửa hàng'
      : order.cancelledBy === 'system'
        ? 'hệ thống do quá hạn thanh toán'
        : order.cancelledBy === 'customer'
          ? 'quý khách'
          : '';
  const cancelHtml = isCancelled
    ? `<div style="margin:12px 0;padding:16px 18px;background:#fbf3f1;border:1px solid #e7c9c2;border-radius:4px">
          <p style="margin:0 0 6px;color:#8a3b30"><strong>Đơn hàng đã được hủy${cancelledByLabel ? ` bởi ${cancelledByLabel}` : ''}.</strong></p>
          ${order.cancelReason ? `<p style="margin:0 0 6px;color:#6b4b45">Lý do: ${escapeHtml(order.cancelReason)}</p>` : ''}
          <p style="margin:0;color:#6b4b45">Toàn bộ sản phẩm đã được hoàn về kho. ${paidByBank ? 'Nếu quý khách đã thanh toán chuyển khoản, cửa hàng sẽ liên hệ hoàn tiền trong 3–5 ngày làm việc.' : 'Đơn thanh toán khi nhận hàng (COD) nên quý khách không cần làm gì thêm.'}</p>
        </div>`
    : '';
  const cancelText = isCancelled
    ? `\nĐơn hàng đã bị hủy${cancelledByLabel ? ` bởi ${cancelledByLabel}` : ''}.${order.cancelReason ? `\nLý do: ${order.cancelReason}` : ''}`
    : '';

  // Khi admin xac nhan da hoan tien: khoi thong tin hoan tien rieng.
  const refundAmount = Number(
    cancelPayment?.refundAmount || cancelPayment?.receivedAmount || order.total || 0,
  ).toLocaleString('vi-VN');
  const refundHtml = isRefund
    ? `<div style="margin:12px 0;padding:16px 18px;background:#f0f7f2;border:1px solid #c3e0cd;border-radius:4px">
          <p style="margin:0 0 6px;color:#1f6b3b"><strong>Cửa hàng đã hoàn tiền cho đơn hàng của quý khách.</strong></p>
          <p style="margin:0;color:#3d5a48">Số tiền hoàn: <strong>${refundAmount}đ</strong>. Khoản tiền sẽ về tài khoản trong 1–3 ngày làm việc tùy ngân hàng.</p>
        </div>`
    : '';
  const refundText = isRefund
    ? `\nĐã hoàn tiền: ${refundAmount}đ. Khoản tiền sẽ về tài khoản trong 1–3 ngày làm việc.`
    : '';

  const sent = await sendMail({
    to: email,
    subject: `${title} - L'Essence Noire`,
    html: `
      <div style="font-family:'Be Vietnam Pro',Manrope,'Segoe UI',Arial,sans-serif;max-width:600px;margin:auto;padding:32px;color:#27231f;line-height:1.6">
        <p style="font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#806b3d">L'Essence Noire</p>
        <h1 style="font-family:'Noto Serif','Noto Serif Display',Georgia,serif;font-size:27px;font-weight:500">${escapeHtml(title)}</h1>
        <p>Trạng thái hiện tại: <strong>${escapeHtml(isRefund ? 'Đã hoàn tiền' : statusLabel)}</strong></p>
        ${cancelHtml}
        ${refundHtml}
        ${itemLines ? `<ul style="padding-left:18px;color:#625b54">${itemLines}</ul>` : ''}
        <p><strong>Tổng thanh toán:</strong> ${Number(order.total || 0).toLocaleString('vi-VN')}đ</p>
        <p><a href="${url}" style="display:inline-block;background:#75621e;color:#fff;text-decoration:none;padding:12px 18px">Xem đơn hàng</a></p>
      </div>`,
    text: `${title}\nTrạng thái: ${isRefund ? 'Đã hoàn tiền' : statusLabel}${cancelText}${refundText}\nTổng thanh toán: ${Number(order.total || 0).toLocaleString('vi-VN')}đ\n${url}`,
  });
  return {
    sent,
    reason: sent ? undefined : ('delivery_failed' as const),
    email,
  };
}

export type PaymentReconciliationNotificationKind =
  'unpaid_reminder' | 'expiry_warning' | 'expired' | 'partial' | 'overpaid' | 'late_payment';

/** Email vong doi QR. Cac job phai claim marker tren Order truoc khi goi de khong gui trung. */
export async function sendPaymentReconciliationNotification(
  orderId: string,
  kind: PaymentReconciliationNotificationKind,
) {
  const order: any = await Order.findById(orderId)
    .populate('user', 'name email notificationPreferences')
    .lean();
  if (!order) return { sent: false, reason: 'order_not_found' as const };

  const payment: any = await Payment.findOne({ order: order._id }).lean();
  if (!payment || payment.method !== 'bank_qr') {
    return { sent: false, reason: 'payment_not_found' as const };
  }

  const user = order.user && typeof order.user === 'object' ? order.user : null;
  if (user && !userAllowsNotification(user, 'orderNotifications')) {
    return { sent: false, reason: 'disabled_by_customer' as const };
  }
  const email = String(user?.email || order.address?.email || '')
    .trim()
    .toLowerCase();
  if (!email) return { sent: false, reason: 'missing_email' as const };
  if (!isMailConfigured()) {
    return { sent: false, reason: 'smtp_not_configured' as const, email };
  }

  const code = String(order._id).slice(-8).toUpperCase();
  const expected = Number(payment.amount || order.total || 0);
  const received = Number(payment.receivedAmount || 0);
  const remaining = Math.max(0, expected - received);
  const excess = Math.max(0, received - expected);
  const deadline = order.paymentCancellationAt || order.paymentExpiresAt;
  const deadlineText = deadline
    ? new Date(deadline).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })
    : '';

  const content: Record<
    PaymentReconciliationNotificationKind,
    { subject: string; message: string }
  > = {
    unpaid_reminder: {
      subject: `Đơn #${code} chưa được thanh toán`,
      message: `Hệ thống chưa ghi nhận chuyển khoản cho đơn hàng. Vui lòng thanh toán ${expected.toLocaleString('vi-VN')}đ${deadlineText ? ` trước ${deadlineText}` : ''}.`,
    },
    expiry_warning: {
      subject: `Đơn #${code} sắp bị hủy do quá hạn`,
      message: `Đơn hàng sắp hết thời gian giữ hàng${deadlineText ? ` vào ${deadlineText}` : ''}. Nếu chưa chuyển khoản, vui lòng hoàn tất sớm.`,
    },
    expired: {
      subject: `Đơn #${code} đã bị hủy do quá hạn thanh toán`,
      message: `Đơn hàng đã bị hủy và sản phẩm đã được hoàn về tồn kho.${received > 0 ? ` Số tiền đã nhận ${received.toLocaleString('vi-VN')}đ đang chờ cửa hàng hoàn lại.` : ''}`,
    },
    partial: {
      subject: `Đơn #${code} còn thiếu ${remaining.toLocaleString('vi-VN')}đ`,
      message: `Hệ thống đã nhận ${received.toLocaleString('vi-VN')}đ trên tổng ${expected.toLocaleString('vi-VN')}đ. Đơn chưa thể giao cho đến khi nhận đủ tiền.`,
    },
    overpaid: {
      subject: `Đơn #${code} đã chuyển dư ${excess.toLocaleString('vi-VN')}đ`,
      message: `Hệ thống đã nhận ${received.toLocaleString('vi-VN')}đ. Phần chuyển dư ${excess.toLocaleString('vi-VN')}đ đã được đưa vào danh sách chờ hoàn tiền.`,
    },
    late_payment: {
      subject: `Đã nhận tiền sau khi đơn #${code} bị hủy`,
      message: `Hệ thống nhận ${received.toLocaleString('vi-VN')}đ sau khi đơn đã bị hủy. Cửa hàng sẽ đối soát và hoàn lại số tiền thực nhận.`,
    },
  };
  const selected = content[kind];
  const url = absoluteUrl(`/orders/${order._id}`);
  const sent = await sendMail({
    to: email,
    subject: `${selected.subject} - L'Essence Noire`,
    html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:32px;color:#27231f;line-height:1.6"><p style="font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#806b3d">L'Essence Noire</p><h1 style="font-family:Georgia,serif;font-size:26px;font-weight:500">${escapeHtml(selected.subject)}</h1><p>${escapeHtml(selected.message)}</p><p><a href="${url}" style="display:inline-block;background:#75621e;color:#fff;text-decoration:none;padding:12px 18px">Xem đơn hàng</a></p></div>`,
    text: `${selected.subject}\n${selected.message}\n${url}`,
  });
  return { sent, reason: sent ? undefined : ('delivery_failed' as const), email };
}

export type PromotionNotification = {
  name: string;
  detail: string;
  url?: string;
};

export async function sendPromotionNotification(input: PromotionNotification) {
  const users: any[] = await User.find({
    role: 'customer',
    // Cong tac tong phai bat (mac dinh bat neu chua co truong nay) VA bat khuyen mai.
    'notificationPreferences.emailNotifications': { $ne: false },
    'notificationPreferences.promotionNotifications': true,
  })
    .select('email')
    .lean();
  if (!users.length) {
    return { recipientCount: 0, sentCount: 0, reason: 'no_recipients' as const };
  }
  if (!isMailConfigured()) {
    return {
      recipientCount: users.length,
      sentCount: 0,
      reason: 'smtp_not_configured' as const,
    };
  }

  const url = absoluteUrl(input.url || '/shop');
  const subject = `${input.name} - Ưu đãi mới từ L'Essence Noire`;
  const results = await Promise.allSettled(
    users.map((user) =>
      sendMail({
        to: user.email,
        subject,
        html: `
          <div style="font-family:'Be Vietnam Pro',Manrope,'Segoe UI',Arial,sans-serif;max-width:600px;margin:auto;padding:32px;color:#27231f;line-height:1.6">
            <p style="font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#806b3d">L'Essence Noire</p>
            <h1 style="font-family:'Noto Serif','Noto Serif Display',Georgia,serif;font-size:27px;font-weight:500">${escapeHtml(input.name)}</h1>
            <p>${escapeHtml(input.detail)}</p>
            <p><a href="${url}" style="display:inline-block;background:#75621e;color:#fff;text-decoration:none;padding:12px 18px">Khám phá ưu đãi</a></p>
          </div>`,
        text: `${input.name}\n${input.detail}\n${url}`,
      }),
    ),
  );
  const sentCount = results.filter(
    (result) => result.status === 'fulfilled' && result.value,
  ).length;
  logger.info(`[promotion] Đã gửi ${sentCount}/${users.length} email cho "${input.name}"`);
  return {
    recipientCount: users.length,
    sentCount,
    reason: sentCount > 0 ? undefined : ('delivery_failed' as const),
  };
}
