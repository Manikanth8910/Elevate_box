import { globalEventBus } from './event.bus';
import { PrismaClient, EventType } from '@prisma/client';

const prisma = new PrismaClient();

export function registerConsumers() {
  globalEventBus.subscribe('DocumentApproved', async (event) => {
    const { id, authorId, reviewerId } = event.payload;
    console.log(`[Event] DocumentApproved processed for doc ${id}`);

    // Create Notification for Author
    await prisma.notification.create({
      data: {
        userId: authorId,
        title: 'Document Approved',
        message: 'Your document has been approved and is ready to be published.',
        type: EventType.INFO,
        isRead: false,
      }
    });

    // Update Analytics (Approval Rate) - simplified for demo
    await prisma.analyticsSnapshots.create({
      data: {
        metricName: 'document_approvals',
        metricValue: 1,
        dimensions: JSON.stringify({ reviewerId }),
      }
    });
  });

  globalEventBus.subscribe('DocumentRejected', async (event) => {
    const { id, authorId, reviewerId, comment } = event.payload;
    console.log(`[Event] DocumentRejected processed for doc ${id}`);

    // Create Notification for Author
    await prisma.notification.create({
      data: {
        userId: authorId,
        title: 'Document Rejected',
        message: 'Your document was rejected.',
        type: EventType.WARNING,
        isRead: false,
      }
    });

    // Update Analytics
    await prisma.analyticsSnapshots.create({
      data: {
        metricName: 'document_rejections',
        metricValue: 1,
        dimensions: JSON.stringify({ reviewerId }),
      }
    });
  });

  globalEventBus.subscribe('DocumentPublished', async (event) => {
    const { id, authorId } = event.payload;
    console.log(`[Event] DocumentPublished processed for doc ${id}`);

    await prisma.notification.create({
      data: {
        userId: authorId,
        title: 'Document Published',
        message: 'Your document is now live.',
        type: EventType.INFO,
        isRead: false,
      }
    });
  });

  // --- STRICT AUDIT LOG SUBSCRIBER ---
  // We attach a wildcard or individual listeners for all domain events to write to the immutable AuditLog.
  const auditEvents = ['DocumentCreated', 'DocumentUpdated', 'DocumentSubmitted', 'DocumentApproved', 'DocumentRejected', 'DocumentPublished'];
  
  auditEvents.forEach(eventName => {
    globalEventBus.subscribe(eventName, async (event) => {
      try {
        await prisma.auditLog.create({
          data: {
            actorId: event.payload.reviewerId || event.payload.authorId || 'SYSTEM',
            action: eventName,
            entityType: 'Document',
            entityId: event.payload.id,
            newState: event.payload as any,
          }
        });
        console.log(`[Audit] Immutable log created for ${eventName} on Document ${event.payload.id}`);
      } catch (err) {
        console.error('[Audit] Failed to write audit log. This is a critical failure.', err);
      }
    });
  });
}
