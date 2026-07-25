import { Request, Response } from 'express';
import * as accountService from '../services/account.service';

const uid = (req: Request) => (req as any).user.id;

export async function getOrders(req: Request, res: Response) {
  try {
    res.json(await accountService.getOrders(uid(req)));
  } catch (error: any) {
    res.status(error.status || 500).json({ message: error.message || 'Server error' });
  }
}

export async function getWishlist(req: Request, res: Response) {
  try {
    res.json(await accountService.getWishlist(uid(req)));
  } catch (error: any) {
    res.status(error.status || 500).json({ message: error.message || 'Server error' });
  }
}

export async function addWishlistItem(req: Request, res: Response) {
  try {
    res.status(201).json(await accountService.addWishlistItem(uid(req), req.params.productId));
  } catch (error: any) {
    res.status(error.status || 500).json({ message: error.message || 'Server error' });
  }
}

export async function removeWishlistItem(req: Request, res: Response) {
  try {
    res.json(await accountService.removeWishlistItem(uid(req), req.params.productId));
  } catch (error: any) {
    res.status(error.status || 500).json({ message: error.message || 'Server error' });
  }
}

export async function getScentProfile(req: Request, res: Response) {
  try {
    res.json(await accountService.getScentProfile(uid(req)));
  } catch (error: any) {
    res.status(error.status || 500).json({ message: error.message || 'Server error' });
  }
}

export async function updateScentProfile(req: Request, res: Response) {
  try {
    res.json(await accountService.updateScentProfile(uid(req), req.body));
  } catch (error: any) {
    res.status(error.status || 500).json({ message: error.message || 'Server error' });
  }
}
