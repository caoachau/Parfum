import { normalizeOrderStatus } from './orderStatus';

export const STANDARD_RETURN_REQUEST_WINDOW_MS = 3 * 24 * 60 * 60 * 1000;

export function orderCompletedAt(order: any): Date | null {
  if (order?.completedAt) return new Date(order.completedAt);
  const event = [...(order?.statusHistory || [])]
    .reverse()
    .find((entry: any) => normalizeOrderStatus(String(entry.status)) === 'done' && entry.at);
  return event?.at ? new Date(event.at) : null;
}
