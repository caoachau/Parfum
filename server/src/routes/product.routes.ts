import { Router } from 'express';
import { getProducts, getProductDetail, getProductFilters } from '../controllers/product.controller';

const router = Router();

router.get('/', getProducts); // danh sách sản phẩm
router.get('/filters', getProductFilters); // facet lọc từ toàn bộ DB (đặt trước route param)
router.get('/:idOrSlug', getProductDetail); // chi tiết theo id hoặc slug

export default router;
