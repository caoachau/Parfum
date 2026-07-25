import { Schema, model, Types } from 'mongoose';

const supportRequestSchema = new Schema(
  {
    user: { type: Types.ObjectId, ref: 'User' },
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

export const SupportRequest = model('SupportRequest', supportRequestSchema);
