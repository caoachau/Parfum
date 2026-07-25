import { NextFunction, Request, Response } from 'express';
import * as service from '../services/scentFamilyCard.service';

const ok = (res: Response, data: unknown, status = 200) =>
  res.status(status).json({ success: true, data });

export async function listPublic(_req: Request, res: Response, next: NextFunction) {
  try { ok(res, await service.listPublic()); } catch (error) { next(error); }
}

export async function listAdmin(_req: Request, res: Response, next: NextFunction) {
  try { ok(res, await service.listAdmin()); } catch (error) { next(error); }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try { ok(res, await service.create(req.body), 201); } catch (error) { next(error); }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try { ok(res, await service.update(req.params.id, req.body)); } catch (error) { next(error); }
}

export async function remove(req: Request, res: Response, next: NextFunction) {
  try { ok(res, await service.remove(req.params.id)); } catch (error) { next(error); }
}

