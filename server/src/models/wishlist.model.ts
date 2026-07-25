import { Schema, model, Types } from 'mongoose';
const s = new Schema(
  {
    user: { type: Types.ObjectId, ref: 'User', required: true },
    products: [{ type: Types.ObjectId, ref: 'Product' }],
  },
  { timestamps: true },
);
export const Wishlist = model('Wishlist', s);
