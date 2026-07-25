import { Router } from 'express';
import { listPublic } from '../controllers/scentFamilyCard.controller';

const router = Router();

router.get('/', listPublic);

export default router;

