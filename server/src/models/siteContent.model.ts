// =============================================================================
//  SITE CONTENT MODEL
//  Luu override anh cho tung vi tri tren web. Chi luu nhung slot da bi doi;
//  slot chua doi se dung anh mac dinh khai bao trong config/siteContentSlots.ts
// =============================================================================
import mongoose from 'mongoose';

const siteContentSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, index: true },
    url: { type: String, required: true },
  },
  { timestamps: true },
);

export const SiteContent = mongoose.model('SiteContent', siteContentSchema);
export default SiteContent;
