import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { JsonWebTokenError, TokenExpiredError } from 'jsonwebtoken';
import { User } from '../models/user.model';
import { Order } from '../models/order.model';
import { Voucher } from '../models/voucher.model';
import { signAccess, signRefresh, verifyRefresh } from '../utils/jwt';
import { assertMailConfigured, sendMail } from '../utils/mailer';
import { AddressInput } from '../types/dto';
import { assertValidContact, normalizeEmail, normalizePhone } from '../utils/contactValidation';
import { assertSmsConfigured, sendPasswordResetOtp } from '../utils/sms';
import {
  moveJournalSubscription,
  subscribeNewAccountToJournal,
  userAllowsNotification,
} from './notification.service';

const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

function hashToken(token: string) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function escapeHtml(value: unknown) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function voucherIsAvailable(voucher: any, now = new Date()) {
  const start = voucher?.startDate ? new Date(voucher.startDate) : null;
  const endValue = voucher?.endDate || voucher?.expiresAt;
  const end = endValue ? new Date(endValue) : null;
  return (
    voucher?.isActive !== false &&
    (!start || start <= now) &&
    (!end || end > now) &&
    !(
      Number(voucher?.usageLimit || 0) > 0 &&
      Number(voucher?.usedCount || 0) >= Number(voucher.usageLimit)
    )
  );
}

function voucherBenefit(voucher: any) {
  if (voucher.type === 'free_shipping') return 'miễn phí vận chuyển';
  if (voucher.type === 'fixed')
    return `giảm ${Number(voucher.value || 0).toLocaleString('vi-VN')}đ`;
  const percent = Number(voucher.value || 0);
  const cap = Number(voucher.maxDiscount || 0);
  return `giảm ${percent}%${cap > 0 ? `, tối đa ${cap.toLocaleString('vi-VN')}đ` : ''}`;
}

async function sendNewMemberVoucherEmail(user: any, voucher: any) {
  if (!userAllowsNotification(user, 'emailNotifications')) return false;
  const code = String(voucher.code);
  const htmlCode = escapeHtml(code);
  const benefit = voucherBenefit(voucher);
  await sendMail({
    to: String(user.email),
    subject: `${code} - Voucher chào mừng thành viên mới`,
    html: `
      <div style="font-family:'Be Vietnam Pro',Manrope,'Segoe UI',Arial,sans-serif;max-width:560px;margin:auto;padding:32px;color:#27231f">
        <p style="font-size:12px;letter-spacing:2px;text-transform:uppercase;color:#806b3d">L'Essence Noire</p>
        <h1 style="font-size:28px;font-weight:500">Cảm ơn bạn đã cập nhật hồ sơ</h1>
        <p>Bạn vừa nhận voucher dành cho thành viên mới chưa có đơn hàng.</p>
        <p style="display:inline-block;padding:14px 22px;border:1px solid #806b3d;font-size:22px;letter-spacing:3px;font-weight:700;color:#806b3d">${htmlCode}</p>
        <p>Ưu đãi ${benefit}. Hãy nhập mã tại bước thanh toán.</p>
      </div>`,
    text: `Cam on ban da cap nhat ho so. Voucher chao mung cua ban la ${code} (${benefit}).`,
  });
}

