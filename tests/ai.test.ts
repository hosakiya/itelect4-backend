import express from "express";
import jwt from "jsonwebtoken";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { aiRouter } from "../src/routes/ai";
import { aiRequestSchema } from "../src/schemas/review";

const app = express();
app.use(express.json());
app.use("/api/ai", aiRouter);

function tokenFor(userId: string): string {
  return jwt.sign({ userId }, process.env.JWT_SECRET!);
}

describe("AI review request", () => {
  it("requires authentication", async () => {
    const response = await request(app)
      .post("/api/ai")
      .send({ prompt: "A sufficiently long project description." });

    expect(response.status).toBe(401);
    expect(response.body.message).toContain("No token");
  });

  it("rejects invalid prompts before calling Gemini", async () => {
    const response = await request(app)
      .post("/api/ai")
      .set("Authorization", `Bearer ${tokenFor("validation-user")}`)
      .send({ prompt: "too short" });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("Validation failed");
    expect(response.body.errors).toContain(
      "Describe your project or reading inquiry in at least 20 characters.",
    );
  });

  it("trims prompts and enforces the documented length boundaries", () => {
    expect(aiRequestSchema.safeParse({ prompt: `  ${"x".repeat(20)}  ` }).success)
      .toBe(true);
    expect(aiRequestSchema.safeParse({ prompt: "x".repeat(19) }).success)
      .toBe(false);
    expect(aiRequestSchema.safeParse({ prompt: "x".repeat(2001) }).success)
      .toBe(false);
  });

  it("limits each authenticated account to five requests per minute", async () => {
    const token = tokenFor(`rate-limit-${Date.now()}`);
    const statuses: number[] = [];

    for (let index = 0; index < 6; index += 1) {
      const response = await request(app)
        .post("/api/ai")
        .set("Authorization", `Bearer ${token}`)
        .send({ prompt: "too short" });
      statuses.push(response.status);
    }

    expect(statuses).toEqual([400, 400, 400, 400, 400, 429]);
  });
});
