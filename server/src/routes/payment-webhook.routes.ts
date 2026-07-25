import { Router } from 'express';
import {
  sePayWebhook,
  verifySePaySignature,
} from '../controllers/payment-webhook.controller';

const router = Router();

router.post('/sepay', verifySePaySignature, sePayWebhook);

export default router;
