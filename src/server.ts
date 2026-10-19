import "dotenv/config";
import { app } from "./app";
import { connectDB } from "./config/db";

const PORT = Number(process.env.PORT) || 4000;

// Still started here, and started immediately, so a wrong MONGODB_URI
// is a message in this terminal within five seconds instead of a
// failed request later. connectDB hands out one connection however
// many times it is called, so this is the same one the middleware
// waits for.
connectDB().catch((err: unknown) => {
  // Logged, not exited. On Vercel this file may be the entry point,
  // and killing the process there takes down an instance that was
  // about to answer requests. The failed request says what happened.
  console.error("Could not connect to MongoDB:", err);
});

app.listen(PORT, () => console.log(`API on http://localhost:${PORT}`));
