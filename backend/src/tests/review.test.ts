import { describe, it, expect, vi } from 'vitest';
import { reviewService } from '../services/review.service';
import { DocumentStatus, User } from '@prisma/client';

// Mock dependencies
vi.mock('@prisma/client', async (importOriginal) => {
  const actual = await importOriginal<any>();
  return {
    ...actual,
    PrismaClient: vi.fn().mockImplementation(() => ({
      document: {
        findUnique: vi.fn().mockResolvedValue({
          id: 'doc-1',
          status: 'SUBMITTED',
          version: 2,
          authorId: 'author-1',
          softDeleteFlag: false,
        })
      }
    }))
  };
});

describe('Review Service', () => {
  const reviewer: User = {
    id: 'reviewer-1', role: 'REVIEWER', email: 'rev@test.com',
    firstName: 'Test', lastName: 'Reviewer', passwordHash: 'x', version: 1,
    createdAt: new Date(), updatedAt: new Date(), deletedAt: null
  };

  it('should throw ConflictError if optimistic lock fails during approval', async () => {
    // Attempting to approve with version 1, but DB has version 2
    await expect(reviewService.approveDocument(reviewer, 'doc-1', 1))
      .rejects.toThrow('This document has changed since you opened it. Please reload the latest version.');
  });

  it('should throw ConflictError if optimistic lock fails during rejection', async () => {
    await expect(reviewService.rejectDocument(reviewer, 'doc-1', 1, 'Needs work'))
      .rejects.toThrow('This document has changed since you opened it. Please reload the latest version.');
  });
});
