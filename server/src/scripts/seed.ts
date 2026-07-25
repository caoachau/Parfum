// =============================================================================
//  SEED DU LIEU MAU (khop DUNG voi cac model hien tai)
//  Chay:  npm run seed
//  Tao: 1 admin + 2 khach, thuong hieu, danh muc, san pham + bien the,
//       1 don hang mau + thanh toan + danh gia.
// =============================================================================
import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { env } from '../config/env';

import { User } from '../models/user.model';
import Brand from '../models/brand.model';
import Category from '../models/category.model';
import { Product } from '../models/product.model';
import { Variant } from '../models/variant.model';
import { Order } from '../models/order.model';
import { Payment } from '../models/payment.model';
import { Review } from '../models/review.model';
import { Discount } from '../models/discount.model';
import { FlashSale } from '../models/flashSale.model';
import { PriceHistory } from '../models/priceHistory.model';
import { Voucher } from '../models/voucher.model';

function slugify(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'd')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

const ADMIN_EMAIL = (env.defaultAdminEmail || 'admin@lessencenoire.vn').toLowerCase();
const ADMIN_PASS = env.adminBootstrapPassword || 'Admin@123';

async function seed() {
  await mongoose.connect(env.mongoUri);
  console.log('✅ Da ket noi MongoDB');

  // 1) USERS (upsert theo email, khong xoa user cu)
  const users = [
    { name: "Admin L'Essence Noire", email: ADMIN_EMAIL, password: ADMIN_PASS, role: 'admin' as const, phone: '0901000001' },
    { name: 'Nguyen Thi Mai', email: 'mai.nguyen@gmail.com', password: 'Customer@123', role: 'customer' as const, phone: '0902000001' },
    { name: 'Tran Minh Khoa', email: 'khoa.tran@outlook.com', password: 'Customer@123', role: 'customer' as const, phone: '0903000001' },
  ];
  const userIds: Record<string, mongoose.Types.ObjectId> = {};
  for (const u of users) {
    const password = await bcrypt.hash(u.password, 10);
    const doc = await User.findOneAndUpdate(
      { email: u.email },
      { $set: { name: u.name, email: u.email, password, role: u.role, phone: u.phone, isEmailVerified: true } },
      { upsert: true, new: true },
    );
    userIds[u.email] = doc!._id as mongoose.Types.ObjectId;
    console.log(`   👤 ${u.email} (${u.role})`);
  }

  // 2) Xoa catalog cu (giu users)
  await Promise.all([
    Brand.deleteMany({}),
    Category.deleteMany({}),
    Product.deleteMany({}),
    Variant.deleteMany({}),
    Order.deleteMany({}),
    Payment.deleteMany({}),
    Review.deleteMany({}),
    Discount.deleteMany({}),
    FlashSale.deleteMany({}),
    PriceHistory.deleteMany({}),
    Voucher.deleteMany({}),
  ]);

  // 3) BRANDS + CATEGORIES
  const brandDocs = await Brand.insertMany(
    [
      {
        name: "L'Essence Noire",
        country: 'Vietnam',
        description: 'Nha tuyen chon nuoc hoa cao cap voi tinh than toi gian, sang trong va ca tinh.',
        isFeatured: true,
      },
      {
        name: 'Dior',
        country: 'France',
        description: 'Bieu tuong thoi trang va mui huong Phap voi cac sang tao nam tinh hien dai.',
        isFeatured: true,
      },
      {
        name: 'Chanel',
        country: 'France',
        description: 'Di san huong thom thanh lich, nu tinh va ben bi qua nhieu the he.',
        isFeatured: true,
      },
      {
        name: 'Versace',
        country: 'Italy',
        description: 'Phong cach Y ruc ro, quyen ru va day nang luong.',
        isFeatured: true,
      },
    ].map((brand) => ({ ...brand, slug: slugify(brand.name) })),
  );
  const brandMap = new Map(brandDocs.map((b: any) => [b.name as string, b._id]));

  const catDocs = await Category.insertMany(
    ['Nước hoa nam', 'Nước hoa nữ', 'Unisex'].map((name) => ({ name, slug: slugify(name) })),
  );
  const catMap = new Map(catDocs.map((c: any) => [c.name as string, c._id]));
  console.log(`   🏷️  ${brandDocs.length} brands, 📂 ${catDocs.length} categories`);

  // 4) PRODUCTS + VARIANTS
  const products = [
    {
      name: 'Noir Intense', brand: "L'Essence Noire", category: 'Nước hoa nam', gender: 'male',
      fragranceFamily: 'Woody', concentration: 'EDP', season: ['autumn', 'winter'],
      description: 'Huong go am pha chut cay – nam tinh, sang trong, luu huong lau.',
      images: ['https://picsum.photos/seed/noir-intense/600/800'],
      notes: { top: ['Bergamot', 'Tieu den'], middle: ['Oai huong', 'Nhuc dau khau'], base: ['Go dan huong', 'Da thuoc'] },
      variants: [ { volume: '50ml', price: 1250000, stock: 30 }, { volume: '100ml', price: 1950000, stock: 20 } ],
    },
    {
      name: 'Rose Blanche', brand: "L'Essence Noire", category: 'Nước hoa nữ', gender: 'female',
      fragranceFamily: 'Floral', concentration: 'EDP', season: ['spring', 'summer'],
      description: 'Hoa hong trang tinh khoi – nu tinh, thanh lich, nhe nhang.',
      images: ['https://picsum.photos/seed/rose-blanche/600/800'],
      notes: { top: ['Quyt', 'Le'], middle: ['Hoa hong Damask', 'Mau don'], base: ['Xa huong trang', 'Tuyet tung'] },
      variants: [ { volume: '30ml', price: 890000, stock: 40 }, { volume: '50ml', price: 1350000, stock: 25 } ],
    },
    {
      name: 'Velvet Oud', brand: "L'Essence Noire", category: 'Unisex', gender: 'unisex',
      fragranceFamily: 'Oriental', concentration: 'Parfum', season: ['autumn', 'winter'],
      description: 'Oud tram mac quyen cung nhung lua phuong Dong – sang trong tot dinh.',
      images: ['https://picsum.photos/seed/velvet-oud/600/800'],
      notes: { top: ['Nghe tay', 'Tieu hong'], middle: ['Oud A Rap', 'Hoa hong Tho Nhi Ky'], base: ['Benzoin', 'Hoac huong'] },
      variants: [ { volume: '50ml', price: 2850000, stock: 15 }, { volume: '100ml', price: 4950000, stock: 8 } ],
    },
    {
      name: 'Dior Sauvage EDP', brand: 'Dior', category: 'Nước hoa nam', gender: 'male',
      fragranceFamily: 'Fougere', concentration: 'EDP', season: ['autumn', 'winter', 'spring'],
      description: 'Manh me, hoang da va quyen ru – bieu tuong nuoc hoa nam hien dai.',
      images: ['https://picsum.photos/seed/sauvage/600/800'],
      notes: { top: ['Bergamot', 'Tieu Sichuan'], middle: ['Oai huong', 'Nhuc dau khau'], base: ['Ambroxan', 'Cedar'] },
      variants: [ { volume: '60ml', price: 2650000, stock: 15 }, { volume: '100ml', price: 3450000, stock: 12 } ],
    },
    {
      name: 'Chanel Coco Mademoiselle EDP', brand: 'Chanel', category: 'Nước hoa nữ', gender: 'female',
      fragranceFamily: 'Oriental', concentration: 'EDP', season: ['spring', 'autumn', 'winter'],
      description: 'Phuong Dong tuoi sang va quyen ru – bieu tuong cua phu nu Chanel.',
      images: ['https://picsum.photos/seed/coco/600/800'],
      notes: { top: ['Cam', 'Bergamot'], middle: ['Hoa hong', 'Hoa nhai'], base: ['Hoac huong', 'Vetiver'] },
      variants: [ { volume: '50ml', price: 2950000, stock: 10 }, { volume: '100ml', price: 4150000, stock: 8 } ],
    },
    {
      name: 'Versace Eros EDP', brand: 'Versace', category: 'Nước hoa nam', gender: 'male',
      fragranceFamily: 'Oriental', concentration: 'EDP', season: ['autumn', 'winter'],
      description: 'Cuong nhiet, hung manh va goi tinh – cam hung tu than tinh yeu Eros.',
      images: ['https://picsum.photos/seed/eros/600/800'],
      notes: { top: ['Bac ha', 'Tao xanh'], middle: ['Hoa tong ka', 'Nhai Sambac'], base: ['Vanilla', 'Cedar'] },
      variants: [ { volume: '50ml', price: 1950000, stock: 18 }, { volume: '100ml', price: 2850000, stock: 14 } ],
    },
  ];

  const createdVariants: any[] = [];
  const createdProducts: any[] = [];
  for (const p of products) {
    const slug = slugify(p.name);
    const product = await Product.create({
      name: p.name,
      slug,
      description: p.description,
      brand: brandMap.get(p.brand),
      category: catMap.get(p.category),
      images: p.images,
      gender: p.gender,
      fragranceFamily: p.fragranceFamily,
      concentration: p.concentration,
      season: p.season,
      notes: p.notes,
      isActive: true,
    });
    createdProducts.push(product);
    for (const v of p.variants) {
      const sku = slug.toUpperCase().replace(/-/g, '') + '-' + v.volume.toUpperCase();
      const variant = await Variant.create({
        product: product._id,
        sku,
        volume: v.volume,
        price: v.price,
        basePrice: v.price,
        costPrice: Math.round(v.price * 0.58),
        stock: v.stock,
        images: p.images.slice(0, 1),
        isActive: true,
      });
      await PriceHistory.create({
        variant: variant._id,
        basePrice: v.price,
        validFrom: variant.createdAt || new Date(),
        reason: 'Seed gia niem yet ban dau',
      });
      createdVariants.push(variant);
    }
    console.log(`   🌺 ${p.name} (${p.variants.length} bien the)`);
  }

  // 5) 1 DON HANG MAU + PAYMENT (khop order.model / payment.model)
  const customerId = userIds['mai.nguyen@gmail.com'];
  const v1 = createdVariants[0];
  const v2 = createdVariants[2];
  const items = [
    {
      variant: v1._id,
      name: createdProducts[0].name,
      volume: v1.volume,
      price: v1.price,
      basePrice: v1.basePrice ?? v1.price,
      finalPrice: v1.price,
      costPrice: v1.costPrice ?? 0,
      productDiscountAmount: 0,
      quantity: 1,
    },
    {
      variant: v2._id,
      name: createdProducts[1].name,
      volume: v2.volume,
      price: v2.price,
      basePrice: v2.basePrice ?? v2.price,
      finalPrice: v2.price,
      costPrice: v2.costPrice ?? 0,
      productDiscountAmount: 0,
      quantity: 2,
    },
  ];
  const total = items.reduce((s, it) => s + it.price * it.quantity, 0);
  const now = new Date();
  const order = await Order.create({
    user: customerId,
    items,
    subtotal: total,
    originalTotal: total,
    productLevelDiscount: 0,
    voucherDiscount: 0,
    shippingDiscount: 0,
    discount: 0,
    shippingFee: 0,
    tax: 0,
    total,
    status: 'done',
    address: {
      fullName: 'Nguyen Thi Mai',
      email: 'mai.nguyen@gmail.com',
      phone: '0902000001',
      line: '45 Tran Hung Dao',
      ward: 'Phuong Ben Nghe',
      district: 'Quan 1',
      province: 'TP. Ho Chi Minh',
      city: 'TP. Ho Chi Minh',
    },
    note: 'Giao trong gio hanh chinh',
    statusHistory: [
      { status: 'pending', at: now },
      { status: 'shipping', at: now },
      { status: 'done', at: now },
    ],
    processedAt: now,
    shippedAt: now,
    completedAt: now,
  });
  await Payment.create({
    order: order._id,
    method: 'bank_qr',
    status: 'paid',
    amount: total,
    receivedAmount: total,
    paidAt: now,
  });
  console.log('   🛍️  1 don hang mau + thanh toan');

  // 6) DANH GIA MAU
  await Review.create({
    product: createdProducts[0]._id,
    user: customerId,
    rating: 5,
    comment: 'Huong rat dep, luu ca ngay. San pham chinh hang, dong goi can than!',
    approved: true,
  });
  await Review.create({
    product: createdProducts[0]._id,
    guestName: 'Khach vang lai',
    guestEmail: 'guest@example.com',
    rating: 4,
    comment: 'Thom nhung luu huong hoi ngan hon mong doi mot chut.',
    approved: false,
  });
  console.log('   ⭐ 2 danh gia mau (1 cho duyet)');

  console.log(`\n🎉 SEED HOAN TAT!\n   Admin dang nhap: ${ADMIN_EMAIL} / ${ADMIN_PASS}`);
  await mongoose.connection.close();
  process.exit(0);
}

seed().catch(async (err) => {
  console.error('❌ SEED LOI:', err);
  await mongoose.connection.close();
  process.exit(1);
});
