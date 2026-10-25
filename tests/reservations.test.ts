import jwt from "jsonwebtoken";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../src/config/database", () => ({
  connectDatabase: vi.fn().mockResolvedValue(undefined),
}));

import app from "../src/app";

function tokenFor(userId: string): string {
  return jwt.sign({ userId }, process.env.JWT_SECRET!);
}

describe("POST /api/reservations authentication", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when no token is supplied", async () => {
    const response = await request(app).post("/api/reservations").send({});

    expect(response.status).toBe(401);
    expect(response.body.message).toContain("No token");
  });

  it("lets a valid token reach reservation validation", async () => {
    const response = await request(app)
      .post("/api/reservations")
      .set("Authorization", `Bearer ${tokenFor("test-user")}`)
      .send({ quantity: 0, purpose: "invalid" });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("Choose between 1 and 3 copies.");
  });
});
