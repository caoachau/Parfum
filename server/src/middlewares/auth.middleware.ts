import { Request, Response, NextFunction } from 'express';
import { verifyAccess } from '../utils/jwt';

export function authenticate(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return res.status(401).json({ message: 'Chưa đăng nhập' });
  try {
    (req as any).user = verifyAccess(header.slice(7));
    next();
  } catch {
    res.status(401).json({ message: 'Phiên đăng nhập không hợp lệ' });
  }
}

export function optionalAuthenticate(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return next();
  try {
    (req as any).user = verifyAccess(header.slice(7));
  } catch {
    // Checkout guest vẫn được phép tiếp tục; route cần login vẫn dùng authenticate.
  }
  next();
}

export const authorize =
  (...roles: string[]) =>
  (req: Request, res: Response, next: NextFunction) => {
    const role = (req as any).user?.role;
    if (!roles.includes(role))
      return res.status(403).json({ message: 'Bạn không có quyền truy cập' });
    next();
  };
