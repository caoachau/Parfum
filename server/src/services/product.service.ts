import { Product } from '../models/product.model';
import { escapeRegex } from '../utils/regex';
import { Variant } from '../models/variant.model';
import { Order } from '../models/order.model';
import { Review } from '../models/review.model';
import '../models/brand.model';
import '../models/category.model';
import { resolveVariantPrices } from './pricing-engine.service';

type ProductListQuery = {
  page?: string | number;
  limit?: string | number;
  search?: string;
  brand?: string | string[];
  category?: string | string[];
  gender?: string | string[];
  scent?: string | string[];
  fragranceFamily?: string | string[];
  note?: string | string[];
  excludeNote?: string | string[];
  match?: string;
  concentration?: string | string[];
  season?: string | string[];
  occasion?: string | string[];
  size?: string | string[];
  minPrice?: string | number;
  maxPrice?: string | number;
  sort?: string;
  discountedOnly?: string | boolean | number;
};

type ProductCard = {
  id: string;
  slug?: string;
  name: string;
  brand: string;
  category: string;
  description?: string;
  gender: string;
  fragranceFamily: string;
  concentration: string;
  season: string[];
  sizes: string[];
  variants?: {
    variantId: string;
    size: string;
    price: number | null;
    basePrice?: number | null;
    discountPercent?: number;
    promotionType?: string | null;
    promotionName?: string;
    stock: number;
  }[];
  image: string | null;
  images?: string[];
  price: number | null;
  basePrice?: number | null;
  discountPercent?: number;
  promotionType?: string | null;
  promotionName?: string;
  priceText: string;
  variantId: string | null;
  volume: string;
  stock: number;
  notes?: {
    top: string[];
    middle: string[];
    base: string[];
  };
  createdAt?: Date;
  soldCount: number;
  hasDiscount?: boolean;
  maxDiscountPercent?: number;
  ratingAverage?: number;
  ratingCount?: number;
  voteScore?: number;
};

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 12;
const MAX_LIMIT = 100;

function formatVnd(n?: number | null) {
  if (n == null) return 'Liên hệ';
  return n.toLocaleString('vi-VN') + 'đ';
}

function toNumber(value: unknown, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function toList(value: unknown) {
  if (Array.isArray(value)) {
    return value.flatMap((item) => String(item).split(','));
  }

  if (value == null || value === '') return [];

  return String(value).split(',');
}

function normalize(value: unknown) {
  return String(value ?? '')
    .trim()
    .toLowerCase();
}

function asStringArray(value: unknown) {
  if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean);
  if (value == null) return [];
  return String(value)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function firstText(value: unknown) {
  return asStringArray(value)[0] || '';
}

function scentFamiliesOf(product: any) {
  return asStringArray(product.fragranceFamily || product.fragranceFamilies || product.scentFamily);
}

function notesOf(product: any) {
  return {
    top: asStringArray(product.notes?.top?.length ? product.notes.top : product.topNotes),
    middle: asStringArray(product.notes?.middle?.length ? product.notes.middle : product.heartNotes || product.middleNotes),
    base: asStringArray(product.notes?.base?.length ? product.notes.base : product.baseNotes),
  };
}

function includesAny(value: string | undefined, filters: string[]) {
  if (filters.length === 0) return true;
  const normalizedValue = normalize(value);
  return filters.some((filter) => normalizedValue === normalize(filter));
}

function overlaps(values: string[] | undefined, filters: string[]) {
  if (filters.length === 0) return true;
  const normalizedValues = (values ?? []).map(normalize);
  return filters.some((filter) => normalizedValues.includes(normalize(filter)));
}

function matchesScentProfile(product: ProductCard, filters: string[]) {
  if (filters.length === 0) return true;

  // Bộ lọc Scent Profile lọc theo NHÓM HƯƠNG (fragranceFamily) của sản phẩm.
  // Trước đây còn khớp cả các nốt hương lẻ khiến kết quả không đúng với nhóm
  // hương người dùng chọn -> chỉ khớp theo fragranceFamily cho nhất quán.
  return overlaps(asStringArray(product.fragranceFamily), filters);
}

function sortProducts(products: ProductCard[], sort?: string) {
  const next = [...products];
  const newestTime = (product: ProductCard) =>
    product.createdAt ? new Date(product.createdAt).getTime() : 0;

  switch (sort) {
    case 'best_selling':
    case 'bestselling':
    case 'best_sellers':
      return next.sort(
        (a, b) => b.soldCount - a.soldCount || newestTime(b) - newestTime(a),
      );
    case 'rating':
    case 'votes':
    case 'top_rated':
    case 'featured':
      return next.sort(
        (a, b) =>
          (b.voteScore || 0) - (a.voteScore || 0) ||
          (b.ratingAverage || 0) - (a.ratingAverage || 0) ||
          (b.ratingCount || 0) - (a.ratingCount || 0) ||
          newestTime(b) - newestTime(a),
      );
    case 'price_asc':
    case 'priceAsc':
      return next.sort(
        (a, b) => (a.price ?? Number.MAX_SAFE_INTEGER) - (b.price ?? Number.MAX_SAFE_INTEGER),
      );
    case 'price_desc':
    case 'priceDesc':
      return next.sort((a, b) => (b.price ?? 0) - (a.price ?? 0));
    case 'discount':
    case 'discount_desc':
      return next.sort(
        (a, b) =>
          (b.maxDiscountPercent || b.discountPercent || 0) -
            (a.maxDiscountPercent || a.discountPercent || 0) ||
          newestTime(b) - newestTime(a),
      );
    case 'name_asc':
      return next.sort((a, b) => a.name.localeCompare(b.name));
    case 'name_desc':
      return next.sort((a, b) => b.name.localeCompare(a.name));
    case 'newest':
    default:
      return next.sort((a, b) => newestTime(b) - newestTime(a));
  }
}

/**
 * Lấy danh sách sản phẩm cho Shop.
 * Hỗ trợ filter, sort, pagination, lọc khoảng giá dựa trên giá variant rẻ nhất.
 */
export async function getProducts(query: ProductListQuery = {}) {
  const page = Math.max(1, Math.floor(toNumber(query.page, DEFAULT_PAGE)));
  const limit = Math.min(MAX_LIMIT, Math.max(1, Math.floor(toNumber(query.limit, DEFAULT_LIMIT))));
  const minPrice =
    query.minPrice === undefined ? undefined : Math.max(0, toNumber(query.minPrice, 0));
  const maxPrice =
    query.maxPrice === undefined ? undefined : Math.max(0, toNumber(query.maxPrice, 0));

  const search = normalize(query.search);
  const brandFilters = toList(query.brand);
  const categoryFilters = toList(query.category);
  const genderFilters = toList(query.gender);
  const scentFilters = [...toList(query.scent), ...toList(query.fragranceFamily)];
  const noteFilters = toList(query.note);
  const excludedNoteFilters = toList(query.excludeNote);
  const matchAnyPreference = normalize(query.match) === 'any';
  const concentrationFilters = toList(query.concentration);
  const seasonFilters = [...toList(query.season), ...toList(query.occasion)];
  const sizeFilters = toList(query.size);
  const discountedOnly = ['1', 'true', 'yes'].includes(String(query.discountedOnly || '').toLowerCase());

  const productQuery: Record<string, unknown> = { isActive: true };

  if (search) {
    const safe = escapeRegex(search);
    productQuery.name = { $regex: safe, $options: 'i' };
  }

  const products: any[] = await Product.find(productQuery)
    .populate('brand', 'name')
    .populate('category', 'name')
    .lean();

  const ids = products.map((product) => product._id);
  const variants: any[] = await Variant.find({ product: { $in: ids } }).lean();
  const productById = new Map(products.map((product) => [String(product._id), product]));
  variants.forEach((variant) => { variant._categoryId = productById.get(String(variant.product))?.category?._id; });
  const resolvedPrices = await resolveVariantPrices(variants);

  const isBestSellingSort = ['best_selling', 'bestselling', 'best_sellers'].includes(
    String(query.sort || '').toLowerCase(),
  );
  const isRatingSort = ['rating', 'votes', 'top_rated', 'featured'].includes(
    String(query.sort || '').toLowerCase(),
  );
  const salesByVariant = new Map<string, number>();
  if (isBestSellingSort) {
    const sales: any[] = await Order.aggregate([
      { $match: { status: { $in: ['paid', 'shipping', 'done'] } } },
      { $unwind: '$items' },
      { $group: { _id: '$items.variant', quantity: { $sum: '$items.quantity' } } },
    ]);
    for (const sale of sales) {
      if (sale._id) salesByVariant.set(String(sale._id), Number(sale.quantity) || 0);
    }
  }
  const reviewByProduct = new Map<string, { ratingAverage: number; ratingCount: number; voteScore: number }>();
  if (isRatingSort) {
    const reviews: any[] = await Review.aggregate([
      { $match: { approved: true, product: { $in: ids } } },
      {
        $group: {
          _id: '$product',
          ratingAverage: { $avg: '$rating' },
          ratingCount: { $sum: 1 },
          voteScore: { $sum: '$rating' },
        },
      },
    ]);
    for (const review of reviews) {
      reviewByProduct.set(String(review._id), {
        ratingAverage: Number(review.ratingAverage) || 0,
        ratingCount: Number(review.ratingCount) || 0,
        voteScore: Number(review.voteScore) || 0,
      });
    }
  }

  const byProduct: Record<string, any[]> = {};
  for (const variant of variants) {
    const key = String(variant.product);
    (byProduct[key] ||= []).push(variant);
  }

  const cards: ProductCard[] = products.map((product) => {
    const productVariants = byProduct[String(product._id)] || [];
    const cheapest = productVariants.reduce(
      (min: any, variant: any) => (min == null || resolvedPrices.get(String(variant._id))!.finalPrice < resolvedPrices.get(String(min._id))!.finalPrice ? variant : min),
      null as any,
    );
    const stock = productVariants.reduce(
      (sum: number, variant: any) => sum + (variant.stock || 0),
      0,
    );
    const sizes = Array.from(
      new Set(
        productVariants
          .map((variant: any) => variant.size || variant.volume)
          .filter((size: string | undefined) => Boolean(size)),
      ),
    );

    const variantPrices = productVariants.map((variant: any) => resolvedPrices.get(String(variant._id)));
    const hasDiscount = variantPrices.some((price) => Number(price?.discountPercent || 0) > 0);
    const maxDiscountPercent = variantPrices.reduce(
      (max, price) => Math.max(max, Number(price?.discountPercent || 0)),
      0,
    );
    const reviewStats = reviewByProduct.get(String(product._id)) || {
      ratingAverage: 0,
      ratingCount: 0,
      voteScore: 0,
    };

    return {
      id: String(product._id),
      slug: product.slug,
      name: product.name,
      brand: product.brand?.name || '',
      category: product.category?.name || '',
      description: product.description,
      gender: product.gender || '',
      fragranceFamily: scentFamiliesOf(product).join(', '),
      concentration: firstText(product.concentration),
      season: asStringArray(product.season),
      sizes,
      variants: productVariants
        .filter((v: any) => v.size || v.volume)
        .map((v: any) => ({
          variantId: String(v._id),
          size: v.size || v.volume || '',
          price: resolvedPrices.get(String(v._id))?.finalPrice ?? null,
          basePrice: resolvedPrices.get(String(v._id))?.basePrice ?? null,
          discountPercent: resolvedPrices.get(String(v._id))?.discountPercent || 0,
          promotionType: resolvedPrices.get(String(v._id))?.promotionType || null,
          promotionName: resolvedPrices.get(String(v._id))?.promotionName || '',
          stock: v.stock ?? 0,
        }))
        .sort((a: any, b: any) => (a.price ?? Infinity) - (b.price ?? Infinity)),
      image: product.images?.[0] || cheapest?.images?.[0] || null,
      images: product.images || [],
      price: cheapest ? resolvedPrices.get(String(cheapest._id))?.finalPrice ?? null : null,
      basePrice: cheapest ? resolvedPrices.get(String(cheapest._id))?.basePrice ?? null : null,
      discountPercent: cheapest ? resolvedPrices.get(String(cheapest._id))?.discountPercent || 0 : 0,
      promotionType: cheapest ? resolvedPrices.get(String(cheapest._id))?.promotionType || null : null,
      promotionName: cheapest ? resolvedPrices.get(String(cheapest._id))?.promotionName || '' : '',
      priceText: formatVnd(cheapest ? resolvedPrices.get(String(cheapest._id))?.finalPrice : null),
      variantId: cheapest ? String(cheapest._id) : null,
      volume: cheapest?.size || cheapest?.volume || '',
      stock,
      notes: {
        top: notesOf(product).top,
        middle: notesOf(product).middle,
        base: notesOf(product).base,
      },
      createdAt: product.createdAt,
      soldCount: productVariants.reduce(
        (sum: number, variant: any) => sum + (salesByVariant.get(String(variant._id)) || 0),
        0,
      ),
      hasDiscount,
      maxDiscountPercent,
      ratingAverage: reviewStats.ratingAverage,
      ratingCount: reviewStats.ratingCount,
      voteScore: reviewStats.voteScore,
    };
  });

  const filtered = cards.filter((product) => {
    const price = product.price ?? 0;
    const productNotes = [
      ...(product.notes?.top || []),
      ...(product.notes?.middle || []),
      ...(product.notes?.base || []),
    ];
    const hasPreferenceFilters = scentFilters.length > 0 || noteFilters.length > 0;
    const matchesSelectedScent =
      scentFilters.length > 0 && matchesScentProfile(product, scentFilters);
    const matchesSelectedNote =
      noteFilters.length > 0 && overlaps(productNotes, noteFilters);
    const matchesPreferences = matchAnyPreference
      ? !hasPreferenceFilters ||
        matchesSelectedScent ||
        matchesSelectedNote
      : matchesScentProfile(product, scentFilters) &&
        overlaps(productNotes, noteFilters);

    return (
      includesAny(product.brand, brandFilters) &&
      includesAny(product.category, categoryFilters) &&
      includesAny(product.gender, genderFilters) &&
      matchesPreferences &&
      !excludedNoteFilters.some((note) =>
        productNotes.some((productNote) => normalize(productNote) === normalize(note)),
      ) &&
      includesAny(product.concentration, concentrationFilters) &&
      overlaps(product.season, seasonFilters) &&
      overlaps(product.sizes, sizeFilters) &&
      (!discountedOnly || Boolean(product.hasDiscount)) &&
      (minPrice === undefined || price >= minPrice) &&
      (maxPrice === undefined || price <= maxPrice)
    );
  });

  const sorted = sortProducts(filtered, query.sort);
  const total = sorted.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const start = (page - 1) * limit;
  const data = sorted
    .slice(start, start + limit)
    .map(({ createdAt: _createdAt, ...product }) => product);

  return {
    data,
    total,
    page,
    limit,
    totalPages,
  };
}

export async function getProductDetail(idOrSlug: string) {
  const query = /^[0-9a-fA-F]{24}$/.test(idOrSlug) ? { _id: idOrSlug } : { slug: idOrSlug };

  const product: any = await Product.findOne(query as any)
    .populate('brand', 'name')
    .populate('category', 'name')
    .lean();

  if (!product) {
    throw Object.assign(new Error('Không tìm thấy sản phẩm'), { status: 404 });
  }

  const variants: any[] = await Variant.find({ product: product._id })
    .sort({ price: 1 })
    .lean();
  variants.forEach((variant) => { variant._categoryId = product.category?._id; });
  const resolvedPrices = await resolveVariantPrices(variants);

  const normalizedVariants = variants.map((variant) => ({
    id: String(variant._id),
    sku: variant.sku,
    size: variant.size || variant.volume || '',
    volume: variant.size || variant.volume || '',
    price: resolvedPrices.get(String(variant._id))?.finalPrice ?? variant.price,
    basePrice: resolvedPrices.get(String(variant._id))?.basePrice ?? variant.basePrice ?? variant.price,
    discountPercent: resolvedPrices.get(String(variant._id))?.discountPercent || 0,
    promotionType: resolvedPrices.get(String(variant._id))?.promotionType || null,
    promotionName: resolvedPrices.get(String(variant._id))?.promotionName || '',
    priceText: formatVnd(resolvedPrices.get(String(variant._id))?.finalPrice ?? variant.price),
    stock: variant.stock || 0,
    images: variant.images || [],
    isActive: variant.isActive !== false,
  }));

  const variantImages = normalizedVariants.flatMap((variant) => variant.images);
  const gallery = Array.from(new Set([...(product.images || []), ...variantImages]));
  const stock = normalizedVariants.reduce((sum, variant) => sum + (variant.stock || 0), 0);

  // Tong so luong da ban (dem tu cac don da thanh toan/giao/hoan tat) -> hien thi "Da ban" tren trang chi tiet.
  const variantIds = variants.map((variant) => variant._id);
  const soldAgg: any[] = await Order.aggregate([
    { $match: { status: { $in: ['paid', 'shipping', 'done'] } } },
    { $unwind: '$items' },
    { $match: { 'items.variant': { $in: variantIds } } },
    { $group: { _id: null, quantity: { $sum: '$items.quantity' } } },
  ]);
  const soldCount = Number(soldAgg[0]?.quantity) || 0;

  return {
    id: String(product._id),
    slug: product.slug || String(product._id),
    name: product.name,
    brand: product.brand?.name || '',
    category: product.category?.name || '',
    description: product.description || '',
    gender: product.gender || '',
    fragranceFamily: scentFamiliesOf(product).join(', '),
    concentration: firstText(product.concentration),
    season: asStringArray(product.season),
    gallery,
    images: gallery,
    notes: {
      top: notesOf(product).top,
      middle: notesOf(product).middle,
      base: notesOf(product).base,
    },
    variants: normalizedVariants,
    stock,
    soldCount,
    isActive: product.isActive !== false,
  };
}


/**
 * Lấy toàn bộ facet lọc (brand, nhóm mùi hương, nồng độ, size, giới tính, mùa, giá max)
 * tính trên TẤT CẢ sản phẩm đang active trong MongoDB (không giới hạn phân trang).
 * Dùng cho sidebar filter của trang Shop để luôn đồng bộ với dữ liệu thật.
 */
export async function getProductFilters() {
  const products: any[] = await Product.find({ isActive: true })
    .populate('brand', 'name')
    .populate('category', 'name')
    .lean();

  const ids = products.map((product) => product._id);
  const variants: any[] = await Variant.find({ product: { $in: ids } }).lean();
  const filterProductById = new Map(products.map((product) => [String(product._id), product]));
  variants.forEach((variant) => { variant._categoryId = filterProductById.get(String(variant.product))?.category?._id; });
  const filterPrices = await resolveVariantPrices(variants);

  const byProduct: Record<string, any[]> = {};
  for (const variant of variants) {
    (byProduct[String(variant.product)] ||= []).push(variant);
  }

  const brandSet = new Set<string>();
  const familySet = new Set<string>();
  const familyCardMap = new Map<string, { name: string; productCount: number; image: string }>();
  const noteNameByKey = new Map<string, string>();
  const noteCountByKey = new Map<string, number>();
  const concentrationSet = new Set<string>();
  const genderSet = new Set<string>();
  const seasonSet = new Set<string>();
  const categorySet = new Set<string>();
  const sizeSet = new Set<string>();
  let maxPrice = 0;
  let minPrice = Number.POSITIVE_INFINITY;
  const brandCounts: Record<string, number> = {};
  const productPrices: number[] = [];

  for (const product of products) {
    if (product.brand?.name) {
      const brandName = String(product.brand.name).trim();
      brandSet.add(brandName);
      brandCounts[brandName] = (brandCounts[brandName] || 0) + 1;
    }
    if (product.category?.name) categorySet.add(String(product.category.name).trim());
    const representativeImage =
      product.images?.find((image: unknown) => typeof image === 'string' && image.trim()) ||
      (byProduct[String(product._id)] || [])
        .flatMap((variant: any) => variant.images || [])
        .find((image: unknown) => typeof image === 'string' && image.trim()) ||
      '';
    for (const family of scentFamiliesOf(product)) {
      familySet.add(family);
      const key = normalize(family);
      const current = familyCardMap.get(key) || { name: family, productCount: 0, image: '' };
      current.productCount += 1;
      if (!current.image && representativeImage) current.image = String(representativeImage);
      familyCardMap.set(key, current);
    }
    const productNotes = [
      ...notesOf(product).top,
      ...notesOf(product).middle,
      ...notesOf(product).base,
    ];
    const productNoteKeys = new Set<string>();
    for (const note of productNotes) {
      const name = String(note || '').trim();
      const key = normalize(name);
      if (!key) continue;
      if (!noteNameByKey.has(key)) noteNameByKey.set(key, name);
      productNoteKeys.add(key);
    }
    for (const key of productNoteKeys) {
      noteCountByKey.set(key, (noteCountByKey.get(key) || 0) + 1);
    }
    for (const concentration of asStringArray(product.concentration)) concentrationSet.add(concentration);
    if (product.gender) genderSet.add(String(product.gender).trim());
    for (const season of asStringArray(product.season)) {
      if (season) seasonSet.add(String(season).trim());
    }

    let cheapest = Number.POSITIVE_INFINITY;
    for (const variant of byProduct[String(product._id)] || []) {
      const size = variant.size || variant.volume;
      if (size) sizeSet.add(String(size).trim());
      const displayPrice = filterPrices.get(String(variant._id))?.finalPrice ?? variant.price;
      if (typeof displayPrice === 'number') {
        if (displayPrice > maxPrice) maxPrice = displayPrice;
        if (displayPrice < cheapest) cheapest = displayPrice;
      }
    }
    if (cheapest !== Number.POSITIVE_INFINITY) {
      productPrices.push(cheapest);
      if (cheapest < minPrice) minPrice = cheapest;
    }
  }

  const PRICE_BUCKETS = 28;
  const priceLo = Number.isFinite(minPrice) ? minPrice : 0;
  const priceHi = maxPrice > priceLo ? maxPrice : priceLo + 1;
  const priceBuckets = new Array(PRICE_BUCKETS).fill(0);
  for (const value of productPrices) {
    let idx = Math.floor(((value - priceLo) / (priceHi - priceLo)) * PRICE_BUCKETS);
    if (idx < 0) idx = 0;
    if (idx >= PRICE_BUCKETS) idx = PRICE_BUCKETS - 1;
    priceBuckets[idx] += 1;
  }

  const alpha = (a: string, b: string) => a.localeCompare(b);
  const notes = Array.from(noteNameByKey.entries())
    .sort((left, right) => alpha(left[1], right[1]))
    .map(([, name]) => name);
  const noteCounts = Object.fromEntries(
    Array.from(noteNameByKey.entries()).map(([key, name]) => [
      name,
      noteCountByKey.get(key) || 0,
    ]),
  );
  const sizeNumber = (size: string) => {
    const match = size.match(/\d+(\.\d+)?/);
    return match ? Number(match[0]) : Number.MAX_SAFE_INTEGER;
  };

  return {
    brands: Array.from(brandSet).sort(alpha),
    fragranceFamilies: Array.from(familySet).sort(alpha),
    fragranceFamilyCards: Array.from(familyCardMap.values()).sort((a, b) => alpha(a.name, b.name)),
    notes,
    noteCounts,
    concentrations: Array.from(concentrationSet).sort(alpha),
    genders: Array.from(genderSet).sort(alpha),
    seasons: Array.from(seasonSet).sort(alpha),
    categories: Array.from(categorySet).sort(alpha),
    sizes: Array.from(sizeSet).sort((a, b) => sizeNumber(a) - sizeNumber(b) || alpha(a, b)),
    maxPrice,
    minPrice: Number.isFinite(minPrice) ? minPrice : 0,
    brandCounts,
    priceBuckets,
    total: products.length,
  };
}
