"use server";

import { cookies } from "next/headers";
import { Client, Account, Databases, ID, Query } from "node-appwrite";

// 1. ADMIN CLIENT: Used to bypass restrictions and generate session secrets
function createAdminClient() {
  return new Client()
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || "https://cloud.appwrite.io/v1")
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!)
    .setKey(process.env.NEXT_APPWRITE_KEY!); // HAS API KEY
}

// 2. SESSION CLIENT: Used to act on behalf of the logged-in user
function createSessionClient(sessionSecret: string) {
  return new Client()
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || "https://cloud.appwrite.io/v1")
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!)
    .setSession(sessionSecret); // NO API KEY!
}

// ==========================================
// SIGN UP LOGIC (UPGRADED WITH DYNAMIC ROLES)
// ==========================================
export async function signUpUser(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const name = formData.get("name") as string;
  const rollNo = formData.get("rollNo") as string;

  try {
    const adminClient = createAdminClient();
    const account = new Account(adminClient);

    const newAccount = await account.create(ID.unique(), email, password, name);
    const session = await account.createEmailPasswordSession(email, password);

    const sessionClient = createSessionClient(session.secret);
    const sessionDatabases = new Databases(sessionClient);

    // 🧠 THE DYNAMIC ROLE ASSIGNMENT BRAIN
    const emailLower = email.toLowerCase().trim();
    const emailPrefix = emailLower.split('@')[0];
    
    // Regex test: Does the prefix contain ANY number? (\d means digit)
    const hasNumbers = /\d/.test(emailPrefix);
    
    // If it has a number (like 24bcp413d), they are a mentee. Otherwise, a mentor.
    const assignedRole = hasNumbers ? "mentee" : "mentor";

    await sessionDatabases.createDocument(
      process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
      process.env.NEXT_PUBLIC_APPWRITE_PROFILES_ID!,
      newAccount.$id, 
      { 
        fullName: name, 
        email: emailLower, 
        rollNo: rollNo || null, 
        department: "Pending Assignment",
        role: assignedRole, // 👈 dynamically assigned here!
        isVerified: false 
      }
    );

    return { userId: newAccount.$id, secret: session.secret };
  } catch (error: any) {
    console.error("Sign up failed:", error.message);
    return null;
  }
}

// ==========================================
// SIGN IN LOGIC
// ==========================================
export async function signInUser(formData: FormData) {
  const email = (formData.get("email") as string).trim();
  const password = formData.get("password") as string;

  try {
    const adminClient = createAdminClient(); 
    const account = new Account(adminClient);
    
    // 1. Authenticate to get the session secret
    const session = await account.createEmailPasswordSession(email, password);
    
    let userRole = "mentee";
    let actualProfileId = session.userId; // Fallback

    try {
      const sessionClient = createSessionClient(session.secret);
      const sessionDatabases = new Databases(sessionClient);
      
      // 2. MAGIC FIX: Query the profiles collection by EMAIL to find the true Profile ID
      const profilesList = await sessionDatabases.listDocuments(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
        process.env.NEXT_PUBLIC_APPWRITE_PROFILES_ID!,
        [Query.equal("email", [email.toLowerCase()])]
      );
      
      if (profilesList.total > 0) {
        userRole = profilesList.documents[0].role || "mentee";
        actualProfileId = profilesList.documents[0].$id; // Overwrite with the true Database ID!
      }
    } catch (err: any) {
      console.error("🚨 Profile lookup failed:", err.message);
    }

    return { 
      userId: actualProfileId, // <-- Now we route the user to their true Profile ID
      secret: session.secret,
      role: userRole, 
      error: null 
    };

  } catch (error: any) {
    console.error("Appwrite Login Error:", error.message);
    return { userId: null, secret: null, role: null, error: error.message };
  }
}

// ==========================================
// GET LOGGED IN USER
// ==========================================
export async function getLoggedInUser() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("appwrite-session");
    if (!sessionCookie || !sessionCookie.value) return null;

    // Use Session Client to fetch user data! No API Key allowed here.
    const sessionClient = createSessionClient(sessionCookie.value);
    const account = new Account(sessionClient);
    return await account.get();
  } catch (error) {
    return null;
  }
}

// ==========================================
// LOGOUT LOGIC
// ==========================================
export async function logoutUser() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("appwrite-session");
    if (!sessionCookie || !sessionCookie.value) return;

    const sessionClient = createSessionClient(sessionCookie.value);
    const account = new Account(sessionClient);
    await account.deleteSession("current");
    
    cookieStore.delete("appwrite-session");
  } catch (error) {
    console.error("Logout failed:", error);
  }
}