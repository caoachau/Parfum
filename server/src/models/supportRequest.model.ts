import { Schema, model, Types } from 'mongoose';

const supportRequestSchema = new Schema(
  {
    user: { type: Types.ObjectId, ref: 'User' },
    order: { type: Types.ObjectId, ref: 'Order', index: true },
    type: {
      type: String,
      enum: ['general', 'product', 'order', 'returns', 'press', 'other'],
      default: 'general',
      index: true,
    },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    subject: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ['open', 'in_progress', 'resolved', 'closed'],
      default: 'open',
      index: true,
    },
    resolvedAt: Date,
  },
  { timestamps: true },
);

supportRequestSchema.index(
  { order: 1, type: 1 },
  { unique: true, partialFilterExpression: { type: 'returns' } },
);
supportRequestSchema.index({ type: 1, createdAt: -1 });

export const SupportRequest = model('SupportRequest', supportRequestSchema);
