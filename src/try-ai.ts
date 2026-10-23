import "dotenv/config";
import { reviewProject } from "./ai/gemini";

// npm run try-ai. One real request to Gemini from your terminal --
// the same function POST /api/ai calls, with no Express, no token
// and no database.
async function tryAi() {
  const review = await reviewProject(
    "A campus library book reservation system in React and TypeScript. Students " +
      "log in, browse the book catalog, and reserve titles before pickup deadlines. " +
      "The backend is Express and MongoDB with JWT authentication, deployed on Vercel.",
  );
  console.log(JSON.stringify(review, null, 2));
}

tryAi().catch((err: unknown) => {
  console.error("Gemini call failed:", err);
  process.exit(1);
});
