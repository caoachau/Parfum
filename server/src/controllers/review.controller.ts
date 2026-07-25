import { Request, Response } from 'express';
import { Review } from '../models/review.model';
import { Order } from '../models/order.model';
import { Variant } from '../models/variant.model';
import { verifyAccess } from '../utils/jwt';

function getUser(req: Request): { id?: string; role?: string } | null {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return null;
  try {
    return verifyAccess(header.slice(7)) as { id?: string; role?: string };
  } catch {
    return null;
  }
}

export const listProductReviews = async (req: Request, res: Response) => {
  try {
    const reviews = await Review.find({
      product: req.params.productId,
      approved: true,
    })
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .lean();

    return res.json(
      reviews.map((review: any) => ({
        id: String(review._id),
        rating: review.rating,
        title: review.title || '',
        comment: review.comment,
        images: review.images || [],
        verifiedPurchase: Boolean(review.verifiedPurchase),
        userName: review.user?.name || review.guestName || 'Khach hang',
        createdAt: review.createdAt,
      })),
    );
  } catch (error: any) {
    return res.status(500).json({ message: error.message || 'Không tải được đánh giá' });
  }
};

// Chi cho phep danh gia khi: da dang nhap VA da mua san pham (verified purchase),
// va moi user chi danh gia 1 lan / san pham.
export const createReview = async (req: Request, res: Response) => {
  try {
    const user = getUser(req);
    if (!user?.id) {
      return res.status(401).json({ message: 'Vui long dang nhap de danh gia san pham' });
    }

    const { product, rating, title, comment, images } = req.body;

    // Kiem tra da mua: co don paid/shipping/done chua tung item thuoc san pham nay
    const variantIds = await Variant.find({ product }).distinct('_id');
    const purchased =
      variantIds.length > 0 &&
      (await Order.exists({
        user: user.id,
        status: { $in: ['paid', 'shipping', 'done'] },
        'items.variant': { $in: variantIds },
      }));
    if (!purchased) {
      return res.status(403).json({ message: 'Ban can mua san pham nay truoc khi danh gia' });
    }

    const existing = await Review.findOne({ product, user: user.id });
    if (existing) {
      return res.status(409).json({ message: 'Ban da danh gia san pham nay roi' });
    }

    const review = await Review.create({
      product,
      user: user.id,
      rating,
      title,
      comment,
      images: Array.isArray(images) ? images : [],
      verifiedPurchase: true,
      approved: true,
    });

    return res.status(201).json({
      id: String(review._id),
      message: 'Cam on ban da danh gia san pham',
    });
  } catch (error: any) {
    return res
      .status(error.status || 500)
      .json({ message: error.message || 'Không gửi được đánh giá' });
  }
};
