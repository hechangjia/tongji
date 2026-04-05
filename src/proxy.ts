import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  buildLoginRedirect,
  canAccessAdmin,
  canAccessLeader,
  canAccessMemberArea,
  getDefaultRedirectPath,
  isAdminPath,
  isLeaderPath,
  isMemberPath,
  isProtectedPath,
} from "@/lib/permissions";

export const proxy = auth((request) => {
  const pathname = request.nextUrl.pathname;
  const user = request.auth?.user ?? null;

  if (pathname === "/login" && user?.role) {
    return NextResponse.redirect(
      new URL(getDefaultRedirectPath(user.role), request.url),
    );
  }

  if (!isProtectedPath(pathname)) {
    return NextResponse.next();
  }

  if (!user) {
    const callbackUrl = `${pathname}${request.nextUrl.search}`;
    return NextResponse.redirect(
      new URL(buildLoginRedirect(callbackUrl), request.url),
    );
  }

  // Block deactivated users — force them back to login
  if (user.status !== "ACTIVE") {
    const response = NextResponse.redirect(
      new URL("/login", request.url),
    );
    // Clear the session cookie so they can't keep retrying
    response.cookies.delete("authjs.session-token");
    response.cookies.delete("__Secure-authjs.session-token");
    return response;
  }

  if (isAdminPath(pathname) && !canAccessAdmin(user)) {
    return NextResponse.redirect(
      new URL(getDefaultRedirectPath(user.role), request.url),
    );
  }

  if (isLeaderPath(pathname) && !canAccessLeader(user)) {
    return NextResponse.redirect(
      new URL(getDefaultRedirectPath(user.role), request.url),
    );
  }

  if (isMemberPath(pathname) && !canAccessMemberArea(user)) {
    return NextResponse.redirect(
      new URL(getDefaultRedirectPath(user.role), request.url),
    );
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/login",
    "/entry",
    "/entry/:path*",
    "/records",
    "/records/:path*",
    "/leader",
    "/leader/:path*",
    "/admin",
    "/admin/:path*",
    "/leaderboard",
    "/leaderboard/:path*",
  ],
};
