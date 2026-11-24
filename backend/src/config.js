import 'dotenv/config';

const list = v => (v || '').split(',').map(s => s.trim()).filter(Boolean);

export const config = {
  env: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT) || 4000,
  databaseUrl: process.env.DATABASE_URL || '',
  adminEmails: list(process.env.ADMIN_EMAILS).map(e => e.toLowerCase()),
  corsOrigins: list(process.env.CORS_ORIGIN),
  sameSite: ['lax', 'strict', 'none'].includes(process.env.COOKIE_SAMESITE) ? process.env.COOKIE_SAMESITE : 'lax',
  staticDir: process.env.STATIC_DIR || '../frontend/dist',
  sessionDays: 30
};
config.isProd = config.env === 'production';
