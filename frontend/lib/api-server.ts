import { cookies } from "next/headers";

const API_URL = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api";

async function serverRequest<T = unknown>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("appwrite-session");

  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");

  if (sessionCookie) {
    headers.append("Cookie", `appwrite-session=${sessionCookie.value}`);
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Unknown server error' }));
    throw new Error(error.message || error.error || 'Server request failed');
  }

  return response.json();
}

export const serverApi = {
  get: <T = unknown>(url: string) => serverRequest<T>(url, { method: 'GET' }),
  post: <T = unknown>(url: string, body: unknown) => serverRequest<T>(url, { method: 'POST', body: JSON.stringify(body) }),
  put: <T = unknown>(url: string, body: unknown) => serverRequest<T>(url, { method: 'PUT', body: JSON.stringify(body) }),
  patch: <T = unknown>(url: string, body: unknown) => serverRequest<T>(url, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: <T = unknown>(url: string) => serverRequest<T>(url, { method: 'DELETE' }),
};
