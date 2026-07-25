import { beforeEach, describe, expect, it, vi } from 'vitest';

const { userUpdateOne, journalUpdateOne } = vi.hoisted(() => ({
  userUpdateOne: vi.fn(),
  journalUpdateOne: vi.fn(),
}));
const currentPreferences = {
  orderNotifications: true,
  emailNotifications: true,
  promotionNotifications: true,
  journalNotifications: true,
};

vi.mock('../src/models/user.model', () => ({
  User: {
    findById: vi.fn(() => ({
      select: vi.fn(() => ({
        lean: vi.fn().mockResolvedValue({
          _id: 'user-1',
          email: 'member@example.com',
          notificationPreferences: {
            orderNotifications: true,
            emailNotifications: true,
            promotionNotifications: true,
            journalNotifications: true,
          },
        }),
      })),
    })),
    updateOne: userUpdateOne,
  },
}));

vi.mock('../src/models/journalSubscriber.model', () => ({
  JournalSubscriber: {
    findOne: vi.fn(),
    updateOne: journalUpdateOne,
  },
}));

import { updateNotificationPreferences } from '../src/services/notification.service';

describe('Notification preference switches', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    userUpdateOne.mockResolvedValue({});
    journalUpdateOne.mockResolvedValue({});
  });

  it.each([
    'orderNotifications',
    'emailNotifications',
    'promotionNotifications',
    'journalNotifications',
  ] as const)('updates %s independently', async (key) => {
    const result = await updateNotificationPreferences('user-1', {
      [key]: false,
    });

    expect(result[key]).toBe(false);
    expect(UserUpdate()).toMatchObject(
      key === 'emailNotifications'
        ? {
            emailNotifications: false,
            orderNotifications: false,
            promotionNotifications: false,
            journalNotifications: false,
          }
        : {
            ...currentPreferences,
            [key]: false,
          },
    );
  });
});

function UserUpdate() {
  const update = userUpdateOne.mock.calls[0]?.[1] as {
    $set?: { notificationPreferences?: typeof currentPreferences };
  };
  return update?.$set?.notificationPreferences;
}
