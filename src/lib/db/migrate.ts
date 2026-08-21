/**
 * Database migration script.
 * Run once at deploy time (or locally) to:
 *   1. Create all Cloudant databases
 *   2. Create indexes (design docs) for efficient queries
 *   3. Ensure the COS lesson plans bucket exists
 *
 * Usage: npm run migrate
 *
 * ASSUMPTION: All IBM Cloud credentials are set in environment variables
 * (see env.example). Load a .env file before running in development.
 */

// Load .env in development
import "dotenv/config";

import { cloudant, DB_NAMES } from "@/lib/ibm/cloudant";
import { ensureBucket } from "@/lib/ibm/cos";

// ─── Index definitions ────────────────────────────────────────────────────────

type IndexDef = {
  name: string;
  fields: string[];
};

const DB_INDEXES: Record<string, IndexDef[]> = {
  [DB_NAMES.students]: [
    { name: "by-school-class", fields: ["schoolId", "classId"] },
    { name: "by-school-risk", fields: ["schoolId", "riskFlag"] },
    { name: "by-email", fields: ["email", "schoolId"] },
  ],
  [DB_NAMES.teachers]: [
    { name: "by-school", fields: ["schoolId"] },
    { name: "by-email", fields: ["email", "schoolId"] },
  ],
  [DB_NAMES.admins]: [
    { name: "by-school", fields: ["schoolId"] },
    { name: "by-email", fields: ["email", "schoolId"] },
  ],
  [DB_NAMES.classes]: [
    { name: "by-school", fields: ["schoolId"] },
    { name: "by-teacher", fields: ["teacherId", "schoolId"] },
  ],
  [DB_NAMES.assessments]: [
    { name: "by-class", fields: ["classId", "schoolId"] },
    { name: "by-topic", fields: ["topicId", "classId", "schoolId"] },
    { name: "by-status", fields: ["status", "schoolId"] },
  ],
  [DB_NAMES.lessonPlans]: [
    { name: "by-class-week", fields: ["classId", "subjectId", "weekOf", "schoolId"] },
    { name: "by-class", fields: ["classId", "schoolId"] },
  ],
  [DB_NAMES.resources]: [
    { name: "by-topic-difficulty", fields: ["subjectId", "topicId", "difficulty", "schoolId"] },
  ],
};

// ─── Migration runner ─────────────────────────────────────────────────────────

async function createDbIfNotExists(dbName: string): Promise<void> {
  try {
    await cloudant.getDatabaseInformation({ db: dbName });
    console.log(`  ✓ DB exists: ${dbName}`);
  } catch {
    await cloudant.putDatabase({ db: dbName });
    console.log(`  ✓ DB created: ${dbName}`);
  }
}

async function createIndex(dbName: string, index: IndexDef): Promise<void> {
  try {
    await cloudant.postIndex({
      db: dbName,
      index: { fields: index.fields.map((f) => ({ [f]: "asc" })) },
      name: index.name,
      type: "json",
    });
    console.log(`    ✓ Index: ${index.name}`);
  } catch (err) {
    // Ignore "already exists" errors
    const errMsg = (err as Error).message ?? "";
    if (!errMsg.includes("exists")) throw err;
    console.log(`    ✓ Index exists: ${index.name}`);
  }
}

async function main(): Promise<void> {
  console.log("\n=== Setu — Database Migration ===\n");

  // 1. Create all databases
  console.log("Creating databases...");
  for (const dbName of Object.values(DB_NAMES)) {
    await createDbIfNotExists(dbName);
  }

  // 2. Create indexes
  console.log("\nCreating indexes...");
  for (const [dbName, indexes] of Object.entries(DB_INDEXES)) {
    console.log(`  ${dbName}`);
    for (const idx of indexes) {
      await createIndex(dbName, idx);
    }
  }

  // 3. Ensure COS bucket
  console.log("\nEnsuring COS bucket...");
  await ensureBucket();
  console.log("  ✓ COS bucket ready");

  console.log("\n✅ Migration complete.\n");
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
