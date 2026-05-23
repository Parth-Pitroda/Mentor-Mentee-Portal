"use server";

import { cookies } from "next/headers";
import { Client, Account, Databases, ID, Query } from "node-appwrite";
import { redirect } from "next/navigation";

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
// SIGN UP LOGIC (UPGRADED WITH REDIRECT)
// ==========================================
export async function signUpUser(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  // Fallback to grab either 'name' or 'fullName' depending on which form is used
  const name = (formData.get("name") as string) || (formData.get("fullName") as string); 
  const rollNo = formData.get("rollNo") as string;

  let assignedRole = "mentee"; // Default assumption

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
    assignedRole = hasNumbers ? "mentee" : "mentor";

    await sessionDatabases.createDocument(
      process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
      process.env.NEXT_PUBLIC_APPWRITE_PROFILES_ID!,
      newAccount.$id, 
      { 
        fullName: name, 
        email: emailLower, 
        rollNo: rollNo || null, 
        department: "Unassigned", // Start unassigned until they finish onboarding
        role: assignedRole, 
        isVerified: false 
      }
    );

    // 🍪 SET THE COOKIE SO NEXT.JS KNOWS THEY ARE LOGGED IN
    const cookieStore = await cookies();
    cookieStore.set("appwrite-session", session.secret, {
      path: "/",
      httpOnly: true,
      sameSite: "strict",
      secure: true,
    });

  } catch (error: any) {
    console.error("Sign up failed:", error.message);
    return { error: error.message };
  }

  // 🚀 THE MAGIC REDIRECT (Must be outside the try/catch block!)
  if (assignedRole === "mentee") {
    redirect("/onboarding");
  } else {
    // If a faculty member signs up, send them straight to their dashboard
    redirect("/mentor-dashboard"); 
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

    // SET COOKIE ON LOGIN TOO
    const cookieStore = await cookies();
    cookieStore.set("appwrite-session", session.secret, {
      path: "/",
      httpOnly: true,
      sameSite: "strict",
      secure: true,
    });

    return { 
      userId: actualProfileId,
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