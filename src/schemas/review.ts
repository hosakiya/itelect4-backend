import { z } from "zod";

// What a client is allowed to send to POST /api/ai. Checked before
// anything is sent to Gemini, because every request that reaches
// Gemini is counted against your free quota -- a request that was
// never going to work should cost nothing.
export const aiRequestSchema = z.object({
  prompt: z
    .string()
    .trim()
    .min(20, "Describe your project or reading inquiry in at least 20 characters.")
    .max(2000, "Keep your inquiry under 2000 characters."),
});

// What Gemini has to send BACK. This one schema is used three ways:
//   1. z.infer below turns it into the Review type for TypeScript.
//   2. z.toJSONSchema at the bottom turns it into the JSON Schema
//      that is sent to Gemini with every request.
//   3. reviewSchema.safeParse in src/ai/gemini.ts checks the reply.
export const reviewSchema = z.object({
  summary: z
    .string()
    .describe("One concise sentence restating what the student is researching or requesting from the campus library."),
  recommendations: z
    .array(z.string())
    .min(1)
    .max(3)
    .describe("One to three recommended books, authors, or catalog subjects for this inquiry."),
  guidance: z
    .array(z.string())
    .min(1)
    .max(3)
    .describe("One to three actionable tips or reservation steps to take before borrowing or submitting."),
  readiness: z
    .enum(["ready", "almost", "not-yet"])
    .describe("How clear, well-scoped, and ready the student's book request or study plan is."),
});

export type Review = z.infer<typeof reviewSchema>;

// Computed once, when this file is first imported -- not per request.
// Gemini accepts a subset of JSON Schema for structured output and does
// not support the document-level `$schema` declaration emitted by Zod.
export const reviewJsonSchema = z.toJSONSchema(reviewSchema);
delete reviewJsonSchema.$schema;
