/**
 * Admin CRUD helpers.
 */

import { findDocs, saveDoc, getDoc, DB_NAMES } from "@/lib/ibm/cloudant";
import type { Admin } from "@/types/entities";

const DB = DB_NAMES.admins;

export async function createAdmin(admin: Omit<Admin, "_id" | "_rev">): Promise<Admin> {
  const result = await saveDoc(DB, admin);
  return { ...admin, _id: result.id, _rev: result.rev };
}

export async function getAdminById(id: string): Promise<Admin | null> {
  return getDoc<Admin>(DB, id);
}

export async function getAdminByEmail(email: string, schoolId: string): Promise<Admin | null> {
  const docs = await findDocs<Admin>(DB, { type: "admin", email, schoolId });
  return docs[0] ?? null;
}
