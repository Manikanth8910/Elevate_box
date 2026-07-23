import { describe, it, expect } from 'vitest';
import { PolicyEngine } from '../policy/policy.engine';
import { Permission, Role } from '@document-approval/shared';
import { User } from '@prisma/client';

describe('Policy Engine', () => {
  const engine = new PolicyEngine();

  const authorUser: User = {
    id: 'author-1', email: 'author@test.com', firstName: 'Test', lastName: 'Author',
    role: Role.AUTHOR, version: 1, passwordHash: 'x', createdAt: new Date(), updatedAt: new Date(), deletedAt: null
  };

  const reviewerUser: User = {
    id: 'reviewer-1', email: 'reviewer@test.com', firstName: 'Test', lastName: 'Reviewer',
    role: Role.REVIEWER, version: 1, passwordHash: 'x', createdAt: new Date(), updatedAt: new Date(), deletedAt: null
  };

  it('should allow author to edit their own draft', () => {
    const isAllowed = engine.can(authorUser, Permission.EDIT_OWN_DRAFT, { ownerId: 'author-1' });
    expect(isAllowed).toBe(true);
  });

  it('should deny author from editing someone else’s draft', () => {
    const isAllowed = engine.can(authorUser, Permission.EDIT_OWN_DRAFT, { ownerId: 'author-2' });
    expect(isAllowed).toBe(false);
  });

  it('should allow reviewer to approve docs not owned by them', () => {
    const isAllowed = engine.can(reviewerUser, Permission.APPROVE_DOC, { ownerId: 'author-1' });
    expect(isAllowed).toBe(true);
  });

  it('should deny reviewer from approving their own doc', () => {
    const isAllowed = engine.can(reviewerUser, Permission.APPROVE_DOC, { ownerId: 'reviewer-1' });
    expect(isAllowed).toBe(false);
  });
});
