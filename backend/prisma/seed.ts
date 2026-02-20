import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  // idempotent: do nothing if at least one court already exists
  const exists = await prisma.court.findFirst();
  if (exists) return;

  await prisma.court.create({
    data: {
      name: "Campo 1",
      isActive: true,
    },
  });
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
