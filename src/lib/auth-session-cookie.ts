import { cookies } from "next/headers";

const AUTH_SESSION_COOKIE_NAMES = [
  "authjs.session-token",
  "__Secure-authjs.session-token",
] as const;

const AUTH_SESSION_COOKIE_PREFIXES = AUTH_SESSION_COOKIE_NAMES.map(
  (name) => `${name}.`,
);

export async function hasAuthSessionCookie() {
  const cookieStore = await cookies();

  if (AUTH_SESSION_COOKIE_NAMES.some((name) => cookieStore.has(name))) {
    return true;
  }

  const allCookies =
    typeof cookieStore.getAll === "function" ? cookieStore.getAll() : [];

  return allCookies.some(({ name }) =>
    AUTH_SESSION_COOKIE_PREFIXES.some((prefix) => name.startsWith(prefix)),
  );
}
