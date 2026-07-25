import { Request, Response, NextFunction } from 'express';
import * as blogService from '../services/blog.service';

const ok = (res: Response, data: unknown, status = 200) =>
  res.status(status).json({ success: true, data });

export async function listPublic(_req: Request, res: Response, next: NextFunction) {
  try {
    ok(res, await blogService.listPublic());
  } catch (e) {
    next(e);
  }
}

export async function getPublic(req: Request, res: Response, next: NextFunction) {
  try {
    ok(res, await blogService.getPublicBySlug(req.params.slug));
  } catch (e) {
    next(e);
  }
}

export async function subscribeJournal(req: Request, res: Response, next: NextFunction) {
  try {
    ok(res, await blogService.subscribeJournal(req.body.email), 201);
  } catch (e) {
    next(e);
  }
}

export async function listAdmin(req: Request, res: Response, next: NextFunction) {
  try {
    ok(res, await blogService.listAdmin(req.query));
  } catch (e) {
    next(e);
  }
}

export async function createAdmin(req: Request, res: Response, next: NextFunction) {
  try {
    ok(res, await blogService.createArticle(req.body), 201);
  } catch (e) {
    next(e);
  }
}

export async function importDefaultsAdmin(req: Request, res: Response, next: NextFunction) {
  try {
    ok(res, await blogService.importDefaultArticles(req.body.articles));
  } catch (e) {
    next(e);
  }
}

export async function updateAdmin(req: Request, res: Response, next: NextFunction) {
  try {
    ok(res, await blogService.updateArticle(req.params.id, req.body));
  } catch (e) {
    next(e);
  }
}

export async function deleteAdmin(req: Request, res: Response, next: NextFunction) {
  try {
    ok(res, await blogService.deleteArticle(req.params.id));
  } catch (e) {
    next(e);
  }
}
