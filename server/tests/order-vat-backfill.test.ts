import { describe, expect, it } from 'vitest';
import { deriveVatBackfillSnapshot } from '../src/utils/orderVatBackfill';

describe('order VAT backfill', () => {
  it('uses the saved product subtotal and excludes shipping from VAT', () => {
    expect(
      deriveVatBackfillSnapshot(
        {
          subtotal: 1_100_000,
          items: [{ price: 1_100_000, quantity: 1 }],
        },
        0.1,
      ),
    ).toEqual({
      productTotal: 1_100_000,
      vatRate: 0.1,
      vatIncluded: 100_000,
      pricesIncludeVat: true,
      source: 'subtotal',
    });
  });

  it('falls back to immutable order line prices when subtotal is missing', () => {
    expect(
      deriveVatBackfillSnapshot(
        {
          items: [
            { price: 550_000, quantity: 2 },
            { price: 220_000, quantity: 1 },
          ],
        },
        0.1,
      ),
    ).toMatchObject({ productTotal: 1_320_000, vatIncluded: 120_000, source: 'items' });
  });

  it('rejects orders whose historical product total cannot be reconstructed', () => {
    expect(deriveVatBackfillSnapshot({ items: [] }, 0.1)).toBeNull();
    expect(
      deriveVatBackfillSnapshot({ items: [{ price: undefined, quantity: 1 }] }, 0.1),
    ).toBeNull();
  });

  it('rejects an invalid VAT rate', () => {
    expect(deriveVatBackfillSnapshot({ subtotal: 1_000_000 }, 1.1)).toBeNull();
  });
});
