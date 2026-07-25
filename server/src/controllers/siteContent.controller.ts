// =============================================================================
//  SITE CONTENT CONTROLLER
//  - getPublic: API cong khai cho frontend tai map { key: url } (override).
//  - adminList / adminUpdate / adminReset: khu vuc quan tri.
// =============================================================================
import { Request, Response, NextFunction } from 'express';
import * as service from '../services/siteContent.service';

const ok = (res: Response, data: unknown, status = 200) =>
  res.status(status).json({ success: true, data });

export async function getPublic(_req: Request, res: Response, next: NextFunction) {
  try {
    ok(res, await service.getPublicMap());
  } catch (e) {
    next(e);
  }
}

export async function adminList(_req: Request, res: Response, next: NextFunction) {
  try {
    ok(res, await service.listForAdmin());
  } catch (e) {
    next(e);
  }
}

export async function adminUpdate(req: Request, res: Response, next: NextFunction) {
  try {
    const { key, url } = req.body || {};
    ok(res, await service.setContent(String(key || ''), String(url || '')));
  } catch (e) {
    next(e);
  }
}

export async function adminReset(req: Request, res: Response, next: NextFunction) {
  try {
    const key = String(req.params.key || req.body?.key || '');
    ok(res, await service.resetContent(key));
  } catch (e) {
    next(e);
  }
}
