// =============================================================================
//  MEDIA CONTROLLER — endpoint quan tri anh (Cloudinary)
// =============================================================================
import { Request, Response, NextFunction } from 'express';
import * as mediaService from '../services/media.service';

const ok = (res: Response, data: unknown, status = 200) =>
  res.status(status).json({ success: true, data });

export async function status(_req: Request, res: Response, next: NextFunction) {
  try {
    ok(res, mediaService.getStatus());
  } catch (e) {
    next(e);
  }
}

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    ok(
      res,
      await mediaService.listImages({
        nextCursor: req.query.cursor ? String(req.query.cursor) : undefined,
        max: req.query.max ? Number(req.query.max) : undefined,
        folder: req.query.folder ? String(req.query.folder) : undefined,
      }),
    );
  } catch (e) {
    next(e);
  }
}

export async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    const publicId = (req.body?.publicId ?? req.query.publicId) as string;
    ok(res, await mediaService.deleteImage(String(publicId || '')));
  } catch (e) {
    next(e);
  }
}
