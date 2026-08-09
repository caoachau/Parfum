import { Schema, model, Types } from 'mongoose';

const bankTransactionSchema = new Schema(
  {
    provider: { type: String, required: true },
    providerTransactionId: { type: String, required: true },
    bankReference: String,
    amount: { type: Number, required: true, min: 1 },
    receivedAt: { type: Date, required: true },
  },
  { _id: false },
);

const s = new Schema(
  {
    order: { type: Types.ObjectId, ref: 'Order', required: true, unique: true },
    method: { type: String, enum: ['cod', 'bank_qr'], default: 'cod' },
    status: {
      type: String,
      enum: ['unpaid', 'partial', 'paid', 'refund_pending', 'refunded'],
      default: 'unpaid',
    },
    amount: Number,
    provider: String,
    providerTransactionId: { type: String, unique: true, sparse: true },
    bankReference: String,
    receivedAmount: { type: Number, default: 0, min: 0 },
    excessAmount: { type: Number, default: 0, min: 0 },
    reconciliationStatus: {
      type: String,
      enum: [
        'awaiting_payment',
        'partial',
        'awaiting_confirmation',
        'overpaid',
        'confirmed',
        'late_payment',
      ],
      default: 'awaiting_payment',
    },
    transactions: { type: [bankTransactionSchema], default: [] },
    lastReceivedAt: Date,
    refundStatus: {
      type: String,
      enum: ['none', 'pending', 'refunded'],
      default: 'none',
    },
    refundAmount: { type: Number, default: 0, min: 0 },
    refundReason: String,
    paidAt: Date,
    refundedAt: Date,
  },
  { timestamps: true },
);
s.index({ 'transactions.providerTransactionId': 1 }, { unique: true, sparse: true });
export const Payment = model('Payment', s);
