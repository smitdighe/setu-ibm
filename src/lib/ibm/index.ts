/**
 * Barrel export for all IBM Cloud client singletons.
 * Import from here rather than individual files.
 *
 *   import { generateText, generateJSON } from "@/lib/ibm";
 *   import { getDb, findDocs, saveDoc, getDoc, DB_NAMES } from "@/lib/ibm";
 *   import { upload, download, exists, ensureBucket } from "@/lib/ibm";
 */
export * from "./watsonx";
export * from "./cloudant";
export * from "./cos";