export async function issueNewMemberVoucher(userId: string) {
  const user: any = await User.findById(userId);
  if (!user || user.role !== 'customer') return { user, voucherIssued: false };
  if (await Order.exists({ user: user._id })) return { user, voucherIssued: false };

  const now = new Date();
  const assignedCode = String(user.profileCompletionVoucherCode || '')
    .trim()
    .toUpperCase();
  if (assignedCode) {
    const assignedVoucher: any = await Voucher.findOne({
      code: assignedCode,
      appliesToNewMembers: true,
    }).lean();
    if (assignedVoucher && voucherIsAvailable(assignedVoucher, now)) {
      return { user, voucherIssued: false };
    }
  }

  const candidates: any[] = await Voucher.find({
    appliesToNewMembers: true,
    isActive: true,
  })
    .sort({ updatedAt: -1 })
    .lean();
  const voucher = candidates.find((item) => voucherIsAvailable(item, now));
  if (!voucher) return { user, voucherIssued: false };

  const claimFilter: any = { _id: user._id, role: 'customer' };
  if (assignedCode) {
    claimFilter.profileCompletionVoucherCode = assignedCode;
  } else {
    claimFilter.$or = [
      { profileCompletionVoucherCode: { $exists: false } },
      { profileCompletionVoucherCode: null },
      { profileCompletionVoucherCode: '' },
    ];
  }
  const updated: any = await User.findOneAndUpdate(
    claimFilter,
    {
      $set: {
        profileCompletedAt: now,
        profileCompletionVoucherCode: voucher.code,
        welcomeVoucherIssuedAt: now,
      },
    },
    { new: true },
  );
  if (!updated) return { user: await User.findById(userId), voucherIssued: false };

  void sendNewMemberVoucherEmail(updated, voucher).catch(() => null);
  return { user: updated, voucherIssued: true };
}

export async function claimGuestOrdersForUser(user: any, email: string, phone: string) {
  const normalizedEmail = normalizeEmail(email);
  const normalizedPhone = normalizePhone(phone);
  if (!normalizedEmail || !normalizedPhone) return 0;

  const guestOrderFilter = {
    $or: [{ user: { $exists: false } }, { user: null }],
    'address.phone': normalizedPhone,
    $and: [
      {
        $or: [
          { 'address.email': normalizedEmail },
          {
            'address.email': { $exists: false },
            note: { $regex: `Email:\\s*${escapeRegExp(normalizedEmail)}`, $options: 'i' },
          },
          {
            'address.email': '',
            note: { $regex: `Email:\\s*${escapeRegExp(normalizedEmail)}`, $options: 'i' },
          },
        ],
      },
    ],
  };

  const guestOrders = await Order.find(guestOrderFilter).select('_id pointsEarned status').lean();
  if (!guestOrders.length) return 0;

  await Order.updateMany(
    { _id: { $in: guestOrders.map((order) => order._id) } },
    { $set: { user: user._id } },
  );

  const claimedPoints = guestOrders.reduce(
    (sum: number, order: any) =>
      sum + (order.status !== 'cancelled' ? Number(order.pointsEarned) || 0 : 0),
    0,
  );
  if (claimedPoints) {
    await User.updateOne({ _id: user._id }, { $inc: { loyaltyPoints: claimedPoints } });
  }

  return guestOrders.length;
}

async function sendWelcomeEmail(user: any) {
  const firstName =
    String(user.name || 'bạn')
      .trim()
      .split(/\s+/)
      .slice(-1)[0] || 'bạn';
  const htmlFirstName = escapeHtml(firstName);
  return sendMail({
    to: String(user.email),
    subject: `Chào mừng ${user.name} đến với L'Essence Noire`,
    html: `
      <div style="font-family:'Be Vietnam Pro',Manrope,'Segoe UI',Arial,sans-serif;max-width:560px;margin:auto;padding:32px;color:#27231f;line-height:1.6">
        <p style="font-size:12px;letter-spacing:2px;text-transform:uppercase;color:#806b3d">L'Essence Noire</p>
        <h1 style="font-size:26px;font-weight:500;margin:8px 0 16px">Chào mừng bạn đã tham gia!</h1>
        <p>Xin chào ${htmlFirstName},</p>
        <p>Cảm ơn bạn đã trở thành thành viên của <strong>L'Essence Noire</strong>.</p>
        <p>Hãy cập nhật hồ sơ của bạn. Nếu tài khoản chưa có đơn hàng và đang có voucher dành cho thành viên mới, mã ưu đãi sẽ được gửi ngay sau khi cập nhật.</p>
      </div>`,
    text: `Chao mung ${user.name} den voi L'Essence Noire. Hay cap nhat ho so de nhan uu dai thanh vien moi neu tai khoan chua co don hang.`,
  });
}

