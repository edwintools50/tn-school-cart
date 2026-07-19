import "dotenv/config";
import { PrismaClient } from "../../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set.");
}

const adapter = new PrismaPg(process.env.DATABASE_URL);
const db = new PrismaClient({ adapter });

// Matches every account created by prisma/seed.ts — all seeded accounts use this email domain.
const DEMO_EMAIL_DOMAIN = "@tnschoolcart.in";

async function main() {
  const demoUsers = await db.user.findMany({
    // Never touch ADMIN accounts, even ones using the demo email domain —
    // deleting the only admin would lock you out with no way back in.
    where: { email: { endsWith: DEMO_EMAIL_DOMAIN }, role: { not: "ADMIN" } },
    select: { id: true, email: true, role: true },
  });

  if (demoUsers.length === 0) {
    console.log("No demo accounts found — nothing to do.");
    return;
  }

  const demoUserIds = demoUsers.map((u) => u.id);

  console.log(`Found ${demoUsers.length} demo accounts:`);
  for (const u of demoUsers) console.log(`  - [${u.role}] ${u.email}`);

  if (!process.argv.includes("--confirm")) {
    console.log("\nDry run only. Re-run with --confirm to actually delete this data.");
    return;
  }

  console.log("\nDeleting in dependency-safe order...");

  // Gig side: offers -> requests (offers cascade from requests, but principals'
  // requests and workers' offers can be on different demo users, so clear both).
  const gigOfferCount = await db.gigOffer.deleteMany({
    where: { workerId: { in: demoUserIds } },
  });
  const gigRequestCount = await db.gigRequest.deleteMany({
    where: { principalId: { in: demoUserIds } },
  });

  // Order side: delete OrderItems explicitly before Products/suppliers, since
  // OrderItem.productId/supplierId have no cascade (would otherwise block
  // deleting a demo product or supplier that still has order history).
  const orderItemCount = await db.orderItem.deleteMany({
    where: {
      OR: [{ supplierId: { in: demoUserIds } }, { order: { buyerId: { in: demoUserIds } } }],
    },
  });
  const orderCount = await db.order.deleteMany({
    where: { buyerId: { in: demoUserIds } },
  });

  const cartItemCount = await db.cartItem.deleteMany({
    where: { buyerId: { in: demoUserIds } },
  });
  const gigServiceCount = await db.gigService.deleteMany({
    where: { workerId: { in: demoUserIds } },
  });
  const productCount = await db.product.deleteMany({
    where: { supplierId: { in: demoUserIds } },
  });

  const userCount = await db.user.deleteMany({
    where: { id: { in: demoUserIds } },
  });

  console.log("Done:");
  console.log(`  GigOffer: ${gigOfferCount.count}`);
  console.log(`  GigRequest: ${gigRequestCount.count}`);
  console.log(`  OrderItem: ${orderItemCount.count}`);
  console.log(`  Order: ${orderCount.count}`);
  console.log(`  CartItem: ${cartItemCount.count}`);
  console.log(`  GigService: ${gigServiceCount.count}`);
  console.log(`  Product: ${productCount.count}`);
  console.log(`  User: ${userCount.count}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
