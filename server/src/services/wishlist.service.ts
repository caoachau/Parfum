import { Types } from 'mongoose';
import { Wishlist } from '../models/wishlist.model';
import { Product } from '../models/product.model';
import { Brand } from '../models/brand.model';
import { Category } from '../models/category.model';

const productPopulate = {
  path: 'products',
  populate: [
    { path: 'brand', model: Brand },
    { path: 'category', model: Category },
  ],
};

export async function getByUser(userId: string) {
  return Wishlist.findOne({ user: userId }).populate(productPopulate);
}

export async function addProduct(userId: string, productId: string) {
  if (!Types.ObjectId.isValid(productId))
    throw Object.assign(new Error('Mã sản phẩm không hợp lệ'), { status: 400 });

  const product = await Product.findById(productId);
  if (!product || product.isActive === false)
    throw Object.assign(new Error('Không tìm thấy sản phẩm'), { status: 404 });

  const wishlist = await Wishlist.findOneAndUpdate(
    { user: userId },
    { $addToSet: { products: productId }, $setOnInsert: { user: userId } },
    { new: true, upsert: true },
  ).populate(productPopulate);

  return wishlist;
}

export async function removeProduct(userId: string, productId: string) {
  if (!Types.ObjectId.isValid(productId))
    throw Object.assign(new Error('Mã sản phẩm không hợp lệ'), { status: 400 });

  const wishlist = await Wishlist.findOneAndUpdate(
    { user: userId },
    { $pull: { products: productId } },
    { new: true },
  ).populate(productPopulate);

  if (!wishlist) return { products: [] } as any;
  return wishlist;
}
