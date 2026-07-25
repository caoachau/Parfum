import { Brand } from '../models/brand.model';

export const getBrands = async () => {
  return await Brand.find().sort({ createdAt: -1 });
};
