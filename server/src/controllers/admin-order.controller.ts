import { Request, Response } from 'express';
import * as adminOrderService from '../services/admin-order.service';

export const list = async (req: Request, res: Response) => {
  try {
    const data = await adminOrderService.listOrders(req.query as any);
    res.status(200).json({ success: true, data });
  } catch (error: any) {
    res.status(error.status || 500).json({ success: false, message: error.message });
  }
};

export const getOne = async (req: Request, res: Response) => {
  try {
    const data = await adminOrderService.getOrder(req.params.id);
    res.status(200).json({ success: true, data });
  } catch (error: any) {
    res.status(error.status || 500).json({ success: false, message: error.message });
  }
};

export const updateStatus = async (req: Request, res: Response) => {
  try {
    const data = await adminOrderService.updateStatus(req.params.id, req.body.status);
    res.status(200).json({ success: true, data });
  } catch (error: any) {
    res.status(error.status || 500).json({ success: false, message: error.message });
  }
};

export const confirmPayment = async (req: Request, res: Response) => {
  try {
    const data = await adminOrderService.confirmPayment(req.params.id);
    res.status(200).json({ success: true, data });
  } catch (error: any) {
    res.status(error.status || 500).json({ success: false, message: error.message });
  }
};

export const updatePayment = async (req: Request, res: Response) => {
  try {
    const data = await adminOrderService.setPaymentStatus(req.params.id, req.body.status);
    res.status(200).json({ success: true, data });
  } catch (error: any) {
    res.status(error.status || 500).json({ success: false, message: error.message });
  }
};
