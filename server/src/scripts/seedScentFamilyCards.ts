import mongoose from 'mongoose';
import { cloudinary, CLOUDINARY_FOLDER } from '../config/cloudinary';
import { env } from '../config/env';
import '../models/brand.model';
import '../models/category.model';
import '../models/product.model';
import { ScentFamilyCard } from '../models/scentFamilyCard.model';
import { getProductFilters } from '../services/product.service';

const APPLY = process.argv.includes('--apply');
const ALIASES: Record<string, string> = { aromaatic: 'Aromatic' };

function keyOf(value: string) {
  return value.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function slugify(value: string) {
  return keyOf(value).replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

async function main() {
  await mongoose.connect(env.mongoUri);
  const filters: any = await getProductFilters();
  const merged = new Map<string, { name: string; image: string; productCount: number }>();

  for (const item of filters.fragranceFamilyCards || []) {
    const rawName = String(item.name || '').trim();
    if (!rawName) continue;
    const name = ALIASES[keyOf(rawName)] || rawName;
    const key = keyOf(name);
    const current = merged.get(key) || { name, image: '', productCount: 0 };
    current.productCount += Number(item.productCount || 0);
    if (!current.image || rawName === name) current.image = String(item.image || current.image);
    merged.set(key, current);
  }

  const families = Array.from(merged.values()).sort((a, b) => a.name.localeCompare(b.name, 'vi'));
  const existing = await ScentFamilyCard.find().select('name').lean();
  const existingNames = new Set(existing.map((item: any) => keyOf(item.name)));
  const pending = families.filter((item) => !existingNames.has(keyOf(item.name)));

  console.log(`Nhóm hương từ sản phẩm: ${families.length}`);
  console.log(`Đã có trong CRUD: ${existing.length}`);
  console.log(`Cần khởi tạo: ${pending.length}`);
  if (!APPLY) {
    console.log('Dry-run: thêm --apply để sao chép ảnh vào perfumeshop/brand và tạo dữ liệu.');
    return;
  }

  let created = 0;
  const errors: Array<{ name: string; message: string }> = [];
  for (let index = 0; index < pending.length; index += 1) {
    const family = pending[index];
    try {
      if (!family.image) throw new Error('Không tìm thấy ảnh đại diện từ sản phẩm');
      const uploaded: any = await cloudinary.uploader.upload(family.image, {
        asset_folder: `${CLOUDINARY_FOLDER}/brand`,
        public_id: `scent-family-${slugify(family.name)}`,
        overwrite: true,
        resource_type: 'image',
      });
      await ScentFamilyCard.create({
        name: family.name,
        image: uploaded.secure_url || uploaded.url,
        description: `Khám phá dấu ấn ${family.name} qua ${family.productCount} sáng tạo nước hoa trong bộ sưu tập.`,
        displayOrder: existing.length + index,
        isActive: true,
      });
      created += 1;
      console.log(`✓ ${family.name}`);
    } catch (error: any) {
      errors.push({ name: family.name, message: String(error?.message || error) });
      console.error(`✗ ${family.name}: ${error?.message || error}`);
    }
  }

  console.log(JSON.stringify({ created, failed: errors.length, errors }, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });

