import "dotenv/config";
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { eq } from "drizzle-orm";
import { bookingRequests, customerUsers, offices } from "@shared/schema";
import { db, pool } from "../server/db";
import { storage } from "../server/storage";

async function main() {
  const sourceSlug = process.argv[2]?.trim();
  if (!sourceSlug) {
    throw new Error(
      "Usage: npx tsx script/migrate-mobile-office.ts <incorrect-office-slug> [canonical-office-id]",
    );
  }

  const source = await storage.getOfficeBySlug(sourceSlug);
  if (!source) throw new Error(`Office "${sourceSlug}" was not found.`);

  const targetOfficeId =
    process.argv[3]?.trim() || process.env.XGOO_CANONICAL_OFFICE_ID?.trim();
  const [explicitTarget] = targetOfficeId
    ? await db.select().from(offices).where(eq(offices.id, targetOfficeId)).limit(1)
    : [];
  const target = explicitTarget || (await storage.getDefaultBookingOffice());
  if (!target) throw new Error("No Staff Portal office was found.");
  if (target.id === source.id) {
    throw new Error("Source already matches the Staff Portal office.");
  }

  const result = await db.transaction(async (tx) => {
    const movedBookings = await tx
      .update(bookingRequests)
      .set({ officeId: target.id, branchId: null, source: "mobile_android" })
      .where(eq(bookingRequests.officeId, source.id))
      .returning({ id: bookingRequests.id });

    const movedCustomers = await tx
      .update(customerUsers)
      .set({ officeId: target.id, updatedAt: new Date() })
      .where(eq(customerUsers.officeId, source.id))
      .returning({ id: customerUsers.id });

    return {
      bookings: movedBookings.length,
      customers: movedCustomers.length,
    };
  });

  const targetSlug = target.publicSlug;
  if (!targetSlug) throw new Error("The Staff Portal office has no public slug.");

  const mobileEnvPath = resolve(process.cwd(), "mobile", ".env.local");
  const mobileEnv = await readFile(mobileEnvPath, "utf8");
  const nextMobileEnv = /^EXPO_PUBLIC_OFFICE_SLUG=.*$/m.test(mobileEnv)
    ? mobileEnv.replace(
        /^EXPO_PUBLIC_OFFICE_SLUG=.*$/m,
        `EXPO_PUBLIC_OFFICE_SLUG=${targetSlug}`,
      )
    : `${mobileEnv.trimEnd()}\nEXPO_PUBLIC_OFFICE_SLUG=${targetSlug}\n`;
  await writeFile(mobileEnvPath, nextMobileEnv);

  const easPath = resolve(process.cwd(), "mobile", "eas.json");
  const easConfig = JSON.parse(await readFile(easPath, "utf8")) as {
    build?: Record<string, { env?: Record<string, string> }>;
  };
  for (const profile of ["development", "preview"]) {
    const buildProfile = easConfig.build?.[profile];
    if (buildProfile?.env) {
      buildProfile.env.EXPO_PUBLIC_OFFICE_SLUG = targetSlug;
    }
  }
  await writeFile(easPath, `${JSON.stringify(easConfig, null, 2)}\n`);

  console.log(
    JSON.stringify(
      {
        source: { id: source.id, slug: source.publicSlug },
        target: { id: target.id, slug: targetSlug },
        moved: result,
        mobileConfigurationUpdated: true,
      },
      null,
      2,
    ),
  );
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });

