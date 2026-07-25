import { Schema, model, Types } from 'mongoose';
const s = new Schema({
  order: { type: Types.ObjectId, ref: 'Order', required: true },
  method: { type: String, enum: ['cod','bank_qr'], default: 'cod' },
  status: { type: String, enum: ['unpaid','paid','refunded'], default: 'unpaid' },
  amount: Number,
  provider: String,
  providerTransactionId: { type: String, unique: true, sparse: true },
  bankReference: String,
  receivedAmount: Number,
  paidAt: Date,
  refundedAt: Date,
}, { timestamps: true });
export const Payment = model('Payment', s);
