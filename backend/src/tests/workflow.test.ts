import { describe, it, expect } from 'vitest';
import { documentStateMachine, documentTransitionValidator, TransitionContext } from '../workflow/engine';
import { DocumentStatus } from '@prisma/client';

describe('Workflow State Machine', () => {
  it('should allow DRAFT to SUBMITTED', () => {
    expect(documentStateMachine.canTransition(DocumentStatus.DRAFT, DocumentStatus.SUBMITTED)).toBe(true);
  });

  it('should deny DRAFT to APPROVED', () => {
    expect(documentStateMachine.canTransition(DocumentStatus.DRAFT, DocumentStatus.APPROVED)).toBe(false);
  });
});

describe('Workflow Validator Rules', () => {
  it('should reject submission from non-author', async () => {
    const ctx: TransitionContext = {
      documentId: '1', authorId: 'author-1', actorId: 'reviewer-1', actorRole: 'REVIEWER'
    };
    await expect(
      documentTransitionValidator.validate(ctx, DocumentStatus.DRAFT, DocumentStatus.SUBMITTED)
    ).rejects.toThrow('Only the author can submit this document.');
  });

  it('should require a comment when rejecting', async () => {
    const ctx: TransitionContext = {
      documentId: '1', authorId: 'author-1', actorId: 'reviewer-1', actorRole: 'REVIEWER'
    };
    await expect(
      documentTransitionValidator.validate(ctx, DocumentStatus.SUBMITTED, DocumentStatus.REJECTED)
    ).rejects.toThrow('A comment is required when rejecting a document.');
  });
});
