import { PrismaClient } from "@prisma/client";
import argon2 from "argon2";
import { randomUUID } from "crypto";

const prisma = new PrismaClient();

/**
 * Seed the database with:
 * - 2 user accounts (owner + partner)
 * - 1 sample album with permission granted to partner
 *
 * Default credentials (CHANGE THESE after first login):
 *   Owner:   username=marc     password=changeme123
 *   Partner: username=micaela  password=changeme456
 */
async function main() {
  console.log("🌱 Seeding database...\n");

  // =========================================================================
  // Hash passwords with Argon2id
  // =========================================================================
  const ownerPasswordHash = await argon2.hash("changeme123", {
    type: argon2.argon2id,
    memoryCost: 65536, // 64 MB
    timeCost: 3,
    parallelism: 4,
  });

  const partnerPasswordHash = await argon2.hash("changeme456", {
    type: argon2.argon2id,
    memoryCost: 65536,
    timeCost: 3,
    parallelism: 4,
  });

  // =========================================================================
  // Create users
  // =========================================================================
  const owner = await prisma.user.upsert({
    where: { username: "marc" },
    update: {},
    create: {
      id: randomUUID(),
      username: "marc",
      displayName: "Marc",
      passwordHash: ownerPasswordHash,
      role: "owner",
    },
  });

  console.log(`   ✅ Owner account created:   ${owner.username} (${owner.role})`);

  const partner = await prisma.user.upsert({
    where: { username: "micaela" },
    update: {},
    create: {
      id: randomUUID(),
      username: "micaela",
      displayName: "Micaela",
      passwordHash: partnerPasswordHash,
      role: "partner",
    },
  });

  console.log(`   ✅ Partner account created: ${partner.username} (${partner.role})`);

  // =========================================================================
  // Create a welcome album
  // =========================================================================
  const welcomeAlbum = await prisma.album.upsert({
    where: { id: "welcome-album" },
    update: {},
    create: {
      id: "welcome-album",
      title: "Our Memories Together",
      description:
        "A special place to keep our most precious moments. Upload your favorite photos here! 💖",
      createdBy: owner.id,
    },
  });

  console.log(`   ✅ Welcome album created:  "${welcomeAlbum.title}"`);

  // =========================================================================
  // Grant partner view+edit access to the welcome album
  // =========================================================================
  await prisma.albumPermission.upsert({
    where: {
      albumId_userId: {
        albumId: welcomeAlbum.id,
        userId: partner.id,
      },
    },
    update: {},
    create: {
      id: randomUUID(),
      albumId: welcomeAlbum.id,
      userId: partner.id,
      permission: "edit",
    },
  });

  console.log(
    `   ✅ Permission granted:    ${partner.displayName} → "${welcomeAlbum.title}" (edit)`
  );

  // =========================================================================
  // Summary
  // =========================================================================
  console.log("\n🌹 Database seeded successfully!\n");
  console.log("   Default credentials (change after first login):");
  console.log("   ┌──────────┬───────────┬───────────────┐");
  console.log("   │ Role     │ Username  │ Password      │");
  console.log("   ├──────────┼───────────┼───────────────┤");
  console.log("   │ Owner    │ marc      │ changeme123   │");
  console.log("   │ Partner  │ micaela   │ changeme456   │");
  console.log("   └──────────┴───────────┴───────────────┘\n");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

