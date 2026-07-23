import { PrismaClient } from '@prisma/client';
import { globalEventBus } from '../events/event.bus';

export interface AuditRecord {
  actorId?: string;
  action: string;
  entityType: string;
  entityId: string;
  oldState?: any;
  newState?: any;
  metadata?: any;
  ipAddress?: string;
  userAgent?: string;
}

export class AuditService {
  constructor(private tx: Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>) {}

  async log(record: AuditRecord): Promise<void> {
    const log = await this.tx.auditLog.create({
      data: {
        actorId: record.actorId,
        action: record.action,
        entityType: record.entityType,
        entityId: record.entityId,
        oldState: record.oldState,
        newState: record.newState,
        metadata: record.metadata,
        ipAddress: record.ipAddress,
        userAgent: record.userAgent,
      }
    });

    // Publish event for analytics or monitoring, independent of the transaction
    globalEventBus.publish({
      eventName: 'AUDIT_LOG_CREATED',
      payload: log,
      timestamp: new Date().toISOString()
    });
  }
}
