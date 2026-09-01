import { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';

export const buildCorsOptions = (cfg: any): CorsOptions => {
  const allowed = (cfg.CORS_ORIGIN || 'http://localhost:3000')
    .split(',')
    .map((s: string) => s.trim());
  return {
    origin: (origin: string | undefined, cb: (err: Error | null, allow?: boolean) => void) => {
      if (!origin || cfg.NODE_ENV === 'development') return cb(null, true);
      allowed.includes(origin)
        ? cb(null, true)
        : cb(new Error(`CORS: ${origin} not allowed`));
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    exposedHeaders: ['Content-Disposition'],
    credentials: true,
    maxAge: 86400,
  };
};
