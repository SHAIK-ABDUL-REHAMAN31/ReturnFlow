import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { authRepository } from './auth.repository.js';
import { env } from '../../config/env.js';
import { Errors } from '../../lib/app-error.js';

export class AuthService {
  constructor() {
    this.saltRounds = 12; // Enforces bcrypt cost factor >= 12 (§5.3)
  }

  async register(dto) {
    const existing = await authRepository.findByEmail(dto.email);
    if (existing) {
      throw Errors.conflict('User with this email already exists');
    }

    const passwordHash = await bcrypt.hash(dto.password, this.saltRounds);
    const user = await authRepository.create({
      ...dto,
      passwordHash,
    });

    const tokens = this.generateTokenPair(user._id.toString(), user.email, user.role);
    await authRepository.updateRefreshToken(user._id.toString(), tokens.refreshToken);

    return {
      tokens,
      user: {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        role: user.role,
      },
    };
  }

  async login(dto) {
    const user = await authRepository.findByEmail(dto.email);
    if (!user) {
      // Constant-time dummy comparison to prevent user enumeration timing attacks
      await bcrypt.compare(dto.password, '$2a$12$e80MvQG2w09Qf3a3j8GgI.tVqYV4.xMv0P5sN7Zl7m/3w0t4lM41a');
      throw Errors.unauthorized('Invalid email or password');
    }

    const isMatch = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isMatch) {
      throw Errors.unauthorized('Invalid email or password');
    }

    const tokens = this.generateTokenPair(user._id.toString(), user.email, user.role);
    await authRepository.updateRefreshToken(user._id.toString(), tokens.refreshToken);

    return {
      tokens,
      user: {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        role: user.role,
      },
    };
  }

  async refresh(refreshToken) {
    try {
      const decoded = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET);

      const user = await authRepository.findById(decoded.sub);
      if (!user || user.refreshToken !== refreshToken) {
        throw Errors.unauthorized('Invalid or revoked refresh token');
      }

      // Rotate refresh token
      const tokens = this.generateTokenPair(user._id.toString(), user.email, user.role);
      await authRepository.updateRefreshToken(user._id.toString(), tokens.refreshToken);

      return {
        accessToken: tokens.accessToken,
        newRefreshToken: tokens.refreshToken,
      };
    } catch {
      throw Errors.unauthorized('Invalid refresh token');
    }
  }

  async logout(userId) {
    await authRepository.updateRefreshToken(userId, null);
  }

  async getProfile(userId) {
    const user = await authRepository.findById(userId);
    if (!user) {
      throw Errors.notFound('User');
    }
    return {
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      role: user.role,
    };
  }

  generateTokenPair(userId, email, role) {
    const accessToken = jwt.sign(
      { sub: userId, email, role },
      env.JWT_ACCESS_SECRET,
      { expiresIn: '15m' } // Short-lived access token
    );

    const refreshToken = jwt.sign(
      { sub: userId, email, role },
      env.JWT_REFRESH_SECRET,
      { expiresIn: '7d' } // Rotating refresh token
    );

    return { accessToken, refreshToken };
  }
}

export const authService = new AuthService();
