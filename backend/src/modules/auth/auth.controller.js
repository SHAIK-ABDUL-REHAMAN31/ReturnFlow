import { authService } from './auth.service.js';
import { env } from '../../config/env.js';

const REFRESH_COOKIE_NAME = 'returnflow_refresh_token';

const cookieOptions = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  path: '/api/auth',
};

export class AuthController {
  async register(req, res, next) {
    try {
      const { tokens, user } = await authService.register(req.body);

      res.cookie(REFRESH_COOKIE_NAME, tokens.refreshToken, cookieOptions);
      res.status(201).json({
        accessToken: tokens.accessToken,
        user,
      });
    } catch (err) {
      next(err);
    }
  }

  async login(req, res, next) {
    try {
      const { tokens, user } = await authService.login(req.body);

      res.cookie(REFRESH_COOKIE_NAME, tokens.refreshToken, cookieOptions);
      res.status(200).json({
        accessToken: tokens.accessToken,
        user,
      });
    } catch (err) {
      next(err);
    }
  }

  async refresh(req, res, next) {
    try {
      const token = req.cookies?.[REFRESH_COOKIE_NAME] || req.body?.refreshToken;
      if (!token) {
        res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'No refresh token provided' } });
        return;
      }

      const { accessToken, newRefreshToken } = await authService.refresh(token);
      res.cookie(REFRESH_COOKIE_NAME, newRefreshToken, cookieOptions);
      res.status(200).json({ accessToken });
    } catch (err) {
      next(err);
    }
  }

  async logout(req, res, next) {
    try {
      if (req.user?.id) {
        await authService.logout(req.user.id);
      }
      res.clearCookie(REFRESH_COOKIE_NAME, { ...cookieOptions, maxAge: 0 });
      res.status(200).json({ message: 'Logged out successfully' });
    } catch (err) {
      next(err);
    }
  }

  async me(req, res, next) {
    try {
      const user = await authService.getProfile(req.user.id);
      res.status(200).json({ user });
    } catch (err) {
      next(err);
    }
  }
}

export const authController = new AuthController();
