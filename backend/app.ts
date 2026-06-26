import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import testRoutes from "./src/routes/test.routes";
import authRoutes from "./src/routes/auth.routes";
import studentRoutes from "./src/routes/student.routes";
import meetingRoutes from "./src/routes/meeting.routes";
import adminRoutes from "./src/routes/admin.routes";
import profileRoutes from "./src/routes/profile.routes";
import portalRoutes from "./src/routes/portal.routes";
import storageRoutes from "./src/routes/storage.routes";

const app = express();

app.use(cors({
  origin: process.env.FRONTEND_ORIGIN || "http://localhost:3000",
  credentials: true,
}));
app.use(express.json({ limit: "15mb" }));
app.use(cookieParser());

app.use("/api/test", testRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/student", studentRoutes);
app.use("/api/meetings", meetingRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/profiles", profileRoutes);
app.use("/api/portal", portalRoutes);
app.use("/api/storage", storageRoutes);

export default app;
export {
  APPWRITE_API_KEY,
  APPWRITE_ENDPOINT,
  APPWRITE_PROJECT_ID,
  createAdminClient,
  createSessionClient,
  getAdminAccount,
  getAdminDatabase,
  getAdminStorage,
  getAdminUsers,
  getSessionAccount,
  getSessionDatabase,
} from "./src/config/appwrite";
