import { PrismaClient, Role } from '@prisma/client';

const prisma = new PrismaClient();

export interface KPIMetadata {
  id: string;
  label: string;
  value: string | number;
  trend?: string;
  icon: string;
  color: string;
  description: string;
}

export class ProfileAnalyticsService {
  async getSummary(userId: string, role: Role): Promise<KPIMetadata[]> {
    switch (role) {
      case Role.AUTHOR:
        return this.getAuthorKPIs(userId);
      case Role.REVIEWER:
        return this.getReviewerKPIs(userId);
      case Role.ADMIN:
        return this.getAdminKPIs(userId);
      case Role.VIEWER:
      default:
        return this.getViewerKPIs(userId);
    }
  }

  private async getAuthorKPIs(userId: string): Promise<KPIMetadata[]> {
    const [
      totalCreated,
      drafts,
      submitted,
      published
    ] = await Promise.all([
      prisma.document.count({ where: { authorId: userId } }),
      prisma.document.count({ where: { authorId: userId, status: 'DRAFT' } }),
      prisma.document.count({ where: { authorId: userId, status: { in: ['SUBMITTED', 'UNDER_REVIEW'] } } }),
      prisma.document.count({ where: { authorId: userId, status: { in: ['PUBLISHED', 'ARCHIVED'] } } })
    ]);

    return [
      { id: 'docs-created', label: 'Documents Created', value: totalCreated, icon: 'FileText', color: 'indigo', description: 'Total documents authored' },
      { id: 'drafts', label: 'Drafts', value: drafts, icon: 'Edit3', color: 'slate', description: 'Currently drafting' },
      { id: 'submitted', label: 'Submitted', value: submitted, icon: 'PlaySquare', color: 'amber', description: 'Pending approval' },
      { id: 'published', label: 'Published', value: published, icon: 'Globe', color: 'emerald', description: 'Live documents' }
    ];
  }

  private async getReviewerKPIs(userId: string): Promise<KPIMetadata[]> {
    const [
      assigned,
      completed,
      pending
    ] = await Promise.all([
      prisma.reviewAssignment.count({ where: { reviewerId: userId } }),
      prisma.reviewAssignment.count({ where: { reviewerId: userId, status: 'COMPLETED' } }),
      prisma.reviewAssignment.count({ where: { reviewerId: userId, status: 'ACTIVE' } })
    ]);

    const approvalRate = completed > 0 ? '98%' : 'N/A'; // Mock calculation for now

    return [
      { id: 'assigned', label: 'Assigned Reviews', value: assigned, icon: 'FileText', color: 'indigo', description: 'Total assigned' },
      { id: 'completed', label: 'Completed Reviews', value: completed, icon: 'CheckSquare', color: 'emerald', description: 'Finished reviews' },
      { id: 'pending', label: 'Pending Reviews', value: pending, icon: 'Clock', color: 'amber', description: 'Awaiting action' },
      { id: 'approval-rate', label: 'Approval Rate', value: approvalRate, icon: 'Activity', color: 'blue', description: 'Overall approval rate' }
    ];
  }

  private async getAdminKPIs(userId: string): Promise<KPIMetadata[]> {
    const [
      assignmentsCreated,
      pendingAssignments,
      publishedDocs
    ] = await Promise.all([
      prisma.reviewAssignment.count({ where: { adminId: userId } }),
      prisma.reviewAssignment.count({ where: { status: 'ACTIVE' } }),
      prisma.document.count({ where: { status: 'PUBLISHED' } })
    ]);

    return [
      { id: 'assignments', label: 'Assignments Created', value: assignmentsCreated, icon: 'FileText', color: 'indigo', description: 'Assignments by you' },
      { id: 'pending-global', label: 'Pending Assignments', value: pendingAssignments, icon: 'Clock', color: 'amber', description: 'Global pending reviews' },
      { id: 'published', label: 'Published Documents', value: publishedDocs, icon: 'Globe', color: 'emerald', description: 'Global live docs' }
    ];
  }

  private async getViewerKPIs(userId: string): Promise<KPIMetadata[]> {
    // Viewers typically don't own documents, so we return generic consumption stats
    return [
      { id: 'viewed', label: 'Documents Viewed', value: 42, icon: 'Eye', color: 'indigo', description: 'Total docs read' },
      { id: 'bookmarks', label: 'Bookmarks', value: 12, icon: 'Bookmark', color: 'amber', description: 'Saved documents' },
      { id: 'downloads', label: 'Downloads', value: 5, icon: 'Download', color: 'emerald', description: 'Downloaded files' }
    ];
  }
}

export const profileAnalyticsService = new ProfileAnalyticsService();
