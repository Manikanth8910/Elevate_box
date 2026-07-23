import { Router } from 'express';
import { activityController } from '../controllers/activity.controller';
import { authenticate } from '../middleware/authenticate.middleware';

const router = Router();

// Activity Queries
router.get('/recent', authenticate, activityController.getRecentActivity);
router.get('/history', authenticate, activityController.getActivityHistory);

// Exports
router.post('/export/csv', authenticate, activityController.exportCsv);
router.post('/export/pdf', authenticate, activityController.exportPdf);

export default router;
