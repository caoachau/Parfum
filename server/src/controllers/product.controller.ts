import { Request, Response } from 'express';
import * as productService from '../services/product.service';

// GET /api/products -> danh sách sản phẩm cho web, có filter/sort/pagination
export const getProducts = async (req: Request, res: Response) => {
  try {
    const data = await productService.getProducts(req.query);
    return res.status(200).json(data);
  } catch (error: any) {
    return res.status(error.status || 500).json({ message: error.message });
  }
};

// GET /api/products/:idOrSlug -> chi tiết + variants
export const getProductDetail = async (req: Request, res: Response) => {
  try {
    const data = await productService.getProductDetail(req.params.idOrSlug);
    return res.status(200).json(data);
  } catch (error: any) {
    return res.status(error.status || 500).json({ message: error.message });
  }
};


// GET /api/products/filters -> facet lọc lấy từ toàn bộ DB (brand, nhóm mùi hương, size...)
export const getProductFilters = async (_req: Request, res: Response) => {
  try {
    const data = await productService.getProductFilters();
    return res.status(200).json(data);
  } catch (error: any) {
    return res.status(error.status || 500).json({ message: error.message });
  }
};
