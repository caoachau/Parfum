import { Schema, model, InferSchemaType } from 'mongoose';

const voucherSchema = new Schema(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    name: { type: String, trim: true, default: '' },
    type: { type: String, enum: ['percent', 'percentage', 'fixed', 'free_shipping'], required: true },
    value: { type: Number, required: true, min: 0 },
    minOrder: { type: Number, default: 0, min: 0 },
    maxDiscount: { type: Number, default: 0, min: 0 },
    expiresAt: { type: Date, default: null },
    startDate: { type: Date, default: null },
    endDate: { type: Date, default: null },
    usageLimitPerUser: { type: Number, default: 0, min: 0 },
    stackable: { type: Boolean, default: true },
    userSegment: { type: String, enum: ['ALL', 'NEW', 'RETURNING', 'LOYAL', 'VIP'], default: 'ALL' },
    appliesToNewMembers: { type: Boolean, default: false },
    isPrivate: { type: Boolean, default: false },
    isConcentratedPromotion: { type: Boolean, default: false },
    usageLimit: { type: Number, default: 0, min: 0 },
    usedCount: { type: Number, default: 0, min: 0 },
    isActive: { type: Boolean, default: true },
    promotionNotifiedAt: Date,
  },
  { timestamps: true },
);

voucherSchema.index({ isActive: 1, startDate: 1, endDate: 1 });
voucherSchema.index({ appliesToNewMembers: 1, isActive: 1, updatedAt: -1 });

export type VoucherDoc = InferSchemaType<typeof voucherSchema>;
export const Voucher = model('Voucher', voucherSchema);
