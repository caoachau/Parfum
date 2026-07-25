import { NextFunction, Request, Response } from 'express';
import { createSupportRequest } from '../services/report.service';

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const item = await createSupportRequest(req.body, (req as any).user?.id);
    res.status(201).json({ success: true, data: { id: item._id }, message: 'Da tiep nhan yeu cau ho tro' });
  } catch (e) { next(e); }
}
