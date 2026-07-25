import { Schema, model, Types } from 'mongoose';

const variantSchema = new Schema(
  {
    product: { type: Types.ObjectId, ref: 'Product', required: true },
    sku: { type: String, required: true, unique: true, trim: true },
    size: { type: String, trim: true },
    volume: { type: String, trim: true },
    price: { type: Number, required: true, min: 0 },
    // `price` duoc giu de tuong thich du lieu cu; basePrice la gia niem yet duy nhat
    // ma pricing engine dung lam moc tinh khuyen mai.
    basePrice: { type: Number, min: 0 },
    costPrice: { type: Number, default: 0, min: 0 },
    stock: { type: Number, default: 0, min: 0 },
    images: { type: [String], default: [] },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

variantSchema.index({ product: 1 });
export const Variant = model('Variant', variantSchema);
