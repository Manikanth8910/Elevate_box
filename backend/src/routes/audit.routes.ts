import { Router } from 'express';
import { auditController } from '../controllers/audit.controller';
import { authenticate } from '../middleware/authenticate.middleware';
import { authorize } from '../middleware/authorization.middleware';
import { Permission } from '@document-approval/shared';

const router = Router();

router.use(authenticate);

// Global Activity Feed
router.get('/activity', authorize(Permission.VIEW_PUBLISHED), auditController.getActivityFeed);

// Strict Audit Log (Admin Only)
router.get('/audit', authorize(Permission.VIEW_USERS), auditController.getAuditLogs);

export default router;
