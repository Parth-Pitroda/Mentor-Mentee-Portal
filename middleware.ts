import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // 1. Define which routes require authentication
  const isProtectedRoute = path.startsWith("/dashboard") || path.startsWith("/admin-dashboard");
  const isPublicRoute = path === "/sign-in" || path === "/sign-up" || path === "/";

  // 2. Look for the Appwrite Session Cookie
  // Appwrite dynamically names its session cookie based on your Project ID
  // It always starts with 'a-session-' or exactly matches the custom cookie you set in your auth actions.
  const allCookies = request.cookies.getAll();
  const hasSession = allCookies.some(
    (cookie) => cookie.name.startsWith("a-session-") || cookie.name === "appwrite-session"
  );

  // 3. Security Rule A: If they try to access a protected route without a session, kick them to login
  if (isProtectedRoute && !hasSession) {
    return NextResponse.redirect(new URL("/sign-in", request.url));
  }

  // 4. Security Rule B: If they are already logged in and try to visit the sign-in page, push them away
  // (Note: We push them to a generic loading route or a default dashboard if we don't know their specific ID here)
  if (isPublicRoute && hasSession) {
    // In a real app, you might decode a JWT here to find their exact /dashboard/[id]
    // But simply redirecting them to a verification or home route works perfectly.
    // For now, we will just let them pass if they are on "/", but you can customize this!
  }

  // 5. If everything looks good, let them through
  return NextResponse.next();
}

// 6. Tell Next.js EXACTLY which routes this middleware should run on.
// We exclude static files, images, and API routes to keep your app lightning fast.
export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.png$).*)",
  ],
};