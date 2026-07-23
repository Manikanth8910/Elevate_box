import { Router } from 'express';
import { documentController } from '../controllers/document.controller';
import { authenticate } from '../middleware/authenticate.middleware';
import { authorize } from '../middleware/authorization.middleware';
import { Permission } from '@document-approval/shared';

const router = Router();

// Apply auth middleware to all document routes
router.use(authenticate);

// Create draft (Author only)
router.post('/', authorize(Permission.CREATE_DRAFT), documentController.create);

// List/Search documents (Viewer and above)
router.get('/', authorize(Permission.VIEW_PUBLISHED), documentController.list);

// Get specific document (Viewer and above)
router.get('/:id', authorize(Permission.VIEW_PUBLISHED), documentController.get);

// Update draft (Author only)
router.patch('/:id', authorize(Permission.EDIT_OWN_DRAFT), documentController.update);

// Submit draft (Author only)
router.post('/:id/submit', authorize(Permission.SUBMIT_DRAFT), documentController.submit);

// Resubmit draft (Author only)
router.post('/:id/resubmit', authorize(Permission.SUBMIT_DRAFT), documentController.resubmit);

// Assign reviewer (Admin only)
router.post('/:id/assign', authorize(Permission.VIEW_USERS), documentController.assign);

// Discussion Thread
router.get('/:id/chat', documentController.getThread);
router.post('/:id/chat', documentController.postMessage);

// Review Actions
import { reviewController } from '../controllers/review.controller';
router.post('/:id/start-review', authorize(Permission.APPROVE_DOC), reviewController.startReview);
router.post('/:id/approve', authorize(Permission.APPROVE_DOC), reviewController.approve);
router.post('/:id/reject', authorize(Permission.APPROVE_DOC), reviewController.reject);
router.post('/:id/request-changes', authorize(Permission.APPROVE_DOC), reviewController.requestChanges);
router.post('/:id/publish', authorize(Permission.PUBLISH_DOC), reviewController.publish);
router.post('/:id/archive', authorize(Permission.VIEW_USERS), reviewController.archive); // Only Admins have VIEW_USERS, which is effectively ADMIN permission

// Version & Comparison Actions
import { versionController } from '../controllers/version.controller';
router.get('/:id/versions', authorize(Permission.VIEW_PUBLISHED), versionController.getVersions);
router.get('/:id/versions/:versionNumber', authorize(Permission.VIEW_PUBLISHED), versionController.getVersion);
router.get('/:id/compare', authorize(Permission.VIEW_PUBLISHED), versionController.compareVersions);

export default router;
