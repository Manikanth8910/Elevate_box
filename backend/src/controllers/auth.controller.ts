import { Request, Response, NextFunction } from 'express';
import { authService } from '../auth/auth.service';
import { sendResponse } from '../utils/response';
import { z } from 'zod';

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export class AuthController {
  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = LoginSchema.parse(req.body);
      
      const { user, accessToken, refreshToken } = await authService.login(email, password);

      // We can also set HttpOnly cookies here for the refresh token
      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });

      // Avoid sending passwordHash back
      const { passwordHash: _, ...safeUser } = user;

      sendResponse(res, 200, 'Login successful', { user: safeUser, accessToken });
    } catch (error) {
      next(error);
    }
  }

  async logout(req: Request, res: Response, next: NextFunction) {
    try {
      const refreshToken = req.cookies.refreshToken || req.body.refreshToken;
      if (refreshToken) {
        await authService.logout(refreshToken);
      }
      res.clearCookie('refreshToken');
      sendResponse(res, 200, 'Logged out successfully');
    } catch (error) {
      next(error);
    }
  }

  async refresh(req: Request, res: Response, next: NextFunction) {
    try {
      const currentRefreshToken = req.cookies.refreshToken || req.body.refreshToken;
      if (!currentRefreshToken) {
        throw new Error('Refresh token missing'); // Will be caught by global handler
      }

      const { accessToken, refreshToken } = await authService.refresh(currentRefreshToken);

      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000
      });

      sendResponse(res, 200, 'Token refreshed', { accessToken });
    } catch (error) {
      next(error);
    }
  }

  async me(req: Request, res: Response, next: NextFunction) {
    try {
      const user = res.locals.user;
      const { passwordHash: _, ...safeUser } = user;
      sendResponse(res, 200, 'Current user', { user: safeUser });
    } catch (error) {
      next(error);
    }
  }
}

export const authController = new AuthController();
