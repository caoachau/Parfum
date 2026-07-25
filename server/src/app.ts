import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import path from 'path';
import routes from './routes';
import { setupSwagger } from './config/swagger';
import { errorHandler } from './middlewares/error.middleware';
import { env } from './config/env';
import { mongoSanitize } from './middlewares/sanitize.middleware';

export function createApp() {
  const app = express();

  // Dung sau nginx / load balancer -> lay dung req.ip (rate limit) + bat secure cookie.
  app.set('trust proxy', env.trustProxy);

  // Nen response (gzip/brotli) -> giam bang thong + tang toc tai du lieu.
  app.use(compression());

  const isAllowedOrigin = (origin: string) => {
    if (env.allowedOrigins.includes(origin)) return true;
    if (env.nodeEnv !== 'production' && /^https?:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin)) {
      return true;
    }
    return false;
  };

  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          imgSrc: ["'self'", 'data:', 'blob:', 'https:'],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'", 'https:'],
          connectSrc: ["'self'", 'https:'],
          fontSrc: ["'self'", 'https:', 'data:'],
        },
      },
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      // Bat HSTS tuong minh (chi co hieu luc tren HTTPS) -> ep trinh duyet dung HTTPS.
      hsts: { maxAge: 15552000, includeSubDomains: true },
    }),
  );
  app.use(
    cors({
      origin(origin, callback) {
        if (!origin || isAllowedOrigin(origin)) return callback(null, true);
        return callback(new Error('Not allowed by CORS'));
      },
      credentials: true,
    }),
  );
  app.use(
    express.json({
      limit: '100kb',
      verify(req, _res, buffer) {
        (req as any).rawBody = Buffer.from(buffer);
      },
    }),
  );
  app.use(mongoSanitize);
  // Cache file tinh 7 ngay (anh upload it doi) + etag de revalidate.
  app.use(
    '/uploads',
    express.static(path.resolve(process.cwd(), 'uploads'), {
      maxAge: '7d',
      etag: true,
    }),
  );
  app.get('/', (_, res) => {
    res.json({
      status: 'ok',
      message: 'HOC Perfume API running',
    });
  });

  // API versioning: mount duong dan co phien ban /api/v1 (khuyen dung) + giu /api (tuong thich nguoc).
  app.use('/api/v1', routes);
  app.use('/api', routes);
  setupSwagger(app);
  app.use(errorHandler);
  return app;
}

// FIXED: export app instance de index.ts co the import { app }
export const app = createApp();
