import { PrismaClient } from "@prisma/client";

/**
 * Seed Default PrepSectors
 *
 * This script creates the default prep sectors (Kitchen, Bar) for a tenant.
 * Run with: npx tsx prisma/seed-prep-sectors.ts <tenantId>
 *
 * Example:
 *   npx tsx prisma/seed-prep-sectors.ts clxxxxxxxxxxxxxxxxxxxxxx
 */

const prisma = new PrismaClient();

// Default prep sectors to seed
const DEFAULT_PREP_SECTORS = [
  {
    name: "Kitchen",
    code: "KITCHEN",
  },
  {
    name: "Bar",
    code: "BAR",
  },
] as const;

async function seedPrepSectors(tenantId: string) {
  console.log(`Seeding prep sectors for tenant: ${tenantId}`);

  // Verify tenant exists
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
  });

  if (!tenant) {
    console.error(`Error: Tenant with ID "${tenantId}" not found`);
    process.exit(1);
  }

  console.log(`Found tenant: ${tenant.name} (${tenant.slug})`);

  // Create prep sectors
  const results = await Promise.allSettled(
    DEFAULT_PREP_SECTORS.map(async (sector) => {
      const existing = await prisma.prepSector.findUnique({
        where: {
          tenantId_code: {
            tenantId,
            code: sector.code,
          },
        },
      });

      if (existing) {
        console.log(`  - ${sector.name} (${sector.code}): Already exists, skipping`);
        return existing;
      }

      const created = await prisma.prepSector.create({
        data: {
          tenantId,
          name: sector.name,
          code: sector.code,
        },
      });

      console.log(`  - ${sector.name} (${sector.code}): Created (${created.id})`);
      return created;
    })
  );

  const succeeded = results.filter((r) => r.status === "fulfilled").length;
  const failed = results.filter((r) => r.status === "rejected").length;

  console.log(`\nSeeding complete: ${succeeded} succeeded, ${failed} failed`);

  if (failed > 0) {
    results.forEach((r, i) => {
      if (r.status === "rejected") {
        console.error(`  Failed to create ${DEFAULT_PREP_SECTORS[i].name}:`, r.reason);
      }
    });
    process.exit(1);
  }
}

async function main() {
  const tenantId = process.argv[2];

  if (!tenantId) {
    console.error("Usage: npx tsx prisma/seed-prep-sectors.ts <tenantId>");
    console.error("\nTo find your tenant ID, you can:");
    console.error("  1. Check your database directly");
    console.error("  2. Look in the session after logging in");
    process.exit(1);
  }

  await seedPrepSectors(tenantId);
}

main()
  .catch((error) => {
    console.error("Unexpected error:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
