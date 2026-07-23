import { DocumentStatus } from '@document-approval/shared';

export interface TransitionContext {
  documentId: string;
  actorId: string;
  actorRole: string;
  metadata?: Record<string, any>;
}

export abstract class StateMachine {
  protected abstract transitions: Record<DocumentStatus, DocumentStatus[]>;

  canTransition(from: DocumentStatus, to: DocumentStatus): boolean {
    return this.transitions[from]?.includes(to) ?? false;
  }
}

export class DocumentStateMachine extends StateMachine {
  protected transitions = {
    [DocumentStatus.DRAFT]: [DocumentStatus.SUBMITTED],
    [DocumentStatus.SUBMITTED]: [DocumentStatus.UNDER_REVIEW, DocumentStatus.APPROVED, DocumentStatus.REJECTED],
    [DocumentStatus.UNDER_REVIEW]: [DocumentStatus.APPROVED, DocumentStatus.REJECTED],
    [DocumentStatus.APPROVED]: [DocumentStatus.PUBLISHED],
    [DocumentStatus.REJECTED]: [DocumentStatus.DRAFT],
    [DocumentStatus.PUBLISHED]: [DocumentStatus.ARCHIVED],
    [DocumentStatus.ARCHIVED]: [],
  };
}

export class WorkflowService {
  private stateMachine = new DocumentStateMachine();

  public validateTransition(from: DocumentStatus, to: DocumentStatus) {
    if (!this.stateMachine.canTransition(from, to)) {
      throw new Error(`Invalid transition from ${from} to ${to}`);
    }
  }

  // Implementation to be added: Execute transition within a transaction
}
