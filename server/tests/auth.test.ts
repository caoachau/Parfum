import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';

// PF-43: test co ban cho luong auth qua HTTP (validate input + guard).
// Cac case duoi day chi cham vao middleware validate/authenticate,
// KHONG can ket noi MongoDB nen chay duoc offline / trong CI.
const app = createApp();

describe('Auth API (PF-43)', () => {
  it('POST /api/auth/register voi email khong hop le -> 400', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Test', email: 'khong-phai-email', password: '123456' });
    expect(res.status).toBe(400);
  });

  it('POST /api/auth/register voi password qua ngan -> 400', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Test', email: 'test@example.com', password: '123' });
    expect(res.status).toBe(400);
  });

  it('POST /api/auth/login thieu password -> 400', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@example.com' });
    expect(res.status).toBe(400);
  });

  it('POST /api/auth/forgot-password-phone voi so dien thoai sai -> 400', async () => {
    const res = await request(app)
      .post('/api/auth/forgot-password-phone')
      .send({ phone: '12345' });
    expect(res.status).toBe(400);
  });

  it('POST /api/auth/verify-password-reset-otp voi OTP sai dinh dang -> 400', async () => {
    const res = await request(app)
      .post('/api/auth/verify-password-reset-otp')
      .send({ phone: '0901234567', otp: '123' });
    expect(res.status).toBe(400);
  });

  it('POST /api/auth/verify-password-reset-email-otp voi email hoac OTP sai -> 400', async () => {
    const res = await request(app)
      .post('/api/auth/verify-password-reset-email-otp')
      .send({ email: 'email-sai', otp: '123' });
    expect(res.status).toBe(400);
  });

  it('POST /api/auth/logout khi chua dang nhap -> 401', async () => {
    const res = await request(app).post('/api/auth/logout').send({});
    expect(res.status).toBe(401);
  });
});
