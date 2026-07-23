import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface Milestone {
  id: string;
  title: string;
  date: string;
  desc: string;
}

export class TimelineService {
  async getMilestones(userId: string): Promise<Milestone[]> {
    const milestones: Milestone[] = [];
    let idCounter = 1;

    // 1. Account Created
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { createdAt: true }
    });
    if (user) {
      milestones.push({
        id: `ms-${idCounter++}`,
        title: 'Account Created',
        date: user.createdAt.toISOString(),
        desc: 'Welcome to DocFlow Pro!'
      });
    }

    // 2. First Document
    const firstDoc = await prisma.document.findFirst({
      where: { authorId: userId },
      orderBy: { createdAt: 'asc' },
      select: { createdAt: true, title: true }
    });
    if (firstDoc) {
      milestones.push({
        id: `ms-${idCounter++}`,
        title: 'First Document Created',
        date: firstDoc.createdAt.toISOString(),
        desc: `"${firstDoc.title}"`
      });
    }

    // 3. First Submission
    const firstSubmission = await prisma.workflowHistory.findFirst({
      where: { actorId: userId, toStatus: 'SUBMITTED' },
      orderBy: { createdAt: 'asc' },
      select: { createdAt: true }
    });
    if (firstSubmission) {
      milestones.push({
        id: `ms-${idCounter++}`,
        title: 'First Submission',
        date: firstSubmission.createdAt.toISOString(),
        desc: 'Submitted for review.'
      });
    }

    // Sort chronologically
    return milestones.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }
}

export const timelineService = new TimelineService();
