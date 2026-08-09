import crypto from 'crypto';
import { NextFunction, Request, Response } from 'express';
import { env } from '../config/env';
import { processSePayWebhook } from '../services/payment-webhook.service';
/*xác minh tính xác thực của webhook  */

function constantTimeEqual(left: string, right: string) {
  /* so sánh thời gian hằng số */
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return (
    leftBuffer.length === rightBuffer.length && crypto.timingSafeEqual(leftBuffer, rightBuffer)
    /* so sánh thời gian hằng số ,Nếu độ dài khác nhau thì chắc chắn hai chữ ký không giống nhau.*/
  );
}
/*xác minh chữ ký webhook */
export function verifySePaySignature(req: Request, res: Response, next: NextFunction) {
  if (!env.sepay.webhookSecret) {
    /*xác nhận có secret ,Dùng để webhookSecret tự tính HMAC-SHA256, nếu k có thì 503 */
    return res.status(503).json({ success: false, message: 'SePay webhook is not configured' });
  }

  const signature = req.get('X-SePay-Signature') || ''; /* lấy chữ ký từ header */
  const timestamp = req.get('X-SePay-Timestamp') || ''; /* lấy timestamp từ header */
  const timestampNumber = Number(timestamp); /* chuyển đổi timestamp thành số */
  const rawBody = (req as any).rawBody as Buffer | undefined; /* lấy nội dung body của request */

  if (
    /* kiểm tra các điều kiện cần thiết */
    !rawBody ||
    !Number.isFinite(timestampNumber) ||
    Math.abs(Date.now() / 1000 - timestampNumber) > 300
  ) {
    return res.status(401).json({ success: false, message: 'Webhook request expired' });
    /* kiểm tra xem request có còn hiệu lực không */
  }

  const digest = crypto
    .createHmac('sha256', env.sepay.webhookSecret)
    .update(`${timestamp}.${rawBody.toString('utf8')}`)
    .digest('hex');
  const expected = `sha256=${digest}`;

  if (!constantTimeEqual(expected, signature)) {
    return res.status(401).json({ success: false, message: 'Chữ ký webhook không hợp lệ' });
  }

  next();
}

export async function sePayWebhook(req: Request, res: Response) {
  try {
    const data = await processSePayWebhook(req.body || {});
    res.status(200).json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Xử lý webhook thất bại' });
  }
}