export async function register(name: string, email: string, password: string, phone: string) {
  const normalizedEmail = normalizeEmail(email);
  const normalizedPhone = normalizePhone(phone);
  assertValidContact(normalizedEmail, normalizedPhone);

  const exists = await User.findOne({ email: normalizedEmail });
  if (exists) throw Object.assign(new Error('Email đã tồn tại'), { status: 409 });
  const phoneExists = await User.findOne({ phone: normalizedPhone });
  if (phoneExists) throw Object.assign(new Error('Số điện thoại đã được sử dụng'), { status: 409 });

  const hash = await bcrypt.hash(password, 10);
  const user = await User.create({
    name,
    email: normalizedEmail,
    phone: normalizedPhone,
    password: hash,
    notificationPreferences: {
      orderNotifications: true,
      emailNotifications: true,
      promotionNotifications: true,
      journalNotifications: true,
    },
  });
  await subscribeNewAccountToJournal(normalizedEmail);
  await claimGuestOrdersForUser(user, normalizedEmail, normalizedPhone);
  // Email chào mừng và email xác thực đều không chặn luồng đăng ký.
  void sendWelcomeEmail(user).catch(() => null);
  // Gửi email xác thực, không chặn luồng đăng ký nếu SMTP chưa cấu hình.
  void sendEmailVerification(String(user._id)).catch(() => null);
  return issueTokens(user);
}

export async function login(email: string, password: string) {
  const user = await User.findOne({ email }).select('+password');
  if (!user) throw Object.assign(new Error('Sai thông tin đăng nhập'), { status: 401 });
  const ok = await bcrypt.compare(password, user.password as string);
  if (!ok) throw Object.assign(new Error('Sai thông tin đăng nhập'), { status: 401 });
  if (user.phone) await claimGuestOrdersForUser(user, user.email as string, user.phone as string);
  await User.updateOne({ _id: user._id }, { lastLoginAt: new Date() });
  return issueTokens(user);
}

export async function refreshAccessToken(refreshToken: string) {
  let payload: { id: string };
  try {
    payload = verifyRefresh(refreshToken) as { id: string };
  } catch (e) {
    const err = e as JsonWebTokenError | TokenExpiredError;
    throw Object.assign(new Error(err.message || 'Refresh token không hợp lệ'), { status: 401 });
  }
  const user = await User.findById(payload.id).select('+refreshToken');
  if (!user?.refreshToken)
    throw Object.assign(new Error('Refresh token không hợp lệ'), { status: 401 });
  const match = await bcrypt.compare(refreshToken, user.refreshToken as string);
  if (!match) throw Object.assign(new Error('Refresh token không hợp lệ'), { status: 401 });
  return {
    accessToken: signAccess({ id: user._id, role: user.role }),
    user: serializeUser(user),
  };
}

export async function logout(userId: string) {
  await User.findByIdAndUpdate(userId, { $unset: { refreshToken: '' } });
}

export async function getMe(userId: string) {
  const user = await User.findById(userId);
  if (!user) throw Object.assign(new Error('Không tìm thấy người dùng'), { status: 404 });
  return user;
}

export async function updateProfile(
  userId: string,
  input: { name: string; email: string; phone?: string },
) {
  const currentUser: any = await User.findById(userId)
    .select('email notificationPreferences')
    .lean();
  if (!currentUser) throw Object.assign(new Error('Không tìm thấy người dùng'), { status: 404 });
  const email = input.email.trim().toLowerCase();
  const exists = await User.findOne({ email, _id: { $ne: userId } });
  if (exists) throw Object.assign(new Error('Email đã tồn tại'), { status: 409 });
  const phone = normalizePhone(input.phone || '');
  if (phone) {
    assertValidContact(email, phone);
    const phoneExists = await User.findOne({ phone, _id: { $ne: userId } });
    if (phoneExists)
      throw Object.assign(new Error('Số điện thoại đã được sử dụng'), { status: 409 });
  }

  const user = await User.findByIdAndUpdate(
    userId,
    { name: input.name.trim(), email, ...(phone ? { phone } : {}) },
    { new: true, runValidators: true },
  );
  if (!user) throw Object.assign(new Error('Không tìm thấy người dùng'), { status: 404 });
  await moveJournalSubscription(String(currentUser.email), email);
  if (phone) await claimGuestOrdersForUser(user, email, phone);
  const issuance = await issueNewMemberVoucher(String(user._id));
  return {
    ...issuance.user.toJSON(),
    profileJustCompleted: issuance.voucherIssued,
    newMemberVoucherIssued: issuance.voucherIssued,
  };
}

