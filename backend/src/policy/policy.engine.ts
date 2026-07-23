import { User } from '@prisma/client';
import { Permission, Role } from '@document-approval/shared';
import { RolePermissions } from './role-permissions';

export interface ResourceContext {
  id?: string;
  ownerId?: string;
  status?: string;
}

export class PolicyEngine {
  /**
   * Evaluates if a user can perform an action (Permission) on a resource.
   */
  can(user: User, action: Permission, resource?: ResourceContext): boolean {
    const userRole = user.role as Role;
    const permissions = RolePermissions[userRole] || [];

    // 1. Check if the role has the base permission
    if (!permissions.includes(action)) {
      return false;
    }

    // 2. Resource ownership & specific checks
    if (resource) {
      // Author checks
      if (userRole === Role.AUTHOR) {
        // Authors can only edit/submit their OWN drafts
        if (
          (action === Permission.EDIT_OWN_DRAFT || action === Permission.SUBMIT_DRAFT) && 
          resource.ownerId !== user.id
        ) {
          return false;
        }
      }

      // Reviewer checks
      if (userRole === Role.REVIEWER) {
        // Reviewers cannot approve/reject their OWN documents (if they somehow authored it)
        if (
          (action === Permission.APPROVE_DOC || action === Permission.REJECT_DOC) &&
          resource.ownerId === user.id
        ) {
          return false;
        }
      }
    }

    return true;
  }
}

export const policyEngine = new PolicyEngine();
