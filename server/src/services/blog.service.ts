import { BlogArticle } from '../models/blogArticle.model';
import { JournalSubscriber } from '../models/journalSubscriber.model';
import { isMailConfigured, sendMail } from '../utils/mailer';
import { logger } from '../utils/logger';
import { activateJournalForEmail } from './notification.service';

function httpError(message: string, status = 400) {
  return Object.assign(new Error(message), { status });
}

const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

type JournalNotificationResult = {
  subscriberCount: number;
  sentCount: number;
  failedCount: number;
  skippedReason?: 'not_published' | 'already_notified' | 'no_subscribers' | 'smtp_not_configured';
};

function slugify(value: string) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function normalizeInput(input: any) {
  const title = String(input.title || '').trim();
  const slug = slugify(input.slug || title);
  if (!title) throw httpError('Thieu tieu de bai viet');
  if (!slug) throw httpError('Thieu slug bai viet');

  const sections = Array.isArray(input.sections)
    ? input.sections
        .map((s: any) => ({
          heading: String(s.heading || '').trim() || undefined,
          body: String(s.body || '').trim(),
          image: String(s.image || '').trim() || undefined,
          imageCaption: String(s.imageCaption || '').trim() || undefined,
        }))
        .filter((s: any) => s.body)
    : [];
  const contentText = [
    input.description,
    ...sections.flatMap((section: any) => [section.heading, section.body]),
  ]
    .filter(Boolean)
    .join(' ');

  return {
    slug,
    title,
    category: String(input.category || 'Tin tức').trim(),
    description: String(input.description || '').trim(),
    image: String(input.image || '').trim(),
    heroImage: String(input.heroImage || input.image || '').trim(),
    date: String(input.date || '').trim(),
    readTime: String(input.readTime || '').trim() || estimateReadTime(contentText),
    author: String(input.author || '').trim(),
    sections,
    relatedSlugs: Array.isArray(input.relatedSlugs)
      ? input.relatedSlugs.map((s: any) => slugify(String(s))).filter(Boolean)
      : [],
    status: input.status === 'published' ? 'published' : 'draft',
    publishedAt: input.status === 'published' ? input.publishedAt || new Date() : undefined,
  };
}

