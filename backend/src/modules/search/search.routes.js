import { Router } from 'express';
import { searchController } from './search.controller.js';
import { authMiddleware, requireRole } from '../../middleware/auth.middleware.js';

const router = Router();

// GET /api/search/returns?q=... (§1.5)
router.get(
  '/returns',
  authMiddleware,
  requireRole(['MERCHANT', 'ADMIN']),
  searchController.searchReturns.bind(searchController)
);

export const searchRoutes = router;
