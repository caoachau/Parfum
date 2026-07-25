import { Request, Response, NextFunction } from 'express';
import { getAdminDashboard } from '../services/dashboard.service';

export const getDashboard = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await getAdminDashboard(req.query);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};
