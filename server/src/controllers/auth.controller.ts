import { Request, Response, NextFunction } from 'express';
import * as authService from '../services/auth.service';
import * as notificationService from '../services/notification.service';
import {
  setRefreshCookie,
  clearRefreshCookie,
  parseCookies,
  setCsrfCookie,
  clearCsrfCookie,
  generateCsrfToken,
} from '../utils/cookies';

const uid = (req: Request) => (req as any).user?.id;

// Gui accessToken + user trong body, refreshToken luu vao httpOnly cookie (chong XSS danh cap token)
function sendAuth(res: Response, result: any, status = 200) {
  const { refreshToken, ...rest } = result;
  if (refreshToken) {
    setRefreshCookie(res, refreshToken);
    // Double-submit CSRF: phat token moi moi lan cap refresh cookie.
    setCsrfCookie(res, generateCsrfToken());
  }
  res.status(status).json(rest);
}

export async function register(req: Request, res: Response, next: NextFunction) {
  try {
    const { name, email, password, phone } = req.body;
    sendAuth(res, await authService.register(name, email, password, phone), 201);
  } catch (e) {
    next(e);
  }
}

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password } = req.body;
    sendAuth(res, await authService.login(email, password));
  } catch (e) {
    next(e);
  }
}

export async function refresh(req: Request, res: Response, next: NextFunction) {
  try {
    // Uu tien doc tu httpOnly cookie; van chap nhan body de tuong thich nguoc
    const token = parseCookies(req).refreshToken || req.body?.refreshToken;
    if (!token) return res.status(401).json({ message: 'Missing refresh token' });
    const result = await authService.refreshAccessToken(token);
    // Xoay CSRF token moi lan refresh.
    setCsrfCookie(res, generateCsrfToken());
    res.json(result);
  } catch (e) {
    next(e);
  }
}

export async function logout(req: Request, res: Response, next: NextFunction) {
  try {
    await authService.logout(uid(req));
    clearRefreshCookie(res);
    clearCsrfCookie(res);
    res.json({ message: 'Logged out' });
  } catch (e) {
    next(e);
  }
}

export async function me(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await authService.getMe(uid(req)));
  } catch (e) {
    next(e);
  }
}

export async function getNotificationPreferences(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await notificationService.getNotificationPreferences(uid(req)));
  } catch (e) {
    next(e);
  }
}

export async function updateNotificationPreferences(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    res.json(await notificationService.updateNotificationPreferences(uid(req), req.body));
  } catch (e) {
    next(e);
  }
}

export async function updateProfile(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await authService.updateProfile(uid(req), req.body));
  } catch (e) {
    next(e);
  }
}

export async function changePassword(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await authService.changePassword(uid(req), req.body));
  } catch (e) {
    next(e);
  }
}

export async function addAddress(req: Request, res: Response, next: NextFunction) {
  try {
    res.status(201).json(await authService.addAddress(uid(req), req.body));
  } catch (e) {
    next(e);
  }
}

export async function updateAddress(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await authService.updateAddress(uid(req), req.params.addressId, req.body));
  } catch (e) {
    next(e);
  }
}

export async function deleteAddress(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await authService.deleteAddress(uid(req), req.params.addressId));
  } catch (e) {
    next(e);
  }
}

export async function setDefaultAddress(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await authService.setDefaultAddress(uid(req), req.params.addressId));
  } catch (e) {
    next(e);
  }
}

export async function forgotPassword(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await authService.requestPasswordReset(req.body.email));
  } catch (e) {
    next(e);
  }
}

export async function verifyEmailPasswordResetOtp(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await authService.verifyEmailPasswordResetOtp(req.body.email, req.body.otp));
  } catch (e) {
    next(e);
  }
}

export async function forgotPasswordByPhone(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await authService.requestPhonePasswordReset(req.body.phone));
  } catch (e) {
    next(e);
  }
}

export async function verifyPasswordResetOtp(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await authService.verifyPhonePasswordResetOtp(req.body.phone, req.body.otp));
  } catch (e) {
    next(e);
  }
}

export async function resetPassword(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await authService.resetPassword(req.body.token, req.body.password));
  } catch (e) {
    next(e);
  }
}

export async function sendVerification(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await authService.sendEmailVerification(uid(req)));
  } catch (e) {
    next(e);
  }
}

export async function verifyEmail(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await authService.verifyEmail(req.body.token));
  } catch (e) {
    next(e);
  }
}
