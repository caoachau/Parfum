import { calculateVatIncluded } from '../constants/vat';

type LegacyOrderItem = {
  price?: unknown;
  quantity?: unknown;
};

type LegacyOrderForVat = {
  subtotal?: unknown;
  items?: LegacyOrderItem[];
};

export type VatBackfillSnapshot = {
  productTotal: number;
  vatRate: number;
  vatIncluded: number;
  pricesIncludeVat: true;
  source: 'subtotal' | 'items';
};

function storedMoney(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  const amount = Number(value);
  return Number.isFinite(amount) && amount >= 0 ? amount : null;
}

/** Rebuild the same VAT snapshot semantics used by new orders. Shipping is excluded. */
export function deriveVatBackfillSnapshot(
  order: LegacyOrderForVat,
  vatRate: number,
): VatBackfillSnapshot | null {
  if (!Number.isFinite(vatRate) || vatRate < 0 || vatRate > 1) return null;

  const savedSubtotal = storedMoney(order.subtotal);
  if (savedSubtotal != null) {
    return {
      productTotal: savedSubtotal,
      vatRate,
      vatIncluded: calculateVatIncluded(savedSubtotal, vatRate),
      pricesIncludeVat: true,
      source: 'subtotal',
    };
  }

  if (!Array.isArray(order.items) || !order.items.length) return null;
  let itemTotal = 0;
  for (const item of order.items) {
    const price = storedMoney(item.price);
    const quantity = Number(item.quantity);
    if (price == null || !Number.isInteger(quantity) || quantity <= 0) return null;
    itemTotal += price * quantity;
  }
  if (!Number.isFinite(itemTotal) || itemTotal < 0) return null;

  return {
    productTotal: itemTotal,
    vatRate,
    vatIncluded: calculateVatIncluded(itemTotal, vatRate),
    pricesIncludeVat: true,
    source: 'items',
  };
}
