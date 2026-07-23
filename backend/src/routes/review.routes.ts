import { Router } from 'express';
import { reviewController } from '../controllers/review.controller';
import { authenticate } from '../middleware/authenticate.middleware';
import { authorize } from '../middleware/authorization.middleware';
import { Permission } from '@document-approval/shared';

const router = Router();

router.use(authenticate);

// Review Queue
router.get('/', authorize(Permission.VIEW_REVIEW_QUEUE), reviewController.getReviewQueue);

// Review Actions (Note: documentId is in the path, usually mounted under /api/v1/reviews or documents)
// For architectural consistency, these will be mounted under /api/v1/documents in index.ts, 
// so the path here is just for standalone review operations if needed.

export default router;
