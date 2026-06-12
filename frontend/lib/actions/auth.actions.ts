"use server";

import { cookies } from "next/headers";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api";

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unexpected authentication error";
}

async function readApiResponse(response: Response) {
  const text = await response.text();
  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {
    return { error: text };
  }
}

function getApiError(data: unknown, fallback: string) {
  if (data && typeof data === "object") {
    const errorData = data as { error?: unknown; message?: unknown };
    if (typeof errorData.error === "string") return errorData.error;
    if (typeof errorData.message === "string") return errorData.message;
  }

  return fallback;
}

export async function signUpUser(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const name = (formData.get("name") as string) || (formData.get("fullName") as string);
  const rollNo = formData.get("rollNo") as string;

  try {
    const response = await fetch(`${API_URL}/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, name, rollNo }),
    });

    const result = await readApiResponse(response);

    if (!response.ok) {
      return {
        error: getApiError(result, `Sign up failed (${response.status} ${response.statusText})`),
      };
    }

    // Handle the session cookie
    const setCookieHeader = response.headers.get("set-cookie");
    if (setCookieHeader) {
      const cookieStore = await cookies();
      // Extract the secret from the cookie header if the backend sends it as a cookie
      // Usually, the backend handles this by sending a Set-Cookie header.
      // In Server Actions, we must manually set it in the Next.js store.
      const match = setCookieHeader.match(/appwrite-session=([^;]+)/);
      if (match) {
        cookieStore.set("appwrite-session", match[1], {
          path: "/",
          httpOnly: true,
          sameSite: "strict",
          secure: process.env.NODE_ENV === "production",
          maxAge: 60 * 60 * 24 * 7,
        });
      }
    }

    return {
      success: true,
      userId: result?.userId,
      role: result?.role,
      error: null,
    };
  } catch (error: unknown) {
    const message = getErrorMessage(error);
    console.error("Sign up failed:", message);
    return { error: message };
  }
}

export async function signInUser(formData: FormData) {
  const email = (formData.get("email") as string).trim();
  const password = formData.get("password") as string;

  try {
    const response = await fetch(`${API_URL}/auth/signin`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const result = await readApiResponse(response);

    if (!response.ok) {
      return {
        userId: null,
        role: null,
        error: getApiError(result, `Login failed (${response.status} ${response.statusText})`),
      };
    }

    const setCookieHeader = response.headers.get("set-cookie");
    if (setCookieHeader) {
      const cookieStore = await cookies();
      const match = setCookieHeader.match(/appwrite-session=([^;]+)/);
      if (match) {
        cookieStore.set("appwrite-session", match[1], {
          path: "/",
          httpOnly: true,
          sameSite: "strict",
          secure: process.env.NODE_ENV === "production",
          maxAge: 60 * 60 * 24 * 7,
        });
      }
    }

    return {
      userId: result?.userId,
      role: result?.role,
      error: null
    };

  } catch (error: unknown) {
    const message = getErrorMessage(error);
    console.error("Login Error:", message);
    return { userId: null, role: null, error: message };
  }
}

export async function getLoggedInUser() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("appwrite-session");
    if (!sessionCookie || !sessionCookie.value) return null;

    const response = await fetch(`${API_URL}/auth/me`, {
      headers: {
        "Cookie": `appwrite-session=${sessionCookie.value}`
      },
    });

    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
}

export async function logoutUser() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("appwrite-session");
    if (!sessionCookie || !sessionCookie.value) return;

    const response = await fetch(`${API_URL}/auth/logout`, {
      method: "POST",
      headers: {
        "Cookie": `appwrite-session=${sessionCookie.value}`
      },
    });

    if (response.ok) {
      cookieStore.delete("appwrite-session");
    }
  } catch (error) {
    console.error("Logout failed:", error);
  }
}
