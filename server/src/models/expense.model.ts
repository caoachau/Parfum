import { Schema, model } from 'mongoose';

const expenseSchema = new Schema(
  {
    type: {
      type: String,
      enum: ['shipping', 'marketing', 'returns', 'operations', 'other'],
      required: true,
      index: true,
    },
    amount: { type: Number, required: true, min: 0 },
    date: { type: Date, required: true, index: true },
    note: { type: String, trim: true, default: '' },
  },
  { timestamps: true },
);

export const Expense = model('Expense', expenseSchema);
