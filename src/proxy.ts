import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  buildLoginRedirect,
  canAccessAdmin,
  getDefaultRedirectPath,
  isAdminPath,
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

  if (isAdminPath(pathname) && !canAccessAdmin(user)) {
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
    "/admin",
    "/admin/:path*",
  ],
};
