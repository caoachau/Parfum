import { Product } from '../models/product.model';
import { Review } from '../models/review.model';

function productLookup(idOrSlug: string) {
  return /^[0-9a-fA-F]{24}$/.test(idOrSlug) ? { _id: idOrSlug } : { slug: idOrSlug };
}

async function findProduct(idOrSlug: string) {
  const product = await Product.findOne(productLookup(idOrSlug)).select('_id name slug').lean();
  if (!product) throw Object.assign(new Error('Không tìm thấy sản phẩm'), { status: 404 });
  return product;
}

function normalizeReview(review: any) {
  return {
    id: String(review._id),
    product: String(review.product?._id || review.product),
    productName: review.product?.name,
    user: review.user ? String(review.user?._id || review.user) : null,
    userName: review.user?.name || review.guestName || 'Khách hàng',
    guestEmail: review.guestEmail || '',
    rating: review.rating,
    comment: review.comment || '',
    images: review.images || [],
    approved: Boolean(review.approved),
    createdAt: review.createdAt,
  };
}

export async function getApprovedByProduct(idOrSlug: string) {
  const product = await findProduct(idOrSlug);
  const reviews = await Review.find({ product: product._id, approved: true })
    .populate('user', 'name')
    .sort({ createdAt: -1 })
    .lean();

  return reviews.map(normalizeReview);
}

export async function createReview(
  idOrSlug: string,
  input: {
    rating: number;
    guestName: string;
    guestEmail: string;
    comment?: string;
    images?: string[];
  },
) {
  const product = await findProduct(idOrSlug);

  const payload = {
    product: product._id,
    guestName: input.guestName.trim(),
    guestEmail: input.guestEmail.trim().toLowerCase(),
    rating: input.rating,
    comment: input.comment?.trim() || '',
    images: (input.images || []).map((image) => image.trim()).filter(Boolean),
    approved: false,
  };

  let review;
  try {
    review = await Review.create(payload);
  } catch (error: any) {
    if (
      error?.code !== 11000 ||
      error?.keyPattern?.product !== 1 ||
      error?.keyPattern?.user !== 1
    ) {
      throw error;
    }

    await Review.collection.dropIndex('product_1_user_1').catch(() => null);
    review = await Review.create(payload);
  }

  return normalizeReview(review);
}

export async function getAdminReviews(status?: string) {
  const query: Record<string, unknown> = {};
  if (status === 'pending') query.approved = false;
  if (status === 'approved') query.approved = true;

  const reviews = await Review.find(query)
    .populate('user', 'name email')
    .populate('product', 'name slug')
    .sort({ createdAt: -1 })
    .lean();

  return reviews.map(normalizeReview);
}

export async function setApproval(reviewId: string, approved: boolean) {
  const review = await Review.findByIdAndUpdate(
    reviewId,
    { approved },
    { new: true, runValidators: true },
  )
    .populate('user', 'name email')
    .populate('product', 'name slug');

  if (!review) throw Object.assign(new Error('Không tìm thấy review'), { status: 404 });
  return normalizeReview(review);
}
