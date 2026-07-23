import { Request, Response, NextFunction } from 'express';
import { Role } from '@document-approval/shared';
import { APIError } from '../utils/response';

export const requireRole = (allowedRoles: Role[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const userRole = res.locals.user?.role as Role;
    
    if (!userRole) {
      return next(new APIError(401, 'Unauthorized - No role found'));
    }

    if (!allowedRoles.includes(userRole)) {
      return next(new APIError(403, 'Forbidden - Insufficient permissions'));
    }

    next();
  };
};
