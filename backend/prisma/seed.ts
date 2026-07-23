import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const users = [
    { email: 'alice@example.com', firstName: 'Alice', lastName: 'Author', role: Role.AUTHOR },
    { email: 'bob@example.com', firstName: 'Bob', lastName: 'Reviewer', role: Role.REVIEWER },
    { email: 'viewer@example.com', firstName: 'Victor', lastName: 'Viewer', role: Role.VIEWER },
    { email: 'admin@example.com', firstName: 'Adam', lastName: 'Admin', role: Role.ADMIN },
  ];

  const defaultPassword = 'Password123!';
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(defaultPassword, salt);

  for (const u of users) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: {
        role: u.role,
        passwordHash,
      },
      create: {
        email: u.email,
        firstName: u.firstName,
        lastName: u.lastName,
        role: u.role,
        passwordHash,
      },
    });
  }

  console.log('Database seeded successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
