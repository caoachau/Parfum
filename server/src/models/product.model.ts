import { Schema, model, Types } from 'mongoose';

const productSchema = new Schema(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    description: String,
    brand: { type: Types.ObjectId, ref: 'Brand' },
    category: { type: Types.ObjectId, ref: 'Category' },
    images: [String],
    gender: String,
    fragranceFamily: String,
    concentration: String,
    season: [String],
    notes: { top: [String], middle: [String], base: [String] },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

productSchema.index({ isActive: 1, createdAt: -1 });
productSchema.index({ slug: 1 });
export const Product = model('Product', productSchema);
