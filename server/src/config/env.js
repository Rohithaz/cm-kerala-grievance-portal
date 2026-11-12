import dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
dotenv.config({ path: fileURLToPath(new URL('../../../.env', import.meta.url)) });

const projectRoot = fileURLToPath(new URL('../../../', import.meta.url));
const configuredUploadDir = process.env.UPLOAD_DIR || 'server/uploads';

const nodeEnv = process.env.NODE_ENV || 'development';
const sameSiteValue = (process.env.AUTH_COOKIE_SAME_SITE || 'lax').toLowerCase();
export const env = {
  nodeEnv,
  port: Number(process.env.PORT) || 5000,
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  mysql: {
    host: process.env.MYSQL_HOST || '127.0.0.1',
    port: Number(process.env.MYSQL_PORT) || 3306,
    database: process.env.MYSQL_DATABASE || 'cm_kerala_grievance',
    user: process.env.MYSQL_USER || '',
    password: process.env.MYSQL_PASSWORD || '',
  },
  jwtSecret: process.env.JWT_SECRET || '',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1d',
  cookieSecure: nodeEnv === 'production' || process.env.AUTH_COOKIE_SECURE === 'true',
  cookieSameSite: ['lax', 'strict', 'none'].includes(sameSiteValue) ? sameSiteValue : 'lax',
  authCookieName: 'cm_kerala_session',
  csrfCookieName: 'cm_kerala_csrf',
  uploadDir: path.resolve(projectRoot, configuredUploadDir),
  maxFileSize: Math.min(Math.max(Number(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024, 1), 5 * 1024 * 1024),
  ai: {
    provider: process.env.AI_PROVIDER || '',
    apiKey: process.env.AI_API_KEY || '',
    model: process.env.AI_MODEL || '',
  },
  demo: {
    cmoEmail: process.env.DEMO_CMO_EMAIL || '',
    cmoPassword: process.env.DEMO_CMO_PASSWORD || '',
    officerEmail: process.env.DEMO_OFFICER_EMAIL || '',
    officerPassword: process.env.DEMO_OFFICER_PASSWORD || '',
    waterOfficerEmail: process.env.DEMO_WATER_OFFICER_EMAIL || '',
    waterOfficerPassword: process.env.DEMO_WATER_OFFICER_PASSWORD || '',
  },
};
