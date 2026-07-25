import mongoose from 'mongoose';

const journalSubscriberSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    isActive: { type: Boolean, default: true, index: true },
    subscribedAt: { type: Date, default: Date.now },
    lastNotifiedAt: Date,
    adminSeenAt: Date,
  },
  { timestamps: true },
);

export const JournalSubscriber = mongoose.model('JournalSubscriber', journalSubscriberSchema);
export default JournalSubscriber;
