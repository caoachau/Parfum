import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import {
  getMyCart,
  addToCart,
  updateCartItem,
  removeCartItem,
  clearMyCart,
  mergeMyCart,
} from '../controllers/cart.controller';

const router = Router();

// Toàn bộ thao tác giỏ hàng yêu cầu ĐĂNG NHẬP
router.use(authenticate);

router.get('/', getMyCart); // lấy giỏ của tôi
router.post('/items', addToCart); // thêm 1 item
router.put('/items/:variantId', updateCartItem); // đổi số lượng
router.delete('/items/:variantId', removeCartItem); // xóa 1 item
router.delete('/', clearMyCart); // xóa sạch giỏ
router.post('/merge', mergeMyCart); // đồng bộ localStorage -> DB

export default router;
