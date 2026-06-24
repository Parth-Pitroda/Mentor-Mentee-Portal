import dotenv from "dotenv";
import path from "path";

// Load .env from current working directory first, then fall back to repository root
dotenv.config();
dotenv.config({ path: path.resolve(__dirname, "..", ".env") });

import app from "./app";

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});