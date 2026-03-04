import { Router } from 'express';
import { getUrlAnalytics } from '../controllers/analytics.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticate);
router.get('/:id/analytics', getUrlAnalytics);

export default router;
