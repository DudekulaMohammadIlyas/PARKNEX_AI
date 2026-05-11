const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Starting seed...');

  // 1. Clear existing data
  await prisma.event.deleteMany();
  await prisma.zone.deleteMany();
  // await prisma.user.deleteMany(); // Keeping users to avoid logging everyone out

  // 2. Create Default Zones
  const zones = [
    { name: 'North Block', total: 200, occupied: 80 },
    { name: 'South Block', total: 150, occupied: 50 },
    { name: 'Visitor Parking', total: 50, occupied: 10 },
    { name: 'Faculty Parking', total: 100, occupied: 10 },
  ];

  for (const zone of zones) {
    await prisma.zone.create({
      data: zone,
    });
  }

  console.log('Seeding complete! 4 Zones created.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
