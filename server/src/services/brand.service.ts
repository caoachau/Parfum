import { Product } from '../models/product.model';
import { Brand } from '../models/brand.model';

function normalizeBrand(brand: any, productCount = 0) {
  return {
    id: String(brand._id),
    name: brand.name,
    slug: brand.slug || '',
    description: brand.description || '',
    logo: brand.logo || '',
    heroImage: brand.heroImage || '',
    viewCollectionUrl: brand.viewCollectionUrl || '',
    journalUrl: brand.journalUrl || '',
    isPublished: brand.isPublished !== false,
    country: brand.country || '',
    website: brand.website || '',
    foundedYear: brand.foundedYear || null,
    isFeatured: Boolean(brand.isFeatured),
    productCount,
    createdAt: brand.createdAt,
    updatedAt: brand.updatedAt,
  };
}

export const getBrands = async (options: { featuredOnly?: boolean } = {}) => {
  const filter: Record<string, unknown> = { isPublished: { $ne: false } };
  if (options.featuredOnly) filter.isFeatured = true;
  const brands = await Brand.find(filter).sort({ name: 1 }).lean();
  const counts: any[] = await Product.aggregate([
    { $match: { brand: { $ne: null } } },
    { $group: { _id: '$brand', count: { $sum: 1 } } },
  ]);
  const countMap = new Map(counts.map((count) => [String(count._id), count.count]));

  return brands.map((brand: any) =>
    normalizeBrand(brand, countMap.get(String(brand._id)) || 0),
  );
};
