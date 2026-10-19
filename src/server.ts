import "dotenv/config";
import app from "./app";
import { connectDatabase } from "./config/database";

const port = Number(process.env.PORT || 4000);

async function startServer(): Promise<void> {
  try {
    await connectDatabase();

    app.listen(port, () => {
      console.log(`API listening on http://localhost:${port}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

void startServer();
