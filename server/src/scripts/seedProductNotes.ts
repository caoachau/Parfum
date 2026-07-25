import mongoose from 'mongoose';
import { env } from '../config/env';
import { Product } from '../models/product.model';

const noteSets = [
  {
    top: ['Bergamot', 'Pink Pepper', 'Green Tea Leaf'],
    middle: ['Jasmine', 'Rose', 'White Clove'],
    base: ['Oud', 'Vanilla', 'Musk'],
  },
  {
    top: ['Lemon', 'Mandarin', 'Neroli'],
    middle: ['Orange Blossom', 'Lavender', 'Geranium'],
    base: ['Cedarwood', 'Amber', 'Tonka Bean'],
  },
  {
    top: ['Pear', 'Blackcurrant', 'Saffron'],
    middle: ['Iris', 'Violet', 'Peony'],
    base: ['Sandalwood', 'Patchouli', 'White Musk'],
  },
  {
    top: ['Cardamom', 'Ginger', 'Grapefruit'],
    middle: ['Cinnamon', 'Tobacco', 'Leather'],
    base: ['Vetiver', 'Guaiac Wood', 'Labdanum'],
  },
  {
    top: ['Sea Salt', 'Basil', 'Mint'],
    middle: ['Fig Leaf', 'Magnolia', 'Tea'],
    base: ['Cashmere Wood', 'Ambroxan', 'Oakmoss'],
  },
];

function hasNotes(product: any) {
  return Boolean(
    product.notes?.top?.length || product.notes?.middle?.length || product.notes?.base?.length,
  );
}

async function main() {
  await mongoose.connect(env.mongoUri);

  const products = await Product.find({}).select('name notes');
  let updated = 0;

  for (let index = 0; index < products.length; index += 1) {
    const product = products[index] as any;
    if (hasNotes(product)) continue;

    product.notes = noteSets[index % noteSets.length];
    await product.save();
    updated += 1;
    console.log(`Added notes: ${product.name}`);
  }

  console.log(`Hoàn tất. Đã cập nhật ${updated}/${products.length} sản phẩm.`);
  await mongoose.disconnect();
}

main().catch(async (error) => {
  console.error(error.message || error);
  await mongoose.disconnect().catch(() => undefined);
  process.exit(1);
});
