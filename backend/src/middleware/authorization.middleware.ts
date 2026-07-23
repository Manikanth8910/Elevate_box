import { Request, Response, NextFunction } from 'express';
import { policyEngine } from '../policy/policy.engine';
import { AuthorizationError } from '../errors';
import { Permission } from '@document-approval/shared';

/**
 * Middleware that guards routes using the Policy Engine.
 * Note: Resource ownership is usually evaluated within the service or controller 
 * since the resource needs to be fetched from the DB first. 
 * This middleware strictly verifies the base permission exists for the user's role.
 */
export const authorize = (permission: Permission) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = res.locals.user;
    
    if (!user) {
      return next(new AuthorizationError('User context missing. Not authenticated.'));
    }

    const isAllowed = policyEngine.can(user, permission);

    if (!isAllowed) {
      return next(new AuthorizationError(`Forbidden. Requires permission: ${permission}`));
    }

    next();
  };
};