export async function changePassword(
  userId: string,
  input: { currentPassword: string; newPassword: string },
) {
  const user = await User.findById(userId).select('+password');
  if (!user) throw Object.assign(new Error('Không tìm thấy người dùng'), { status: 404 });

  const ok = await bcrypt.compare(input.currentPassword, user.password as string);
  if (!ok) throw Object.assign(new Error('Mật khẩu hiện tại không đúng'), { status: 400 });

  user.password = await bcrypt.hash(input.newPassword, 10);
  await user.save();
  return { message: 'Đã cập nhật mật khẩu' };
}

// ---- Địa chỉ: một shape thống nhất (fullName, phone, line, ward, district, province) ----
// Tương thích ngược: nếu client cũ gửi { detail } thì map sang line.
function normalizeAddress(input: AddressInput) {
  const line = (input.line ?? input.detail ?? '').trim();
  return {
    label: (input.label || 'Nhà').trim(),
    fullName: (input.fullName || '').trim(),
    phone: (input.phone || '').trim(),
    line,
    ward: (input.ward || '').trim(),
    district: (input.district || '').trim(),
    province: (input.province || '').trim(),
    isDefault: !!input.isDefault,
  };
}

export async function addAddress(userId: string, input: AddressInput) {
  const user: any = await User.findById(userId);
  if (!user) throw Object.assign(new Error('Không tìm thấy người dùng'), { status: 404 });

  const addr = normalizeAddress(input);
  if (addr.isDefault || user.addresses.length === 0) {
    user.addresses.forEach((a: any) => (a.isDefault = false));
    addr.isDefault = true;
  }
  user.addresses.push(addr);
  await user.save();
  await issueNewMemberVoucher(userId);
  return user.addresses;
}

export async function updateAddress(userId: string, addressId: string, input: AddressInput) {
  const user: any = await User.findById(userId);
  if (!user) throw Object.assign(new Error('Không tìm thấy người dùng'), { status: 404 });

  const address = user.addresses.id(addressId);
  if (!address) throw Object.assign(new Error('Không tìm thấy địa chỉ'), { status: 404 });

  const addr = normalizeAddress(input);
  if (addr.isDefault) {
    user.addresses.forEach((a: any) => (a.isDefault = false));
  }
  address.set(addr);
  await user.save();
  await issueNewMemberVoucher(userId);
  return user.addresses;
}

export async function deleteAddress(userId: string, addressId: string) {
  const user: any = await User.findById(userId);
  if (!user) throw Object.assign(new Error('Không tìm thấy người dùng'), { status: 404 });

  const address = user.addresses.id(addressId);
  if (!address) throw Object.assign(new Error('Không tìm thấy địa chỉ'), { status: 404 });

  address.deleteOne();
  await user.save();
  return user.addresses;
}

export async function setDefaultAddress(userId: string, addressId: string) {
  const user: any = await User.findById(userId);
  if (!user) throw Object.assign(new Error('Không tìm thấy người dùng'), { status: 404 });

  let found = false;
  user.addresses.forEach((a: any) => {
    const isTarget = String(a._id) === addressId;
    a.isDefault = isTarget;
    if (isTarget) found = true;
  });
  if (!found) throw Object.assign(new Error('Không tìm thấy địa chỉ'), { status: 404 });
  await user.save();
  await issueNewMemberVoucher(userId);
  return user.addresses;
}

