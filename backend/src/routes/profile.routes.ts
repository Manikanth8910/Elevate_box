import { Router } from 'express';
import { profileController, analyticsController, timelineController } from '../controllers/profile.controller';
import { authenticate } from '../middleware/authenticate.middleware';

const router = Router();

// Profile Information & Preferences
router.get('/', authenticate, profileController.getProfile);
router.get('/preferences', authenticate, profileController.getPreferences);
router.patch('/preferences', authenticate, profileController.updatePreferences);

// Analytics & KPIs
router.get('/analytics', authenticate, analyticsController.getAnalytics);

// Timeline
router.get('/timeline', authenticate, timelineController.getTimeline);

export default router;
