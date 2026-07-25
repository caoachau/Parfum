import { NextFunction, Request, Response } from 'express';
import * as service from '../services/promotion.service';

const ok = (res: Response, data: unknown, status = 200) => res.status(status).json({ success: true, data });
export async function listVouchers(_req: Request, res: Response, next: NextFunction) { try { ok(res, await service.listVouchers()); } catch (e) { next(e); } }
export async function createVoucher(req: Request, res: Response, next: NextFunction) { try { ok(res, await service.createVoucher(req.body), 201); } catch (e) { next(e); } }
export async function updateVoucher(req: Request, res: Response, next: NextFunction) { try { ok(res, await service.updateVoucher(req.params.id, req.body)); } catch (e) { next(e); } }
export async function deleteVoucher(req: Request, res: Response, next: NextFunction) { try { ok(res, await service.deleteVoucher(req.params.id)); } catch (e) { next(e); } }
export async function listDiscounts(_req: Request, res: Response, next: NextFunction) { try { ok(res, await service.listDiscounts()); } catch (e) { next(e); } }
export async function createDiscount(req: Request, res: Response, next: NextFunction) { try { ok(res, await service.createDiscount(req.body), 201); } catch (e) { next(e); } }
export async function updateDiscount(req: Request, res: Response, next: NextFunction) { try { ok(res, await service.updateDiscount(req.params.id, req.body)); } catch (e) { next(e); } }
export async function deleteDiscount(req: Request, res: Response, next: NextFunction) { try { ok(res, await service.deleteDiscount(req.params.id)); } catch (e) { next(e); } }
export async function listFlashSales(_req: Request, res: Response, next: NextFunction) { try { ok(res, await service.listFlashSales()); } catch (e) { next(e); } }
export async function createFlashSale(req: Request, res: Response, next: NextFunction) { try { ok(res, await service.createFlashSale(req.body), 201); } catch (e) { next(e); } }
export async function updateFlashSale(req: Request, res: Response, next: NextFunction) { try { ok(res, await service.updateFlashSale(req.params.id, req.body)); } catch (e) { next(e); } }
export async function deleteFlashSale(req: Request, res: Response, next: NextFunction) { try { ok(res, await service.deleteFlashSale(req.params.id)); } catch (e) { next(e); } }
export async function priceHistory(req: Request, res: Response, next: NextFunction) { try { ok(res, await service.listPriceHistory(String(req.query.variant || ''))); } catch (e) { next(e); } }
