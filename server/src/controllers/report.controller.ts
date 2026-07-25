import { NextFunction, Request, Response } from 'express';
import * as reportService from '../services/report.service';

const ok = (res: Response, data: unknown, status = 200) => res.status(status).json({ success: true, data });
export async function reports(req: Request, res: Response, next: NextFunction) { try { ok(res, await reportService.getReports(req.query)); } catch (e) { next(e); } }
export async function createExpense(req: Request, res: Response, next: NextFunction) { try { ok(res, await reportService.createExpense(req.body), 201); } catch (e) { next(e); } }
export async function deleteExpense(req: Request, res: Response, next: NextFunction) { try { ok(res, await reportService.deleteExpense(req.params.id)); } catch (e) { next(e); } }
export async function updateSupport(req: Request, res: Response, next: NextFunction) { try { ok(res, await reportService.updateSupportStatus(req.params.id, req.body.status)); } catch (e) { next(e); } }
