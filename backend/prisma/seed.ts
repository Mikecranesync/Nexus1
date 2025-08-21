import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Create default organization
  const defaultOrg = await prisma.organization.upsert({
    where: { id: 'default-org' },
    update: {},
    create: {
      id: 'default-org',
      name: 'Default Organization',
      description: 'Default organization for testing',
      email: 'admin@example.com',
      timezone: 'UTC'
    },
  });

  console.log('Created default organization:', defaultOrg);

  // Create default user
  const defaultUser = await prisma.user.upsert({
    where: { id: 'default-user' },
    update: {},
    create: {
      id: 'default-user',
      email: 'user@example.com',
      name: 'Default User',
      role: 'ADMIN',
      organizationId: 'default-org'
    },
  });

  console.log('Created default user:', defaultUser);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });