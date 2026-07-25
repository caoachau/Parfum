import { Category } from '../models/category.model';

export const getCategories = async () => {
  return await Category.find().sort({ createdAt: -1 });
};
