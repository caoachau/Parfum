import { Router } from 'express';
import { getAllCategories } from '../controllers/category.controller';

const router = Router();

router.get('/', getAllCategories);

export default router;
