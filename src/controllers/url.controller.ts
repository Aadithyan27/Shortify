import { Request, Response } from 'express';
import { prisma } from '../index';
import { nanoid } from 'nanoid';
import { redis } from '../services/redis.service';

export const createShortUrl = async (req: Request, res: Response): Promise<void> => {
    try {
        const { original_url, expires_at } = req.body;
        const userId = req.user?.userId;

        if (!original_url || !userId) {
            res.status(400).json({ error: 'Original URL is required' });
            return;
        }

        const short_code = nanoid(7);

        const url = await prisma.url.create({
            data: {
                original_url,
                short_code,
                owner_id: userId,
                expires_at: expires_at ? new Date(expires_at) : null,
            }
        });

        res.status(201).json({ message: 'Short URL created', url });
    } catch (error) {
        console.error('Create URL error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const getUrls = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        const urls = await prisma.url.findMany({
            where: { owner_id: userId },
            orderBy: { created_at: 'desc' }
        });

        res.status(200).json({ urls });
    } catch (error) {
        console.error('Get URLs error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const deleteUrl = async (req: Request, res: Response): Promise<void> => {
    try {
        const id = req.params.id as string;
        const userId = req.user?.userId;

        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        const url = await prisma.url.findUnique({ where: { id } });

        if (!url) {
            res.status(404).json({ error: 'URL not found' });
            return;
        }

        if (url.owner_id !== userId) {
            res.status(403).json({ error: 'Forbidden: You do not own this URL' });
            return;
        }

        await prisma.url.delete({ where: { id } });

        try {
            if (redis.status === 'ready') {
                await redis.del(`url:${url.short_code}`);
            }
        } catch (redisErr) {
            console.warn('Failed to delete cache:', redisErr);
        }

        res.status(200).json({ message: 'URL deleted successfully' });
    } catch (error) {
        console.error('Delete URL error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
