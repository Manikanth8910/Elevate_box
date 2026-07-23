import { PrismaClient, DocumentStatus, User } from '@prisma/client';
import { TransactionManager } from '../transactions/transaction.manager';
import { globalEventBus } from '../events/event.bus';
import { workflowEngine, TransitionContext } from '../workflow/engine';
import { NotFoundError, ConflictError, AuthorizationError, ValidationError } from '../errors';

const prisma = new PrismaClient();

export class DocumentService {
  
  private calculateWordCount(text: string): number {
    return text.trim().split(/\s+/).length;
  }

  private calculateReadingTime(wordCount: number): number {
    return Math.ceil(wordCount / 200); // Average 200 words per minute
  }

  async createDraft(actor: User, title: string, body: string) {
    if (actor.role !== 'AUTHOR') {
      throw new AuthorizationError('Only Authors can create drafts');
    }

    const wordCount = this.calculateWordCount(body);
    const readingTime = this.calculateReadingTime(wordCount);

    return TransactionManager.execute(async (tx) => {
      const doc = await tx.document.create({
        data: {
          title,
          body,
          authorId: actor.id,
          status: DocumentStatus.DRAFT,
          wordCount,
          readingTime,
          lastEditedBy: actor.id,
          lastEditedAt: new Date(),
        }
      });

      const version = await tx.documentVersion.create({
        data: {
          documentId: doc.id,
          versionNumber: 1,
          content: JSON.stringify({ title, body }),
        }
      });

      await tx.workflowHistory.create({
        data: {
          documentId: doc.id,
          actorId: actor.id,
          fromStatus: DocumentStatus.DRAFT,
          toStatus: DocumentStatus.DRAFT,
          reason: 'Initial Draft Created',
        }
      });

      globalEventBus.publish({ eventName: 'DocumentCreated', payload: { id: doc.id }, timestamp: new Date().toISOString() });

      return doc;
    });
  }

  async editDraft(actor: User, id: string, title?: string, body?: string, currentVersion?: number) {
    const doc = await prisma.document.findUnique({ where: { id } });
    if (!doc || doc.softDeleteFlag) throw new NotFoundError('Document');
    
    if (doc.status !== DocumentStatus.DRAFT) {
      throw new ValidationError('Only drafts can be edited');
    }

    if (doc.authorId !== actor.id) {
      throw new AuthorizationError('You can only edit your own drafts');
    }

    if (currentVersion && doc.version !== currentVersion) {
      throw new ConflictError('Document has been modified by someone else since you last loaded it.');
    }

    const newTitle = title || doc.title;
    const newBody = body || doc.body;
    const wordCount = this.calculateWordCount(newBody);
    const readingTime = this.calculateReadingTime(wordCount);

    return TransactionManager.execute(async (tx) => {
      const updatedDoc = await tx.document.update({
        where: { id },
        data: {
          title: newTitle,
          body: newBody,
          version: { increment: 1 },
          wordCount,
          readingTime,
          lastEditedBy: actor.id,
          lastEditedAt: new Date(),
        }
      });

      await tx.documentVersion.create({
        data: {
          documentId: updatedDoc.id,
          versionNumber: updatedDoc.version,
          content: JSON.stringify({ title: newTitle, body: newBody }),
        }
      });

      globalEventBus.publish({ eventName: 'DocumentUpdated', payload: { id: updatedDoc.id }, timestamp: new Date().toISOString() });
      return updatedDoc;
    });
  }

  async submitDraft(actor: User, id: string) {
    const doc = await prisma.document.findUnique({ where: { id } });
    if (!doc || doc.softDeleteFlag) throw new NotFoundError('Document');

    const context: TransitionContext = {
      documentId: doc.id,
      authorId: doc.authorId,
      actorId: actor.id,
      actorRole: actor.role,
    };

    await workflowEngine.executeTransition(context, doc.status, DocumentStatus.SUBMITTED);

    return TransactionManager.execute(async (tx) => {
      const updatedDoc = await tx.document.update({
        where: { id },
        data: {
          status: DocumentStatus.SUBMITTED,
          submittedAt: new Date(),
          version: { increment: 1 },
        }
      });

      await tx.workflowHistory.create({
        data: {
          documentId: doc.id,
          actorId: actor.id,
          fromStatus: doc.status,
          toStatus: DocumentStatus.SUBMITTED,
          reason: 'Submitted for review',
        }
      });

      globalEventBus.publish({ eventName: 'DocumentSubmitted', payload: { id: updatedDoc.id }, timestamp: new Date().toISOString() });
      return updatedDoc;
    });
  }

