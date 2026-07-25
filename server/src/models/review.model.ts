import { Schema, model, Types } from 'mongoose';
const s = new Schema({
  product: { type: Types.ObjectId, ref: 'Product', required: true },
  user: { type: Types.ObjectId, ref: 'User' },
  guestName: { type: String, trim: true },
  guestEmail: { type: String, trim: true, lowercase: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  title: { type: String, trim: true },
  comment: { type: String, required: true, trim: true },
  images: [String],
  verifiedPurchase: { type: Boolean, default: false },
  approved: { type: Boolean, default: false },
}, { timestamps: true });

s.index({ product: 1, approved: 1, createdAt: -1 });
s.index({ user: 1 });

s.index({ product: 1, approved: 1 });
export const Review = model('Review', s);
