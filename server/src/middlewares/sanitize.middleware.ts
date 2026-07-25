import { Request, Response, NextFunction } from 'express';

// Loại bỏ các key nguy hiểm ($ hoặc chứa dấu .) khỏi body/query/params
// để chống NoSQL operator injection (tương đương express-mongo-sanitize, không cần thêm dependency).
function scrub(obj: unknown): void {
  if (!obj || typeof obj !== 'object') return;
  for (const key of Object.keys(obj as Record<string, unknown>)) {
    if (key.startsWith('$') || key.includes('.')) {
      delete (obj as Record<string, unknown>)[key];
      continue;
    }
    const val = (obj as Record<string, unknown>)[key];
    if (val && typeof val === 'object') scrub(val);
  }
}

export function mongoSanitize(req: Request, _res: Response, next: NextFunction) {
  scrub(req.body);
  scrub(req.query);
  scrub(req.params);
  next();
}
