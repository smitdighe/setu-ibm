/**
 * IBM Cloudant singleton client.
 * Provides a typed getDb() helper that returns a Cloudant database handle,
 * creating the DB if it does not exist.
 *
 * All database names are defined in DB_NAMES below — import from here
 * rather than hard-coding strings in individual modules.
 */

import { CloudantV1 } from "@ibm-cloud/cloudant";
// eslint-disable-next-line @typescript-eslint/no-require-imports
import { IamAuthenticator } from "ibm-cloud-sdk-core";

if (!process.env.CLOUDANT_URL) throw new Error("CLOUDANT_URL is not set");
if (!process.env.CLOUDANT_API_KEY) throw new Error("CLOUDANT_API_KEY is not set");

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const authenticator: any = new IamAuthenticator({
  apikey: process.env.CLOUDANT_API_KEY,
});

// Singleton Cloudant client
const cloudant = CloudantV1.newInstance({
  authenticator,
  serviceUrl: process.env.CLOUDANT_URL,
});

/** Canonical database names — all modules must reference these constants */
export const DB_NAMES = {
  students: "setu_students",
  teachers: "setu_teachers",
  admins: "setu_admins",
  classes: "setu_classes",
  assessments: "setu_assessments",
  lessonPlans: "setu_lesson_plans",
  resources: "setu_resources",
  users: "setu_users",           // merged auth lookup view
} as const;

export type DbName = (typeof DB_NAMES)[keyof typeof DB_NAMES];

/** Cache of already-verified DB names to avoid redundant existence checks */
const verifiedDbs = new Set<string>();

/**
 * Returns the Cloudant client scoped to a given database.
 * Creates the database if it doesn't exist (idempotent).
 */
export async function getDb(dbName: DbName): Promise<CloudantV1> {
  if (!verifiedDbs.has(dbName)) {
    try {
      await cloudant.getDatabaseInformation({ db: dbName });
    } catch {
      // DB doesn't exist — create it
      await cloudant.putDatabase({ db: dbName });
    }
    verifiedDbs.add(dbName);
  }
  return cloudant;
}

/**
 * Low-level helper: find documents by a Cloudant selector.
 * T must match the document shape stored in Cloudant.
 */
export async function findDocs<T>(
  dbName: DbName,
  selector: CloudantV1.JsonObject,
  fields?: string[],
  limit = 100
): Promise<T[]> {
  const db = await getDb(dbName);
  const response = await db.postFind({
    db: dbName,
    selector,
    ...(fields ? { fields } : {}),
    limit,
  });
  return (response.result.docs ?? []) as T[];
}

/**
 * Low-level helper: save (create or update) a document.
 * If doc has _id + _rev it performs an update; otherwise creates.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function saveDoc(
  dbName: DbName,
  doc: Record<string, any>
): Promise<{ id: string; rev: string }> {
  const db = await getDb(dbName);
  if (doc._id) {
    const response = await db.putDocument({ db: dbName, docId: doc._id, document: doc });
    return { id: response.result.id!, rev: response.result.rev! };
  } else {
    const response = await db.postDocument({ db: dbName, document: doc });
    return { id: response.result.id!, rev: response.result.rev! };
  }
}

/**
 * Low-level helper: get a single document by _id.
 */
export async function getDoc<T>(dbName: DbName, id: string): Promise<T | null> {
  try {
    const db = await getDb(dbName);
    const response = await db.getDocument({ db: dbName, docId: id });
    return response.result as T;
  } catch {
    return null;
  }
}

export { cloudant };
