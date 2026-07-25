import { Schema, model } from 'mongoose';

const scentFamilyCardSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, unique: true },
    image: { type: String, required: true, trim: true },
    description: { type: String, trim: true, default: '' },
    displayOrder: { type: Number, default: 0, min: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

scentFamilyCardSchema.index({ isActive: 1, displayOrder: 1, name: 1 });

export const ScentFamilyCard = model('ScentFamilyCard', scentFamilyCardSchema);

