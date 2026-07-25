import { logger } from './logger';

export interface MailInput {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export function isMailConfigured() {
  return Boolean(process.env.SMTP_USER?.trim() && process.env.SMTP_PASS?.trim());
}

export function assertMailConfigured() {
  if (!isMailConfigured()) {
    throw Object.assign(new Error('Dịch vụ email chưa được cấu hình'), { status: 503 });
  }
}

function escapeDisplayName(value: string) {
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

function normalizeMailFrom(mailFrom: string | undefined, smtpUser: string) {
  const fallbackName = "L'Essence Noire";
  const raw = String(mailFrom || '').trim();
  if (!raw) return `"${escapeDisplayName(fallbackName)}" <${smtpUser}>`;
  if (raw.includes('<') && raw.includes('>')) return raw;
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(raw)) {
    return `"${escapeDisplayName(fallbackName)}" <${raw}>`;
  }

  const email = raw.match(/[^\s<>"']+@[^\s<>"']+\.[^\s<>"']+/)?.[0];
  if (email) {
    const displayName = raw
      .replace(email, '')
      .replace(/[<>]/g, '')
      .trim()
      .replace(/^['"]|['"]$/g, '');
    return `"${escapeDisplayName(displayName || fallbackName)}" <${email}>`;
  }

  return `"${escapeDisplayName(raw)}" <${smtpUser}>`;
}

/**
 * Gửi email qua SMTP nếu đã cấu hình (SMTP_HOST/SMTP_USER/SMTP_PASS).
 * - Nếu chưa cấu hình: không ném lỗi, chỉ log ra để luồng nghiệp vụ không bị chặn.
 * - Dùng dynamic import với biến specifier để tsc không bắt buộc phải cài nodemailer lúc build.
 */
export async function sendMail(input: MailInput): Promise<boolean> {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, MAIL_FROM } = process.env;

  if (!isMailConfigured() || !SMTP_USER || !SMTP_PASS) {
    logger.warn(
      `SMTP chưa cấu hình - bỏ qua gửi email tới ${input.to} (subject: ${input.subject})`,
    );
    return false;
  }

  try {
    const moduleName = 'nodemailer';
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const imported: any = await import(moduleName);
    // Hỗ trợ cả CommonJS (module.exports) lẫn ESM (export default) của nodemailer,
    // vì tùy trình chạy (tsx/tsc) mà dynamic import trả về namespace khác nhau.
    const nodemailer: any = imported?.createTransport ? imported : imported?.default;

    if (!nodemailer?.createTransport) {
      logger.error(
        'Không nạp được nodemailer.createTransport - kiểm tra đã cài đặt nodemailer (phiên bản hợp lệ, ví dụ ^6.9.14) hay chưa',
      );
      return false;
    }

    const transport = nodemailer.createTransport({
      host: SMTP_HOST || 'smtp.gmail.com',
      port: Number(SMTP_PORT || 587),
      secure: Number(SMTP_PORT) === 465,
      auth: { user: SMTP_USER, pass: SMTP_PASS },
    });

    const info = await transport.sendMail({
      from: normalizeMailFrom(MAIL_FROM, SMTP_USER),
      sender: SMTP_USER,
      replyTo: SMTP_USER,
      envelope: { from: SMTP_USER, to: input.to },
      to: input.to,
      subject: input.subject,
      html: input.html,
      text: input.text,
    });

    const accepted = Array.isArray(info.accepted) ? info.accepted.length : 0;
    const rejected = Array.isArray(info.rejected) ? info.rejected.length : 0;
    if (rejected > 0 && accepted === 0) {
      logger.warn(`SMTP từ chối email tới ${input.to} (subject: ${input.subject})`);
      return false;
    }
    logger.info(`Đã gửi email tới ${input.to} (messageId: ${info.messageId || 'không rõ'})`);
    return accepted > 0 || rejected === 0;
  } catch (error) {
    logger.error('Gửi email thất bại', error);
    return false;
  }
}
