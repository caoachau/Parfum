import { Request, Response, NextFunction } from 'express';
import { getBrands } from '../services/brand.service';

export const getAllBrands = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const brands = await getBrands({ featuredOnly: req.query.featured === 'true' });

    res.status(200).json({
      success: true,
      data: brands,
    });
  } catch (error) {
    next(error);
  }
};
