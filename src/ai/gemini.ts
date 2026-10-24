import { ApiError, GoogleGenAI, type Content } from "@google/genai";
import { MODEL, SYSTEM_PROMPT, EXAMPLES, wrap } from "./prompt";
import {
  reviewSchema,
  reviewJsonSchema,
  type Review,
} from "../schemas/review";

// Keep a stable Flash model ready for temporary capacity issues on the
// latest alias. Google recommends switching models when a model returns 503.
const FALLBACK_MODEL = "gemini-3.6-flash";

// The same shape as connectDB: nothing happens when this file is imported.
// The client is made on the first call, so a missing key is an explicit error
// on the first AI request rather than a crash during startup.
let client: GoogleGenAI | null = null;

function getClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "GEMINI_API_KEY is missing. Add it to .env, and to Vercel.",
    );
  }
  if (client === null) {
    client = new GoogleGenAI({ apiKey });
  }
  return client;
}

// The two examples become two finished exchanges -- a user turn, then
// the model's reply -- and the real description is the last turn.
function buildContents(description: string): Content[] {
  const shots: Content[] = EXAMPLES.flatMap((example) => [
    { role: "user", parts: [{ text: wrap(example.description) }] },
    {
      role: "model",
      parts: [{ text: JSON.stringify(example.review) }],
    },
  ]);
  return [
    ...shots,
    { role: "user", parts: [{ text: wrap(description) }] },
  ];
}

// Thrown when Gemini answered but the answer is unusable. The route
// turns it into a 502; anything else stays a 500.
export class AiReplyError extends Error {}

export async function reviewProject(
  description: string,
): Promise<Review> {
  const generate = (model: string) =>
    getClient().models.generateContent({
      model,
      contents: buildContents(description),
      config: {
        systemInstruction: SYSTEM_PROMPT,
        // JSON, in exactly this shape.
        responseMimeType: "application/json",
        responseJsonSchema: reviewJsonSchema,
      },
    });

  let response;
  try {
    response = await generate(MODEL);
  } catch (err) {
    if (!(err instanceof ApiError) || err.status !== 503) {
      throw err;
    }

    console.warn(
      `Gemini model ${MODEL} is unavailable; trying fallback ${FALLBACK_MODEL}.`,
    );
    response = await generate(FALLBACK_MODEL);
  }

  // undefined when there is no text at all (e.g. blocked by safety filters)
  const text = response.text;
  if (!text) {
    throw new AiReplyError("Gemini sent back no text");
  }

  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    throw new AiReplyError("Gemini's reply was not JSON");
  }

  // Check against our Zod schema
  const result = reviewSchema.safeParse(data);
  if (!result.success) {
    throw new AiReplyError("Gemini's reply did not match the schema");
  }
  return result.data;
}
