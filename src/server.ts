import "dotenv/config";
import app from "./app";

const port = Number(process.env.PORT || 4000);

if (process.env.VERCEL !== "1") {
  app.listen(port, () => {
    console.log(`API listening on http://localhost:${port}`);
  });
}

export default app;
