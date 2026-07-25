import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { captureException } from '../utils/monitoring';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function errorHandler(err: any, _req: Request, res: Response, _next: NextFunction) {
  const status = err.status || 500;
  logger.error(err);
  // Gui loi 5xx len Sentry (neu duoc cau hinh). Loi 4xx la loi nghiep vu -> bo qua.
  if (status >= 500) captureException(err);

  const isProd = process.env.NODE_ENV === 'production';
  const message =
    status >= 500 && isProd
      ? 'Da co loi xay ra, vui long thu lai sau'
      : err.message || 'Server error';

  const body: Record<string, unknown> = { message };
  if (err.problems) body.problems = err.problems;
  if (err.errors) body.errors = err.errors;
  res.status(status).json(body);
}