const EMAIL_RESET_OTP_TTL_MS = 5 * 60 * 1000;
const EMAIL_RESET_TOKEN_TTL_MS = 10 * 60 * 1000;
const EMAIL_RESET_MAX_ATTEMPTS = 5;
const EMAIL_RESET_RESEND_MS = 60 * 1000;

function hashEmailOtp(email: string, otp: string) {
  const secret = process.env.JWT_ACCESS_SECRET || 'development-only-secret';
  return hashToken(`${email}:${otp}:${secret}`);
}

// ---- Quên / đặt lại mật khẩu qua email OTP ----
export async function requestPasswordReset(email: string) {
  assertMailConfigured();
  const normalizedEmail = normalizeEmail(email);
  const genericResult = {
    message: 'Nếu email tồn tại, mã xác minh sẽ được gửi trong ít phút.',
    expiresIn: Math.floor(EMAIL_RESET_OTP_TTL_MS / 1000),
  };
  const user = await User.findOne({ email: normalizedEmail }).select(
    '+passwordResetOtpHash +passwordResetOtpExpires +passwordResetOtpAttempts +passwordResetOtpLastSentAt',
  );
  if (!user) return genericResult;

  const lastSentAt = user.passwordResetOtpLastSentAt?.getTime() || 0;
  if (Date.now() - lastSentAt < EMAIL_RESET_RESEND_MS) return genericResult;

  const otp = crypto.randomInt(100000, 1000000).toString();
  const sent = await sendMail({
    to: normalizedEmail,
    subject: `${otp} - Mã xác minh đặt lại mật khẩu`,
    html: `
      <div style="font-family:'Be Vietnam Pro',Manrope,'Segoe UI',Arial,sans-serif;max-width:560px;margin:auto;padding:32px;color:#27231f">
        <p style="font-size:12px;letter-spacing:2px;text-transform:uppercase;color:#806b3d">L'Essence Noire</p>
        <h1 style="font-size:28px;font-weight:500">Khôi phục mật khẩu</h1>
        <p>Mã xác minh của bạn là:</p>
        <p style="font-size:34px;letter-spacing:8px;font-weight:700;color:#806b3d">${otp}</p>
        <p>Mã có hiệu lực trong 5 phút. Không chia sẻ mã này với bất kỳ ai.</p>
        <p style="color:#777;font-size:12px">Nếu bạn không yêu cầu đặt lại mật khẩu, hãy bỏ qua email này.</p>
      </div>`,
    text: `Mã xác minh đặt lại mật khẩu của bạn là ${otp}. Mã có hiệu lực trong 5 phút.`,
  });
  if (!sent)
    throw Object.assign(new Error('Không thể gửi email xác minh lúc này'), { status: 502 });

  user.set({
    passwordResetOtpHash: hashEmailOtp(normalizedEmail, otp),
    passwordResetOtpExpires: new Date(Date.now() + EMAIL_RESET_OTP_TTL_MS),
    passwordResetOtpAttempts: 0,
    passwordResetOtpLastSentAt: new Date(),
  });
  await user.save();
  return genericResult;
}

