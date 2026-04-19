"use server";

import { cookies } from "next/headers";
import { Client, Account, Databases, ID } from "node-appwrite";

function createServerClient() {
  return new Client()
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || "https://cloud.appwrite.io/v1")
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!);
}

// 1. SIGN UP LOGIC
export async function signUpUser(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const name = formData.get("name") as string;
  const rollNo = formData.get("rollNo") as string;

  try {
    const client = createServerClient();
    const account = new Account(client);

    const newAccount = await account.create(ID.unique(), email, password, name);
    const session = await account.createEmailPasswordSession(email, password);

    const sessionClient = createServerClient().setSession(session.secret);
    const sessionDatabases = new Databases(sessionClient);

    await sessionDatabases.createDocument(
      process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
      process.env.NEXT_PUBLIC_APPWRITE_PROFILES_ID!,
      newAccount.$id, 
      { fullName: name, email, rollNo, department: "Pending Assignment" }
    );

    return { userId: newAccount.$id, secret: session.secret };
  } catch (error: any) {
    console.error("Sign up failed:", error.message);
    return null;
  }
}

// 2. SIGN IN LOGIC
export async function signInUser(formData: FormData) {
  // 1. Extract and trim data
  const email = (formData.get("email") as string).trim();
  const password = formData.get("password") as string;

  try {
    const client = createServerClient();
    const account = new Account(client);
    
    // 2. Authenticate with Appwrite
    const session = await account.createEmailPasswordSession(email, password);
    
    // 3. CRITICAL: You MUST return this object so the frontend can see the secret
    return { 
      userId: session.userId, 
      secret: session.secret 
    };

  } catch (error: any) {
    console.error("Appwrite Login Error:", error.message);
    // Return null so the frontend knows the credentials were actually wrong
    return null; 
  }
}

// 3. GET LOGGED IN USER
export async function getLoggedInUser() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("appwrite-session");
    if (!sessionCookie || !sessionCookie.value) return null;

    const client = createServerClient().setSession(sessionCookie.value);
    const account = new Account(client);
    return await account.get();
  } catch (error) {
    return null;
  }
}