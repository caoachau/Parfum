import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { env } from './src/config/env';

import { User } from './src/models/user.model';
import { Brand } from './src/models/brand.model';
import { Category } from './src/models/category.model';
import { Product } from './src/models/product.model';
import { Variant } from './src/models/variant.model';
import { Order } from './src/models/order.model';
import { Payment } from './src/models/payment.model';
import { Review } from './src/models/review.model';
import { Wishlist } from './src/models/wishlist.model';
import { Cart } from './src/models/cart.model';

// ==========================================================================
//  DỮ LIỆU SEED – sửa trực tiếp rồi chạy:  npm run seed
// ==========================================================================

// ---------- USERS -----------------------------------------------------------
const USERS = [
  {
    name: 'Admin L\'Essence Noire',
    email: 'admin@lessencenoire.vn',
    password: 'Admin@123',
    role: 'admin' as const,
    phone: '0901000001',
    isEmailVerified: true,
    loyaltyPoints: 0,
    scentProfile: {
      families: ['Woody', 'Oriental'],
      preferredNotes: ['Sandalwood', 'Oud', 'Bergamot'],
      dislikedNotes: [],
      intensity: 'strong',
      occasion: ['evening'],
    },
    addresses: [
      {
        label: 'Văn phòng',
        fullName: 'Admin L\'Essence Noire',
        phone: '0901000001',
        line: '123 Lê Lợi',
        ward: 'Phường Bến Nghé',
        district: 'Quận 1',
        province: 'TP. Hồ Chí Minh',
        isDefault: true,
      },
    ],
  },
  {
    name: 'Nguyễn Thị Mai',
    email: 'mai.nguyen@gmail.com',
    password: 'Customer@123',
    role: 'customer' as const,
    phone: '0902000001',
    isEmailVerified: true,
    loyaltyPoints: 350,
    scentProfile: {
      families: ['Floral', 'Chypre'],
      preferredNotes: ['Rose', 'Jasmine', 'Peach'],
      dislikedNotes: ['Tobacco', 'Leather'],
      intensity: 'moderate',
      occasion: ['daily', 'office'],
    },
    addresses: [
      {
        label: 'Nhà',
        fullName: 'Nguyễn Thị Mai',
        phone: '0902000001',
        line: '45 Trần Hưng Đạo',
        ward: 'Phường 5',
        district: 'Quận 5',
        province: 'TP. Hồ Chí Minh',
        isDefault: true,
      },
    ],
  },
  {
    name: 'Trần Minh Khoa',
    email: 'khoa.tran@outlook.com',
    password: 'Customer@123',
    role: 'customer' as const,
    phone: '0903000001',
    isEmailVerified: true,
    loyaltyPoints: 120,
    scentProfile: {
      families: ['Aquatic', 'Fougère'],
      preferredNotes: ['Sea Breeze', 'Mint', 'Citrus'],
      dislikedNotes: ['Musk', 'Heavy Oud'],
      intensity: 'light',
      occasion: ['daily', 'sport'],
    },
    addresses: [
      {
        label: 'Nhà',
        fullName: 'Trần Minh Khoa',
        phone: '0903000001',
        line: '12 Nguyễn Huệ',
        ward: 'Phường Bến Nghé',
        district: 'Quận 1',
        province: 'TP. Hồ Chí Minh',
        isDefault: true,
      },
    ],
  },
  {
    name: 'Lê Thị Hương',
    email: 'huong.le@yahoo.com',
    password: 'Customer@123',
    role: 'customer' as const,
    phone: '0904000001',
    isEmailVerified: false,
    loyaltyPoints: 80,
    scentProfile: {
      families: ['Oriental', 'Gourmand'],
      preferredNotes: ['Vanilla', 'Amber', 'Caramel'],
      dislikedNotes: ['Aquatic', 'Green'],
      intensity: 'strong',
      occasion: ['evening', 'wedding'],
    },
    addresses: [
      {
        label: 'Nhà',
        fullName: 'Lê Thị Hương',
        phone: '0904000001',
        line: '78 Đinh Tiên Hoàng',
        ward: 'Phường Đa Kao',
        district: 'Quận 1',
        province: 'TP. Hồ Chí Minh',
        isDefault: true,
      },
    ],
  },
];

