import { Request, Response } from 'express';
import { prisma } from '../index';
import { redis } from '../services/redis.service';
import crypto from 'crypto';

export const redirectUrl = async (req: Request, res: Response): Promise<void> => {
    try {
        const shortCode = req.params.shortCode as string;

        let originalUrl: string | null = null;
        let urlId: string | null = null;
        let expiresAt: Date | null = null;

        // Try Redis cache first
        try {
            if (redis.status === 'ready') {
                const cached = await redis.get(`url:${shortCode}`);
                if (cached) {
                    const parsed = JSON.parse(cached);
                    originalUrl = parsed.originalUrl;
                    urlId = parsed.urlId;
                    expiresAt = parsed.expiresAt ? new Date(parsed.expiresAt) : null;
                }
            }
        } catch (e) {
            console.warn('Redis get failed:', e);
        }

        if (!originalUrl) {
            const urlRecord = await prisma.url.findUnique({ where: { short_code: shortCode } });

            if (!urlRecord) {
                res.status(404).json({ error: 'URL not found or expired' });
                return;
            }

            if (urlRecord.expires_at && urlRecord.expires_at < new Date()) {
                res.status(410).json({ error: 'URL expired' });
                return;
            }

            originalUrl = urlRecord.original_url;
            urlId = urlRecord.id;
            expiresAt = urlRecord.expires_at ?? null;

            // Cache the URL data in Redis
            try {
                if (redis.status === 'ready') {
                    await redis.set(
                        `url:${shortCode}`,
                        JSON.stringify({ originalUrl, urlId, expiresAt }),
                        'EX',
                        3600 // 1 hour
                    );
                }
            } catch (e) {
                console.warn('Redis set failed:', e);
            }
        }

        // Check expiry even on cache hit
        if (expiresAt && expiresAt < new Date()) {
            res.status(410).json({ error: 'URL expired' });
            return;
        }

        const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
        const userAgent = req.headers['user-agent'] || 'unknown';
        const hashedIp = crypto.createHash('sha256').update(String(ip)).digest('hex');

        // Fire-and-forget analytics logging
        if (urlId) {
            prisma.analytics.create({
                data: {
                    url_id: urlId,
                    hashed_ip: hashedIp,
                    user_agent: String(userAgent),
                }
            }).catch(err => console.error('Failed to save analytics', err));
        }

        res.redirect(302, originalUrl as string);
    } catch (error) {
        console.error('Redirect error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
