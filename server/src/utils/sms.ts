import crypto from 'crypto';
import { logger } from './logger';

const ESMS_ENDPOINT = 'https://rest.esms.vn/MainService.svc/json/SendMultipleMessage_V4_post_json/';

function isDevSmsMode() {
  return process.env.NODE_ENV !== 'production' && process.env.SMS_DEV_MODE === 'true';
}

export function assertSmsConfigured() {
  if (isDevSmsMode()) return;
  if (!process.env.ESMS_API_KEY || !process.env.ESMS_SECRET_KEY || !process.env.ESMS_BRAND_NAME) {
    throw Object.assign(new Error('Dịch vụ SMS chưa được cấu hình'), { status: 503 });
  }
}

export async function sendPasswordResetOtp(phone: string, otp: string) {
  assertSmsConfigured();

  if (isDevSmsMode()) {
    logger.info(`[SMS DEV] Mã đặt lại mật khẩu cho ${phone}: ${otp}`);
    return;
  }

  const template =
    process.env.ESMS_OTP_TEMPLATE ||
    '{OTP} là mã đặt lại mật khẩu L Essence Noire. Mã có hiệu lực 5 phút.';
  if (!template.includes('{OTP}')) {
    throw Object.assign(new Error('ESMS_OTP_TEMPLATE phải chứa {OTP}'), { status: 503 });
  }

  const response = await fetch(ESMS_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ApiKey: process.env.ESMS_API_KEY,
      SecretKey: process.env.ESMS_SECRET_KEY,
      Brandname: process.env.ESMS_BRAND_NAME,
      Phone: phone,
      Content: template.replace('{OTP}', otp),
      SmsType: process.env.ESMS_SMS_TYPE || '2',
      IsUnicode: process.env.ESMS_IS_UNICODE || '0',
      Sandbox: process.env.ESMS_SANDBOX || '0',
      RequestId: crypto.randomUUID(),
    }),
    signal: AbortSignal.timeout(10_000),
  });

  if (!response.ok) {
    throw Object.assign(new Error('Không thể kết nối dịch vụ SMS'), { status: 502 });
  }

  const result = (await response.json()) as { CodeResult?: string; ErrorMessage?: string };
  if (String(result.CodeResult) !== '100') {
    logger.error(
      `Lỗi eSMS ${result.CodeResult || 'không rõ'}: ${result.ErrorMessage || 'Lỗi không xác định'}`,
    );
    throw Object.assign(new Error('Không thể gửi mã xác minh lúc này'), { status: 502 });
  }
}