// ---------- BRANDS ----------------------------------------------------------
const BRANDS = [
  {
    name: "L'Essence Noire",
    slug: 'lessence-noire',
    description: 'Thương hiệu nước hoa Việt Nam cao cấp, lấy cảm hứng từ bí ẩn và tinh tế của đêm tối phương Đông.',
    country: 'Vietnam',
    foundedYear: 2020,
    website: 'https://lessencenoire.vn',
    isActive: true,
    sortOrder: 1,
    meta: {
      title: "L'Essence Noire – Nước Hoa Cao Cấp Việt Nam",
      description: 'Khám phá bộ sưu tập nước hoa cao cấp L\'Essence Noire – nơi nghệ thuật và hương thơm giao thoa.',
      keywords: ['nước hoa Việt Nam', 'nước hoa cao cấp', "L'Essence Noire"],
    },
  },
  {
    name: 'Dior',
    slug: 'dior',
    description: 'Nhà mốt thời trang Pháp lừng danh với những chai nước hoa biểu tượng qua nhiều thập kỷ.',
    country: 'France',
    foundedYear: 1946,
    website: 'https://www.dior.com',
    isActive: true,
    sortOrder: 2,
    meta: {
      title: 'Nước Hoa Dior Chính Hãng',
      description: 'Mua nước hoa Dior chính hãng – Sauvage, Miss Dior, J\'adore và nhiều dòng hương đặc sắc khác.',
      keywords: ['Dior', 'nước hoa Dior', 'Sauvage', 'J\'adore'],
    },
  },
  {
    name: 'Chanel',
    slug: 'chanel',
    description: 'Biểu tượng thời trang và nước hoa của Pháp với hơn 100 năm lịch sử sang trọng.',
    country: 'France',
    foundedYear: 1910,
    website: 'https://www.chanel.com',
    isActive: true,
    sortOrder: 3,
    meta: {
      title: 'Nước Hoa Chanel Chính Hãng',
      description: 'Bộ sưu tập nước hoa Chanel chính hãng – Coco Mademoiselle, N°5, Bleu de Chanel.',
      keywords: ['Chanel', 'nước hoa Chanel', 'Coco Mademoiselle', 'N°5'],
    },
  },
  {
    name: 'Versace',
    slug: 'versace',
    description: 'Thương hiệu Ý táo bạo với những dòng hương nam tính và quyến rũ đặc trưng.',
    country: 'Italy',
    foundedYear: 1978,
    website: 'https://www.versace.com',
    isActive: true,
    sortOrder: 4,
    meta: {
      title: 'Nước Hoa Versace Chính Hãng',
      description: 'Mua nước hoa Versace chính hãng – Eros, Dylan Blue, Bright Crystal và nhiều hơn nữa.',
      keywords: ['Versace', 'nước hoa Versace', 'Eros', 'Dylan Blue'],
    },
  },
];

// ---------- CATEGORIES ------------------------------------------------------
const CATEGORIES = [
  {
    name: 'Nước hoa nam',
    slug: 'nuoc-hoa-nam',
    description: 'Bộ sưu tập nước hoa dành cho nam giới – từ tươi mát nhẹ nhàng đến gỗ ấm quyến rũ.',
    isActive: true,
    sortOrder: 1,
  },
  {
    name: 'Nước hoa nữ',
    slug: 'nuoc-hoa-nu',
    description: 'Bộ sưu tập nước hoa dành cho phái nữ – hoa cỏ tinh tế, phương Đông gợi cảm.',
    isActive: true,
    sortOrder: 2,
  },
  {
    name: 'Unisex',
    slug: 'unisex',
    description: 'Những chai nước hoa vượt giới hạn giới tính – phù hợp cho tất cả mọi người.',
    isActive: true,
    sortOrder: 3,
  },
  {
    name: 'Mini & Travel Size',
    slug: 'mini-travel-size',
    description: 'Nước hoa size nhỏ tiện mang theo – lý tưởng để thử hương hoặc du lịch.',
    isActive: true,
    sortOrder: 4,
  },
];

