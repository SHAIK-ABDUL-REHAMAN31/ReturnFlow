import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { env } from './config/env.js';
import { errorMiddleware } from './middleware/error.middleware.js';
import { rateLimit } from './middleware/rate-limit.middleware.js';
import { authRoutes } from './modules/auth/auth.routes.js';
import { orderRoutes } from './modules/orders/orders.routes.js';
import { returnRoutes } from './modules/returns/returns.routes.js';
import { searchRoutes } from './modules/search/search.routes.js';
import { webhookRoutes } from './modules/webhooks/carrier.routes.js';
import { analyticsRoutes } from './modules/analytics/analytics.routes.js';
import { demoRoutes } from './modules/demo/demo.routes.js';

export const app = express();

// 1. Security Headers via Helmet (§5.4)
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
      },
    },
    crossOriginEmbedderPolicy: false,
  })
);

// 2. Strict CORS allow-list (§5.4)
const allowedOrigins = [env.FRONTEND_URL, 'http://localhost:3000', 'http://127.0.0.1:3000'];

const isAllowedOrigin = (origin) => {
  if (!origin) return true;
  if (allowedOrigins.includes(origin)) return true;
  if (origin.endsWith('.vercel.app')) return true;
  return false;
};

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, curl, server-to-server) or matched origins
      if (isAllowedOrigin(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`Origin ${origin} not allowed by CORS policy`));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// 3. Body Parsing with safe limit and raw body preservation for HMAC verification (§5.2)
app.use(
  express.json({
    limit: '1mb',
    verify: (req, _res, buf) => {
      req.rawBody = buf.toString('utf-8');
    },
  })
);
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(cookieParser());

// 4. Global Rate Limiter (§5.3)
app.use(
  rateLimit({
    windowSeconds: 60,
    maxRequests: 300,
    prefix: 'global',
  })
);

// 5. Healthcheck endpoint for ALB / ECS / Docker container checks (§6)
app.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'returnflow-api',
  });
});

// 6. Application API Routes
app.use('/api/auth', authRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/returns', returnRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/webhooks', webhookRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/demo', demoRoutes);

// 7. 404 Route Handler
app.use((req, res) => {
  res.status(404).json({
    error: {
      code: 'ROUTE_NOT_FOUND',
      message: `Cannot ${req.method} ${req.path}`,
    },
  });
});

// 8. Global Central Error Boundary - ALWAYS LAST (§4.11)
app.use(errorMiddleware);
