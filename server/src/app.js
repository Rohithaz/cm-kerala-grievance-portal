import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { env } from './config/env.js';
import healthRoutes from './routes/healthRoutes.js';
import departmentRoutes from './routes/departmentRoutes.js';
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import accessRoutes from './routes/accessRoutes.js';
import grievanceRoutes from './routes/grievanceRoutes.js';
import cmoRoutes from './routes/cmoRoutes.js';
import officerRoutes from './routes/officerRoutes.js';
import { csrfProtection } from './middleware/csrfProtection.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

const app = express();
app.disable('x-powered-by');
app.use(cors({
  origin: env.clientUrl,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'X-CSRF-Token'],
}));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: false, limit: '1mb' }));
app.use(cookieParser());
app.use('/api', csrfProtection);
app.use('/api/health', healthRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/access', accessRoutes);
app.use('/api/grievances', grievanceRoutes);
app.use('/api/cmo', cmoRoutes);
app.use('/api/officer', officerRoutes);
app.use(notFoundHandler);
app.use(errorHandler);
export default app;