// ---------- PRODUCTS --------------------------------------------------------
const PRODUCTS = [
  // ---- L'Essence Noire ----
  {
    name: "Noir Intense",
    brand: "L'Essence Noire",
    category: 'Nước hoa nam',
    gender: 'male',
    concentration: 'EDP',
    scentFamily: ['Woody', 'Spicy', 'Oriental'],
    shortDescription: 'Hương gỗ ấm pha chút cay – nam tính, sang trọng, lưu hương lâu.',
    description: 'Noir Intense là kiệt tác mở đầu bộ sưu tập Dark Series của L\'Essence Noire. Khởi đầu với bergamot cam sánh kết cùng tiêu đen, dần chuyển sang trái tim nhục đậu khấu và hoa oải hương gợi cảm. Nốt cuối gỗ đàn hương và da thuộc tạo nên chiều sâu không thể quên.',
    images: [
      'https://picsum.photos/seed/noir-intense-1/600/800',
      'https://picsum.photos/seed/noir-intense-2/600/800',
      'https://picsum.photos/seed/noir-intense-3/600/800',
    ],
    notes: {
      top: ['Bergamot cam', 'Tiêu đen', 'Gừng'],
      middle: ['Hoa oải hương', 'Nhục đậu khấu', 'Hoa iris'],
      base: ['Gỗ đàn hương', 'Da thuộc', 'Hoắc hương', 'Ambrette'],
    },
    longevity: 8,
    sillage: 7,
    season: ['autumn', 'winter'],
    occasion: ['evening', 'office'],
    tags: ['best-seller', 'new-arrival'],
    isFeatured: true,
    isActive: true,
    meta: {
      title: 'Noir Intense EDP – L\'Essence Noire',
      description: 'Mua Noir Intense EDP chính hãng L\'Essence Noire. Hương gỗ ấm, cay nồng, lưu hương 8–10 giờ.',
      keywords: ['Noir Intense', "L'Essence Noire", 'nước hoa nam', 'EDP gỗ'],
    },
    variants: [
      { volume: '50ml', price: 1250000, compareAtPrice: 1450000, costPrice: 500000, stock: 30, weight: 250 },
      { volume: '100ml', price: 1950000, compareAtPrice: 2200000, costPrice: 750000, stock: 20, weight: 380 },
    ],
  },
  {
    name: 'Rose Blanche',
    brand: "L'Essence Noire",
    category: 'Nước hoa nữ',
    gender: 'female',
    concentration: 'EDP',
    scentFamily: ['Floral', 'Powdery'],
    shortDescription: 'Hoa hồng trắng tinh khôi – nữ tính, thanh lịch, nhẹ nhàng như làn sương sớm.',
    description: 'Rose Blanche gợi lên hình ảnh một khu vườn hoa hồng vào buổi bình minh. Quýt ngọt và lý chua đen mở đầu tươi sáng, nhường chỗ cho trái tim hoa hồng và hoa mẫu đơn rực rỡ. Xạ hương trắng và gỗ tuyết tùng tạo lớp nền ấm áp, thanh thoát.',
    images: [
      'https://picsum.photos/seed/rose-blanche-1/600/800',
      'https://picsum.photos/seed/rose-blanche-2/600/800',
    ],
    notes: {
      top: ['Quýt', 'Lý chua đen', 'Lê'],
      middle: ['Hoa hồng Damask', 'Hoa mẫu đơn', 'Hoa nhài'],
      base: ['Xạ hương trắng', 'Gỗ tuyết tùng', 'Vani nhẹ'],
    },
    longevity: 7,
    sillage: 6,
    season: ['spring', 'summer'],
    occasion: ['daily', 'office', 'wedding'],
    tags: ['best-seller'],
    isFeatured: true,
    isActive: true,
    meta: {
      title: 'Rose Blanche EDP – L\'Essence Noire',
      description: 'Nước hoa nữ Rose Blanche EDP – hoa hồng tinh khôi, phù hợp đi làm và các dịp đặc biệt.',
      keywords: ['Rose Blanche', "L'Essence Noire", 'nước hoa nữ', 'EDP hoa hồng'],
    },
    variants: [
      { volume: '30ml', price: 890000, compareAtPrice: null, costPrice: 350000, stock: 40, weight: 180 },
      { volume: '50ml', price: 1350000, compareAtPrice: 1500000, costPrice: 520000, stock: 25, weight: 260 },
    ],
  },
  {
    name: 'Aqua Unisex',
    brand: "L'Essence Noire",
    category: 'Unisex',
    gender: 'unisex',
    concentration: 'EDT',
    scentFamily: ['Aquatic', 'Citrus', 'Woody'],
    shortDescription: 'Hơi thở biển cả – tươi mát, tự do, hợp mọi giới tính.',
    description: 'Aqua Unisex là bản tình ca của biển và gió. Chanh Sicilia và bạc hà mở màn bùng nổ, dẫn vào trái tim hương biển và hoa sen tĩnh lặng. Nền xạ hương và gỗ nhẹ giúp hương lưu lại dịu dàng suốt cả ngày.',
    images: [
      'https://picsum.photos/seed/aqua-unisex-1/600/800',
      'https://picsum.photos/seed/aqua-unisex-2/600/800',
    ],
    notes: {
      top: ['Chanh Sicilia', 'Bạc hà', 'Cam xanh'],
      middle: ['Hương biển', 'Hoa sen', 'Dưa hấu'],
      base: ['Xạ hương trắng', 'Gỗ nhẹ', 'Ambergris'],
    },
    longevity: 5,
    sillage: 5,
    season: ['spring', 'summer'],
    occasion: ['daily', 'sport'],
    tags: ['new-arrival'],
    isFeatured: false,
    isActive: true,
    meta: {
      title: 'Aqua Unisex EDT – L\'Essence Noire',
      description: 'Nước hoa unisex Aqua EDT – tươi mát hương biển, phù hợp cho mọi dịp trong ngày.',
      keywords: ['Aqua Unisex', "L'Essence Noire", 'nước hoa unisex', 'EDT tươi mát'],
    },
    variants: [
      { volume: '50ml', price: 750000, compareAtPrice: null, costPrice: 290000, stock: 50, weight: 230 },
      { volume: '100ml', price: 1150000, compareAtPrice: 1300000, costPrice: 450000, stock: 35, weight: 360 },
    ],
  },
  {
    name: 'Velvet Oud',
    brand: "L'Essence Noire",
    category: 'Unisex',
    gender: 'unisex',
    concentration: 'Parfum',
    scentFamily: ['Oriental', 'Woody', 'Spicy'],
    shortDescription: 'Oud trầm mặc quyện cùng nhung lụa phương Đông – sang trọng tột đỉnh.',
    description: 'Velvet Oud là dòng hương đỉnh cao trong bộ sưu tập của L\'Essence Noire. Nốt đầu nghệ tây và hồng lam đặt nền cho trái tim oud Ả Rập đặc trưng hòa cùng hoa hồng Thổ Nhĩ Kỳ. Nốt cuối nhựa cây benzoin và hoắc hương tạo vệt hương ấm nóng, gợi cảm kéo dài hàng giờ.',
    images: [
      'https://picsum.photos/seed/velvet-oud-1/600/800',
      'https://picsum.photos/seed/velvet-oud-2/600/800',
    ],
    notes: {
      top: ['Nghệ tây', 'Hồng lam', 'Tiêu hồng'],
      middle: ['Oud Ả Rập', 'Hoa hồng Thổ Nhĩ Kỳ', 'Hoa nhài Sambac'],
      base: ['Nhựa benzoin', 'Hoắc hương', 'Gỗ đàn hương Mysore', 'Xạ hương đen'],
    },
    longevity: 10,
    sillage: 9,
    season: ['autumn', 'winter'],
    occasion: ['evening', 'wedding'],
    tags: ['limited', 'best-seller'],
    isFeatured: true,
    isActive: true,
    meta: {
      title: 'Velvet Oud Parfum – L\'Essence Noire',
      description: 'Nước hoa Velvet Oud Parfum – oud Ả Rập và nhung lụa phương Đông, lưu hương 12+ giờ.',
      keywords: ['Velvet Oud', "L'Essence Noire", 'nước hoa oud', 'Parfum', 'oriental'],
    },
    variants: [
      { volume: '50ml', price: 2850000, compareAtPrice: 3200000, costPrice: 1100000, stock: 15, weight: 290 },
      { volume: '100ml', price: 4950000, compareAtPrice: 5500000, costPrice: 1900000, stock: 8, weight: 430 },
    ],
  },
  // ---- Dior ----
  {
    name: 'Dior Sauvage EDP',
    brand: 'Dior',
    category: 'Nước hoa nam',
    gender: 'male',
    concentration: 'EDP',
    scentFamily: ['Fougère', 'Spicy', 'Woody'],
    shortDescription: 'Mạnh mẽ, hoang dã và quyến rũ – biểu tượng nước hoa nam hiện đại.',
    description: 'Dior Sauvage EDP là phiên bản đậm đà hơn của Sauvage huyền thoại. Bergamot tươi sáng kết hợp tiêu Sichuan tạo nốt đầu ấn tượng. Trái tim hoa oải hương và nhục đậu khấu mang lại chiều sâu khác biệt. Ambroxan và cedar làm nên vệt hương gỗ ấm đặc trưng của thương hiệu.',
    images: [
      'https://picsum.photos/seed/sauvage-edp-1/600/800',
      'https://picsum.photos/seed/sauvage-edp-2/600/800',
    ],
    notes: {
      top: ['Bergamot Calabria', 'Tiêu', 'Tiêu Sichuan'],
      middle: ['Hoa oải hương', 'Nhục đậu khấu', 'Hoa tiêu Sichuan'],
      base: ['Ambroxan', 'Cedar', 'Labdanum', 'Hoắc hương'],
    },
    longevity: 9,
    sillage: 8,
    season: ['autumn', 'winter', 'spring'],
    occasion: ['daily', 'evening', 'office'],
    tags: ['best-seller'],
    isFeatured: true,
    isActive: true,
    meta: {
      title: 'Dior Sauvage EDP Chính Hãng',
      description: 'Mua Dior Sauvage EDP chính hãng – biểu tượng nước hoa nam mạnh mẽ, hoang dã.',
      keywords: ['Dior Sauvage', 'Sauvage EDP', 'nước hoa Dior', 'nước hoa nam Dior'],
    },
    variants: [
      { volume: '60ml', price: 2650000, compareAtPrice: 3100000, costPrice: 1200000, stock: 15, weight: 310 },
      { volume: '100ml', price: 3450000, compareAtPrice: 4000000, costPrice: 1600000, stock: 12, weight: 430 },
    ],
  },
  {
    name: "Dior J'adore EDP",
    brand: 'Dior',
    category: 'Nước hoa nữ',
    gender: 'female',
    concentration: 'EDP',
    scentFamily: ['Floral', 'Powdery'],
    shortDescription: "Biểu tượng nước hoa nữ – hoa cỏ nước Pháp thanh lịch và đẳng cấp.",
    description: "J'adore là tuyên ngôn về sắc đẹp và sự tự tin của người phụ nữ hiện đại. Hoa nhài Grasse, hoa hồng Centifolia và ylang-ylang kết hợp trong một giao hưởng hoa cỏ đỉnh cao, được đặt trên nền xạ hương và hoắc hương nhẹ nhàng.",
    images: [
      'https://picsum.photos/seed/jadore-1/600/800',
      'https://picsum.photos/seed/jadore-2/600/800',
    ],
    notes: {
      top: ['Hoa cam', 'Quả đào', 'Melon'],
      middle: ['Hoa nhài Grasse', 'Hoa hồng Centifolia', 'Ylang-ylang'],
      base: ['Xạ hương', 'Gỗ đàn hương', 'Hoắc hương nhẹ'],
    },
    longevity: 7,
    sillage: 7,
    season: ['spring', 'summer', 'autumn'],
    occasion: ['daily', 'evening', 'wedding'],
    tags: ['best-seller'],
    isFeatured: false,
    isActive: true,
    meta: {
      title: "Dior J'adore EDP Chính Hãng",
      description: "Mua Dior J'adore EDP chính hãng – hương hoa cỏ Pháp thanh lịch cho phái nữ.",
      keywords: ["J'adore", 'Dior Jadore', 'nước hoa Dior nữ', 'EDP floral'],
    },
    variants: [
      { volume: '50ml', price: 2950000, compareAtPrice: 3400000, costPrice: 1350000, stock: 10, weight: 280 },
      { volume: '100ml', price: 4350000, compareAtPrice: 4900000, costPrice: 2000000, stock: 7, weight: 410 },
    ],
  },
  // ---- Chanel ----
  {
    name: 'Chanel Coco Mademoiselle EDP',
    brand: 'Chanel',
    category: 'Nước hoa nữ',
    gender: 'female',
    concentration: 'EDP',
    scentFamily: ['Oriental', 'Floral', 'Chypre'],
    shortDescription: 'Phương Đông tươi sáng và quyến rũ – biểu tượng của người phụ nữ Chanel hiện đại.',
    description: 'Coco Mademoiselle kể câu chuyện về người phụ nữ tự do, mạnh mẽ và gợi cảm. Cam, quýt và bergamot khai mở sáng rực, dần dịu xuống với hoa hồng và hoa nhài ấm áp. Nốt cuối vetiver và hoắc hương mang lại chiều sâu bí ẩn đặc trưng.',
    images: [
      'https://picsum.photos/seed/coco-mademoiselle-1/600/800',
      'https://picsum.photos/seed/coco-mademoiselle-2/600/800',
    ],
    notes: {
      top: ['Cam', 'Quýt', 'Bergamot'],
      middle: ['Hoa hồng', 'Hoa nhài', 'Vải thiều'],
      base: ['Hoắc hương', 'Xạ hương trắng', 'Vetiver'],
    },
    longevity: 8,
    sillage: 7,
    season: ['spring', 'autumn', 'winter'],
    occasion: ['daily', 'evening', 'office'],
    tags: ['best-seller'],
    isFeatured: true,
    isActive: true,
    meta: {
      title: 'Chanel Coco Mademoiselle EDP Chính Hãng',
      description: 'Mua Chanel Coco Mademoiselle EDP chính hãng – nước hoa nữ biểu tượng của Chanel.',
      keywords: ['Coco Mademoiselle', 'Chanel nữ', 'nước hoa Chanel', 'EDP oriental'],
    },
    variants: [
      { volume: '50ml', price: 2950000, compareAtPrice: 3500000, costPrice: 1400000, stock: 10, weight: 290 },
      { volume: '100ml', price: 4150000, compareAtPrice: 4900000, costPrice: 1950000, stock: 8, weight: 430 },
    ],
  },
  {
    name: 'Bleu de Chanel EDP',
    brand: 'Chanel',
    category: 'Nước hoa nam',
    gender: 'male',
    concentration: 'EDP',
    scentFamily: ['Woody', 'Aromatic'],
    shortDescription: 'Tự do – sảng khoái – thanh lịch. Dành cho người đàn ông không bị ràng buộc.',
    description: 'Bleu de Chanel EDP là sự tiến hóa tinh tế của EDT huyền thoại. Cam chanh tươi sáng mở đầu quyến rũ, nhường chỗ cho trái tim hoa nhài và tiêu hồng phức tạp. Gỗ đàn hương và gỗ tuyết tùng White tạo nên nền gỗ ấm sang trọng, bền bỉ.',
    images: [
      'https://picsum.photos/seed/bleu-chanel-1/600/800',
      'https://picsum.photos/seed/bleu-chanel-2/600/800',
    ],
    notes: {
      top: ['Chanh', 'Cam chanh', 'Gừng'],
      middle: ['Hoa nhài', 'Tiêu hồng', 'Hoa oải hương'],
      base: ['Gỗ đàn hương', 'Gỗ tuyết tùng White', 'Xạ hương', 'Vetiver'],
    },
    longevity: 8,
    sillage: 7,
    season: ['autumn', 'winter', 'spring'],
    occasion: ['daily', 'office', 'evening'],
    tags: ['best-seller'],
    isFeatured: false,
    isActive: true,
    meta: {
      title: 'Bleu de Chanel EDP Chính Hãng',
      description: 'Mua Bleu de Chanel EDP chính hãng – nước hoa nam gỗ thơm thanh lịch của Chanel.',
      keywords: ['Bleu de Chanel', 'Chanel nam', 'nước hoa Chanel nam', 'EDP woody'],
    },
    variants: [
      { volume: '50ml', price: 2750000, compareAtPrice: 3200000, costPrice: 1300000, stock: 12, weight: 280 },
      { volume: '100ml', price: 3950000, compareAtPrice: 4600000, costPrice: 1850000, stock: 9, weight: 420 },
    ],
  },
  // ---- Versace ----
  {
    name: 'Versace Eros EDP',
    brand: 'Versace',
    category: 'Nước hoa nam',
    gender: 'male',
    concentration: 'EDP',
    scentFamily: ['Oriental', 'Woody', 'Fougère'],
    shortDescription: 'Lấy cảm hứng từ thần tình yêu Eros – cuồng nhiệt, hùng mạnh và gợi tình.',
    description: 'Versace Eros EDP là phiên bản mạnh mẽ hơn, gợi cảm hơn so với EDT. Bạc hà và táo xanh mở màn cực kỳ tươi mát, dần ấm lên với hoa tông ka và hoa nhài Sambac. Vanilla, hoắc hương và gỗ Atlas cedar tạo nên sức hút không thể cưỡng lại.',
    images: [
      'https://picsum.photos/seed/versace-eros-1/600/800',
      'https://picsum.photos/seed/versace-eros-2/600/800',
    ],
    notes: {
      top: ['Bạc hà', 'Táo xanh', 'Chanh'],
      middle: ['Hoa tông ka', 'Hoa nhài Sambac', 'Geranium'],
      base: ['Vanilla', 'Hoắc hương', 'Atlas cedar', 'Oakmoss'],
    },
    longevity: 9,
    sillage: 9,
    season: ['autumn', 'winter'],
    occasion: ['evening', 'sport'],
    tags: ['new-arrival'],
    isFeatured: false,
    isActive: true,
    meta: {
      title: 'Versace Eros EDP Chính Hãng',
      description: 'Mua Versace Eros EDP chính hãng – nước hoa nam cuồng nhiệt và quyến rũ.',
      keywords: ['Versace Eros', 'Eros EDP', 'nước hoa Versace', 'nước hoa nam oriental'],
    },
    variants: [
      { volume: '50ml', price: 1950000, compareAtPrice: 2300000, costPrice: 900000, stock: 18, weight: 270 },
      { volume: '100ml', price: 2850000, compareAtPrice: 3200000, costPrice: 1300000, stock: 14, weight: 400 },
    ],
  },
  {
    name: 'Versace Bright Crystal EDT',
    brand: 'Versace',
    category: 'Nước hoa nữ',
    gender: 'female',
    concentration: 'EDT',
    scentFamily: ['Floral', 'Fruity', 'Aquatic'],
    shortDescription: 'Trong sáng như pha lê – nữ tính, dịu dàng và tinh tế.',
    description: 'Bright Crystal là hương hoa cỏ trái cây duyên dáng và trong trẻo. Lựu và yuzu mở màn tươi sáng, trái tim hoa mẫu đơn và hoa mộc lan dịu dàng. Nền xạ hương và gỗ mộc đắm tạo sự kết thúc ấm áp, thanh thoát.',
    images: [
      'https://picsum.photos/seed/bright-crystal-1/600/800',
      'https://picsum.photos/seed/bright-crystal-2/600/800',
    ],
    notes: {
      top: ['Lựu', 'Yuzu', 'Ớt chuông'],
      middle: ['Hoa mẫu đơn', 'Hoa mộc lan', 'Hoa sen'],
      base: ['Xạ hương', 'Gỗ mộc đắm', 'Hổ phách'],
    },
    longevity: 6,
    sillage: 5,
    season: ['spring', 'summer'],
    occasion: ['daily', 'office'],
    tags: [],
    isFeatured: false,
    isActive: true,
    meta: {
      title: 'Versace Bright Crystal EDT Chính Hãng',
      description: 'Mua Versace Bright Crystal EDT chính hãng – nước hoa nữ dịu dàng, trong trẻo.',
      keywords: ['Bright Crystal', 'Versace nữ', 'nước hoa Versace', 'EDT floral'],
    },
    variants: [
      { volume: '50ml', price: 1650000, compareAtPrice: 1900000, costPrice: 750000, stock: 22, weight: 260 },
      { volume: '90ml', price: 2250000, compareAtPrice: 2600000, costPrice: 1050000, stock: 16, weight: 380 },
    ],
  },
];

