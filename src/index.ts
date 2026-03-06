import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import path from 'path';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

import authRoutes from './routes/auth.routes';
import urlRoutes from './routes/url.routes';
import redirectRoutes from './routes/redirect.routes';
import analyticsRoutes from './routes/analytics.routes';
import { authLimiter } from './middlewares/rateLimiter';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
export const prisma = new PrismaClient({ adapter });

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(cookieParser());

app.get('/health', async (req, res) => {
    try {
        await prisma.$queryRaw`SELECT 1`;
        res.status(200).json({ status: 'ok', database: 'connected' });
    } catch (error) {
        res.status(500).json({ status: 'error', database: 'disconnected' });
    }
});

app.use('/auth', authLimiter, authRoutes);
app.use('/urls', urlRoutes);
app.use('/urls', analyticsRoutes);

// Serve frontend client
app.use(express.static(path.join(__dirname, '../public')));

app.use('/', redirectRoutes); // Must be last

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
