import { setServers } from "node:dns";
import mongoose from "mongoose";

// The promise, kept. Not the connection -- the promise of one. The
// first caller starts the connect; every caller after it gets this
// same promise back and waits on the connection already being made.
let connection: Promise<typeof mongoose> | null = null;

export async function connectDatabase(): Promise<void> {
  const dnsServers = process.env.MONGODB_DNS_SERVERS
    ?.split(",")
    .map((server) => server.trim())
    .filter(Boolean);
  if (dnsServers?.length) {
    setServers(dnsServers);
  }

  const uri = process.env.MONGODB_URI;

  // Fail here, with a sentence, rather than three screens later with a
  // connection timeout that does not mention .env at all.
  if (!uri) {
    throw new Error(
      "MONGODB_URI is missing. Copy .env.example to .env and fill it in.",
    );
  }

  if (connection === null) {
    connection = mongoose
      .connect(uri, { serverSelectionTimeoutMS: 5000 })
      .then((m) => {
        console.log("MongoDB connected");
        return m;
      })
      .catch((err: unknown) => {
        connection = null;
        throw err;
      });
  }

  await connection;
}
