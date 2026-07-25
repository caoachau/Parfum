import { Schema, model, Types } from 'mongoose';

const voucherCounterSchema = new Schema({
  voucher: { type: Types.ObjectId, ref: 'Voucher', required: true },
  customerKey: { type: String, required: true },
  count: { type: Number, default: 0, min: 0 },
}, { timestamps: true });
voucherCounterSchema.index({ voucher: 1, customerKey: 1 }, { unique: true });
export const VoucherCounter = model('VoucherCounter', voucherCounterSchema);
