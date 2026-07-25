import { ScentFamilyCard } from '../models/scentFamilyCard.model';

function httpError(message: string, status = 400) {
  return Object.assign(new Error(message), { status });
}

function normalize(item: any) {
  return {
    id: String(item._id),
    name: item.name,
    image: item.image,
    description: item.description || '',
    displayOrder: Number(item.displayOrder || 0),
    isActive: item.isActive !== false,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
}

export async function listPublic() {
  const rows = await ScentFamilyCard.find({ isActive: { $ne: false } })
    .sort({ displayOrder: 1, name: 1 })
    .lean();
  return rows.map(normalize);
}

export async function listAdmin() {
  const rows = await ScentFamilyCard.find().sort({ displayOrder: 1, name: 1 }).lean();
  return rows.map(normalize);
}

export async function create(input: any) {
  const name = String(input.name || '').trim();
  const image = String(input.image || '').trim();
  if (!name) throw httpError('Ten nhom huong la bat buoc');
  if (!image) throw httpError('Anh card nhom huong la bat buoc');
  const exists = await ScentFamilyCard.findOne({
    name: { $regex: `^${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' },
  });
  if (exists) throw httpError('Nhom huong nay da co card', 409);
  const item = await ScentFamilyCard.create({
    name,
    image,
    description: String(input.description || '').trim(),
    displayOrder: Math.max(0, Number(input.displayOrder) || 0),
    isActive: input.isActive !== false,
  });
  return normalize(item);
}

export async function update(id: string, input: any) {
  const name = String(input.name || '').trim();
  const image = String(input.image || '').trim();
  if (!name) throw httpError('Ten nhom huong la bat buoc');
  if (!image) throw httpError('Anh card nhom huong la bat buoc');
  const duplicate = await ScentFamilyCard.findOne({
    _id: { $ne: id },
    name: { $regex: `^${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' },
  });
  if (duplicate) throw httpError('Nhom huong nay da co card', 409);
  const item = await ScentFamilyCard.findByIdAndUpdate(
    id,
    {
      name,
      image,
      description: String(input.description || '').trim(),
      displayOrder: Math.max(0, Number(input.displayOrder) || 0),
      isActive: input.isActive !== false,
    },
    { new: true, runValidators: true },
  );
  if (!item) throw httpError('Không tìm thấy card nhóm hương', 404);
  return normalize(item);
}

export async function remove(id: string) {
  const item = await ScentFamilyCard.findByIdAndDelete(id);
  if (!item) throw httpError('Không tìm thấy card nhóm hương', 404);
  return { id, deleted: true };
}
