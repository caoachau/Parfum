import { describe, expect, it, vi, beforeEach } from 'vitest';

vi.mock('../src/models/journalSubscriber.model', () => ({
  JournalSubscriber: {
    findOne: vi.fn(),
    create: vi.fn(),
  },
}));

vi.mock('../src/services/notification.service', () => ({
  activateJournalForEmail: vi.fn().mockResolvedValue(undefined),
}));

import { JournalSubscriber } from '../src/models/journalSubscriber.model';
import { subscribeJournal } from '../src/services/blog.service';

describe('Journal newsletter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rejects invalid subscriber email', async () => {
    await expect(subscribeJournal('email-sai')).rejects.toMatchObject({ status: 400 });
    expect(JournalSubscriber.findOne).not.toHaveBeenCalled();
    expect(JournalSubscriber.create).not.toHaveBeenCalled();
  });

  it('normalizes and creates subscriber email', async () => {
    vi.mocked(JournalSubscriber.findOne).mockResolvedValueOnce(null);
    vi.mocked(JournalSubscriber.create).mockResolvedValueOnce({
      email: 'reader@example.com',
    } as any);

    const result = await subscribeJournal(' Reader@Example.COM ');

    expect(result).toEqual({
      email: 'reader@example.com',
      message: 'Da dang ky nhan journal',
    });
    expect(JournalSubscriber.findOne).toHaveBeenCalledWith({ email: 'reader@example.com' });
    expect(JournalSubscriber.create).toHaveBeenCalledWith(
      expect.objectContaining({ email: 'reader@example.com', isActive: true }),
    );
  });
});
