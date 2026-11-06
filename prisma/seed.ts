import { PrismaClient } from "@prisma/client";
import { INDUSTRIES } from "../src/lib/industries";

const prisma = new PrismaClient();

async function main() {
  for (const [i, ind] of INDUSTRIES.entries()) {
    await prisma.industry.upsert({
      where: { id: ind.id },
      update: {
        nameTranslations: ind.names,
        typicalProducts: ind.typicalProducts,
        sortOrder: i + 1,
      },
      create: {
        id: ind.id,
        nameTranslations: ind.names,
        typicalProducts: ind.typicalProducts,
        sortOrder: i + 1,
      },
    });
  }
  console.log(`Seeded ${INDUSTRIES.length} industries`);
}

main().finally(() => prisma.$disconnect());
