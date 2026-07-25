// =============================================================================
//  ADMIN CONTROLLER
//  Lop mong: nhan req -> goi admin.service -> tra JSON. Loi day sang errorHandler.
// =============================================================================
import { Request, Response, NextFunction } from 'express';
import * as adminService from '../services/admin.service';

const uid = (req: Request) => (req as any).user?.id;
const ok = (res: Response, data: unknown, status = 200) =>
  res.status(status).json({ success: true, data });

// ------------------------------------------------------------------ stats ----
export async function getStats(_req: Request, res: Response, next: NextFunction) {
  try {
    ok(res, await adminService.getStats());
  } catch (e) {
    next(e);
  }
}

export async function search(req: Request, res: Response, next: NextFunction) {
  try {
    ok(res, await adminService.globalSearch(req.query.q));
  } catch (e) {
    next(e);
  }
}

export async function notifications(_req: Request, res: Response, next: NextFunction) {
  try {
    ok(res, await adminService.getNotifications());
  } catch (e) {
    next(e);
  }
}

export async function markNotificationSeen(req: Request, res: Response, next: NextFunction) {
  try {
    ok(res, await adminService.markNotificationSeen(req.params.id));
  } catch (e) {
    next(e);
  }
}

// --------------------------------------------------------------- products ----
export async function listProducts(req: Request, res: Response, next: NextFunction) {
  try {
    ok(res, await adminService.listProducts(req.query));
  } catch (e) {
    next(e);
  }
}
export async function getProduct(req: Request, res: Response, next: NextFunction) {
  try {
    ok(res, await adminService.getProduct(req.params.id));
  } catch (e) {
    next(e);
  }
}
export async function createProduct(req: Request, res: Response, next: NextFunction) {
  try {
    ok(res, await adminService.createProduct(req.body), 201);
  } catch (e) {
    next(e);
  }
}
export async function updateProduct(req: Request, res: Response, next: NextFunction) {
  try {
    ok(res, await adminService.updateProduct(req.params.id, req.body));
  } catch (e) {
    next(e);
  }
}
export async function deleteProduct(req: Request, res: Response, next: NextFunction) {
  try {
    ok(res, await adminService.deleteProduct(req.params.id));
  } catch (e) {
    next(e);
  }
}

// --------------------------------------------------------------- variants ----
export async function listVariants(req: Request, res: Response, next: NextFunction) {
  try {
    ok(res, await adminService.listVariants(req.query));
  } catch (e) {
    next(e);
  }
}
export async function createVariant(req: Request, res: Response, next: NextFunction) {
  try {
    ok(res, await adminService.createVariant(req.body, uid(req)), 201);
  } catch (e) {
    next(e);
  }
}
export async function updateVariant(req: Request, res: Response, next: NextFunction) {
  try {
    ok(res, await adminService.updateVariant(req.params.id, req.body, uid(req)));
  } catch (e) {
    next(e);
  }
}
export async function deleteVariant(req: Request, res: Response, next: NextFunction) {
  try {
    ok(res, await adminService.deleteVariant(req.params.id));
  } catch (e) {
    next(e);
  }
}

// ----------------------------------------------------------------- brands ----
export async function listBrands(_req: Request, res: Response, next: NextFunction) {
  try {
    ok(res, await adminService.listBrands());
  } catch (e) {
    next(e);
  }
}
export async function getBrand(req: Request, res: Response, next: NextFunction) {
  try {
    ok(res, await adminService.getBrand(req.params.id));
  } catch (e) {
    next(e);
  }
}
export async function createBrand(req: Request, res: Response, next: NextFunction) {
  try {
    ok(res, await adminService.createBrand(req.body), 201);
  } catch (e) {
    next(e);
  }
}
export async function importDefaultBrands(req: Request, res: Response, next: NextFunction) {
  try {
    ok(res, await adminService.importDefaultBrands(req.body.brands));
  } catch (e) {
    next(e);
  }
}
export async function updateBrand(req: Request, res: Response, next: NextFunction) {
  try {
    ok(res, await adminService.updateBrand(req.params.id, req.body));
  } catch (e) {
    next(e);
  }
}
export async function deleteBrand(req: Request, res: Response, next: NextFunction) {
  try {
    ok(res, await adminService.deleteBrand(req.params.id));
  } catch (e) {
    next(e);
  }
}

// ------------------------------------------------------------- categories ----
export async function listCategories(_req: Request, res: Response, next: NextFunction) {
  try {
    ok(res, await adminService.listCategories());
  } catch (e) {
    next(e);
  }
}
export async function createCategory(req: Request, res: Response, next: NextFunction) {
  try {
    ok(res, await adminService.createCategory(req.body), 201);
  } catch (e) {
    next(e);
  }
}
export async function updateCategory(req: Request, res: Response, next: NextFunction) {
  try {
    ok(res, await adminService.updateCategory(req.params.id, req.body));
  } catch (e) {
    next(e);
  }
}
export async function deleteCategory(req: Request, res: Response, next: NextFunction) {
  try {
    ok(res, await adminService.deleteCategory(req.params.id));
  } catch (e) {
    next(e);
  }
}

// ----------------------------------------------------------------- orders ----
export async function listOrders(req: Request, res: Response, next: NextFunction) {
  try {
    ok(res, await adminService.listOrders(req.query));
  } catch (e) {
    next(e);
  }
}
export async function getOrder(req: Request, res: Response, next: NextFunction) {
  try {
    ok(res, await adminService.getOrder(req.params.id));
  } catch (e) {
    next(e);
  }
}
export async function updateOrderStatus(req: Request, res: Response, next: NextFunction) {
  try {
    ok(res, await adminService.updateOrderStatus(req.params.id, req.body.status));
  } catch (e) {
    next(e);
  }
}
export async function updatePaymentStatus(req: Request, res: Response, next: NextFunction) {
  try {
    ok(res, await adminService.updatePaymentStatus(req.params.id, req.body.status));
  } catch (e) {
    next(e);
  }
}

// ------------------------------------------------------------------ users ----
export async function listUsers(req: Request, res: Response, next: NextFunction) {
  try {
    ok(res, await adminService.listUsers(req.query));
  } catch (e) {
    next(e);
  }
}
export async function updateUserRole(req: Request, res: Response, next: NextFunction) {
  try {
    ok(res, await adminService.updateUserRole(req.params.id, req.body.role, uid(req)));
  } catch (e) {
    next(e);
  }
}
export async function deleteUser(req: Request, res: Response, next: NextFunction) {
  try {
    ok(res, await adminService.deleteUser(req.params.id, uid(req)));
  } catch (e) {
    next(e);
  }
}

// ---------------------------------------------------------------- reviews ----
export async function listReviews(req: Request, res: Response, next: NextFunction) {
  try {
    ok(res, await adminService.listReviews(String(req.query.status || '')));
  } catch (e) {
    next(e);
  }
}
export async function approveReview(req: Request, res: Response, next: NextFunction) {
  try {
    ok(res, await adminService.setReviewApproval(req.params.id, true));
  } catch (e) {
    next(e);
  }
}
export async function rejectReview(req: Request, res: Response, next: NextFunction) {
  try {
    ok(res, await adminService.setReviewApproval(req.params.id, false));
  } catch (e) {
    next(e);
  }
}
export async function deleteReview(req: Request, res: Response, next: NextFunction) {
  try {
    ok(res, await adminService.deleteReview(req.params.id));
  } catch (e) {
    next(e);
  }
}