  async assignReviewer(actor: User, id: string, reviewerId: string, priority: any, deadline: Date) {
    if (actor.role !== 'ADMIN') {
      throw new AuthorizationError('Only Admins can assign reviewers');
    }

    const doc = await prisma.document.findUnique({ where: { id } });
    if (!doc || doc.softDeleteFlag) throw new NotFoundError('Document');

    const context: TransitionContext = {
      documentId: doc.id,
      authorId: doc.authorId,
      actorId: actor.id,
      actorRole: actor.role,
    };

    // Assuming we allow transition from SUBMITTED or RESUBMITTED to ASSIGNED
    await workflowEngine.executeTransition(context, doc.status, DocumentStatus.ASSIGNED);

    return TransactionManager.execute(async (tx) => {
      const updatedDoc = await tx.document.update({
        where: { id },
        data: {
          status: DocumentStatus.ASSIGNED,
          reviewerId,
          priority,
          reviewDeadline: deadline,
          version: { increment: 1 },
        }
      });

      await tx.reviewAssignment.create({
        data: {
          documentId: doc.id,
          reviewerId,
          adminId: actor.id,
          priority,
          deadline,
        }
      });

      await tx.workflowHistory.create({
        data: {
          documentId: doc.id,
          actorId: actor.id,
          fromStatus: doc.status,
          toStatus: DocumentStatus.ASSIGNED,
          reason: 'Reviewer Assigned',
        }
      });

      globalEventBus.publish({ eventName: 'ReviewerAssigned', payload: { id: updatedDoc.id, reviewerId }, timestamp: new Date().toISOString() });
      return updatedDoc;
    });
  }

  async resubmitDocument(actor: User, id: string) {
    const doc = await prisma.document.findUnique({ where: { id } });
    if (!doc || doc.softDeleteFlag) throw new NotFoundError('Document');

    if (doc.authorId !== actor.id) {
      throw new AuthorizationError('You can only resubmit your own documents');
    }

    const context: TransitionContext = {
      documentId: doc.id,
      authorId: doc.authorId,
      actorId: actor.id,
      actorRole: actor.role,
    };

    await workflowEngine.executeTransition(context, doc.status, DocumentStatus.RESUBMITTED);

    return TransactionManager.execute(async (tx) => {
      const updatedDoc = await tx.document.update({
        where: { id },
        data: {
          status: DocumentStatus.RESUBMITTED,
          submittedAt: new Date(),
          version: { increment: 1 },
        }
      });

      await tx.workflowHistory.create({
        data: {
          documentId: doc.id,
          actorId: actor.id,
          fromStatus: doc.status,
          toStatus: DocumentStatus.RESUBMITTED,
          reason: 'Resubmitted for review',
        }
      });

      globalEventBus.publish({ eventName: 'DocumentResubmitted', payload: { id: updatedDoc.id }, timestamp: new Date().toISOString() });
      return updatedDoc;
    });
  }

  async postMessage(actor: User, documentId: string, text: string) {
    const doc = await prisma.document.findUnique({ where: { id: documentId } });
    if (!doc || doc.softDeleteFlag) throw new NotFoundError('Document');

    return TransactionManager.execute(async (tx) => {
      let thread = await tx.discussionThread.findUnique({ where: { documentId } });
      if (!thread) {
        thread = await tx.discussionThread.create({
          data: { documentId }
        });
      }

      const message = await tx.discussionMessage.create({
        data: {
          threadId: thread.id,
          authorId: actor.id,
          text,
          versionNumber: doc.version
        },
        include: {
          author: { select: { firstName: true, lastName: true, email: true } }
        }
      });

      return message;
    });
  }

  async getThread(documentId: string) {
    const thread = await prisma.discussionThread.findUnique({
      where: { documentId },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
          include: {
            author: { select: { firstName: true, lastName: true, email: true } }
          }
        }
      }
    });

    return thread;
  }
}

export const documentService = new DocumentService();
