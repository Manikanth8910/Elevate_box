import { Role, Permission } from '@document-approval/shared';

export const RolePermissions: Record<Role, Permission[]> = {
  [Role.VIEWER]: [
    Permission.VIEW_PUBLISHED,
    Permission.VIEW_PROFILE,
  ],
  [Role.AUTHOR]: [
    Permission.VIEW_PUBLISHED,
    Permission.VIEW_PROFILE,
    Permission.CREATE_DRAFT,
    Permission.EDIT_OWN_DRAFT,
    Permission.SUBMIT_DRAFT,
    Permission.REOPEN_REJECTED,
    Permission.VIEW_OWN_HISTORY,
  ],
  [Role.REVIEWER]: [
    Permission.VIEW_PUBLISHED,
    Permission.VIEW_PROFILE,
    Permission.VIEW_REVIEW_QUEUE,
    Permission.APPROVE_DOC,
    Permission.REJECT_DOC,
    Permission.PUBLISH_DOC,
    Permission.VIEW_ANY_HISTORY,
  ],
  [Role.ADMIN]: [
    Permission.VIEW_PUBLISHED,
    Permission.VIEW_PROFILE,
    Permission.VIEW_ALL_DOCS,
    Permission.PUBLISH_DOC,
    Permission.ARCHIVE_ANY_DOC,
    Permission.VIEW_USERS,
    Permission.VIEW_AUDIT_LOGS,
    Permission.VIEW_ANALYTICS,
    Permission.MANAGE_SYSTEM,
  ],
};
