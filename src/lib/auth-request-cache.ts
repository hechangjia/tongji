import { cache } from "react";
import { auth } from "@/lib/auth";
import { hasAuthSessionCookie } from "@/lib/auth-session-cookie";

const readCachedSession = cache(async () => auth());

export function getCachedSession() {
  return readCachedSession();
}

export async function getCachedSessionIfCookiePresent() {
  const hasSessionCookie = await hasAuthSessionCookie();

  return hasSessionCookie ? readCachedSession() : null;
}
