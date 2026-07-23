import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

export class AuditService {
  async getAuditLogs(filters: { actorId?: string; action?: string; entityType?: string; page?: number; limit?: number }) {
    const page = filters.page || 1;
    const limit = filters.limit || 50;
    const skip = (page - 1) * limit;

    const where: Prisma.AuditLogWhereInput = {};
    if (filters.actorId) where.actorId = filters.actorId;
    if (filters.action) where.action = filters.action;
    if (filters.entityType) where.entityType = filters.entityType;

    const logs = await prisma.auditLog.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    });

    const total = await prisma.auditLog.count({ where });

    return { logs, total, page, limit };
  }

  // Activity Feed (User facing, distinct from strict AuditLog)
  async getActivityFeed(page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;
    const feed = await prisma.activityFeed.findMany({
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        actor: { select: { firstName: true, lastName: true, email: true, role: true } }
      }
    });

    const total = await prisma.activityFeed.count();
    return { feed, total, page, limit };
  }
}

export const auditService = new AuditService();
