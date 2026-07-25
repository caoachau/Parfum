import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  userFindById: vi.fn(),
  userFindOneAndUpdate: vi.fn(),
  orderExists: vi.fn(),
  voucherFindOne: vi.fn(),
  voucherFind: vi.fn(),
  sendMail: vi.fn(),
}));

vi.mock('../src/models/user.model', () => ({
  User: {
    findById: mocks.userFindById,
    findOneAndUpdate: mocks.userFindOneAndUpdate,
  },
}));

vi.mock('../src/models/order.model', () => ({
  Order: {
    exists: mocks.orderExists,
  },
}));

vi.mock('../src/models/voucher.model', () => ({
  Voucher: {
    findOne: mocks.voucherFindOne,
    find: mocks.voucherFind,
  },
}));

vi.mock('../src/utils/mailer', () => ({
  assertMailConfigured: vi.fn(),
  sendMail: mocks.sendMail,
}));

import { issueNewMemberVoucher } from '../src/services/auth.service';

describe('new-member voucher issuance', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.sendMail.mockResolvedValue(true);
  });

  it('assigns the admin-selected voucher to a customer without orders', async () => {
    const user = {
      _id: '507f1f77bcf86cd799439011',
      role: 'customer',
      name: 'Lan',
      email: 'lan@example.com',
      profileCompletionVoucherCode: undefined,
    };
    const voucher = {
      code: 'HELLO15',
      type: 'percentage',
      value: 15,
      appliesToNewMembers: true,
      isActive: true,
      usageLimit: 0,
      usedCount: 0,
    };
    const updated = { ...user, profileCompletionVoucherCode: voucher.code };

    mocks.userFindById.mockResolvedValue(user);
    mocks.orderExists.mockResolvedValue(null);
    mocks.voucherFind.mockReturnValue({
      sort: vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue([voucher]),
      }),
    });
    mocks.userFindOneAndUpdate.mockResolvedValue(updated);

    const result = await issueNewMemberVoucher(String(user._id));

    expect(result).toEqual({ user: updated, voucherIssued: true });
    expect(mocks.userFindOneAndUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ _id: user._id, role: 'customer' }),
      expect.objectContaining({
        $set: expect.objectContaining({ profileCompletionVoucherCode: 'HELLO15' }),
      }),
      { new: true },
    );
  });

  it('does not assign a voucher after the account already has an order', async () => {
    const user = {
      _id: '507f1f77bcf86cd799439011',
      role: 'customer',
      name: 'Lan',
      email: 'lan@example.com',
    };
    mocks.userFindById.mockResolvedValue(user);
    mocks.orderExists.mockResolvedValue({ _id: '507f191e810c19729de860ea' });

    const result = await issueNewMemberVoucher(String(user._id));

    expect(result).toEqual({ user, voucherIssued: false });
    expect(mocks.voucherFind).not.toHaveBeenCalled();
    expect(mocks.userFindOneAndUpdate).not.toHaveBeenCalled();
  });

  it('does not assign member vouchers to admin accounts', async () => {
    const user = {
      _id: '507f1f77bcf86cd799439011',
      role: 'admin',
      name: 'Admin',
      email: 'admin@example.com',
    };
    mocks.userFindById.mockResolvedValue(user);

    const result = await issueNewMemberVoucher(String(user._id));

    expect(result).toEqual({ user, voucherIssued: false });
    expect(mocks.orderExists).not.toHaveBeenCalled();
    expect(mocks.voucherFind).not.toHaveBeenCalled();
  });
});
