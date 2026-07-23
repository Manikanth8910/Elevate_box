import { PrismaClient, DocumentStatus, User } from '@prisma/client';
import { TransactionManager } from '../transactions/transaction.manager';
import { globalEventBus } from '../events/event.bus';
import { workflowEngine, TransitionContext } from '../workflow/engine';
import { NotFoundError, ConflictError, AuthorizationError } from '../errors';

const prisma = new PrismaClient();

export class ReviewService {
  async startReview(actor: User, id: string) {
    const doc = await prisma.document.findUnique({ where: { id } });
    if (!doc || doc.softDeleteFlag) throw new NotFoundError('Document');

    const context: TransitionContext = {
      documentId: doc.id,
      authorId: doc.authorId,
      actorId: actor.id,
      actorRole: actor.role,
    };

    await workflowEngine.executeTransition(context, doc.status, DocumentStatus.UNDER_REVIEW);

    return TransactionManager.execute(async (tx) => {
      const updatedDoc = await tx.document.update({
        where: { id },
        data: {
          status: DocumentStatus.UNDER_REVIEW,
          updatedAt: new Date(),
        }
      });

      await tx.workflowHistory.create({
        data: {
          documentId: doc.id,
          actorId: actor.id,
          fromStatus: doc.status,
          toStatus: DocumentStatus.UNDER_REVIEW,
          reason: 'Review Started',
        }
      });

      await tx.activityFeed.create({
        data: {
          actorId: actor.id,
          action: 'REVIEW_STARTED',
          entityType: 'Document',
          entityId: doc.id,
          summary: JSON.stringify({ version: updatedDoc.version }),
        }
      });

      return updatedDoc;
    });
  }

  async approveDocument(actor: User, id: string, version: number) {
    const doc = await prisma.document.findUnique({ where: { id } });
    if (!doc || doc.softDeleteFlag) throw new NotFoundError('Document');

    // Optimistic Concurrency Check
    if (doc.version !== version) {
      throw new ConflictError('This document has changed since you opened it. Please reload the latest version.');
    }

    const context: TransitionContext = {
      documentId: doc.id,
      authorId: doc.authorId,
      actorId: actor.id,
      actorRole: actor.role,
    };

    // State Machine Validation (Under Review -> Reviewer Approved)
    await workflowEngine.executeTransition(context, doc.status, DocumentStatus.REVIEWER_APPROVED);

    return TransactionManager.execute(async (tx) => {
      const updatedDoc = await tx.document.update({
        where: { id },
        data: {
          status: DocumentStatus.REVIEWER_APPROVED,
          approvedAt: new Date(),
          reviewerId: actor.id,
          version: { increment: 1 },
        }
      });

      await tx.workflowHistory.create({
        data: {
          documentId: doc.id,
          actorId: actor.id,
          fromStatus: doc.status,
          toStatus: DocumentStatus.REVIEWER_APPROVED,
          reason: 'Document Approved',
        }
      });

      await tx.reviewDecision.create({
        data: {
          documentId: doc.id,
          reviewerId: actor.id,
          decision: 'APPROVE',
          version: updatedDoc.version,
        }
      });

      await tx.activityFeed.create({
        data: {
          actorId: actor.id,
          action: 'APPROVED',
          entityType: 'Document',
          entityId: doc.id,
          summary: JSON.stringify({ version: updatedDoc.version }),
        }
      });

      globalEventBus.publish({ eventName: 'DocumentApproved', payload: { id: updatedDoc.id, authorId: updatedDoc.authorId, reviewerId: actor.id }, timestamp: new Date().toISOString() });

      return updatedDoc;
    });
  }

  async rejectDocument(actor: User, id: string, version: number, comment: string) {
    const doc = await prisma.document.findUnique({ where: { id }, include: { versions: { orderBy: { versionNumber: 'desc' }, take: 1 } } });
    if (!doc || doc.softDeleteFlag) throw new NotFoundError('Document');

    if (doc.version !== version) {
      throw new ConflictError('This document has changed since you opened it. Please reload the latest version.');
    }

    const context: TransitionContext = {
      documentId: doc.id,
      authorId: doc.authorId,
      actorId: actor.id,
      actorRole: actor.role,
      metadata: { comment },
    };

    // State Machine Validation (Under Review -> Rejected)
    await workflowEngine.executeTransition(context, doc.status, DocumentStatus.REJECTED);

    return TransactionManager.execute(async (tx) => {
      const updatedDoc = await tx.document.update({
        where: { id },
        data: {
          status: DocumentStatus.REJECTED,
          reviewerId: actor.id,
          version: { increment: 1 },
        }
      });

      let createdDecision;
      
      createdDecision = await tx.reviewDecision.create({
        data: {
          documentId: doc.id,
          reviewerId: actor.id,
          decision: 'REJECT',
          version: updatedDoc.version,
        }
      });

      // Save mandatory rejection comment
      const latestVersionId = doc.versions[0]?.id;
      if (latestVersionId) {
        await tx.comment.create({
          data: {
            versionId: latestVersionId,
            authorId: actor.id,
            text: comment,
            type: 'SUMMARY',
            severity: 'BLOCKER',
            resolutionStatus: 'OPEN',
            decisionId: createdDecision.id
          }
        });
      }

      await tx.workflowHistory.create({
        data: {
          documentId: doc.id,
          actorId: actor.id,
          fromStatus: doc.status,
          toStatus: DocumentStatus.REJECTED,
          reason: comment,
        }
      });

      await tx.activityFeed.create({
        data: {
          actorId: actor.id,
          action: 'REJECTED',
          entityType: 'Document',
          entityId: doc.id,
          summary: JSON.stringify({ comment, version: updatedDoc.version }),
        }
      });

      globalEventBus.publish({ eventName: 'DocumentRejected', payload: { id: updatedDoc.id, authorId: updatedDoc.authorId, reviewerId: actor.id, comment }, timestamp: new Date().toISOString() });

      return updatedDoc;
    });
  }

