import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import bookRoutes from './routes/books.js';
import issueRoutes from './routes/issues.js';
import reservationRoutes from './routes/reservations.js';
import fineRoutes from './routes/fines.js';
import adminRoutes from './routes/admin.js';
import settingsRoutes from './routes/settings.js';
import scanRoutes from './routes/scan.js';
import { startExpiryCheck } from './jobs/expiry-check.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/books', bookRoutes);
app.use('/api/issues', issueRoutes);
app.use('/api/reservations', reservationRoutes);
app.use('/api/fines', fineRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/scan', scanRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'ShelfSense API is running' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🚀 ShelfSense API running on http://127.0.0.1:${PORT}`);
  console.log(`📚 The Digital Curator is ready.\n`);
  startExpiryCheck();
});
