import { describe, expect, it } from 'vitest';
import {
  EXPRESS_SHIPPING_FEE,
  finalizeVatInclusiveTotal,
  shippingFeeFor,
} from '../src/services/pricing-engine.service';
import { calculateVatIncluded, PRICES_INCLUDE_VAT, VAT_RATE } from '../src/constants/vat';
import { Order } from '../src/models/order.model';

describe('pricing engine shipping rules', () => {
  it('keeps standard shipping free', () => {
    expect(shippingFeeFor('standard')).toBe(0);
    expect(shippingFeeFor()).toBe(0);
  });

  it('charges 35,000 VND for express shipping', () => {
    expect(EXPRESS_SHIPPING_FEE).toBe(35_000);
    expect(shippingFeeFor('express')).toBe(EXPRESS_SHIPPING_FEE);
  });
});

describe('VAT-inclusive pricing rules', () => {
  it('extracts VAT from product prices without adding it to the paid total', () => {
    const totals = finalizeVatInclusiveTotal(7_565_000, 500_000, 35_000);

    expect(VAT_RATE).toBe(0.1);
    expect(PRICES_INCLUDE_VAT).toBe(true);
    expect(totals).toEqual({
      finalTotal: 7_100_000,
      vatRate: 0.1,
      vatIncluded: 687_727,
      pricesIncludeVat: true,
    });
  });

  it('keeps product VAT unchanged when vouchers or shipping fees change', () => {
    const standard = finalizeVatInclusiveTotal(1_100_000, 0, 0);
    const express = finalizeVatInclusiveTotal(1_100_000, 0, 35_000);
    const voucherAndExpress = finalizeVatInclusiveTotal(1_100_000, 100_000, 35_000);

    expect(standard.vatIncluded).toBe(100_000);
    expect(express.vatIncluded).toBe(standard.vatIncluded);
    expect(voucherAndExpress.vatIncluded).toBe(standard.vatIncluded);
    expect(express.finalTotal).toBe(1_135_000);
    expect(voucherAndExpress.finalTotal).toBe(1_035_000);
  });

  it('handles zero, negative and custom VAT rates safely', () => {
    expect(calculateVatIncluded(0)).toBe(0);
    expect(calculateVatIncluded(-100_000)).toBe(0);
    expect(calculateVatIncluded(1_080_000, 0.08)).toBe(80_000);
  });

  it('does not invent VAT snapshots for historical orders', () => {
    const historicalOrder = new Order({ items: [], total: 1_000_000 }).toObject();

    expect(Order.schema.path('tax')).toBeUndefined();
    expect(Order.schema.path('vatRate')).toBeDefined();
    expect(Order.schema.path('vatIncluded')).toBeDefined();
    expect(Order.schema.path('pricesIncludeVat')).toBeDefined();
    expect(historicalOrder).not.toHaveProperty('vatRate');
    expect(historicalOrder).not.toHaveProperty('vatIncluded');
    expect(historicalOrder).not.toHaveProperty('pricesIncludeVat');
  });
});
