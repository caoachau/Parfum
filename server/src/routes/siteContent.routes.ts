// =============================================================================
//  SITE CONTENT ROUTES (public)  ->  mount tai /api/site-content
//  Chi 1 endpoint cong khai: GET / -> tra ve map { key: url } cac anh override.
//  Cac thao tac cap nhat nam trong admin.routes.ts (yeu cau quyen admin).
// =============================================================================
import { Router } from 'express';
import * as ctrl from '../controllers/siteContent.controller';

const r = Router();

r.get('/', ctrl.getPublic);

export default r;
