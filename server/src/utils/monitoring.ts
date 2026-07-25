import { logger } from './logger';
import { env } from '../config/env';

// Sentry la OPTIONAL dependency. Chi hoat dong khi:
//   1) da cai @sentry/node, VA
//   2) da set SENTRY_DSN trong .env
// Nếu không, các hàm này trở thành no-op an toàn, không làm vỡ build/runtime.
let sentry: any = null;

// Nạp động để tsc không cần resolve module lúc build, tránh lỗi "Cannot find module".
const dynamicImport = (moduleName: string): Promise<any> =>
  // eslint-disable-next-line no-new-func
  Function('m', 'return import(m)')(moduleName);

export async function initMonitoring() {
  if (!env.sentryDsn) return;
  try {
    const mod = await dynamicImport('@sentry/node');
    mod.init({ dsn: env.sentryDsn, environment: env.nodeEnv, tracesSampleRate: 0.1 });
    sentry = mod;
    logger.info('[monitoring] Sentry initialized');
  } catch {
    logger.warn('[monitoring] SENTRY_DSN đã set nhưng @sentry/node chưa được cài -> bỏ qua');
  }
}

export function captureException(err: unknown) {
  if (!sentry) return;
  try {
    sentry.captureException(err);
  } catch {
    // ignore
  }
}