  async publishDocument(actor: User, id: string) {
    const doc = await prisma.document.findUnique({ where: { id } });
    if (!doc || doc.softDeleteFlag) throw new NotFoundError('Document');

    const context: TransitionContext = {
      documentId: doc.id,
      authorId: doc.authorId,
      actorId: actor.id,
      actorRole: actor.role,
    };

    // State Machine Validation (Reviewer Approved -> Published)
    await workflowEngine.executeTransition(context, doc.status, DocumentStatus.PUBLISHED);

    return TransactionManager.execute(async (tx) => {
      const updatedDoc = await tx.document.update({
        where: { id },
        data: {
          status: DocumentStatus.PUBLISHED,
          publishedAt: new Date(),
          version: { increment: 1 },
        }
      });

      await tx.workflowHistory.create({
        data: {
          documentId: doc.id,
          actorId: actor.id,
          fromStatus: doc.status,
          toStatus: DocumentStatus.PUBLISHED,
          reason: 'Document Published',
        }
      });

      await tx.activityFeed.create({
        data: {
          actorId: actor.id,
          action: 'PUBLISHED',
          entityType: 'Document',
          entityId: doc.id,
          summary: JSON.stringify({ version: updatedDoc.version }),
        }
      });

      globalEventBus.publish({ eventName: 'DocumentPublished', payload: { id: updatedDoc.id, authorId: updatedDoc.authorId }, timestamp: new Date().toISOString() });

      return updatedDoc;
    });
  }

  async archiveDocument(actor: User, id: string) {
    const doc = await prisma.document.findUnique({ where: { id } });
    if (!doc || doc.softDeleteFlag) throw new NotFoundError('Document');

    const context: TransitionContext = {
      documentId: doc.id,
      authorId: doc.authorId,
      actorId: actor.id,
      actorRole: actor.role,
    };

    // State Machine Validation (Any -> Archived)
    await workflowEngine.executeTransition(context, doc.status, DocumentStatus.ARCHIVED);

    return TransactionManager.execute(async (tx) => {
      const updatedDoc = await tx.document.update({
        where: { id },
        data: {
          status: DocumentStatus.ARCHIVED,
          version: { increment: 1 },
        }
      });

      await tx.workflowHistory.create({
        data: {
          documentId: doc.id,
          actorId: actor.id,
          fromStatus: doc.status,
          toStatus: DocumentStatus.ARCHIVED,
          reason: 'Document Archived by Admin',
        }
      });

      await tx.activityFeed.create({
        data: {
          actorId: actor.id,
          action: 'ARCHIVED',
          entityType: 'Document',
          entityId: doc.id,
          summary: JSON.stringify({ version: updatedDoc.version }),
        }
      });

      globalEventBus.publish({ eventName: 'DocumentArchived', payload: { id: updatedDoc.id }, timestamp: new Date().toISOString() });

      return updatedDoc;
    });
  }

  async requestChanges(actor: User, id: string, version: number, comment: string) {
    const doc = await prisma.document.findUnique({ where: { id }, include: { versions: { orderBy: { versionNumber: 'desc' }, take: 1 } } });
    if (!doc || doc.softDeleteFlag) throw new NotFoundError('Document');

    if (doc.version !== version) {
      throw new ConflictError('This document has changed since you opened it. Please reload the latest version.');
    }

    const context: TransitionContext = {
      documentId: doc.id,
      authorId: doc.authorId,
      actorId: actor.id,
      actorRole: actor.role,
      metadata: { comment },
    };

    // State Machine Validation (Under Review -> Changes Requested)
    await workflowEngine.executeTransition(context, doc.status, DocumentStatus.CHANGES_REQUESTED);

    return TransactionManager.execute(async (tx) => {
      const updatedDoc = await tx.document.update({
        where: { id },
        data: {
          status: DocumentStatus.CHANGES_REQUESTED,
          reviewerId: actor.id,
          version: { increment: 1 },
        }
      });

      const createdDecision = await tx.reviewDecision.create({
        data: {
          documentId: doc.id,
          reviewerId: actor.id,
          decision: 'REQUEST_CHANGES',
          version: updatedDoc.version,
        }
      });

      const latestVersionId = doc.versions[0]?.id;
      if (latestVersionId) {
        await tx.comment.create({
          data: {
            versionId: latestVersionId,
            authorId: actor.id,
            text: comment,
            type: 'SUMMARY',
            severity: 'WARNING',
            resolutionStatus: 'OPEN',
            decisionId: createdDecision.id
          }
        });
      }

      await tx.workflowHistory.create({
        data: {
          documentId: doc.id,
          actorId: actor.id,
          fromStatus: doc.status,
          toStatus: DocumentStatus.CHANGES_REQUESTED,
          reason: comment,
        }
      });

      await tx.activityFeed.create({
        data: {
          actorId: actor.id,
          action: 'CHANGES_REQUESTED',
          entityType: 'Document',
          entityId: doc.id,
          summary: JSON.stringify({ comment, version: updatedDoc.version }),
        }
      });

      globalEventBus.publish({ eventName: 'DocumentChangesRequested', payload: { id: updatedDoc.id, authorId: updatedDoc.authorId, reviewerId: actor.id, comment }, timestamp: new Date().toISOString() });

      return updatedDoc;
    });
  }
}

export const reviewService = new ReviewService();
