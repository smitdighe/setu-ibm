/**
 * IBM Cloud Object Storage singleton client.
 * Used by LessonPlanAgent to store and retrieve generated lesson plan documents.
 *
 * Bucket name is read from COS_LESSON_BUCKET env var.
 * The bucket is created automatically by migrate.ts if it doesn't exist.
 */

import S3 from "ibm-cos-sdk";

if (!process.env.COS_API_KEY) throw new Error("COS_API_KEY is not set");
if (!process.env.COS_SERVICE_INSTANCE_ID) throw new Error("COS_SERVICE_INSTANCE_ID is not set");
if (!process.env.COS_ENDPOINT) throw new Error("COS_ENDPOINT is not set");

// Singleton COS client
const cos = new S3.S3({
  endpoint: process.env.COS_ENDPOINT,
  apiKeyId: process.env.COS_API_KEY,
  serviceInstanceId: process.env.COS_SERVICE_INSTANCE_ID,
  ibmAuthEndpoint: "https://iam.cloud.ibm.com/identity/token",
  signatureVersion: "iam",
});

export const LESSON_BUCKET = process.env.COS_LESSON_BUCKET ?? "setu-lesson-plans";

/**
 * Upload a UTF-8 string to COS.
 * Returns the object key on success.
 */
export async function upload(key: string, body: string, contentType = "application/json"): Promise<string> {
  await cos
    .putObject({
      Bucket: LESSON_BUCKET,
      Key: key,
      Body: Buffer.from(body, "utf-8"),
      ContentType: contentType,
    })
    .promise();
  return key;
}

/**
 * Download an object from COS.
 * Returns the UTF-8 string content, or null if the key doesn't exist.
 */
export async function download(key: string): Promise<string | null> {
  try {
    const result = await cos
      .getObject({ Bucket: LESSON_BUCKET, Key: key })
      .promise();
    return result.Body?.toString("utf-8") ?? null;
  } catch (err: unknown) {
    if ((err as { code?: string }).code === "NoSuchKey") return null;
    throw err;
  }
}

/**
 * Check if an object exists in COS without downloading the body.
 */
export async function exists(key: string): Promise<boolean> {
  try {
    await cos.headObject({ Bucket: LESSON_BUCKET, Key: key }).promise();
    return true;
  } catch {
    return false;
  }
}

/**
 * Ensure the lesson plans bucket exists. Called by migrate.ts at deploy time.
 */
export async function ensureBucket(): Promise<void> {
  try {
    await cos.headBucket({ Bucket: LESSON_BUCKET }).promise();
  } catch {
    await cos.createBucket({ Bucket: LESSON_BUCKET }).promise();
  }
}

export { cos };
