import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { Errors } from '../lib/app-error.js';

export function authMiddleware(req, _res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(Errors.unauthorized('Authorization header with Bearer token is required'));
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    return next(Errors.unauthorized('Bearer token missing'));
  }

  try {
    const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET);
    if (!decoded.sub || !decoded.role) {
      return next(Errors.unauthorized('Invalid token payload'));
    }

    req.user = {
      id: decoded.sub,
      email: decoded.email,
      role: decoded.role,
    };

    next();
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      return next(Errors.unauthorized('Access token has expired'));
    }
    return next(Errors.unauthorized('Invalid access token'));
  }
}

export function requireRole(allowedRoles) {
  return (req, _res, next) => {
    if (!req.user) {
      return next(Errors.unauthorized());
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(Errors.forbidden(`Requires one of: ${allowedRoles.join(', ')}`));
    }

    next();
  };
}
