import mongoose from "mongoose";

export async function connectDB(): Promise<boolean> {
  const uri = process.env.MONGODB_URI;
  const isProduction = process.env.NODE_ENV === "production";

  if (!uri) {
    const message =
      "MONGODB_URI is missing. Copy .env.example to .env and fill it in.";

    if (isProduction) {
      throw new Error(message);
    }

    console.warn(`${message} Starting without MongoDB in development mode.`);
    return false;
  }

  try {
    // Without this option, a wrong or unreachable connection string does
    // not fail -- it sits there for 31 seconds looking like a hung
    // terminal, and then errors. Five seconds is long enough for a real
    // Atlas connection and short enough to tell you something is wrong.
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
    console.log("MongoDB connected:", mongoose.connection.name);
    return true;
  } catch (error) {
    if (isProduction) {
      throw error;
    }

    console.warn(
      "MongoDB unavailable; continuing in development mode. Set MONGODB_URI to enable database-backed routes.",
    );
    console.warn(error);
    return false;
  }
}