function estimateReadTime(value: string) {
  const wordCount = String(value || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
  const minutes = Math.max(1, Math.ceil(wordCount / 220));
  return `${minutes} phút đọc`;
}

function serialize(doc: any) {
  return {
    id: String(doc._id),
    slug: doc.slug,
    category: doc.category,
    title: doc.title,
    description: doc.description,
    image: doc.image,
    heroImage: doc.heroImage || doc.image,
    date: doc.date || '',
    readTime: doc.readTime || '',
    author: doc.author || '',
    sections: doc.sections || [],
    relatedSlugs: doc.relatedSlugs || [],
    status: doc.status,
    publishedAt: doc.publishedAt,
    journalNotifiedAt: doc.journalNotifiedAt,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

function escapeHtml(value: string) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function absoluteUrl(path: string) {
  return `${CLIENT_URL.replace(/\/+$/, '')}${path.startsWith('/') ? path : `/${path}`}`;
}

async function notifyJournalSubscribers(article: any): Promise<JournalNotificationResult> {
  if (article.status !== 'published') {
    return { subscriberCount: 0, sentCount: 0, failedCount: 0, skippedReason: 'not_published' };
  }
  if (article.journalNotifiedAt) {
    return { subscriberCount: 0, sentCount: 0, failedCount: 0, skippedReason: 'already_notified' };
  }

  const subscribers = await JournalSubscriber.find({ isActive: true }).select('email').lean();
  if (!subscribers.length) {
    return { subscriberCount: 0, sentCount: 0, failedCount: 0, skippedReason: 'no_subscribers' };
  }
  if (!isMailConfigured()) {
    return {
      subscriberCount: subscribers.length,
      sentCount: 0,
      failedCount: subscribers.length,
      skippedReason: 'smtp_not_configured',
    };
  }

  const url = absoluteUrl(`/blog/${article.slug}`);
  const title = escapeHtml(article.title);
  const description = escapeHtml(article.description || '');
  const subject = `Nhật ký mới từ L'Essence Noire: ${article.title}`;
  const html = `
    <div style="font-family:'Be Vietnam Pro',Manrope,'Segoe UI',Arial,sans-serif;line-height:1.6;color:#1d1c19">
      <p style="letter-spacing:2px;text-transform:uppercase;color:#75621e;font-size:11px">Nhật ký L'Essence Noire</p>
      <h1 style="font-family:'Noto Serif','Noto Serif Display',Georgia,serif;font-size:28px;margin:12px 0">${title}</h1>
      <p style="color:#625b54">${description}</p>
      <p><a href="${url}" style="display:inline-block;background:#75621e;color:#fff;text-decoration:none;padding:12px 18px;margin-top:10px">Đọc bài viết</a></p>
      <p style="font-size:12px;color:#8a857d;margin-top:24px">Bạn nhận email này vì đã đăng ký nhận journal từ L'Essence Noire.</p>
    </div>
  `;
  const text = `Nhật ký mới từ L'Essence Noire: ${article.title}\n${article.description || ''}\n${url}`;

  const results = await Promise.allSettled(
    subscribers.map((subscriber) => sendMail({ to: subscriber.email, subject, html, text })),
  );
  const sentEmails = subscribers
    .filter(
      (_subscriber, index) =>
        results[index].status === 'fulfilled' &&
        (results[index] as PromiseFulfilledResult<boolean>).value,
    )
    .map((subscriber) => subscriber.email);

  if (sentEmails.length) {
    await JournalSubscriber.updateMany(
      { email: { $in: sentEmails } },
      { $set: { lastNotifiedAt: new Date() } },
    );
    await BlogArticle.updateOne({ _id: article._id }, { $set: { journalNotifiedAt: new Date() } });
  } else {
    logger.warn(`[journal] Không gửi được thông báo bài viết "${article.slug}" tới subscriber nào`);
    return {
      subscriberCount: subscribers.length,
      sentCount: 0,
      failedCount: subscribers.length,
    };
  }
  logger.info(
    `[journal] Đã gửi thông báo bài viết "${article.slug}" tới ${sentEmails.length}/${subscribers.length} subscriber`,
  );
  return {
    subscriberCount: subscribers.length,
    sentCount: sentEmails.length,
    failedCount: subscribers.length - sentEmails.length,
  };
}

export async function listPublic() {
  const docs = await BlogArticle.find({ status: 'published' })
    .sort({ publishedAt: -1, createdAt: -1 })
    .lean();
  return docs.map(serialize);
}

export async function getPublicBySlug(slug: string) {
  const doc = await BlogArticle.findOne({ slug: slugify(slug), status: 'published' }).lean();
  if (!doc) throw httpError('Không tìm thấy bài viết', 404);
  return serialize(doc);
}

export async function listAdmin(query: any) {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
  const filter: any = {};
  if (query.status) filter.status = query.status;
  if (query.search) {
    const q = String(query.search).trim();
    filter.$or = [
      { title: { $regex: q, $options: 'i' } },
      { category: { $regex: q, $options: 'i' } },
      { slug: { $regex: q, $options: 'i' } },
    ];
  }

  const [rows, total] = await Promise.all([
    BlogArticle.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    BlogArticle.countDocuments(filter),
  ]);

  return {
    data: rows.map(serialize),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit) || 1,
  };
}

export async function createArticle(input: any) {
  const data = normalizeInput(input);
  const exists = await BlogArticle.findOne({ slug: data.slug });
  if (exists) throw httpError('Slug bai viet da ton tai', 409);
  const doc = await BlogArticle.create(data);
  const journalNotification =
    doc.status === 'published' ? await notifyJournalSubscribers(doc) : undefined;
  return { ...serialize(doc), journalNotification };
}

export async function subscribeJournal(emailInput: string) {
  const email = String(emailInput || '')
    .trim()
    .toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw httpError('Email không hợp lệ', 400);
  }

  const existing = await JournalSubscriber.findOne({ email });
  if (existing) {
    const wasInactive = !existing.isActive;
    existing.isActive = true;
    if (wasInactive) existing.adminSeenAt = undefined;
    await existing.save();
    await activateJournalForEmail(email);
    return { email: existing.email, message: 'Da dang ky nhan journal' };
  }

  const doc = await JournalSubscriber.create({ email, isActive: true, subscribedAt: new Date() });
  await activateJournalForEmail(email);

  return { email: doc.email, message: 'Da dang ky nhan journal' };
}

export async function importDefaultArticles(articles: any[]) {
  let imported = 0;
  for (const input of articles) {
    const data = normalizeInput({ ...input, status: input.status || 'published' });
    const result = await BlogArticle.updateOne(
      { slug: data.slug },
      { $setOnInsert: data },
      { upsert: true },
    );
    if (result.upsertedCount > 0) imported += 1;
  }
  return { imported, total: articles.length };
}

export async function updateArticle(id: string, input: any) {
  const previous = await BlogArticle.findById(id).lean();
  if (!previous) throw httpError('Không tìm thấy bài viết', 404);
  const data = normalizeInput(input);
  const exists = await BlogArticle.findOne({ slug: data.slug, _id: { $ne: id } });
  if (exists) throw httpError('Slug bai viet da ton tai', 409);
  const doc = await BlogArticle.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  if (!doc) throw httpError('Không tìm thấy bài viết', 404);
  let journalNotification: JournalNotificationResult | undefined;
  if (
    doc.status === 'published' &&
    (previous.status !== 'published' || !previous.journalNotifiedAt)
  ) {
    journalNotification = await notifyJournalSubscribers(doc);
  }
  return { ...serialize(doc), journalNotification };
}

export async function deleteArticle(id: string) {
  const doc = await BlogArticle.findByIdAndDelete(id);
  if (!doc) throw httpError('Không tìm thấy bài viết', 404);
  return { id };
}
