// =============================================================================
//  SITE CONTENT SERVICE
//  - getPublicMap(): tra ve { key: url } cua nhung slot da duoc override.
//  - listForAdmin(): tra ve tat ca slot kem anh hien tai (override||default).
//  - setContent(key,url): validate key + upsert override.
//  - resetContent(key): xoa override -> quay ve anh mac dinh.
// =============================================================================
import { SiteContent } from '../models/siteContent.model';
import {
  SITE_CONTENT_SLOTS,
  SITE_CONTENT_KEYS,
  getSlot,
} from '../config/siteContentSlots';

function httpError(message: string, status = 400) {
  return Object.assign(new Error(message), { status });
}

export async function getPublicMap(): Promise<Record<string, string>> {
  const docs = await SiteContent.find().lean();
  const map: Record<string, string> = {};
  for (const d of docs) {
    // Chi tra ve slot con hop le (tranh key cu da bo)
    if (SITE_CONTENT_KEYS.has(d.key) && d.url) map[d.key] = d.url;
  }
  return map;
}

export type AdminSlot = {
  key: string;
  label: string;
  group: string;
  defaultUrl: string;
  url: string;
  hasOverride: boolean;
};

export async function listForAdmin(): Promise<{ groups: string[]; slots: AdminSlot[] }> {
  const docs = await SiteContent.find().lean();
  const overrides = new Map<string, string>();
  for (const d of docs) overrides.set(d.key, d.url);

  const slots: AdminSlot[] = SITE_CONTENT_SLOTS.map((s) => {
    const override = overrides.get(s.key);
    return {
      key: s.key,
      label: s.label,
      group: s.group,
      defaultUrl: s.defaultUrl,
      url: override || s.defaultUrl,
      hasOverride: Boolean(override),
    };
  });

  const groups: string[] = [];
  for (const s of SITE_CONTENT_SLOTS) if (!groups.includes(s.group)) groups.push(s.group);

  return { groups, slots };
}

export async function setContent(key: string, url: string) {
  if (!getSlot(key)) throw httpError('Không tìm thấy vị trí ảnh: ' + key, 400);
  const value = String(url || '').trim();
  if (!value) throw httpError('Thiếu URL ảnh', 400);
  const doc = await SiteContent.findOneAndUpdate(
    { key },
    { key, url: value },
    { new: true, upsert: true, setDefaultsOnInsert: true },
  ).lean();
  return { key, url: doc?.url || value };
}

export async function resetContent(key: string) {
  if (!getSlot(key)) throw httpError('Không tìm thấy vị trí ảnh: ' + key, 400);
  await SiteContent.deleteOne({ key });
  const slot = getSlot(key)!;
  return { key, url: slot.defaultUrl };
}
