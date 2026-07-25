import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../src/models/journalSubscriber.model', () => ({
  JournalSubscriber: {
    updateOne: vi.fn(),
  },
}));

import { JournalSubscriber } from '../src/models/journalSubscriber.model';
import { User } from '../src/models/user.model';
import { subscribeNewAccountToJournal } from '../src/services/notification.service';

describe('New account notification defaults', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('enables all four notification preferences by default', () => {
    const user = new User({
      name: 'New member',
      email: 'new@example.com',
      password: 'hashed-password',
    });

    expect(user.notificationPreferences?.toObject()).toMatchObject({
      orderNotifications: true,
      emailNotifications: true,
      promotionNotifications: true,
      journalNotifications: true,
    });
  });

  it('activates the real journal subscriber for a new account', async () => {
    vi.mocked(JournalSubscriber.updateOne).mockResolvedValueOnce({} as any);

    await subscribeNewAccountToJournal(' New@Example.COM ');

    expect(JournalSubscriber.updateOne).toHaveBeenCalledWith(
      { email: 'new@example.com' },
      expect.objectContaining({
        $set: { isActive: true },
      }),
      { upsert: true },
    );
  });
});
