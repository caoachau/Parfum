import mongoose from 'mongoose';
import { env } from '../config/env';
import '../models/brand.model';
import '../models/product.model';
import { Variant } from '../models/variant.model';

const APPLY_CHANGES = process.argv.includes('--apply');
const MISSING_COST_PRICE = {
  $or: [
    { costPrice: { $exists: false } },
    { costPrice: null },
    { costPrice: { $lte: 0 } },
  ],
};

type BrandSummary = {
  brand: string;
  percentage: number;
  variants: number;
};

// Tao ty le gia-von ngau nhien on dinh trong khoang 64-70% theo ten brand.
// Cung mot brand se luon nhan cung mot ty le khi script duoc chay lai.
function percentageForBrand(brandName: string) {
  let hash = 2166136261;
  for (const char of brandName.trim().toLocaleLowerCase('vi-VN')) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return 64 + ((hash >>> 0) % 7);
}

async function main() {
  await mongoose.connect(env.mongoUri);

  const totalVariants = await Variant.countDocuments();
  const variants: any[] = await Variant.find(MISSING_COST_PRICE)
    .select('_id sku price basePrice costPrice product')
    .populate({
      path: 'product',
      select: 'name brand',
      populate: { path: 'brand', select: 'name' },
    })
    .lean();
  console.log(`Tong bien the: ${totalVariants}. Bien the chua co gia von: ${variants.length}.`);

  const summaries = new Map<string, BrandSummary>();
  const operations: any[] = [];
  let fallbackBrandVariants = 0;
  let skippedInvalidPrice = 0;

  for (const variant of variants) {
    const savedBrandName = String(variant.product?.brand?.name || '').trim();
    const brandName = savedBrandName || 'Chua gan brand';
    if (!savedBrandName) fallbackBrandVariants += 1;

    const listPrice = Number(variant.basePrice ?? variant.price ?? 0);
    if (!Number.isFinite(listPrice) || listPrice <= 0) {
      skippedInvalidPrice += 1;
      continue;
    }

    const percentage = savedBrandName ? percentageForBrand(brandName) : 67;
    const costPrice = Math.max(1, Math.round(listPrice * percentage / 100));
    const summary = summaries.get(brandName) || {
      brand: brandName,
      percentage,
      variants: 0,
    };
    summary.variants += 1;
    summaries.set(brandName, summary);

    operations.push({
      updateOne: {
        filter: { _id: variant._id, ...MISSING_COST_PRICE },
        update: { $set: { costPrice } },
      },
    });
  }

  console.table(
    Array.from(summaries.values())
      .sort((a, b) => a.brand.localeCompare(b.brand, 'vi'))
      .map((item) => ({
        Brand: item.brand,
        'Ty le gia von': `${item.percentage}%`,
        'So bien the': item.variants,
      })),
  );

  if (!APPLY_CHANGES) {
    console.log(`DRY RUN: ${operations.length} bien the co the duoc cap nhat. Database chua thay doi.`);
    console.log('Chay lai voi --apply de ghi du lieu.');
  } else if (!operations.length) {
    console.log('Khong co bien the nao can cap nhat gia von.');
  } else {
    const result = await Variant.bulkWrite(operations, { ordered: false });
    console.log(`Da cap nhat gia von cho ${result.modifiedCount}/${operations.length} bien the.`);
  }

  if (fallbackBrandVariants) {
    console.warn(`Dung ty le du phong 67% cho ${fallbackBrandVariants} bien the co san pham chua gan brand.`);
  }
  if (skippedInvalidPrice) {
    console.warn(`Bo qua ${skippedInvalidPrice} bien the vi gia niem yet khong hop le.`);
  }
}

main()
  .catch((error) => {
    console.error(error?.message || error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect().catch(() => undefined);
  });