// ---------- REVIEWS TEMPLATE ------------------------------------------------
// Dùng sau khi có productId
const REVIEW_TEMPLATES = [
  {
    rating: 5,
    title: 'Tuyệt vời, vượt ngoài mong đợi!',
    comment: 'Mình đã dùng nhiều nước hoa nhưng đây thực sự là lần đầu mình bị "đánh gục" ngay từ xịt đầu tiên. Hương rất đặc biệt, lưu cả ngày mà không bị khó chịu. Gói hàng cẩn thận, giao nhanh. Sẽ quay lại mua tiếp!',
    helpfulCount: 24,
    isVerifiedPurchase: true,
    isApproved: true,
  },
  {
    rating: 4,
    title: 'Thơm, nhưng lưu hương hơi ngắn hơn mong đợi',
    comment: 'Hương rất đẹp, đúng với mô tả. Tuy nhiên sau khoảng 4-5 tiếng thì mình không còn ngửi thấy rõ nữa. Có thể do da mình khô nên hương bay nhanh. Về tổng thể vẫn rất hài lòng với sản phẩm.',
    helpfulCount: 11,
    isVerifiedPurchase: true,
    isApproved: true,
  },
  {
    rating: 5,
    title: 'Chính hãng, giá tốt, dịch vụ xuất sắc',
    comment: 'Đã check seal và QR code – hoàn toàn chính hãng. Giá rẻ hơn nhiều so với mua tại cửa hàng. Nhân viên tư vấn nhiệt tình, đóng gói kỹ, không bị vỡ hay rò rỉ. 10/10 sẽ recommend cho bạn bè.',
    helpfulCount: 18,
    isVerifiedPurchase: true,
    isApproved: true,
  },
];

