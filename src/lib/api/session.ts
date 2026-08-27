import { cookies } from "next/headers";

import type { SessionResponse } from "./types";

/**
 * The session cookie.
 *
 * <p>The bearer token lives in an **httpOnly** cookie, never in `localStorage`. A token in
 * `localStorage` is readable by any script that ends up on the page — one XSS and the attacker has
 * a 30-day session. httpOnly means JavaScript cannot read it at all; it is attached by the browser
 * and read only on the server.
 *
 * The consequence, which shapes the rest of this integration: **the browser never holds the
 * token**, so every backend call has to originate on the server (Server Component, Server Action,
 * or Route Handler). That is why there is no client-side `fetch` to :8080 anywhere in this app.
 */
const TOKEN_COOKIE = "myfinance_token";

/** A small, non-sensitive copy of who is signed in, so the shell can render without a round trip. */
const PROFILE_COOKIE = "myfinance_profile";

export type SessionProfile = {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  initials: string;
  baseCurrency: string;
};

export async function getToken(): Promise<string | undefined> {
  const store = await cookies();
  return store.get(TOKEN_COOKIE)?.value;
}

export async function getProfile(): Promise<SessionProfile | undefined> {
  const store = await cookies();
  const raw = store.get(PROFILE_COOKIE)?.value;
  if (!raw) {
    return undefined;
  }
  try {
    return JSON.parse(raw) as SessionProfile;
  } catch {
    // A malformed cookie is not worth a crash — treat it as signed out.
    return undefined;
  }
}

/** Called from the login / register Server Actions. */
export async function startSession(session: SessionResponse): Promise<void> {
  const store = await cookies();

  // Mirror the backend's own expiry so the cookie and the server-side session row die together.
  // Otherwise the cookie outlives the session and every request 401s with the user still "signed in".
  const expires = new Date(session.expiresAt);

  store.set(TOKEN_COOKIE, session.token, {
    httpOnly: true,
    sameSite: "lax",
    // Lax rather than Strict: Strict would drop the cookie on a top-level navigation from an
    // external link, so following a link into the app would look like a logout.
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires,
  });

  const profile: SessionProfile = {
    userId: session.userId,
    email: session.email,
    firstName: session.firstName,
    lastName: session.lastName,
    initials: session.initials,
    baseCurrency: session.baseCurrency,
  };

  // Readable by the client on purpose: it is only a display name and initials. The token is not
  // in here, so nothing sensitive is exposed by dropping httpOnly.
  store.set(PROFILE_COOKIE, JSON.stringify(profile), {
    httpOnly: false,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires,
  });
}

export async function endSession(): Promise<void> {
  const store = await cookies();
  store.delete(TOKEN_COOKIE);
  store.delete(PROFILE_COOKIE);
}

export const SESSION_COOKIE_NAMES = {
  token: TOKEN_COOKIE,
  profile: PROFILE_COOKIE,
} as const;
