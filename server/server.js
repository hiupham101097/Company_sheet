import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import assetRoutes from './routes/assetRoutes.js';
import financeRoutes from './routes/financeRoutes.js';
import taskRoutes from './routes/taskRoutes.js';
import contractRoutes from './routes/contractRoutes.js';
import attendanceRoutes from './routes/attendanceRoutes.js';
import userRoutes from './routes/userRoutes.js';
import reportRoutes from './routes/reportRoutes.js';
import cloudflareRoutes from './routes/cloudflareRoutes.js';
import { db } from './config/db.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors({ origin: '*' }));
app.use(express.json());

// Request logger
app.use((req, res, next) => {
  console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.url}`);
  next();
});

// API Routes
app.use('/api/assets', assetRoutes);
app.use('/api/finance', financeRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/contracts', contractRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/users', userRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/cloudflare', cloudflareRoutes);

// Health check & Database Status
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    timestamp: new Date().toISOString(),
    databaseMode: db.isCloudflare ? 'Cloudflare D1 Production' : 'Local Persistent Engine (Ready for Cloudflare D1)',
    version: '1.0.0'
  });
});

app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`🚀 Enterprise Management API Server đang chạy tại:`);
  console.log(`👉 http://localhost:${PORT}`);
  console.log(`👉 Chế độ Database: ${db.isCloudflare ? 'Cloudflare D1 Edge' : 'Local Persistent Storage'}`);
  console.log(`=======================================================`);
});
