"use server";

import { account, client } from "@/lib/appwrite/config";
import { ID } from "appwrite";
import { cookies } from "next/headers";

export async function getLoggedInUser() {
  try {
    const cookieStore = await cookies(); // MUST HAVE AWAIT
    const session = cookieStore.get("appwrite-session");

    if (!session || !session.value) return null;

    client.setSession(session.value); 
    
    const user = await account.get();
    return JSON.parse(JSON.stringify(user));
  } catch (error) {
    return null;
  }
}

export async function signUpUser(email: string, password: string, name: string) {
  try {
    const newAccount = await account.create(
      ID.unique(), 
      email, 
      password, 
      name
    );

    const session = await account.createEmailPasswordSession(email, password);

    // Manually set the cookie for the session
    const cookieStore = await cookies();
    cookieStore.set("appwrite-session", session.secret, {
      path: "/",
      httpOnly: true,
      sameSite: "strict",
      secure: true,
    });

    return JSON.parse(JSON.stringify({ success: true, account: newAccount }));
    
  } catch (error: any) {
    console.error("Sign Up Error:", error);
    return JSON.parse(JSON.stringify({ success: false, error: error.message }));
  }
}

export async function signInUser(email: string, password: string) {
  try {
    const session = await account.createEmailPasswordSession(email, password);
    
    // NEXT.JS 15 FIX: Manually set the cookie so Server Components can read it
    const cookieStore = await cookies();
    cookieStore.set("appwrite-session", session.secret, {
      path: "/",
      httpOnly: true,
      sameSite: "strict",
      secure: true,
    });

    return JSON.parse(JSON.stringify({ success: true, session }));
    
  } catch (error: any) {
    console.error("Sign In Error:", error);
    return JSON.parse(JSON.stringify({ success: false, error: error.message }));
  }
}

export async function logoutUser() {
  try {
    const cookieStore = await cookies();
    cookieStore.delete("appwrite-session");
    await account.deleteSession("current");
    return { success: true };
  } catch (error) {
    return { success: false };
  }
}