import { DocumentStatus } from '@prisma/client';
import { WorkflowError } from '../errors';

export interface TransitionContext {
  documentId: string;
  authorId: string;
  actorId: string;
  actorRole: string;
  metadata?: Record<string, any>;
}

export abstract class TransitionValidator {
  abstract validate(context: TransitionContext, from: DocumentStatus, to: DocumentStatus): Promise<boolean>;
}

export class StateMachine {
  private rules = new Map<DocumentStatus, DocumentStatus[]>();

  constructor() {
    this.rules.set(DocumentStatus.DRAFT, [DocumentStatus.SUBMITTED, DocumentStatus.ARCHIVED]);
    this.rules.set(DocumentStatus.SUBMITTED, [DocumentStatus.ASSIGNED, DocumentStatus.ARCHIVED]);
    this.rules.set(DocumentStatus.ASSIGNED, [DocumentStatus.UNDER_REVIEW]);
    this.rules.set(DocumentStatus.UNDER_REVIEW, [DocumentStatus.CHANGES_REQUESTED, DocumentStatus.REVIEWER_APPROVED, DocumentStatus.REJECTED]);
    this.rules.set(DocumentStatus.CHANGES_REQUESTED, [DocumentStatus.RESUBMITTED]);
    this.rules.set(DocumentStatus.RESUBMITTED, [DocumentStatus.ASSIGNED, DocumentStatus.UNDER_REVIEW, DocumentStatus.ARCHIVED]);
    this.rules.set(DocumentStatus.REJECTED, [DocumentStatus.DRAFT]);
    this.rules.set(DocumentStatus.REVIEWER_APPROVED, [DocumentStatus.PUBLISHED, DocumentStatus.ARCHIVED, DocumentStatus.RESUBMITTED]);
    this.rules.set(DocumentStatus.PUBLISHED, [DocumentStatus.ARCHIVED]);
  }

  canTransition(from: DocumentStatus, to: DocumentStatus): boolean {
    return this.rules.get(from)?.includes(to) ?? false;
  }
}

export class DocumentTransitionValidator extends TransitionValidator {
  async validate(context: TransitionContext, from: DocumentStatus, to: DocumentStatus): Promise<boolean> {
    // Only Author creates drafts (handled at creation)
    
    // Only Draft can be submitted (handled by StateMachine)
    if (to === DocumentStatus.SUBMITTED) {
      if (context.actorRole !== 'AUTHOR' || context.actorId !== context.authorId) {
        throw new WorkflowError('Only the author can submit this document.');
      }
    }

    if (to === DocumentStatus.REVIEWER_APPROVED || to === DocumentStatus.REJECTED) {
      if (context.actorRole !== 'REVIEWER') {
        throw new WorkflowError('Only reviewers can approve or reject.');
      }
      if (context.actorId === context.authorId) {
        throw new WorkflowError('Reviewers cannot approve or reject their own documents.');
      }
    }

    if (to === DocumentStatus.REJECTED) {
      if (!context.metadata?.comment || context.metadata.comment.trim().length === 0) {
        throw new WorkflowError('A comment is required when rejecting a document.');
      }
    }

    if (to === DocumentStatus.PUBLISHED) {
      if (context.actorRole !== 'ADMIN' && context.actorRole !== 'REVIEWER') {
        throw new WorkflowError('Only Admins or Reviewers can publish.');
      }
    }

    if (to === DocumentStatus.ARCHIVED) {
      if (context.actorRole !== 'ADMIN') {
        throw new WorkflowError('Only Admins can archive documents.');
      }
    }

    return true;
  }
}

export class WorkflowEngine {
  constructor(
    private stateMachine: StateMachine,
    private validators: TransitionValidator[]
  ) {}

  async executeTransition(context: TransitionContext, from: DocumentStatus, to: DocumentStatus): Promise<void> {
    if (!this.stateMachine.canTransition(from, to)) {
      throw new WorkflowError(`Invalid transition from ${from} to ${to}`);
    }

    for (const validator of this.validators) {
      const isValid = await validator.validate(context, from, to);
      if (!isValid) {
        throw new WorkflowError(`Transition validation failed for ${from} -> ${to}`);
      }
    }
  }
}

export const documentStateMachine = new StateMachine();
export const documentTransitionValidator = new DocumentTransitionValidator();
export const workflowEngine = new WorkflowEngine(documentStateMachine, [documentTransitionValidator]);
