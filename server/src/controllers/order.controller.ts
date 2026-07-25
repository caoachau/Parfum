import { Request, Response } from 'express';
import * as orderService from '../services/order.service';
import { quoteOrder } from '../services/pricing-engine.service';

const uid = (req: Request) => (req as any).user?.id;

export const pricePreview = async (req: Request, res: Response) => {
  try {
    const data = await quoteOrder(req.body.items || [], {
      voucherCode: req.body.voucherCode,
      shippingMethod: req.body.shippingMethod,
      userId: uid(req),
      email: req.body.email,
    });
    res.status(200).json({ success: true, data });
  } catch (error: any) {
    res.status(error.status || 500).json({ success: false, message: error.message });
  }
};

// GET /api/orders/checkout-preview
export const checkoutPreview = async (req: Request, res: Response) => {
  try {
    const data = await orderService.prepareCheckout(uid(req));
    res.status(200).json({ success: true, data });
  } catch (error: any) {
    res.status(error.status || 500).json({ success: false, message: error.message });
  }
};

// POST /api/orders/check-stock
export const checkStock = async (req: Request, res: Response) => {
  try {
    const items = Array.isArray(req.body.items) ? req.body.items : [];
    const data = await orderService.checkStock(items);
    res.status(200).json({ success: true, data });
  } catch (error: any) {
    res.status(error.status || 500).json({ success: false, message: error.message });
  }
};

// POST /api/orders
export const createOrder = async (req: Request, res: Response) => {
  try {
    const data = await orderService.createOrder(uid(req), req.body || {});
    res.status(201).json({ success: true, data });
  } catch (error: any) {
    res
      .status(error.status || 500)
      .json({ success: false, message: error.message, problems: error.problems });
  }
};

// POST /api/orders/:id/cancel
export const cancelOrder = async (req: Request, res: Response) => {
  try {
    const data = await orderService.cancelOrder(uid(req), req.params.id);
    res.status(200).json({ success: true, data });
  } catch (error: any) {
    res.status(error.status || 500).json({ success: false, message: error.message });
  }
};

// GET /api/orders
export const myOrders = async (req: Request, res: Response) => {
  try {
    const data = await orderService.getMyOrders(uid(req));
    res.status(200).json({ success: true, data });
  } catch (error: any) {
    res.status(error.status || 500).json({ success: false, message: error.message });
  }
};

// POST /api/orders/:id/cancel-pending-qr
export const cancelPendingQrOrder = async (req: Request, res: Response) => {
  try {
    const data = await orderService.cancelPendingQrOrder(req.params.id, uid(req));
    res.status(200).json({ success: true, data });
  } catch (error: any) {
    res.status(error.status || 500).json({ success: false, message: error.message });
  }
};

// GET /api/orders/lookup?q=...
export const lookupOrders = async (req: Request, res: Response) => {
  try {
    const data = await orderService.lookupOrders(String(req.query.q || ''));
    res.status(200).json({ success: true, data });
  } catch (error: any) {
    res.status(error.status || 500).json({ success: false, message: error.message });
  }
};

// GET /api/orders/:id
export const orderDetail = async (req: Request, res: Response) => {
  try {
    const data = await orderService.getOrderById(uid(req), req.params.id);
    res.status(200).json({ success: true, data });
  } catch (error: any) {
    res.status(error.status || 500).json({ success: false, message: error.message });
  }
};

// GET /api/orders/:id/payment
export const paymentInfo = async (req: Request, res: Response) => {
  try {
    const data = await orderService.getPaymentInfo(uid(req), req.params.id);
    res.status(200).json({ success: true, data });
  } catch (error: any) {
    res.status(error.status || 500).json({ success: false, message: error.message });
  }
};
