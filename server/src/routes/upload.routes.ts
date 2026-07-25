import { Router } from 'express';
import { reviewUpload, upload } from '../middlewares/upload.middleware';
import { uploadImage } from '../controllers/upload.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

// Route này nhận file với key là 'image'
router.post('/upload', upload.single('image'), uploadImage);
router.post('/upload/review', authenticate, reviewUpload.single('image'), uploadImage);

export default router;
