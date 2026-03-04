import { Request, Response } from 'express';
import { prisma } from '../index';

export const getUrlAnalytics = async (req: Request, res: Response): Promise<void> => {
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
            res.status(403).json({ error: 'Forbidden' });
            return;
        }

        const totalClicks = await prisma.analytics.count({
            where: { url_id: id }
        });

        const recentAnalytics = await prisma.analytics.findMany({
            where: { url_id: id },
            orderBy: { timestamp: 'desc' },
            take: 100
        });

        res.status(200).json({
            url: {
                original_url: url.original_url,
                short_code: url.short_code,
                created_at: url.created_at,
                expires_at: url.expires_at
            },
            stats: {
                total_clicks: totalClicks,
            },
            recent_activity: recentAnalytics
        });
    } catch (error) {
        console.error('Analytics error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
