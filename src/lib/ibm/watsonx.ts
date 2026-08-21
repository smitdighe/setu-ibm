/**
 * IBM watsonx.ai singleton client.
 * Wraps @ibm-cloud/watsonx-ai and exposes a single `generateText()` helper
 * used by all Granite LLM calls throughout the platform.
 *
 * ASSUMPTION: granite-13b-instruct-v2 is the default model.
 * Swap WATSONX_MODEL_ID env var to use a different Granite variant.
 */

import { WatsonXAI as WatsonxAI } from "@ibm-cloud/watsonx-ai";
// eslint-disable-next-line @typescript-eslint/no-require-imports
import { IamAuthenticator } from "ibm-cloud-sdk-core";

if (!process.env.WATSONX_API_KEY) throw new Error("WATSONX_API_KEY is not set");
if (!process.env.WATSONX_PROJECT_ID) throw new Error("WATSONX_PROJECT_ID is not set");

// The IBM SDK typings for AuthenticatorInterface are stricter than the runtime
// object — cast through unknown to satisfy the compiler.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const authenticator: any = new IamAuthenticator({
  apikey: process.env.WATSONX_API_KEY,
});

// Singleton instance
const client = WatsonxAI.newInstance({
  version: "2024-05-31",
  serviceUrl: process.env.WATSONX_URL ?? "https://us-south.ml.cloud.ibm.com",
  authenticator,
});

const DEFAULT_MODEL = process.env.WATSONX_MODEL_ID ?? "ibm/granite-13b-instruct-v2";

export type GenerateOptions = {
  prompt: string;
  modelId?: string;
  maxNewTokens?: number;
  temperature?: number;
  stopSequences?: string[];
};

/**
 * Generate text from Granite LLM.
 * Returns the generated text string; throws on API error.
 */
export async function generateText(opts: GenerateOptions): Promise<string> {
  const response = await client.generateText({
    projectId: process.env.WATSONX_PROJECT_ID!,
    modelId: opts.modelId ?? DEFAULT_MODEL,
    input: opts.prompt,
    parameters: {
      max_new_tokens: opts.maxNewTokens ?? 1024,
      temperature: opts.temperature ?? 0.3,
      stop_sequences: opts.stopSequences,
    },
  });

  const result = response.result;
  // ASSUMPTION: taking the first generated candidate
  const text = result.results?.[0]?.generated_text ?? "";
  return text.trim();
}

/**
 * Generate and parse JSON from Granite LLM.
 * Appends a JSON instruction to the prompt and strips markdown fences.
 * Zod validation is the caller's responsibility.
 */
export async function generateJSON<T>(opts: GenerateOptions): Promise<T> {
  const jsonPrompt = `${opts.prompt}\n\nRespond with valid JSON only. Do not include any explanation or markdown code fences.`;
  const raw = await generateText({ ...opts, prompt: jsonPrompt, stopSequences: ["\n\n\n"] });

  // Strip markdown code fences if Granite still includes them
  const cleaned = raw.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "").trim();
  return JSON.parse(cleaned) as T;
}

export { client as watsonxClient };
