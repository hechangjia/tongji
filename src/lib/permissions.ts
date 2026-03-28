import type { Session } from "next-auth";

export type SessionRole = "ADMIN" | "LEADER" | "MEMBER";

type SessionLike = {
  role: SessionRole;
} | null;

export function canAccessAdmin(session: SessionLike) {
  return session?.role === "ADMIN";
}

export function canAccessLeader(session: SessionLike) {
  return session?.role === "ADMIN" || session?.role === "LEADER";
}

export function canAccessMemberArea(session: SessionLike) {
  return session?.role === "ADMIN" || session?.role === "MEMBER";
}

export function getDefaultRedirectPath(role: SessionRole) {
  if (role === "ADMIN") {
    return "/admin";
  }

  if (role === "LEADER") {
    return "/leader/group";
  }

  return "/entry";
}

export function sanitizeCallbackUrl(callbackUrl?: string | null) {
  if (!callbackUrl || !callbackUrl.startsWith("/") || callbackUrl.startsWith("//")) {
    return "/";
  }

  return callbackUrl;
}

export function buildLoginRedirect(callbackUrl: string) {
  const params = new URLSearchParams({
    callbackUrl: sanitizeCallbackUrl(callbackUrl),
  });

  return `/login?${params.toString()}`;
}

export function isAdminPath(pathname: string) {
  return pathname === "/admin" || pathname.startsWith("/admin/");
}

export function isMemberPath(pathname: string) {
  return (
    pathname === "/entry" ||
    pathname.startsWith("/entry/") ||
    pathname === "/records" ||
    pathname.startsWith("/records/")
  );
}

export function isLeaderPath(pathname: string) {
  return pathname === "/leader" || pathname.startsWith("/leader/");
}

export function isProtectedPath(pathname: string) {
  return isAdminPath(pathname) || isLeaderPath(pathname) || isMemberPath(pathname);
}

export function getSessionUser(session: Session | null) {
  return session?.user ?? null;
}
