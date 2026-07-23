import { PrismaClient, DocumentStatus, DocumentPriority, Role } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting seed...');
  const passwordHash = await bcrypt.hash('password123', 10);

  const baseUsers = [
    { email: 'admin@test.com', firstName: 'Admin', lastName: 'User', role: Role.ADMIN },
    { email: 'reviewer@test.com', firstName: 'Reviewer', lastName: 'User', role: Role.REVIEWER },
    { email: 'author@test.com', firstName: 'Author', lastName: 'User', role: Role.AUTHOR },
    { email: 'viewer@test.com', firstName: 'Viewer', lastName: 'User', role: Role.VIEWER },
  ];

  const createdUsers: Record<string, any> = {};
  const allUsers = [];

  // Create Users
  for (const u of baseUsers) {
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: { ...u, passwordHash },
    });
    createdUsers[u.role] = user;
    allUsers.push(user);
    console.log(`Created user: ${user.email} (${user.role})`);
  }

  // Clean existing data for clean seed
  await prisma.auditLog.deleteMany();
  await prisma.workflowHistory.deleteMany();
  await prisma.reviewAssignment.deleteMany();
  await prisma.document.deleteMany();

  console.log('Creating 10 documents per role...');
  const statuses = [
    DocumentStatus.DRAFT,
    DocumentStatus.SUBMITTED,
    DocumentStatus.UNDER_REVIEW,
    DocumentStatus.REVIEWER_APPROVED,
    DocumentStatus.PUBLISHED,
  ];

  const priorities = [
    DocumentPriority.LOW,
    DocumentPriority.MEDIUM,
    DocumentPriority.HIGH,
    DocumentPriority.CRITICAL,
  ];

  for (const user of allUsers) {
    for (let i = 1; i <= 10; i++) {
      const status = statuses[i % statuses.length];
      const priority = priorities[i % priorities.length];
      
      const doc = await prisma.document.create({
        data: {
          title: `${user.role} Document ${i}`,
          body: `This is the body content for document ${i} created by ${user.role}.`,
          status,
          authorId: user.id,
          reviewerId: createdUsers[Role.REVIEWER].id,
          wordCount: 100 * i,
          readingTime: i * 2,
          priority,
          createdAt: new Date(Date.now() - (15 - i) * 24 * 60 * 60 * 1000),
          submittedAt: status !== DocumentStatus.DRAFT ? new Date(Date.now() - 10 * 24 * 60 * 60 * 1000) : null,
          approvedAt: (status === DocumentStatus.REVIEWER_APPROVED || status === DocumentStatus.PUBLISHED) ? new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) : null,
          publishedAt: status === DocumentStatus.PUBLISHED ? new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) : null,
        }
      });

      // Create workflow history
      if (status !== DocumentStatus.DRAFT) {
        await prisma.workflowHistory.create({
          data: {
            documentId: doc.id,
            actorId: user.id,
            fromStatus: DocumentStatus.DRAFT,
            toStatus: DocumentStatus.SUBMITTED,
            createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000)
          }
        });
      }

      if (status === DocumentStatus.REVIEWER_APPROVED || status === DocumentStatus.PUBLISHED) {
        await prisma.workflowHistory.create({
          data: {
            documentId: doc.id,
            actorId: createdUsers[Role.REVIEWER].id,
            fromStatus: DocumentStatus.SUBMITTED,
            toStatus: DocumentStatus.REVIEWER_APPROVED,
            createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
          }
        });
      }

      if (status === DocumentStatus.PUBLISHED) {
        await prisma.workflowHistory.create({
          data: {
            documentId: doc.id,
            actorId: createdUsers[Role.ADMIN].id,
            fromStatus: DocumentStatus.REVIEWER_APPROVED,
            toStatus: DocumentStatus.PUBLISHED,
            createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
          }
        });
      }

      // Create some review assignments if under review
      if (status === DocumentStatus.UNDER_REVIEW) {
        await prisma.reviewAssignment.create({
          data: {
            documentId: doc.id,
            reviewerId: createdUsers[Role.REVIEWER].id,
            adminId: createdUsers[Role.ADMIN].id,
            deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
            status: 'ACTIVE'
          }
        });
      }

      // Create some audit logs
      await prisma.auditLog.create({
        data: {
          actorId: user.id,
          action: 'CREATE_DOCUMENT',
          entityType: 'Document',
          entityId: doc.id,
          createdAt: new Date(Date.now() - (15 - i) * 24 * 60 * 60 * 1000)
        }
      });
      
      // Random read by viewer
      if (i % 2 === 0) {
        await prisma.auditLog.create({
          data: {
            actorId: createdUsers[Role.VIEWER].id,
            action: 'VIEW_DOCUMENT',
            entityType: 'Document',
            entityId: doc.id,
            createdAt: new Date()
          }
        });
      }
    }
  }

  console.log('Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
