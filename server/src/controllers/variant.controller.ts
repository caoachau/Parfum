import { Request, Response } from 'express';

import {
  getAllVariants,
  getVariantsByProduct,
  createVariant,
  updateVariant,
  deleteVariant,
} from '../services/variant.service';

export const getVariants = async (req: Request, res: Response) => {
  try {
    const variants = await getAllVariants();

    res.status(200).json({
      success: true,
      data: variants,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getProductVariants = async (req: Request, res: Response) => {
  try {
    const variants = await getVariantsByProduct(req.params.productId);

    res.status(200).json({
      success: true,
      data: variants,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const createNewVariant = async (req: Request, res: Response) => {
  try {
    const { product, sku, volume, price, stock, images } = req.body;

    if (!product || !sku || !volume || price === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu thông tin biến thể',
      });
    }

    const variant = await createVariant({
      product,
      sku,
      volume,
      price: Number(price),
      stock: Number(stock || 0),
      images: images || [],
    });

    res.status(201).json({
      success: true,
      message: 'Thêm biến thể thành công',
      data: variant,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const updateVariantById = async (req: Request, res: Response) => {
  try {
    const { product, sku, volume, price, stock, images } = req.body;

    const variant = await updateVariant(req.params.id, {
      product,
      sku,
      volume,
      price: Number(price),
      stock: Number(stock || 0),
      images: images || [],
    });

    if (!variant) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy biến thể',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Cập nhật biến thể thành công',
      data: variant,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const deleteVariantById = async (req: Request, res: Response) => {
  try {
    const variant = await deleteVariant(req.params.id);

    if (!variant) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy biến thể',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Xóa biến thể thành công',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
