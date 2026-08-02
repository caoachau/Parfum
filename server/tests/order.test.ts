import { createHash } from 'node:crypto';
import { afterEach, describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';
import { Order } from '../src/models/order.model';
import { Payment } from '../src/models/payment.model';
import * as orderService from '../src/services/order.service';

// PF-43: test co ban cho luong order qua HTTP (guard + validate dia chi).
// Khong can MongoDB: chi kiem tra authenticate (401) va validate(createOrderSchema) (400).
const app = createApp();

afterEach(() => vi.restoreAllMocks());

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

  it('khong cho guest xem chi tiet don chi bang Mongo id', async () => {
    const res = await request(app).get('/api/orders/507f1f77bcf86cd799439011');
    expect(res.status).toBe(401);
  });

  it('khong cho guest lay VietQR chi bang Mongo id', async () => {
    const res = await request(app).get('/api/orders/507f1f77bcf86cd799439011/payment');
    expect(res.status).toBe(401);
  });

  it('khong con endpoint upload Cloudinary cong khai', async () => {
    const res = await request(app).post('/api/upload');
    expect(res.status).toBe(404);
  });

  it('hash token guest truoc khi truy van quyen truy cap don', async () => {
    const token = 'guest-token-random-khong-luu-tho';
    const lean = vi.fn().mockResolvedValue(null);
    const findOne = vi.spyOn(Order, 'findOne').mockReturnValue({ lean } as any);

    await expect(
      orderService.getOrderById(undefined, '507f1f77bcf86cd799439011', token),
    ).rejects.toMatchObject({ status: 404 });

    expect(findOne).toHaveBeenCalledWith({
      _id: '507f1f77bcf86cd799439011',
      guestAccessTokenHash: createHash('sha256').update(token, 'utf8').digest('hex'),
    });
  });

  it('khong select hash token guest va chi cho phep mot payment moi don', () => {
    expect((Order.schema.path('guestAccessTokenHash') as any).options.select).toBe(false);
    expect((Payment.schema.path('order') as any).options.unique).toBe(true);
  });

  it('accepts object voucher snapshot on order validation', async () => {
    const order = new Order({
      items: [
        {
          variant: '507f1f77bcf86cd799439011',
          name: 'Test perfume',
          price: 90000,
          quantity: 1,
        },
      ],
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
