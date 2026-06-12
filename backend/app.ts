import { Client, Account, Databases, Storage, Users } from "node-appwrite";
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
const endpoint =
  process.env.APPWRITE_ENDPOINT ||
  process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT ||
  "https://cloud.appwrite.io/v1";

const projectId =
  process.env.APPWRITE_PROJECT_ID ||
  process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!;
const apiKey =
  process.env.APPWRITE_API_KEY ||
  process.env.NEXT_APPWRITE_KEY!;

/**
 * Admin Client
 * Uses API Key
 * Can create users, query databases, etc.
 */
export const createAdminClient = () => {
  return new Client()
    .setEndpoint(endpoint)
    .setProject(projectId)
    .setKey(apiKey);
};

/**
 * Session Client
 * Uses user session secret
 * Acts as logged-in user
 */
export const createSessionClient = (sessionSecret: string) => {
  return new Client()
    .setEndpoint(endpoint)
    .setProject(projectId)
    .setSession(sessionSecret);
};

/**
 * Helper Factories
 */
export const getAdminAccount = () => {
  return new Account(createAdminClient());
};

export const getAdminDatabase = () => {
  return new Databases(createAdminClient());
};

export const getAdminStorage = () => {
  return new Storage(createAdminClient());
};

export const getAdminUsers = () => {
  return new Users(createAdminClient());
};

export const getSessionAccount = (
  sessionSecret: string
) => {
  return new Account(
    createSessionClient(sessionSecret)
  );
};

export const getSessionDatabase = (
  sessionSecret: string
) => {
  return new Databases(
    createSessionClient(sessionSecret)
  );
};
