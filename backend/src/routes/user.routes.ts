import { Router } from 'express';
import { userController } from '../controllers/user.controller';
import { authenticate } from '../middleware/authenticate.middleware';
import { authorize } from '../middleware/authorization.middleware';
import { Permission } from '@document-approval/shared';

const router = Router();

// Only authenticated users with VIEW_USERS permission can access
router.get('/', authenticate, authorize(Permission.VIEW_USERS), userController.list);
router.get('/:id', authenticate, authorize(Permission.VIEW_USERS), userController.getById);

export default router;
