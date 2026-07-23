import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

export interface ActivityFilter {
  page?: number;
  limit?: number;
  sort?: 'asc' | 'desc';
  action?: string;
  documentId?: string;
  actorId?: string;
  dateFrom?: string;
  dateTo?: string;
}

export class ActivityService {
  async getRecentActivity(userId: string, limit: number = 10) {
    const history = await prisma.workflowHistory.findMany({
      where: { actorId: userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        document: {
          select: { title: true, id: true }
        }
      }
    });

    return history.map(h => ({
      id: h.id,
      action: h.toStatus === 'SUBMITTED' ? 'Submitted Document' 
            : h.toStatus === 'REVIEWER_APPROVED' ? 'Approved Document'
            : h.toStatus === 'REJECTED' ? 'Rejected Document'
            : h.toStatus === 'DRAFT' ? 'Created Draft'
            : `Transitioned to ${h.toStatus}`,
      document: h.document.title,
      documentId: h.document.id,
      timestamp: h.createdAt.toISOString(),
      status: h.toStatus,
      actor: userId
    }));
  }

  async getActivityHistory(filters: ActivityFilter) {
    const {
      page = 1,
      limit = 20,
      sort = 'desc',
      action,
      documentId,
      actorId,
      dateFrom,
      dateTo
    } = filters;

    const skip = (page - 1) * limit;

    const where: Prisma.WorkflowHistoryWhereInput = {};

    if (actorId) where.actorId = actorId;
    if (documentId) where.documentId = documentId;
    if (action) where.toStatus = action as any;
    
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = new Date(dateFrom);
      if (dateTo) where.createdAt.lte = new Date(dateTo);
    }

    const [total, records] = await Promise.all([
      prisma.workflowHistory.count({ where }),
      prisma.workflowHistory.findMany({
        where,
        orderBy: { createdAt: sort },
        skip,
        take: limit,
        include: {
          document: { select: { title: true } },
          actor: { select: { firstName: true, lastName: true, email: true } }
        }
      })
    ]);

    return {
      data: records.map(r => ({
        id: r.id,
        action: `Transitioned to ${r.toStatus}`,
        document: r.document.title,
        documentId: r.documentId,
        actor: `${r.actor.firstName} ${r.actor.lastName}`,
        actorEmail: r.actor.email,
        timestamp: r.createdAt.toISOString(),
        status: r.toStatus,
        reason: r.reason
      })),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    };
  }
}

export const activityService = new ActivityService();
