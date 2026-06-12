import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;

  const isProtectedRoute =
    path.startsWith("/dashboard") ||
    path.startsWith("/mentor-dashboard") ||
    path.startsWith("/admin-dashboard") ||
    path.startsWith("/onboarding");
  const isPublicRoute = path === "/sign-in" || path === "/sign-up" || path === "/";

  const allCookies = request.cookies.getAll();
  const hasSession = allCookies.some(
    (cookie) => cookie.name.startsWith("a-session-") || cookie.name === "appwrite-session"
  );

  if (isProtectedRoute && !hasSession) {
    return NextResponse.redirect(new URL("/sign-in", request.url));
  }

  if (isPublicRoute && hasSession) {
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.png$).*)",
  ],
};
