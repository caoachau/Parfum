import { Router } from 'express';
import { z } from 'zod';
import * as ctrl from '../controllers/blog.controller';
import { validate } from '../middlewares/validate.middleware';

const r = Router();

const subscribeSchema = z.object({ email: z.string().trim().email() });

r.post('/subscribe', validate(subscribeSchema), ctrl.subscribeJournal);
r.get('/', ctrl.listPublic);
r.get('/:slug', ctrl.getPublic);

export default r;
