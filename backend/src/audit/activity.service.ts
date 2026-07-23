import { PrismaClient } from '@prisma/client';

export interface ActivityRecord {
  actorId: string;
  action: string;
  entityType: string;
  entityId: string;
  summary: string;
}

export class ActivityService {
  constructor(private tx: Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>) {}

  async createActivity(record: ActivityRecord): Promise<void> {
    await this.tx.activityFeed.create({
      data: {
        actorId: record.actorId,
        action: record.action,
        entityType: record.entityType,
        entityId: record.entityId,
        summary: record.summary,
      }
    });
  }
}
