import { Schema, model, Types } from 'mongoose';

// Mỗi dòng hàng trong đơn: LƯU SNAPSHOT (name/volume/price) tại thời điểm đặt
// để sau này sản phẩm đổi giá/tên thì đơn cũ vẫn giữ đúng dữ liệu lúc mua.
const orderItemSchema = new Schema(
  {
    variant: { type: Types.ObjectId, ref: 'Variant', required: true },
    name: String,
    volume: String,
    price: { type: Number, required: true, min: 0 },
    basePrice: { type: Number, min: 0 },
    finalPrice: { type: Number, min: 0 },
    productDiscountAmount: { type: Number, default: 0, min: 0 },
    promotionType: {
      type: String,
      enum: ['FLASH_SALE', 'PRODUCT_DISCOUNT', 'CATEGORY_DISCOUNT', null],
      default: null,
    },
    promotionId: { type: Types.ObjectId },
    promotionName: String,
    costPrice: { type: Number, default: 0, min: 0 },
    quantity: { type: Number, required: true, min: 1 },
  },
  { _id: false },
);

const voucherSnapshotSchema = new Schema(
  {
    code: { type: String, trim: true, uppercase: true },
    name: { type: String, default: '' },
    type: String,
    value: { type: Number, default: 0 },
    stackable: Boolean,
    userSegment: String,
  },
  { _id: false },
);

const orderSchema = new Schema(
  {
    user: { type: Types.ObjectId, ref: 'User' },
    // Token thô chỉ trả một lần cho guest; DB chỉ lưu SHA-256 để tránh lộ quyền truy cập.
    guestAccessTokenHash: { type: String, select: false },
    items: { type: [orderItemSchema], required: true },
    subtotal: { type: Number, min: 0 },
    originalTotal: { type: Number, default: 0, min: 0 },
    productLevelDiscount: { type: Number, default: 0, min: 0 },
    voucherDiscount: { type: Number, default: 0, min: 0 },
    shippingDiscount: { type: Number, default: 0, min: 0 },
    discount: { type: Number, default: 0, min: 0 },
    shippingFee: { type: Number, default: 0, min: 0 },
    // Khong dat default cho cac snapshot VAT: don cu khong duoc tu dong suy dien/backfill.
    vatRate: { type: Number, min: 0, max: 1 },
    vatIncluded: { type: Number, min: 0 },
    pricesIncludeVat: { type: Boolean },
    total: { type: Number, required: true, min: 0 },
    voucherCode: { type: String, trim: true, uppercase: true },
    voucherSnapshot: { type: voucherSnapshotSchema, default: undefined },
    status: {
      type: String,
      enum: ['pending', 'paid', 'shipping', 'done', 'cancelled', 'returned'],
      default: 'pending',
    },
    address: {
      fullName: String,
      email: { type: String, lowercase: true, trim: true },
      phone: String,
      line: String,
      ward: String,
      district: String,
      province: String,
      city: String,
    },
    note: String,
    statusHistory: {
      type: [{ status: String, at: Date }],
      default: [],
    },
    processedAt: Date,
    shippedAt: Date,
    completedAt: Date,
    cancelledAt: Date,
    returnedAt: Date,
    // Ly do huy don + ai la nguoi huy (khach hang hoac quan tri vien)
    cancelReason: { type: String, trim: true, maxlength: 300 },
    cancelledBy: { type: String, enum: ['customer', 'admin', null], default: null },
  },
  { timestamps: true },
);

orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ guestAccessTokenHash: 1 }, { sparse: true });
orderSchema.index({ status: 1, 'items.variant': 1 });
export const Order = model('Order', orderSchema);
