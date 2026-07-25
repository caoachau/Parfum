import { Schema, model, Types } from 'mongoose';

const flashSaleUsageSchema = new Schema({
  flashSale: { type: Types.ObjectId, ref: 'FlashSale', required: true },
  customerKey: { type: String, required: true },
  quantity: { type: Number, default: 0, min: 0 },
}, { timestamps: true });
flashSaleUsageSchema.index({ flashSale: 1, customerKey: 1 }, { unique: true });
export const FlashSaleUsage = model('FlashSaleUsage', flashSaleUsageSchema);
