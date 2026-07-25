import { Variant } from '../models/variant.model';

type VariantPayload = {
  product: string;
  sku: string;
  volume: string;
  price: number;
  stock: number;
  images?: string[];
};

export const getAllVariants = async () => {
  return await Variant.find().populate('product').sort({ createdAt: -1 });
};

export const getVariantsByProduct = async (productId: string) => {
  return await Variant.find({ product: productId }).populate('product').sort({ createdAt: -1 });
};

export const createVariant = async (data: VariantPayload) => {
  const existed = await Variant.findOne({ sku: data.sku });

  if (existed) {
    throw new Error('SKU đã tồn tại');
  }

  return await Variant.create(data);
};

export const updateVariant = async (id: string, data: VariantPayload) => {
  const existed = await Variant.findOne({
    sku: data.sku,
    _id: { $ne: id },
  });

  if (existed) {
    throw new Error('SKU đã tồn tại');
  }

  return await Variant.findByIdAndUpdate(id, data, { new: true });
};

export const deleteVariant = async (id: string) => {
  return await Variant.findByIdAndDelete(id);
};
