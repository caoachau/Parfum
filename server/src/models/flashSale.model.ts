import { Schema, model, Types } from 'mongoose';

const flashSaleSchema = new Schema({
  name: { type: String, required: true, trim: true },
  variant: { type: Types.ObjectId, ref: 'Variant', required: true, index: true },
  originalPrice: { type: Number, required: true, min: 0 },
  flashPrice: { type: Number, required: true, min: 0 },
  stockAllocated: { type: Number, required: true, min: 1 },
  soldCount: { type: Number, default: 0, min: 0 },
  maxPerUser: { type: Number, default: 0, min: 0 },
  startTime: { type: Date, required: true },
  endTime: { type: Date, required: true },
  isActive: { type: Boolean, default: true },
  isConcentratedPromotion: { type: Boolean, default: false },
  referencePriceConfirmed: { type: Boolean, default: false },
  referencePriceNote: { type: String, trim: true, default: '' },
  promotionNotifiedAt: Date,
}, { timestamps: true });

flashSaleSchema.index({ variant: 1, isActive: 1, startTime: 1, endTime: 1 });
export const FlashSale = model('FlashSale', flashSaleSchema);
