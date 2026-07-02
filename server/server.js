import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// Database & Middlewares
import connectDB from './config/db.js';
import errorHandler from './middleware/errorHandler.js';

// Route Imports
import authRoutes from './routes/auth.js';
import clientRoutes from './routes/clients.js';
import transactionRoutes from './routes/transactions.js';
import quotationRoutes from './routes/quotations.js';
import invoiceRoutes from './routes/invoices.js';
import teamRoutes from './routes/team.js';
import settingsRoutes from './routes/settings.js';
import dashboardRoutes from './routes/dashboard.js';
import projectRoutes from './routes/projects.js';

// Environment configurations
dotenv.config();

// Connect to Database
connectDB();

const app = express();

// Global Middlewares
app.use(express.json());
app.use(cors({ origin: '*' })); // Enable all CORS for local pairing/testing
app.use(helmet({ crossOriginResourcePolicy: false })); // Permissive policy for local uploads resource serving
app.use(morgan('dev'));

// Derive __dirname in ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure Uploads folder exists and serve statically
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
app.use('/uploads', express.static(uploadDir));

// API Route Mappings
app.use('/api/auth', authRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/quotations', quotationRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/team', teamRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/projects', projectRoutes);

// Base route for server health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date() });
});

// Centralized error handler
app.use(errorHandler);

const PORT = process.env.PORT || 5005;
app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});
