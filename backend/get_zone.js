const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const zone = await prisma.zone.findFirst();
  if (zone) {
    console.log(zone.id);
  } else {
    console.log("No zones found");
  }
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