export async function verifyEmailPasswordResetOtp(email: string, otp: string) {
  const normalizedEmail = normalizeEmail(email);
  const user = await User.findOne({ email: normalizedEmail }).select(
    '+passwordResetOtpHash +passwordResetOtpExpires +passwordResetOtpAttempts',
  );
  const invalidOtp = () =>
    Object.assign(new Error('Mã xác minh không đúng hoặc đã hết hạn'), { status: 400 });

  if (!user?.passwordResetOtpHash || !user.passwordResetOtpExpires) throw invalidOtp();
  if (user.passwordResetOtpExpires.getTime() <= Date.now()) {
    user.set({
      passwordResetOtpHash: undefined,
      passwordResetOtpExpires: undefined,
      passwordResetOtpAttempts: undefined,
    });
    await user.save();
    throw invalidOtp();
  }

  const attempts = Number(user.passwordResetOtpAttempts || 0);
  if (attempts >= EMAIL_RESET_MAX_ATTEMPTS) {
    user.set({
      passwordResetOtpHash: undefined,
      passwordResetOtpExpires: undefined,
      passwordResetOtpAttempts: undefined,
    });
    await user.save();
    throw invalidOtp();
  }

  const expected = Buffer.from(user.passwordResetOtpHash, 'hex');
  const received = Buffer.from(hashEmailOtp(normalizedEmail, otp), 'hex');
  const matches = expected.length === received.length && crypto.timingSafeEqual(expected, received);
  if (!matches) {
    user.passwordResetOtpAttempts = attempts + 1;
    await user.save();
    throw invalidOtp();
  }

  const resetToken = crypto.randomBytes(32).toString('hex');
  user.set({
    passwordResetToken: hashToken(resetToken),
    passwordResetExpires: new Date(Date.now() + EMAIL_RESET_TOKEN_TTL_MS),
    passwordResetOtpHash: undefined,
    passwordResetOtpExpires: undefined,
    passwordResetOtpAttempts: undefined,
    passwordResetOtpLastSentAt: undefined,
  });
  await user.save();
  return { resetToken, expiresIn: Math.floor(EMAIL_RESET_TOKEN_TTL_MS / 1000) };
}

const PHONE_RESET_OTP_TTL_MS = 5 * 60 * 1000;
const PHONE_RESET_TOKEN_TTL_MS = 10 * 60 * 1000;
const PHONE_RESET_MAX_ATTEMPTS = 5;
const PHONE_RESET_RESEND_MS = 60 * 1000;

function hashPhoneOtp(phone: string, otp: string) {
  const secret = process.env.JWT_ACCESS_SECRET || 'development-only-secret';
  return hashToken(`${phone}:${otp}:${secret}`);
}

export async function requestPhonePasswordReset(inputPhone: string) {
  assertSmsConfigured();
  const phone = normalizePhone(inputPhone);
  const genericResult = {
    message: 'Nếu số điện thoại tồn tại, mã xác minh sẽ được gửi trong ít phút.',
    expiresIn: Math.floor(PHONE_RESET_OTP_TTL_MS / 1000),
  };

  const user = await User.findOne({ phone }).select(
    '+passwordResetOtpHash +passwordResetOtpExpires +passwordResetOtpAttempts +passwordResetOtpLastSentAt',
  );
  if (!user) return genericResult;

  const lastSentAt = user.passwordResetOtpLastSentAt?.getTime() || 0;
  if (Date.now() - lastSentAt < PHONE_RESET_RESEND_MS) return genericResult;

  const otp = crypto.randomInt(100000, 1000000).toString();
  await sendPasswordResetOtp(phone, otp);
  user.set({
    passwordResetOtpHash: hashPhoneOtp(phone, otp),
    passwordResetOtpExpires: new Date(Date.now() + PHONE_RESET_OTP_TTL_MS),
    passwordResetOtpAttempts: 0,
    passwordResetOtpLastSentAt: new Date(),
  });
  await user.save();
  return genericResult;
}

export async function verifyPhonePasswordResetOtp(inputPhone: string, otp: string) {
  const phone = normalizePhone(inputPhone);
  const user = await User.findOne({ phone }).select(
    '+passwordResetOtpHash +passwordResetOtpExpires +passwordResetOtpAttempts',
  );
  const invalidOtp = () =>
    Object.assign(new Error('Mã xác minh không đúng hoặc đã hết hạn'), { status: 400 });

  if (!user?.passwordResetOtpHash || !user.passwordResetOtpExpires) throw invalidOtp();
  if (user.passwordResetOtpExpires.getTime() <= Date.now()) {
    user.set({
      passwordResetOtpHash: undefined,
      passwordResetOtpExpires: undefined,
      passwordResetOtpAttempts: undefined,
    });
    await user.save();
    throw invalidOtp();
  }

  const attempts = Number(user.passwordResetOtpAttempts || 0);
  if (attempts >= PHONE_RESET_MAX_ATTEMPTS) {
    user.set({
      passwordResetOtpHash: undefined,
      passwordResetOtpExpires: undefined,
      passwordResetOtpAttempts: undefined,
    });
    await user.save();
    throw invalidOtp();
  }

  const expected = Buffer.from(user.passwordResetOtpHash, 'hex');
  const received = Buffer.from(hashPhoneOtp(phone, otp), 'hex');
  const matches = expected.length === received.length && crypto.timingSafeEqual(expected, received);
  if (!matches) {
    user.passwordResetOtpAttempts = attempts + 1;
    await user.save();
    throw invalidOtp();
  }

  const resetToken = crypto.randomBytes(32).toString('hex');
  user.set({
    passwordResetToken: hashToken(resetToken),
    passwordResetExpires: new Date(Date.now() + PHONE_RESET_TOKEN_TTL_MS),
    passwordResetOtpHash: undefined,
    passwordResetOtpExpires: undefined,
    passwordResetOtpAttempts: undefined,
    passwordResetOtpLastSentAt: undefined,
  });
  await user.save();
  return { resetToken, expiresIn: Math.floor(PHONE_RESET_TOKEN_TTL_MS / 1000) };
}

export async function resetPassword(token: string, newPassword: string) {
  const user = await User.findOne({
    passwordResetToken: hashToken(token),
    passwordResetExpires: { $gt: new Date() },
  }).select('+password');
  if (!user) throw Object.assign(new Error('Token không hợp lệ hoặc đã hết hạn'), { status: 400 });

  user.password = await bcrypt.hash(newPassword, 10);
  user.set({
    passwordResetToken: undefined,
    passwordResetExpires: undefined,
    passwordResetOtpHash: undefined,
    passwordResetOtpExpires: undefined,
    passwordResetOtpAttempts: undefined,
    passwordResetOtpLastSentAt: undefined,
    refreshToken: undefined,
  });
  await user.save();
  return { message: 'Đặt lại mật khẩu thành công' };
}

// ---- Xác thực email ----
export async function sendEmailVerification(userId: string) {
  const user = await User.findById(userId);
  if (!user) throw Object.assign(new Error('Không tìm thấy người dùng'), { status: 404 });
  if (user.isEmailVerified) return { message: 'Email đã được xác thực' };

  const raw = crypto.randomBytes(32).toString('hex');
  user.set({
    emailVerifyToken: hashToken(raw),
    emailVerifyExpires: new Date(Date.now() + 24 * 60 * 60 * 1000),
  });
  await user.save();
  const link = `${CLIENT_URL}/verify-email?token=${raw}`;
  await sendMail({
    to: user.email as string,
    subject: 'Xác thực email - L Essence Noire',
    html: `<p>Nhấn vào liên kết sau để xác thực email (hết hạn sau 24 giờ):</p><p><a href="${link}">${link}</a></p>`,
    text: `Xác thực email: ${link}`,
  });
  return { message: 'Đã gửi email xác thực' };
}

export async function verifyEmail(token: string) {
  const user = await User.findOne({
    emailVerifyToken: hashToken(token),
    emailVerifyExpires: { $gt: new Date() },
  });
  if (!user) throw Object.assign(new Error('Token không hợp lệ hoặc đã hết hạn'), { status: 400 });

  user.set({ isEmailVerified: true, emailVerifyToken: undefined, emailVerifyExpires: undefined });
  await user.save();
  return { message: 'Xác thực email thành công' };
}

async function issueTokens(user: any) {
  const payload = { id: user._id, role: user.role };
  const refreshToken = signRefresh(payload);
  const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);
  await User.findByIdAndUpdate(user._id, { refreshToken: hashedRefreshToken });
  return {
    accessToken: signAccess(payload),
    refreshToken,
    user: serializeUser(user),
  };
}

function serializeUser(user: any) {
  return {
    id: String(user._id),
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    createdAt: user.createdAt,
    isEmailVerified: user.isEmailVerified,
    addresses: user.addresses || [],
    profileCompletedAt: user.profileCompletedAt,
    profileCompletionVoucherCode: user.profileCompletionVoucherCode,
    notificationPreferences: user.notificationPreferences,
  };
}
