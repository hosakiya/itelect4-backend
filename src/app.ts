import express, {
  type Request,
  type Response,
  type NextFunction,
} from "express";
import cors from "cors";
import mongoose from "mongoose";
import { connectDatabase } from "./config/database";
import { authRouter } from "./routes/auth";
import { courseRouter } from "./routes/courses";
import { bookRouter } from "./routes/books";
import { reservationRouter } from "./routes/reservations";
import { aiRouter } from "./routes/ai";

export const app = express();

const ALLOWED_ORIGINS = (process.env.CORS_ORIGIN ?? "")
  .split(",")
  .map((origin) => origin.trim())
  .filter((origin) => origin !== "");

app.use(
  cors({
    origin: (origin, callback) => {
      if (
        !origin ||
        ALLOWED_ORIGINS.length === 0 ||
        ALLOWED_ORIGINS.includes(origin) ||
        origin.endsWith('.vercel.app') ||
        origin.includes('localhost')
      ) {
        return callback(null, true);
      }
      return callback(null, true);
    },
    credentials: true,
  })
);

app.use(express.json());

// Database connection middleware for serverless/local environments.
// AI reviews only use Gemini, so keep them available even if MongoDB is
// temporarily unreachable (or is not configured in a local environment).
app.use(async (req: Request, _res: Response, next: NextFunction) => {
  if (req.path === "/api/ai" || req.path.startsWith("/api/ai/")) {
    next();
    return;
  }

  await connectDatabase();
  next();
});

app.get("/", (_req: Request, res: Response) => {
  res.send("Mikaela's Backend is running");
});

app.get("/api/health", (_req: Request, res: Response) => {
  res.json({ ok: true, db: mongoose.connection.readyState === 1 });
});

app.use("/api/auth", authRouter);
app.use("/api/courses", courseRouter);
app.use("/api/books", bookRouter);
app.use("/api/reservations", reservationRouter);
app.use("/api/ai", aiRouter);

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    message: `No route for ${req.method} ${req.originalUrl}`,
  });
});

// Error handler
app.use(
  (err: Error, _req: Request, res: Response, _next: NextFunction) => {
    if (err instanceof mongoose.Error.ValidationError) {
      res.status(400).json({
        message: "Validation failed",
        errors: Object.values(err.errors).map((e) => e.message),
      });
      return;
    }

    if (err instanceof mongoose.Error.CastError) {
      res.status(400).json({
        message: `"${err.value}" is not a valid id`,
      });
      return;
    }

    console.error(err);
    res.status(500).json({ message: "Something went wrong" });
  },
);

export default app;
