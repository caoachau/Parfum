import { Schema, model, Types } from 'mongoose';

const discountSchema = new Schema({
  name: { type: String, required: true, trim: true },
  scope: { type: String, enum: ['PRODUCT', 'CATEGORY'], required: true },
  type: { type: String, enum: ['PERCENTAGE', 'FIXED'], required: true },
  value: { type: Number, required: true, min: 0 },
  maxDiscountAmount: { type: Number, default: 0, min: 0 },
  products: [{ type: Types.ObjectId, ref: 'Product' }],
  categories: [{ type: Types.ObjectId, ref: 'Category' }],
  priority: { type: Number, default: 0 },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  isActive: { type: Boolean, default: true },
  isConcentratedPromotion: { type: Boolean, default: false },
  referencePriceConfirmed: { type: Boolean, default: false },
  referencePriceNote: { type: String, trim: true, default: '' },
  promotionNotifiedAt: Date,
}, { timestamps: true });

discountSchema.index({ isActive: 1, startDate: 1, endDate: 1, priority: -1 });
export const Discount = model('Discount', discountSchema);