// ==========================================================================
//  UTILITIES
// ==========================================================================

function slugify(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function generateOrderCode(): string {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
  const rand = String(Math.floor(Math.random() * 9000) + 1000);
  return `ORD-${dateStr}-${rand}`;
}

// ==========================================================================
//  SEED
// ==========================================================================

async function seed() {
  await mongoose.connect(env.mongoUri);
  console.log('✅ Đã kết nối MongoDB:', env.mongoUri);

  // 1) USERS – upsert theo email
  console.log('\n📦 Seeding users...');
  const userDocs: Record<string, mongoose.Types.ObjectId> = {};
  for (const u of USERS) {
    const email = u.email.toLowerCase();
    const password = await bcrypt.hash(u.password, 10);
    const doc = await User.findOneAndUpdate(
      { email },
      {
        $set: {
          name: u.name,
          email,
          password,
          role: u.role,
          phone: u.phone,
          isEmailVerified: u.isEmailVerified,
          loyaltyPoints: u.loyaltyPoints,
          scentProfile: u.scentProfile,
          addresses: u.addresses,
        },
      },
      { upsert: true, new: true },
    );
    userDocs[email] = doc!._id as mongoose.Types.ObjectId;
    console.log(`   👤 ${email} (${u.role})`);
  }

  // 2) Xoá sạch catalog (giữ nguyên users)
  console.log('\n🗑️  Xoá catalog cũ...');
  await Promise.all([
    Brand.deleteMany({}),
    Category.deleteMany({}),
    Product.deleteMany({}),
    Variant.deleteMany({}),
    Order.deleteMany({}),
    Payment.deleteMany({}),
    Review.deleteMany({}),
    Wishlist.deleteMany({}),
    Cart.deleteMany({}),
  ]);

  // 3) BRANDS
  console.log('\n🏷️  Seeding brands...');
  const brandDocs = await Brand.insertMany(BRANDS);
  const brandMap = new Map(brandDocs.map((b) => [b.name as string, b._id as mongoose.Types.ObjectId]));
  console.log(`   ✅ ${brandDocs.length} brands`);

  // 4) CATEGORIES
  console.log('\n📂 Seeding categories...');
  const categoryDocs = await Category.insertMany(CATEGORIES);
  const catMap = new Map(categoryDocs.map((c) => [c.name as string, c._id as mongoose.Types.ObjectId]));
  console.log(`   ✅ ${categoryDocs.length} categories`);

  // 5) PRODUCTS + VARIANTS
  console.log('\n🌸 Seeding products & variants...');
  const productIds: mongoose.Types.ObjectId[] = [];
  const variantIds: mongoose.Types.ObjectId[] = [];

  for (const p of PRODUCTS) {
    const slug = slugify(p.name);
    const brandId = brandMap.get(p.brand);
    const categoryId = catMap.get(p.category);
    if (!brandId) throw new Error('Brand không tìm thấy: ' + p.brand);
    if (!categoryId) throw new Error('Category không tìm thấy: ' + p.category);

    const { variants: variantData, ...productData } = p;

    const product = await Product.create({
      ...productData,
      slug,
      brand: brandId,
      category: categoryId,
      rating: { average: 0, count: 0, distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } },
      soldCount: Math.floor(Math.random() * 200),
      viewCount: Math.floor(Math.random() * 2000) + 100,
    });
    productIds.push(product._id as mongoose.Types.ObjectId);

    for (const v of variantData) {
      const sku = slug.toUpperCase().replace(/-/g, '') + '-' + v.volume.toUpperCase().replace(/\s/g, '');
      const variant = await Variant.create({
        product: product._id,
        sku,
        volume: v.volume,
        price: v.price,
        compareAtPrice: v.compareAtPrice ?? undefined,
        costPrice: v.costPrice,
        stock: v.stock,
        lowStockThreshold: 5,
        images: product.images.slice(0, 1),
        weight: v.weight,
        isActive: true,
      });
      variantIds.push(variant._id as mongoose.Types.ObjectId);
    }
    console.log(`   🌺 ${p.name} (${variantData.length} variants)`);
  }

  // 6) ORDERS + PAYMENTS
  console.log('\n📦 Seeding orders...');
  const customerEmails = USERS.filter((u) => u.role === 'customer').map((u) => u.email);

  // Lấy variants để tạo order mẫu
  const allVariants = await Variant.find({}).populate('product');
  const sampleVariants = allVariants.slice(0, 6);

  for (let i = 0; i < customerEmails.length; i++) {
    const userId = userDocs[customerEmails[i]];
    if (!userId) continue;

    // Mỗi customer: 1 đơn đã giao + 1 đơn đang xử lý
    const ordersForUser = [
      {
        status: 'delivered' as const,
        paymentStatus: 'paid' as const,
        paymentMethod: 'bank_qr' as const,
        daysAgo: 30,
      },
      {
        status: 'processing' as const,
        paymentStatus: 'paid' as const,
        paymentMethod: 'momo' as const,
        daysAgo: 3,
      },
    ];

    for (const orderConfig of ordersForUser) {
      const pickedVariants = sampleVariants.slice(i % sampleVariants.length, (i % sampleVariants.length) + 2);
      const items = pickedVariants.map((v: any) => ({
        variant: v._id,
        product: v.product._id,
        sku: v.sku,
        productName: v.product.name,
        volume: v.volume,
        image: v.images?.[0] ?? '',
        price: v.price,
        quantity: Math.floor(Math.random() * 2) + 1,
        subtotal: v.price * (Math.floor(Math.random() * 2) + 1),
      }));

      const subtotal = items.reduce((sum: number, it: any) => sum + it.subtotal, 0);
      const shippingFee = subtotal > 1000000 ? 0 : 35000;
      const total = subtotal + shippingFee;
      const createdAt = new Date(Date.now() - orderConfig.daysAgo * 24 * 60 * 60 * 1000);

      const order = (await Order.create({
        orderCode: generateOrderCode(),
        user: userId,
        items,
        shippingAddress: {
          fullName: USERS.find((u) => u.email === customerEmails[i])?.name ?? '',
          phone: USERS.find((u) => u.email === customerEmails[i])?.phone ?? '',
          line: USERS.find((u) => u.email === customerEmails[i])?.addresses?.[0]?.line ?? '',
          ward: USERS.find((u) => u.email === customerEmails[i])?.addresses?.[0]?.ward ?? '',
          district: USERS.find((u) => u.email === customerEmails[i])?.addresses?.[0]?.district ?? '',
          province: USERS.find((u) => u.email === customerEmails[i])?.addresses?.[0]?.province ?? '',
        },
        subtotal,
        shippingFee,
        total,
        status: orderConfig.status,
        paymentMethod: orderConfig.paymentMethod,
        paymentStatus: orderConfig.paymentStatus,
        shippingProvider: 'GHN',
        trackingCode: orderConfig.status === 'delivered' ? 'GHN' + Math.random().toString(36).slice(2, 10).toUpperCase() : undefined,
        deliveredAt: orderConfig.status === 'delivered' ? new Date(createdAt.getTime() + 5 * 24 * 60 * 60 * 1000) : undefined,
        createdAt,
      })) as any;

      // Tạo payment tương ứng
      await Payment.create({
        order: order._id,
        user: userId,
        method: orderConfig.paymentMethod,
        status: orderConfig.paymentStatus === 'paid' ? 'paid' : 'pending',
        amount: total,
        currency: 'VND',
        transactionRef: orderConfig.paymentStatus === 'paid' ? 'TXN-' + Math.random().toString(36).slice(2, 12).toUpperCase() : undefined,
        paidAt: orderConfig.paymentStatus === 'paid' ? new Date(createdAt.getTime() + 30 * 60 * 1000) : undefined,
      });

      console.log(`   🛍️  Order ${order.orderCode} (${orderConfig.status}) – user: ${customerEmails[i]}`);
    }
  }

  // 7) REVIEWS
  console.log('\n⭐ Seeding reviews...');
  const customerUserIds = customerEmails.map((e) => userDocs[e]).filter(Boolean);
  let reviewCount = 0;

  for (let pIdx = 0; pIdx < Math.min(productIds.length, 6); pIdx++) {
    const productId = productIds[pIdx];
    const ratingSum = { total: 0, count: 0, dist: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } as Record<number, number> };

    for (let rIdx = 0; rIdx < Math.min(REVIEW_TEMPLATES.length, customerUserIds.length); rIdx++) {
      const tmpl = REVIEW_TEMPLATES[rIdx % REVIEW_TEMPLATES.length];
      await Review.create({
        product: productId,
        user: customerUserIds[rIdx % customerUserIds.length],
        rating: tmpl.rating,
        title: tmpl.title,
        comment: tmpl.comment,
        isVerifiedPurchase: tmpl.isVerifiedPurchase,
        isApproved: tmpl.isApproved,
        helpfulCount: tmpl.helpfulCount,
        createdAt: new Date(Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000),
      });
      ratingSum.total += tmpl.rating;
      ratingSum.count++;
      ratingSum.dist[tmpl.rating] = (ratingSum.dist[tmpl.rating] ?? 0) + 1;
      reviewCount++;
    }

    // Cập nhật rating aggregate trên product
    await Product.findByIdAndUpdate(productId, {
      'rating.average': Math.round((ratingSum.total / ratingSum.count) * 10) / 10,
      'rating.count': ratingSum.count,
      'rating.distribution': ratingSum.dist,
    });
  }
  console.log(`   ✅ ${reviewCount} reviews`);

  // 8) WISHLISTS
  console.log('\n💛 Seeding wishlists...');
  for (let i = 0; i < customerUserIds.length; i++) {
    const items = productIds
      .filter((_, idx) => idx % (i + 1) === 0)
      .slice(0, 4)
      .map((product) => ({ product, addedAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000) }));

    if (items.length > 0) {
      await Wishlist.create({ user: customerUserIds[i], items });
      console.log(`   💛 Wishlist (${items.length} sản phẩm) – ${customerEmails[i]}`);
    }
  }

  // 9) CARTS
  console.log('\n🛒 Seeding carts...');
  for (let i = 0; i < customerUserIds.length; i++) {
    const pickedVariants = allVariants.slice(i, i + 2);
    if (pickedVariants.length === 0) continue;

    await Cart.create({
      user: customerUserIds[i],
      items: pickedVariants.map((v: any) => ({
        variant: v._id,
        product: v.product._id,
        quantity: 1,
        priceAtAdd: v.price,
      })),
    });
    console.log(`   🛒 Cart (${pickedVariants.length} items) – ${customerEmails[i]}`);
  }

  // ---- TỔNG KẾT ----
  console.log(`
╔══════════════════════════════════════════════╗
║             SEED HOÀN TẤT 🎉                ║
╠══════════════════════════════════════════════╣
║  👤 Users       : ${USERS.length.toString().padEnd(27)}║
║  🏷️  Brands      : ${BRANDS.length.toString().padEnd(27)}║
║  📂 Categories  : ${CATEGORIES.length.toString().padEnd(27)}║
║  🌸 Products    : ${PRODUCTS.length.toString().padEnd(27)}║
║  📦 Variants    : ${variantIds.length.toString().padEnd(27)}║
║  🛍️  Orders      : ${(customerEmails.length * 2).toString().padEnd(27)}║
║  💳 Payments    : ${(customerEmails.length * 2).toString().padEnd(27)}║
║  ⭐ Reviews     : ${reviewCount.toString().padEnd(27)}║
╚══════════════════════════════════════════════╝`);

  await mongoose.connection.close();
  process.exit(0);
}

seed().catch(async (err) => {
  console.error('❌ SEED LỖI:', err);
  await mongoose.connection.close();
  process.exit(1);
});
