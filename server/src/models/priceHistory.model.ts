import { Schema, model, Types } from 'mongoose';

const priceHistorySchema = new Schema({
  variant: { type: Types.ObjectId, ref: 'Variant', required: true, index: true },
  basePrice: { type: Number, required: true, min: 0 },
  validFrom: { type: Date, required: true },
  validTo: { type: Date, default: null },
  reason: { type: String, trim: true, default: '' },
  changedBy: { type: Types.ObjectId, ref: 'User' },
}, { timestamps: true });

priceHistorySchema.index({ variant: 1, validFrom: -1 });
export const PriceHistory = model('PriceHistory', priceHistorySchema);
