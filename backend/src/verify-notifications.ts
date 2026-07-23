import { globalEventBus } from './events/event.bus';
import { registerConsumers } from './events/consumers';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verify() {
  console.log('Registering consumers...');
  registerConsumers();

  const author = await prisma.user.findFirst({ where: { role: 'AUTHOR' } });
  const reviewer = await prisma.user.findFirst({ where: { role: 'REVIEWER' } });
  const doc = await prisma.document.findFirst({ where: { authorId: author?.id } });

  if (!author || !reviewer || !doc) {
    console.error('Missing seed data. Please run seed script first.');
    process.exit(1);
  }

  console.log('Publishing DocumentApproved event...');
  await globalEventBus.publish({
    eventName: 'DocumentApproved',
    payload: { id: doc.id, authorId: author.id, reviewerId: reviewer.id },
    timestamp: new Date().toISOString()
  });

  console.log('Publishing DocumentRejected event...');
  await globalEventBus.publish({
    eventName: 'DocumentRejected',
    payload: { id: doc.id, authorId: author.id, reviewerId: reviewer.id, comment: 'Needs rewrite' },
    timestamp: new Date().toISOString()
  });

  // Small delay to allow async consumers to complete
  await new Promise(resolve => setTimeout(resolve, 500));

  console.log('Querying Notification table for author...', author.email);
  const notifications = await prisma.notification.findMany({
    where: { userId: author.id },
    orderBy: { createdAt: 'desc' },
    take: 5
  });

  console.log('Found Notifications:', notifications.length);
  notifications.forEach(n => {
    console.log(`- [${n.type}] ${n.title}: ${n.message}`);
  });

  if (notifications.length >= 2) {
    console.log('✅ Event bus and Notification table successfully verified!');
  } else {
    console.error('❌ Failed to verify notifications.');
  }
}

verify().catch(console.error).finally(() => prisma.$disconnect());
