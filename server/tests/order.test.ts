import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';
import { Order } from '../src/models/order.model';

// PF-43: test co ban cho luong order qua HTTP (guard + validate dia chi).
// Khong can MongoDB: chi kiem tra authenticate (401) va validate(createOrderSchema) (400).
const app = createApp();

describe('Order API (PF-43)', () => {
  it('GET /api/orders khi chua dang nhap -> 401', async () => {
    const res = await request(app).get('/api/orders');
    expect(res.status).toBe(401);
  });

  it('GET /api/orders voi token rac -> 401', async () => {
    const res = await request(app)
      .get('/api/orders')
      .set('Authorization', 'Bearer token-khong-hop-le');
    expect(res.status).toBe(401);
  });

  it('POST /api/orders thieu dia chi giao hang -> 400', async () => {
    const res = await request(app).post('/api/orders').send({ items: [] });
    expect(res.status).toBe(400);
  });

  it('accepts object voucher snapshot on order validation', async () => {
    const order = new Order({
      items: [{
        variant: '507f1f77bcf86cd799439011',
        name: 'Test perfume',
        price: 90000,
        quantity: 1,
      }],
      total: 90000,
      voucherCode: 'WELCOME10',
      voucherSnapshot: {
        code: 'WELCOME10',
        name: 'Ưu đãi chào mừng thành viên mới',
        type: 'percentage',
        value: 10,
        stackable: true,
        userSegment: 'NEW',
      },
    });

    await expect(order.validate()).resolves.toBeUndefined();
  });
});
