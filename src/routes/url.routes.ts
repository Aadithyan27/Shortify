import { Router } from 'express';
import { createShortUrl, getUrls, deleteUrl } from '../controllers/url.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { urlCreationLimiter } from '../middlewares/rateLimiter';

const router = Router();

router.use(authenticate);

router.post('/', urlCreationLimiter, createShortUrl);
router.get('/', getUrls);
router.delete('/:id', deleteUrl);

export default router;
