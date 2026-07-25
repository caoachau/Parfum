import crypto from 'crypto';
import { NextFunction, Request, Response } from 'express';
import { env } from '../config/env';
import { processSePayWebhook } from '../services/payment-webhook.service';

function constantTimeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return (
    leftBuffer.length === rightBuffer.length && crypto.timingSafeEqual(leftBuffer, rightBuffer)
  );
}

export function verifySePaySignature(req: Request, res: Response, next: NextFunction) {
  if (!env.sepay.webhookSecret) {
    return res.status(503).json({ success: false, message: 'SePay webhook is not configured' });
  }

  const signature = req.get('X-SePay-Signature') || '';
  const timestamp = req.get('X-SePay-Timestamp') || '';
  const timestampNumber = Number(timestamp);
  const rawBody = (req as any).rawBody as Buffer | undefined;

  if (
    !rawBody ||
    !Number.isFinite(timestampNumber) ||
    Math.abs(Date.now() / 1000 - timestampNumber) > 300
  ) {
    return res.status(401).json({ success: false, message: 'Webhook request expired' });
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
